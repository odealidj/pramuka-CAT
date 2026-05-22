package services

import (
	"bytes"
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	gofpdf "github.com/jung-kurt/gofpdf"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/internal/worker"
	"github.com/xuri/excelize/v2"
)

type eventService struct {
	repo            ports.EventRepository
	taskDistributor worker.TaskDistributor
}

func NewEventService(repo ports.EventRepository, taskDistributor worker.TaskDistributor) ports.EventService {
	return &eventService{repo: repo, taskDistributor: taskDistributor}
}

func (s *eventService) CreateEvent(ctx context.Context, req domain.CreateEventRequest) (domain.Event, error) {
	if req.EndTime.Before(req.StartTime) {
		return domain.Event{}, fmt.Errorf("waktu selesai (end_time) tidak boleh sebelum waktu mulai (start_time)")
	}

	// Validasi Duplikat: Nama dan Waktu yang sama
	isDuplicate, err := s.repo.CheckDuplicateEvent(ctx, req.Name, req.StartTime, req.EndTime, nil)
	if err != nil {
		return domain.Event{}, fmt.Errorf("gagal mengecek duplikasi jadwal ujian")
	}
	if isDuplicate {
		return domain.Event{}, fmt.Errorf("jadwal ujian dengan nama dan rentang waktu yang sama sudah terdaftar")
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

func (s *eventService) ListEvents(ctx context.Context, page int32, limit int32, search string) ([]domain.Event, int64, error) {
	return s.repo.ListEvents(ctx, page, limit, search)
}

func (s *eventService) UpdateEvent(ctx context.Context, id uuid.UUID, req domain.UpdateEventRequest) (domain.Event, error) {
	if req.EndTime.Before(req.StartTime) {
		return domain.Event{}, fmt.Errorf("waktu selesai (end_time) tidak boleh sebelum waktu mulai (start_time)")
	}

	_, err := s.repo.GetEventById(ctx, id)
	if err != nil {
		return domain.Event{}, fmt.Errorf("event tidak ditemukan")
	}

	// Validasi Duplikat saat Update
	isDuplicate, err := s.repo.CheckDuplicateEvent(ctx, req.Name, req.StartTime, req.EndTime, &id)
	if err != nil {
		return domain.Event{}, fmt.Errorf("gagal mengecek duplikasi jadwal ujian")
	}
	if isDuplicate {
		return domain.Event{}, fmt.Errorf("jadwal ujian dengan nama dan rentang waktu yang sama sudah terdaftar")
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
	event, err := s.repo.GetEventById(ctx, id)
	if err != nil {
		return fmt.Errorf("event tidak ditemukan")
	}

	participants, err := s.repo.ListAllEventParticipants(ctx, id)
	if err == nil && s.taskDistributor != nil {
		for _, p := range participants {
			if p.Email.Valid && p.Email.String != "" {
				s.taskDistributor.DistributeTaskSendEmail(context.Background(), &worker.PayloadSendEmail{
					ToAddress: p.Email.String,
					Subject:   "Pemberitahuan: Jadwal Ujian Dibatalkan",
					Body:      fmt.Sprintf("Halo %s,\n\nMohon maaf, Jadwal Ujian '%s' yang Anda ikuti telah dibatalkan atau dihapus oleh Admin.\n\nTerima kasih.\n\nTim Pramuka CAT", p.FullName, event.Name),
				})
			}
		}
	}

	// Delete approvals
	s.repo.DeleteApprovalsByEventID(ctx, id)

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

func (s *eventService) ListEventParticipants(ctx context.Context, eventID uuid.UUID, page int32, limit int32, search string) ([]domain.EventParticipant, int64, error) {
	return s.repo.ListEventParticipants(ctx, eventID, page, limit, search)
}

func (s *eventService) ApproveUserEvent(ctx context.Context, approvalID uuid.UUID) error {
	err := s.repo.ApproveUserEvent(ctx, approvalID)
	if err == nil && s.taskDistributor != nil {
		approval, _ := s.repo.GetApprovalById(ctx, approvalID)
		if approval.UserID != uuid.Nil {
			user, _ := s.repo.GetUserById(ctx, approval.UserID)
			event, _ := s.repo.GetEventById(ctx, approval.EventID)

			title := "Pendaftaran Disetujui"
			msg := fmt.Sprintf("Pendaftaran Anda untuk ujian %s telah disetujui. Anda dapat memulai ujian pada waktu yang ditentukan.", event.Name)
			
			s.taskDistributor.DistributeTaskCreateNotification(context.Background(), &worker.PayloadCreateNotification{
				UserID:  user.ID,
				Title:   title,
				Message: msg,
				Type:    "event_approval",
			})
			if user.Email != nil && *user.Email != "" {
				s.taskDistributor.DistributeTaskSendEmail(context.Background(), &worker.PayloadSendEmail{
					ToAddress: *user.Email,
					Subject:   "Pendaftaran Ujian Disetujui",
					Body:      fmt.Sprintf("Halo %s,\n\n%s\n\nSalam,\nAdmin Pramuka CAT", user.FullName, msg),
				})
			}
		}
	}
	return err
}

func (s *eventService) RevokeUserEvent(ctx context.Context, approvalID uuid.UUID) error {
	err := s.repo.RevokeUserEvent(ctx, approvalID)
	if err == nil && s.taskDistributor != nil {
		approval, _ := s.repo.GetApprovalById(ctx, approvalID)
		if approval.UserID != uuid.Nil {
			user, _ := s.repo.GetUserById(ctx, approval.UserID)
			event, _ := s.repo.GetEventById(ctx, approval.EventID)

			title := "Pendaftaran Dibatalkan"
			msg := fmt.Sprintf("Pendaftaran Anda untuk ujian %s telah dibatalkan (revoked) oleh admin.", event.Name)
			
			s.taskDistributor.DistributeTaskCreateNotification(context.Background(), &worker.PayloadCreateNotification{
				UserID:  user.ID,
				Title:   title,
				Message: msg,
				Type:    "event_revocation",
			})
			if user.Email != nil && *user.Email != "" {
				s.taskDistributor.DistributeTaskSendEmail(context.Background(), &worker.PayloadSendEmail{
					ToAddress: *user.Email,
					Subject:   "Pendaftaran Ujian Dibatalkan",
					Body:      fmt.Sprintf("Halo %s,\n\n%s\n\nSalam,\nAdmin Pramuka CAT", user.FullName, msg),
				})
			}
		}
	}
	return err
}

func (s *eventService) RemoveUserEvent(ctx context.Context, approvalID uuid.UUID) error {
	// Dapatkan data sebelum dihapus
	approval, errGet := s.repo.GetApprovalById(ctx, approvalID)
	
	err := s.repo.RemoveUserEvent(ctx, approvalID)
	if err == nil && errGet == nil && s.taskDistributor != nil {
		if approval.UserID != uuid.Nil {
			user, _ := s.repo.GetUserById(ctx, approval.UserID)
			event, _ := s.repo.GetEventById(ctx, approval.EventID)

			title := "Dikeluarkan dari Ujian"
			msg := fmt.Sprintf("Anda telah dikeluarkan secara permanen dari ujian %s oleh admin.", event.Name)
			
			s.taskDistributor.DistributeTaskCreateNotification(context.Background(), &worker.PayloadCreateNotification{
				UserID:  user.ID,
				Title:   title,
				Message: msg,
				Type:    "event_removal",
			})
			if user.Email != nil && *user.Email != "" {
				s.taskDistributor.DistributeTaskSendEmail(context.Background(), &worker.PayloadSendEmail{
					ToAddress: *user.Email,
					Subject:   "Dikeluarkan dari Ujian",
					Body:      fmt.Sprintf("Halo %s,\n\n%s\n\nSalam,\nAdmin Pramuka CAT", user.FullName, msg),
				})
			}
		}
	}
	return err
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

func (s *eventService) getParticipantsForExport(ctx context.Context, eventID uuid.UUID) (domain.Event, []domain.EventParticipantExport, error) {
	event, err := s.repo.GetEventById(ctx, eventID)
	if err != nil {
		return domain.Event{}, nil, fmt.Errorf("event tidak ditemukan")
	}
	participants, err := s.repo.GetAllEventParticipantsForExport(ctx, eventID)
	if err != nil {
		return domain.Event{}, nil, fmt.Errorf("gagal mengambil data peserta: %w", err)
	}
	return event, participants, nil
}

// ExportEventParticipantsExcel menghasilkan file .xlsx dengan styling header
func (s *eventService) ExportEventParticipantsExcel(ctx context.Context, eventID uuid.UUID) ([]byte, error) {
	event, participants, err := s.getParticipantsForExport(ctx, eventID)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	defer f.Close()

	sheet := "Laporan Peserta"
	f.SetSheetName("Sheet1", sheet)

	// Header
	headers := []string{"No", "Username", "Nama Lengkap", "Status", "Sudah Submit", "Nilai", "Lulus", "Waktu Mulai", "Waktu Selesai"}
	for col, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(col+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	// Style: header bold dengan background biru
	styleHeader, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"003366"}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	f.SetRowStyle(sheet, 1, 1, styleHeader)
	f.SetRowHeight(sheet, 1, 20)

	// Judul di atas header
	f.InsertRows(sheet, 1, 2)
	f.MergeCell(sheet, "A1", "I1")
	f.SetCellValue(sheet, "A1", fmt.Sprintf("Laporan Nilai Ujian - %s", event.Name))
	styleTitle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 14},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	f.SetCellStyle(sheet, "A1", "A1", styleTitle)

	f.MergeCell(sheet, "A2", "I2")
	f.SetCellValue(sheet, "A2", fmt.Sprintf("Passing Grade: %.0f | Diekspor: %s", event.PassingGrade, time.Now().Format("2006-01-02 15:04")))

	// Data rows mulai dari row 4 (setelah 2 judul + 1 header)
	for i, p := range participants {
		row := i + 4
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

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), p.Username)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), p.FullName)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), p.Status)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), isCompleted)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), p.Score)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), isPassed)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), startedAt)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row), completedAt)
	}

	// Auto-fit kolom
	colWidths := map[string]float64{"A": 5, "B": 18, "C": 25, "D": 12, "E": 14, "F": 10, "G": 14, "H": 22, "I": 22}
	for col, w := range colWidths {
		f.SetColWidth(sheet, col, col, w)
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, fmt.Errorf("gagal menulis file Excel: %w", err)
	}
	return buf.Bytes(), nil
}

// ExportEventParticipantsPDF menghasilkan file .pdf dengan tabel data peserta
func (s *eventService) ExportEventParticipantsPDF(ctx context.Context, eventID uuid.UUID) ([]byte, error) {
	event, participants, err := s.getParticipantsForExport(ctx, eventID)
	if err != nil {
		return nil, err
	}

	pdf := gofpdf.New("L", "mm", "A4", "")
	pdf.SetMargins(10, 15, 10)
	pdf.AddPage()

	// Judul
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(0, 10, "Laporan Nilai Ujian - Pramuka CAT", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "", 11)
	pdf.CellFormat(0, 7, fmt.Sprintf("Event: %s", event.Name), "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 7, fmt.Sprintf("Passing Grade: %.0f  |  Tanggal: %s", event.PassingGrade, time.Now().Format("02 January 2006 15:04")), "", 1, "C", false, 0, "")
	pdf.Ln(5)

	// Header tabel
	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(0, 51, 102)
	pdf.SetTextColor(255, 255, 255)
	colW := []float64{8, 35, 50, 22, 22, 18, 22, 40, 40}
	headers := []string{"No", "Username", "Nama Lengkap", "Status", "Submit", "Nilai", "Lulus", "Waktu Mulai", "Waktu Selesai"}
	for i, h := range headers {
		pdf.CellFormat(colW[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Data
	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(0, 0, 0)
	for i, p := range participants {
		// Warna zebra
		if i%2 == 0 {
			pdf.SetFillColor(240, 245, 255)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}

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
			startedAt = p.StartedAt.In(time.Local).Format("02/01 15:04")
		}
		completedAt := "-"
		if p.CompletedAt != nil {
			completedAt = p.CompletedAt.In(time.Local).Format("02/01 15:04")
		}

		vals := []string{
			strconv.Itoa(i + 1),
			p.Username,
			p.FullName,
			p.Status,
			isCompleted,
			strconv.FormatFloat(p.Score, 'f', 2, 64),
			isPassed,
			startedAt,
			completedAt,
		}
		for j, v := range vals {
			align := "L"
			if j == 0 || j == 5 {
				align = "C"
			}
			pdf.CellFormat(colW[j], 7, v, "1", 0, align, true, 0, "")
		}
		pdf.Ln(-1)
	}

	// Footer
	pdf.Ln(5)
	pdf.SetFont("Arial", "I", 8)
	pdf.SetTextColor(128, 128, 128)
	pdf.CellFormat(0, 5, fmt.Sprintf("Total Peserta: %d | Dokumen ini digenerate secara otomatis oleh sistem Pramuka CAT", len(participants)), "", 0, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("gagal menulis file PDF: %w", err)
	}
	return buf.Bytes(), nil
}
