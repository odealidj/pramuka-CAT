package services

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type examService struct {
	repo  ports.ExamRepository
	cache ports.ExamCache
}

func NewExamService(repo ports.ExamRepository, cache ports.ExamCache) ports.ExamService {
	return &examService{repo: repo, cache: cache}
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

	// Tarik semua jawaban dari Redis
	answers, err := s.cache.GetAllAnswers(ctx, approval.ApprovalID)
	if err != nil {
		return domain.FinishExamResponse{}, fmt.Errorf("gagal mengambil jawaban dari cache: %w", err)
	}

	// Untuk setiap jawaban: cek kebenaran dan simpan ke PostgreSQL secara permanen
	for questionIDStr, selectedAnswer := range answers {
		questionID, err := uuid.Parse(questionIDStr)
		if err != nil {
			continue // skip invalid IDs
		}

		correctAnswer, err := s.repo.GetQuestionCorrectAnswer(ctx, questionID)
		if err != nil {
			continue // skip if question not found
		}

		isCorrect := (selectedAnswer == correctAnswer)
		_ = s.repo.SaveUserAnswer(ctx, approval.ApprovalID, questionID, selectedAnswer, isCorrect)
	}

	// Kalkulasi skor menggunakan rumus Auto-Bobot: (Skor Benar / Total Bobot) * 100
	score, err := s.repo.CalculateScore(ctx, approval.ApprovalID)
	if err != nil {
		score = 0
	}

	totalWeight, err := s.repo.GetEventTotalWeight(ctx, approval.EventID)
	if err == nil && totalWeight > 0 {
		score = (score / totalWeight) * 100
	}

	isPassed := score >= approval.PassingGrade

	err = s.repo.FinishExam(ctx, approval.ApprovalID, score, isPassed)
	if err != nil {
		return domain.FinishExamResponse{}, err
	}

	// Bersihkan cache Redis setelah ujian selesai
	_ = s.cache.ClearExamSession(ctx, approval.ApprovalID)

	return domain.FinishExamResponse{
		Message:  "Ujian berhasil diselesaikan",
		Score:    score,
		IsPassed: isPassed,
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
