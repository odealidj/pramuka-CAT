package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
	"github.com/odealidj/pramuka-CAT/backend/pkg/utils"
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

	emailStr := req.Email
	emailPtr := &emailStr
	if req.Email == "" {
		emailPtr = nil
	}

	u := domain.User{
		Username: req.Username,
		Email:    emailPtr,
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

func (s *userService) ListAdmins(ctx context.Context, page int32, limit int32, search string) ([]domain.User, int64, error) {
	return s.repo.ListAdmins(ctx, page, limit, search)
}

func (s *userService) UpdateUser(ctx context.Context, id uuid.UUID, req domain.UpdateUserRequest) (domain.User, error) {
	_, err := s.repo.GetUserById(ctx, id)
	if err != nil {
		return domain.User{}, fmt.Errorf("user tidak ditemukan")
	}

	emailStr := req.Email
	emailPtr := &emailStr
	if req.Email == "" {
		emailPtr = nil
	}

	u := domain.User{
		Username: req.Username,
		Email:    emailPtr,
		FullName: req.FullName,
		Role:     req.Role,
		PhotoURL: req.PhotoURL,
	}


	res, err := s.repo.UpdateUser(ctx, id, u)
	if err != nil {
		if strings.Contains(err.Error(), "idx_users_email") || strings.Contains(err.Error(), "users_email_key") {
			return domain.User{}, fmt.Errorf("email sudah digunakan oleh pengguna lain")
		}
		if strings.Contains(err.Error(), "users_username_key") {
			return domain.User{}, fmt.Errorf("username sudah digunakan oleh pengguna lain")
		}
		return domain.User{}, err
	}
	return res, nil

}

func (s *userService) UpdateProfile(ctx context.Context, id uuid.UUID, req domain.UpdateProfileRequest) (domain.User, error) {
	existingUser, err := s.repo.GetUserById(ctx, id)
	if err != nil {
		return domain.User{}, fmt.Errorf("user tidak ditemukan")
	}

	emailStr := req.Email
	emailPtr := &emailStr
	if req.Email == "" {
		emailPtr = nil
	}

	u := domain.User{
		Username:           req.Username,
		Email:              emailPtr,
		FullName:           req.FullName,
		Role:               existingUser.Role,     // Do not allow role change
		PhotoURL:           existingUser.PhotoURL, // Do not change photo here
		EmailNotifications: req.EmailNotifications,
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

func (s *userService) ChangePassword(ctx context.Context, id uuid.UUID, req domain.UpdateProfilePasswordRequest) error {
	// 1. Ambil password lama dari database
	oldHash, err := s.repo.GetUserPasswordHash(ctx, id)
	if err != nil {
		return fmt.Errorf("user tidak ditemukan")
	}

	// 2. Verifikasi kecocokan password lama
	err = utils.CheckPassword(req.OldPassword, oldHash)
	if err != nil {
		return fmt.Errorf("kata sandi lama tidak sesuai")
	}

	// 3. Hash password baru
	hashedPassword, err := hashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("gagal mengenkripsi kata sandi baru: %w", err)
	}

	// 4. Update
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
