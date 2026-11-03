# DOKUMEN HANDOVER & PANDUAN PENGEMBANGAN AI: FINETERN

Dokumen ini disusun sebagai ringkasan teknis menyeluruh (*context & technical handover*) agar AI asisten berikutnya dapat langsung melanjutkan proyek **Finetern** tanpa kehilangan konteks, aturan arsitektur, maupun standar kode yang telah disepakati.

---

## 1. Identitas Proyek & Tim

- **Nama Proyek:** **Finetern** (Digital Internship Recruitment Platform for Vocational High Schools)
- **Fokus Utama:** Platform rekrutmen magang siswa SMK berbasis bukti portofolio proyek riil, pencocokan keahlian mikro (*Micro-Skills Matching Engine*), dan rekomendasi belajar kurikulum adaptif dengan **Google Gemini AI**.
- **Mata Kuliah:** IK300 Mobile Programming (Universitas Pendidikan Indonesia / UPI)
- **Dosen Pengampu:** Erlangga, S.Kom., M.T.
- **Repositori Git:** `https://github.com/tsalis-dev/finetern-app.git`
  - Cabang Aktif: `develop` (pengembangan harian) & `main` (rilis stabil)
  - Struktur Proyek: Monorepo (`/backend` dan `/mobile`)

---

## 2. Aturan Teknis & Tech Stack (DIKUNCI / GUARDRAILS)

Setiap AI yang melanjutkan proyek ini **WAJIB** mematuhi batasan teknis berikut:

| Komponen | Pilihan Teknologi | Versi / Spesifikasi | Catatan Kritis untuk AI |
| :--- | :--- | :--- | :--- |
| **Mobile Framework** | React Native Expo | **Expo SDK 57** (`react-native` 0.86.3, `react` 19.2.3) | **DILARANG memakai `expo-router`**. Gunakan standar `@react-navigation` (*Native Stack* & *Bottom Tabs*). |
| **Mobile Navigation** | `@react-navigation` | `^7.x` | Struktur 4 grup: `AuthStack`, `StudentTabs` (5 tab), `SchoolTabs` (3 tab), `IndustryTabs` (4 tab). |
| **Mobile State** | `zustand` + `async-storage` | `zustand@^5.0.3` | Menyimpan sesi `user`, `token`, `role`, dan fungsi simulator peran `switchRole`. |
| **HTTP Client** | `axios` | `^1.7.9` | Interceptor Bearer JWT otomatis terpasang di `mobile/src/api/axiosClient.js`. |
| **Design System** | Toss-Style Tokens | `mobile/src/utils/theme.js` | Jarak konsisten (4, 8, 16, 24, 32, 48pt), warna primer `#2563EB`, grayscale slate high-trust, tanpa gradasi liar. Desain fleksibel untuk diselaraskan dengan rancangan Figma pemilik proyek. |
| **Backend Runtime** | Node.js + Express.js | `express@^5.x` | Arsitektur modular MVC (`config/`, `controllers/`, `middlewares/`, `routes/`). |
| **Basis Data** | MySQL 8.x (Laragon) | Port `3306`, DB: `finetern_db` | Akses via `mysql2/promise` dengan *connection pool* di `backend/src/config/db.js`. |
| **Keamanan Auth** | `jsonwebtoken` & `bcryptjs` | JWT Bearer Token | Kata sandi di-*hash* dengan bcrypt salt rounds 10. |
| **Upload Berkas** | `multer` | Penyimpanan lokal `/backend/uploads` | Untuk upload foto bukti karya portofolio siswa. |
| **AI Integration** | Google Gemini API | **SDK: `@google/genai`** | **DILARANG memakai `@google/generative-ai` yang sudah deprecated**. |
| **Format Respon API** | JSON Seragam | Wajib selalu: `{ success: boolean, message: string, data: object/array }` |

---

## 3. Status Progres Terkini (Tahap 1: SELESAI 100%)

Tahap 1 (*Fondasi Sistem, Skema Data & Kerangka Navigasi 3 Role*) telah tuntas diimplementasikan, diuji bundling Android, dan di-push ke GitHub:

### A. Basis Data (MySQL Laragon: `finetern_db`)
- Berkas skema: `database/schema.sql` (12 tabel InnoDB relasional terhubung *foreign key*):
  1. `users` (id, email, password, role, is_active)
  2. `schools` (id, user_id, npsn, nama_sekolah, alamat, kota)
  3. `students` (id, user_id, school_id, nisn, nama_lengkap, jurusan, kelas)
  4. `industries` (id, user_id, nama_industri, sektor_bidang, penanggung_jawab)
  5. `skills` (id, nama_skill, kategori, deskripsi)
  6. `student_skills` (id, student_id, skill_id, proficiency_level, is_validated)
  7. `portfolios` (id, student_id, skill_id, judul_proyek, deskripsi, tautan_proyek, file_lampiran)
  8. `internship_vacancies` (id, industry_id, judul_posisi, deskripsi, kuota, uang_saku, batas_lamaran, status)
  9. `vacancy_skills` (id, vacancy_id, skill_id, min_proficiency, bobot)
  10. `applications` (id, vacancy_id, student_id, match_rate, status)
  11. `learning_modules` (id, skill_id, judul_modul, konten, prompt_gemini_snapshot)
  12. `assessment_records` (id, student_id, module_id, skor_evaluasi, tanggal_tes)
- Berkas seeder: `database/seed.sql` (6 dummy user aktif terenkripsi, 10 micro-skills, portofolio, dan lowongan).

### B. Backend (`/backend`)
- `src/config/db.js`: Pool koneksi MySQL aman dengan pesan logging informatif.
- `src/config/gemini.js`: Inisialisasi klien `@google/genai` membaca `GEMINI_API_KEY`.
- `src/middlewares/authMiddleware.js`: Verifikasi JWT Bearer dan pembatasan peran (*Role-Based Access Control*).
- `src/middlewares/errorHandler.js`: Penanganan error terpusat sesuai standar respon JSON.
- `src/middlewares/uploadMiddleware.js`: Filter upload gambar portofolio (JPG/PNG max 5MB).
- `src/controllers/healthController.js` & `src/routes/healthRoutes.js`: Endpoint `GET /api/health` teruji `200 OK` (database `CONNECTED`).
- `server.js`: Menjalankan server pada port `5000`.

### C. Frontend Mobile (`/mobile`)
- **Navigasi Multi-Peran:**
  - `src/navigation/AppNavigator.js`: Conditional routing (Login Screen vs Role Tabs).
  - `src/navigation/StudentTabs.js`: 5 tab Siswa (Beranda, Lowongan, Portofolio, AI Mentor, Profil).
  - `src/navigation/SchoolTabs.js`: 3 tab Guru (Dashboard, Validasi Portofolio, Profil Guru).
  - `src/navigation/IndustryTabs.js`: 4 tab Industri (Dashboard Rekomendasi, Lowongan, Pelamar AI, Profil Industri).
- **Layar Siap Pakai:**
  - `src/screens/auth/LoginScreen.js`: Tab switch peran (Siswa/Guru/Industri) + tombol Masuk Cepat Demo.
  - `src/screens/student/*`: `StudentHomeScreen.js`, `StudentExploreScreen.js`, `StudentPortfolioScreen.js`, `StudentAIMentorScreen.js`, `StudentProfileScreen.js`.
  - `src/screens/school/*`: `SchoolDashboardScreen.js`, `SchoolValidationScreen.js`, `SchoolProfileScreen.js`.
  - `src/screens/industry/*`: `IndustryDashboardScreen.js`, `IndustryVacancyScreen.js`, `IndustryApplicantsScreen.js`, `IndustryProfileScreen.js`.
- **Komponen & State:**
  - Komponen umum di `src/components/common/` (`PrimaryButton.js`, `CustomInput.js`, `RoleBadge.js`, `ScreenHeader.js`).
  - State store di `src/store/useAuthStore.js` (dengan fitur *Simulator Uji Role* instan di menu profil).
  - Uji Bundling: Berhasil di-bundle untuk Android Expo SDK 57 (866 modul, Hermes bytecode 2.0 MB, 0 error).

---

## 4. Kredensial Akun Pengujian (Hasil Seeder)

Semua akun dummy menggunakan kata sandi standar: **`password123`** (hash bcrypt: `$2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW`).

1. **Siswa SMK 1:** `siswa1@finetern.id` (Ahmad Pratama - SMKN 1 Bandung, RPL)
2. **Siswa SMK 2:** `siswa2@finetern.id` (Siti Aisyah - SMKN 1 Bandung, RPL)
3. **Siswa SMK 3:** `siswa3@finetern.id` (Rian Hidayat - SMKN 1 Bandung, TKJ)
4. **Guru / Sekolah:** `guru@smkn1bandung.sch.id` (Drs. H. Mulyana - Hubin PKL)
5. **Mitra Industri 1:** `hrd@digitalkreatif.com` (PT Digital Kreatif Nusantara - Bandung)
6. **Mitra Industri 2:** `recruitment@studionusantara.id` (Studio Solusi Nusantara - Jakarta)

---

## 5. Cara Menjalankan Proyek Secara Lokal

### Terminal 1: Backend Express.js
```powershell
cd "d:\Kuliah\Semester 5\Mobile Programming\Finetern\backend"
npm run dev
# Server berjalan di: http://localhost:5000
# Cek kesehatan API: http://localhost:5000/api/health
```

### Terminal 2: Mobile React Native Expo
```powershell
cd "d:\Kuliah\Semester 5\Mobile Programming\Finetern\mobile"
npx expo start -c
# Scan QR code via aplikasi Expo Go (SDK 57) di Android HP fisik
```

---

## 6. Roadmap Lengkap Proyek (Total 6 Tahap)

- [x] **Tahap 1: Fondasi, Skema Data & Kerangka Navigasi** *(SELESAI)*
- [ ] **Tahap 2: Sprint 1 - Autentikasi Multi-Peran & Profil Dasar** *(BERIKUTNYA)*
  - Buat controller & route: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/profile/me`.
  - Validasi input, JWT token signing, bcrypt compare.
  - Sambungkan `mobile/src/screens/auth/LoginScreen.js` ke backend via `axiosClient.js`.
  - Simpan token JWT dan user object di `AsyncStorage` + `useAuthStore`.
- [ ] **Tahap 3: Sprint 2 - Portofolio Berbasis Bukti & Validasi Guru**
  - Endpoint upload karya siswa `POST /api/portfolios` (foto proyek via Multer + skill claim).
  - Endpoint antrean sekolah `GET /api/school/validation-queue`.
  - Guru validasi `PATCH /api/school/validate/:id` (`approved` -> `is_validated = true`).
  - Slicing foto picker di mobile (`expo-image-picker`).
- [ ] **Tahap 4: Sprint 3 - Katalog Lowongan & Mesin Micro-Skills Matching**
  - Industri pasang lowongan `POST /api/vacancies` + syarat skill.
  - Implementasi rumus algoritma:
    $$\text{Match Rate} = \left( \frac{\sum_{i=1}^{n} \min\left(1, \frac{p_i}{m_i}\right) \times w_i}{\sum_{i=1}^{n} w_i} \right) \times 100\%$$
  - Skenario lamaran `POST /api/applications` (hanya aktif jika Match Rate $\ge 80\%$).
- [ ] **Tahap 5: Sprint 4 - AI Adaptive Learning Recommender (Google Gemini)**
  - Endpoint `POST /api/ai/generate-sprint` membaca *skill-gap* siswa dari lowongan target.
  - Gemini AI (`@google/genai`) membuat modul ringkas + 3 soal kuis pilihan ganda terstruktur JSON.
  - Submit kuis `POST /api/assessments/submit` (lulus -> menaikkan level keahlian siswa).
- [ ] **Tahap 6: Finalisasi, Closed-Loop Testing & Build APK**
  - Skenario uji siklus tertutup: Siswa Match Rate 60% -> belajar AI -> kuis lulus -> upload bukti -> guru setujui -> Match Rate naik 90% -> diterima industri.
  - Build file instalasi Android APK via EAS Build (`eas build -p android --profile preview`).

---

## 7. Instruksi Kerja untuk AI Berikutnya

Saat melanjutkan sesi berikutnya:
1. Mulailah dari **Tahap 2 (Sprint 1: Autentikasi Real & Profil Dasar)**.
2. Jangan merusak struktur styling token di `mobile/src/utils/theme.js` dan jangan menginstal library navigasi alternatif.
3. Selalu uji bahwa kode backend mengembalikan standar response `{ success, message, data }` dan kode mobile bebas dari broken imports sebelum membuat commit Git.
4. Setiap fitur baru yang selesai diuji disarankan untuk di-commit dan di-push ke branch `develop`.

---
*Dokumen ini dibuat otomatis pada 2026-11-03 untuk keperluan handover pengembangan Finetern.*
