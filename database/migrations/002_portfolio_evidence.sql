-- Migrasi v2 -> v3. Backup dan pilih database v2 (001 applied) terlebih dahulu.
-- MySQL DDL implicit commit; marker mencegah pengulangan setelah kegagalan.
INSERT INTO schema_migrations (version,status) VALUES ('002_portfolio_evidence','applying');

ALTER TABLE portfolios
    MODIFY status_verifikasi ENUM('pending', 'approved', 'revision', 'rejected') DEFAULT 'pending',
    ADD evidence_path VARCHAR(255) NULL,
    ADD revision_number INT NOT NULL DEFAULT 0,
    ADD assessed_proficiency INT NULL,
    ADD reviewed_by INT NULL,
    ADD reviewed_at TIMESTAMP NULL,
    ADD updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ADD INDEX idx_portfolio_queue (status_verifikasi, created_at, id),
    ADD CONSTRAINT chk_portfolio_score CHECK (assessed_proficiency IS NULL OR assessed_proficiency BETWEEN 1 AND 100),
    ADD CONSTRAINT fk_portfolio_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE RESTRICT;

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

-- Keputusan lama tetap utuh; belum menjadi penilaian terstruktur Tahap 3.
INSERT INTO portfolio_events (portfolio_id,revision_number,actor_user_id,action,note,submission_snapshot)
SELECT p.id,0,s.user_id,'legacy_imported','Data sebelum alur pemeriksaan proyek Tahap 3.',
    JSON_OBJECT('title',p.title,'deskripsi',p.deskripsi,'project_url',p.project_url,
    'skill_id',p.skill_id,'image_path',p.image_path,'status_verifikasi',p.status_verifikasi,'catatan_guru',p.catatan_guru)
FROM portfolios p JOIN students s ON s.id=p.siswa_id;

UPDATE schema_migrations SET status='applied',completed_at=CURRENT_TIMESTAMP WHERE version='002_portfolio_evidence';
