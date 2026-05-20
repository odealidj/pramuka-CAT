package services

import (
	"context"
	"fmt"

	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type categoryService struct {
	repo ports.CategoryRepository
}

func NewCategoryService(repo ports.CategoryRepository) ports.CategoryService {
	return &categoryService{repo: repo}
}

func (s *categoryService) CreateCategory(ctx context.Context, req domain.CreateCategoryRequest) (domain.Category, error) {
	if req.Name == "" {
		return domain.Category{}, fmt.Errorf("nama kategori tidak boleh kosong")
	}
	return s.repo.CreateCategory(ctx, req.Name)
}

func (s *categoryService) GetCategoryById(ctx context.Context, id int32) (domain.Category, error) {
	return s.repo.GetCategoryById(ctx, id)
}

func (s *categoryService) ListCategories(ctx context.Context, page int32, limit int32, search string) ([]domain.Category, int64, error) {
	return s.repo.ListCategories(ctx, page, limit, search)
}

func (s *categoryService) UpdateCategory(ctx context.Context, id int32, req domain.UpdateCategoryRequest) (domain.Category, error) {
	if req.Name == "" {
		return domain.Category{}, fmt.Errorf("nama kategori tidak boleh kosong")
	}
	// Pastikan kategori ada
	_, err := s.repo.GetCategoryById(ctx, id)
	if err != nil {
		return domain.Category{}, fmt.Errorf("kategori tidak ditemukan")
	}
	return s.repo.UpdateCategory(ctx, id, req.Name)
}

func (s *categoryService) DeleteCategory(ctx context.Context, id int32) error {
	// Pastikan kategori ada
	_, err := s.repo.GetCategoryById(ctx, id)
	if err != nil {
		return fmt.Errorf("kategori tidak ditemukan")
	}

	// Cek apakah kategori masih memiliki soal
	count, err := s.repo.CountQuestionsByCategory(ctx, id)
	if err != nil {
		return fmt.Errorf("gagal memeriksa soal pada kategori ini")
	}
	if count > 0 {
		return fmt.Errorf("kategori tidak dapat dihapus karena masih memiliki %d soal. Pindahkan atau hapus soal terlebih dahulu", count)
	}

	return s.repo.DeleteCategory(ctx, id)
}
