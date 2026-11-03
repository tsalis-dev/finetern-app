-- ===================================================================
-- FINETERN DATABASE SCHEMA V5
-- Database lama memakai migrations 001–004 berurutan.
-- ===================================================================

CREATE DATABASE IF NOT EXISTS finetern_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE finetern_db;

-- 1. Tabel Induk Pengguna (Users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('siswa', 'sekolah', 'industri', 'admin') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    disabled_at TIMESTAMP NULL,
    disabled_by INT NULL,
    disabled_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_disabled_by FOREIGN KEY (disabled_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 2. Tabel Institusi Sekolah (Schools)
CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submitted_by INT NOT NULL,
    npsn VARCHAR(20) NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    nama_sekolah VARCHAR(150) NOT NULL,
    akreditasi VARCHAR(10),
    alamat TEXT,
    CONSTRAINT fk_schools_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_schools_npsn CHECK (npsn IS NULL OR CHAR_LENGTH(TRIM(npsn)) > 0)
) ENGINE=InnoDB;

-- Akun per guru; nama NULL hanya untuk akun lama yang belum melengkapi profil.
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nama_lengkap VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Satu sekolah per guru untuk MVP. Posisi koordinator belum memberi izin tanpa verifikasi.
CREATE TABLE school_memberships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL UNIQUE,
    sekolah_id INT NOT NULL,
    posisi ENUM('guru', 'koordinator') NOT NULL DEFAULT 'guru',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_memberships_school_active (sekolah_id, is_active),
    CONSTRAINT fk_memberships_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_memberships_school FOREIGN KEY (sekolah_id) REFERENCES schools(id) ON DELETE RESTRICT
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
    nomor_registrasi VARCHAR(64) NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_industries_registration CHECK (nomor_registrasi IS NULL OR CHAR_LENGTH(TRIM(nomor_registrasi)) > 0),
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

-- 7. Tabel Portofolio Bukti Karya (Portfolios)
CREATE TABLE portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    skill_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    deskripsi TEXT,
    project_url VARCHAR(255),
    image_path VARCHAR(255),
    status_verifikasi ENUM('pending', 'approved', 'revision', 'rejected') DEFAULT 'pending',
    catatan_guru TEXT,
    evidence_path VARCHAR(255) NULL,
    revision_number INT NOT NULL DEFAULT 0,
    assessed_proficiency INT NULL,
    reviewed_by INT NULL,
    reviewed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_portfolio_queue (status_verifikasi, created_at, id),
    CONSTRAINT chk_portfolio_score CHECK (assessed_proficiency IS NULL OR assessed_proficiency BETWEEN 1 AND 100),
    CONSTRAINT fk_portfolio_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT,
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
    lokasi VARCHAR(150) NULL,
    tipe_kerja ENUM('onsite', 'hybrid', 'remote') NULL,
    uang_saku INT NULL,
    revision_number INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vacancy_catalog (status_aktif,tenggat_waktu,created_at,id),
    INDEX idx_vacancy_owner (industri_id,created_at,id),
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
    status_lamaran ENUM('pending', 'reviewed', 'accepted', 'rejected', 'withdrawn') DEFAULT 'pending',
    revision_number INT NOT NULL DEFAULT 0,
    submission_snapshot JSON NULL,
    consented_at TIMESTAMP NULL,
    consent_revoked_at TIMESTAMP NULL,
    selection_note TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_application (siswa_id, lowongan_id),
    INDEX idx_application_queue (lowongan_id,status_lamaran,id),
    INDEX idx_student_applications (siswa_id,applied_at,id),
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
    lowongan_id INT NULL,
    source_key CHAR(64) NULL,
    source_context JSON NULL,
    provider_model VARCHAR(100) NULL,
    prompt_version VARCHAR(40) NULL,
    generation_status ENUM('legacy','generating','ready','failed') NOT NULL DEFAULT 'legacy',
    last_error_code VARCHAR(40) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_learning_source(source_key),
    INDEX idx_learning_owner(siswa_id,created_at,id),
    INDEX idx_learning_generation(siswa_id,generation_status,created_at),
    CONSTRAINT fk_learning_vacancy FOREIGN KEY(lowongan_id) REFERENCES internship_vacancies(id) ON DELETE SET NULL,
    FOREIGN KEY (siswa_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Tabel Riwayat Asesmen Mandiri (Assessment Records)
CREATE TABLE assessment_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siswa_id INT NOT NULL,
    skill_id INT NOT NULL,
    skor_kuis INT NOT NULL,
    module_id INT NULL,
    answers_json JSON NULL,
    correct_count INT NULL,
    attempt_key VARCHAR(64) NULL,
    tanggal_evaluasi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_quiz_attempt(module_id,attempt_key),
    INDEX idx_assessment_module(module_id,id),
    CONSTRAINT chk_assessment_count CHECK(correct_count IS NULL OR correct_count BETWEEN 0 AND 3),
    CONSTRAINT fk_assessment_module FOREIGN KEY(module_id) REFERENCES learning_modules(id) ON DELETE RESTRICT,
    FOREIGN KEY (siswa_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Satu pengajuan per subjek; revisi mengubah status dan menambah event, bukan menghapus riwayat.
CREATE TABLE verification_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_user_id INT NOT NULL,
    sekolah_id INT NULL UNIQUE,
    industri_id INT NULL UNIQUE,
    membership_id INT NULL UNIQUE,
    siswa_id INT NULL UNIQUE,
    status ENUM('pending', 'approved', 'needs_revision', 'rejected') NOT NULL DEFAULT 'pending',
    evidence_path VARCHAR(255) NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_verification_queue (status, submitted_at),
    CONSTRAINT chk_verification_subject CHECK (
        (sekolah_id IS NOT NULL) + (industri_id IS NOT NULL) +
        (membership_id IS NOT NULL) + (siswa_id IS NOT NULL) = 1
    ),
    CONSTRAINT fk_verification_applicant FOREIGN KEY (applicant_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_verification_school FOREIGN KEY (sekolah_id) REFERENCES schools(id) ON DELETE RESTRICT,
    CONSTRAINT fk_verification_industry FOREIGN KEY (industri_id) REFERENCES industries(id) ON DELETE RESTRICT,
    CONSTRAINT fk_verification_membership FOREIGN KEY (membership_id) REFERENCES school_memberships(id) ON DELETE RESTRICT,
    CONSTRAINT fk_verification_student FOREIGN KEY (siswa_id) REFERENCES students(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE verification_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    actor_user_id INT NOT NULL,
    action ENUM('submitted', 'approved', 'needs_revision', 'rejected', 'resubmitted', 'suspended', 'reactivated') NOT NULL,
    note TEXT,
    submission_snapshot JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_verification_history (request_id, created_at, id),
    CONSTRAINT fk_events_request FOREIGN KEY (request_id) REFERENCES verification_requests(id) ON DELETE RESTRICT,
    CONSTRAINT fk_events_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE portfolio_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolio_id INT NOT NULL,
    revision_number INT NOT NULL,
    actor_user_id INT NOT NULL,
    action ENUM('legacy_imported', 'submitted', 'resubmitted', 'approved', 'revision', 'rejected') NOT NULL,
    note TEXT,
    submission_snapshot JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_portfolio_history (portfolio_id, id),
    CONSTRAINT fk_portfolio_events_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE RESTRICT,
    CONSTRAINT fk_portfolio_events_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE application_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    actor_user_id INT NOT NULL,
    action ENUM('legacy_imported', 'submitted', 'reviewed', 'accepted', 'rejected', 'withdrawn') NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_application_history (application_id, id),
    CONSTRAINT fk_application_events_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE RESTRICT,
    CONSTRAINT fk_application_events_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE application_portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    portfolio_id INT NOT NULL,
    revision_number INT NOT NULL,
    portfolio_snapshot JSON NOT NULL,
    UNIQUE KEY unique_application_portfolio (application_id, portfolio_id),
    CONSTRAINT fk_shared_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE RESTRICT,
    CONSTRAINT fk_shared_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    status ENUM('applying', 'applied') NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
) ENGINE=InnoDB;

INSERT INTO schema_migrations (version, status, completed_at)
VALUES ('001_identity_verification', 'applied', CURRENT_TIMESTAMP),
       ('002_portfolio_evidence', 'applied', CURRENT_TIMESTAMP),
       ('003_recruitment_matching', 'applied', CURRENT_TIMESTAMP),
       ('004_adaptive_learning', 'applied', CURRENT_TIMESTAMP);
