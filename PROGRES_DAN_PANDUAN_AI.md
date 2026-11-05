# Handover pengembangan Finetern

Diperbarui: 5 November 2026. Repository: [tsalis-dev/finetern-app](https://github.com/tsalis-dev/finetern-app), branch pengembangan `develop`; `main` untuk rilis stabil.

Finetern adalah platform rekrutmen magang siswa SMK berdasarkan bukti karya, pencocokan keahlian mikro, dan rekomendasi belajar adaptif melalui Gemini. Proyek IK300 Mobile Programming, Universitas Pendidikan Indonesia. Nama aplikasi yang dipakai kode dan dokumentasi adalah Finetern.

## Status saat ini

Logo F lipatan halaman yang disetujui pemilik diterapkan sebagai vektor `BrandLogo`, dengan sumber `mobile/assets/brand/mark.json` dan master SVG. Pembuka, pemilihan peran, dan login memakai identitas burgundy baru; logo juga tampil pada Beranda siswa, header form utama, serta loading sesi. Login menyediakan penanda peran/Ganti dan toggle sandi; autentikasi serta pemetaan role server tetap sama. Ikon umum, adaptive Android (termasuk monochrome), serta favicon diekspor dari geometri yang sama. Seluruh 24 tes mobile dan bundling Android/Hermes lulus. Pembuka/pilih peran/login, toggle sandi dengan teks dan keyboard, validasi kosong, tautan daftar, serta login tiga peran diperiksa di emulator. [Panduan aset dan referensi login](docs/branding/README.md). Perubahan ikon launcher perlu build native berikutnya; iOS serta build APK belum diperiksa pada perubahan ini.

Perombakan visual lanjutan berdasarkan referensi Task Management dan Ajheryuk yang disetujui pemilik diterapkan pada tiga halaman siswa: Beranda, daftar Magang, dan Detail Materi. Beranda memakai kartu burgundy, ilustrasi SVG milik Finetern, ringkasan karya dan nilai guru; daftar lowongan memakai pencarian ringkas dan status kelayakan terpisah dari skor; materi memakai hierarki tujuan/materi/mini proyek/kuis. Navbar tetap mengambang. Referensi, token, dan batas penerapan ada pada [panduan desain visual](docs/DESAIN_VISUAL_BURGUNDY.md). Tidak ada dependensi baru atau perubahan API/aturan penilaian. Seluruh 21 tes mobile dan bundling Android/Hermes lulus, termasuk regresi status lowongan yang harus mengikuti kelayakan server. Beranda, pencarian, tab lamaran, materi, pilihan kuis, dan isian awal formulir mini proyek diperiksa di emulator; tidak ada kuis/karya baru dikirim atau panggilan Gemini baru.

Perapian UI/UX sesuai wireframe yang disetujui sudah diterapkan. Pengguna tanpa sesi membuka perkenalan → pilih Siswa/Guru/Industri → login sesuai peran; peran respons server diperiksa sebelum token disimpan. Siswa memiliki empat tab mengambang Beranda/Magang/Karya/Profil, dengan Cari lowongan dan Lamaran saya di tab Magang. Riwayat belajar dibuka dari Beranda atau kebutuhan lowongan. Ikon SVG garis menggantikan emoji pada navigasi semua peran. Detail lowongan mengutamakan kelayakan melamar dan kekurangan syarat wajib, diikuti tindakan belajar, kemudian skor total. Halaman detail/form memakai tombol kembali di atas. Burgundy tetap #842D3E dengan permukaan netral hangat. Dependensi react-native-svg mengikuti Expo SDK 57. Seluruh 20 tes mobile serta bundling Android/Hermes lulus; alur perkenalan, login tiga peran, navbar, tab lamaran, jalur materi ke lowongan, dan detail kekurangan diperiksa pada emulator. Tampilan iOS belum diperiksa.

Tahap 1 selesai. Implementasi Tahap 2 tersedia: migrasi identitas guru pribadi, autentikasi nyata, profil, pendaftaran, dan verifikasi bertingkat melalui backend/mobile serta halaman admin. Database lokal sudah dimigrasi setelah backup berhasil dipulihkan dan diuji pada salinan; data lama dipertahankan. Admin lokal disiapkan sesuai pilihan pemilik; kredensial tidak disimpan di repository.

Tahap 3 tersedia: siswa mengajukan karya dengan foto/PDF atau tautan untuk satu keterampilan, guru sekolahnya memberi catatan dan penilaian, siswa dapat memperbaiki pengajuan, dan bukti/keputusan tersimpan per versi. Keterampilan tervalidasi hanya berasal dari penilaian karya terstruktur.

Tahap 4 tersedia: industri terverifikasi mengelola lowongan, siswa melihat kecocokan dari bukti karya dan melamar dengan persetujuan berbagi, industri mencatat seleksi, dan sekolah memantau status siswa sendiri. Database lokal sekarang v5 setelah backup dipulihkan serta migrasi diperiksa pada salinan. Syarat lamaran yang ditegaskan pengguna: skor minimal 80% **dan seluruh keterampilan wajib memenuhi nilai minimum**.

Pengujian backend/database dan mobile lulus, bundling Android/Hermes berhasil. **Pengguna meminta crosscheck langsung di HP dilakukan pada akhir pengembangan; jangan menjadikannya prasyarat untuk melanjutkan tahap berikutnya.** Revisi desain lengkap di Figma masih draft; warna primer kode burgundy `#842D3E` dengan permukaan putih/netral.

Untuk presentasi 5 November, data demo terpisah sudah disiapkan melalui API pada `finetern_demo_class`, backend port 5001, dengan akun siswa/guru/industri dan satu modul Gemini nyata tersimpan. Perintah `npm run demo:start` dari backend; akun/password hanya pada `backend/.local/finetern_demo_class/credentials.json`. Seluruh 51 tes backend lulus. Pemilik memilih emulator untuk proyektor dan mengizinkan persiapan serta restart. Aktivasi administrator 4 November berhasil: HypervisorPlatform dari Disabled menjadi Enabled, virtualisasi firmware aktif, konfigurasi boot default tidak diubah, RestartNeeded=true. **Restart dan verifikasi emulator selesai 4 November:** WHPX usable (kode 0), hypervisor berjalan, AVD berhasil boot, Expo Go SDK 57 terpasang, dan Finetern memakai API demo port 5001/Metro 8082. Login/logout siswa, guru, industri; lowongan/matching; modul; kuis beserta pembahasan; formulir mini proyek; antrean/form penilaian guru; dan detail bukti/form seleksi industri diperiksa langsung. Satu kuis tersimpan 100/100; matching tetap 91,42% dan nilai guru 55. Karya pending dan lamaran contoh dipertahankan. Catatan pemeriksaan lokal: `backend/.local/finetern_demo_class/native-demo-check.json`. Pemilih berkas, pengiriman keputusan final lewat UI, serta build APK belum dicrosscheck pada sesi ini. Status lokal ada di `backend/.local/finetern_demo_class/emulator-acceleration-status.json`. Jangan mengubah BIOS, menonaktifkan fitur keamanan, atau mengulang seed demo. Tunggu boot Android selesai sebelum menjalankan Expo. Tombol Tools Expo Go dapat menutupi tombol Keluar header; untuk presentasi gunakan Profil → Keluar dari akun.

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
