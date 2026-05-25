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

### ⚙️ Backend (Golang, PostgreSQL, Redis)
- **Konkurensi**: Dibangun menggunakan **Go (Echo Framework)**. Cukup ringan dan efisien untuk menangani *request* peserta ujian dalam jumlah besar karena memanfaatkan *goroutine*.
- **Penggunaan Redis**: Digunakan untuk dua kebutuhan:
  1. **Message Broker**: Terintegrasi dengan **Asynq** untuk memproses *background jobs* seperti ekspor Excel dan pengiriman email. Hal ini membuat respon API tetap cepat.
  2. **In-Memory Cache**: Digunakan untuk menyimpan data sesi (Stateful JWT), profil pengguna, dan *auto-save* jawaban peserta untuk meminimalisir *query* langsung ke *database*.
- **Docker**: Layanan seperti PostgreSQL, Redis, dan Jaeger sudah dibungkus di dalam *container* menggunakan `docker-compose`. Memudahkan proses instalasi dan *deployment* agar konsisten di berbagai *environment*.
- **Circuit Breaker**: Menggunakan **gobreaker** untuk mencegah penumpukan koneksi jika layanan eksternal (seperti SMTP) sedang bermasalah.
- **Keamanan**: Dilengkapi dengan **Rate Limiter**, perlindungan **Secure Headers**, pembatasan ukuran payload, serta validasi input menggunakan **go-playground/validator**.
- **Observabilitas**: Menggunakan **OpenTelemetry** dan **Jaeger** untuk melakukan *distributed tracing*. Memudahkan pelacakan dan pencarian masalah performa mulai dari HTTP masuk hingga *query database*.
- **Pengujian (Testing)**: Logika *backend* dicakup oleh *Unit Test* dan *Integration Test*. *Integration testing* menggunakan *database* pengujian yang terpisah (`pramukacat_test`) untuk menyimulasikan alur dari sisi admin hingga peserta.
- **Load Testing**: Performa sistem telah diukur menggunakan **Grafana k6** untuk memastikan API tidak mengalami kendala saat diakses oleh pengguna secara bersamaan.

### 🎨 Frontend (Next.js, Tailwind CSS)
- **Desain UI & Responsivitas**: Dibangun menggunakan **Tailwind CSS** untuk menyajikan antarmuka yang modern, rapi, dan otomatis menyesuaikan (*responsive*) saat dibuka di PC, tablet, maupun *smartphone*.
- **Performa (Rendering & Optimasi)**: Menggunakan **Next.js (App Router)** dengan dukungan **Server-Side Rendering (SSR)**. Halaman diproses terlebih dahulu di server sehingga proses *loading* awal jauh lebih cepat. Fitur bawaan seperti optimasi gambar (*Image Optimization*) dan pemecahan ukuran file (*Code Splitting*) memastikan aplikasi tetap ringan meski diakses menggunakan koneksi terbatas.
- **Keamanan (Security & Akses)**: Dilindungi oleh sistem *middleware* khusus. Halaman rahasia (seperti dasbor admin atau lembar soal) tidak akan bisa dibuka tanpa sesi login dan token JWT yang sah. Input *form* juga divalidasi terlebih dahulu di sisi *frontend* untuk memastikan data yang dikirim selalu bersih.
- **Pengalaman Pengguna (UX)**: Menyediakan jalan pintas interaktif (*Command Palette*) yang bisa dipanggil dengan menekan `Ctrl+K`, sehingga staf admin bisa mencari atau pindah antar menu dengan jauh lebih cepat.
- **Stabilitas Fitur Ujian**: Halaman lembar jawaban berjalan secara dinamis. Waktu hitung mundur (*countdown timer*) dan penyimpanan jawaban otomatis (*auto-submit*) ke server terjadi di latar belakang tanpa mengharuskan peserta melakukan *refresh* halaman.

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

