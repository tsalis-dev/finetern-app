-- Migrasi v1 -> v2. Pilih database target sebelum menjalankan file ini.
-- Backup dahulu. MySQL DDL melakukan implicit commit; jangan pakai mysql --force.
-- Marker applying mencegah pengulangan buta bila terjadi kegagalan di tengah migrasi.
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    status ENUM('applying', 'applied') NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
) ENGINE=InnoDB;

INSERT INTO schema_migrations (version, status)
VALUES ('001_identity_verification', 'applying');

ALTER TABLE users
    MODIFY role ENUM('siswa', 'sekolah', 'industri', 'admin') NOT NULL,
    ADD is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD disabled_at TIMESTAMP NULL,
    ADD disabled_by INT NULL,
    ADD disabled_reason TEXT,
    ADD CONSTRAINT fk_users_disabled_by FOREIGN KEY (disabled_by) REFERENCES users(id) ON DELETE RESTRICT;

-- Nama FK/index ini berasal dari schema v1 repository, bukan database yang sudah dimodifikasi.
ALTER TABLE schools
    DROP FOREIGN KEY schools_ibfk_1,
    DROP INDEX user_id,
    CHANGE COLUMN user_id submitted_by INT NOT NULL,
    ADD npsn VARCHAR(20) NULL UNIQUE,
    ADD is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD CONSTRAINT fk_schools_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE RESTRICT,
    ADD CONSTRAINT chk_schools_npsn CHECK (npsn IS NULL OR CHAR_LENGTH(TRIM(npsn)) > 0);

ALTER TABLE industries
    ADD nomor_registrasi VARCHAR(64) NULL UNIQUE,
    ADD is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD CONSTRAINT chk_industries_registration CHECK (nomor_registrasi IS NULL OR CHAR_LENGTH(TRIM(nomor_registrasi)) > 0);

CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nama_lengkap VARCHAR(150) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_teachers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

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

-- Nama guru lama tidak tersedia di v1; tidak mengarang identitas pribadi.
INSERT INTO teachers (user_id)
SELECT id FROM users WHERE role = 'sekolah';

-- Semua keanggotaan lama tetap menunggu pemeriksaan; bukan otomatis koordinator.
INSERT INTO school_memberships (teacher_id, sekolah_id)
SELECT t.id, s.id FROM schools s JOIN teachers t ON t.user_id = s.submitted_by;

INSERT INTO verification_requests (applicant_user_id, sekolah_id)
SELECT submitted_by, id FROM schools;
INSERT INTO verification_requests (applicant_user_id, industri_id)
SELECT user_id, id FROM industries;
INSERT INTO verification_requests (applicant_user_id, membership_id)
SELECT t.user_id, m.id FROM school_memberships m JOIN teachers t ON t.id = m.teacher_id;
INSERT INTO verification_requests (applicant_user_id, siswa_id)
SELECT user_id, id FROM students;

INSERT INTO verification_events (request_id, actor_user_id, action, note)
SELECT id, applicant_user_id, 'submitted', 'Migrasi schema v1; menunggu verifikasi.'
FROM verification_requests;

UPDATE schema_migrations
SET status = 'applied', completed_at = CURRENT_TIMESTAMP
WHERE version = '001_identity_verification';
