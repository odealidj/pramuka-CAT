package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/response"
)

type CategoryHandler struct {
	service ports.CategoryService
}

func NewCategoryHandler(service ports.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

func (h *CategoryHandler) RegisterAdminRoutes(adminGroup *echo.Group) {
	categoriesGroup := adminGroup.Group("/categories")
	categoriesGroup.POST("", h.CreateCategory)
	categoriesGroup.GET("", h.ListCategories)
	categoriesGroup.PUT("/:id", h.UpdateCategory)
	categoriesGroup.DELETE("/:id", h.DeleteCategory)
}

// CreateCategory godoc
// @Summary     Buat Kategori Soal
// @Tags        Admin - Kategori
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       body  body      domain.CreateCategoryRequest  true  "Nama Kategori"
// @Success     201   {object}  response.SuccessResponse{data=domain.Category}
// @Router      /admin/categories [post]
func (h *CategoryHandler) CreateCategory(c echo.Context) error {
	var req domain.CreateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	category, err := h.service.CreateCategory(c.Request().Context(), req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal membuat kategori", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusCreated, "Kategori berhasil dibuat", category)
}

// ListCategories godoc
// @Summary     Daftar Kategori Soal
// @Tags        Admin - Kategori
// @Security    BearerAuth
// @Produce     json
// @Param       page   query     int  false  "Halaman"
// @Param       limit  query     int  false  "Limit"
// @Success     200    {object}  response.PaginatedResponse{data=[]domain.Category}
// @Router      /admin/categories [get]
func (h *CategoryHandler) ListCategories(c echo.Context) error {
	page, limit := response.ParsePaginationParams(c)
	categories, total, err := h.service.ListCategories(c.Request().Context(), page, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar kategori", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}
	
	if categories == nil {
	    categories = []domain.Category{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar kategori berhasil diambil", categories, meta)
}

// UpdateCategory godoc
// @Summary     Update Kategori Soal
// @Tags        Admin - Kategori
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       id    path      int                           true  "ID Kategori"
// @Param       body  body      domain.UpdateCategoryRequest  true  "Nama Baru"
// @Success     200   {object}  response.SuccessResponse{data=domain.Category}
// @Router      /admin/categories/{id} [put]
func (h *CategoryHandler) UpdateCategory(c echo.Context) error {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID kategori tidak valid", nil)
	}

	var req domain.UpdateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	category, err := h.service.UpdateCategory(c.Request().Context(), int32(id), req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memperbarui kategori", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Kategori berhasil diperbarui", category)
}

// DeleteCategory godoc
// @Summary     Hapus Kategori Soal
// @Tags        Admin - Kategori
// @Security    BearerAuth
// @Produce     json
// @Param       id   path      int  true  "ID Kategori"
// @Success     200  {object}  response.SuccessResponse
// @Router      /admin/categories/{id} [delete]
func (h *CategoryHandler) DeleteCategory(c echo.Context) error {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID kategori tidak valid", nil)
	}

	err = h.service.DeleteCategory(c.Request().Context(), int32(id))
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal menghapus kategori", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Kategori berhasil dihapus", nil)
}
