package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/response"
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

// CreateQuestion godoc
// @Summary     Buat Soal Baru
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       body  body      domain.CreateQuestionRequest  true  "Data Soal"
// @Success     201   {object}  response.SuccessResponse{data=domain.Question}
// @Router      /admin/questions [post]
func (h *QuestionHandler) CreateQuestion(c echo.Context) error {
	var req domain.CreateQuestionRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	q, err := h.service.CreateQuestion(c.Request().Context(), req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal membuat pertanyaan", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusCreated, "Pertanyaan berhasil dibuat", q)
}

// ListQuestions godoc
// @Summary     Daftar Soal
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Produce     json
// @Param       page   query     int  false  "Halaman" default(1)
// @Param       limit  query     int  false  "Limit" default(10)
// @Success     200    {object}  response.PaginatedResponse{data=[]domain.Question}
// @Router      /admin/questions [get]
func (h *QuestionHandler) ListQuestions(c echo.Context) error {
	page, limit := response.ParsePaginationParams(c)
	questions, total, err := h.service.ListQuestions(c.Request().Context(), page, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar pertanyaan", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}
	
	if questions == nil {
	    questions = []domain.Question{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar pertanyaan berhasil diambil", questions, meta)
}

// GetQuestion godoc
// @Summary     Detail Soal
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Produce     json
// @Param       id   path      string  true  "UUID Soal"
// @Success     200  {object}  response.SuccessResponse{data=domain.Question}
// @Router      /admin/questions/{id} [get]
func (h *QuestionHandler) GetQuestion(c echo.Context) error {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID pertanyaan tidak valid", nil)
	}

	q, err := h.service.GetQuestionById(c.Request().Context(), id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, "Pertanyaan tidak ditemukan", nil)
	}

	return response.Success(c, http.StatusOK, "Pertanyaan berhasil diambil", q)
}

// UpdateQuestion godoc
// @Summary     Update Soal
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       id    path      string                       true  "UUID Soal"
// @Param       body  body      domain.UpdateQuestionRequest  true  "Data Soal Baru"
// @Success     200   {object}  response.SuccessResponse{data=domain.Question}
// @Router      /admin/questions/{id} [put]
func (h *QuestionHandler) UpdateQuestion(c echo.Context) error {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID pertanyaan tidak valid", nil)
	}

	var req domain.UpdateQuestionRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	q, err := h.service.UpdateQuestion(c.Request().Context(), id, req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memperbarui pertanyaan", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Pertanyaan berhasil diperbarui", q)
}

// DeleteQuestion godoc
// @Summary     Hapus Soal
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Produce     json
// @Param       id   path      string  true  "UUID Soal"
// @Success     200  {object}  response.SuccessResponse
// @Router      /admin/questions/{id} [delete]
func (h *QuestionHandler) DeleteQuestion(c echo.Context) error {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID pertanyaan tidak valid", nil)
	}

	err = h.service.DeleteQuestion(c.Request().Context(), id)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal menghapus pertanyaan", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Pertanyaan berhasil dihapus", nil)
}
