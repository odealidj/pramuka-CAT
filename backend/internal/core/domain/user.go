package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	PhotoURL  *string   `json:"photo_url,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateUserRequest struct {
	Username string  `json:"username" validate:"required"`
	Password string  `json:"password" validate:"required,min=6"`
	FullName string  `json:"full_name" validate:"required"`
	Role     string  `json:"role" validate:"required,oneof=admin peserta"`
	PhotoURL *string `json:"photo_url,omitempty"`
}

type UpdateUserRequest struct {
	Username string  `json:"username" validate:"required"`
	FullName string  `json:"full_name" validate:"required"`
	Role     string  `json:"role" validate:"required,oneof=admin peserta"`
	PhotoURL *string `json:"photo_url,omitempty"`
}

type UpdateUserPasswordRequest struct {
	Password string `json:"password" validate:"required,min=6"`
}
