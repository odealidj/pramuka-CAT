package handler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/response"
)

type AuthHandler struct {
	service ports.AuthService
}

// NewAuthHandler membuat instance Inbound Adapter untuk Autentikasi
func NewAuthHandler(service ports.AuthService) *AuthHandler {
	return &AuthHandler{
		service: service,
	}
}

// RegisterRoutes mendaftarkan rute Autentikasi ke Echo router group
func (h *AuthHandler) RegisterRoutes(g *echo.Group) {
	authGroup := g.Group("/auth")
	authGroup.POST("/login", h.Login)
	authGroup.POST("/refresh", h.Refresh)
}

func (h *AuthHandler) RegisterProtectedRoutes(g *echo.Group) {
	authGroup := g.Group("/auth")
	authGroup.POST("/logout", h.Logout)
}

func (h *AuthHandler) Logout(c echo.Context) error {
	sessionIDStr := c.Get("session_id").(string)
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "Sesi tidak valid", nil)
	}

	err = h.service.Logout(c.Request().Context(), sessionID)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal logout", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Logout berhasil", nil)
}

// Login menangani HTTP POST request untuk proses autentikasi
func (h *AuthHandler) Login(c echo.Context) error {
	var req domain.LoginRequest
	
	// Bind payload JSON ke Struct
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	// Teruskan request ke lapisan Service
	resp, err := h.service.Login(c.Request().Context(), req)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, "Login gagal", []response.ErrorDetail{{Field: "credentials", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Login berhasil", resp)
}

// Refresh menangani HTTP POST request untuk perpanjangan Access Token
func (h *AuthHandler) Refresh(c echo.Context) error {
	var req domain.RefreshRequest
	
	// Bind payload JSON ke Struct
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	// Teruskan request ke lapisan Service
	resp, err := h.service.Refresh(c.Request().Context(), req)
	if err != nil {
		return response.Error(c, http.StatusUnauthorized, "Gagal memperbarui token", []response.ErrorDetail{{Field: "token", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Token berhasil diperbarui", resp)
}
