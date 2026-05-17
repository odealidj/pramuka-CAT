package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type eventService struct {
	repo ports.EventRepository
}

func NewEventService(repo ports.EventRepository) ports.EventService {
	return &eventService{repo: repo}
}

func (s *eventService) CreateEvent(ctx context.Context, req domain.CreateEventRequest) (domain.Event, error) {
	if req.EndTime.Before(req.StartTime) {
		return domain.Event{}, fmt.Errorf("waktu selesai (end_time) tidak boleh sebelum waktu mulai (start_time)")
	}

	e := domain.Event{
		Name:            req.Name,
		StartTime:       req.StartTime,
		EndTime:         req.EndTime,
		DurationMinutes: req.DurationMinutes,
		PassingGrade:    req.PassingGrade,
	}
	return s.repo.CreateEvent(ctx, e)
}

func (s *eventService) GetEventById(ctx context.Context, id uuid.UUID) (domain.Event, error) {
	return s.repo.GetEventById(ctx, id)
}

func (s *eventService) ListEvents(ctx context.Context, page int32, limit int32) ([]domain.Event, int64, error) {
	return s.repo.ListEvents(ctx, page, limit)
}

func (s *eventService) UpdateEvent(ctx context.Context, id uuid.UUID, req domain.UpdateEventRequest) (domain.Event, error) {
	if req.EndTime.Before(req.StartTime) {
		return domain.Event{}, fmt.Errorf("waktu selesai (end_time) tidak boleh sebelum waktu mulai (start_time)")
	}

	_, err := s.repo.GetEventById(ctx, id)
	if err != nil {
		return domain.Event{}, fmt.Errorf("event tidak ditemukan")
	}

	e := domain.Event{
		Name:            req.Name,
		StartTime:       req.StartTime,
		EndTime:         req.EndTime,
		DurationMinutes: req.DurationMinutes,
		PassingGrade:    req.PassingGrade,
	}
	return s.repo.UpdateEvent(ctx, id, e)
}

func (s *eventService) DeleteEvent(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetEventById(ctx, id)
	if err != nil {
		return fmt.Errorf("event tidak ditemukan")
	}
	return s.repo.DeleteEvent(ctx, id)
}

func (s *eventService) AddEventQuestion(ctx context.Context, eventID uuid.UUID, req domain.AddEventQuestionRequest) error {
	_, err := s.repo.GetEventById(ctx, eventID)
	if err != nil {
		return fmt.Errorf("event tidak ditemukan")
	}
	// Di sistem nyata, kita mungkin perlu memvalidasi apakah questionID benar-benar ada di tabel questions
	return s.repo.AddEventQuestion(ctx, eventID, req.QuestionID)
}

func (s *eventService) ListEventQuestions(ctx context.Context, eventID uuid.UUID, page int32, limit int32) ([]domain.Question, int64, error) {
	return s.repo.ListEventQuestions(ctx, eventID, page, limit)
}

func (s *eventService) RemoveEventQuestion(ctx context.Context, eventID uuid.UUID, questionID uuid.UUID) error {
	return s.repo.RemoveEventQuestion(ctx, eventID, questionID)
}

func (s *eventService) ListEventParticipants(ctx context.Context, eventID uuid.UUID, page int32, limit int32) ([]domain.EventParticipant, int64, error) {
	return s.repo.ListEventParticipants(ctx, eventID, page, limit)
}

func (s *eventService) ApproveUserEvent(ctx context.Context, approvalID uuid.UUID) error {
	return s.repo.ApproveUserEvent(ctx, approvalID)
}
