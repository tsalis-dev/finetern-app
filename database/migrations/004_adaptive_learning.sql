-- Migrasi v4 -> v5; pilih sumber dengan 001–003 applied, backup dahulu.
INSERT INTO schema_migrations(version,status) VALUES('004_adaptive_learning','applying');
ALTER TABLE learning_modules
    ADD lowongan_id INT NULL,
    ADD source_key CHAR(64) NULL,
    ADD source_context JSON NULL,
    ADD provider_model VARCHAR(100) NULL,
    ADD prompt_version VARCHAR(40) NULL,
    ADD generation_status ENUM('legacy','generating','ready','failed') NOT NULL DEFAULT 'legacy',
    ADD last_error_code VARCHAR(40) NULL,
    ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD UNIQUE KEY unique_learning_source(source_key),
    ADD INDEX idx_learning_owner(siswa_id,created_at,id),
    ADD INDEX idx_learning_generation(siswa_id,generation_status,created_at),
    ADD CONSTRAINT fk_learning_vacancy FOREIGN KEY(lowongan_id) REFERENCES internship_vacancies(id) ON DELETE SET NULL;
ALTER TABLE assessment_records
    ADD module_id INT NULL,
    ADD answers_json JSON NULL,
    ADD correct_count INT NULL,
    ADD attempt_key VARCHAR(64) NULL,
    ADD UNIQUE KEY unique_quiz_attempt(module_id,attempt_key),
    ADD INDEX idx_assessment_module(module_id,id),
    ADD CONSTRAINT chk_assessment_count CHECK(correct_count IS NULL OR correct_count BETWEEN 0 AND 3),
    ADD CONSTRAINT fk_assessment_module FOREIGN KEY(module_id) REFERENCES learning_modules(id) ON DELETE RESTRICT;
UPDATE schema_migrations SET status='applied',completed_at=CURRENT_TIMESTAMP WHERE version='004_adaptive_learning';
