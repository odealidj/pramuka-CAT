package handler

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"
	"github.com/labstack/echo/v4"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/response"
	"github.com/xuri/excelize/v2"
)

type QuestionHandler struct {
	service ports.QuestionService
}

func NewQuestionHandler(service ports.QuestionService) *QuestionHandler {
	return &QuestionHandler{service: service}
}

func (h *QuestionHandler) RegisterAdminRoutes(adminGroup *echo.Group) {
	questionsGroup := adminGroup.Group("/questions")
	questionsGroup.POST("", h.CreateQuestion)
	questionsGroup.GET("", h.ListQuestions)
	questionsGroup.GET("/export/excel", h.ExportQuestionsExcel)
	questionsGroup.GET("/export/pdf", h.ExportQuestionsPDF)
	questionsGroup.GET("/:id", h.GetQuestion)
	questionsGroup.PUT("/:id", h.UpdateQuestion)
	questionsGroup.DELETE("/:id", h.DeleteQuestion)
	questionsGroup.POST("/import/preview", h.PreviewImport)
	questionsGroup.POST("/import/confirm", h.ConfirmImport)
}

// CreateQuestion godoc
// @Summary     Buat Soal Baru
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       body  body      domain.CreateQuestionRequest  true  "Data Soal"
// @Success     201   {object}  response.SuccessResponse{data=domain.Question}
// @Router      /admin/questions [post]
func (h *QuestionHandler) CreateQuestion(c echo.Context) error {
	var req domain.CreateQuestionRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	q, err := h.service.CreateQuestion(c.Request().Context(), req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		errMsg := "Gagal membuat pertanyaan"
		if err.Error() == "soal dengan pertanyaan serupa sudah terdaftar" || err.Error() == "teks pertanyaan tidak boleh kosong" {
			statusCode = http.StatusBadRequest
			errMsg = err.Error()
		}
		return response.Error(c, statusCode, errMsg, []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusCreated, "Pertanyaan berhasil dibuat", q)
}

// ListQuestions godoc
// @Summary     Daftar Soal
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Produce     json
// @Param       page   query     int  false  "Halaman" default(1)
// @Param       limit  query     int  false  "Limit" default(10)
// @Param       search query     string false "Cari teks pertanyaan"
// @Success     200    {object}  response.PaginatedResponse{data=[]domain.Question}
// @Router      /admin/questions [get]
func (h *QuestionHandler) ListQuestions(c echo.Context) error {
	page, limit := response.ParsePaginationParams(c)
	search := c.QueryParam("search")
	var categoryId *int32
	if catStr := c.QueryParam("category_id"); catStr != "" {
		var cat int
		_, err := fmt.Sscanf(catStr, "%d", &cat)
		if err == nil {
			cInt := int32(cat)
			categoryId = &cInt
		}
	}
	questions, total, err := h.service.ListQuestions(c.Request().Context(), page, limit, search, categoryId)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal mengambil daftar pertanyaan", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	if questions == nil {
		questions = []domain.Question{}
	}

	meta := response.BuildMeta(page, limit, total)
	return response.SuccessWithMeta(c, http.StatusOK, "Daftar pertanyaan berhasil diambil", questions, meta)
}

// GetQuestion godoc
// @Summary     Detail Soal
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Produce     json
// @Param       id   path      string  true  "UUID Soal"
// @Success     200  {object}  response.SuccessResponse{data=domain.Question}
// @Router      /admin/questions/{id} [get]
func (h *QuestionHandler) GetQuestion(c echo.Context) error {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID pertanyaan tidak valid", nil)
	}

	q, err := h.service.GetQuestionById(c.Request().Context(), id)
	if err != nil {
		return response.Error(c, http.StatusNotFound, "Pertanyaan tidak ditemukan", nil)
	}

	return response.Success(c, http.StatusOK, "Pertanyaan berhasil diambil", q)
}

// UpdateQuestion godoc
// @Summary     Update Soal
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       id    path      string                       true  "UUID Soal"
// @Param       body  body      domain.UpdateQuestionRequest  true  "Data Soal Baru"
// @Success     200   {object}  response.SuccessResponse{data=domain.Question}
// @Router      /admin/questions/{id} [put]
func (h *QuestionHandler) UpdateQuestion(c echo.Context) error {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID pertanyaan tidak valid", nil)
	}

	var req domain.UpdateQuestionRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format request tidak valid", nil)
	}

	q, err := h.service.UpdateQuestion(c.Request().Context(), id, req)
	if err != nil {
		statusCode := http.StatusInternalServerError
		errMsg := "Gagal memperbarui pertanyaan"
		if err.Error() == "soal dengan pertanyaan serupa sudah terdaftar" {
			statusCode = http.StatusBadRequest
			errMsg = err.Error()
		}
		return response.Error(c, statusCode, errMsg, []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Pertanyaan berhasil diperbarui", q)
}

// DeleteQuestion godoc
// @Summary     Hapus Soal
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Produce     json
// @Param       id   path      string  true  "UUID Soal"
// @Success     200  {object}  response.SuccessResponse
// @Router      /admin/questions/{id} [delete]
func (h *QuestionHandler) DeleteQuestion(c echo.Context) error {
	idParam := c.Param("id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "ID pertanyaan tidak valid", nil)
	}

	err = h.service.DeleteQuestion(c.Request().Context(), id)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal menghapus pertanyaan", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	return response.Success(c, http.StatusOK, "Pertanyaan berhasil dihapus", nil)
}

// PreviewImport godoc
// @Summary     Preview Import Soal via Excel
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Accept      mpfd
// @Produce     json
// @Param       file formData file true "File Excel (.xlsx)"
// @Success     200  {object}  response.SuccessResponse{data=domain.ImportQuestionsPreviewResponse}
// @Router      /admin/questions/import/preview [post]
func (h *QuestionHandler) PreviewImport(c echo.Context) error {
	file, err := c.FormFile("file")
	if err != nil {
		return response.Error(c, http.StatusBadRequest, "File tidak ditemukan dalam request", nil)
	}

	src, err := file.Open()
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal membuka file upload", nil)
	}
	defer src.Close()

	// Baca seluruh byte file ke memori
	fileData := make([]byte, file.Size)
	_, err = src.Read(fileData)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal membaca isi file", nil)
	}

	res, err := h.service.PreviewImportExcel(c.Request().Context(), fileData)
	if err != nil {
		return response.Error(c, http.StatusBadRequest, err.Error(), nil)
	}

	// Walaupun ada yang error per baris, kita tetap merespons 200 OK karena API berhasil memproses validasi,
	// Namun kita beri response kode khusus (misal 422) jika errorRows > 0 sesuai kesepakatan agar mudah dibaca Frontend
	if res.ErrorRows > 0 {
		return c.JSON(http.StatusUnprocessableEntity, map[string]interface{}{
			"status":  "error",
			"message": "Terdapat baris data yang tidak valid. Silakan periksa kembali.",
			"data":    res,
		})
	}

	return response.Success(c, http.StatusOK, "Preview file berhasil divalidasi", res)
}

// ConfirmImport godoc
// @Summary     Konfirmasi Simpan Import Soal
// @Tags        Admin - Bank Soal
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       body body domain.ConfirmImportRequest true "Data Soal Valid"
// @Success     200  {object}  response.SuccessResponse
// @Router      /admin/questions/import/confirm [post]
func (h *QuestionHandler) ConfirmImport(c echo.Context) error {
	var req domain.ConfirmImportRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, http.StatusBadRequest, "Format JSON tidak valid", nil)
	}

	count, err := h.service.ConfirmImportExcel(c.Request().Context(), req)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal menyimpan import", []response.ErrorDetail{{Field: "server", Message: err.Error()}})
	}

	msg := fmt.Sprintf("%d soal berhasil di-import", count)
	return response.Success(c, http.StatusCreated, msg, nil)
}

func (h *QuestionHandler) ExportQuestionsExcel(c echo.Context) error {
	search := c.QueryParam("search")
	var categoryId *int32
	if catStr := c.QueryParam("category_id"); catStr != "" {
		var cat int
		_, err := fmt.Sscanf(catStr, "%d", &cat)
		if err == nil {
			cInt := int32(cat)
			categoryId = &cInt
		}
	}

	questions, _, err := h.service.ListQuestions(c.Request().Context(), 1, 1000000, search, categoryId)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memuat soal", nil)
	}

	f := excelize.NewFile()
	sheetName := "Bank Soal"
	f.SetSheetName("Sheet1", sheetName)

	headers := []string{"Kategori ID", "Teks Soal", "Opsi A", "Opsi B", "Opsi C", "Opsi D", "Kunci Jawaban", "Bobot Nilai"}
	for i, header := range headers {
		col := string(rune('A'+i)) + "1"
		f.SetCellValue(sheetName, col, header)
	}

	for i, q := range questions {
		row := i + 2
		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), q.CategoryID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), q.QuestionText)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), q.OptionA)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), q.OptionB)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), q.OptionC)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), q.OptionD)
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", row), q.CorrectAnswer)
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", row), q.Weight)
	}

	c.Response().Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=Bank_Soal.xlsx")

	return f.Write(c.Response().Writer)
}

func (h *QuestionHandler) ExportQuestionsPDF(c echo.Context) error {
	search := c.QueryParam("search")
	var categoryId *int32
	if catStr := c.QueryParam("category_id"); catStr != "" {
		var cat int
		_, err := fmt.Sscanf(catStr, "%d", &cat)
		if err == nil {
			cInt := int32(cat)
			categoryId = &cInt
		}
	}

	questions, _, err := h.service.ListQuestions(c.Request().Context(), 1, 1000000, search, categoryId)
	if err != nil {
		return response.Error(c, http.StatusInternalServerError, "Gagal memuat soal", nil)
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(190, 10, "Daftar Bank Soal", "", 0, "C", false, 0, "")
	pdf.Ln(15)

	pdf.SetFont("Arial", "B", 10)
	pdf.CellFormat(10, 10, "No", "1", 0, "C", false, 0, "")
	pdf.CellFormat(20, 10, "Kat ID", "1", 0, "C", false, 0, "")
	pdf.CellFormat(140, 10, "Teks Soal", "1", 0, "L", false, 0, "")
	pdf.CellFormat(20, 10, "Kunci", "1", 0, "C", false, 0, "")
	pdf.Ln(-1)

	pdf.SetFont("Arial", "", 10)
	for i, q := range questions {
		// Calculate height for text wrapping
		lines := pdf.SplitText(q.QuestionText, 140)
		h := float64(len(lines)) * 6
		if h < 10 {
			h = 10
		}
		
		// Get current Y, check if need page break
		if pdf.GetY()+h > 270 {
			pdf.AddPage()
		}
		
		x, y := pdf.GetXY()
		
		pdf.Rect(x, y, 10, h, "D")
		pdf.SetXY(x, y+(h-6)/2)
		pdf.CellFormat(10, 6, fmt.Sprintf("%d", i+1), "", 0, "C", false, 0, "")
		
		pdf.SetXY(x+10, y)
		pdf.Rect(x+10, y, 20, h, "D")
		pdf.SetXY(x+10, y+(h-6)/2)
		pdf.CellFormat(20, 6, fmt.Sprintf("%d", q.CategoryID), "", 0, "C", false, 0, "")
		
		pdf.SetXY(x+30, y)
		pdf.Rect(x+30, y, 140, h, "D")
		pdf.MultiCell(140, 6, q.QuestionText, "", "L", false)
		
		pdf.SetXY(x+170, y)
		pdf.Rect(x+170, y, 20, h, "D")
		pdf.SetXY(x+170, y+(h-6)/2)
		pdf.CellFormat(20, 6, q.CorrectAnswer, "", 0, "C", false, 0, "")
		
		pdf.SetXY(x, y+h)
	}

	c.Response().Header().Set("Content-Type", "application/pdf")
	c.Response().Header().Set("Content-Disposition", "attachment; filename=Bank_Soal.pdf")

	return pdf.Output(c.Response().Writer)
}
