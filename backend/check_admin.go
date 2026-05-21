package main

import (
	"context"
	"fmt"
	"log"

	"github.com/joho/godotenv"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository/sqlcgen"
	"github.com/odealidj/pramuka-CAT/backend/pkg/database"
	"github.com/odealidj/pramuka-CAT/backend/pkg/utils"
)

func main() {
	godotenv.Load()
	db, err := database.ConnectPostgres()
	if err != nil {
		log.Fatalf("db err: %v", err)
	}
	defer db.Close()

	ctx := context.Background()
	queries := sqlcgen.New(db)

	user, err := queries.GetUserByUsername(ctx, "superadmin")
	if err != nil {
		fmt.Printf("user not found: %v\n", err)
		return
	}
	fmt.Printf("User found: %s, Role: %s\n", user.Username, user.Role)

	// Update password just to be sure
	hashed, _ := utils.HashPassword("superadmin123")
	_, err = db.Exec("UPDATE users SET password_hash = $1 WHERE id = $2", hashed, user.ID)
	if err != nil {
		fmt.Printf("failed to update: %v\n", err)
		return
	}
	fmt.Println("Password updated to superadmin123!")
}
