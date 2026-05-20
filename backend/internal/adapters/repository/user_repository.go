package repository

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository/sqlcgen"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/domain"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/ports"
)

type userRepository struct {
	queries *sqlcgen.Queries
}

func NewUserRepository(queries *sqlcgen.Queries) ports.UserRepository {
	return &userRepository{queries: queries}
}

func mapSqlcToDomainUser(u sqlcgen.User) domain.User {
	var createdAt time.Time
	if u.CreatedAt.Valid {
		createdAt = u.CreatedAt.Time
	}

	var photoURL *string
	if u.PhotoUrl.Valid {
		photoURL = &u.PhotoUrl.String
	}

	return domain.User{
		ID:        u.ID,
		Username:  u.Username,
		FullName:  u.FullName,
		Role:      u.Role,
		PhotoURL:  photoURL,
		CreatedAt: createdAt,
	}
}

func (r *userRepository) CreateUser(ctx context.Context, u domain.User, passwordHash string) (domain.User, error) {
	photoUrl := sql.NullString{Valid: false}
	if u.PhotoURL != nil {
		photoUrl = sql.NullString{String: *u.PhotoURL, Valid: true}
	}

	res, err := r.queries.CreateUser(ctx, sqlcgen.CreateUserParams{
		Username:     u.Username,
		PasswordHash: passwordHash,
		FullName:     u.FullName,
		Role:         u.Role,
		PhotoUrl:     photoUrl,
	})
	if err != nil {
		return domain.User{}, err
	}
	return mapSqlcToDomainUser(res), nil
}

func (r *userRepository) GetUserById(ctx context.Context, id uuid.UUID) (domain.User, error) {
	res, err := r.queries.GetUserById(ctx, id)
	if err != nil {
		return domain.User{}, err
	}
	return mapSqlcToDomainUser(res), nil
}

func (r *userRepository) ListUsers(ctx context.Context, page int32, limit int32, search string) ([]domain.User, int64, error) {
	offset := (page - 1) * limit
	rows, err := r.queries.ListUsers(ctx, sqlcgen.ListUsersParams{
		Limit:  limit,
		Offset: offset,
		Search: search,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.CountUsers(ctx, search)
	if err != nil {
		return nil, 0, err
	}

	var users []domain.User
	for _, row := range rows {
		users = append(users, mapSqlcToDomainUser(row))
	}
	return users, total, nil
}

func (r *userRepository) UpdateUser(ctx context.Context, id uuid.UUID, u domain.User) (domain.User, error) {
	photoUrl := sql.NullString{Valid: false}
	if u.PhotoURL != nil {
		photoUrl = sql.NullString{String: *u.PhotoURL, Valid: true}
	}

	res, err := r.queries.UpdateUser(ctx, sqlcgen.UpdateUserParams{
		ID:       id,
		Username: u.Username,
		FullName: u.FullName,
		Role:     u.Role,
		PhotoUrl: photoUrl,
	})
	if err != nil {
		return domain.User{}, err
	}
	return mapSqlcToDomainUser(res), nil
}

func (r *userRepository) UpdateUserPassword(ctx context.Context, id uuid.UUID, passwordHash string) error {
	return r.queries.UpdateUserPassword(ctx, sqlcgen.UpdateUserPasswordParams{
		ID:           id,
		PasswordHash: passwordHash,
	})
}

func (r *userRepository) UpdateUserPhoto(ctx context.Context, id uuid.UUID, photoUrl string) error {
	var nPhoto sql.NullString
	if photoUrl != "" {
		nPhoto = sql.NullString{String: photoUrl, Valid: true}
	} else {
		nPhoto = sql.NullString{Valid: false}
	}
	return r.queries.UpdateUserPhoto(ctx, sqlcgen.UpdateUserPhotoParams{
		ID:       id,
		PhotoUrl: nPhoto,
	})
}

func (r *userRepository) DeleteUser(ctx context.Context, id uuid.UUID) error {
	return r.queries.DeleteUser(ctx, id)
}
