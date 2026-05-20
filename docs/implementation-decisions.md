# Implementation Decisions: Pramuka CAT

Dokumen ini memuat keputusan-keputusan teknis utama yang akan digunakan sebagai landasan dalam pengembangan aplikasi Pramuka CAT (Computer Assisted Test).

## 1. Arsitektur Sistem
Aplikasi akan menggunakan arsitektur **Client-Server** berbasis web (Web Application) untuk memudahkan akses peserta dari berbagai perangkat (laptop/smartphone) melalui browser tanpa perlu menginstal aplikasi khusus.

## 2. Pilihan Teknologi (Tech Stack) Rekomendasi

### 2.1. Frontend (Antarmuka Pengguna)
- **Framework:** React.js / Next.js
- **Alasan:** Modern, sangat reaktif untuk antarmuka ujian (seperti perpindahan soal tanpa reload), dan memiliki ekosistem yang luas. Next.js sangat baik untuk SEO dan routing yang terstruktur.
- **Styling:** Tailwind CSS (untuk desain yang rapi, _responsive_, dan pengerjaan cepat).

### 2.2. Backend (Server & API)
- **Bahasa / Framework:** Go (Golang) menggunakan framework **Echo**.
- **Alasan:** Go sangat ringan, kinerjanya sangat cepat, dan tangguh dengan _concurrency_ (Goroutines). **Echo** dipilih sebagai _best practice_ karena menyajikan _router_ HTTP berkinerja tinggi, manajemen _middleware_ yang elegan, dan sangat solid untuk membangun REST API berskala besar secara terstruktur.

### 2.3. Database Utama (RDBMS) & Database Interaction
- **Database:** PostgreSQL
- **Database Tool:** **sqlc** (Sebagai pengganti ORM konvensional)
- **Alasan:** Karena aplikasi ini melibatkan relasi data yang kuat, _Relational Database_ wajib digunakan. Untuk interaksi ke PostgreSQL, proyek ini secara eksplisit tidak menggunakan ORM (seperti GORM) demi performa maksimal, melainkan menggunakan **sqlc**. Sqlc akan membaca _raw SQL queries_ dan mengompilasinya menjadi kode Go yang _type-safe_, memastikan *query* dieksekusi dengan kecepatan super tinggi tanpa adanya _overhead_ eksekusi khas ORM.

### 2.4. Temporary Storage & Caching (Untuk Fitur Ujian)
- **Sistem:** Redis
- **Alasan:** Sangat krusial untuk fitur **Auto-Resume** dan penyimpanan jawaban sementara secara _real-time_. Setiap kali peserta menjawab 1 soal, jawaban disimpan cepat di Redis sebelum disinkronisasikan secara *bulk* ke PostgreSQL saat _Submit_ atau waktu habis. Ini akan mengurangi beban *query* ke database utama.

### 2.5. Framework Pengujian (Testing Stack)
- **Unit Testing:** Go standard library `testing` dipadukan dengan **`github.com/stretchr/testify`** (untuk *assertions* dan *mocking*).
- **Integration Testing:** **`testcontainers-go`** (Direkomendasikan) untuk men-*spin-up* *container* PostgreSQL & Redis secara otomatis dan terisolasi khusus untuk *testing*, guna mencegah tumpang-tindih data dengan database *development*/*production*.

## 3. Mekanisme Inti (Core Mechanisms)

### 3.1. Autentikasi dan Keamanan (Stateful JWT)
- Menggunakan strategi **Dual Token (Access & Refresh Token)** untuk mengamankan proses login secara _Enterprise-grade_.
- **Access Token:** Berumur pendek (misal: 15 menit), divalidasi dengan sangat cepat melalui pengecekan Session ID di **Redis**.
- **Refresh Token:** Berumur panjang, disimpan permanen di tabel `sessions` pada **PostgreSQL**. Memungkinkan pencabutan akses jarak jauh secara instan (Revoke) dengan mengeset `is_blocked = true`.
- **Mencegah Multi-Login:** Peserta tidak bisa login di dua perangkat berbeda secara bersamaan karena pembatasan _active session_ tunggal di DB.

### 3.2. Role-Based Access Control (RBAC)
- **Arsitektur Kolom Tunggal:** Tidak ada tabel `roles` atau `permissions` yang terpisah demi menjaga kesederhanaan dan kecepatan _query_. Peran pengguna ("admin", "peserta") disimpan langsung dalam kolom `role` (VARCHAR) di tabel `users`.
- Saat otentikasi berhasil, nilai `role` ini akan disematkan secara kriptografis ke dalam **Claims JWT**.
- Middleware **RequireRole** di lapisan HTTP (Echo) akan membaca peran langsung dari JWT tanpa membebani database dengan *query* tambahan, menjadikannya arsitektur yang sangat efisien untuk sistem CAT ini.

### 3.3. Penanganan Timer dan Waktu Habis
- Timer berjalan secara mandiri di sisi _client_ (browser).
- Namun, **Backend tetap melakukan validasi akhir**. Saat sesi event dimulai, server mencatat _Start Time_. Jika peserta mengirim jawaban setelah _Start Time + Durasi + Toleransi Keterlambatan_ habis, sistem server akan menolak jawaban tambahan tersebut. Ini mencegah kecurangan memanipulasi _timer_ di browser.

### 3.3. Pengacakan Soal (Randomization)
- Pengacakan soal tidak dilakukan di sisi frontend (untuk menghindari peserta mengintip _source_ soal yang tersembunyi).
- Saat peserta menekan "Mulai Ujian", Backend akan melakukan penarikan soal (sesuai distribusi), mengacaknya (algoritma _Fisher-Yates_ atau fungsi `RANDOM()` SQL yang di-cache), dan menyimpannya sebagai "Paket Soal Peserta X" di database/Redis. 

### 3.4. Standarisasi API Response & Pagination
- Seluruh endpoint API mematuhi standar JSON tunggal (melalui package `pkg/response`) yang memuat properti mutlak: `success`, `code`, `message`, `data`, `meta`, dan `errors`.
- Meta pagination (`page`, `limit`, `total_records`, dll) diotomatisasi pada lapisan handler untuk setiap request berjenis koleksi/daftar.

### 3.5. Penilaian Otomatis (Auto-Bobot) & Skala Nilai
- Backend menghitung skor akhir menggunakan pendekatan matematis proporsional yang berskala maksimum 100 secara default.
- Rumus: `(Total Bobot Jawaban Benar / Total Bobot Seluruh Soal) * 100`.
- Pendekatan ini memungkinkan *Auto-Bobot* (ketika semua soal berbobot default 1) sekaligus mendukung perhitungan berkeadilan jika Admin mengatur bobot sulit/mudah (manual) untuk masing-masing soal.

### 3.6. Manajemen Penyimpanan File (Foto Profil)
- Mengingat aplikasi akan di-hosting pada layanan shared hosting/VPS standar (seperti Hostinger), penyimpanan file media (seperti foto profil peserta) menggunakan pendekatan **Local Storage**.
- File diunggah ke *endpoint* khusus (`POST /api/v1/users/me/photo`) dan disimpan pada direktori `/uploads` pada server Backend. File kemudian di-*serve* secara statis untuk dibaca oleh Frontend.

### 3.7. Alur Registrasi
- Pendaftaran (*Self-Registration*) diizinkan untuk calon peserta melalui rute publik. Secara *default*, peran yang diberikan adalah `peserta`.
- Peserta yang mendaftar dan melengkapi data tidak bisa langsung mengikuti event ujian sampai mereka di-_approve_ oleh admin pada halaman partisipan event.

### 3.8. Soft Delete Kategori & Pengarsipan Soal
Ini adalah keputusan arsitektur data yang paling kritikal untuk menjaga **integritas riwayat ujian**.

#### Permasalahan
Jika kategori dihapus secara permanen (*hard delete*), soal-soal yang terikat padanya dan riwayat ujian yang melibatkan soal tersebut akan rusak integritasnya.

#### Keputusan: Soft Delete Berbasis `deleted_at` + Unique Partial Index
- Kolom `deleted_at TIMESTAMP WITH TIME ZONE` ditambahkan ke tabel `categories`.
- Aksi "Hapus" pada kategori **tidak menjalankan `DELETE FROM`**, melainkan `UPDATE categories SET deleted_at = NOW()`. Ini adalah *soft delete*.
- **Unique Partial Index** dipasang di level database:
  ```sql
  CREATE UNIQUE INDEX categories_name_unique_idx ON categories (name) WHERE deleted_at IS NULL;
  ```
  Hasilnya: dua kategori aktif tidak bisa bernama sama, namun kategori yang sudah dihapus boleh memiliki nama yang sama dengan kategori aktif (memungkinkan Admin membuat ulang kategori dengan nama yang sama di kemudian hari).
- Validasi nama unik juga dilakukan di lapisan *Service* (Go) dengan memanggil `GetCategoryByName` sebelum menyimpan, untuk menghasilkan pesan *error* yang informatif (HTTP 400) alih-alih membiarkan *error* database mentah (HTTP 500) muncul ke pengguna.

#### Konsekuensi Pengarsipan Otomatis Soal
Semua *query* yang melibatkan soal melakukan `JOIN categories c ON q.category_id = c.id WHERE c.deleted_at IS NULL`. Dampaknya:
1. **Bank Soal (ListQuestions):** Soal dari kategori yang dihapus otomatis tidak muncul di daftar Bank Soal.
2. **Validasi Duplikasi (CheckDuplicateQuestion):** Soal dari kategori yang dihapus tidak ikut dicek, sehingga soal baru dengan teks yang sama bisa ditambahkan ke kategori aktif.
3. **Pengacakan Event (AddRandomEventQuestions):** Soal dari kategori yang dihapus tidak bisa tertarik secara acak ke dalam Event ujian baru.
4. **Integritas Riwayat Terjaga:** Data soal dan jawaban peserta dari ujian masa lalu tetap utuh di database, karena tidak ada data yang benar-benar dihapus.

## 4. Infrastruktur dan Deployment
- Aplikasi akan di-containerisasi menggunakan **Docker** agar mudah dideploy di berbagai server (VPS atau Cloud).
- **Dockerfile (Multi-Stage Build):** Backend Go menggunakan pola *multi-stage build*. Tahap pertama (`Builder`) mengompilasi *binary* menggunakan image Go Alpine. Tahap kedua (`Final`) hanya menyalin *binary* ke image Alpine murni yang sangat ringan, tanpa *source code* sisa.
- **Docker Compose:** Orkestrasi seluruh layanan (`postgres`, `redis`, `migrate`, `api`) dengan urutan *startup* yang ditegaskan via `depends_on` + `healthcheck`. Service `api` baru akan menyala setelah migrasi database selesai dijalankan.
- **Makefile:** Disediakan sebagai antarmuka perintah DevOps yang terpadu. Perintah utama:
  - `make infra-up` / `make infra-down` — Menyalakan/mematikan HANYA infrastruktur (Postgres, Redis, Migrate) untuk sesi *debugging* lokal.
  - `make up` / `make down` — Menjalankan/menghentikan seluruh sistem termasuk Backend API.
  - `make run` — Menjalankan API Go langsung di host (untuk mode *debug*).
  - `make seed` / `make clear-seed` — Memasukkan atau membersihkan data simulasi.
  - `make reset-db` — Reset penuh database (migrate-down → migrate-up → seed).
- Menggunakan NGINX sebagai _Reverse Proxy_ dan pengelola sertifikat HTTPS (SSL) agar transmisi data ujian aman.

### 4.1. Graceful Shutdown
- Backend API mengimplementasikan *graceful shutdown* standar industri. Saat menerima sinyal `SIGTERM` atau `SIGINT` (dari Docker, Kubernetes, atau Ctrl+C), server tidak langsung mati.
- Server berhenti menerima *request* baru, tetapi menunggu hingga seluruh *request* yang sedang diproses selesai (dengan batas waktu maksimal **10 detik**) sebelum benar-benar menutup koneksi.
- Ini memastikan tidak ada data peserta yang hilang di tengah proses *submit* ujian akibat *deployment* atau *restart* server.

### 4.2. Health Check Endpoint
- Tersedia endpoint `GET /health` yang melakukan pengecekan koneksi aktif (*liveness & readiness probe*) ke PostgreSQL dan Redis setiap kali dipanggil.
- Mengembalikan HTTP **200** jika semua komponen sehat, dan HTTP **503 Service Unavailable** jika salah satu komponen terputus, lengkap dengan detail komponen mana yang bermasalah.
- Endpoint ini sangat krusial untuk integrasi dengan *load balancer* dan sistem monitoring di *production* (Kubernetes, AWS ALB, dsb).

### 4.3. Distributed Tracing — Jaeger + OpenTelemetry
- Sistem menggunakan **OpenTelemetry (OTEL) SDK** sebagai standar instrumentasi yang *vendor-neutral*, dengan **Jaeger** sebagai backend visualisasi trace.
- `jaeger-client-go` tidak digunakan karena sudah *deprecated* sejak 2022. Standar resmi penggantinya adalah OTEL SDK.
- **Alur pengiriman trace:** `Go App → OTLP Exporter (gRPC) → Jaeger Collector → Jaeger UI`
- **Mengapa gRPC untuk transport OTLP?** OTLP mendukung dua protokol transport: gRPC (port 4317) dan HTTP (port 4318). gRPC dipilih karena menggunakan format *binary/protobuf* yang lebih efisien dan latensi lebih rendah dibandingkan HTTP/JSON. Ini bukan arsitektur gRPC microservice — melainkan hanya *kabel* internal pengiriman data telemetri.
- **`otelecho` middleware** dipasang di Echo untuk menciptakan **span otomatis pada setiap HTTP request** tanpa perlu mengubah satu handler pun. Setiap span berisi: method, URL, status code, latency, dan error.
- **Jaeger UI** tersedia di `http://localhost:16686` untuk visualisasi dan analisis trace.

## 5. Struktur Direktori Proyek
Mengingat frontend dan backend menggunakan teknologi yang berbeda (Next.js dan Go), struktur direktori utama akan memisahkan keduanya secara jelas:

```text
PramukaCAT/
├── frontend/                 # Aplikasi Next.js (React)
│   ├── src/
│   │   ├── app/              # App Router (Pages, Layouts, Routing)
│   │   ├── components/       # Reusable UI components (Tombol, Modal, Card)
│   │   ├── hooks/            # Custom React hooks (useTimer, useAuth)
│   │   ├── services/         # Fungsi fetcher HTTP ke Backend API
│   │   └── utils/            # Helper functions
│   ├── public/               # Asset statis (Logo Pramuka, Icons)
│   ├── package.json          # Dependency frontend
│   └── tailwind.config.ts    # Konfigurasi Tailwind CSS
│
├── backend/                  # Aplikasi Go (REST API dengan Echo Framework)
│   ├── cmd/
│   │   ├── api/              # Entry point aplikasi (main.go - Graceful Shutdown, Health Check, Routing)
│   │   ├── seeder/           # Script pengisian data simulasi (seed)
│   │   └── clear_seed/       # Script pembersihan data simulasi
│   ├── internal/             # Kode aplikasi privat (Berdasarkan Hexagonal Architecture / Ports and Adapters)
│   │   ├── core/             # Core Business Logic (Tidak bergantung pada framework eksternal)
│   │   │   ├── domain/       # Structs, Entities, dan Business Rules
│   │   │   ├── ports/        # Interfaces (Inbound & Outbound Ports)
│   │   │   └── services/     # Implementasi Usecase (Inbound Ports)
│   │   ├── adapters/         # Infrastruktur dan Komunikasi Luar (Bergantung pada framework)
│   │   │   ├── handler/      # Inbound Adapter: Echo HTTP handlers/controllers
│   │   │   └── repository/   # Outbound Adapter: Implementasi Outbound Ports (Postgres/Redis)
│   │   │       └── sqlcgen/  # Package kode Go hasil generate otomatis dari SQLC
│   │   └── middleware/       # Echo custom middleware (JWT Auth, RBAC Role)
│   ├── pkg/                  # Utilities eksternal/publik (Bisa di-share antar project)
│   │   ├── database/         # Konfigurasi koneksi Postgres & Redis
│   │   ├── response/         # Standar format JSON response (success & error)
│   │   ├── tracer/           # Inisialisasi OpenTelemetry TracerProvider untuk Jaeger
│   │   └── utils/            # Utilities (hashing password, dsb)
│   ├── sql/                  # Folder terkait database (Migrasi & SQLC)
│   │   ├── migrations/       # Folder file migrasi versi DB (.up.sql & .down.sql)
│   │   ├── schema.sql        # Skema tabel database (DDL) untuk referensi SQLC
│   │   └── query.sql         # Raw SQL queries (DML) untuk SQLC
│   ├── sqlc.yaml             # Konfigurasi generator SQLC
│   ├── tests/                # Folder terpisah khusus Integration Tests
│   │   └── integration/      # Test integrasi DB, Redis, dan Endpoint API
│   ├── Dockerfile            # Multi-Stage Build untuk production image
│   ├── go.mod                # Dependency manager Go
│   └── .env.example          # Template environment variables
│
├── docs/                     # Dokumentasi Sistem
│   ├── Pramuka_CAT_PRD.md
│   ├── implementation-decisions.md
│   ├── sequence-diagrams.md
│   └── database-erd.md
│
├── docker-compose.yml        # Orchestration untuk Local Development (Postgres, Redis, Migrate, API, Jaeger)
├── Makefile                  # Perintah DevOps: infra-up/down, up/down, seed, clear-seed, reset-db, build, test, swagger
└── README.md                 # Petunjuk instalasi utama
```
