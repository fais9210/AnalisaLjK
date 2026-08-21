# Sistem Analisis Butir Soal Ujian Siswa (Madrasah / Sekolah)
### Aplikasi Evaluasi Hasil Belajar, Analisis Psikometri Butir Soal, dan Pusat Pelaporan Terpadu

Aplikasi web modern berbasis **React, TypeScript, Express, dan Tailwind CSS** yang dirancang khusus untuk mempermudah guru, wali kelas, dan tim evaluasi madrasah/sekolah dalam mengolah, menganalisis, dan mendokumentasikan hasil ujian siswa secara otomatis, akurat, dan sesuai dengan standar administrasi pendidikan.

---

## 🌟 Fitur Utama

- 📊 **Lembar Analisa Nilai Interaktif**:
  - Mendukung kombinasi soal Pilihan Ganda (PG 1–35), Isian Singkat (1–10), dan Uraian (1–5) dengan bobot skor fleksibel.
  - Perhitungan otomatis nilai akhir siswa, status ketuntasan (KKM), jumlah benar, dan jumlah salah secara *real-time*.
- 🔍 **Analisis Kualitas Butir Soal (Psikometri Evaluasi)**:
  - Perhitungan otomatis **Tingkat Kesukaran** (Sangat Mudah, Mudah, Sedang, Sukar, Sangat Sukar).
  - Perhitungan otomatis **Daya Pembeda** soal (Sangat Baik, Baik, Cukup, Jelek/Perlu Dibuang).
  - Rekomendasi status soal: *Diterima*, *Direvisi*, atau *Dibuang*.
- 📋 **Program Remedial & Pengayaan Otomatis**:
  - Rekap otomatis daftar siswa yang belum tuntas beserta butir soal yang belum dikuasai dan rencana tindakan remedial.
  - Rekap daftar siswa yang telah tuntas untuk program pengayaan materi lanjutan.
- 🖨️ **Pusat Cetak & Ekspor Multi-Format**:
  - **Cetak Lembar Resmi**: Format standar cetak dokumen A4 Landscape dengan kop madrasah dan kolom tanda tangan.
  - **Ekspor Dokumen PDF**: Unduh file PDF resmi Lembar Analisa, Rekap Kualitas Soal, Program Remedial, dan Program Pengayaan dalam sekali klik.
  - **Ekspor Dokumen Excel (.xlsx)**: File workbook Excel *multi-sheet* komprehensif berisi semua lembar kerja dan formula.
  - **Impor Data Nilai dari Excel**: Memungkinkan guru mengunggah nilai dari template spreadsheet.
- ✍️ **Kustomisasi Titimangsa & Tanda Tangan**:
  - Pengaturan lokasi (default: *Karangnongko*), tanggal Masehi, maupun penanggalan Hijriyah (*1448 H*).
  - Tanda tangan terpadu Kepala Madrasah dan Wali Kelas / Guru Pengampu mata pelajaran.
- 👥 **Manajemen Master Data**:
  - Pengelolaan data murid lengkap (nama, NIS, jenis kelamin, kelas, status aktif).
  - Pengelolaan data guru & penugasan wali kelas / guru pengampu.
  - Pengelolaan data kelas dan mata pelajaran (Fan).
- 💾 **Riwayat Ujian & Manajemen Database Fleksibel**:
  - Arsip riwayat ujian tersimpan rapi dan dapat dibuka kembali kapan saja.
  - Fitur **Backup & Restore (.JSON)** data lengkap.
- 🤖 **Integrasi AI Insights & Analisis Otomatis**:
  - Ringkasan evaluasi pedagogis, kelebihan, kelemahan kelas, dan rekomendasi tindak lanjut guru bertenaga AI (Gemini 2.5 Flash) dengan sistem *fallback* cerdas ketika offline.

---

## ⚡ Mode Penyimpanan Data & Dukungan Offline Penuh (Offline-First)

Aplikasi ini dirancang dengan prinsip **Offline-First**, sehingga dapat digunakan dalam berbagai skenario infrastruktur:

| Mode | Kebutuhan Internet | Kebutuhan Database Eksternal | Keterangan |
| :--- | :---: | :---: | :--- |
| **1. Mode Offline / Standalone (Bawaan)** | ❌ Tidak Butuh | ❌ Tidak Butuh | Berjalan 100% di browser menggunakan **LocalStorage**. Seluruh perhitungan nilai, analisis butir soal, pembuatan PDF, dan ekspor Excel diproses langsung di perangkat lokal Anda. |
| **2. Mode Database PostgreSQL Lokal** | ❌ Tidak Butuh | ✅ PostgreSQL di Komputer / Docker | Data tersimpan di server database PostgreSQL lokal pada komputer Anda (`localhost:5432`). Tabel dibuat otomatis. |
| **3. Mode Cloud Database (Neon DB / Render)** | ✅ Butuh | ✅ PostgreSQL di Cloud (Neon DB) | Data tersimpan aman di cloud PostgreSQL untuk akses multi-perangkat atau hosting online di Render. |

---

## 💻 Prasyarat Sistem (Prerequisites)

Sebelum menjalankan aplikasi, pastikan komputer Anda telah terpasang:
- **Node.js** versi 18.0.0 atau lebih baru ([Unduh Node.js](https://nodejs.org/))
- **NPM** (terpasang otomatis bersama Node.js)
- **Web Browser Modern** (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, atau Brave)
- *(Opsional)* **PostgreSQL** atau **Docker** jika ingin menggunakan database server lokal.

---

## 🚀 Panduan Menjalankan Aplikasi Secara Lokal (Offline)

### Langkah 1: Pasang Dependensi (Install Dependencies)
Buka terminal / Command Prompt di folder proyek, lalu jalankan:
```bash
npm install
```

---

### Langkah 2: Pilih Mode Penyimpanan yang Anda Inginkan

#### Opsi A: Mode Standalone / Offline Penuh (Paling Mudah, Tanpa Setup Database)
Anda **tidak perlu** mengkonfigurasi database apa pun. Cukup buat file `.env` kosong atau salin dari template:
```bash
cp .env.example .env
```
*(Biarkan `DATABASE_URL` dan `GEMINI_API_KEY` kosong).*

Jalankan server aplikasi:
```bash
npm run dev
```
Buka browser dan akses: **`http://localhost:3000`**.  
*Semua data siswa, guru, kelas, dan lembar analisa ujian akan tersimpan aman di penyimpanan lokal (LocalStorage) browser Anda dan bisa dicadangkan lewat menu "Riwayat & Backup Data".*

---

#### Opsi B: Mode Database PostgreSQL Lokal (Offline dengan Database Server)

Jika Anda ingin menyimpan data ke database relational PostgreSQL di komputer Anda sendiri:

1. **Jalankan PostgreSQL Lokal** (pilih salah satu):
   - **Menggunakan Docker (Direkomendasikan)**:
     ```bash
     docker run --name postgres-analisa -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=analisa_ujian -p 5432:5432 -d postgres:16-alpine
     ```
   - **Menggunakan Aplikasi PostgreSQL Lokal**: Buat database bernama `analisa_ujian` di PostgreSQL Anda.

2. **Atur File `.env`**:
   Buka file `.env` dan masukkan connection string database lokal Anda:
   ```env
   PORT=3000
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/analisa_ujian
   NODE_ENV=development
   ```

3. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```
   *Server akan otomatis membuat seluruh tabel database (`master_students`, `master_teachers`, `master_classes`, `master_subjects`, `exam_archives`, `app_state`) tanpa perlu menjalankan migrasi manual!*

---

## 📦 Menjalankan Mode Production / Standalone Server

Untuk menjalankan aplikasi dalam mode produksi yang optimal dan cepat:

```bash
# 1. Build aplikasi frontend dan bundle backend
npm run build

# 2. Jalankan server produksi
npm start
```
Aplikasi akan aktif di **`http://localhost:3000`**.

---

## 🌐 Panduan Deploy ke Cloud (Render & Neon DB)

Untuk mempublikasikan aplikasi ke internet secara gratis:

1. **Buat Database Gratis di Neon DB**:
   - Buka [neon.tech](https://neon.tech), buat proyek baru, dan salin Connection String PostgreSQL Anda (contoh: `postgres://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require`).
2. **Deploy di Render**:
   - Buka [render.com](https://render.com) > Buat **New Web Service** dari repositori GitHub Anda.
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - Masukkan Environment Variable:
     - `DATABASE_URL` = *Connection string dari Neon DB Anda*
     - `NODE_ENV` = `production`
     - `GEMINI_API_KEY` = *(Opsional) API Key Google Gemini untuk fitur AI insight*

---

## 📖 Panduan Penggunaan Aplikasi

1. **Konfigurasi Master Data**:
   - Buka tab **Master Data** di bilah menu samping.
   - Periksa atau sesuaikan daftar **Murid**, **Guru & Wali Kelas**, **Rombel Kelas**, dan **Mata Pelajaran (Fan)**.
2. **Pengaturan Lembar Ujian**:
   - Klik tab **Lembar Analisa** atau tombol **Pengaturan Lembar**.
   - Tentukan Nama Ujian, Kelas, Mata Pelajaran, Jumlah Soal (PG/Isian/Uraian), Nilai KKM, dan Titimangsa Tanda Tangan.
3. **Input / Sesuaikan Nilai Siswa**:
   - Masukkan skor per butir soal langsung pada tabel matriks nilai, atau klik **Impor Excel** untuk mengunggah spreadsheet.
   - Kolom Benar, Salah, Total Skor, dan Status KKM akan terkalkulasi otomatis.
4. **Analisis Kualitas Butir Soal**:
   - Buka tab **Kualitas Butir Soal** untuk melihat grafik tingkat kesukaran dan indeks daya pembeda tiap nomor soal.
5. **Cetak & Unduh Laporan**:
   - Buka tab **Pusat Cetak & Pelaporan**.
   - Pilih dokumen yang ingin dicetak atau diunduh (**Lembar Analisa**, **Rekap Kualitas Soal**, **Program Remedial**, **Program Pengayaan**, atau **Unduh Excel Multi-Sheet**).
6. **Pencadangan Data (Backup & Restore)**:
   - Buka tab **Riwayat & Backup Data**.
   - Klik **Unduh Backup (.JSON)** untuk menyimpan salinan lengkap database ke komputer Anda.
   - Anda dapat memulihkannya kapan saja menggunakan tombol **Pulihkan Data (.JSON)**.

---

## ⚙️ Variabel Lingkungan (Environment Variables)

File `.env` mendukung variabel berikut:

```env
# Port server aplikasi (default: 3000)
PORT=3000

# Connection string PostgreSQL (Lokal atau Cloud Neon DB)
# Kosongkan jika ingin berjalan dalam mode standalone browser LocalStorage
DATABASE_URL=postgres://postgres:postgres@localhost:5432/analisa_ujian

# API Key Google Gemini (Opsional: untuk analisis cerdas bertenaga AI)
GEMINI_API_KEY=

# Mode lingkungan (development / production)
NODE_ENV=development
```

---

## 📁 Struktur Direktori Proyek

```text
├── assets/                  # Aset logo, ikon, dan dokumen pendukung
├── server/                  # Modul backend & koneksi database
│   └── db.ts                # Handler PostgreSQL (Lokal & Cloud) dan inisialisasi tabel
├── src/
│   ├── components/          # Komponen UI interaktif
│   │   ├── ExamAnalysisTable.tsx     # Tabel matriks nilai & kalkulasi
│   │   ├── ExamConfigModal.tsx       # Modal konfigurasi ujian & titimangsa
│   │   ├── HistoryAndBackup.tsx      # Manajemen database, arsip & backup JSON
│   │   ├── MasterDataManager.tsx     # Pengelola master data siswa, guru, mapel
│   │   ├── Navbar.tsx                # Header navigasi & status koneksi
│   │   ├── ReportAndPrintCenter.tsx  # Pusat cetak & ekspor PDF/Excel
│   │   ├── Sidebar.tsx               # Navigasi tab utama
│   │   └── StatsDashboard.tsx        # Dashboard visual & rekomendasi pedagogis
│   ├── data/
│   │   └── initialData.ts   # Data sampel default (MMU A-22 Karangnongko)
│   ├── services/
│   │   ├── analysisEngine.ts # Mesin kalkulasi nilai, daya pembeda & psikometri
│   │   ├── excelService.ts   # Mesin ekspor & impor Excel (SheetJS)
│   │   ├── pdfService.ts     # Mesin cetak & generator PDF resmi (jsPDF)
│   │   └── storageService.ts # Layanan sinkronisasi LocalStorage & PostgreSQL
│   ├── App.tsx              # Komponen utama aplikasi
│   ├── index.css            # Desain styling Tailwind CSS
│   ├── main.tsx             # Titik masuk frontend React
│   └── types.ts             # Definisi tipe TypeScript
├── .env.example             # Contoh konfigurasi variabel lingkungan
├── DEPLOYMENT.md            # Panduan langkah-demi-langkah deploy Render & Neon DB
├── metadata.json            # Metadata konfigurasi aplikasi
├── package.json             # Dependensi & skrip aplikasi
├── README.md                # Dokumentasi lengkap aplikasi
├── render.yaml              # Konfigurasi Infrastructure as Code Render
├── server.ts                # Server Express & integrasi Vite middleware
├── tsconfig.json            # Konfigurasi TypeScript
└── vite.config.ts           # Konfigurasi bundler Vite
```

---

## 📄 Lisensi & Hak Cipta

Dikembangkan untuk mendukung kemudahan evaluasi pembelajaran dan administrasi madrasah/sekolah. Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan pendidikan.
