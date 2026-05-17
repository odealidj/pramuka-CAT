package domain

import (
	"time"

	"github.com/google/uuid"
)

type Event struct {
	ID              uuid.UUID `json:"id"`
	Name            string    `json:"name"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	DurationMinutes int32     `json:"duration_minutes"`
	PassingGrade    float64   `json:"passing_grade"`
	CreatedAt       time.Time `json:"created_at"`
}

type CreateEventRequest struct {
	Name            string    `json:"name" validate:"required"`
	StartTime       time.Time `json:"start_time" validate:"required"`
	EndTime         time.Time `json:"end_time" validate:"required"`
	DurationMinutes int32     `json:"duration_minutes" validate:"required,min=1"`
	PassingGrade    float64   `json:"passing_grade" validate:"required,min=0,max=100"`
}

type UpdateEventRequest struct {
	Name            string    `json:"name" validate:"required"`
	StartTime       time.Time `json:"start_time" validate:"required"`
	EndTime         time.Time `json:"end_time" validate:"required"`
	DurationMinutes int32     `json:"duration_minutes" validate:"required,min=1"`
	PassingGrade    float64   `json:"passing_grade" validate:"required,min=0,max=100"`
}

type EventParticipant struct {
	UserID      uuid.UUID `json:"user_id"`
	Username    string    `json:"username"`
	FullName    string    `json:"full_name"`
	Status      string    `json:"status"`
	IsCompleted bool      `json:"is_completed"`
	Score       float64   `json:"score"`
	IsPassed    bool      `json:"is_passed"`
}

type AddEventQuestionRequest struct {
	QuestionID uuid.UUID `json:"question_id" validate:"required"`
}
