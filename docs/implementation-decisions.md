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

## 4. Infrastruktur dan Deployment
- Aplikasi akan di-containerisasi menggunakan **Docker** agar mudah dideploy di berbagai server (VPS atau Cloud).
- Menggunakan NGINX sebagai _Reverse Proxy_ dan pengelola sertifikat HTTPS (SSL) agar transmisi data ujian aman.

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
│   │   └── api/              # Entry point aplikasi (main.go - Inisialisasi Echo Server)
│   ├── internal/             # Kode aplikasi privat (Berdasarkan Hexagonal Architecture / Ports and Adapters)
│   │   ├── core/             # Core Business Logic (Tidak bergantung pada framework eksternal)
│   │   │   ├── domain/       # Structs, Entities, dan Business Rules
│   │   │   ├── ports/        # Interfaces (Inbound & Outbound Ports)
│   │   │   └── services/     # Implementasi Usecase (Inbound Ports)
│   │   ├── adapters/         # Infrastruktur dan Komunikasi Luar (Bergantung pada framework)
│   │   │   ├── handler/      # Inbound Adapter: Echo HTTP handlers/controllers
│   │   │   └── repository/   # Outbound Adapter: Implementasi Outbound Ports (Postgres/Redis)
│   │   │       └── sqlcgen/  # Package kode Go hasil generate otomatis dari SQLC
│   │   └── middleware/       # Echo custom middleware (JWT Auth, CORS)
│   ├── pkg/                  # Utilities eksternal/publik (Bisa di-share antar project)
│   │   └── database/         # Konfigurasi koneksi Postgres & Redis
│   ├── sql/                  # Folder terkait database (Migrasi & SQLC)
│   │   ├── migrations/       # Folder file migrasi versi DB (.up.sql & .down.sql)
│   │   ├── schema.sql        # Skema tabel database (DDL) untuk referensi SQLC
│   │   └── query.sql         # Raw SQL queries (DML) untuk SQLC
│   ├── sqlc.yaml             # Konfigurasi generator SQLC
│   ├── tests/                # Folder terpisah khusus Integration Tests
│   │   └── integration/      # Test integrasi DB, Redis, dan Endpoint API
│   ├── go.mod                # Dependency manager Go
│   └── .env.example          # Template environment variables
│
├── docs/                     # Dokumentasi Sistem
│   ├── Pramuka_CAT_PRD.md
│   ├── implementation-decisions.md
│   ├── sequence-diagrams.md
│   └── database-erd.md
│
├── docker-compose.yml        # Orchestration untuk Local Development
└── README.md                 # Petunjuk instalasi utama
```
