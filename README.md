# 🏕️ Pramuka CAT — Computer Assisted Test

Platform ujian berbasis komputer (CAT) yang dirancang khusus untuk kegiatan kepramukaan. Memfasilitasi pelaksanaan ujian teori secara digital, terstruktur, dan efisien.

> **Repository:** `odealidj/pramuka-CAT` · **Branch aktif:** `feature/auto-bobot`

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Prasyarat](#-prasyarat)
- [Memulai Cepat](#-memulai-cepat)
- [Perintah Make](#-perintah-make)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [API Endpoints](#-api-endpoints)
- [Arsitektur](#-arsitektur)
- [Dokumentasi](#-dokumentasi)

---

## ✨ Fitur Utama

### Untuk Admin
| Fitur | Status |
|---|:---:|
| CRUD Bank Soal (dengan Kategori & Bobot) | ✅ |
| Manajemen Event/Jadwal Ujian | ✅ |
| Distribusi Soal Manual & Acak (maks. 500) | ✅ |
| Manajemen Peserta (Soft-Delete) | ✅ |
| Approval / Revoke akses peserta per Event | ✅ |
| Auto-Bobot: Skor berskala 100 otomatis | ✅ |
| Review Jawaban Peserta per Soal | ✅ |
| Export Laporan Excel (.xlsx) & PDF | ✅ |

### Untuk Peserta
| Fitur | Status |
|---|:---:|
| Login & Refresh Token (Stateful JWT) | ✅ |
| Melihat Event yang tersedia | ✅ |
| Pendaftaran & persetujuan ujian | ✅ |
| Mengerjakan ujian (soal diacak) | ✅ |
| Simpan jawaban real-time via Redis | ✅ |
| Auto-Submit saat waktu habis | ✅ |
| Lihat hasil nilai & status lulus instan | ✅ |

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
|---|---|
| **Backend** | Go 1.26 + Echo v4 |
| **Database** | PostgreSQL 15 |
| **Cache / Session** | Redis 7 |
| **DB Query** | sqlc (type-safe, no ORM) |
| **Migrasi DB** | golang-migrate |
| **Auth** | Stateful JWT (Dual Token) |
| **Export Excel** | `excelize/v2` |
| **Export PDF** | `gofpdf` |
| **Containerisasi** | Docker + Docker Compose |
| **DevOps** | Makefile |

---

## 📦 Prasyarat

Pastikan software berikut sudah terinstal di komputer Anda:

| Tools | Kegunaan | Link |
|---|---|---|
| [Go 1.21+](https://go.dev/dl/) | Menjalankan backend | golang.org |
| [Docker & Docker Compose](https://docs.docker.com/get-docker/) | Infrastruktur lokal | docker.com |
| [golang-migrate](https://github.com/golang-migrate/migrate/tree/master/cmd/migrate) | Menjalankan migrasi DB | GitHub |
| [sqlc](https://sqlc.dev/) | Generate kode dari SQL | sqlc.dev |
| `make` | Menjalankan Makefile | Bawaan Linux/macOS |

### Instalasi golang-migrate
```bash
# Linux
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.1/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/
```

### Instalasi sqlc
```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

---

## 🚀 Memulai Cepat

### 1. Clone & Konfigurasi
```bash
git clone https://github.com/odealidj/pramuka-CAT.git
cd pramuka-CAT

# Salin template environment dan sesuaikan nilainya
cp backend/.env.example backend/.env
```

Edit `backend/.env` sesuai konfigurasi lokal Anda (lihat bagian [Konfigurasi Environment](#-konfigurasi-environment)).

### 2. Pilihan A: Jalankan Semua via Docker (Direkomendasikan)
Menjalankan Postgres, Redis, Migrasi, dan Backend API sekaligus:
```bash
make up
```

API akan tersedia di: **http://localhost:8080**

### 3. Pilihan B: Mode Debug (untuk pengembang)
Jalankan hanya infrastruktur, lalu debug API Go secara lokal:
```bash
# Terminal 1: Nyalakan infrastruktur
make infra-up

# Terminal 2: Jalankan API Go (bisa di-attach debugger)
make run
```

### 4. Isi Data Simulasi (Opsional)
```bash
make seed
```
Setelah `seed`, Anda bisa langsung login dengan:
- **Admin:** `admin_pramuka` / `admin123`
- **Peserta:** `peserta1` hingga `peserta5` / `peserta123`

---

## ⚙️ Perintah Make

Jalankan dari direktori **root** proyek (`pramuka-CAT/`).

```bash
# ── Sistem ────────────────────────────────────────────────────────────
make up            # Nyalakan SELURUH sistem (Infra + API) via Docker
make down          # Matikan seluruh sistem Docker

# ── Infrastruktur (untuk mode debug) ─────────────────────────────────
make infra-up      # Nyalakan HANYA Postgres, Redis, Migrate
make infra-down    # Matikan infrastruktur (tanpa menyentuh API)

# ── Aplikasi Go ───────────────────────────────────────────────────────
make run           # Jalankan API Go langsung di host (mode debug)
make build         # Kompilasi binary → backend/bin/api
make test          # Jalankan unit test

# ── Database ──────────────────────────────────────────────────────────
make migrate-up    # Jalankan migrasi ke versi terbaru
make migrate-down  # Rollback SEMUA migrasi (hati-hati!)
make sqlc          # Re-generate kode Go dari query SQL

# ── Seed Data ─────────────────────────────────────────────────────────
make seed          # Masukkan data simulasi
make clear-seed    # Hapus SEMUA data simulasi (tanpa drop tabel)
make reset-db      # Reset penuh: migrate-down → migrate-up → seed

# ── Docker Image ──────────────────────────────────────────────────────
make docker-build  # Build production image (multi-stage)
```

---

## 🔧 Konfigurasi Environment

Salin `backend/.env.example` ke `backend/.env` dan sesuaikan:

```env
# Server
PORT=8080

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=pramukacat
DB_SSLMODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT (wajib diganti di production!)
JWT_ACCESS_SECRET=ganti_dengan_secret_yang_kuat
JWT_REFRESH_SECRET=ganti_dengan_secret_yang_berbeda
JWT_ACCESS_DURATION=15m
JWT_REFRESH_DURATION=7d
```

> ⚠️ **Jangan pernah commit file `.env` ke repositori.** File ini sudah ada di `.gitignore`.

---

## 📡 API Endpoints

**Base URL:** `http://localhost:8080/api/v1`

### 🔓 Publik (Tidak Perlu Token)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/health` | Health check (status DB & Redis) |
| `POST` | `/auth/login` | Login, mendapat Access & Refresh Token |
| `POST` | `/auth/refresh` | Perbarui Access Token |
| `POST` | `/auth/logout` | Logout & invalidasi sesi |

### 🔒 Peserta (Butuh Token `role: peserta`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/protected/exams/upcoming` | Daftar event ujian yang tersedia |
| `GET` | `/protected/exams/my-exams` | Riwayat pendaftaran & nilai saya |
| `POST` | `/protected/exams/enroll` | Daftar ke suatu event |
| `GET` | `/protected/exams/:id/start` | Ambil soal & mulai ujian |
| `POST` | `/protected/exams/:id/submit-answer` | Kirim jawaban satu soal |
| `POST` | `/protected/exams/:id/finish` | Selesaikan ujian & lihat nilai |

### 🔑 Admin (Butuh Token `role: admin`)

**Manajemen User**
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/admin/users` | Daftar semua pengguna (paginasi) |
| `POST` | `/admin/users` | Buat pengguna baru |
| `PUT` | `/admin/users/:id` | Update data pengguna |
| `DELETE` | `/admin/users/:id` | Hapus pengguna (soft-delete) |

**Bank Soal**
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET/POST` | `/admin/questions` | Daftar & buat soal baru |
| `GET/PUT/DELETE` | `/admin/questions/:id` | Detail, update, & hapus soal |
| `GET/POST/DELETE` | `/admin/categories` | Manajemen kategori soal |

**Event / Jadwal Ujian**
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET/POST` | `/admin/events` | Daftar & buat event |
| `GET/PUT/DELETE` | `/admin/events/:id` | Detail, update, & hapus event |
| `POST` | `/admin/events/:id/questions` | Tambah soal manual ke event |
| `POST` | `/admin/events/:id/random-questions` | Tambah soal acak ke event |
| `GET/DELETE` | `/admin/events/:id/questions` | Lihat & hapus soal di event |
| `GET` | `/admin/events/:id/participants` | Daftar peserta event |
| `PUT` | `/admin/events/:id/participants/:approval_id/approve` | Approve peserta |
| `GET` | `/admin/events/:id/export?format=excel` | **Export laporan Excel (.xlsx)** |
| `GET` | `/admin/events/:id/export?format=pdf` | **Export laporan PDF** |

**Laporan & Review**
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/admin/exams/approvals/:approval_id/answers` | Review jawaban per peserta |

---

## 🏛️ Arsitektur

Proyek ini menggunakan pola **Hexagonal Architecture (Ports & Adapters)**:

```
cmd/api/main.go           ← Entry point, DI wiring, routing, graceful shutdown
├── internal/
│   ├── core/             ← Business Logic (bebas dari framework)
│   │   ├── domain/       ← Structs & entities
│   │   ├── ports/        ← Interfaces (kontrak)
│   │   └── services/     ← Implementasi use-case
│   ├── adapters/
│   │   ├── handler/      ← HTTP controllers (Echo)
│   │   └── repository/   ← Database access (SQLC)
│   └── middleware/       ← JWT Auth, RBAC Role
└── pkg/
    ├── database/         ← Koneksi Postgres & Redis
    └── response/         ← Standar format JSON response
```

### Alur Penilaian (Auto-Bobot)
Nilai akhir peserta dihitung menggunakan formula proporsional:

```
Nilai Akhir = (Σ Bobot Jawaban Benar / Σ Bobot Seluruh Soal dalam Event) × 100
```

Ini memastikan nilai selalu berskala 0–100, baik dalam mode **Auto-Bobot** (semua soal berbobot 1) maupun mode **Manual Bobot** (soal sulit/mudah dengan bobot berbeda).

---

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [`docs/Pramuka_CAT_PRD.md`](docs/Pramuka_CAT_PRD.md) | Product Requirements Document |
| [`docs/database-erd.md`](docs/database-erd.md) | Entity Relationship Diagram (skema DB) |
| [`docs/implementation-decisions.md`](docs/implementation-decisions.md) | Keputusan teknis & arsitektur |
| [`docs/sequence-diagrams.md`](docs/sequence-diagrams.md) | Diagram alur fitur utama |

---

## 🤝 Kontribusi

1. Buat branch baru dari `main`: `git checkout -b feature/nama-fitur`
2. Commit perubahan: `git commit -m "feat: deskripsi singkat"`
3. Push ke remote: `git push origin feature/nama-fitur`
4. Buat Pull Request ke branch `main`

> **Konvensi commit** menggunakan format [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.

---

<div align="center">
  <sub>Dibangun dengan ❤️ untuk kemajuan kepramukaan Indonesia.</sub>
</div>
