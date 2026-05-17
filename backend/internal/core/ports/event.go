package ports

import (
	"context"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
)

type EventRepository interface {
	CreateEvent(ctx context.Context, e domain.Event) (domain.Event, error)
	GetEventById(ctx context.Context, id uuid.UUID) (domain.Event, error)
	ListEvents(ctx context.Context) ([]domain.Event, error)
	UpdateEvent(ctx context.Context, id uuid.UUID, e domain.Event) (domain.Event, error)
	DeleteEvent(ctx context.Context, id uuid.UUID) error

	AddEventQuestion(ctx context.Context, eventID uuid.UUID, questionID uuid.UUID) error
	ListEventQuestions(ctx context.Context, eventID uuid.UUID) ([]domain.Question, error)
	RemoveEventQuestion(ctx context.Context, eventID uuid.UUID, questionID uuid.UUID) error

	ListEventParticipants(ctx context.Context, eventID uuid.UUID) ([]domain.EventParticipant, error)
	ApproveUserEvent(ctx context.Context, approvalID uuid.UUID) error
}

type EventService interface {
	CreateEvent(ctx context.Context, req domain.CreateEventRequest) (domain.Event, error)
	GetEventById(ctx context.Context, id uuid.UUID) (domain.Event, error)
	ListEvents(ctx context.Context) ([]domain.Event, error)
	UpdateEvent(ctx context.Context, id uuid.UUID, req domain.UpdateEventRequest) (domain.Event, error)
	DeleteEvent(ctx context.Context, id uuid.UUID) error

	AddEventQuestion(ctx context.Context, eventID uuid.UUID, req domain.AddEventQuestionRequest) error
	ListEventQuestions(ctx context.Context, eventID uuid.UUID) ([]domain.Question, error)
	RemoveEventQuestion(ctx context.Context, eventID uuid.UUID, questionID uuid.UUID) error

	ListEventParticipants(ctx context.Context, eventID uuid.UUID) ([]domain.EventParticipant, error)
	ApproveUserEvent(ctx context.Context, approvalID uuid.UUID) error
}
