# Tahap 2: Autentikasi Multi-Peran dan Profil Dasar

Status: rancangan sebelum implementasi. Fitur pada dokumen ini belum selesai dibuat.

> Keputusan pengguna: setiap guru memiliki akun sendiri; admin platform memverifikasi sekolah/industri; koordinator sekolah menyetujui guru; guru memverifikasi siswa sekolahnya. Baca [rancangan verifikasi akun dan institusi](VERIFIKASI_AKUN_DAN_INSTITUSI.md). Login/sesi/profil tetap diperlukan; cakupan verifikasi memperluas Tahap 2 menjadi 2A, 2B, dan 2C pada dokumen pendamping. Alur sudah disetujui; rincian operasional dan implementasi belum selesai.

Dokumen ini menjabarkan Tahap 2 pada `PROGRES_DAN_PANDUAN_AI.md` berdasarkan kode dan schema yang tersedia. Tujuannya adalah menyepakati perilaku aplikasi sebelum menulis kode fitur.

## 1. Hasil yang ingin dicapai

Siswa, sekolah, dan industri dapat masuk memakai akun yang tersimpan di MySQL. Backend memeriksa kata sandi dan mengeluarkan JWT. Aplikasi menampilkan navigasi serta profil berdasarkan identitas yang dikonfirmasi backend. Pengguna bisa membuka ulang aplikasi, mengetahui bahwa sesinya berakhir, dan keluar dari akun.

Contoh hasil: Ahmad masuk menggunakan akun siswa, melihat profil Ahmad dari database, menutup dan membuka aplikasi, lalu tetap dikenali selama tokennya valid. Memilih tab industri di formulir tidak memberikan hak akses industri kepada akun Ahmad.

Profil dasar pada tahap ini berarti membaca dan menampilkan data akun sendiri. Pengubahan profil, email, atau kata sandi memerlukan cakupan tersendiri dan belum termasuk kontrak awal tahap ini.

## 2. Kondisi awal yang sudah diperiksa

- Branch pengembangan: `develop`. Remote `origin`: `https://github.com/tsalis-dev/finetern-app.git`.
- Backend baru memasang `/api/health`. Controller login, register, dan profil belum ada.
- Login biasa dan demo sama-sama menjalankan `switchRole()` dengan token dummy.
- `useAuthStore` sudah memiliki penyimpanan lokal, tetapi belum mengonfirmasi sesi ke backend saat aplikasi dibuka.
- Ketiga layar profil masih mencampurkan state pengguna dengan contoh data yang ditulis di kode.
- Schema memiliki `users`, `students`, `schools`, dan `industries`. Kolom aktual menggunakan `sekolah_id`, `nama_lengkap`, `nama_sekolah`, `sektor_industri`, dan `kota_domisili`.
- `schools.user_id` unik: model saat ini mendukung satu akun institusi untuk satu sekolah. Nama guru pribadi dan NIP belum disimpan dalam schema.
- Pekerjaan perapian fondasi sebelumnya masih berupa temuan dan rancangan; belum ada migrasi atau perbaikan kode yang diterapkan.
- Revisi burgundy di Figma masih draft. Perbaikan beberapa label tombol tertunda karena batas penggunaan koneksi Figma. Warna dan layout Figma tidak membuktikan bahwa alur autentikasi sudah berjalan.

## 3. Alur pengguna

### Masuk

1. Pengguna mengisi email dan kata sandi.
2. Mobile memvalidasi isian dasar dan menampilkan proses permintaan.
3. Backend memeriksa input, mencari akun, lalu membandingkan kata sandi dengan hash bcrypt.
4. Jika sesuai, backend mengembalikan token dan identitas pengguna tanpa hash kata sandi.
5. Mobile menyimpan sesi dan menampilkan status pengajuan atau dashboard berdasarkan role, keanggotaan, dan verifikasi yang dikonfirmasi backend.
6. Jika gagal, formulir menampilkan pesan yang sesuai. Tidak ada perpindahan role atau keberhasilan login palsu.

Role pada database saat ini adalah `siswa`, `sekolah`, dan `industri`. Migrasi perlu mendukung akun guru pribadi, kewenangan koordinator, dan admin platform; representasi teknisnya ditetapkan sebelum implementasi. Alias lama `guru_smk` dan `mitra_industri` perlu dibersihkan dari alur akun nyata. Tab pemilih peran bukan sumber otorisasi.

### Pendaftaran dan verifikasi (alur yang disetujui)

Siswa mengisi nama lengkap, email, kata sandi dan konfirmasinya, sekolah terverifikasi, jurusan, kelas, serta NISN opsional sesuai schema. Backend memvalidasi sekolah dan membuat `users` bersama `students` dalam satu transaksi: keduanya berhasil atau keduanya dibatalkan. Email atau NISN duplikat ditangani sebagai konflik. Keanggotaan siswa menunggu persetujuan sekolah.

Guru memiliki akun sendiri dan mengajukan keanggotaan pada sekolah untuk disetujui koordinator. Perwakilan sekolah/industri mengajukan institusinya untuk diperiksa admin platform. Guru yang telah disetujui memverifikasi siswa sekolahnya. Pembagian pemeriksa, koordinator sekolah, dan hak akun pending dijelaskan dalam dokumen pendamping. Admin tidak dapat dibuat melalui pendaftaran publik.

Pendaftaran publik tidak langsung memberikan hak memvalidasi siswa/karya atau menerbitkan lowongan. Pemeriksa dan bukti yang diperlukan harus ditetapkan sebelum endpoint pemeriksaan dibuat.

### Membuka ulang aplikasi dan keluar

- Saat aplikasi dibuka, sesi yang tersimpan dikonfirmasi melalui `/api/profile/me` sebelum dianggap sebagai identitas yang sah.
- Token tidak valid atau kedaluwarsa mengembalikan pengguna ke login dan membersihkan sesi.
- Gangguan jaringan dibedakan dari penolakan token; jangan menyatakan kredensial salah atau menghapus sesi hanya karena server tidak terjangkau.
- Keluar membersihkan sesi aktif dan penyimpanan lokal, lalu membuka layar login.
- Pada kontrak awal JWT stateless, keluar menghapus token di perangkat. Pencabutan token di server dan keluar dari seluruh perangkat belum dijanjikan oleh tahap ini.

### Profil dasar

| Peran | Data yang ditampilkan berdasarkan schema aktual |
| --- | --- |
| Siswa | Nama lengkap, email, NISN bila ada, sekolah, jurusan, kelas, biodata bila ada |
| Guru / sekolah | Nama dan email guru, sekolah tempat bergabung, kewenangan serta status keanggotaan; identitas institusi sesuai schema hasil migrasi |
| Industri | Nama perusahaan, email akun, sektor, kota, deskripsi perusahaan |

Data yang belum tersedia ditampilkan sebagai belum diisi. Jangan menampilkan NIP, nama pembimbing, jumlah siswa, website perusahaan, atau status magang contoh seolah berasal dari database.

## 4. Kontrak API yang direncanakan

Seluruh respons mengikuti `{ success, message, data }`.

| Endpoint | Akses | Tanggung jawab |
| --- | --- | --- |
| `POST /api/auth/login` | Publik | Periksa email/kata sandi; kembalikan JWT dan user |
| `POST /api/auth/register` | Publik sesuai kebijakan verifikasi yang ditetapkan | Buat akun, profil, dan pengajuan keanggotaan/institusi yang sesuai dalam transaksi |
| `GET /api/profile/me` | JWT valid | Kembalikan identitas akun dan profil sendiri |
| `GET /api/schools` | Publik untuk formulir pendaftaran | Daftar ID dan nama sekolah terverifikasi; jangan keluarkan data akun institusi |

Pola data identitas yang diusulkan:

```json
{
  "id": 4,
  "profileId": 1,
  "role": "siswa",
  "email": "siswa1@finetern.id",
  "nama": "Ahmad Pratama",
  "profile": {
    "sekolah_id": 1,
    "sekolah": "SMKN 1 Bandung",
    "nama_lengkap": "Ahmad Pratama",
    "nisn": "0061234561",
    "jurusan": "Rekayasa Perangkat Lunak",
    "kelas": "XII RPL 1",
    "biodata": null
  }
}
```

`id` adalah ID `users`; `profileId` adalah ID profil pada tabel peran. Jangan menyamakan keduanya hanya karena data demo memiliki ID yang serupa. Field `nama` dipetakan dari nama siswa, guru pribadi, atau perwakilan industri sesuai hasil perancangan profil. Contoh di atas belum memuat status verifikasi, keanggotaan, dan kewenangan yang harus ditambahkan untuk kebutuhan terbaru. Seluruh pemanggil `user` di mobile harus disesuaikan dengan kontrak yang sama. Endpoint pemeriksaan admin/koordinator/sekolah dirinci setelah kontrak verifikasi ditetapkan.

Status yang perlu dibedakan: `201` untuk akun baru, `200` untuk login/profil berhasil, `400` untuk input salah, `401` untuk kredensial atau sesi tidak valid, `403` untuk akses yang tidak diizinkan, `409` untuk duplikasi, dan kegagalan jaringan/server untuk kondisi layanan bermasalah.

## 5. Perapian fondasi yang menyertai tahap ini

- Pakai nama kolom SQL aktual dan selaraskan handover yang masih berbeda. Tidak perlu mengganti seluruh schema hanya untuk menyeragamkan bahasa nama kolom.
- Hilangkan fallback secret JWT yang sudah tertulis dalam kode. Konfigurasi yang diperlukan harus divalidasi sebelum server dipakai untuk autentikasi.
- Gunakan parameter query SQL dan transaksi untuk pembuatan akun beserta profil. Jangan mengirim password/hash dalam respons atau log.
- Tetapkan validasi input, durasi token, pembatasan percobaan login, dan penyimpanan token sebelum implementasi. AsyncStorage yang ada belum berarti penyimpanan terenkripsi; pilihan penyimpanan token perlu ditinjau pada implementasi.
- Endpoint profil mengambil identitas dari token yang diverifikasi, bukan ID pengguna yang dikirim mobile.
- Alamat API mobile dibuat dapat dikonfigurasi untuk HP fisik; `10.0.2.2` saat ini khusus emulator Android.
- Simulator role dan tombol demo tidak boleh memberi sesi nyata atau mengubah hak akses akun yang sudah masuk.
- Perbaiki nama tujuan navigasi beranda siswa yang tidak cocok dengan tab terdaftar jika jalur tersebut disentuh ketika integrasi.
- Jangan menjalankan ulang `schema.sql` untuk perubahan bertahap, karena script tersebut menghapus database.

Perbaikan relasi asesmen ke modul, identitas pemeriksa karya, dan pemisahan nilai kuis dari kemahiran tervalidasi tetap dicatat untuk tahap portofolio/pembelajaran. Hal itu belum dikerjakan hanya karena rencana Tahap 2 sudah dibuat.

## 6. Urutan implementasi setelah pemahaman dikunci

1. Selaraskan dokumentasi, kebijakan pendaftaran, kontrak identitas, dan konfigurasi autentikasi.
2. Buat login serta profil backend; uji tiga peran dan kasus penolakan.
3. Tambahkan transaksi pendaftaran, daftar sekolah, pengajuan keanggotaan, dan alur pemeriksaan sesuai rancangan verifikasi yang ditetapkan.
4. Sambungkan mobile: formulir login/daftar, status pengajuan, antrean pemeriksa yang sesuai, konfirmasi sesi, penanganan error, logout, dan profil nyata. Sediakan antrean institusi untuk admin melalui halaman internal sederhana.
5. Uji alur menyeluruh dan bundling mobile; catat mana yang diuji di perangkat nyata dan mana yang belum.

Layar login, pendaftaran, status pengajuan, pemeriksaan, dan profil merupakan fokus UI tahap ini. Perubahan desain menyeluruh sembilan layar tidak termasuk prasyarat agar backend autentikasi dapat dibuat.

## 7. Kriteria selesai

- Akun seed ketiga peran bisa login, melihat profil yang benar, dan masuk ke navigasi yang sesuai.
- Salah password, akun tidak dikenal, token palsu/kedaluwarsa, dan permintaan tanpa token ditolak secara konsisten.
- Role dan identitas tidak bisa dinaikkan lewat tab mobile, body request, atau simulator.
- Pendaftaran yang disepakati menghasilkan akun dan profil yang konsisten. Duplikasi dan kegagalan profil tidak meninggalkan akun setengah jadi.
- Membuka ulang aplikasi mengonfirmasi sesi; logout membersihkan sesi; gangguan jaringan memberi penjelasan yang benar.
- Tampilan profil tidak memakai identitas contoh sebagai pengganti data yang belum tersedia.
- Guru memiliki sesi pribadi; akun pending dan anggota sekolah lain tidak dapat menjalankan aksi pemeriksaan yang bukan kewenangannya. Status institusi/keanggotaan dan penonaktifan diperiksa backend pada aksi terlindungi.
- Pengujian backend untuk autentikasi/otorisasi dan transaksi lolos; mobile berhasil di-bundle. Hasil uji perangkat dilaporkan apa adanya.
- Setiap perubahan utuh yang selesai diperiksa di-commit dan di-push ke `origin/develop`; kegagalan push dilaporkan. File `.env`, token, password lokal, dan berkas upload tidak dimasukkan ke commit.

## 8. Keputusan produk yang diperbarui

1. Setiap guru memiliki akun sendiri yang terhubung ke sekolah, sesuai pilihan pengguna. Schema satu akun institusi per sekolah harus direvisi sebelum implementasi.
2. Pengguna menyetujui verifikasi bertingkat: admin memeriksa sekolah/industri, koordinator sekolah menyetujui guru, dan guru memverifikasi siswa. Alur ini sudah menjadi keputusan produk; kode, migrasi, dan rincian operasionalnya belum selesai.

Unggah portofolio, validasi guru, matching, lowongan nyata, modul Gemini, kuis, dan status lamaran adalah tahap berikutnya. Semua itu belum menjadi fitur yang selesai hanya dengan berhasil login.
