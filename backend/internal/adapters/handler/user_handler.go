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

// CreateUser godoc
// @Summary     Buat User Baru
// @Description Admin membuat akun peserta atau admin baru
// @Tags        Admin - User
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       body  body      domain.CreateUserRequest  true  "Data User Baru"
// @Success     201   {object}  response.SuccessResponse{data=domain.User}
// @Failure     400   {object}  response.ErrorResponse
// @Failure     500   {object}  response.ErrorResponse
// @Router      /admin/users [post]
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

// ListUsers godoc
// @Summary     Daftar Semua User
// @Description Mengambil daftar seluruh pengguna dengan paginasi
// @Tags        Admin - User
// @Security    BearerAuth
// @Produce     json
// @Param       page   query     int  false  "Halaman (default: 1)" default(1)
// @Param       limit  query     int  false  "Jumlah per halaman (default: 10)" default(10)
// @Param       search query     string false "Cari nama pengguna"
// @Success     200    {object}  response.PaginatedResponse{data=[]domain.User}
// @Router      /admin/users [get]
func (h *UserHandler) ListUsers(c echo.Context) error {
	page, limit := response.ParsePaginationParams(c)
	search := c.QueryParam("search")
	users, total, err := h.service.ListUsers(c.Request().Context(), page, limit, search)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar user", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	if users == nil {
		users = []domain.User{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar user berhasil diambil", users, meta)
}

// GetUser godoc
// @Summary     Detail User
// @Description Mengambil data detail satu pengguna berdasarkan ID
// @Tags        Admin - User
// @Security    BearerAuth
// @Produce     json
// @Param       id   path      string  true  "UUID User"
// @Success     200  {object}  response.SuccessResponse{data=domain.User}
// @Failure     404  {object}  response.ErrorResponse
// @Router      /admin/users/{id} [get]
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

// UpdateUser godoc
// @Summary     Update Data User
// @Description Admin memperbarui data profil pengguna
// @Tags        Admin - User
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       id    path      string                   true  "UUID User"
// @Param       body  body      domain.UpdateUserRequest  true  "Data yang diperbarui"
// @Success     200   {object}  response.SuccessResponse{data=domain.User}
// @Failure     400   {object}  response.ErrorResponse
// @Router      /admin/users/{id} [put]
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

// UpdateUserPassword godoc
// @Summary     Update Password User
// @Description Admin mengubah kata sandi pengguna
// @Tags        Admin - User
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       id    path      string                           true  "UUID User"
// @Param       body  body      domain.UpdateUserPasswordRequest  true  "Password Baru"
// @Success     200   {object}  response.SuccessResponse
// @Failure     400   {object}  response.ErrorResponse
// @Router      /admin/users/{id}/password [put]
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

// DeleteUser godoc
// @Summary     Hapus User (Soft-Delete)
// @Description Admin menonaktifkan akun pengguna (data tidak benar-benar dihapus)
// @Tags        Admin - User
// @Security    BearerAuth
// @Produce     json
// @Param       id   path      string  true  "UUID User"
// @Success     200  {object}  response.SuccessResponse
// @Failure     404  {object}  response.ErrorResponse
// @Router      /admin/users/{id} [delete]
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
