package handler

import (
	"net/http"
	"strconv"

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

// GetActivities godoc
// @Summary     Dapatkan Log Aktivitas Dashboard
// @Description Endpoint khusus Admin/Super Admin untuk menampilkan semua log aktivitas secara paginasi.
// @Tags        Admin - Dashboard
// @Security    BearerAuth
// @Produce     json
// @Param       page query int false "Nomor halaman" default(1)
// @Param       limit query int false "Jumlah data per halaman" default(10)
// @Success     200 {object} response.SuccessResponse
// @Failure     500 {object} response.ErrorResponse
// @Router      /admin/dashboard/activities [get]
func (h *DashboardHandler) GetActivities(c echo.Context) error {
	page, _ := strconv.Atoi(c.QueryParam("page"))
	limit, _ := strconv.Atoi(c.QueryParam("limit"))

	data, err := h.service.ListActivities(c.Request().Context(), int32(page), int32(limit))
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memuat log aktivitas", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Log aktivitas berhasil dimuat", data)
}

func (h *DashboardHandler) RegisterRoutes(g *echo.Group) {
	dashboardGroup := g.Group("/dashboard")
	dashboardGroup.GET("/stats", h.GetStats)
	dashboardGroup.GET("/activities", h.GetActivities)
}
