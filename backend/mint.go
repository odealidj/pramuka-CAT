package main

import (
	"fmt"
	"time"

	"github.com/odealidj/pramuka-CAT/backend/pkg/utils"
)

func main() {
	utils.JWTSecret = []byte("super-secret-key-for-jwt-2024-change-in-production")
	token, _, _ := utils.GenerateToken(
		"00000000-0000-0000-0000-000000000000",
		"admin",
		"admin",
		"session",
		24*time.Hour,
	)
	fmt.Println(token)
}
