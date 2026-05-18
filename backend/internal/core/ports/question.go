package ports

import (
	"context"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
)

// QuestionRepository menangani operasi database untuk Question
type QuestionRepository interface {
	CreateQuestion(ctx context.Context, q domain.Question) (domain.Question, error)
	GetQuestionById(ctx context.Context, id uuid.UUID) (domain.Question, error)
	ListQuestions(ctx context.Context, page int32, limit int32, search string) ([]domain.Question, int64, error)
	UpdateQuestion(ctx context.Context, id uuid.UUID, q domain.Question) (domain.Question, error)
	DeleteQuestion(ctx context.Context, id uuid.UUID) error
}

// QuestionService menangani business logic untuk Question
type QuestionService interface {
	CreateQuestion(ctx context.Context, req domain.CreateQuestionRequest) (domain.Question, error)
	GetQuestionById(ctx context.Context, id uuid.UUID) (domain.Question, error)
	ListQuestions(ctx context.Context, page int32, limit int32, search string) ([]domain.Question, int64, error)
	UpdateQuestion(ctx context.Context, id uuid.UUID, req domain.UpdateQuestionRequest) (domain.Question, error)
	DeleteQuestion(ctx context.Context, id uuid.UUID) error
}
