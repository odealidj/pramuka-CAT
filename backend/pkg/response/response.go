package response

import (
	"github.com/labstack/echo/v4"
)

// APIResponse represents the standard JSON response format for all API endpoints.
type APIResponse struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	ErrorCode string      `json:"error_code,omitempty"`
	Data      interface{} `json:"data"`
}

// Success is a helper to return a successful response
func Success(c echo.Context, statusCode int, message string, data interface{}) error {
	return c.JSON(statusCode, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// Error is a helper to return an error response
func Error(c echo.Context, statusCode int, message string, errorCode string) error {
	return c.JSON(statusCode, APIResponse{
		Success:   false,
		Message:   message,
		ErrorCode: errorCode,
		Data:      nil,
	})
}
