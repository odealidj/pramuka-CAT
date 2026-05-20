// @title          Pramuka CAT API
// @version        1.0
// @description    REST API untuk platform Computer Assisted Test (CAT) Pramuka.
// @termsOfService http://swagger.io/terms/

// @contact.name  Dev Team Pramuka CAT
// @contact.url   https://github.com/odealidj/pramuka-CAT

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in                         header
// @name                       Authorization
// @description                Masukkan token JWT dengan format: Bearer {token}

package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	echoSwagger "github.com/swaggo/echo-swagger"
	"go.opentelemetry.io/contrib/instrumentation/github.com/labstack/echo/otelecho"

	_ "github.com/odealidj/pramuka-CAT/backend/docs"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/handler"
	appMiddleware "github.com/odealidj/pramuka-CAT/backend/internal/adapters/middleware"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository"
	"github.com/odealidj/pramuka-CAT/backend/internal/adapters/repository/sqlcgen"
	"github.com/odealidj/pramuka-CAT/backend/internal/core/services"
	"github.com/odealidj/pramuka-CAT/backend/pkg/database"
	"github.com/odealidj/pramuka-CAT/backend/pkg/tracer"
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

	// 4. Inisialisasi Distributed Tracing (OpenTelemetry → Jaeger)
	otlpEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otlpEndpoint == "" {
		otlpEndpoint = "localhost:4317" // fallback untuk local dev
	}
	tracerShutdown, err := tracer.InitTracer(context.Background(), "pramuka-cat-api", otlpEndpoint)
	if err != nil {
		// Tidak fatal — app tetap jalan meski Jaeger tidak tersedia
		log.Printf("Peringatan: Gagal menginisialisasi tracer Jaeger (%s): %v", otlpEndpoint, err)
		tracerShutdown = func(ctx context.Context) error { return nil }
	} else {
		log.Printf("Distributed tracing aktif → mengirim trace ke %s", otlpEndpoint)
	}

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
	questionService := services.NewQuestionService(questionRepo, categoryRepo)
	questionHandler := handler.NewQuestionHandler(questionService)

	eventRepo := repository.NewEventRepository(queries)
	eventService := services.NewEventService(eventRepo)
	eventHandler := handler.NewEventHandler(eventService)

	examRepo := repository.NewExamRepository(queries)
	examCache := repository.NewExamCache(rdb)
	examService := services.NewExamService(examRepo, examCache)
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

	// Distributed Tracing middleware — membuat span otomatis untuk setiap HTTP request
	e.Use(otelecho.Middleware("pramuka-cat-api"))
	// Mark span sebagai Error untuk semua response >= 400 (agar terlihat merah di Jaeger UI)
	e.Use(appMiddleware.TraceErrorMiddleware())

	// Root endpoint — mengembalikan informasi API
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"name":        "Pramuka CAT API",
			"version":     "1.0.0",
			"description": "REST API untuk platform Computer Assisted Test (CAT) Pramuka",
			"status":      "running",
			"docs":        "/swagger/index.html",
			"health":      "/health",
		})
	})

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

	// Swagger UI
	e.GET("/swagger/*", echoSwagger.WrapHandler)

	// Pendaftaran Rute API Publik
	api := e.Group("/api/v1")
	authHandler.RegisterRoutes(api)

	// Pendaftaran Rute API Terlindungi (Protected Routes)
	protected := api.Group("/protected")
	// Pasang Middleware: Wajib bawa Token & Sesi masih ada di Redis
	protected.Use(appMiddleware.RequireAuth(authCache))

	examHandler.RegisterParticipantRoutes(protected)
	authHandler.RegisterProtectedRoutes(protected)
	userHandler.RegisterParticipantRoutes(protected)

	// Serve the uploads directory statically
	e.Static("/uploads", "./uploads")

	// Endpoint ini bisa diakses siapa saja yang punya Token valid (Admin maupun Peserta)
	protected.GET("/profile", func(c echo.Context) error {
		payload := c.Get(appMiddleware.AuthorizationPayloadKey)
		return c.JSON(http.StatusOK, map[string]interface{}{
			"message":   "Akses Diterima! Anda sedang melihat profil rahasia.",
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
	examHandler.RegisterAdminRoutes(adminGroup)

	// 6. Nyalakan Server dengan Graceful Shutdown
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Fallback jika di .env tidak diset
	}

	// Jalankan server di goroutine agar tidak memblokir sinyal OS
	go func() {
		log.Printf("Server mulai mendengarkan di port :%s", port)
		if err := e.Start(":" + port); err != nil && err != http.ErrServerClosed {
			e.Logger.Fatal("Server error: ", err)
		}
	}()

	// Tunggu sinyal interupsi (SIGINT, SIGTERM)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("Menerima sinyal shutdown, mematikan server secara perlahan...")

	// Beri batas waktu maksimal 10 detik untuk menyelesaikan request yang sedang berjalan
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		e.Logger.Fatal("Terjadi kesalahan saat mematikan server: ", err)
	}

	// Flush dan tutup tracer agar semua span terkirim ke Jaeger
	if err := tracerShutdown(ctx); err != nil {
		log.Printf("Peringatan: Gagal menutup tracer: %v", err)
	}

	log.Println("Server berhasil dimatikan dengan aman. Sampai jumpa!")
}
