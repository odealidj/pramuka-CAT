package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository/sqlcgen"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type questionRepository struct {
	queries *sqlcgen.Queries
}

func NewQuestionRepository(queries *sqlcgen.Queries) ports.QuestionRepository {
	return &questionRepository{queries: queries}
}

// mapSqlcToDomainQuestion mengonversi dari model SQLC ke Entity Domain
func mapSqlcToDomainQuestion(q sqlcgen.Question) domain.Question {
	var catID *int32
	if q.CategoryID.Valid {
		catID = &q.CategoryID.Int32
	}

	var createdAt *time.Time
	if q.CreatedAt.Valid {
		t := q.CreatedAt.Time
		createdAt = &t
	}

	return domain.Question{
		ID:            q.ID,
		CategoryID:    catID,
		QuestionText:  q.QuestionText,
		OptionA:       q.OptionA,
		OptionB:       q.OptionB,
		OptionC:       q.OptionC,
		OptionD:       q.OptionD,
		CorrectAnswer: q.CorrectAnswer,
		Weight:        q.Weight,
		CreatedAt:     createdAt,
	}
}

func (r *questionRepository) CreateQuestion(ctx context.Context, q domain.Question) (domain.Question, error) {
	catID := sql.NullInt32{}
	if q.CategoryID != nil {
		catID = sql.NullInt32{Int32: *q.CategoryID, Valid: true}
	}

	res, err := r.queries.CreateQuestion(ctx, sqlcgen.CreateQuestionParams{
		CategoryID:    catID,
		QuestionText:  q.QuestionText,
		OptionA:       q.OptionA,
		OptionB:       q.OptionB,
		OptionC:       q.OptionC,
		OptionD:       q.OptionD,
		CorrectAnswer: q.CorrectAnswer,
		Weight:        q.Weight,
	})
	if err != nil {
		return domain.Question{}, err
	}
	return mapSqlcToDomainQuestion(res), nil
}

func (r *questionRepository) GetQuestionById(ctx context.Context, id uuid.UUID) (domain.Question, error) {
	res, err := r.queries.GetQuestionById(ctx, id)
	if err != nil {
		return domain.Question{}, err
	}
	return mapSqlcToDomainQuestion(res), nil
}

func (r *questionRepository) ListQuestions(ctx context.Context) ([]domain.Question, error) {
	rows, err := r.queries.ListQuestions(ctx)
	if err != nil {
		return nil, err
	}
	var res []domain.Question
	for _, row := range rows {
		res = append(res, mapSqlcToDomainQuestion(row))
	}
	return res, nil
}

func (r *questionRepository) UpdateQuestion(ctx context.Context, id uuid.UUID, q domain.Question) (domain.Question, error) {
	catID := sql.NullInt32{}
	if q.CategoryID != nil {
		catID = sql.NullInt32{Int32: *q.CategoryID, Valid: true}
	}

	res, err := r.queries.UpdateQuestion(ctx, sqlcgen.UpdateQuestionParams{
		ID:            id,
		CategoryID:    catID,
		QuestionText:  q.QuestionText,
		OptionA:       q.OptionA,
		OptionB:       q.OptionB,
		OptionC:       q.OptionC,
		OptionD:       q.OptionD,
		CorrectAnswer: q.CorrectAnswer,
		Weight:        q.Weight,
	})
	if err != nil {
		return domain.Question{}, err
	}
	return mapSqlcToDomainQuestion(res), nil
}

func (r *questionRepository) DeleteQuestion(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteQuestion(ctx, id)
}
