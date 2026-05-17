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
- **Bahasa / Framework:** Go (Golang) menggunakan framework ringan seperti Gin atau Fiber.
- **Alasan:** Go sangat ringan, performanya luar biasa cepat, dan memiliki arsitektur _concurrency_ bawaan yang sangat handal (Goroutines). Ini menjadikannya pilihan sempurna untuk skenario ujian CAT di mana ribuan peserta ujian mungkin menekan tombol submit (atau Auto-Submit) secara bersamaan di menit-menit akhir sesi ujian.

### 2.3. Database Utama (RDBMS)
- **Database:** PostgreSQL
- **Alasan:** Karena aplikasi ini melibatkan relasi data yang kuat (Data User, Jadwal Event, Bank Soal, Relasi Soal-Event, dan Riwayat Jawaban), _Relational Database_ wajib digunakan. PostgreSQL sangat handal untuk integritas data dan transaksi (_ACID compliance_).

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
