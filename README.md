# 🏕️ Pramuka CAT — Computer Assisted Test

Platform ujian berbasis komputer (CAT) untuk kegiatan kepramukaan. Dibangun dengan **Go + Echo**, **PostgreSQL**, dan **Redis**.

---

## Tech Stack

- **Backend:** Go (Echo Framework) · **DB:** PostgreSQL · **Cache/MQ:** Redis
- **Background Jobs:** Asynq · **Emailing:** SMTP
- **DB Query:** sqlc · **Auth:** Stateful JWT · **Export:** Excel & PDF

---

## 🚀 Keunggulan Sistem

- **Konkurensi Tinggi (*High Concurrency*)**: Dibangun dengan Golang, sistem ini sangat ringan namun tangguh dalam menangani ribuan lalu lintas data peserta ujian secara serentak berkat arsitektur *goroutine*.
- **Pemrosesan Latar Belakang (*Worker Service*)**: Pekerjaan berat yang memakan waktu lama (seperti pengiriman email, ekstraksi file Excel, dan notifikasi massal) sepenuhnya didelegasikan kepada *Background Worker* via Redis (*Asynq*). Hasilnya, API selalu memberikan waktu respons super instan (< 50ms) bagi pengguna di layar depan.
- **Performa Cepat & Anti-Gagal (*Caching & Auto-Resume*)**: Menahan gempuran kueri ke database utama dengan mendelegasikan status sesi aktif dan jawaban ujian sementara ke memori RAM (Redis). Memastikan aplikasi anti-lambat dan melindungi jawaban peserta meskipun koneksi internet terputus.
- **Pengujian Unit (*Unit Test*)**: Terlindungi oleh pengujian komponen secara isolasi untuk memastikan seluruh logika bisnis, algoritma penilaian nilai (skor), dan manajemen autentikasi bekerja tanpa cacat.
- **Pengujian Integrasi (*Integration Test*)**: Arsitektur sistem diuji secara menyeluruh (*end-to-end*) untuk memastikan komunikasi mulus dari *routing* HTTP hingga *query* database PostgreSQL.
- **Ketahanan Sistem (*Circuit Breaker*)**: Sangat tangguh menghadapi kegagalan jaringan eksternal (misal: server email SMTP mati). Menerapkan *Circuit Breaker* untuk secara pintar memutus beban tunggu (Fail-fast) demi mencegah *system exhaustion*, sehingga performa sisa API tetap stabil.
- **Observabilitas Enterprise (*OpenTelemetry*)**: Dilengkapi sensor pemantauan menyeluruh standar industri (OTel). Mampu memancarkan *Distributed Tracing* (pelacakan durasi lintas fungsi) dan metrik perangkat keras (CPU, RAM fisik, metrik *Garbage Collection*) secara otomatis untuk dihubungkan ke Grafana maupun Jaeger.

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
