-- Migrasi v3 -> v4. Backup dahulu; sumber harus memiliki marker 001 dan 002 applied.
INSERT INTO schema_migrations (version,status) VALUES ('003_recruitment_matching','applying');

ALTER TABLE internship_vacancies
    ADD lokasi VARCHAR(150) NULL,
    ADD tipe_kerja ENUM('onsite', 'hybrid', 'remote') NULL,
    ADD uang_saku INT NULL,
    ADD revision_number INT NOT NULL DEFAULT 0,
    ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD INDEX idx_vacancy_catalog (status_aktif,tenggat_waktu,created_at,id),
    ADD INDEX idx_vacancy_owner (industri_id,created_at,id);

ALTER TABLE applications
    MODIFY status_lamaran ENUM('pending', 'reviewed', 'accepted', 'rejected', 'withdrawn') DEFAULT 'pending',
    ADD revision_number INT NOT NULL DEFAULT 0,
    ADD submission_snapshot JSON NULL,
    ADD consented_at TIMESTAMP NULL,
    ADD consent_revoked_at TIMESTAMP NULL,
    ADD selection_note TEXT NULL,
    ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD INDEX idx_application_queue (lowongan_id,status_lamaran,id),
    ADD INDEX idx_student_applications (siswa_id,applied_at,id);

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

-- Lamaran lama tidak memperoleh persetujuan berbagi bukti secara otomatis.
INSERT INTO application_events (application_id,actor_user_id,action,note)
SELECT a.id,s.user_id,'legacy_imported','Lamaran sebelum persetujuan berbagi profil/bukti Tahap 4.'
FROM applications a JOIN students s ON s.id=a.siswa_id;

UPDATE schema_migrations SET status='applied',completed_at=CURRENT_TIMESTAMP WHERE version='003_recruitment_matching';
