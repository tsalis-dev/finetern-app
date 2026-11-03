# Tahap 2: Autentikasi, Profil, dan Verifikasi

Status 4 November 2026: implementasi akun backend/mobile tersedia; database lokal kini v4 untuk mendukung portofolio dan [rekrutmen Tahap 4](TAHAP_4_LOWONGAN_MATCHING_DAN_LAMARAN.md). Migrasi dijalankan setelah backup dipulihkan dan diuji pada salinan. Pengujian otomatis dan bundling Android lulus. Crosscheck HP ditunda sampai akhir sesuai arahan pengguna.

## Hasil tahap ini

- Masuk dengan email dan kata sandi asli; pendaftaran siswa, guru, sekolah baru, dan industri.
- Setiap guru mempunyai akun pribadi. Role SQL `sekolah` berarti akun guru, sedangkan koordinator adalah posisi keanggotaan.
- Admin memeriksa institusi, koordinator memeriksa guru, guru memeriksa siswa sekolahnya sendiri.
- Akun pending dapat masuk untuk melihat status, catatan, melengkapi data, dan mengunggah bukti institusi.
- Profil menampilkan data sendiri dari database; data yang belum tersedia ditulis “Belum diisi”.
- Token native disimpan melalui Expo SecureStore. Identitas selalu diperiksa kembali melalui `GET /api/profile/me` saat pembukaan aplikasi dan saat kembali aktif.
- HTTP 401 membersihkan sesi terkait. Gangguan jaringan mempertahankan token dan menampilkan pilihan mencoba kembali.
- Keluar menghapus sesi perangkat. JWT masih stateless: belum ada pencabutan per token atau keluar dari semua perangkat. Penonaktifan akun/institusi tetap diperiksa backend pada setiap permintaan terlindungi.
- Simulator role dan token dummy telah dihapus. Portofolio berjalan melalui Tahap 3; lowongan, matching, dan seleksi melalui Tahap 4. AI Mentor masih pratinjau berlabel data contoh.

## Menjalankan secara lokal

Node.js yang kompatibel dengan Expo SDK 57 dan MySQL 8 diperlukan. Konfigurasi database berada pada `backend/.env`, contoh tersedia di `backend/.env.example`.

Dari folder backend:

```powershell
npm ci
npm run db:migrate
npm start
```

Runner migrasi mendukung v1/v2/v3 menuju v4. Instalasi kosong memakai `database/schema.sql`; lihat [panduan database](../database/README.md). Server menolak schema yang belum siap atau JWT secret kosong/contoh. Isi `JWT_SECRET` dengan nilai acak setidaknya 32 byte; durasi default `JWT_EXPIRES_IN=7d`.

Dari folder mobile:

```powershell
npm ci
# Salin .env.example menjadi .env dan sesuaikan alamat API bila memakai HP fisik.
npx expo start
```

`EXPO_PUBLIC_API_URL=http://<IP-LAN-laptop>:5000/api` untuk HP di jaringan yang sama. Default Android `10.0.2.2` khusus emulator; `localhost` default platform lain. Gunakan HTTPS saat dipasang pada server publik. Target implementasi adalah Android/iOS; penyimpanan token web hanya memori dan tidak bertahan setelah reload. Dependensi pendukung Expo web belum ditambahkan.

## Menyiapkan admin

Admin tidak bisa didaftarkan melalui API publik. Dari backend, gunakan terminal interaktif:

```powershell
npm run admin:create -- --email admin@example.com
# Untuk akun admin yang sudah ada:
npm run admin:create -- --email admin@example.com --reset-password
```

Input password disembunyikan. Alternatif `--generate` menulis password acak ke `backend/.local/admin-onboarding.txt` yang diabaikan Git; password tidak dicetak ke log. Pengaturan ulang interaktif menghapus file tersebut. Akun biasa tidak dapat dipromosikan lewat script ini.

Buka [halaman admin lokal](http://localhost:5000/admin/). Admin login lagi di browser; token hanya di memori halaman dan hilang saat reload. Pilih pengajuan, periksa data/bukti, lalu isi catatan dan pilih setujui, minta perbaikan, atau tolak. Pada daftar approved tersedia penghentian/pemulihan akses institusi. Form akses akun memakai ID akun pada rincian pengajuan dan tidak dapat menonaktifkan admin.

## Kontrak API

Respons JSON: `{ success, message, data }`. Berkas bukti dikirim sebagai attachment, bukan JSON. Endpoint terlindungi memakai `Authorization: Bearer <token>`.

| Endpoint | Akses dan hasil |
| --- | --- |
| `POST /api/auth/login` | Publik; email/password menghasilkan `{token,user}` |
| `POST /api/auth/register` | Publik; akun, profil, dan pengajuan dibuat dalam satu transaksi; hasil `{token,user}` |
| `GET /api/profile/me` | Akun aktif; identitas dan profil sendiri |
| `GET /api/schools?q=nama` | Publik; maksimal 200 ID/nama sekolah aktif approved yang cocok |
| `GET /api/verification/queue?status=pending&offset=0` | Pemeriksa berwenang; 30 pengajuan per halaman |
| `GET /api/verification/:id` | Pemilik atau pemeriksa; rincian, riwayat, dan `can_review` |
| `POST /api/verification/:id/review` | Pemeriksa; `{status,note}`; hanya pengajuan pending |
| `PATCH /api/verification/:id/resubmit` | Pemilik; perbaikan data pada pending/needs_revision, kembali pending |
| `POST /api/verification/:id/evidence` | Pemilik pengajuan institusi pending/needs_revision; multipart field `file` |
| `GET /api/verification/:id/evidence` | Pemilik/pemeriksa; bukti terbaru. `?eventId=<id>` untuk versi historis dari pengajuan yang sama |
| `PATCH /api/verification/:id/activity` | Admin; `{active:boolean,note}`, institusi approved |
| `PATCH /api/admin/accounts/:id/activity` | Admin; `{active:boolean,note}`, akun selain admin |

Pendaftaran selalu memerlukan `role,email,password,passwordConfirmation,nama`. Kata sandi minimal 8 karakter dan maksimal 72 byte UTF-8, tanpa trim. Email dinormalisasi ke huruf kecil.

| Jenis | Field tambahan |
| --- | --- |
| Siswa (`role=siswa`) | `schoolId,jurusan,kelas`, `nisn` opsional |
| Guru (`role=sekolah`) | `schoolId` sekolah aktif approved |
| Sekolah baru (`role=sekolah,newSchool=true`) | `schoolName,npsn,alamat,contactPhone`; guru pribadi dibuat bersama institusi |
| Industri (`role=industri`) | `companyName,sektor,kota,nomorRegistrasi,contactPhone` |

NPSN pendaftaran baru wajib 8 angka dan unik; nomor registrasi industri wajib, unik, dinormalisasi huruf besar. Data legacy boleh NULL hingga diperbaiki. Pengajuan ulang menggunakan field yang sama untuk subjek terkait, tanpa mengganti email, role, atau sekolah. Admin/koordinator tidak dapat dipilih melalui request publik.

Identitas memuat `id` pengguna, `profileId`, `role,email,nama,profile,verification,canUseApp,accessMessage`, dan data ringkas sekolah/jurusan/kelas/posisi bila relevan. `id` pengguna berbeda dari ID profil dan ID pengajuan. Password/hash tidak dikirim. Status aktif, keanggotaan, dan persetujuan dibaca ulang dari database, bukan dipercaya dari claim role JWT.

Kode status: 200 berhasil, 201 dibuat, 400 input tidak valid, 401 kredensial/token tidak valid atau akun nonaktif, 403 tidak berwenang, 404 tidak ditemukan, 409 konflik/keputusan sudah diproses, 413 isi terlalu besar, 429 terlalu banyak percobaan, 500 gangguan internal. Login dibatasi 50/15 menit dan daftar 200/jam per IP per proses. Siapkan shared store limiter sebelum menjalankan beberapa instance.

## Pemeriksaan dan batas tahap

Dari backend: `npm test` menguji schema/migrasi dan HTTP auth/verifikasi pada database lokal acak yang terpisah. Dari mobile: `npm test` menguji store sesi sebenarnya dengan batas penyimpanan/HTTP diganti simulasi; `npx expo export --platform android --output-dir dist` memeriksa bundling native beserta Hermes.

Uji manual perangkat yang perlu dilanjutkan: daftar per jenis akun, unggah dari pemilih berkas Android, persetujuan berjenjang dari dua akun, tutup/buka aplikasi, keluar, koneksi terputus, dan penonaktifan saat sesi terbuka. Bundling tidak membuktikan semua interaksi tersebut bekerja di perangkat.

Audit runtime backend: 0 temuan setelah perbaikan kompatibel. Audit keseluruhan masih mencatat 2 moderate pada nodemon/minimatch pengembangan. Audit mobile pada 4 November 2026 mencatat 14 temuan transitif (2 low, 10 moderate, 2 high) setelah modul bukti Tahap 3 ditambahkan; expo-sharing ikut bergantung pada tooling konfigurasi Expo yang terdampak. Perbaikan menyeluruh yang ditawarkan npm mengubah SDK ke 58; jangan menjalankan `npm audit fix --force` tanpa migrasi SDK dan pengujian terpisah. Ini belum merupakan persetujuan siap produksi.

Pemulihan password mandiri, verifikasi email otomatis, transfer sekolah, multi-sekolah per guru, dan multi-HR per industri belum termasuk MVP ini. Portofolio dan validasi bukti karya kini dijelaskan pada [Tahap 3](TAHAP_3_PORTOFOLIO_DAN_VALIDASI.md). Sesuai arahan pengguna 4 November, crosscheck HP Tahap 2/3 ditunda sampai akhir pengembangan.
