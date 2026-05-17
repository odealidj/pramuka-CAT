package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	
	"github.com/odealidj/pramuka-CAT/backend/pkg/database"
)

func main() {
	// 1. Muat konfigurasi dari file .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Peringatan: File .env tidak ditemukan, sistem akan menggunakan environment OS.")
	}

	// 2. Buka Koneksi PostgreSQL
	db, err := database.ConnectPostgres()
	if err != nil {
		log.Fatalf("Aplikasi berhenti: Gagal terhubung ke database Postgres. Error: %v", err)
	}
	defer db.Close()

	// 3. Buka Koneksi Redis
	rdb, err := database.ConnectRedis()
	if err != nil {
		log.Fatalf("Aplikasi berhenti: Gagal terhubung ke Redis. Error: %v", err)
	}
	defer rdb.Close()

	// 4. Siapkan Server Echo
	e := echo.New()

	// Pasang Middleware dasar (Log, Recover dari panic, dan CORS)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Endpoint Health Check
	e.GET("/ping", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"success": true,
			"message": "Pramuka CAT Backend API menyala dengan sempurna!",
		})
	})

	// 5. Nyalakan Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Fallback jika di .env tidak diset
	}

	log.Printf("Server mulai mendengarkan di port :%s", port)
	e.Logger.Fatal(e.Start(":" + port))
}
