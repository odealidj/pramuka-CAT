package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
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

func (h *CategoryHandler) CreateCategory(c echo.Context) error {
	var req domain.CreateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	category, err := h.service.CreateCategory(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusCreated, category)
}

func (h *CategoryHandler) ListCategories(c echo.Context) error {
	categories, err := h.service.ListCategories(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}
	
	// Jika kosong, kembalikan array kosong agar tidak null di JSON
	if categories == nil {
	    categories = []domain.Category{}
	}

	return c.JSON(http.StatusOK, categories)
}

func (h *CategoryHandler) UpdateCategory(c echo.Context) error {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID kategori tidak valid"})
	}

	var req domain.UpdateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	category, err := h.service.UpdateCategory(c.Request().Context(), int32(id), req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) DeleteCategory(c echo.Context) error {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "ID kategori tidak valid"})
	}

	err = h.service.DeleteCategory(c.Request().Context(), int32(id))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "Kategori berhasil dihapus"})
}
