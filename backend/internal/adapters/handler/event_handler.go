package handler

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/response"
)

type EventHandler struct {
	service ports.EventService
}

func NewEventHandler(service ports.EventService) *EventHandler {
	return &EventHandler{service: service}
}

func (h *EventHandler) RegisterAdminRoutes(adminGroup *echo.Group) {
	eventsGroup := adminGroup.Group("/events")
	eventsGroup.POST("", h.CreateEvent)
	eventsGroup.GET("", h.ListEvents)
	eventsGroup.GET("/:id", h.GetEvent)
	eventsGroup.PUT("/:id", h.UpdateEvent)
	eventsGroup.DELETE("/:id", h.DeleteEvent)

	// Event Questions (Distribusi Soal)
	eventsGroup.POST("/:id/questions", h.AddEventQuestion)
	eventsGroup.POST("/:id/random-questions", h.AddRandomEventQuestions)
	eventsGroup.GET("/:id/questions", h.ListEventQuestions)
	eventsGroup.DELETE("/:id/questions/:question_id", h.RemoveEventQuestion)

	// Event Participants (Persetujuan Peserta)
	eventsGroup.GET("/:id/participants", h.ListEventParticipants)
	eventsGroup.PUT("/:id/participants/:approval_id/approve", h.ApproveParticipant)

	// Laporan & Export
	eventsGroup.GET("/:id/export", h.ExportParticipantsCSV)
}

func (h *EventHandler) CreateEvent(c echo.Context) error {
	var req domain.CreateEventRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	e, err := h.service.CreateEvent(c.Request().Context(), req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal membuat event", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusCreated, "Event berhasil dibuat", e)
}

func (h *EventHandler) ListEvents(c echo.Context) error {
	page, limit := response.ParsePaginationParams(c)
	events, total, err := h.service.ListEvents(c.Request().Context(), page, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar event", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	if events == nil {
		events = []domain.Event{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar event berhasil diambil", events, meta)
}

func (h *EventHandler) GetEvent(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	e, err := h.service.GetEventById(c.Request().Context(), id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, "Event tidak ditemukan", nil)
	}

	return response.Success(c, http.StatusOK, "Event berhasil diambil", e)
}

func (h *EventHandler) UpdateEvent(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	var req domain.UpdateEventRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	e, err := h.service.UpdateEvent(c.Request().Context(), id, req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memperbarui event", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Event berhasil diperbarui", e)
}

func (h *EventHandler) DeleteEvent(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	err = h.service.DeleteEvent(c.Request().Context(), id)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal menghapus event", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Event berhasil dihapus", nil)
}

func (h *EventHandler) AddEventQuestion(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	var req domain.AddEventQuestionRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	err = h.service.AddEventQuestion(c.Request().Context(), eventID, req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal menambahkan soal", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusCreated, "Soal berhasil ditambahkan ke Event", nil)
}

func (h *EventHandler) AddRandomEventQuestions(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	var req domain.AddRandomEventQuestionsRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	err = h.service.AddRandomEventQuestions(c.Request().Context(), eventID, req)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "Gagal menarik soal acak", []response.ErrorDetail{{Field: "validation", Message: err.Error()}})
	}

	return response.Success(c, http.StatusCreated, "Soal acak berhasil ditambahkan ke Event", nil)
}

func (h *EventHandler) ListEventQuestions(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	page, limit := response.ParsePaginationParams(c)
	questions, total, err := h.service.ListEventQuestions(c.Request().Context(), eventID, page, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil soal event", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	if questions == nil {
		questions = []domain.Question{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar soal event berhasil diambil", questions, meta)
}

func (h *EventHandler) RemoveEventQuestion(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	questionID, err := uuid.Parse(c.Param("question_id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID soal tidak valid", nil)
	}

	err = h.service.RemoveEventQuestion(c.Request().Context(), eventID, questionID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal menghapus soal dari event", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Soal berhasil dihapus dari Event", nil)
}

func (h *EventHandler) ListEventParticipants(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	page, limit := response.ParsePaginationParams(c)
	participants, total, err := h.service.ListEventParticipants(c.Request().Context(), eventID, page, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar peserta", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	if participants == nil {
		participants = []domain.EventParticipant{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar peserta event berhasil diambil", participants, meta)
}

func (h *EventHandler) ApproveParticipant(c echo.Context) error {
	approvalID, err := uuid.Parse(c.Param("approval_id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID approval tidak valid", nil)
	}

	err = h.service.ApproveUserEvent(c.Request().Context(), approvalID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal menyetujui peserta", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Peserta berhasil disetujui (Approved)", nil)
}

func (h *EventHandler) ExportParticipantsCSV(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	csvData, err := h.service.ExportEventParticipantsCSV(c.Request().Context(), eventID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengekspor data peserta", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	// Kembalikan file CSV langsung ke browser untuk di-download
	c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"laporan_event_%s.csv\"", eventID.String()))
	c.Response().Header().Set("Content-Type", "text/csv; charset=utf-8")
	return c.Blob(http.StatusOK, "text/csv", csvData)
}
