package ports

import (
	"context"

	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
)

// CategoryRepository menangani operasi database untuk Category
type CategoryRepository interface {
	CreateCategory(ctx context.Context, name string) (domain.Category, error)
	GetCategoryById(ctx context.Context, id int32) (domain.Category, error)
	ListCategories(ctx context.Context) ([]domain.Category, error)
	UpdateCategory(ctx context.Context, id int32, name string) (domain.Category, error)
	DeleteCategory(ctx context.Context, id int32) error
}

// CategoryService menangani business logic untuk Category
type CategoryService interface {
	CreateCategory(ctx context.Context, req domain.CreateCategoryRequest) (domain.Category, error)
	GetCategoryById(ctx context.Context, id int32) (domain.Category, error)
	ListCategories(ctx context.Context) ([]domain.Category, error)
	UpdateCategory(ctx context.Context, id int32, req domain.UpdateCategoryRequest) (domain.Category, error)
	DeleteCategory(ctx context.Context, id int32) error
}
