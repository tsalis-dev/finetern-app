# Database Finetern v5

Schema v5 menambah konteks/status/cache modul Gemini dan percobaan kuis formatif pada fondasi portofolio/rekrutmen. Materi lama tetap berstatus legacy; asesmen lama tidak otomatis dihubungkan ke modul baru. Kuis tidak mengubah nilai keterampilan guru. Migrasi 001–004 sudah diterapkan pada database lokal, terakhir 4 November 2026. Backup dipulihkan dan migrasi diuji pada salinan sebelum diterapkan; data lama tetap utuh. Migrasi tidak otomatis dijalankan saat backend menyala.

## Model identitas

| Tabel | Tujuan |
| --- | --- |
| `users` | Email, hash password, role, status aktif dan informasi penonaktifan akun |
| `schools` | Institusi sekolah, pengaju awal (`submitted_by`), NPSN bila tersedia, status aktif |
| `teachers` | Profil pribadi guru, satu profil per akun `sekolah` |
| `school_memberships` | Hubungan guru dengan sekolah, posisi `guru`/`koordinator`, status aktif |
| `students` | Profil siswa dan sekolah asal; hubungan yang sudah ada dipertahankan |
| `industries` | Institusi industri dan akun perwakilannya, nomor registrasi bila tersedia, status aktif |
| `verification_requests` | Status pengajuan untuk satu sekolah, industri, keanggotaan guru, atau siswa |
| `verification_events` | Riwayat pengajuan, keputusan, revisi dan penghentian/pemulihan akses |
| `portfolio_events` | Riwayat versi karya, catatan/penilai, dan snapshot bukti proyek |
| `application_events` | Riwayat pengajuan, keputusan seleksi, dan penarikan lamaran |
| `application_portfolios` | Karya relevan yang secara khusus dibagikan melalui satu lamaran |
| `schema_migrations` | Penanda migrasi `applying`/`applied` untuk mendeteksi kegagalan dan migrasi berulang |

Tabel keterampilan, karya, lowongan, lamaran, modul, dan asesmen tetap tersedia. Total 19 tabel aplikasi dan satu tabel metadata migrasi.

Lowongan dan lamaran sekarang memakai `revision_number`. Versi 0 adalah data sebelum alur rekrutmen baru; tidak diberi persetujuan berbagi otomatis. Lamaran baru menyimpan `submission_snapshot`, `consented_at`, `consent_revoked_at`, catatan seleksi dan bukti terkait. Kuota dijaga saat accepted dengan kunci per lowongan; penarikan accepted melepaskan kuota. [Rincian kontrak dan akses Tahap 4](../docs/TAHAP_4_LOWONGAN_MATCHING_DAN_LAMARAN.md).

`portfolios` kini memuat `revision_number`, `evidence_path`, `assessed_proficiency`, `reviewed_by`, `reviewed_at`, dan `updated_at`; status menambahkan rejected. Versi 0 adalah data legacy: keputusan lama dipertahankan tetapi belum dihitung sebagai penilaian terstruktur. Nilai terbaik dihitung dari karya approved yang memiliki penilai; `student_skills` diperbarui sebagai cache. Matching berikutnya harus memakai sumber bukti terstruktur, bukan flag cache/seed sendirian. [Rincian Tahap 3](../docs/TAHAP_3_PORTOFOLIO_DAN_VALIDASI.md).

Untuk menjaga kompatibilitas, `users.role='sekolah'` berarti akun pribadi guru/perwakilan sekolah; `schools` sendiri bukan akun login. Role `admin` disiapkan untuk pengelola platform dan tidak boleh diterima dari formulir pendaftaran publik. Koordinator adalah posisi pada keanggotaan sekolah, bukan role global.

Untuk MVP, satu guru memiliki satu baris keanggotaan sekolah. Perpindahan sekolah dan keanggotaan di beberapa sekolah belum ditangani; jangan mengganti `sekolah_id` pada keanggotaan yang telah disetujui tanpa rancangan transfer dan verifikasi ulang.

## Verifikasi dan audit

Setiap subjek memiliki satu `verification_requests`, dengan tepat satu kolom tujuan yang terisi: `sekolah_id`, `industri_id`, `membership_id`, atau `siswa_id`. Constraint database menolak subjek kosong/ganda dan pengajuan duplikat untuk subjek yang sama.

Status dimulai dari `pending`; alternatifnya `approved`, `needs_revision`, dan `rejected`. `is_active` terpisah dari persetujuan: status approved tidak cukup jika akun, institusi, atau keanggotaannya dinonaktifkan.

API mengubah status dan menambah `verification_events` dalam satu transaksi. Perbaikan pengajuan memperbarui status request dan menambah event `resubmitted` dengan snapshot data pengajuan yang relevan; event lama dipertahankan tanpa hash/password. Dokumen bukti direferensikan oleh `evidence_path` ke penyimpanan privat, bukan URL publik `/uploads` portofolio.

Event `suspended`/`reactivated` mencatat penonaktifan/pemulihan institusi dan alasan pada `note`; field `is_active` subjek diubah dalam transaksi yang sama. Penonaktifan akun tersimpan pada `users.disabled_by`, `disabled_at`, dan `disabled_reason`. Penghentian guru/siswa pada UI MVP dilakukan pada akunnya; status aktif keanggotaan juga diperiksa backend, tetapi belum memiliki endpoint pengelolaan tersendiri.

**Batas jaminan schema:** database menjaga relasi, keunikan, dan bentuk pengajuan. Role pemeriksa, larangan menyetujui diri sendiri, kecocokan sekolah, dan urutan status dijaga service backend serta diuji lewat HTTP. API membuat subjek/pengajuan bersama pemiliknya dalam transaksi dan tidak menyediakan perubahan/hapus riwayat. Perubahan SQL manual dapat melewati aturan aplikasi.

Untuk akses guru: akun aktif, role `sekolah`, keanggotaan aktif dan approved, serta sekolah aktif dan approved. Untuk menyetujui guru lain diperlukan posisi koordinator. Untuk siswa diperlukan akun aktif, pengajuan keanggotaan siswa approved, serta sekolah aktif dan approved. Untuk industri diperlukan akun dan institusi aktif serta pengajuan institusi approved. Token yang masih valid tidak menggantikan pemeriksaan tersebut.

NPSN dan nomor registrasi bersifat nullable agar migrasi tidak mengarang identitas resmi. Nilai non-null harus unik dan tidak boleh kosong. API pendaftaran baru mewajibkan NPSN 8 angka atau nomor registrasi industri yang dinormalisasi huruf besar. Nomor unik sendiri bukan bukti institusi sah; admin tetap memeriksa identitas dan kewenangan perwakilan.

## Instalasi baru

`schema.sql` hanya untuk database kosong: ia tidak lagi menghapus database/tabel. Jika tabel sudah ada, eksekusi harus berhenti saat error. Jangan memakai opsi `--force`.

Di terminal yang memiliki MySQL client (misalnya terminal Laragon), dari root repository:

```powershell
Get-Content -Raw database/schema.sql | mysql --host=127.0.0.1 --port=3306 --user=root --password
```

Data demo hanya untuk lingkungan pengembangan:

```powershell
Get-Content -Raw database/seed.sql | mysql --host=127.0.0.1 --port=3306 --user=root --password
```

Seed membuat tujuh akun: dua guru pribadi, tiga siswa, dua industri. Password contoh tetap `password123`; semua pengajuan institusi/keanggotaan pending. Tidak ada admin dengan kredensial default. Buat admin secara eksplisit menggunakan `npm run admin:create -- --email <alamat>` dari backend pada terminal interaktif; password disembunyikan dan tidak dikirim ke Git.

Menjalankan ulang seed tidak mengubah keputusan verifikasi atau menggandakan event pengajuan awal. Data contoh profil/lowongan tetap dapat diperbarui oleh seed, sehingga seed bukan alat pemeliharaan database yang berisi data pengguna nyata.

## Migrasi database v1/v2/v3/v4 yang sudah ada

Jalur yang dipakai pada database lokal: dari backend, jalankan `npm run db:migrate` saat tidak ada penulisan aplikasi. Script memilih migrasi 001–004 yang belum diterapkan, membuat dump di `database/backups/`, memulihkannya ke database acak `finetern_restore_test_*`, menguji migrasi/pelestarian seluruh data pada salinan, memastikan sumber tidak berubah, kemudian memigrasi sumber. Hanya salinan yang dibuat run tersebut dibersihkan; backup tetap ada. `MYSQL_BIN_DIR` menunjuk folder executable `mysql` dan `mysqldump` (default Laragon MySQL 8.4.3 Windows). Jika semua marker applied, script berhenti tanpa mengulang. Lindungi backup karena berisi data akun/pengguna. Backup operasional juga harus menyertakan folder berkas privat; dump SQL tidak menyimpan isi berkas.

Alternatif manual berikut tetap memerlukan uji pemulihan backup sebelum migrasi:

1. Hentikan penulisan aplikasi selama migrasi dan buat backup yang dapat dipulihkan. Folder backup lokal di bawah diabaikan Git.
2. Pastikan versi sumber mengikuti repository. Untuk v1, constraint sekolah lama bernama `schools_ibfk_1` dan index uniknya `user_id`; untuk v2, marker 001 harus applied. Database yang pernah diubah manual harus diperiksa dahulu. Catat jumlah dan isi data penting sebelum migrasi.
3. Jalankan 001–004 untuk v1; 002–004 untuk v2; 003–004 untuk v3; hanya 004 untuk v4. Jangan mengulang migrasi yang sudah applied, menjalankan `schema.sql`, atau memakai seeder baru pada database lama.
4. Periksa marker, jumlah data, pemetaan guru, riwayat karya/lamaran legacy, dan pengajuan pending. Setelah itu baru jalankan kode yang menggunakan model v5.

Contoh perintah PowerShell dari root repository; sesuaikan host, port, user, dan nama database dengan lingkunganmu:

```powershell
New-Item -ItemType Directory -Path database/backups -Force
mysqldump --host=127.0.0.1 --port=3306 --user=root --password --single-transaction --result-file=database/backups/finetern-before-v5.sql finetern_db
# Lanjutkan hanya jika dump berhasil dan backup dapat dipulihkan.
# Migrasi 001 hanya untuk sumber v1.
Get-Content -Raw database/migrations/001_identity_verification.sql | mysql --host=127.0.0.1 --port=3306 --user=root --password finetern_db
# Untuk sumber v2 dengan marker 001 applied, jalankan 002–004.
Get-Content -Raw database/migrations/002_portfolio_evidence.sql | mysql --host=127.0.0.1 --port=3306 --user=root --password finetern_db
# Untuk sumber v3 dengan 001 dan 002 applied, jalankan 003 dan 004.
Get-Content -Raw database/migrations/003_recruitment_matching.sql | mysql --host=127.0.0.1 --port=3306 --user=root --password finetern_db
# Untuk sumber v4 dengan 001–003 applied, jalankan hanya 004.
Get-Content -Raw database/migrations/004_adaptive_learning.sql | mysql --host=127.0.0.1 --port=3306 --user=root --password finetern_db
```

MySQL DDL melakukan implicit commit: migrasi ini **bukan transaksi yang dapat di-rollback seluruhnya**. Penanda `applying` ditulis sebelum perubahan dan menjadi `applied` setelah semuanya selesai. Pengulangan migrasi berhenti pada penanda versi yang sudah ada sebelum perubahan schema berikutnya. Jangan menghapus penanda untuk memaksa pengulangan setelah kegagalan; periksa titik kegagalan dan pulihkan dari backup atau siapkan perbaikan terarah. Tidak ada down migration yang membuang data akun guru baru.

```sql
SELECT * FROM schema_migrations;
SELECT t.user_id, t.nama_lengkap, m.sekolah_id, m.posisi, r.status
FROM teachers t
JOIN school_memberships m ON m.teacher_id=t.id
JOIN verification_requests r ON r.membership_id=m.id;
```

ID dan isi data lama tetap dipertahankan, termasuk kredensial, siswa, karya, lowongan, lamaran, serta pembelajaran. `schools.user_id` dipindahkan menjadi `submitted_by`; guru pribadi dan keanggotaannya dibuat dari relasi lama. Nama pribadi guru yang tidak tersedia dibiarkan NULL agar dilengkapi, bukan dikarang. Migrasi tidak membuat admin, koordinator otomatis, atau keputusan approved. Pemilik melengkapi data/bukti melalui mobile, lalu admin memeriksa sekolah dan menetapkan koordinator awal melalui `/admin/`.

## Pengujian

```powershell
cd backend
npm run test:database
```

Tes memakai dependency yang sudah terpasang dan koneksi MySQL lokal dari `backend/.env`. Kredensial uji dapat diganti melalui `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, dan `TEST_DB_PASS`. Host harus lokal dan user membutuhkan izin membuat/menghapus database uji.

Tes membuat tiga database bernama acak `finetern_test_<acak>_fresh`, `finetern_test_<acak>_migration`, dan `finetern_test_<acak>_partial`, lalu menghapus hanya database yang berhasil dibuat pada run tersebut. Database aplikasi tidak dipilih atau diubah. Fixture v1 dibekukan untuk menguji perpindahan dari schema lama.

Pemeriksaan mencakup instalasi/seed baru, dua guru dalam satu sekolah, status pending, seed ulang tanpa kehilangan keputusan, constraint subjek/keanggotaan/FK/identifier institusi, pelestarian seluruh record lama, kesamaan schema hasil migrasi dan instalasi baru, penolakan migrasi ulang, serta deteksi kegagalan DDL di tengah migrasi. `npm run test:auth` menguji otorisasi HTTP pada database acak `finetern_auth_test_*` dan direktori bukti sementara. `npm test` juga menjalankan pengujian portofolio, rekrutmen, provider Gemini simulasi, serta alur pembelajaran pada database terisolasi. Lihat [Tahap 5](../docs/TAHAP_5_GEMINI_DAN_KUIS.md). Database utama tidak diubah oleh tes; interaksi perangkat mobile tetap perlu diperiksa terpisah.
