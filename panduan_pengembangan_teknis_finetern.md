# Panduan Pengembangan & Alur Kerja Teknis: FINETERN

**Proyek:** Finetern – Transformasi Digital Perekrutan Magang Vokasi Berbasis *Micro-Skills Matching* & *AI Adaptive Learning*  
**Mata Kuliah:** IK300 Mobile Programming  
**Dosen Pengampu:** Erlangga, S.Kom., M.T.  

---

## 1. Pemetaan Peran & Tanggung Jawab Teknis Tim

| NIM | Nama Anggota | Peran Utama | Fokus Eksekusi Teknis |
| :--- | :--- | :--- | :--- |
| **2405020** | Adi Saputra Koswara | Backend Developer & Infra | Konfigurasi server Express.js, integrasi Google Gemini SDK, *refactoring* *endpoint*, dan pengujian UAT. |
| **2401865** | Muhamad Rizqi Cahyadi Putra | UI/UX Designer & Frontend | Standarisasi *Design System* Figma (konteks SMK), penyediaan aset lokal, dan *slicing* komponen UI React Native. |
| **2408680** | Raihan Wira Saputra | Lead Backend & Database | Perancangan DDL MySQL (12 tabel), pembuatan *endpoint* REST API utama, algoritma *Match Rate*, dan autentikasi JWT. |
| **2403304** | Randi Aditiya Suharisman | Project Manager & QA | Pengelolaan *Task Board*, penyusunan kontrak API (*Request/Response* JSON), serta pengujian *Black-Box*. |
| **2404916** | Tsalis Sholeh Al Akbar | Lead Frontend Developer | Arsitektur React Native (Expo), konfigurasi *React Navigation*, manajemen *state* (`Zustand`), dan integrasi `Axios`. |

---

## 2. Daftar Periksa Cepat (*Quick Win*) untuk Laporan Progress Besok

Sebelum masuk ke pengembangan fitur mendalam, berikut adalah *deliverables* konkret yang harus disiapkan malam ini untuk ditunjukkan pada sesi laporan *progress*:

- [ ] **UI/UX (Rizqi):** Mengubah teks *placeholder* pada *mockup* halaman Login dan Beranda Siswa di Figma dari konteks "Arsitektur ITB" menjadi konteks **Siswa SMK (contoh: SMKN 1 Bandung - Rekayasa Perangkat Lunak)**.
- [ ] **Frontend (Tsalis):** Menjalankan `npx create-expo-app` dan menampilkan struktur folder modular di VS Code beserta navigasi awal dari Layar Login ke 3 Beranda Peran (*dummy screen*).
- [ ] **Backend & DB (Raihan & Adi):** Mengeksekusi *script* SQL 12 tabel di MySQL lokal (Laragon/XAMPP) dan menampilkan tabel yang sudah terbentuk di phpMyAdmin/DBeaver, ditambah 1 *endpoint* tes `GET /api/health` di Postman.
- [ ] **Manajemen Proyek (Randi):** Menyiapkan papan tugas (*Trello / GitHub Projects / Notion*) yang membagi tugas tim ke dalam tahapan *Sprint*.

---

## 3. Inisialisasi Lingkungan & Struktur Direktori

### A. Sisi Klien Seluler (`finetern-mobile` - React Native Expo)

**1. Perintah Inisialisasi Terminal:**
```bash
# Buat project Expo baru
npx create-expo-app finetern-mobile --template blank

cd finetern-mobile

# Install pustaka navigasi
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# Install state management, HTTP client, dan penyimpanan lokal
npm install zustand axios
npx expo install @react-native-async-storage/async-storage

# Install modul akses perangkat keras (galeri & dokumen untuk portofolio)
npx expo install expo-image-picker expo-document-picker
```

**2. Struktur Folder Modular (`src/`):**
```text
finetern-mobile/
├── assets/                  # Ikon, ilustrasi lokal, dan font
├── src/
│   ├── api/
│   │   ├── axiosClient.js   # Konfigurasi baseURL & JWT Interceptor
│   │   ├── authApi.js       # Fungsi pemanggilan endpoint Auth
│   │   ├── vacancyApi.js    # Fungsi pemanggilan lowongan & match rate
│   │   ├── portfolioApi.js  # Fungsi unggah bukti karya & validasi
│   │   └── aiApi.js         # Fungsi pemanggilan modul belajar & kuis AI
│   ├── components/
│   │   ├── common/          # Button, InputField, Badge, Header
│   │   ├── cards/           # VacancyCard, PortfolioCard, ApplicantCard
│   │   └── charts/          # MatchRateGauge (indikator persentase)
│   ├── navigation/
│   │   ├── AppNavigator.js  # Pengecekan token & pengarah peran (Role Switcher)
│   │   ├── StudentTabs.js   # Bottom Tabs khusus Siswa SMK
│   │   ├── SchoolTabs.js    # Bottom Tabs khusus Guru Pembimbing
│   │   └── IndustryTabs.js  # Bottom Tabs khusus Mitra DUDI
│   ├── screens/
│   │   ├── auth/            # LoginScreen.js, RegisterScreen.js
│   │   ├── student/         # HomeScreen, ExploreScreen, PortfolioScreen, AIMentorScreen, LearningScreen, QuizScreen
│   │   ├── school/          # SchoolDashboardScreen, ValidationQueueScreen
│   │   └── industry/        # IndustryDashboardScreen, CreateVacancyScreen, ApplicantReviewScreen
│   ├── store/
│   │   └── useAuthStore.js  # State global Zustand (user, token, role, login, logout)
│   └── utils/
│       └── constants.js     # Warna tema, ukuran teks, daftar konstanta
├── App.js
└── package.json
```

---

### B. Sisi Peladen (`finetern-backend` - Node.js & Express.js)

**1. Perintah Inisialisasi Terminal:**
```bash
mkdir finetern-backend
cd finetern-backend
npm init -y

# Install dependensi utama
npm install express mysql2 cors dotenv bcryptjs jsonwebtoken multer @google/genai

# Install dependensi pengembangan
npm install --save-dev nodemon
```

**2. Struktur Folder Backend (`src/`):**
```text
finetern-backend/
├── uploads/                 # Penyimpanan fisik gambar bukti portofolio siswa
├── src/
│   ├── config/
│   │   ├── db.js            # Koneksi pool mysql2 ke database finetern_db
│   │   └── gemini.js        # Inisialisasi klien @google/genai
│   ├── middlewares/
│   │   ├── authMiddleware.js# Verifikasi Bearer Token JWT & otorisasi role
│   │   └── uploadMiddleware.js # Konfigurasi Multer untuk unggah gambar
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── portfolioController.js
│   │   ├── vacancyController.js
│   │   ├── matchingController.js
│   │   └── aiController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── portfolioRoutes.js
│   │   ├── vacancyRoutes.js
│   │   └── aiRoutes.js
│   └── app.js               # Konfigurasi Express, CORS, dan pendaftaran route
├── .env                     # PORT, DB_HOST, DB_USER, DB_PASS, JWT_SECRET, GEMINI_API_KEY
└── server.js                # Titik masuk aplikasi backend
```

---

## 4. Implementasi Basis Data Awal (SQL DDL - 12 Tabel)

Salin dan jalankan *script* SQL berikut di MySQL (phpMyAdmin / DBeaver / Laragon) untuk membangun ke-12 tabel sesuai rancangan ERD proposal:

```sql
CREATE DATABASE IF NOT EXISTS finetern_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE finetern_db;

-- 1. Tabel Induk Pengguna (Users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('siswa', 'sekolah', 'industri') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Institusi Sekolah (Schools)
CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nama_sekolah VARCHAR(150) NOT NULL,
    akreditasi VARCHAR(10),
    alamat TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Tabel Profil Siswa SMK (Students)
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    sekolah_id INT NOT NULL,
    nisn VARCHAR(25) UNIQUE,
    nama_lengkap VARCHAR(150) NOT NULL,
    jurusan VARCHAR(100) NOT NULL,
    kelas VARCHAR(20) NOT NULL,
    biodata TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sekolah_id) REFERENCES schools(id) ON DELETE RESTRICT
);

-- 4. Tabel Mitra Industri / DUDI (Industries)
CREATE TABLE industries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nama_industri VARCHAR(150) NOT NULL,
    sektor_industri VARCHAR(100) NOT NULL,
    kota_domisili VARCHAR(100) NOT NULL,
    deskripsi_perusahaan TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Tabel Kamus Keterampilan Mikro (Skills)
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_skill VARCHAR(100) NOT NULL UNIQUE,
    kategori VARCHAR(100) NOT NULL
);

-- 6. Tabel Penguasaan Keahlian Siswa (Student Skills)
CREATE TABLE student_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency INT DEFAULT 50 CHECK (proficiency BETWEEN 1 AND 100),
    is_validated BOOLEAN DEFAULT FALSE,
    validated_at TIMESTAMP NULL,
    UNIQUE KEY unique_student_skill (siswa_id, skill_id),
    FOREIGN KEY (siswa_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 7. Tabel Portofolio Bukti Karya (Portfolios)
CREATE TABLE portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    skill_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    deskripsi TEXT,
    project_url VARCHAR(255),
    image_path VARCHAR(255),
    status_verifikasi ENUM('pending', 'approved', 'revision') DEFAULT 'pending',
    catatan_guru TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT
);

-- 8. Tabel Lowongan Magang (Internship Vacancies)
CREATE TABLE internship_vacancies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    industri_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    deskripsi TEXT NOT NULL,
    kuota INT DEFAULT 1,
    status_aktif BOOLEAN DEFAULT TRUE,
    tenggat_waktu DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (industri_id) REFERENCES industries(id) ON DELETE CASCADE
);

-- 9. Tabel Kebutuhan Keahlian Lowongan (Vacancy Skills)
CREATE TABLE vacancy_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lowongan_id INT NOT NULL,
    skill_id INT NOT NULL,
    importance ENUM('wajib', 'nilai_tambah') DEFAULT 'wajib',
    weight INT DEFAULT 10,
    min_proficiency INT DEFAULT 70,
    UNIQUE KEY unique_vacancy_skill (lowongan_id, skill_id),
    FOREIGN KEY (lowongan_id) REFERENCES internship_vacancies(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 10. Tabel Riwayat Lamaran (Applications)
CREATE TABLE applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    lowongan_id INT NOT NULL,
    match_rate DECIMAL(5,2) NOT NULL,
    status_lamaran ENUM('pending', 'reviewed', 'accepted', 'rejected') DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_application (siswa_id, lowongan_id),
    FOREIGN KEY (siswa_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (lowongan_id) REFERENCES internship_vacancies(id) ON DELETE CASCADE
);

-- 11. Tabel Modul Belajar Adaptif (Learning Modules)
CREATE TABLE learning_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    skill_id INT NOT NULL,
    judul_modul VARCHAR(200) NOT NULL,
    konten_materi LONGTEXT NOT NULL,
    quiz_json JSON NOT NULL,
    estimasi_menit INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 12. Tabel Riwayat Asesmen Mandiri (Assessment Records)
CREATE TABLE assessment_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    skill_id INT NOT NULL,
    skor_kuis INT NOT NULL,
    tanggal_evaluasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
```

---

## 5. Tahapan Pengembangan Berbasis *Sprint* (*Vertical Slice Roadmap*)

Pengembangan dilakukan per modul fungsional dari hulu ke hilir (*Database $\rightarrow$ Backend API $\rightarrow$ Mobile UI*) agar setiap minggu menghasilkan fitur yang dapat didemokan.

---

### FASE 1: Fondasi, Skema Data & Kerangka Navigasi (Minggu 1 - 2)
**Tujuan:** Lingkungan pengembangan berjalan lancar di perangkat seluruh anggota tim.

1. **Backend (Raihan & Adi):**
   - Menyiapkan koneksi database di `src/config/db.js`.
   - Membuat *script seeder* (`seed.sql`) yang mengisi data awal: 1 Sekolah (SMKN 1 Bandung), 2 Industri (PT Digital Kreatif & Studio Nusantara), 3 Siswa, dan 10 *Micro-Skills* (React Native, REST API, UI Slicing Figma, MySQL, Git Workflow, dll.).
2. **Frontend (Tsalis & Rizqi):**
   - Menyiapkan `AppNavigator.js` yang memisahkan 4 *Stack/Tab* utama: `AuthStack`, `StudentTabs`, `SchoolTabs`, dan `IndustryTabs`.
   - Menyiapkan komponen dasar (`PrimaryButton`, `CustomInput`, `RoleSelectorBadge`) sesuai palet warna Figma.

---

### FASE 2 (Sprint 1): Autentikasi Multi-Peran & Profil Dasar (Minggu 3)
**Tujuan:** Pengguna dapat melakukan registrasi, *login*, dan diarahkan ke antarmuka sesuai perannya (`siswa`, `sekolah`, atau `industri`).

1. **Backend (Raihan):**
   - `POST /api/auth/register`: Menerima data akun, melakukan *hashing* kata sandi dengan `bcryptjs`, menyimpan ke tabel `users` dan tabel profil turunan (`students`/`schools`/`industries`).
   - `POST /api/auth/login`: Memverifikasi kredensial dan mengembalikan *token* JWT yang memuat `{ userId, role, profileId }`.
   - `GET /api/profile/me`: Mengambil detail profil pengguna beserta daftar keahlian yang dimiliki.
2. **Frontend (Tsalis & Rizqi):**
   - *Slicing* **Layar Autentikasi dan Registrasi** dengan pemilih peran (*Role Switcher*).
   - Mengintegrasikan penyimpanan *token* JWT ke `AsyncStorage` dan `useAuthStore` (`Zustand`).
   - Menampilkan profil dinamis di **Layar Beranda Siswa** (nama siswa, asal SMK, dan persentase kelengkapan portofolio).

---

### FASE 3 (Sprint 2): Portofolio Berbasis Bukti & Validasi Guru (Minggu 4)
**Tujuan:** Siswa dapat mengunggah bukti proyek praktikum dan Guru Pembimbing dapat memvalidasinya.

1. **Backend (Raihan & Adi):**
   - `POST /api/portfolios`: Menerima unggahan gambar (`multipart/form-data` via `multer`), tautan repositori, judul proyek, dan `skill_id` yang diklaim. Otomatis membuat baris di `student_skills` dengan `is_validated = false`.
   - `GET /api/school/validation-queue`: Menampilkan daftar pengajuan portofolio siswa dari sekolah yang bersangkutan yang berstatus `pending`.
   - `PATCH /api/school/validate/:portfolioId`: Guru menyetujui atau meminta revisi karya. Jika disetujui (`approved`), kolom `is_validated` pada tabel `student_skills` berubah menjadi `true`.
2. **Frontend (Tsalis & Rizqi):**
   - *Slicing* **Layar Portofolio Siswa** (dilengkapi fitur pilih foto dari galeri HP menggunakan `expo-image-picker`).
   - *Slicing* **Layar Pemantauan Sekolah** untuk akun Guru yang memuat kartu antrean verifikasi proyek dengan tombol aksi **"Validasi Skill"** dan **"Minta Revisi"**.

---

### FASE 4 (Sprint 3): Katalog Lowongan & Mesin *Micro-Skills Matching* (Minggu 5)
**Tujuan:** Industri dapat menerbitkan lowongan, sistem menghitung *Match Rate* secara otomatis, dan siswa yang memenuhi syarat dapat melamar.

1. **Algoritma Pencocokan (*Match Rate Calculation*):**
   Setiap keterampilan pada lowongan memiliki bobot $w_i$ (`wajib` $= 10$, `nilai_tambah` $= 5$). Bagi siswa yang memiliki keahlian tervalidasi (`is_validated` $= \text{true}$) pada keterampilan tersebut dengan tingkat kemahiran $p_i$ terhadap batas minimum lowongan $m_i$, nilai kontribusi keahlian $s_i$ dihitung sebagai:
   $$s_i = \min\left(1, \frac{p_i}{m_i}\right) \times w_i$$
   Skor persentase kecocokan akhir ($\text{Match Rate}$) dihitung dengan rumus:
   $$\text{Match Rate} = \left( \frac{\sum_{i=1}^{n} s_i}{\sum_{i=1}^{n} w_i} \right) \times 100\%$$

2. **Backend (Raihan & Adi):**
   - `POST /api/vacancies`: Industri membuat lowongan baru beserta syarat `vacancy_skills`.
   - `GET /api/vacancies`: Mengambil daftar lowongan yang telah dihitung skor `match_rate`-nya terhadap profil siswa yang sedang *login*, diurutkan dari persentase tertinggi.
   - `GET /api/vacancies/:id`: Menampilkan detail lowongan, daftar *micro-skills* yang sudah cocok (*matched*), serta daftar *skill-gap* (keahlian yang belum dikuasai/belum tervalidasi).
   - `POST /api/applications`: Siswa mengirim lamaran (sistem mengecek apakah $\text{Match Rate} \ge 80\%$).
   - `PATCH /api/applications/:id/status`: Industri mengubah status pelamar menjadi `accepted` atau `rejected`.

3. **Frontend (Tsalis & Rizqi):**
   - *Slicing* **Layar Eksplorasi & Rincian Lowongan** lengkap dengan komponen **Match Rate Gauge** dan penanda warna hijau/merah pada daftar *micro-skills*.
   - Menambahkan logika percabangan tombol aksi:
     - Jika $\text{Match Rate} \ge 80\%$: Tombol **"Ajukan Lamaran dengan Portofolio"** aktif.
     - Jika $\text{Match Rate} < 80\%$: Muncul tombol **"Tutup Skill-Gap dengan AI Mentor"**.
   - *Slicing* **Layar Peninjauan Pelamar** pada akun Industri.

---

### FASE 5 (Sprint 4): Integrasi Google Gemini AI & Kuis Evaluasi (Minggu 6)
**Tujuan:** Ketika siswa mengalami *skill-gap* atau ditolak industri, AI menghasilkan modul *microlearning* dan kuis pilihan ganda secara dinamis.

1. **Backend (Adi & Raihan):**
   - `POST /api/ai/generate-sprint`:
     - Menerima input `skill_id` yang berstatus *gap* dan konteks posisi lowongan.
     - Memanggil Google Gemini API (`gemini-2.5-flash`) dengan konfigurasi `responseMimeType: "application/json"`.
     - Menyimpan hasil materi ringkas dan 5 butir soal pilihan ganda ke tabel `learning_modules` dan mengirimkannya ke aplikasi seluler.
   - `POST /api/assessments/submit`: Menerima jawaban kuis siswa, menghitung skor ($0 - 100$), dan menyimpan ke tabel `assessment_records`. Jika skor $\ge 80$, siswa diarahkan untuk mengunggah proyek mini baru ke Guru.

2. **Contoh Struktur Prompt Gemini API di Backend:**
   ```javascript
   const prompt = `
   Anda adalah instruktur kejuruan SMK bidang teknologi informasi.
   Siswa membutuhkan penguatan pada keterampilan mikro: "${namaSkill}" untuk melamar posisi magang "${judulLowongan}".
   Buatkan materi microlearning ringkas dan 5 soal evaluasi pilihan ganda dalam format JSON murni dengan struktur:
   {
     "judul_modul": "string",
     "estimasi_menit": 15,
     "ringkasan_materi": "string (format markdown ringkas, praktis, dan contoh kasus)",
     "kuis": [
       {
         "pertanyaan": "string",
         "opsi": ["A. ...", "B. ...", "C. ...", "D. ..."],
         "jawaban_benar": 0,
         "pembahasan": "string"
       }
     ]
   }`;
   ```

3. **Frontend (Tsalis & Rizqi):**
   - *Slicing* **Layar Asisten Rekomendasi AI**, **Layar Dasbor Pembelajaran**, dan **Layar Evaluasi Kompetensi (Kuis Interaktif)**.
   - Menampilkan indikator *loading* saat AI sedang menyusun modul dan menampilkan skor evaluasi di akhir sesi kuis.

---

### FASE 6 (Sprint 5): Pengujian, Optimasi & Build APK (Minggu 7 - 8)
**Tujuan:** Aplikasi bebas dari *crash*, seluruh alur 3 peran terhubung mulus, dan APK siap didemokan saat UAS.

1. **Quality Assurance (Randi & Adi):**
   - Menyusun skenario pengujian *Black-Box* untuk 3 peran pengguna (Siswa, Sekolah, Industri).
   - Menguji skenario siklus tertutup (*Closed-Loop Test*): Siswa *Match Rate* $60\%$ $\rightarrow$ Belajar di Modul AI $\rightarrow$ Kuis Lulus $\rightarrow$ Unggah Bukti Proyek $\rightarrow$ Disetujui Guru $\rightarrow$ *Match Rate* naik menjadi $90\%$ $\rightarrow$ Lamar Lowongan $\rightarrow$ Diterima Industri.
2. **Deployment & Final Build (Tsalis & Raihan):**
   - *Deploy* layanan *backend* Express.js dan database MySQL ke layanan *cloud* (Railway / Render / VPS) agar aplikasi seluler dapat diakses tanpa bergantung pada *localhost* laptop.
   - Menghasilkan berkas instalasi Android (`.apk`) menggunakan **EAS Build** (`eas build -p android --profile preview`).

---

## 6. Ringkasan Kontrak Endpoint REST API

Tabel ini menjadi acuan bersama antara tim *Frontend* dan *Backend*:

| Metode | Endpoint | Peran Akses | Deskripsi Fungsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Publik | Registrasi pengguna baru (Siswa/Sekolah/Industri). |
| `POST` | `/api/auth/login` | Publik | Login pengguna & penerbitan *token* JWT. |
| `GET` | `/api/profile/me` | Semua Peran | Mengambil data profil & keahlian pengguna aktif. |
| `GET` | `/api/skills` | Semua Peran | Mengambil daftar kamus *micro-skills*. |
| `POST` | `/api/portfolios` | Siswa | Mengunggah proyek portofolio baru + gambar bukti. |
| `GET` | `/api/school/submissions` | Sekolah | Daftar antrean portofolio siswa yang menunggu validasi. |
| `PATCH` | `/api/school/submissions/:id` | Sekolah | Guru memvalidasi (`approved`) atau menolak (`revision`) karya. |
| `POST` | `/api/vacancies` | Industri | Industri menerbitkan lowongan magang & syarat *skill*. |
| `GET` | `/api/vacancies` | Siswa | Katalog lowongan beserta kalkulasi *Match Rate* otomatis. |
| `GET` | `/api/vacancies/:id` | Siswa | Detail lowongan, rincian kecocokan *skill*, dan *skill-gap*. |
| `POST` | `/api/applications` | Siswa | Mengirimkan lamaran magang pada lowongan terpilih. |
| `GET` | `/api/industry/applicants/:vacancyId` | Industri | Daftar pelamar magang diurutkan dari *Match Rate* tertinggi. |
| `PATCH` | `/api/applications/:id/status` | Industri | Industri menerima (`accepted`) atau menolak (`rejected`) pelamar. |
| `POST` | `/api/ai/generate-sprint` | Siswa | Meminta Gemini AI membuat modul belajar & kuis sesuai *gap*. |
| `POST` | `/api/assessments/submit` | Siswa | Menyimpan skor hasil pengerjaan kuis diagnostik mandiri. |

---

## 7. Standar Kolaborasi Git & Aturan Tim

1. **Struktur Cabang (*Branching*):**
   - `main`: Hanya berisi kode stabil yang siap didemokan ke dosen. Dilarang melakukan *push* langsung ke `main`.
   - `develop`: Cabang integrasi mingguan tempat seluruh anggota menggabungkan hasil kerjanya.
   - `feat/<nama-fitur>`: Cabang kerja harian masing-masing anggota (contoh: `feat/auth-screen`, `feat/matching-endpoint`, `feat/ai-gemini`).
2. **Format Pesan Commit (*Commit Message*):**
   - `feat: menambahkan layar eksplorasi lowongan siswa`
   - `fix: memperbaiki kalkulasi match rate saat skill belum divalidasi`
   - `chore: inisialisasi struktur folder react native expo`
   - `docs: memperbarui dokumentasi kontrak API`