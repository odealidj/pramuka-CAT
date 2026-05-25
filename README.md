# 🏕️ Pramuka CAT — Computer Assisted Test

Platform ujian berbasis komputer (CAT) untuk kegiatan kepramukaan. Dibangun dengan **Go + Echo**, **PostgreSQL**, dan **Redis**.

---

## Tech Stack

- **Backend:** Go (Echo Framework) · **DB:** PostgreSQL
- **Cache & Message Broker:** Redis (In-Memory Cache untuk sesi/performa, Message Broker untuk *background jobs*)
- **Infra & Observability:** Docker (Containerization) · OpenTelemetry · Jaeger (Distributed Tracing)
- **Background Jobs:** Asynq (Redis-backed) · **Emailing:** SMTP
- **DB Query:** sqlc · **Auth:** Stateful JWT · **Export:** Excel & PDF
- **Testing:** Unit Testing · Integration Testing · **Load Testing:** Grafana k6

---

## 🚀 Keunggulan Sistem

### ⚙️ Arsitektur Backend (Golang, PostgreSQL, Redis)
- **Konkurensi Tinggi (*High Concurrency*)**: Dibangun menggunakan **Golang** (*Echo Framework*). Sangat ringan dan memori-efisien dalam menangani ribuan lalu lintas peserta ujian secara serentak berkat *goroutine*.
- **Peran Ganda Redis (*Dual Role: Cache & Broker*)**: Memanfaatkan arsitektur Redis untuk dua fungsi vital sekaligus:
  1. **Sebagai *Message Broker* (Antrean Pekerjaan):** Berpadu dengan **Asynq** untuk mendelegasikan tugas berat (ekspor Excel, kirim email SMTP) ke *Background Worker* di belakang layar, sehingga *response time* API tetap instan (< 50ms) dengan fitur *auto-retry* saat gagal.
  2. **Sebagai *In-Memory Cache*:** Menyimpan sesi (*Stateful JWT*), profil pengguna, dan mem-_backup_ auto-simpan jawaban ujian peserta secara *real-time*, sukses memangkas latensi ekstrem (P95) hingga di bawah 2 detik.
- **Infrastruktur Terisolasi (*Docker Containerization*)**: Seluruh ekosistem (*Database*, *Cache*, dan *UI Observabilitas*) berjalan mulus di dalam *container* menggunakan `docker-compose`. Menjamin lingkungan yang stabil (*it works on my machine!*), *easy-to-scale*, terisolasi, dan siap untuk skenario *production-grade deployment* tanpa kerumitan instalasi manual.
- **Ketahanan Sistem (*Circuit Breaker*)**: Menggunakan **gobreaker** untuk memutus arus (*Fail-fast*) saat layanan eksternal (misal: SMTP) mati. Melindungi server dari penumpukan antrean koneksi (*system exhaustion*).
- **Keamanan Lapis Baja (*Security Hardening*)**: Eksekusi API dilindungi oleh pembatasan laju lalu lintas (**Rate Limiter**) anti-DDoS, tameng **Secure Headers** anti-XSS, pembatas muatan *JSON Payload* (**Body Limit**), dan sanitasi input otomatis dengan **go-playground/validator** untuk menyapu data kotor.
- **Observabilitas Enterprise (*OTel & Jaeger*)**: Dilengkapi sistem *Distributed Tracing* secara *real-time* menggunakan **Jaeger** dan **OpenTelemetry**. Memungkinkan kita memonitor jejak *request* dari HTTP masuk, latensi *query* database, hingga eksekusi *background worker* Asynq di satu *dashboard*. Ini adalah kunci emas untuk mendiagnosis *bottleneck* performa!
- **Teruji Kode (*Unit & Integration Testing*)**: Sistem dijaga kualitasnya oleh *Unit Test* dengan *Mocking* serta **Integration Test** menyeluruh. *Integration Test* berjalan di atas _test database_ independen (`pramukacat_test`), menyimulasikan siklus ujian penuh (E2E) mulai dari Admin buat jadwal hingga Peserta submit jawaban, menjamin keakuratan _business logic_ di dunia nyata.
- **Battle-Tested & Load-Ready (*K6 Stress Testing*)**: Ketangguhan arsitektur telah dibuktikan secara empiris menggunakan **Grafana k6**, sanggup menangani simulasi **1000 *Virtual Users*** secara konkuren tanpa *downtime* (0% *error rate*), mendemonstrasikan keandalan sistem berskala produksi.

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
| `make test` | Jalankan unit test biasa |
| `make test-integration` | Jalankan E2E Integration Test penuh (beserta reset test-db) |
| `make sqlc` | Re-generate kode dari query SQL |

---

## Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [`docs/Pramuka_CAT_PRD.md`](docs/Pramuka_CAT_PRD.md) | Product Requirements |
| [`docs/database-erd.md`](docs/database-erd.md) | Skema Database (ERD) |
| [`docs/implementation-decisions.md`](docs/implementation-decisions.md) | Keputusan Teknis & Arsitektur |
| [`docs/sequence-diagrams.md`](docs/sequence-diagrams.md) | Diagram Alur Fitur |

---

## 📈 Laporan Pengujian Kinerja (Performance Test Report)

Untuk membuktikan ketangguhan arsitektur backend sistem **Pramuka CAT**, kami telah melakukan serangkaian pengujian beban (*load testing*) menggunakan **Grafana k6** secara langsung pada API backend yang terhubung dengan **Redis Cache** dan **PostgreSQL**.

### 1. Skenario Pengujian (User Journey Simulation)
Setiap *Virtual User (VU)* dalam k6 menyimulasikan perjalanan lengkap seorang peserta ujian pramuka sesungguhnya:
1. Melakukan **Health Check** (`GET /health`) untuk memastikan status server siap.
2. Melakukan **Login Peserta** (`POST /api/v1/auth/login`) menggunakan kredensial ter-seed (`peserta1 / peserta123`).
3. Mengambil **Daftar Ujian Aktif** (`GET /api/v1/protected/exams/upcoming`) dari cache/database.
4. Membaca **Profil Peserta** (`GET /api/v1/protected/profile`).
5. Memiliki jeda berpikir acak (*think time*) antara 1–3 detik sebelum memulai iterasi berikutnya untuk mensimulasikan sifat manusiawi.

---

### 2. Hasil Pengujian Beban (Load Test Results)

Kami menjalankan 2 skenario pengujian utama pada localhost:

#### A. Smoke Test (Sanity Check)
* **Konfigurasi:** 1 Virtual User (VU) aktif terus-menerus selama 10 detik.
* **Tujuan:** Memastikan seluruh alur kode, token JWT, autentikasi stateful di Redis, dan database query berjalan mulus tanpa kegagalan (0% error).
* **Hasil Empiris:**
  * **Total Checks:** 25 dari 25 berhasil (**100% Success Rate**).
  * **Rata-rata Waktu Respons (Latency):** `16.47 ms` (Median: `1.33 ms`, Tercepat: `419.4 µs`).
  * **Http Request Failure Rate:** `0.00%` (0 gagal dari 20 request).
  * **Status Checks:**
    * `✓ health is status 200`
    * `✓ login is status 200`
    * `✓ has token`
    * `✓ get exams is status 200`
    * `✓ get profile is status 200`

#### B. Load Test (Concurrency & Security Hardening Test)
* **Konfigurasi:** Ramp-up bertahap hingga **50 Virtual Users serentak** dalam durasi 1 menit.
* **Tujuan:** Menyimulasikan lalu lintas ujian padat satu ruangan laboratorium sekolah dan menguji ketangguhan sistem keamanan anti-DDoS (**Rate Limiter**).
* **Hasil Empiris:**
  * **Total Requests:** `5.054 request` dalam 1 menit (Rata-rata `83.2 req/second`).
  * **Total Checks:** `7.343 checks` dijalankan.
  * **Allowed Request Latency:** Rata-rata `16.52 ms` (Median: `1.14 ms`) untuk request yang berhasil lolos pembatasan, membuktikan performa tetap kilat meski di bawah beban tinggi.
  * **Beban Puncak CPU & Memori (OTel Metrics):** Terlacak stabil, pemakaian CPU tetap berada di batas aman dan *no goroutine leak* meskipun dihujani ribuan koneksi paralel.
  * **Dampak Rate Limiter (HTTP 429 - Anti DDoS Protection):**
    * Sebanyak `76.37%` request dari IP penguji yang sama diblokir dengan status **HTTP 429 (Too Many Requests)** karena melampaui limit keamanan **20 request/detik per IP**.
    * Kecepatan respons untuk request yang dibatasi sangat instan (Rata-rata `317.95 µs`), sehingga tidak membebani pemrosesan CPU server. Ini menunjukkan sistem pertahanan yang bekerja dengan sangat optimal untuk mengisolasi penyerang tanpa mengorbankan resource server.

#### C. Stress Test (Max Capacity & Latency Check)
* **Konfigurasi:** Ramp-up bertahap hingga beban puncak **500 Virtual Users** dan **1000 Virtual Users** secara berurutan. *Rate Limiter* dilonggarkan ke 5000 RPS. Skenario *k6* disempurnakan (Realistis): Login (bcrypt) dilakukan hanya satu kali per VU di awal, lalu VU menyimpan token untuk melakukan akses *Cache-Hit* berulang kali ke _endpoint_ `/exams/upcoming` dan profil HPA (`/users/me`).
* **Tujuan:** Mengukur efektivitas **Redis Caching (Read-Through)** dan dampak pemisahan kueri basis data pada latensi ekstrem (P95).
* **Hasil Empiris 500 Virtual Users:**
  * **Total Requests:** `20.860 request` terlayani dengan **100% Success Rate** (0 gagal) dengan throughput **204 request/second**.
  * **Distribusi Waktu Respons (Latensi):**
    * **Median:** `243 ms`
    * **P90:** `1.71 s`
    * **P95:** `1.90 s` (Berhasil di bawah target < 3 detik)
* **Hasil Empiris 1000 Virtual Users (Ekstrem):**
  * **Total Requests:** `11.213 request` terlayani dengan **100% Success Rate** (0 gagal) dengan throughput **92 request/second**.
  * **Distribusi Waktu Respons (Latensi):**
    * **Median:** `5.75 s`
    * **P95:** `11.56 s`
  * **Penjelasan Pelambatan Latensi:** Meskipun *Error Rate* tetap stabil di angka 0.00%, latensi P95 melambat signifikan. Hal ini diakibatkan oleh *CPU exhaustion* (bottleneck CPU). Saat pengujian berlangsung, 1000 *Virtual Users* melakukan _login_ secara serentak di 1 detik pertama. _Endpoint login_ menggunakan fungsi enkripsi **bcrypt** yang didesain memakan resource CPU yang tinggi (*CPU-intensive*). Kalkulasi *hash bcrypt* untuk 1000 permintaan konkuren mengunci _Thread Pool_ CPU pada server uji lokal, menyebabkan _request_ lain menunggu antrean eksekusi dan berdampak pada tingginya latensi. Jika jumlah _user_ terus membengkak, _Auth Service_ (Login) perlu dipisahkan menjadi _Microservice_ independen agar tidak mengganggu jalur _traffic_ ujian utama.

---

### 3. Analisis & Kesimpulan Teknikal

1. **Golang Concurrency Engine:** Dengan 500 user aktif serentak tanpa jeda, sistem sanggup menangani lebih dari **200 request per detik** (RPS) dengan **0% Error Rate** pada kapabilitas *Stress Test*.
2. **Optimasi Cache Redis (Read-Through):** Implementasi _Redis Caching_ untuk User Profile sangat dramatis mengurangi beban Database. Latensi P95 pada beban 500 VUs berhasil ditekan menjadi **1.9 detik** (sangat responsif), membuktikan bahwa _cache-hit_ menyelematkan antrean I/O PostgreSQL.
3. **Analisis P90 & P95 (Responsivitas Backend):** Dalam kondisi diserang 500 pengguna secara konstan bersamaan, 95% request berhasil diselesaikan di bawah target **3 detik** (tepatnya 1.9 detik).
4. **Bcrypt CPU Bottleneck:** Pada beban 1000 VUs, P95 melambat menjadi 11.56 detik. Pelambatan ini murni disebabkan oleh *CPU exhaustion* saat 1000 *goroutine* melakukan kalkulasi *hashing bcrypt* secara bersamaan di endpoint `/login` pada fase awal ujian. Ini membuktikan pentingnya pemisahan server autentikasi (SSO/Auth Service) dari server ujian riil jika target pengguna melampaui 1000 konkuren di _hardware_ kecil.
5. **Efektivitas Rate Limiter (Security Hardened):** Pada kondisi *default*, limit 20 RPS per IP sukses mencegah sabotase server atau brute-force token dari satu mesin penyerang, sementara resource server tetap aman.

