# Sequence Diagrams: Pramuka CAT

Dokumen ini berisi diagram urutan (_Sequence Diagram_) yang menjelaskan alur interaksi antara Pengguna, Frontend (Next.js), Backend API (Go Echo), Database Utama (PostgreSQL), dan Cache (Redis) untuk fitur-fitur krusial di aplikasi.

## 1. Alur Login & Autentikasi
Menjelaskan bagaimana peserta atau admin memvalidasi identitas mereka.

```mermaid
sequenceDiagram
    participant P as Peserta/Admin
    participant F as Frontend (Next.js)
    participant B as Backend (Go API)
    participant DB as Postgres

    P->>F: Input Username & Password
    F->>B: POST /api/v1/auth/login
    B->>DB: Query User by Username
    DB-->>B: Return User Data & Hash Password
    B->>B: Verify Password Hash
    alt Password Valid
        B->>B: Generate JWT Token
        B-->>F: Return Token & User Info (200 OK)
        F->>P: Redirect ke Dashboard
    else Password Invalid
        B-->>F: Return Error (401 Unauthorized)
        F->>P: Tampilkan Pesan Error
    end
```

---

## 2. Alur Persetujuan (Approval) Peserta
Peserta tidak bisa sembarangan mengikuti ujian meskipun sudah login. Mereka harus mendaftar/memilih *event*, lalu disetujui Admin.

```mermaid
sequenceDiagram
    participant P as Peserta
    participant A as Admin
    participant F as Frontend
    participant B as Backend API
    participant DB as Postgres

    P->>F: Request Ikut Event Ujian
    F->>B: POST /api/v1/events/{id}/enroll
    B->>DB: Insert Status = 'pending'
    B-->>F: Sukses (Menunggu Approval)
    
    A->>F: Buka Daftar Peserta Pending
    F->>B: GET /api/v1/admin/approvals
    B->>DB: Fetch Data
    DB-->>B: Data Peserta Pending
    B-->>F: List Peserta
    
    A->>F: Klik "Approve" untuk Peserta X
    F->>B: PUT /api/v1/admin/approvals/{id} (status: approved)
    B->>DB: Update Status = 'approved'
    B-->>F: OK
```

---

## 3. Alur Pelaksanaan Ujian (Real-time & Auto-Resume)
Ini adalah alur paling penting, di mana Redis berperan sebagai penyimpan jawaban sementara untuk menahan *load* ke database PostgreSQL.

```mermaid
sequenceDiagram
    participant P as Peserta
    participant F as Frontend
    participant B as Backend API
    participant R as Redis
    participant DB as Postgres

    P->>F: Klik "Mulai Ujian"
    F->>B: POST /api/v1/exams/{id}/start
    B->>DB: Cek Status (Apakah Approved?) & Waktu Event
    DB-->>B: Valid
    B->>DB: Tarik Soal Acak (Sesuai Konfigurasi Event)
    DB-->>B: Daftar Soal
    B->>R: Cache Daftar Soal & Sisa Waktu Ujian
    B-->>F: Return Soal & Durasi Timer
    F->>P: Tampilkan Lembar Ujian & Mulai Timer

    loop Setiap Kali Memilih Jawaban
        P->>F: Pilih Opsi (A/B/C/D)
        F->>B: PUT /api/v1/exams/{id}/answer
        B->>R: Simpan Jawaban Sementara (Real-time)
        B-->>F: OK (Tanpa Hit DB)
    end
```

---

## 4. Alur Penilaian & Auto-Submit (Scoring Flow)
Terjadi ketika waktu di *browser* habis, atau peserta sengaja menekan tombol "Selesai".

```mermaid
sequenceDiagram
    participant P as Peserta/Sistem
    participant F as Frontend (Timer)
    participant B as Backend API
    participant R as Redis
    participant DB as Postgres

    alt Klik Submit Manual
        P->>F: Klik "Selesai"
    else Waktu Habis (Auto-Submit)
        F->>F: Timer = 00:00 (Trigger Event)
    end

    F->>B: POST /api/v1/exams/{id}/submit
    B->>R: Tarik Semua Jawaban Sementara Peserta
    R-->>B: List Jawaban
    B->>DB: Cocokkan Jawaban dengan Kunci (Kalkulasi Bobot)
    B->>B: Hitung Total Nilai & Tentukan Lulus/Tidak (Passing Grade)
    B->>DB: Insert Nilai Akhir & Ubah Status Jadi 'completed'
    B->>R: Hapus Data Cache Ujian Peserta
    B-->>F: Return Nilai Akhir & Status Kelulusan
    F->>P: Tampilkan Layar Hasil Ujian
```
