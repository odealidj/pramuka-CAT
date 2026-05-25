# 🏕️ Pramuka CAT — Computer Assisted Test

Platform ujian berbasis komputer (CAT) untuk kegiatan kepramukaan. Dibangun dengan **Go + Echo**, **PostgreSQL**, dan **Redis**.

---

## Tech Stack

- **Backend:** Go (Echo Framework) · **DB:** PostgreSQL · **Cache/MQ:** Redis
- **Background Jobs:** Asynq · **Emailing:** SMTP
- **DB Query:** sqlc · **Auth:** Stateful JWT · **Export:** Excel & PDF

---

## 🚀 Keunggulan Sistem (Fitur CV)

### ⚙️ Arsitektur Backend (Golang, PostgreSQL, Redis)
- **Konkurensi Tinggi (*High Concurrency*)**: Dibangun menggunakan **Golang** (*Echo Framework*). Sangat ringan dan memori-efisien dalam menangani ribuan lalu lintas peserta ujian secara serentak berkat *goroutine*.
- **Pemrosesan Asinkron (*Worker Service*)**: Integrasi **Redis & Asynq** untuk mendelegasikan beban kerja berat (seperti ekstraksi file Excel, pengiriman email SMTP, dan notifikasi massal) ke *Background Worker*. Menghasilkan *response time* API yang selalu instan (< 50ms).
- **Performa Ekstrem (*Caching & Auto-Resume*)**: Menggunakan **Redis** sebagai *In-Memory Cache* untuk menyimpan sesi dan jawaban ujian peserta secara *real-time*. Mengurangi beban kueri langsung ke **PostgreSQL** dan melindungi jawaban peserta meskipun koneksi internet terputus.
- **Ketahanan Sistem (*Circuit Breaker*)**: Menggunakan **gobreaker** untuk memutus arus (*Fail-fast*) saat layanan eksternal (misal: SMTP) mati. Melindungi server dari penumpukan antrean koneksi (*system exhaustion*).
- **Keamanan Lapis Baja (*Security Hardening*)**: Eksekusi API dilindungi oleh pembatasan laju lalu lintas (**Rate Limiter**) anti-DDoS, tameng **Secure Headers** anti-XSS, pembatas muatan *JSON Payload* (**Body Limit**), dan sanitasi input otomatis dengan **go-playground/validator** untuk menyapu data kotor.
- **Observabilitas Enterprise (*OpenTelemetry*)**: Dilengkapi pelacakan sistem mendalam standar industri (**OTel**). Memancarkan *Distributed Tracing* (pelacakan API ke DB) dan metrik perangkat keras (CPU, RAM, *Garbage Collection*) yang siap dihubungkan ke **Grafana** dan **Jaeger**.
- **Teruji Penuh (*Unit & Integration Test*)**: Dilindungi oleh rangkaian _test_ otomatis berlapis untuk memastikan algoritma kalkulasi skor, autentikasi stateful JWT, dan routing HTTP bekerja tanpa cacat (*Bug-free*).

### 🎨 Antarmuka Frontend (Next.js, Tailwind CSS)
- **Desain Ultra Premium (*Glassmorphism & Gradients*)**: Menggunakan **Tailwind CSS** untuk menciptakan antarmuka tingkat atas yang mewah, misterius, elegan, dan menawan secara visual tanpa mengorbankan performa.
- **Rendering Cepat (*Server-Side Rendering*)**: Mengandalkan **Next.js (App Router)** untuk memuat halaman secara instan, meningkatkan SEO, dan menyajikan data statistik dasbor admin dengan aman sebelum dikirim ke klien.
- **Navigasi Kelas Atas (*Command Palette*)**: Implementasi pencarian *Spotlight-style* interaktif (`Ctrl+K`) yang memungkinkan pengguna melompat antar menu atau menjalankan "Aksi Cepat" dengan cepat bagaikan *Power User*.
- **Manajemen Ujian Real-Time**: Sinkronisasi penghitung waktu hitung mundur (*Countdown Timer*) dan auto-penyimpanan (*Auto-Submit*) yang berkesinambungan tanpa me-*refresh* halaman saat peserta mengerjakan soal.
- **Responsif & Aksesibel**: Layout antarmuka otomatis menyesuaikan diri dengan indah (*Fluid Responsive*) di perangkat _mobile_, tablet, maupun _desktop_, memastikan kenyamanan ujian di layar sekecil apa pun.

---

## Memulai Cepat

```bash
# 1. Clone & konfigurasi
git clone https://github.com/odealidj/pramuka-CAT.git
cd pramuka-CAT
cp backend/.env.example backend/.env   # Sesuaikan isinya

# 2. Jalankan seluruh sistem (Infra + API)
make up

# 3. Isi data simulasi (opsional)
make seed
```

> **Login default:** Admin `admin_pramuka / admin123` · Peserta `peserta1 / peserta123`

API tersedia di: `http://localhost:8080` · Health check: `http://localhost:8080/health`

---

## Perintah Make

| Perintah | Deskripsi |
|---|---|
| `make up` / `make down` | Jalankan / hentikan seluruh sistem (Docker) |
| `make infra-up` / `make infra-down` | Nyalakan hanya infrastruktur (untuk debug Go lokal) |
| `make run` | Jalankan API Go langsung di host |
| `make migrate-up` / `make migrate-down` | Jalankan / rollback migrasi database |
| `make seed` / `make clear-seed` | Tambah / hapus data simulasi |
| `make reset-db` | Reset penuh: rollback → migrate → seed |
| `make test` | Jalankan unit test |
| `make sqlc` | Re-generate kode dari query SQL |

---

## Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [`docs/Pramuka_CAT_PRD.md`](docs/Pramuka_CAT_PRD.md) | Product Requirements |
| [`docs/database-erd.md`](docs/database-erd.md) | Skema Database (ERD) |
| [`docs/implementation-decisions.md`](docs/implementation-decisions.md) | Keputusan Teknis & Arsitektur |
| [`docs/sequence-diagrams.md`](docs/sequence-diagrams.md) | Diagram Alur Fitur |
