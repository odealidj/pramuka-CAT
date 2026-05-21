package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/response"
)

type DashboardHandler struct {
	service ports.DashboardService
}

func NewDashboardHandler(service ports.DashboardService) *DashboardHandler {
	return &DashboardHandler{
		service: service,
	}
}

// GetStats godoc
// @Summary     Dapatkan Statistik Dashboard
// @Description Endpoint khusus Admin/Super Admin untuk menampilkan statistik dashboard (peserta, event, bank soal, dan log aktivitas terkini).
// @Tags        Admin - Dashboard
// @Security    BearerAuth
// @Produce     json
// @Success     200 {object} response.SuccessResponse
// @Failure     500 {object} response.ErrorResponse
// @Router      /admin/dashboard/stats [get]
func (h *DashboardHandler) GetStats(c echo.Context) error {
	data, err := h.service.GetDashboardData(c.Request().Context())
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memuat statistik dashboard", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Statistik dashboard berhasil dimuat", data)
}

func (h *DashboardHandler) RegisterRoutes(g *echo.Group) {
	dashboardGroup := g.Group("/dashboard")
	dashboardGroup.GET("/stats", h.GetStats)
}
