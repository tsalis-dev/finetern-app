# Handover pengembangan Finetern

Diperbarui: 3 November 2026. Repository: [tsalis-dev/finetern-app](https://github.com/tsalis-dev/finetern-app), branch pengembangan `develop`; `main` untuk rilis stabil.

Finetern adalah platform rekrutmen magang siswa SMK berdasarkan bukti karya, pencocokan keahlian mikro, dan rekomendasi belajar adaptif melalui Gemini. Proyek IK300 Mobile Programming, Universitas Pendidikan Indonesia. Nama aplikasi yang dipakai kode dan dokumentasi adalah Finetern.

## Status saat ini

Tahap 1 selesai. Implementasi Tahap 2 tersedia: migrasi identitas guru pribadi, autentikasi nyata, profil, pendaftaran, dan verifikasi bertingkat melalui backend/mobile serta halaman admin. Database lokal sudah dimigrasi setelah backup berhasil dipulihkan dan diuji pada salinan; data lama dipertahankan. Admin lokal disiapkan sesuai pilihan pemilik; kredensial tidak disimpan di repository.

Pengujian backend/database dan sesi mobile lulus, bundling Android/Hermes berhasil. Pengujian interaksi di HP fisik masih perlu dilakukan. Revisi desain lengkap di Figma masih draft; warna primer kode sekarang burgundy `#842D3E` dengan permukaan putih/netral. Ini belum berarti semua frame Figma sudah diimplementasikan.

Layar portofolio, matching, lowongan, lamaran, dan AI masih berisi data contoh dengan label pratinjau. Tombolnya tidak mengklaim mengirim atau menyimpan hasil nyata. Pengguna pending hanya dapat membuka status/perbaikan pengajuan. Tab sekolah “Verifikasi Akun” sudah menjalankan pemeriksaan akun nyata; validasi bukti proyek adalah pekerjaan Tahap 3.

## Keputusan produk dan arsitektur

- Sekolah/industri diperiksa admin platform secara manual.
- Guru mempunyai akun pribadi; koordinator sekolah menyetujui guru lain di sekolahnya.
- Guru approved memeriksa siswa sekolahnya sendiri.
- Pendaftar pertama tidak otomatis menjadi koordinator. Admin menyetujui institusi dan menunjuk perwakilan awal dalam satu transaksi.
- Persetujuan akun, konfirmasi email, dan validasi keterampilan proyek adalah hal berbeda.
- `needs_revision` dapat diperbaiki, `rejected` final dan diarahkan menghubungi pengelola.
- Satu guru/satu sekolah dan satu perwakilan/satu industri untuk MVP.
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
| Database | MySQL 8, mysql2/promise pool, schema v2; nama kolom aktual di SQL |
| Auth | bcrypt 10, JWT HS256 issuer/audience, pemeriksaan identitas terbaru per permintaan |
| Bukti institusi | Multer, privat di `backend/private-verifications/`, PDF/JPG/PNG maksimal 5 MB |
| Portofolio | Struktur upload lama tersedia; API fitur belum dibuat |
| AI | `@google/genai`; jangan mengganti dengan SDK `@google/generative-ai` lama |
| Respons | `{success,message,data}`, kecuali unduhan attachment |

Role SQL `sekolah` berarti guru pribadi, bukan akun institusi bersama. Koordinator adalah posisi pada `school_memberships`. Terdapat 16 tabel aplikasi dan satu tabel metadata migrasi. Jangan memakai nama kolom dari handover lama: siswa menggunakan `sekolah_id`, industri menggunakan `sektor_industri,kota_domisili`; lihat schema aktual.

## Panduan utama

- [Autentikasi, menjalankan aplikasi, admin, kontrak API, dan pengujian](docs/TAHAP_2_AUTENTIKASI_DAN_PROFIL.md)
- [Aturan verifikasi dan cara pemeriksaan manual](docs/VERIFIKASI_AKUN_DAN_INSTITUSI.md)
- [Model database, migrasi, backup, dan seed](database/README.md)

Backend: `cd backend`, `npm ci`, konfigurasi `.env`, `npm start`. Admin lokal: [http://localhost:5000/admin/](http://localhost:5000/admin/). Jangan membagikan password di chat/Git; buat/reset melalui `npm run admin:create -- --email <alamat> [--reset-password]` pada terminal interaktif.

Mobile: `cd mobile`, `npm ci`, isi `.env` mengikuti `.env.example` bila memakai HP, `npx expo start`. Backend dan HP harus saling terjangkau. `10.0.2.2` hanya untuk emulator Android.

Seed khusus pengembangan mempunyai tujuh akun pending dengan password contoh `password123`; bukan akun institusi yang sudah disahkan. Data lama tidak otomatis dibuat approved. Jangan menjalankan seed pada data pengguna nyata.

## Roadmap

- [x] Tahap 1: fondasi, schema awal, dan kerangka navigasi.
- [x] Tahap 2: implementasi akun nyata, profil, pendaftaran/verifikasi, dan pemeriksaan otomatis; uji HP fisik masih terbuka.
- [ ] Tahap 3: unggah bukti karya/portofolio, klaim keterampilan, antrean dan validasi proyek guru.
- [ ] Tahap 4: katalog lowongan nyata, persyaratan keterampilan, matching, dan lamaran.
- [ ] Tahap 5: modul Gemini dan kuis berdasarkan kesenjangan keterampilan.
- [ ] Tahap 6: pengujian siklus penuh dan build APK.

Rumus rancangan matching: `sum(min(1, p_i / m_i) * w_i) / sum(w_i) * 100%`. Kebijakan awal batas lamaran 80%. Saat implementasi, tetapkan sumber tingkat keterampilan dan kasus tanpa persyaratan; hasil kuis tidak otomatis memvalidasi bukti proyek.

## Melanjutkan pekerjaan

Baca tiga panduan di atas dan kode terkait sebelum mengubah fitur. Tahap berikutnya adalah portofolio berbasis bukti. Tetap pisahkan antrean akun dari antrean karya. Gunakan kembali pemeriksaan `canUseApp` dan sekolah terbaru di server untuk endpoint baru; penyembunyian tab bukan otorisasi.

Jalankan pemeriksaan sesuai perubahan. Jangan commit `.env`, password awal, backup database, berkas privat, artefak build/browser, atau token. Audit Expo SDK 57 masih mempunyai temuan transitif; tindak lanjut upgrade SDK memerlukan pengujian tersendiri, bukan `npm audit fix --force`.
