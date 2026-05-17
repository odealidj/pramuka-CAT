package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
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
	events, err := h.service.ListUpcomingEvents(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	if events == nil {
		events = []domain.UpcomingEvent{}
	}

	return c.JSON(http.StatusOK, events)
}

func (h *ExamHandler) ListMyExams(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}

	exams, err := h.service.ListMyExams(c.Request().Context(), userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	if exams == nil {
		exams = []domain.UserApproval{}
	}

	return c.JSON(http.StatusOK, exams)
}

func (h *ExamHandler) Enroll(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}

	var req domain.EnrollEventRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	err = h.service.Enroll(c.Request().Context(), userID, req.EventID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Berhasil mendaftar, menunggu persetujuan Admin"})
}

func (h *ExamHandler) StartExam(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	questions, err := h.service.StartExam(c.Request().Context(), userID, eventID)
	if err != nil {
		return c.JSON(http.StatusForbidden, map[string]string{"error": err.Error()})
	}

	if questions == nil {
		questions = []domain.ParticipantQuestion{}
	}

	return c.JSON(http.StatusOK, questions)
}

func (h *ExamHandler) SubmitAnswer(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	var req domain.SubmitAnswerRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	err = h.service.SubmitAnswer(c.Request().Context(), userID, eventID, req)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, domain.SubmitAnswerResponse{Message: "Jawaban disimpan"})
}

func (h *ExamHandler) FinishExam(c echo.Context) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
	}

	eventID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID event tidak valid"})
	}

	res, err := h.service.FinishExam(c.Request().Context(), userID, eventID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, res)
}
