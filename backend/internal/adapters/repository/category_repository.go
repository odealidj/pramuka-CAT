package repository

import (
	"context"

	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository/sqlcgen"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type categoryRepository struct {
	queries *sqlcgen.Queries
}

func NewCategoryRepository(queries *sqlcgen.Queries) ports.CategoryRepository {
	return &categoryRepository{queries: queries}
}

func (r *categoryRepository) CreateCategory(ctx context.Context, name string) (domain.Category, error) {
	c, err := r.queries.CreateCategory(ctx, name)
	if err != nil {
		return domain.Category{}, err
	}
	return domain.Category{
		ID:   c.ID,
		Name: c.Name,
	}, nil
}

func (r *categoryRepository) GetCategoryById(ctx context.Context, id int32) (domain.Category, error) {
	c, err := r.queries.GetCategoryById(ctx, id)
	if err != nil {
		return domain.Category{}, err
	}
	return domain.Category{
		ID:   c.ID,
		Name: c.Name,
	}, nil
}

func (r *categoryRepository) ListCategories(ctx context.Context) ([]domain.Category, error) {
	rows, err := r.queries.ListCategories(ctx)
	if err != nil {
		return nil, err
	}
	var res []domain.Category
	for _, c := range rows {
		res = append(res, domain.Category{
			ID:   c.ID,
			Name: c.Name,
		})
	}
	return res, nil
}

func (r *categoryRepository) UpdateCategory(ctx context.Context, id int32, name string) (domain.Category, error) {
	c, err := r.queries.UpdateCategory(ctx, sqlcgen.UpdateCategoryParams{
		ID:   id,
		Name: name,
	})
	if err != nil {
		return domain.Category{}, err
	}
	return domain.Category{
		ID:   c.ID,
		Name: c.Name,
	}, nil
}

func (r *categoryRepository) DeleteCategory(ctx context.Context, id int32) error {
	return r.queries.DeleteCategory(ctx, id)
}
