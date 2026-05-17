package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/response"
)

type UserHandler struct {
	service ports.UserService
}

func NewUserHandler(service ports.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) RegisterAdminRoutes(adminGroup *echo.Group) {
	usersGroup := adminGroup.Group("/users")
	usersGroup.POST("", h.CreateUser)
	usersGroup.GET("", h.ListUsers)
	usersGroup.GET("/:id", h.GetUser)
	usersGroup.PUT("/:id", h.UpdateUser)
	usersGroup.PUT("/:id/password", h.UpdateUserPassword)
	usersGroup.DELETE("/:id", h.DeleteUser)
}

func (h *UserHandler) CreateUser(c echo.Context) error {
	var req domain.CreateUserRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	u, err := h.service.CreateUser(c.Request().Context(), req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal membuat user", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusCreated, "User berhasil dibuat", u)
}

func (h *UserHandler) ListUsers(c echo.Context) error {
	page, limit := response.ParsePaginationParams(c)
	users, total, err := h.service.ListUsers(c.Request().Context(), page, limit)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar user", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	if users == nil {
		users = []domain.User{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar user berhasil diambil", users, meta)
}

func (h *UserHandler) GetUser(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID user tidak valid", nil)
	}

	u, err := h.service.GetUserById(c.Request().Context(), id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, "User tidak ditemukan", nil)
	}

	return response.Success(c, http.StatusOK, "User berhasil diambil", u)
}

func (h *UserHandler) UpdateUser(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID user tidak valid", nil)
	}

	var req domain.UpdateUserRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	u, err := h.service.UpdateUser(c.Request().Context(), id, req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memperbarui user", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "User berhasil diperbarui", u)
}

func (h *UserHandler) UpdateUserPassword(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID user tidak valid", nil)
	}

	var req domain.UpdateUserPasswordRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	err = h.service.UpdateUserPassword(c.Request().Context(), id, req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memperbarui kata sandi user", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Kata sandi user berhasil diperbarui", nil)
}

func (h *UserHandler) DeleteUser(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID user tidak valid", nil)
	}

	err = h.service.DeleteUser(c.Request().Context(), id)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal menghapus user", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "User berhasil dihapus", nil)
}
