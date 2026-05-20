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
	eventsGroup.PUT("/:id/participants/:approval_id/revoke", h.RevokeParticipant)

	// Laporan & Export (GET /admin/events/:id/export?format=excel|pdf)
	eventsGroup.GET("/:id/export", h.ExportParticipants)
}

// CreateEvent godoc
// @Summary     Buat Event Ujian
// @Tags        Admin - Event
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       body  body      domain.CreateEventRequest  true  "Data Event"
// @Success     201   {object}  response.SuccessResponse{data=domain.Event}
// @Router      /admin/events [post]
func (h *EventHandler) CreateEvent(c echo.Context) error {
	var req domain.CreateEventRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	e, err := h.service.CreateEvent(c.Request().Context(), req)
	if err != nil {
		errMsg := err.Error()
		if errMsg == "jadwal ujian dengan nama dan rentang waktu yang sama sudah terdaftar" || errMsg == "waktu selesai (end_time) tidak boleh sebelum waktu mulai (start_time)" {
			return response.Error(c, http.StatusBadRequest, errMsg, nil)
		}
		return response.Error(c, http.StatusInternalServerError, "Gagal membuat event", []response.ErrorDetail{{Field: "server", Message: errMsg}})
	}

	return response.Success(c, http.StatusCreated, "Event berhasil dibuat", e)
}

// ListEvents godoc
// @Summary     Daftar Event Ujian
// @Tags        Admin - Event
// @Security    BearerAuth
// @Produce     json
// @Param       page   query     int  false  "Halaman" default(1)
// @Param       limit  query     int  false  "Limit" default(10)
// @Param       search query     string false "Cari nama event"
// @Success     200    {object}  response.PaginatedResponse{data=[]domain.Event}
// @Router      /admin/events [get]
func (h *EventHandler) ListEvents(c echo.Context) error {
	page, limit := response.ParsePaginationParams(c)
	search := c.QueryParam("search")
	events, total, err := h.service.ListEvents(c.Request().Context(), page, limit, search)
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
		errMsg := err.Error()
		if errMsg == "jadwal ujian dengan nama dan rentang waktu yang sama sudah terdaftar" || errMsg == "waktu selesai (end_time) tidak boleh sebelum waktu mulai (start_time)" {
			return response.Error(c, http.StatusBadRequest, errMsg, nil)
		}
		if errMsg == "event tidak ditemukan" {
			return response.Error(c, http.StatusNotFound, errMsg, nil)
		}
		return response.Error(c, http.StatusInternalServerError, "Gagal memperbarui event", []response.ErrorDetail{{Field: "server", Message: errMsg}})
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

// RevokeParticipant godoc
// @Summary     Batalkan Persetujuan Peserta
// @Description Admin membatalkan (revoke) persetujuan peserta pada event tertentu
// @Tags        Admin - Event
// @Security    BearerAuth
// @Param       id          path      string  true  "UUID Event"
// @Param       approval_id path      string  true  "UUID Approval"
// @Success     200         {object}  response.SuccessResponse
// @Failure     400         {object}  response.ErrorResponse
// @Router      /admin/events/{id}/participants/{approval_id}/revoke [put]
func (h *EventHandler) RevokeParticipant(c echo.Context) error {
	approvalID, err := uuid.Parse(c.Param("approval_id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID approval tidak valid", nil)
	}

	err = h.service.RevokeUserEvent(c.Request().Context(), approvalID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal membatalkan persetujuan peserta", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Persetujuan peserta berhasil dibatalkan (Revoked)", nil)
}

// ExportParticipants godoc
// @Summary     Export Laporan Peserta
// @Description Download rekap nilai peserta dalam format Excel (.xlsx) atau PDF
// @Tags        Admin - Event
// @Security    BearerAuth
// @Produce     application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Param       id      path      string  true   "UUID Event"
// @Param       format  query     string  false  "Format file: excel (default) atau pdf"
// @Success     200     {file}    binary
// @Failure     400     {object}  response.ErrorResponse
// @Router      /admin/events/{id}/export [get]
func (h *EventHandler) ExportParticipants(c echo.Context) error {
	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	format := c.QueryParam("format")
	if format == "" {
		format = "excel" // default ke Excel
	}

	switch format {
	case "excel":
		data, err := h.service.ExportEventParticipantsExcel(c.Request().Context(), eventID)
		if err != nil {
			return response.Error(c, http.StatusInternalServerError, "Gagal mengekspor Excel", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
		}
		filename := fmt.Sprintf("laporan_event_%s.xlsx", eventID.String())
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		return c.Blob(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", data)

	case "pdf":
		data, err := h.service.ExportEventParticipantsPDF(c.Request().Context(), eventID)
		if err != nil {
			return response.Error(c, http.StatusInternalServerError, "Gagal mengekspor PDF", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
		}
		filename := fmt.Sprintf("laporan_event_%s.pdf", eventID.String())
		c.Response().Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
		return c.Blob(http.StatusOK, "application/pdf", data)

	default:
		return response.Error(c, http.StatusBadRequest, "Format tidak valid. Gunakan ?format=excel atau ?format=pdf", nil)
	}
}
