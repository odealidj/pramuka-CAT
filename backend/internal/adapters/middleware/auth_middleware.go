package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/utils"
)

const (
	authorizationHeaderKey  = "authorization"
	authorizationTypeBearer = "bearer"
	AuthorizationPayloadKey = "authorization_payload" // Diekspor agar bisa diakses oleh handler jika butuh data UserID
)

// RequireAuth adalah Gatekeeper utama yang memvalidasi JWT sekaligus memastikannya masih "Stateful" (Ada di Redis)
func RequireAuth(cache ports.AuthCache) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get(authorizationHeaderKey)

			if len(authHeader) == 0 {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Header otorisasi tidak disertakan"})
			}

			fields := strings.Fields(authHeader)
			if len(fields) < 2 {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Format header otorisasi tidak valid"})
			}

			authType := strings.ToLower(fields[0])
			if authType != authorizationTypeBearer {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Tipe otorisasi tidak didukung (harus Bearer)"})
			}

			accessToken := fields[1]
			payload, err := utils.ValidateToken(accessToken, false)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Token tidak valid atau kedaluwarsa"})
			}

			// Pengecekan krusial: Memastikan sesi ID yang ada di token JWT belum dicabut di memori Redis
			_, err = cache.GetSession(context.Background(), payload.SessionID)
			if err != nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Sesi telah berakhir atau ditolak server"})
			}

			// Menitipkan data (UserID, Role, dll) ke dalam Context Request
			c.Set(AuthorizationPayloadKey, payload)
			return next(c)
		}
	}
}

// RequireRole adalah pelindung rute berbasis peran (Role-Based Access Control)
func RequireRole(allowedRoles ...string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Mengambil Payload dari Context (pastikan middleware RequireAuth dijalankan lebih dulu!)
			payloadValue := c.Get(AuthorizationPayloadKey)
			if payloadValue == nil {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Tidak terautentikasi"})
			}

			payload, ok := payloadValue.(*utils.TokenPayload)
			if !ok {
				return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Terjadi kesalahan internal server membaca sesi"})
			}

			roleMatched := false
			for _, role := range allowedRoles {
				if payload.Role == role {
					roleMatched = true
					break
				}
			}

			if !roleMatched {
				return c.JSON(http.StatusForbidden, map[string]string{"error": "Akses ditolak: Wewenang Anda tidak cukup untuk rute ini"})
			}

			return next(c)
		}
	}
}
