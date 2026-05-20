package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

const defaultCategoryName = "Umum"

type questionService struct {
	repo         ports.QuestionRepository
	categoryRepo ports.CategoryRepository
}

func NewQuestionService(repo ports.QuestionRepository, categoryRepo ports.CategoryRepository) ports.QuestionService {
	return &questionService{repo: repo, categoryRepo: categoryRepo}
}

// getOrCreateDefaultCategory mencari kategori "Umum", jika tidak ada maka dibuat otomatis.
func (s *questionService) getOrCreateDefaultCategory(ctx context.Context) (int32, error) {
	cat, err := s.categoryRepo.GetCategoryByName(ctx, defaultCategoryName)
	if err == nil {
		return cat.ID, nil
	}
	// Tidak ditemukan — buat baru
	newCat, err := s.categoryRepo.CreateCategory(ctx, defaultCategoryName)
	if err != nil {
		return 0, fmt.Errorf("gagal membuat kategori default '%s': %w", defaultCategoryName, err)
	}
	return newCat.ID, nil
}

func (s *questionService) CreateQuestion(ctx context.Context, req domain.CreateQuestionRequest) (domain.Question, error) {
	// Validasi dasar, di luar validator lib
	if req.QuestionText == "" {
		return domain.Question{}, fmt.Errorf("teks pertanyaan tidak boleh kosong")
	}

	// Cek duplikasi teks pertanyaan
	isDuplicate, err := s.repo.CheckDuplicateQuestion(ctx, req.QuestionText, nil)
	if err != nil {
		return domain.Question{}, fmt.Errorf("gagal memvalidasi keunikan soal: %w", err)
	}
	if isDuplicate {
		return domain.Question{}, fmt.Errorf("soal dengan pertanyaan serupa sudah terdaftar")
	}

	// Jika kategori tidak dipilih, gunakan kategori "Umum" (buat jika belum ada)
	categoryID := req.CategoryID
	if categoryID == nil {
		id, err := s.getOrCreateDefaultCategory(ctx)
		if err != nil {
			return domain.Question{}, err
		}
		categoryID = &id
	}

	q := domain.Question{
		CategoryID:    categoryID,
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

func (s *questionService) ListQuestions(ctx context.Context, page int32, limit int32, search string, categoryId *int32) ([]domain.Question, int64, error) {
	return s.repo.ListQuestions(ctx, page, limit, search, categoryId)
}

func (s *questionService) UpdateQuestion(ctx context.Context, id uuid.UUID, req domain.UpdateQuestionRequest) (domain.Question, error) {
	// Pastikan pertanyaan ada
	_, err := s.repo.GetQuestionById(ctx, id)
	if err != nil {
		return domain.Question{}, fmt.Errorf("pertanyaan tidak ditemukan")
	}

	// Cek duplikasi teks pertanyaan (kecuali soal ini sendiri)
	isDuplicate, err := s.repo.CheckDuplicateQuestion(ctx, req.QuestionText, &id)
	if err != nil {
		return domain.Question{}, fmt.Errorf("gagal memvalidasi keunikan soal: %w", err)
	}
	if isDuplicate {
		return domain.Question{}, fmt.Errorf("soal dengan pertanyaan serupa sudah terdaftar")
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
