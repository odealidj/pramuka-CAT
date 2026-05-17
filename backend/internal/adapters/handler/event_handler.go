package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
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
	eventsGroup.GET("/:id/questions", h.ListEventQuestions)
	eventsGroup.DELETE("/:id/questions/:question_id", h.RemoveEventQuestion)

	// Event Participants (Persetujuan Peserta)
	eventsGroup.GET("/:id/participants", h.ListEventParticipants)
	eventsGroup.PUT("/:id/participants/:approval_id/approve", h.ApproveParticipant)
}

func (h *EventHandler) CreateEvent(c echo.Context) error {
	var req domain.CreateEventRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	e, err := h.service.CreateEvent(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, e)
}

func (h *EventHandler) ListEvents(c echo.Context) error {
	events, err := h.service.ListEvents(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	if events == nil {
		events = []domain.Event{}
	}

	return c.JSON(http.StatusOK, events)
}

func (h *EventHandler) GetEvent(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	e, err := h.service.GetEventById(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Event tidak ditemukan"})
	}

	return c.JSON(http.StatusOK, e)
}

func (h *EventHandler) UpdateEvent(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	var req domain.UpdateEventRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	e, err := h.service.UpdateEvent(c.Request().Context(), id, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, e)
}

func (h *EventHandler) DeleteEvent(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	err = h.service.DeleteEvent(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Event berhasil dihapus"})
}

func (h *EventHandler) AddEventQuestion(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	var req domain.AddEventQuestionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	err = h.service.AddEventQuestion(c.Request().Context(), eventID, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, map[string]string{"message": "Soal berhasil ditambahkan ke Event"})
}

func (h *EventHandler) ListEventQuestions(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	questions, err := h.service.ListEventQuestions(c.Request().Context(), eventID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	if questions == nil {
		questions = []domain.Question{}
	}

	return c.JSON(http.StatusOK, questions)
}

func (h *EventHandler) RemoveEventQuestion(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	questionID, err := uuid.Parse(c.Param("question_id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID soal tidak valid"})
	}

	err = h.service.RemoveEventQuestion(c.Request().Context(), eventID, questionID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Soal berhasil dihapus dari Event"})
}

func (h *EventHandler) ListEventParticipants(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	participants, err := h.service.ListEventParticipants(c.Request().Context(), eventID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	if participants == nil {
		participants = []domain.EventParticipant{}
	}

	return c.JSON(http.StatusOK, participants)
}

func (h *EventHandler) ApproveParticipant(c echo.Context) error {
	approvalID, err := uuid.Parse(c.Param("approval_id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID approval tidak valid"})
	}

	err = h.service.ApproveUserEvent(c.Request().Context(), approvalID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Peserta berhasil disetujui (Approved)"})
}
