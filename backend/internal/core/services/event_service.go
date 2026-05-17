package services

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"strconv"
	"time"

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

func (s *eventService) AddRandomEventQuestions(ctx context.Context, eventID uuid.UUID, req domain.AddRandomEventQuestionsRequest) error {
	if req.Amount > 500 {
		return fmt.Errorf("jumlah soal maksimal untuk penarikan acak dalam satu waktu adalah 500 soal")
	}

	_, err := s.repo.GetEventById(ctx, eventID)
	if err != nil {
		return fmt.Errorf("event tidak ditemukan")
	}

	// Cek ketersediaan soal
	available, err := s.repo.CountAvailableQuestions(ctx, eventID, req.CategoryID)
	if err != nil {
		return fmt.Errorf("gagal mengecek ketersediaan soal: %w", err)
	}

	if int64(req.Amount) > available {
		return fmt.Errorf("soal yang tersedia tidak mencukupi (diminta: %d, tersedia: %d)", req.Amount, available)
	}

	return s.repo.AddRandomEventQuestions(ctx, eventID, req.CategoryID, req.Amount)
}

func (s *eventService) ExportEventParticipantsCSV(ctx context.Context, eventID uuid.UUID) ([]byte, error) {
	_, err := s.repo.GetEventById(ctx, eventID)
	if err != nil {
		return nil, fmt.Errorf("event tidak ditemukan")
	}

	participants, err := s.repo.GetAllEventParticipantsForExport(ctx, eventID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil data peserta: %w", err)
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)

	// Header
	_ = w.Write([]string{"Username", "Nama Lengkap", "Status", "Sudah Submit", "Nilai", "Lulus", "Waktu Mulai", "Waktu Selesai"})

	for _, p := range participants {
		isCompleted := "Tidak"
		if p.IsCompleted {
			isCompleted = "Ya"
		}
		isPassed := "Tidak Lulus"
		if p.IsPassed {
			isPassed = "Lulus"
		}
		startedAt := "-"
		if p.StartedAt != nil {
			startedAt = p.StartedAt.In(time.Local).Format("2006-01-02 15:04:05")
		}
		completedAt := "-"
		if p.CompletedAt != nil {
			completedAt = p.CompletedAt.In(time.Local).Format("2006-01-02 15:04:05")
		}

		_ = w.Write([]string{
			p.Username,
			p.FullName,
			p.Status,
			isCompleted,
			strconv.FormatFloat(p.Score, 'f', 2, 64),
			isPassed,
			startedAt,
			completedAt,
		})
	}

	w.Flush()
	if err := w.Error(); err != nil {
		return nil, fmt.Errorf("gagal menulis CSV: %w", err)
	}

	return buf.Bytes(), nil
}
