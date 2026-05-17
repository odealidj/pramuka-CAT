package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type examService struct {
	repo ports.ExamRepository
}

func NewExamService(repo ports.ExamRepository) ports.ExamService {
	return &examService{repo: repo}
}

func (s *examService) ListUpcomingEvents(ctx context.Context) ([]domain.UpcomingEvent, error) {
	return s.repo.ListUpcomingEvents(ctx)
}

func (s *examService) ListMyExams(ctx context.Context, userID uuid.UUID) ([]domain.UserApproval, error) {
	return s.repo.ListUserApprovals(ctx, userID)
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

	return s.repo.ListEventQuestionsForParticipant(ctx, eventID)
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

	correctAnswer, err := s.repo.GetQuestionCorrectAnswer(ctx, req.QuestionID)
	if err != nil {
		return fmt.Errorf("soal tidak ditemukan")
	}

	isCorrect := (req.SelectedAnswer == correctAnswer)
	
	return s.repo.SaveUserAnswer(ctx, approval.ApprovalID, req.QuestionID, req.SelectedAnswer, isCorrect)
}

func (s *examService) FinishExam(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) (domain.FinishExamResponse, error) {
	approval, err := s.repo.GetApprovalStatus(ctx, userID, eventID)
	if err != nil {
		return domain.FinishExamResponse{}, fmt.Errorf("anda belum terdaftar di event ini")
	}
	if approval.IsCompleted {
		return domain.FinishExamResponse{}, fmt.Errorf("ujian ini sudah diselesaikan")
	}
	
	score, err := s.repo.CalculateScore(ctx, approval.ApprovalID)
	if err != nil {
		score = 0
	}
	
	isPassed := score >= approval.PassingGrade
	
	err = s.repo.FinishExam(ctx, approval.ApprovalID, score, isPassed)
	if err != nil {
		return domain.FinishExamResponse{}, err
	}
	
	return domain.FinishExamResponse{
		Message:  "Ujian berhasil diselesaikan",
		Score:    score,
		IsPassed: isPassed,
	}, nil
}
