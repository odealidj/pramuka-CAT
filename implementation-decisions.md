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

## 3. Mekanisme Inti (Core Mechanisms)

### 3.1. Autentikasi dan Keamanan
- Menggunakan **JSON Web Token (JWT)** atau **Session-based Authentication** untuk proses login.
- **Mencegah Multi-Login:** Peserta tidak bisa login di dua perangkat berbeda secara bersamaan saat ujian berlangsung.

### 3.2. Penanganan Timer dan Waktu Habis
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
│   ├── sql/                  # Folder skema database dan raw queries untuk SQLC
│   │   ├── schema.sql        # Skema tabel database (DDL)
│   │   └── query.sql         # Raw SQL queries (DML)
│   ├── sqlc.yaml             # Konfigurasi generator SQLC
│   ├── go.mod                # Dependency manager Go
│   └── .env.example          # Template environment variables
│
├── docs/                     # Dokumentasi Sistem
│   ├── Pramuka_CAT_PRD.md
│   └── implementation-decisions.md
│
├── docker-compose.yml        # Orchestration untuk Local Development
└── README.md                 # Petunjuk instalasi utama
```
