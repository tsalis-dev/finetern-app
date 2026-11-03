-- ===================================================================
-- FINETERN SEED DATA
-- DATA DEMO LOKAL, bukan data produksi. Password semua akun: password123.
-- Semua pengajuan dimulai pending; seed tidak memberikan persetujuan admin palsu.
-- 10 Kamus Micro-Skills, Student Skills, Portofolio, dan Lowongan
-- ===================================================================

USE finetern_db;

-- 1. Insert Data Users
-- Bcrypt Hash untuk 'password123': $2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW
INSERT INTO users (id, email, password, role) VALUES
(1, 'guru@smkn1bandung.sch.id', '$2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW', 'sekolah'),
(2, 'hrd@digitalkreatif.com', '$2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW', 'industri'),
(3, 'talent@studionusantara.id', '$2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW', 'industri'),
(4, 'siswa1@finetern.id', '$2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW', 'siswa'),
(5, 'siswa2@finetern.id', '$2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW', 'siswa'),
(6, 'siswa3@finetern.id', '$2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW', 'siswa'),
(7, 'guru2@smkn1bandung.sch.id', '$2b$10$3JtrpvLRzAi2F7AhhQ/O3.LwfwAEpIpn8JWLGY5LlM45iPLg7yqAW', 'sekolah')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- 2. Insert Profil Sekolah
INSERT INTO schools (id, submitted_by, nama_sekolah, akreditasi, alamat) VALUES
(1, 1, 'SMKN 1 Bandung', 'A', 'Jl. Wastukancana No.3, Babakan Ciamis, Kec. Sumur Bandung, Kota Bandung, Jawa Barat')
ON DUPLICATE KEY UPDATE nama_sekolah=VALUES(nama_sekolah);

INSERT INTO teachers (id, user_id, nama_lengkap) VALUES
(1, 1, 'H. Mulyana'),
(2, 7, 'Budi Setiawan')
ON DUPLICATE KEY UPDATE nama_lengkap=VALUES(nama_lengkap);

INSERT INTO school_memberships (id, teacher_id, sekolah_id) VALUES
(1, 1, 1),
(2, 2, 1)
ON DUPLICATE KEY UPDATE id=id;

-- 3. Insert Profil Siswa SMK
INSERT INTO students (id, user_id, sekolah_id, nisn, nama_lengkap, jurusan, kelas, biodata) VALUES
(1, 4, 1, '0061234561', 'Ahmad Pratama', 'Rekayasa Perangkat Lunak', 'XII RPL 1', 'Siswa SMK antusias yang berfokus pada pengembangan aplikasi seluler React Native dan slicing antarmuka pengguna.'),
(2, 5, 1, '0061234562', 'Siti Rahmawati', 'Rekayasa Perangkat Lunak', 'XII RPL 2', 'Tertarik pada desain antarmuka UI/UX, interaksi sistem, dan integrasi API RESTful.'),
(3, 6, 1, '0061234563', 'Budi Santoso', 'Teknik Komputer dan Jaringan', 'XII TKJ 1', 'Memiliki pemahaman dasar tentang arsitektur server, manajemen database MySQL, dan alur kolaborasi Git.')
ON DUPLICATE KEY UPDATE nama_lengkap=VALUES(nama_lengkap);

-- 4. Insert Mitra Industri / DUDI
INSERT INTO industries (id, user_id, nama_industri, sektor_industri, kota_domisili, deskripsi_perusahaan) VALUES
(1, 2, 'PT Digital Kreatif Nusantara', 'Teknologi Informasi & Software', 'Bandung', 'Software agency yang fokus pada pengembangan aplikasi mobile, web modern, dan transformasi digital institusi.'),
(2, 3, 'Studio Nusantara Interaktif', 'Desain Digital & Media Kreatif', 'Jakarta Selatan', 'Studio kreatif multinasional yang berdedikasi membangun pengalaman visual, prototipe produk, dan creative tech.')
ON DUPLICATE KEY UPDATE nama_industri=VALUES(nama_industri);

-- 5. Insert Kamus Micro-Skills (10 Skills)
INSERT INTO skills (id, nama_skill, kategori) VALUES
(1, 'React Native UI Slicing', 'Frontend Mobile'),
(2, 'State Management Zustand', 'Frontend Mobile'),
(3, 'RESTful API Integration', 'Frontend Mobile'),
(4, 'UI/UX Slicing Figma', 'Design System'),
(5, 'Express.js Architecture', 'Backend Development'),
(6, 'MySQL Database Design', 'Database'),
(7, 'JWT Authentication', 'Backend Security'),
(8, 'Git Workflow & Collaboration', 'Developer Tools'),
(9, 'Mobile Animation Reanimated', 'Frontend Mobile'),
(10, 'Google Gemini AI Prompting', 'AI Engineering')
ON DUPLICATE KEY UPDATE nama_skill=VALUES(nama_skill);

-- 6. Insert Penguasaan Keahlian Siswa (Student Skills)
INSERT INTO student_skills (siswa_id, skill_id, proficiency, is_validated, validated_at) VALUES
(1, 1, 85, TRUE, NOW()),
(1, 3, 80, TRUE, NOW()),
(1, 8, 75, TRUE, NOW()),
(1, 2, 60, FALSE, NULL),
(1, 4, 50, FALSE, NULL),
(2, 4, 90, TRUE, NOW()),
(2, 1, 70, TRUE, NOW()),
(3, 6, 80, TRUE, NOW()),
(3, 5, 65, FALSE, NULL)
ON DUPLICATE KEY UPDATE id=student_skills.id;

-- 7. Insert Portofolio Siswa
INSERT INTO portfolios (id, siswa_id, skill_id, title, deskripsi, project_url, status_verifikasi, catatan_guru) VALUES
(1, 1, 1, 'Aplikasi Katalog Produk SMKN 1', 'Membangun aplikasi mobile katalog produk praktikum siswa berbasis React Native dengan navigasi bersih dan komponen kartu reusable.', 'https://github.com/siswa-smk/katalog-produk', 'approved', 'Hasil karya sangat rapi, struktur kode memenuhi standar praktikum semester ganjil.'),
(2, 1, 3, 'Integrasi REST API Presensi Siswa', 'Menghubungkan klien seluler ke endpoint backend Express.js menggunakan Axios dan Bearer Token JWT.', 'https://github.com/siswa-smk/presensi-mobile', 'approved', 'Validasi token dan penanganan status error HTTP sudah tepat.')
ON DUPLICATE KEY UPDATE id=portfolios.id;

-- Contoh lama tidak dianggap penilaian keterampilan Tahap 3; harus diajukan ulang.
INSERT INTO portfolio_events (portfolio_id,revision_number,actor_user_id,action,note,submission_snapshot)
SELECT p.id,0,s.user_id,'legacy_imported','Portofolio contoh sebelum penilaian terstruktur.',
    JSON_OBJECT('title',p.title,'deskripsi',p.deskripsi,'project_url',p.project_url,
    'skill_id',p.skill_id,'image_path',p.image_path,'status_verifikasi',p.status_verifikasi,'catatan_guru',p.catatan_guru)
FROM portfolios p JOIN students s ON s.id=p.siswa_id
WHERE p.revision_number=0 AND NOT EXISTS (SELECT 1 FROM portfolio_events e WHERE e.portfolio_id=p.id);

-- 8. Insert Lowongan Magang
INSERT INTO internship_vacancies (id, industri_id, title, deskripsi, kuota, status_aktif, tenggat_waktu) VALUES
(1, 1, 'Junior Mobile React Native Intern', 'Kesempatan magang bagi siswa SMK jurusan RPL untuk berkontribusi langsung pada proyek aplikasi mobile klien. Tanggung jawab meliputi slicing layout Figma ke React Native dan mengintegrasikan REST API backend.', 2, TRUE, '2026-12-31'),
(2, 2, 'UI/UX Design & Prototyping Apprentice', 'Program magang desain interaktif untuk merancang alur pengguna, membuat komponen design tokens di Figma, dan menyiapkan panduan desain mobile.', 1, TRUE, '2026-12-15')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 9. Insert Kebutuhan Keahlian Lowongan (Vacancy Skills)
INSERT INTO vacancy_skills (lowongan_id, skill_id, importance, weight, min_proficiency) VALUES
-- Lowongan 1 (Mobile RN Intern):
(1, 1, 'wajib', 10, 70),       -- React Native UI Slicing
(1, 3, 'wajib', 10, 70),       -- RESTful API Integration
(1, 2, 'nilai_tambah', 5, 60), -- State Management Zustand
-- Lowongan 2 (UI/UX Apprentice):
(2, 4, 'wajib', 10, 75),       -- UI/UX Slicing Figma
(2, 1, 'nilai_tambah', 5, 60)  -- React Native UI Slicing
ON DUPLICATE KEY UPDATE min_proficiency=VALUES(min_proficiency);

-- Pengajuan demo tidak mereset status jika seed dijalankan ulang.
INSERT INTO verification_requests (applicant_user_id, sekolah_id)
SELECT submitted_by, id FROM schools
ON DUPLICATE KEY UPDATE id=verification_requests.id;
INSERT INTO verification_requests (applicant_user_id, industri_id)
SELECT user_id, id FROM industries
ON DUPLICATE KEY UPDATE id=verification_requests.id;
INSERT INTO verification_requests (applicant_user_id, membership_id)
SELECT t.user_id, m.id FROM school_memberships m JOIN teachers t ON t.id=m.teacher_id
ON DUPLICATE KEY UPDATE id=verification_requests.id;
INSERT INTO verification_requests (applicant_user_id, siswa_id)
SELECT user_id, id FROM students
ON DUPLICATE KEY UPDATE id=verification_requests.id;

INSERT INTO verification_events (request_id, actor_user_id, action, note)
SELECT r.id, r.applicant_user_id, 'submitted', 'Pengajuan contoh untuk pengembangan lokal.'
FROM verification_requests r
WHERE NOT EXISTS (
    SELECT 1 FROM verification_events e WHERE e.request_id=r.id AND e.action='submitted'
);
