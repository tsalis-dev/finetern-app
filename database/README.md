# Database Finetern v2

Schema v2 menyiapkan akun guru pribadi dan verifikasi bertingkat. Migrasi sudah diuji di MySQL 8.4.3 pada database terpisah; tidak otomatis dijalankan saat backend menyala.

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
| `schema_migrations` | Penanda migrasi `applying`/`applied` untuk mendeteksi kegagalan dan migrasi berulang |

Tabel keterampilan, karya, lowongan, lamaran, modul, dan asesmen tetap tersedia. Total 16 tabel aplikasi dan satu tabel metadata migrasi.

Untuk menjaga kompatibilitas, `users.role='sekolah'` berarti akun pribadi guru/perwakilan sekolah; `schools` sendiri bukan akun login. Role `admin` disiapkan untuk pengelola platform dan tidak boleh diterima dari formulir pendaftaran publik. Koordinator adalah posisi pada keanggotaan sekolah, bukan role global.

Untuk MVP, satu guru memiliki satu baris keanggotaan sekolah. Perpindahan sekolah dan keanggotaan di beberapa sekolah belum ditangani; jangan mengganti `sekolah_id` pada keanggotaan yang telah disetujui tanpa rancangan transfer dan verifikasi ulang.

## Verifikasi dan audit

Setiap subjek memiliki satu `verification_requests`, dengan tepat satu kolom tujuan yang terisi: `sekolah_id`, `industri_id`, `membership_id`, atau `siswa_id`. Constraint database menolak subjek kosong/ganda dan pengajuan duplikat untuk subjek yang sama.

Status dimulai dari `pending`; alternatifnya `approved`, `needs_revision`, dan `rejected`. `is_active` terpisah dari persetujuan: status approved tidak cukup jika akun, institusi, atau keanggotaannya dinonaktifkan.

Saat API dibuat, perubahan status dan penambahan `verification_events` harus menjadi satu transaksi. Perbaikan pengajuan memperbarui status request dan menambah event `resubmitted` dengan snapshot data pengajuan yang relevan; jangan menimpa event lama atau menyertakan hash/password di snapshot. Dokumen bukti direferensikan oleh `evidence_path` ke penyimpanan privat, bukan URL publik `/uploads` portofolio.

Event `suspended`/`reactivated` mencatat penonaktifan/pemulihan subjek terkait dan alasan pada `note`; field `is_active` subjek diubah dalam transaksi yang sama. Penonaktifan akun tersimpan pada `users.disabled_by`, `disabled_at`, dan `disabled_reason`. Penghentian guru mengubah keanggotaannya, sedangkan penghentian siswa pada MVP dilakukan pada akunnya.

**Batas jaminan schema:** database menjaga relasi, keunikan, dan bentuk pengajuan. Ia belum memeriksa role pemeriksa, larangan menyetujui diri sendiri, kecocokan sekolah, atau urutan perubahan status. Backend Tahap 2 harus memeriksanya, memastikan `applicant_user_id` cocok dengan pemilik subjek, menolak perubahan/hapus riwayat melalui API, dan membaca status terbaru pada aksi terlindungi. Membuat kolom role/status tidak berarti otorisasi sudah berfungsi.

Untuk akses guru: akun aktif, role `sekolah`, keanggotaan aktif dan approved, serta sekolah aktif dan approved. Untuk menyetujui guru lain diperlukan posisi koordinator. Untuk siswa diperlukan akun aktif, pengajuan keanggotaan siswa approved, serta sekolah aktif dan approved. Untuk industri diperlukan akun dan institusi aktif serta pengajuan institusi approved. Token yang masih valid tidak menggantikan pemeriksaan tersebut.

NPSN dan nomor registrasi bersifat nullable agar migrasi tidak mengarang identitas resmi. Nilai non-null harus unik dan tidak boleh kosong. Format, normalisasi, bukti kewenangan perwakilan, dan syarat wajib pada pendaftaran baru ditetapkan sebelum endpoint dibuat; nomor yang unik sendiri bukan bukti institusi sah.

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

Seed membuat tujuh akun: dua guru pribadi, tiga siswa, dua industri. Password contoh tetap `password123`; semua pengajuan institusi/keanggotaan pending. Tidak ada akun admin dengan kredensial default. Penyediaan admin operasional dibuat secara eksplisit saat autentikasi diimplementasikan.

Menjalankan ulang seed tidak mengubah keputusan verifikasi atau menggandakan event pengajuan awal. Data contoh profil/lowongan tetap dapat diperbarui oleh seed, sehingga seed bukan alat pemeliharaan database yang berisi data pengguna nyata.

## Migrasi database v1 yang sudah ada

1. Hentikan penulisan aplikasi selama migrasi dan buat backup yang dapat dipulihkan. Folder backup lokal di bawah diabaikan Git.
2. Pastikan schema sumber masih mengikuti v1 repository. Constraint sekolah lama bernama `schools_ibfk_1` dan index uniknya `user_id`; database yang pernah diubah manual harus diperiksa dahulu. Catat jumlah dan isi data penting sebelum migrasi.
3. Jalankan file migrasi, bukan `schema.sql` atau seeder baru, pada database v1 yang dipilih secara eksplisit.
4. Periksa penanda migrasi, jumlah data, pemetaan guru, dan pengajuan pending. Setelah itu baru jalankan kode yang menggunakan model v2.

Contoh perintah PowerShell dari root repository; sesuaikan host, port, user, dan nama database dengan lingkunganmu:

```powershell
New-Item -ItemType Directory -Path database/backups -Force
mysqldump --host=127.0.0.1 --port=3306 --user=root --password --single-transaction --result-file=database/backups/finetern-before-v2.sql finetern_db
# Lanjutkan hanya jika dump berhasil dan backup dapat dipulihkan.
Get-Content -Raw database/migrations/001_identity_verification.sql | mysql --host=127.0.0.1 --port=3306 --user=root --password finetern_db
```

MySQL DDL melakukan implicit commit: migrasi ini **bukan transaksi yang dapat di-rollback seluruhnya**. Penanda `applying` ditulis sebelum perubahan dan menjadi `applied` setelah semuanya selesai. Pengulangan migrasi berhenti pada penanda versi yang sudah ada sebelum perubahan schema berikutnya. Jangan menghapus penanda untuk memaksa pengulangan setelah kegagalan; periksa titik kegagalan dan pulihkan dari backup atau siapkan perbaikan terarah. Tidak ada down migration yang membuang data akun guru baru.

```sql
SELECT * FROM schema_migrations;
SELECT t.user_id, t.nama_lengkap, m.sekolah_id, m.posisi, r.status
FROM teachers t
JOIN school_memberships m ON m.teacher_id=t.id
JOIN verification_requests r ON r.membership_id=m.id;
```

ID dan isi data lama tetap dipertahankan, termasuk kredensial, siswa, karya, lowongan, lamaran, serta pembelajaran. `schools.user_id` dipindahkan menjadi `submitted_by`; guru pribadi dan keanggotaannya dibuat dari relasi lama. Nama pribadi guru yang tidak tersedia dibiarkan NULL agar dilengkapi, bukan dikarang. Migrasi tidak membuat admin, koordinator otomatis, atau keputusan approved. Admin harus memeriksa sekolah dan menetapkan koordinator awal melalui alur verifikasi yang akan dibuat.

## Pengujian

```powershell
cd backend
npm run test:database
```

Tes memakai dependency yang sudah terpasang dan koneksi MySQL lokal dari `backend/.env`. Kredensial uji dapat diganti melalui `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, dan `TEST_DB_PASS`. Host harus lokal dan user membutuhkan izin membuat/menghapus database uji.

Tes membuat tiga database bernama acak `finetern_test_<acak>_fresh`, `finetern_test_<acak>_migration`, dan `finetern_test_<acak>_partial`, lalu menghapus hanya database yang berhasil dibuat pada run tersebut. Database aplikasi tidak dipilih atau diubah. Fixture v1 dibekukan untuk menguji perpindahan dari schema lama.

Pemeriksaan mencakup instalasi/seed baru, dua guru dalam satu sekolah, status pending, seed ulang tanpa kehilangan keputusan, constraint subjek/keanggotaan/FK/identifier institusi, pelestarian seluruh record lama, kesamaan schema hasil migrasi dan instalasi baru, penolakan migrasi ulang, serta deteksi kegagalan DDL di tengah migrasi. Tes ini belum membuktikan otorisasi API atau alur UI yang belum diimplementasikan.
