package services

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/internal/worker"
)

type examService struct {
	repo  ports.ExamRepository
	cache ports.ExamCache
	task  worker.TaskDistributor
}

func NewExamService(repo ports.ExamRepository, cache ports.ExamCache, task worker.TaskDistributor) ports.ExamService {
	return &examService{repo: repo, cache: cache, task: task}
}

func (s *examService) ListUpcomingEvents(ctx context.Context, page int32, limit int32) ([]domain.UpcomingEvent, int64, error) {
	return s.repo.ListUpcomingEvents(ctx, page, limit)
}

func (s *examService) ListMyExams(ctx context.Context, userID uuid.UUID, page int32, limit int32) ([]domain.UserApproval, int64, error) {
	return s.repo.ListUserApprovals(ctx, userID, page, limit)
}

func (s *examService) Enroll(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) error {
	_, err := s.repo.GetApprovalStatus(ctx, userID, eventID)
	if err == nil {
		return fmt.Errorf("anda sudah terdaftar di event ini")
	}
	return s.repo.EnrollToEvent(ctx, userID, eventID)
}

func (s *examService) StartExam(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) ([]domain.ParticipantQuestion, error) {
	approval, err := s.repo.GetApprovalStatus(ctx, userID, eventID)
	if err != nil {
		return nil, fmt.Errorf("anda belum terdaftar di event ini")
	}
	if approval.Status != "approved" {
		return nil, fmt.Errorf("pendaftaran anda belum disetujui oleh admin")
	}
	if approval.IsCompleted {
		return nil, fmt.Errorf("anda sudah menyelesaikan ujian ini")
	}

	now := time.Now()
	if now.Before(approval.StartTime) {
		return nil, fmt.Errorf("ujian belum dimulai")
	}
	if now.After(approval.EndTime) {
		return nil, fmt.Errorf("waktu ujian sudah berakhir")
	}

	// Auto-Resume: Cek apakah ada sesi ujian yang masih tersimpan di Redis
	exists, _ := s.cache.IsExamSessionExists(ctx, approval.ApprovalID)
	if exists {
		// Peserta sudah pernah memulai — kembalikan soal dari cache (auto-resume)
		cachedQuestions, err := s.cache.GetCachedExamSession(ctx, approval.ApprovalID)
		if err == nil && len(cachedQuestions) > 0 {
			return cachedQuestions, nil
		}
	}

	// Set started_at jika peserta baru pertama kali memulai (PRD §3.2.4)
	if approval.StartedAt == nil {
		if err := s.repo.SetStartedAt(ctx, approval.ApprovalID); err != nil {
			return nil, fmt.Errorf("gagal mencatat waktu mulai ujian: %w", err)
		}
	}

	// Tarik soal dari database
	questions, err := s.repo.ListEventQuestionsForParticipant(ctx, eventID)
	if err != nil {
		return nil, err
	}

	// Fisher-Yates Shuffle — PRD §3.2.4: urutan soal diacak untuk setiap peserta
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := len(questions) - 1; i > 0; i-- {
		j := rng.Intn(i + 1)
		questions[i], questions[j] = questions[j], questions[i]
	}

	// Cache soal ke Redis dengan TTL = durasi event
	if err := s.cache.CacheExamSession(ctx, approval.ApprovalID, questions, int(approval.DurationMinutes)); err != nil {
		// Jika Redis gagal, tetap lanjutkan (graceful degradation)
		fmt.Printf("Peringatan: gagal cache sesi ujian ke Redis: %v\n", err)
	}

	return questions, nil
}

func (s *examService) SubmitAnswer(ctx context.Context, userID uuid.UUID, eventID uuid.UUID, req domain.SubmitAnswerRequest) error {
	approval, err := s.repo.GetApprovalStatus(ctx, userID, eventID)
	if err != nil {
		return fmt.Errorf("anda belum terdaftar di event ini")
	}
	if approval.Status != "approved" || approval.IsCompleted {
		return fmt.Errorf("ujian tidak aktif atau sudah selesai")
	}

	now := time.Now()
	if now.After(approval.EndTime) {
		return fmt.Errorf("waktu ujian sudah berakhir")
	}

	// Simpan jawaban ke Redis secara real-time (PRD: tanpa hit database)
	return s.cache.SaveAnswer(ctx, approval.ApprovalID, req.QuestionID, req.SelectedAnswer)
}

func (s *examService) FinishExam(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) (domain.FinishExamResponse, error) {
	approval, err := s.repo.GetApprovalStatus(ctx, userID, eventID)
	if err != nil {
		return domain.FinishExamResponse{}, fmt.Errorf("anda belum terdaftar di event ini")
	}
	if approval.IsCompleted {
		return domain.FinishExamResponse{}, fmt.Errorf("ujian ini sudah diselesaikan")
	}

	// Kirim tugas ke Asynq Background Worker
	payload := &worker.PayloadFinishExam{
		ApprovalID:   approval.ApprovalID,
		UserID:       userID,
		EventID:      eventID,
		PassingGrade: approval.PassingGrade,
	}

	err = s.task.DistributeTaskFinishExam(ctx, payload)
	if err != nil {
		return domain.FinishExamResponse{}, fmt.Errorf("gagal mengantrekan proses penyelesaian ujian: %w", err)
	}

	return domain.FinishExamResponse{
		Message:  "Jawaban sedang diproses di latar belakang. Silakan tunggu beberapa saat.",
		Score:    0,     // Akan dihitung oleh worker
		IsPassed: false, // Akan dievaluasi oleh worker
	}, nil
}

func (s *examService) ReviewParticipantAnswers(ctx context.Context, approvalID uuid.UUID) ([]domain.UserAnswerDetail, error) {
	return s.repo.GetUserAnswersDetail(ctx, approvalID)
}

func (s *examService) ReviewParticipantAnswersByEvent(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) ([]domain.UserAnswerDetail, error) {
	approval, err := s.repo.GetApprovalStatus(ctx, userID, eventID)
	if err != nil {
		return nil, fmt.Errorf("peserta belum terdaftar pada ujian ini")
	}
	if !approval.IsCompleted {
		return nil, fmt.Errorf("ujian belum diselesaikan")
	}
	return s.repo.GetUserAnswersDetail(ctx, approval.ApprovalID)
}
