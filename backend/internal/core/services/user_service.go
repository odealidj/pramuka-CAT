package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"golang.org/x/crypto/bcrypt"
)

type userService struct {
	repo ports.UserRepository
}

func NewUserService(repo ports.UserRepository) ports.UserService {
	return &userService{repo: repo}
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func (s *userService) CreateUser(ctx context.Context, req domain.CreateUserRequest) (domain.User, error) {
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		return domain.User{}, fmt.Errorf("gagal mengenkripsi kata sandi: %w", err)
	}

	u := domain.User{
		Username: req.Username,
		FullName: req.FullName,
		Role:     req.Role,
		PhotoURL: req.PhotoURL,
	}

	return s.repo.CreateUser(ctx, u, hashedPassword)
}

func (s *userService) GetUserById(ctx context.Context, id uuid.UUID) (domain.User, error) {
	return s.repo.GetUserById(ctx, id)
}

func (s *userService) ListUsers(ctx context.Context, page int32, limit int32, search string) ([]domain.User, int64, error) {
	return s.repo.ListUsers(ctx, page, limit, search)
}

func (s *userService) UpdateUser(ctx context.Context, id uuid.UUID, req domain.UpdateUserRequest) (domain.User, error) {
	_, err := s.repo.GetUserById(ctx, id)
	if err != nil {
		return domain.User{}, fmt.Errorf("user tidak ditemukan")
	}

	u := domain.User{
		Username: req.Username,
		FullName: req.FullName,
		Role:     req.Role,
		PhotoURL: req.PhotoURL,
	}

	return s.repo.UpdateUser(ctx, id, u)
}

func (s *userService) UpdateUserPassword(ctx context.Context, id uuid.UUID, req domain.UpdateUserPasswordRequest) error {
	_, err := s.repo.GetUserById(ctx, id)
	if err != nil {
		return fmt.Errorf("user tidak ditemukan")
	}

	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		return fmt.Errorf("gagal mengenkripsi kata sandi: %w", err)
	}

	return s.repo.UpdateUserPassword(ctx, id, hashedPassword)
}

func (s *userService) UpdateUserPhoto(ctx context.Context, id uuid.UUID, photoUrl string) error {
	_, err := s.repo.GetUserById(ctx, id)
	if err != nil {
		return fmt.Errorf("user tidak ditemukan")
	}
	return s.repo.UpdateUserPhoto(ctx, id, photoUrl)
}

func (s *userService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	_, err := s.repo.GetUserById(ctx, id)
	if err != nil {
		return fmt.Errorf("user tidak ditemukan")
	}

	return s.repo.DeleteUser(ctx, id)
}
