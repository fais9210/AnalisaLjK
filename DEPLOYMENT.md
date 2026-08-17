# Panduan Publikasi Aplikasi ke Render dengan Neon DB (PostgreSQL)

Aplikasi **Sistem Analisis Butir Soal Ujian Madrasah MMU A-22 Karangnongko** telah siap 100% untuk di-deploy ke **Render** dan terhubung ke **Neon DB**.

---

## 1. Buat Database di Neon DB (Gratis)
1. Kunjungi **[https://neon.tech](https://neon.tech)** dan login/daftar akun gratis.
2. Klik **"Create Project"**, beri nama proyek (misal: `analisa-ujian-db`), lalu pilih region terdekat (misal: `ap-southeast-1` Singapore).
3. Setelah database terbuat, salin **Connection String** PostgreSQL Anda. Formatnya:
   ```text
   postgres://[user]:[password]@[ep-xxxx].region.aws.neon.tech/neondb?sslmode=require
   ```

---

## 2. Deploy ke Render (Web Service)
1. Kunjungi **[https://render.com](https://render.com)** dan buat **New Web Service**.
2. Hubungkan repositori GitHub/GitLab Anda.
3. Masukkan konfigurasi berikut:
   - **Name**: `analisa-ujian-madrasah`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. Di bagian **Environment Variables**, tambahkan:
   - `DATABASE_URL` = *(Tempelkan Connection String dari Neon DB Anda)*
   - `NODE_ENV` = `production`
   - `GEMINI_API_KEY` = *(Opsional: masukkan API key Gemini untuk fitur AI Insight evaluasi pedagogis otomatis)*

5. Klik **"Create Web Service"**.

---

## 3. Cara Kerja Database di Aplikasi
- **Auto Table Initialization**: Saat server pertama kali berjalan dengan `DATABASE_URL`, sistem otomatis membuat tabel database PostgreSQL (`master_students`, `master_teachers`, `master_classes`, `master_subjects`, `exam_archives`, `app_state`).
- **Cloud & Offline Hybrid**: Jika database belum terpasang atau sedang offline, aplikasi tetap bekerja mulus menggunakan penyimpanan lokal browser (LocalStorage) tanpa error.
- **Sinkronisasi Dua Arah**: Pada menu **Riwayat & Backup Data**, terdapat indikator status koneksi Neon DB serta tombol **Unggah ke Neon DB** dan **Tarik dari Neon DB**.
