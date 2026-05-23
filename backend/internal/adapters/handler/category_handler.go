package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/jung-kurt/gofpdf"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/response"
	"github.com/xuri/excelize/v2"
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
	categoriesGroup.GET("/export/excel", h.ExportCategoriesExcel)
	categoriesGroup.GET("/export/pdf", h.ExportCategoriesPDF)
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
		if strings.Contains(err.Error(), "kosong") || strings.Contains(err.Error(), "sudah ada") {
			return response.Error(c, http.StatusBadRequest, err.Error(), nil)
		}
		return response.Error(c, http.StatusInternalServerError, "Gagal membuat kategori", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusCreated, "Kategori berhasil dibuat", category)
}

// ListCategories godoc
// @Summary     Daftar Kategori Soal
// @Tags        Admin - Kategori
// @Security    BearerAuth
// @Produce     json
// @Param       page   query     int  false  "Halaman" default(1)
// @Param       limit  query     int  false  "Limit" default(10)
// @Param       search query     string false "Cari nama kategori"
// @Success     200    {object}  response.PaginatedResponse{data=[]domain.Category}
// @Router      /admin/categories [get]
func (h *CategoryHandler) ListCategories(c echo.Context) error {
	page, limit := response.ParsePaginationParams(c)
	search := c.QueryParam("search")
	categories, total, err := h.service.ListCategories(c.Request().Context(), page, limit, search)
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
		if strings.Contains(err.Error(), "kosong") || strings.Contains(err.Error(), "sudah ada") || strings.Contains(err.Error(), "tidak ditemukan") {
			return response.Error(c, http.StatusBadRequest, err.Error(), nil)
		}
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

func (h *CategoryHandler) ExportCategoriesExcel(c echo.Context) error {
	categories, _, err := h.service.ListCategories(c.Request().Context(), 1, 1000000, "")
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memuat kategori", nil)
	}

	f := excelize.NewFile()
	sheetName := "Kategori Soal"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"No", "ID", "Nama Kategori", "Jumlah Soal"}
	for i, header := range headers {
		col := string(rune('A'+i)) + "1"
		f.SetCellValue(sheetName, col, header)
	}

	for i, cat := range categories {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), cat.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), cat.Name)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), cat.QuestionCount)
	}

	c.Response().Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=Kategori_Soal.xlsx")

	return f.Write(c.Response().Writer)
}

func (h *CategoryHandler) ExportCategoriesPDF(c echo.Context) error {
	categories, _, err := h.service.ListCategories(c.Request().Context(), 1, 1000000, "")
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memuat kategori", nil)
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(190, 10, "Daftar Kategori Soal", "", 0, "C", false, 0, "")
	pdf.Ln(15)

	// Headers
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(15, 10, "No", "1", 0, "C", false, 0, "")
	pdf.CellFormat(20, 10, "ID", "1", 0, "C", false, 0, "")
	pdf.CellFormat(115, 10, "Nama Kategori", "1", 0, "L", false, 0, "")
	pdf.CellFormat(40, 10, "Jumlah Soal", "1", 0, "C", false, 0, "")
	pdf.Ln(-1)

	// Rows
	pdf.SetFont("Arial", "", 12)
	for i, cat := range categories {
		pdf.CellFormat(15, 10, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(20, 10, fmt.Sprintf("%d", cat.ID), "1", 0, "C", false, 0, "")
		pdf.CellFormat(115, 10, cat.Name, "1", 0, "L", false, 0, "")
		pdf.CellFormat(40, 10, fmt.Sprintf("%d", cat.QuestionCount), "1", 0, "C", false, 0, "")
		pdf.Ln(-1)
	}

	c.Response().Header().Set("Content-Type", "application/pdf")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=Kategori_Soal.pdf")

	return pdf.Output(c.Response().Writer)
}
