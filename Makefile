.PHONY: run build test swagger up down infra-up infra-down migrate-up migrate-down seed clear-seed reset-db sqlc docker-build

# Variabel Konfigurasi Database (Sesuaikan dengan .env)
DB_URL="postgres://postgres:postgres@localhost:5432/pramukacat?sslmode=disable"
MIGRATION_PATH="backend/sql/migrations"

# --- Aplikasi Backend ---
run:
	@echo "Menjalankan Backend API..."
	cd backend && go run cmd/api/main.go

build:
	@echo "Membangun Binary Backend..."
	cd backend && go build -o bin/api cmd/api/main.go
	@echo "Build sukses! Binary ada di backend/bin/api"

test:
	@echo "Menjalankan Unit Test..."
	cd backend && go test -v ./...
swagger:
	@echo "Generate Swagger Docs..."
	cd backend && swag init -g cmd/api/main.go -o docs --parseDependency --parseInternal
	@echo "Swagger UI tersedia di http://localhost:8080/swagger/index.html setelah server berjalan"

# --- Keseluruhan Sistem (Docker Compose) ---
up:
	@echo "Menyalakan SELURUH sistem (Infra + Backend API) via Docker Compose..."
	docker-compose up -d

down:
	@echo "Mematikan seluruh sistem Docker Compose..."
	docker-compose down

# --- Infrastruktur Khusus ---
infra-up:
	@echo "Menyalakan HANYA Infrastruktur (Postgres, Redis, Migrate)..."
	docker-compose up -d postgres redis migrate

infra-down:
	@echo "Mematikan Infrastruktur..."
	docker-compose stop postgres redis migrate
	docker-compose rm -f postgres redis migrate

# --- Database Migrations ---
migrate-up:
	@echo "Menjalankan Migrasi Up..."
	migrate -path $(MIGRATION_PATH) -database $(DB_URL) -verbose up

migrate-down:
	@echo "Menjalankan Migrasi Down (Hati-hati: Menghapus Tabel!)..."
	migrate -path $(MIGRATION_PATH) -database $(DB_URL) -verbose down -all

sqlc:
	@echo "Generate kode SQLC..."
	cd backend && sqlc generate

# --- Data Seeding ---
seed:
	@echo "Memasukkan Dummy Data ke Database..."
	cd backend && go run cmd/seeder/main.go

clear-seed:
	@echo "Menghapus Dummy Data dari Database..."
	cd backend && go run cmd/clear_seed/main.go

reset-db: migrate-down migrate-up seed
	@echo "Database telah di-reset dan di-seed dengan sukses!"

# --- Docker Build ---
docker-build:
	@echo "Membangun Docker Image untuk Production..."
	docker build -t pramukacat-backend ./backend
