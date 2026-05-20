# Product Requirements Document (PRD): Pramuka CAT (Computer Assisted Test)

## 1. Pendahuluan
Aplikasi Pramuka CAT adalah platform ujian berbasis komputer yang dirancang khusus untuk kegiatan kepramukaan. Aplikasi ini memfasilitasi pelaksanaan ujian teori secara digital, terstruktur, dan efisien, menggantikan metode ujian tertulis konvensional.

## 2. Tujuan
- Menyediakan platform ujian digital yang objektif dan transparan.
- Mempermudah panitia/admin dalam mengelola bank soal, jadwal kegiatan ujian, dan validasi peserta.
- Mempercepat proses rekapitulasi penilaian karena hasil langsung diketahui sesaat setelah ujian selesai.

## 3. Spesifikasi Kebutuhan Pengguna (User Requirements)

### 3.1. Hak Akses (Role)
Aplikasi memiliki 2 jenis peran utama:
1. **Admin / Panitia:** Mengelola sistem, bank soal, jadwal event, dan peserta.
2. **Peserta (Anggota Pramuka):** Mengikuti ujian sesuai jadwal yang telah ditentukan dan disetujui.

### 3.2. Fitur Peserta (Anggota Pramuka)
1. **Registrasi & Login:** Peserta dapat mendaftar akun baru menggunakan identitas pramuka (di mana `Nomor Peserta` digunakan sebagai `username` untuk *login*) dan melakukan login ke dalam sistem.
2. **Manajemen Profil:** Peserta dapat melihat dan melengkapi profil, termasuk mengunggah foto profil.
3. **Dashboard Peserta:** Menampilkan daftar sesi/jadwal ujian yang tersedia dan status persetujuan (approval) ujian mereka.
4. **Pelaksanaan Ujian:**
   - Peserta hanya bisa mengakses dan memulai ujian jika statusnya sudah **disetujui (Approved)** oleh Admin.
   - Soal disajikan dalam bentuk **Pilihan Ganda (A, B, C, D)** dan berbasis teks.
   - Urutan soal yang ditampilkan harus **diacak (random)** untuk setiap peserta guna meminimalisir potensi kecurangan.
   - **Sistem Timer / Waktu Pengerjaan:** Terdapat _countdown timer_ di layar peserta sesuai durasi event (misal: 60 menit). Saat waktu habis, sistem akan secara otomatis menyimpan jawaban dan mengakhiri ujian (_Auto-Submit_).
   - **Fitur Auto-Resume (Toleransi Putus Koneksi):** Jika peserta terputus (disconnect) atau browser tertutup, jawaban tersimpan secara _real-time_. Peserta dapat _login_ kembali dan melanjutkan ujian dari soal terakhir dengan sisa waktu yang disesuaikan.
5. **Hasil Ujian:** 
   - Nilai akhir langsung muncul di layar sesaat setelah peserta menekan tombol selesai/submit ujian.
   - Sistem membandingkan nilai peserta dengan **Passing Grade (Batas Lulus)** event tersebut, sehingga menampilkan status **"LULUS"** atau **"TIDAK LULUS"**.

### 3.3. Fitur Admin
1. **Manajemen Admin:** Admin yang sudah ada dapat menambahkan akun admin baru ke dalam sistem.
2. **Manajemen Peserta (CRUD User):**
   - Melihat daftar seluruh anggota pramuka yang terdaftar (List User).
   - Menambah, mengubah, atau menghapus data peserta (menggunakan metode **Soft-Delete** untuk menjaga integritas riwayat ujian masa lalu).
3. **Approval Peserta Ujian:**
   - Admin dapat memvalidasi dan menyetujui (Approve) peserta agar bisa mengikuti event ujian tertentu.
   - Admin memiliki fitur pembatalan (Revoke/Batal) persetujuan, sehingga peserta tersebut terkunci dan tidak bisa mengerjakan soal.
   - Admin dimudahkan dengan antarmuka manajemen peserta *full-page* berskala besar yang dilengkapi fitur pencarian (*Search*) berdasarkan "Nama" atau "Nomor Peserta" (`username`), serta *Pagination* terintegrasi langsung ke *backend* (*server-side pagination*).
4. **Manajemen Soal (Bank Soal - CRUD):**
   - Membuat, membaca, mengubah, dan menghapus soal berbasis teks. Manajemen Bank Soal ini didukung dengan fitur pencarian dan filter *real-time*.
   - Menentukan opsi jawaban A, B, C, D dan mengatur mana yang menjadi kunci jawaban.
   - **Validasi Duplikasi Soal:** Sistem mencegah masuknya soal dengan teks yang sama (mengabaikan perbedaan huruf kapital dan variasi penomoran seperti "1.", "2)", dsb) serta mencegah opsi jawaban yang duplikat dalam satu soal. Pengecekan hanya dilakukan terhadap soal dari **kategori yang masih aktif** — soal dari kategori yang sudah dihapus (diarsipkan) tidak ikut diperiksa sehingga tidak memblokir input soal baru.
   - **Kategori Materi Soal (Tagging):** Admin dapat mengelompokkan soal berdasarkan kategori (contoh: Pengetahuan Umum Kepramukaan/PUPK, Sandi, Tali-temali, Sejarah).
   - **Pengarsipan Otomatis:** Soal yang terkait dengan kategori yang dihapus secara otomatis tidak ditampilkan di Bank Soal dan tidak diikutsertakan dalam pengacakan soal Event baru. Data soal tetap tersimpan di database untuk menjaga integritas riwayat ujian peserta.
   - **Sistem Bobot Soal (Manual \& Auto):** Admin dapat mengatur bobot spesifik untuk setiap soal (misal: soal mudah berbobot 10, soal sulit berbobot 20). Jika Admin tidak melakukan _setup_ bobot secara manual, sistem akan otomatis menerapkan **Auto-Bobot** di mana setiap soal yang diujikan memiliki bobot yang sama rata sehingga total nilai sempurna mengacu pada skala standar (contoh: 10 soal, masing-masing otomatis berbobot 10 agar total skor 100).
5. **Manajemen Kategori Soal:**
   - Admin dapat membuat, mengubah, dan menghapus kategori soal.
   - **Validasi Nama Unik:** Tidak boleh ada dua kategori aktif dengan nama yang sama (tidak peka huruf kapital).
   - **Soft Delete:** Kategori yang dihapus tidak benar-benar dihilangkan dari database, melainkan ditandai (`deleted_at`) sehingga soal-soal lamanya tetap tersimpan untuk keperluan riwayat ujian. Kategori yang sudah dihapus tidak tampil di daftar maupun _dropdown_ pemilihan kategori soal.
6. **Manajemen Jadwal/Sesi (Event Setup):**
   - Membuat jadwal pelaksanaan ujian (Event diterbitkan).
   - **Pemilihan Soal (Distribusi):** Admin dapat mengambil sebagian soal dari Bank Soal untuk dimasukkan ke Event. Misalnya, dari 1000 soal yang ada, Admin bisa memilih 200 soal spesifik secara manual, atau mengatur agar sistem menarik jumlah soal tertentu secara acak (contoh: "Ambil 100 soal acak dari kategori Sandi").
   - Mengatur parameter waktu kapan event ujian dimulai dan ditutup.
   - Menentukan **Passing Grade (Batas Lulus)** untuk event tersebut.
7. **Laporan & Review Jawaban (Monitoring & Export):**
   - Melihat daftar riwayat nilai dari semua peserta yang telah selesai mengerjakan.
   - Melihat rincian ujian per peserta: meninjau soal-soal apa saja yang dikerjakan peserta, apa jawaban yang dipilih peserta, dan mencocokkannya dengan kunci jawaban (via endpoint `GET /admin/exams/approvals/:approval_id/answers`).
   - **Export Laporan (Excel & PDF):** Mengunduh rekap nilai seluruh peserta pada suatu event dalam format **Excel (.xlsx)** atau **PDF** untuk keperluan pelaporan kegiatan Gugus Depan/Kwartir (via endpoint `GET /admin/events/:id/export?format=excel` atau `?format=pdf`).

---

## 4. Kebutuhan Pengujian Sistem (Testing Requirements)
Untuk menjamin stabilitas aplikasi dan akurasi logika penilaian (scoring), sistem diwajibkan untuk mengimplementasikan pengujian otomatis (_Automated Testing_):
1. **Unit Test:** Menguji secara mandiri fungsi-fungsi inti secara terisolasi. Fokus pada logika kalkulasi bobot soal, mekanisme pengacakan soal, dan konversi batas waktu (timer).
2. **Integration Test:** Menguji integrasi alur keseluruhan dari _Backend_ ke _Database_ (PostgreSQL) dan _Cache_ (Redis). Tujuannya memastikan _endpoint HTTP_, _middleware_ (Auth), dan _query_ database (SQLC) bekerja sinkron.

**Struktur Folder Pengujian (Go Backend):**
```text
backend/
├── internal/
│   └── core/services/     # Unit Tests diletakkan bersebelahan dengan file yang diuji
│       ├── exam_service.go
│       └── exam_service_test.go
├── tests/                 # Folder terpisah khusus untuk Integration Tests
│   ├── integration/
│   │   ├── auth_flow_test.go
│   │   ├── exam_flow_test.go
│   │   └── setup_test.go  # Inisialisasi mock database/Redis untuk testing
```

---

## 5. Keputusan Teknis (Technical Decisions)
Untuk detail arsitektur, teknologi yang akan digunakan (_Tech Stack_), dan mekanisme sistem di belakang layar, silakan merujuk ke dokumen **[Implementation Decisions](docs/implementation-decisions.md)**.
