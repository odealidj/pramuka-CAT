package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/handler"
	appMiddleware "github.com/odealidj/pramuka-CAT/backend/internal/adapters/middleware"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository/sqlcgen"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/services"
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

	// 4. Setup Dependency Injection (Hexagonal Wiring)
	queries := sqlcgen.New(db)
	authRepo := repository.NewAuthRepository(queries)
	authCache := repository.NewAuthCache(rdb)

	authService := services.NewAuthService(authRepo, authCache)
	authHandler := handler.NewAuthHandler(authService)

	// CRUD Bank Soal Dependencies
	categoryRepo := repository.NewCategoryRepository(queries)
	categoryService := services.NewCategoryService(categoryRepo)
	categoryHandler := handler.NewCategoryHandler(categoryService)

	questionRepo := repository.NewQuestionRepository(queries)
	questionService := services.NewQuestionService(questionRepo)
	questionHandler := handler.NewQuestionHandler(questionService)

	eventRepo := repository.NewEventRepository(queries)
	eventService := services.NewEventService(eventRepo)
	eventHandler := handler.NewEventHandler(eventService)

	examRepo := repository.NewExamRepository(queries)
	examService := services.NewExamService(examRepo)
	examHandler := handler.NewExamHandler(examService)

	userRepo := repository.NewUserRepository(queries)
	userService := services.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userService)

	// 5. Siapkan Server Echo
	e := echo.New()

	// Pasang Middleware dasar (Log, Recover dari panic, dan CORS)
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Endpoint Health Check (Liveness & Readiness)
	e.GET("/health", func(c echo.Context) error {
		status := "ok"
		dbStatus := "ok"
		redisStatus := "ok"
		statusCode := http.StatusOK

		// Check Postgres
		if err := db.Ping(); err != nil {
			status = "error"
			dbStatus = "disconnected"
			statusCode = http.StatusServiceUnavailable
		}

		// Check Redis
		if err := rdb.Ping(c.Request().Context()).Err(); err != nil {
			status = "error"
			redisStatus = "disconnected"
			statusCode = http.StatusServiceUnavailable
		}

		return c.JSON(statusCode, map[string]interface{}{
			"status":   status,
			"database": dbStatus,
			"redis":    redisStatus,
		})
	})

	// Pendaftaran Rute API Publik
	api := e.Group("/api/v1")
	authHandler.RegisterRoutes(api)

	// Pendaftaran Rute API Terlindungi (Protected Routes)
	protected := api.Group("/protected")
	// Pasang Middleware: Wajib bawa Token & Sesi masih ada di Redis
	protected.Use(appMiddleware.RequireAuth(authCache))
	
	examHandler.RegisterParticipantRoutes(protected)

	// Endpoint ini bisa diakses siapa saja yang punya Token valid (Admin maupun Peserta)
	protected.GET("/profile", func(c echo.Context) error {
		payload := c.Get(appMiddleware.AuthorizationPayloadKey)
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Akses Diterima! Anda sedang melihat profil rahasia.",
			"user_data": payload,
		})
	})

	// Endpoint ini HANYA bisa diakses jika Role di token adalah "admin"
	adminOnly := protected.Group("/admin-only")
	adminOnly.Use(appMiddleware.RequireRole("admin"))
	adminOnly.GET("", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Selamat datang, Admin! Anda berhak melihat rute super rahasia ini.",
		})
	})

	// Rute CRUD Bank Soal (Hanya untuk Admin)
	adminGroup := api.Group("/admin")
	adminGroup.Use(appMiddleware.RequireAuth(authCache))
	adminGroup.Use(appMiddleware.RequireRole("admin"))
	
	categoryHandler.RegisterAdminRoutes(adminGroup)
	questionHandler.RegisterAdminRoutes(adminGroup)
	eventHandler.RegisterAdminRoutes(adminGroup)
	userHandler.RegisterAdminRoutes(adminGroup)

	// 6. Nyalakan Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Fallback jika di .env tidak diset
	}

	log.Printf("Server mulai mendengarkan di port :%s", port)
	e.Logger.Fatal(e.Start(":" + port))
}
