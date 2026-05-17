package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type questionService struct {
	repo ports.QuestionRepository
}

func NewQuestionService(repo ports.QuestionRepository) ports.QuestionService {
	return &questionService{repo: repo}
}

func (s *questionService) CreateQuestion(ctx context.Context, req domain.CreateQuestionRequest) (domain.Question, error) {
	// Validasi dasar, di luar validator lib
	if req.QuestionText == "" {
		return domain.Question{}, fmt.Errorf("teks pertanyaan tidak boleh kosong")
	}

	q := domain.Question{
		CategoryID:    req.CategoryID,
		QuestionText:  req.QuestionText,
		OptionA:       req.OptionA,
		OptionB:       req.OptionB,
		OptionC:       req.OptionC,
		OptionD:       req.OptionD,
		CorrectAnswer: req.CorrectAnswer,
		Weight:        req.Weight,
	}
	return s.repo.CreateQuestion(ctx, q)
}

func (s *questionService) GetQuestionById(ctx context.Context, id uuid.UUID) (domain.Question, error) {
	return s.repo.GetQuestionById(ctx, id)
}

func (s *questionService) ListQuestions(ctx context.Context, page int32, limit int32) ([]domain.Question, int64, error) {
	return s.repo.ListQuestions(ctx, page, limit)
}

func (s *questionService) UpdateQuestion(ctx context.Context, id uuid.UUID, req domain.UpdateQuestionRequest) (domain.Question, error) {
	// Pastikan pertanyaan ada
	_, err := s.repo.GetQuestionById(ctx, id)
	if err != nil {
		return domain.Question{}, fmt.Errorf("pertanyaan tidak ditemukan")
	}

	q := domain.Question{
		CategoryID:    req.CategoryID,
		QuestionText:  req.QuestionText,
		OptionA:       req.OptionA,
		OptionB:       req.OptionB,
		OptionC:       req.OptionC,
		OptionD:       req.OptionD,
		CorrectAnswer: req.CorrectAnswer,
		Weight:        req.Weight,
	}
	return s.repo.UpdateQuestion(ctx, id, q)
}

func (s *questionService) DeleteQuestion(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetQuestionById(ctx, id)
	if err != nil {
		return fmt.Errorf("pertanyaan tidak ditemukan")
	}
	return s.repo.DeleteQuestion(ctx, id)
}
