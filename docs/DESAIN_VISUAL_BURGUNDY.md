# Arah visual Finetern

Disetujui pemilik pada 4 November 2026: komposisi beranda dari referensi Task Management, penyajian materi dari Ajheryuk, dengan warna utama burgundy. Implementasi pertama diterapkan langsung pada Beranda siswa, daftar Magang, dan Detail Materi agar pratinjau berasal dari aplikasi yang berjalan.

## Referensi

- [Task management & to-do list app — Neser U.](https://www.figma.com/community/file/1143575071825582037/task-management-to-do-list-app): satu kartu utama, ringkasan singkat, dan jarak antarbagian.
- [Ajheryuk — Zainul Anshor](https://www.figma.com/community/file/905336452129780441/ajheryuk-live-education-mobile-apps): permukaan terang, susunan informasi belajar, dan aksen warna terarah.

Referensi dinilai dari pratinjau publik. Tidak ada gambar, font, atau komponen template pihak ketiga yang disalin. Ilustrasi buku dan jendela kode dibuat sebagai komponen SVG milik Finetern, memakai react-native-svg yang sudah terpasang; tidak memerlukan jaringan atau dependensi baru.

## Aturan visual

| Elemen | Pemakaian |
| --- | --- |
| Burgundy `#842D3E` | Kartu belajar utama, tombol, pilihan aktif, dan penekanan |
| Putih tulang `#FAF8F5` | Latar aplikasi |
| Putih `#FFFFFF` | Kartu informasi dan tombol di atas burgundy |
| Rose `#F8EDF0` | Permukaan pendamping untuk belajar dan navigasi |
| Krem `#F0E3CF` | Karya dan mini proyek |
| Teks `#30262A`, pendukung `#665C60`, keterangan `#786D71` | Hierarki informasi tanpa bergantung pada warna saja |

Judul halaman dan materi tegas, isi mudah dibaca, informasi pendukung lebih kecil. Kartu utama memiliki penekanan lebih besar dari kartu pendamping. Ikon memakai garis konsisten; navigasi tetap empat tab mengambang. Tombol dan kolom pencarian memiliki sasaran sentuh minimal 44 dp.

## Penerapan

- **Beranda:** identitas Finetern dan akses profil; sapaan; kartu burgundy untuk melanjutkan materi terakhir yang siap atau mencari lowongan; karya disetujui/pending dari API; akses lamaran; bar nilai keterampilan guru; riwayat materi. Angka yang belum dimuat tidak ditampilkan sebagai capaian palsu.
- **Magang:** pilihan Cari lowongan/Lamaran saya; satu bar pencarian dengan tombol serta aksi cari keyboard; kartu berisi industri, lokasi, posisi, sistem kerja, uang saku, status kelayakan, matching, dan tenggat. Status mengikuti `can_apply` server; skor 91,42% tetap bisa berstatus syarat belum terpenuhi. Cabang pengelolaan lowongan industri tetap tersedia.
- **Detail Materi:** identitas materi, estimasi waktu, jumlah bagian/soal dari API, konteks lowongan, tujuan belajar, bagian materi bernomor, mini proyek, pilihan kuis, dan pembahasan. Tidak ada progres membaca yang dibuat-buat. Kuis tetap formatif; pengajuan bukti membuka formulir dengan judul proyek dan keterampilan yang sesuai.

Sumber data, aturan matching, persetujuan berbagi, validasi guru, dan endpoint Gemini mengikuti implementasi yang sudah ada. Desain lengkap halaman guru/industri serta layar siswa lainnya belum termasuk perombakan tiga halaman ini; komponen bersama mengikuti perubahan yang relevan.

## Pemeriksaan

Jalankan `npm test` dan bundling Android dari folder mobile. Pemeriksaan native memakai akun sintetis/database demo yang sudah ada; jangan menjalankan ulang seed, mengirim keputusan guru, atau membuat panggilan Gemini berbayar hanya untuk memeriksa visual. Screenshot pengembangan disimpan lokal dan tidak di-commit. iOS dan perangkat Android fisik masih perlu pemeriksaan tersendiri.

Hasil sesi 4 November: 21 tes mobile serta bundling Android/Hermes lulus (1.045 modul, bundle HBC 2,5 MB). Beranda, pencarian lowongan, tab lamaran, detail materi, pemilihan jawaban radio, dan perpindahan mini proyek ke formulir dengan judul/keterampilan yang sesuai diperiksa pada emulator Android. Jawaban kuis dan formulir karya tidak dikirim pada pemeriksaan ini. Tampilan menggunakan data demo yang sudah tersimpan; tidak ada permintaan Gemini baru.
