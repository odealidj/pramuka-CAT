package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/response"
)

type ExamHandler struct {
	service ports.ExamService
}

func NewExamHandler(service ports.ExamService) *ExamHandler {
	return &ExamHandler{service: service}
}

func (h *ExamHandler) RegisterParticipantRoutes(protectedGroup *echo.Group) {
	examsGroup := protectedGroup.Group("/exams")
	examsGroup.GET("/upcoming", h.ListUpcomingEvents)
	examsGroup.GET("/my-exams", h.ListMyExams)
	examsGroup.POST("/enroll", h.Enroll)

	// Ujian sedang berlangsung
	examsGroup.GET("/:id/start", h.StartExam)
	examsGroup.POST("/:id/submit-answer", h.SubmitAnswer)
	examsGroup.POST("/:id/finish", h.FinishExam)
}

func getUserIDFromContext(c echo.Context) (uuid.UUID, error) {
	userIDStr := c.Get("user_id").(string)
	return uuid.Parse(userIDStr)
}

func (h *ExamHandler) ListUpcomingEvents(c echo.Context) error {
	page, limit := response.ParsePaginationParams(c)
	events, total, err := h.service.ListUpcomingEvents(c.Request().Context(), page, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil event mendatang", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	if events == nil {
		events = []domain.UpcomingEvent{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar event mendatang berhasil diambil", events, meta)
}

func (h *ExamHandler) ListMyExams(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, "Unauthorized", nil)
	}

	page, limit := response.ParsePaginationParams(c)
	exams, total, err := h.service.ListMyExams(c.Request().Context(), userID, page, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar ujian", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	if exams == nil {
		exams = []domain.UserApproval{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar ujian berhasil diambil", exams, meta)
}

func (h *ExamHandler) Enroll(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, "Unauthorized", nil)
	}

	var req domain.EnrollEventRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	err = h.service.Enroll(c.Request().Context(), userID, req.EventID)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "Gagal mendaftar event", []response.ErrorDetail{{Field: "event", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Berhasil mendaftar, menunggu persetujuan Admin", nil)
}

func (h *ExamHandler) StartExam(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, "Unauthorized", nil)
	}

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	questions, err := h.service.StartExam(c.Request().Context(), userID, eventID)
	if err != nil {
		return response.Error(c, http.StatusForbidden, "Tidak dapat memulai ujian", []response.ErrorDetail{{Field: "exam", Message: err.Error()}})
	}

	if questions == nil {
		questions = []domain.ParticipantQuestion{}
	}

	return response.Success(c, http.StatusOK, "Ujian dimulai", questions)
}

func (h *ExamHandler) SubmitAnswer(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, "Unauthorized", nil)
	}

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	var req domain.SubmitAnswerRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	err = h.service.SubmitAnswer(c.Request().Context(), userID, eventID, req)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "Gagal menyimpan jawaban", []response.ErrorDetail{{Field: "answer", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Jawaban disimpan", nil)
}

func (h *ExamHandler) FinishExam(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, "Unauthorized", nil)
	}

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID event tidak valid", nil)
	}

	res, err := h.service.FinishExam(c.Request().Context(), userID, eventID)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "Gagal menyelesaikan ujian", []response.ErrorDetail{{Field: "exam", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Ujian selesai", res)
}
