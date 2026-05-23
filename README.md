# 🏕️ Pramuka CAT — Computer Assisted Test

Platform ujian berbasis komputer (CAT) untuk kegiatan kepramukaan. Dibangun dengan **Go + Echo**, **PostgreSQL**, dan **Redis**.

---

## Tech Stack

- **Backend:** Go (Echo Framework) · **DB:** PostgreSQL · **Cache/MQ:** Redis
- **Background Jobs:** Asynq · **Emailing:** SMTP
- **DB Query:** sqlc · **Auth:** Stateful JWT · **Export:** Excel & PDF

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
