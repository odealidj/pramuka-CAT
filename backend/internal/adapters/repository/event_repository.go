package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository/sqlcgen"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type eventRepository struct {
	queries *sqlcgen.Queries
}

func NewEventRepository(queries *sqlcgen.Queries) ports.EventRepository {
	return &eventRepository{queries: queries}
}

func mapSqlcToDomainEvent(e sqlcgen.Event) domain.Event {
	var createdAt time.Time
	if e.CreatedAt.Valid {
		createdAt = e.CreatedAt.Time
	}

	passingGrade, _ := strconv.ParseFloat(e.PassingGrade, 64)

	return domain.Event{
		ID:              e.ID,
		Name:            e.Name,
		StartTime:       e.StartTime,
		EndTime:         e.EndTime,
		DurationMinutes: e.DurationMinutes,
		PassingGrade:    passingGrade,
		CreatedAt:       createdAt,
	}
}

func (r *eventRepository) CreateEvent(ctx context.Context, e domain.Event) (domain.Event, error) {
	passingGradeStr := fmt.Sprintf("%.2f", e.PassingGrade)
	res, err := r.queries.CreateEvent(ctx, sqlcgen.CreateEventParams{
		Name:            e.Name,
		StartTime:       e.StartTime,
		EndTime:         e.EndTime,
		DurationMinutes: e.DurationMinutes,
		PassingGrade:    passingGradeStr,
	})
	if err != nil {
		return domain.Event{}, err
	}
	return mapSqlcToDomainEvent(res), nil
}

func (r *eventRepository) GetEventById(ctx context.Context, id uuid.UUID) (domain.Event, error) {
	res, err := r.queries.GetEventById(ctx, id)
	if err != nil {
		return domain.Event{}, err
	}
	return mapSqlcToDomainEvent(res), nil
}

func (r *eventRepository) ListEvents(ctx context.Context, page int32, limit int32, search string) ([]domain.Event, int64, error) {
	offset := (page - 1) * limit
	rows, err := r.queries.ListEvents(ctx, sqlcgen.ListEventsParams{
		Limit:  limit,
		Offset: offset,
		Search: search,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountEvents(ctx, search)
	if err != nil {
		return nil, 0, err
	}

	var events []domain.Event
	for _, row := range rows {
		events = append(events, mapSqlcToDomainEvent(row))
	}
	return events, total, nil
}

func (r *eventRepository) UpdateEvent(ctx context.Context, id uuid.UUID, e domain.Event) (domain.Event, error) {
	passingGradeStr := fmt.Sprintf("%.2f", e.PassingGrade)
	res, err := r.queries.UpdateEvent(ctx, sqlcgen.UpdateEventParams{
		ID:              id,
		Name:            e.Name,
		StartTime:       e.StartTime,
		EndTime:         e.EndTime,
		DurationMinutes: e.DurationMinutes,
		PassingGrade:    passingGradeStr,
	})
	if err != nil {
		return domain.Event{}, err
	}
	return mapSqlcToDomainEvent(res), nil
}

func (r *eventRepository) DeleteEvent(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteEvent(ctx, id)
}

func (r *eventRepository) AddEventQuestion(ctx context.Context, eventID uuid.UUID, questionID uuid.UUID) error {
	return r.queries.CreateEventQuestion(ctx, sqlcgen.CreateEventQuestionParams{
		EventID:    eventID,
		QuestionID: questionID,
	})
}

func (r *eventRepository) ListEventQuestions(ctx context.Context, eventID uuid.UUID, page int32, limit int32) ([]domain.Question, int64, error) {
	offset := (page - 1) * limit
	rows, err := r.queries.ListEventQuestions(ctx, sqlcgen.ListEventQuestionsParams{
		EventID: eventID,
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountEventQuestions(ctx, eventID)
	if err != nil {
		return nil, 0, err
	}

	var questions []domain.Question
	for _, row := range rows {
		questions = append(questions, mapSqlcToDomainQuestion(sqlcgen.Question(row)))
	}
	return questions, total, nil
}

func (r *eventRepository) RemoveEventQuestion(ctx context.Context, eventID uuid.UUID, questionID uuid.UUID) error {
	return r.queries.DeleteEventQuestion(ctx, sqlcgen.DeleteEventQuestionParams{
		EventID:    eventID,
		QuestionID: questionID,
	})
}

func (r *eventRepository) ListEventParticipants(ctx context.Context, eventID uuid.UUID, page int32, limit int32) ([]domain.EventParticipant, int64, error) {
	offset := (page - 1) * limit
	rows, err := r.queries.ListEventParticipants(ctx, sqlcgen.ListEventParticipantsParams{
		EventID: uuid.NullUUID{UUID: eventID, Valid: true},
		Limit:   limit,
		Offset:  offset,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountEventParticipants(ctx, uuid.NullUUID{UUID: eventID, Valid: true})
	if err != nil {
		return nil, 0, err
	}

	var participants []domain.EventParticipant
	for _, row := range rows {
		score, _ := strconv.ParseFloat(row.Score.String, 64)
		participants = append(participants, domain.EventParticipant{
			UserID:      row.ID,
			Username:    row.Username,
			FullName:    row.FullName,
			Status:      row.Status,
			IsCompleted: row.IsCompleted,
			Score:       score,
			IsPassed:    row.IsPassed.Bool,
		})
	}
	return participants, total, nil
}

func (r *eventRepository) ApproveUserEvent(ctx context.Context, approvalID uuid.UUID) error {
	_, err := r.queries.ApproveUserEvent(ctx, approvalID)
	return err
}

func (r *eventRepository) RevokeUserEvent(ctx context.Context, approvalID uuid.UUID) error {
	_, err := r.queries.RevokeUserEvent(ctx, approvalID)
	return err
}

func (r *eventRepository) AddRandomEventQuestions(ctx context.Context, eventID uuid.UUID, categoryID *int32, amount int32) error {
	if categoryID != nil {
		return r.queries.AddRandomEventQuestionsByCategory(ctx, sqlcgen.AddRandomEventQuestionsByCategoryParams{
			EventID:    eventID,
			CategoryID: sql.NullInt32{Int32: *categoryID, Valid: true},
			Limit:      amount,
		})
	}

	return r.queries.AddRandomEventQuestionsAll(ctx, sqlcgen.AddRandomEventQuestionsAllParams{
		EventID: eventID,
		Limit:   amount,
	})
}

func (r *eventRepository) CountAvailableQuestions(ctx context.Context, eventID uuid.UUID, categoryID *int32) (int64, error) {
	if categoryID != nil {
		return r.queries.CountAvailableQuestionsForEventByCategory(ctx, sqlcgen.CountAvailableQuestionsForEventByCategoryParams{
			EventID:    eventID,
			CategoryID: sql.NullInt32{Int32: *categoryID, Valid: true},
		})
	}

	return r.queries.CountAvailableQuestionsForEventAll(ctx, eventID)
}

func (r *eventRepository) GetAllEventParticipantsForExport(ctx context.Context, eventID uuid.UUID) ([]domain.EventParticipantExport, error) {
	rows, err := r.queries.GetAllEventParticipantsForExport(ctx, uuid.NullUUID{UUID: eventID, Valid: true})
	if err != nil {
		return nil, fmt.Errorf("failed to get event participants for export: %w", err)
	}

	var results []domain.EventParticipantExport
	for _, row := range rows {
		scoreStr := row.Score.String
		score, _ := strconv.ParseFloat(scoreStr, 64)

		var startedAt *time.Time
		if row.StartedAt.Valid {
			startedAt = &row.StartedAt.Time
		}
		var completedAt *time.Time
		if row.CompletedAt.Valid {
			completedAt = &row.CompletedAt.Time
		}

		results = append(results, domain.EventParticipantExport{
			Username:    row.Username,
			FullName:    row.FullName,
			Status:      row.Status,
			IsCompleted: row.IsCompleted,
			Score:       score,
			IsPassed:    row.IsPassed.Bool,
			StartedAt:   startedAt,
			CompletedAt: completedAt,
		})
	}

	return results, nil
}
