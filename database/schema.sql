-- ===================================================================
-- FINETERN DATABASE SCHEMA (12 TABEL RELASIONAL)
-- Sesuai Rancangan ERD Proposal Tugas Besar & Panduan Teknis
-- ===================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS finetern_db;
CREATE DATABASE finetern_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE finetern_db;

-- Hapus tabel lama secara berurutan untuk menjamin integritas Foreign Key
DROP TABLE IF EXISTS assessment_records;
DROP TABLE IF EXISTS learning_modules;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS vacancy_skills;
DROP TABLE IF EXISTS internship_vacancies;
DROP TABLE IF EXISTS portfolios;
DROP TABLE IF EXISTS student_skills;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS users;

-- 1. Tabel Induk Pengguna (Users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('siswa', 'sekolah', 'industri') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabel Institusi Sekolah (Schools)
CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nama_sekolah VARCHAR(150) NOT NULL,
    akreditasi VARCHAR(10),
    alamat TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

-- 4. Tabel Mitra Industri / DUDI (Industries)
CREATE TABLE industries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nama_industri VARCHAR(150) NOT NULL,
    sektor_industri VARCHAR(100) NOT NULL,
    kota_domisili VARCHAR(100) NOT NULL,
    deskripsi_perusahaan TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Tabel Kamus Keterampilan Mikro (Skills)
CREATE TABLE skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_skill VARCHAR(100) NOT NULL UNIQUE,
    kategori VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

-- 12. Tabel Riwayat Asesmen Mandiri (Assessment Records)
CREATE TABLE assessment_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    skill_id INT NOT NULL,
    skor_kuis INT NOT NULL,
    tanggal_evaluasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (siswa_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
