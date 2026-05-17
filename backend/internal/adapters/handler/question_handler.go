package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type QuestionHandler struct {
	service ports.QuestionService
}

func NewQuestionHandler(service ports.QuestionService) *QuestionHandler {
	return &QuestionHandler{service: service}
}

func (h *QuestionHandler) RegisterAdminRoutes(adminGroup *echo.Group) {
	questionsGroup := adminGroup.Group("/questions")
	questionsGroup.POST("", h.CreateQuestion)
	questionsGroup.GET("", h.ListQuestions)
	questionsGroup.GET("/:id", h.GetQuestion)
	questionsGroup.PUT("/:id", h.UpdateQuestion)
	questionsGroup.DELETE("/:id", h.DeleteQuestion)
}

func (h *QuestionHandler) CreateQuestion(c echo.Context) error {
	var req domain.CreateQuestionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	q, err := h.service.CreateQuestion(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, q)
}

func (h *QuestionHandler) ListQuestions(c echo.Context) error {
	questions, err := h.service.ListQuestions(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	
	if questions == nil {
	    questions = []domain.Question{}
	}

	return c.JSON(http.StatusOK, questions)
}

func (h *QuestionHandler) GetQuestion(c echo.Context) error {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID pertanyaan tidak valid"})
	}

	q, err := h.service.GetQuestionById(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "Pertanyaan tidak ditemukan"})
	}

	return c.JSON(http.StatusOK, q)
}

func (h *QuestionHandler) UpdateQuestion(c echo.Context) error {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID pertanyaan tidak valid"})
	}

	var req domain.UpdateQuestionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	q, err := h.service.UpdateQuestion(c.Request().Context(), id, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, q)
}

func (h *QuestionHandler) DeleteQuestion(c echo.Context) error {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID pertanyaan tidak valid"})
	}

	err = h.service.DeleteQuestion(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Pertanyaan berhasil dihapus"})
}
