# Handover pengembangan Finetern

Diperbarui: 4 November 2026. Repository: [tsalis-dev/finetern-app](https://github.com/tsalis-dev/finetern-app), branch pengembangan `develop`; `main` untuk rilis stabil.

Finetern adalah platform rekrutmen magang siswa SMK berdasarkan bukti karya, pencocokan keahlian mikro, dan rekomendasi belajar adaptif melalui Gemini. Proyek IK300 Mobile Programming, Universitas Pendidikan Indonesia. Nama aplikasi yang dipakai kode dan dokumentasi adalah Finetern.

## Status saat ini

Tahap 1 selesai. Implementasi Tahap 2 tersedia: migrasi identitas guru pribadi, autentikasi nyata, profil, pendaftaran, dan verifikasi bertingkat melalui backend/mobile serta halaman admin. Database lokal sudah dimigrasi setelah backup berhasil dipulihkan dan diuji pada salinan; data lama dipertahankan. Admin lokal disiapkan sesuai pilihan pemilik; kredensial tidak disimpan di repository.

Tahap 3 tersedia: siswa mengajukan karya dengan foto/PDF atau tautan untuk satu keterampilan, guru sekolahnya memberi catatan dan penilaian, siswa dapat memperbaiki pengajuan, dan bukti/keputusan tersimpan per versi. Keterampilan tervalidasi hanya berasal dari penilaian karya terstruktur.

Tahap 4 tersedia: industri terverifikasi mengelola lowongan, siswa melihat kecocokan dari bukti karya dan melamar dengan persetujuan berbagi, industri mencatat seleksi, dan sekolah memantau status siswa sendiri. Database lokal sekarang v5 setelah backup dipulihkan serta migrasi diperiksa pada salinan. Syarat lamaran yang ditegaskan pengguna: skor minimal 80% **dan seluruh keterampilan wajib memenuhi nilai minimum**.

Pengujian backend/database dan mobile lulus, bundling Android/Hermes berhasil. **Pengguna meminta crosscheck langsung di HP dilakukan pada akhir pengembangan; jangan menjadikannya prasyarat untuk melanjutkan tahap berikutnya.** Revisi desain lengkap di Figma masih draft; warna primer kode burgundy `#842D3E` dengan permukaan putih/netral.

Untuk presentasi 5 November, data demo terpisah sudah disiapkan melalui API pada `finetern_demo_class`, backend port 5001, dengan akun siswa/guru/industri dan satu modul Gemini nyata tersimpan. Perintah `npm run demo:start` dari backend; akun/password hanya pada `backend/.local/finetern_demo_class/credentials.json`. Seluruh 51 tes backend lulus. Pemilik memilih emulator untuk proyektor dan mengizinkan persiapan serta restart. Aktivasi administrator 4 November berhasil: HypervisorPlatform dari Disabled menjadi Enabled, virtualisasi firmware aktif, konfigurasi boot default tidak diubah, RestartNeeded=true. **Menunggu restart manual pengguna**; hypervisor belum berjalan dan AVD belum dapat diuji pada sesi Windows ini. Setelah pengguna kembali, periksa `emulator.exe -accel-check` (kode 0), boot `Medium_Phone_API_37.0`, lalu jalankan MySQL/backend demo/Expo dan uji tampilan aplikasi. Status lokal ada di `backend/.local/finetern_demo_class/emulator-acceleration-status.json`. Jangan mengubah BIOS, menonaktifkan fitur keamanan, mengulang seed demo, atau menyatakan emulator siap sebelum verifikasi setelah restart.

Tahap 5 tersedia: AI Mentor membuat materi Gemini dari kekurangan keterampilan pada lowongan, menyediakan mini proyek dan tiga soal latihan, serta menyimpan progres pribadi. Pembuatan materi nyata dengan key lokal berhasil diuji. Kuis tidak mengubah nilai guru atau matching. Seluruh fitur tersebut memakai data nyata. Guru mempunyai antrean “Verifikasi Akun”, “Bukti Karya”, serta pemantauan lamaran siswa yang terpisah. Akun pending hanya dapat membuka status/perbaikan pengajuan akun.

## Keputusan produk dan arsitektur

- Sekolah/industri diperiksa admin platform secara manual.
- Guru mempunyai akun pribadi; koordinator sekolah menyetujui guru lain di sekolahnya.
- Guru approved memeriksa siswa sekolahnya sendiri.
- Pendaftar pertama tidak otomatis menjadi koordinator. Admin menyetujui institusi dan menunjuk perwakilan awal dalam satu transaksi.
- Persetujuan akun, konfirmasi email, dan validasi keterampilan proyek adalah hal berbeda.
- `needs_revision` dapat diperbaiki, `rejected` final dan diarahkan menghubungi pengelola.
- Satu guru/satu sekolah dan satu perwakilan/satu industri untuk MVP.
- Industri hanya melihat rincian profil dan karya relevan melalui lamaran dengan persetujuan siswa; akses tersebut berhenti setelah penolakan atau penarikan. Status, catatan, dan skor ringkas tetap menjadi riwayat.
- Semua perubahan yang selesai diuji harus di-commit dan di-push ke `develop` sesuai instruksi pemilik.

## Teknologi dan batasan

| Bagian | Pilihan |
| --- | --- |
| Mobile | Expo SDK 57, React Native 0.86.3, React 19.2.3 |
| Navigasi | React Navigation 7 Native Stack dan Bottom Tabs; jangan memakai expo-router |
| Sesi | Zustand 5, token native di Expo SecureStore; AsyncStorage hanya untuk membersihkan sesi demo lama |
| HTTP | Axios; `EXPO_PUBLIC_API_URL` untuk alamat backend di HP |
| Desain | Token `mobile/src/utils/theme.js`; burgundy, hierarki netral, jarak konsisten |
| Backend | Node.js, Express 5, controller/service/routes/middleware |
| Database | MySQL 8, mysql2/promise pool, schema v5; nama kolom aktual di SQL |
| Auth | bcrypt 10, JWT HS256 issuer/audience, pemeriksaan identitas terbaru per permintaan |
| Bukti institusi | Multer, privat di `backend/private-verifications/`, PDF/JPG/PNG maksimal 5 MB |
| Portofolio | Berkas privat `backend/private-portfolios/`, versi/riwayat penilaian; ImagePicker, DocumentPicker, FileSystem, Sharing di mobile |
| AI | `@google/genai`; jangan mengganti dengan SDK `@google/generative-ai` lama |
| Respons | `{success,message,data}`, kecuali unduhan attachment |

Role SQL `sekolah` berarti guru pribadi, bukan akun institusi bersama. Koordinator adalah posisi pada `school_memberships`. Terdapat 19 tabel aplikasi dan satu tabel metadata migrasi. Jangan memakai nama kolom dari handover lama: siswa menggunakan `sekolah_id`, industri menggunakan `sektor_industri,kota_domisili`; lihat schema aktual.

## Panduan utama

- [Autentikasi, menjalankan aplikasi, admin, kontrak API, dan pengujian](docs/TAHAP_2_AUTENTIKASI_DAN_PROFIL.md)
- [Aturan verifikasi dan cara pemeriksaan manual](docs/VERIFIKASI_AKUN_DAN_INSTITUSI.md)
- [Alur karya, aturan nilai keterampilan, bukti privat, dan API Tahap 3](docs/TAHAP_3_PORTOFOLIO_DAN_VALIDASI.md)
- [Lowongan, matching, persetujuan berbagi bukti, dan seleksi Tahap 4](docs/TAHAP_4_LOWONGAN_MATCHING_DAN_LAMARAN.md)
- [Materi Gemini, kuis, konfigurasi key, dan batas permintaan Tahap 5](docs/TAHAP_5_GEMINI_DAN_KUIS.md)
- [Data terpisah dan urutan demo kelas 5 November 2026](docs/DEMO_KELAS.md)
- [Model database, migrasi, backup, dan seed](database/README.md)

Backend: `cd backend`, `npm ci`, konfigurasi `.env`, `npm start`. Admin lokal: [http://localhost:5000/admin/](http://localhost:5000/admin/). Jangan membagikan password di chat/Git; buat/reset melalui `npm run admin:create -- --email <alamat> [--reset-password]` pada terminal interaktif.

Mobile: `cd mobile`, `npm ci`, isi `.env` mengikuti `.env.example` bila memakai HP, `npx expo start`. Backend dan HP harus saling terjangkau. `10.0.2.2` hanya untuk emulator Android.

Seed khusus pengembangan mempunyai tujuh akun pending dengan password contoh `password123`; bukan akun institusi yang sudah disahkan. Data lama tidak otomatis dibuat approved. Jangan menjalankan seed pada data pengguna nyata.

## Roadmap

- [x] Tahap 1: fondasi, schema awal, dan kerangka navigasi.
- [x] Tahap 2: implementasi akun nyata, profil, pendaftaran/verifikasi, dan pemeriksaan otomatis; uji HP fisik masih terbuka.
- [x] Tahap 3: unggah bukti karya, klaim keterampilan, revisi/riwayat, penilaian guru, dan integrasi mobile; crosscheck HP ditunda sampai akhir.
- [x] Tahap 4: lowongan, persyaratan, matching, persetujuan berbagi bukti, lamaran/seleksi, kuota, dan pemantauan sekolah; crosscheck HP ditunda sampai akhir.
- [x] Tahap 5: modul Gemini, mini proyek, kuis formatif, progres pribadi, cache/kuota, dan pengujian koneksi nyata; crosscheck HP ditunda sampai akhir.
- [ ] Tahap 6: pengujian siklus penuh dan build APK.

Rumus matching: `sum(min(1, p_i / m_i) * w_i) / sum(w_i) * 100%`. Batas lamaran 80% dan semua keterampilan wajib harus memenuhi minimum. Nilai berasal dari karya approved yang dinilai guru; syarat kosong tidak membuat siswa otomatis cocok. Hasil kuis tidak otomatis memvalidasi bukti proyek.

## Melanjutkan pekerjaan

Baca panduan di atas dan kode terkait sebelum mengubah fitur. Tahap berikutnya adalah Tahap 6: pengujian siklus penuh pada HP dan build APK; bundling Android sebelumnya belum merupakan APK. Hasil kuis adalah progres belajar, bukan validasi proyek; jangan mengubah sumber matching menjadi cache/kuis. Pertahankan izin bukti melalui lamaran, versi lowongan/lamaran, kuota, serta pemeriksaan `canUseApp` di server. Penyembunyian tombol bukan otorisasi.

Jalankan pemeriksaan sesuai perubahan. Jangan commit `.env`, password awal, backup database, berkas privat, artefak build/browser, atau token. Audit Expo SDK 57 masih mempunyai temuan transitif; tindak lanjut upgrade SDK memerlukan pengujian tersendiri, bukan `npm audit fix --force`.
