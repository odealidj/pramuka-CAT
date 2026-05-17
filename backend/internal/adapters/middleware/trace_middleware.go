package middleware

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

// TraceErrorMiddleware adalah middleware yang menandai span sebagai Error
// untuk semua response HTTP >= 400 (4xx dan 5xx).
//
// Catatan: Secara default, otelecho hanya menandai 5xx sebagai Error
// mengikuti konvensi semantik OTEL (4xx = kesalahan klien, bukan server).
// Middleware ini meng-override perilaku tersebut agar seluruh response
// tidak sukses (>= 400) terlihat merah di Jaeger UI.
func TraceErrorMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Jalankan handler berikutnya
			handlerErr := next(c)

			statusCode := c.Response().Status

			// Jika handler mengembalikan error echo (misal: echo.NewHTTPError),
			// ambil status code dari error tersebut
			if handlerErr != nil {
				if he, ok := handlerErr.(*echo.HTTPError); ok {
					statusCode = he.Code
				}
			}

			// Tandai span sebagai Error untuk semua response >= 400
			if statusCode >= http.StatusBadRequest {
				span := trace.SpanFromContext(c.Request().Context())
				span.SetStatus(
					codes.Error,
					fmt.Sprintf("HTTP %d: %s", statusCode, http.StatusText(statusCode)),
				)
			}

			return handlerErr
		}
	}
}
