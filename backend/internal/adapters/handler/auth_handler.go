package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
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

// Login menangani HTTP POST request untuk proses autentikasi
func (h *AuthHandler) Login(c echo.Context) error {
	var req domain.LoginRequest
	
	// Bind payload JSON ke Struct
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	// Teruskan request ke lapisan Service
	resp, err := h.service.Login(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Login berhasil",
		"data":    resp,
	})
}

// Refresh menangani HTTP POST request untuk perpanjangan Access Token
func (h *AuthHandler) Refresh(c echo.Context) error {
	var req domain.RefreshRequest
	
	// Bind payload JSON ke Struct
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Format request tidak valid"})
	}

	// Teruskan request ke lapisan Service
	resp, err := h.service.Refresh(c.Request().Context(), req)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": err.Error()})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Token berhasil diperbarui",
		"data":    resp,
	})
}
