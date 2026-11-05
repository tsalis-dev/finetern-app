# Arah visual Finetern

Pembaruan 5 November 2026: pemilik menyetujui susunan yang lebih ringan karena pengulangan kartu besar membuat aplikasi monoton. Beranda, daftar Magang, Karya, Lamaran, dan Detail Materi sekarang mengutamakan baris, tipografi, jarak, serta pemisah tipis. Warna burgundy, logo Finetern, dan navbar mengambang dipertahankan.

## Referensi

- [Things](https://culturedcode.com/things/features/): pengelompokan baris dan hierarki tugas tanpa kartu besar berulang.
- [Linear Mobile](https://linear.app/mobile): daftar ringkas dengan status yang mudah dipindai.
- [Readwise Reader](https://readwise.io/read): isi belajar yang mengalir seperti artikel.

Referensi sebelumnya, [Task Management](https://www.figma.com/community/file/1143575071825582037/task-management-to-do-list-app) dan [Ajheryuk](https://www.figma.com/community/file/905336452129780441/ajheryuk-live-education-mobile-apps), menjadi dasar versi kartu pada 4 November. Arah terbaru menggantikan susunan kartu tersebut. Referensi dinilai dari pratinjau publik; gambar, font, dan komponen template pihak ketiga tidak disalin. Ikon memakai SVG Finetern yang sudah tersedia, tanpa dependensi baru.

## Aturan visual

| Elemen | Pemakaian |
| --- | --- |
| Burgundy `#842D3E` | Tombol, garis fokus belajar, pilihan aktif, dan penekanan |
| Putih tulang `#FAF8F5` | Latar aplikasi |
| Putih `#FFFFFF` | Kolom pencarian, kontrol kuis, dan navbar |
| Rose `#F8EDF0` | Permukaan pendamping untuk belajar dan navigasi |
| Krem `#F0E3CF` | Karya dan mini proyek |
| Teks `#30262A`, pendukung `#665C60`, keterangan `#786D71` | Hierarki informasi tanpa bergantung pada warna saja |

Judul halaman dan materi tegas, isi mudah dibaca, informasi pendukung lebih kecil. Daftar diletakkan langsung pada latar dengan pemisah tipis; seluruh baris dapat diketuk dan memiliki chevron menuju detail. Judul daftar dibatasi dua baris, judul lengkap tetap tersedia di detail. Permukaan berwarna dipakai selektif pada ikon dan mini proyek. Filter status menjadi satu baris yang dapat digeser mendatar, dengan garis bawah pada pilihan aktif. Ikon memakai garis konsisten; navigasi tetap empat tab mengambang. Tombol dan kolom pencarian memiliki sasaran sentuh minimal 44 dp.

## Penerapan

- **Beranda:** fokus langkah berikutnya berupa baris belajar beraksen garis burgundy; dua pintasan perjalanan tanpa kotak berwarna; bar nilai keterampilan langsung pada latar. Ringkasan karya dan materi berasal dari API. “Lihat semua” di Bekal keterampilan langsung membuka tab Keterampilan; pintasan karya membuka Karya saya. Pilihan tersimpan sebagai parameter navigasi seperti tab Magang.
- **Magang:** Cari lowongan/Lamaran saya tetap tersedia. Pencarian, paginasi, tarik untuk memuat ulang, dan pembatalan hasil permintaan lama dipertahankan. Baris lowongan memuat industri, posisi, lokasi/sistem kerja, uang saku, status, matching, dan tenggat. Status mengikuti `can_apply` server; skor 91,42% tetap bisa berstatus syarat belum terpenuhi. Cabang industri menampilkan kuota tanpa mengakses matching siswa.
- **Karya:** baris ikon/judul/keterampilan/status/nilai; catatan panjang tersedia di detail. Tab Keterampilan menampilkan nilai guru dan jumlah bukti yang disetujui, dengan penjelasan sumber nilai sekali di atas daftar. Antrean guru tetap menampilkan nama/kelas siswa dan filter status.
- **Lamaran:** status, posisi, industri, tanggal serta skor saat melamar ditampilkan dalam baris. Catatan seleksi dan riwayat dibuka di detail. Cabang guru/industri tetap memuat identitas pelamar hanya jika API mengizinkan.
- **Detail Materi:** header dan bagian isi mengalir tanpa latar kartu; teks isi 15/26; konteks lowongan dipisah garis tipis. Mini proyek tetap mendapat penekanan krem, sementara pilihan kuis memakai kontrol berbingkai dan state radio. Tujuan, isi, pembahasan, estimasi waktu serta jumlah bagian/soal tetap dari API. Tidak ada progres membaca yang dibuat-buat. Kuis tetap formatif; pengajuan bukti membuka formulir dengan judul proyek dan keterampilan yang sesuai.

Sumber data, aturan matching, persetujuan berbagi, validasi guru, dan endpoint Gemini mengikuti implementasi yang sudah ada. Dashboard guru/industri serta halaman detail/form lainnya belum dirombak menyeluruh; komponen daftar bersama mengikuti perubahan ini. Pembuka/login tetap memakai desain branding yang sudah disetujui.

## Pemeriksaan

Jalankan `npm test` dan bundling Android dari folder mobile. Pemeriksaan native memakai akun sintetis/database demo yang sudah ada; jangan menjalankan ulang seed, mengirim keputusan guru, atau membuat panggilan Gemini berbayar hanya untuk memeriksa visual. Screenshot pengembangan disimpan lokal dan tidak di-commit. iOS dan perangkat Android fisik masih perlu pemeriksaan tersendiri.

Hasil sesi 4 November: 21 tes mobile serta bundling Android/Hermes lulus (1.045 modul, bundle HBC 2,5 MB). Beranda, pencarian lowongan, tab lamaran, detail materi, pemilihan jawaban radio, dan perpindahan mini proyek ke formulir dengan judul/keterampilan yang sesuai diperiksa pada emulator Android. Jawaban kuis dan formulir karya tidak dikirim pada pemeriksaan ini. Tampilan menggunakan data demo yang sudah tersimpan; tidak ada permintaan Gemini baru.

Hasil sesi 5 November (susunan tanpa kartu besar): 24 tes mobile dan export Android/Hermes final lulus (1.047 modul, HBC 2,5 MB). Pemeriksaan emulator mencakup Beranda dan pintasan ke Karya/Keterampilan, judul daftar panjang, status syarat wajib pada skor 91,42%, akses catatan karya/seleksi di detail, filter lamaran termasuk status terakhir yang digeser mendatar, materi tersimpan, formulir mini proyek, dan state radio kuis. Antrean guru diperiksa untuk identitas siswa, filter disetujui, serta nilai guru. Daftar industri diperiksa untuk kuota lowongan dan identitas pelamar aktif; profil lamaran yang sudah ditarik tetap tidak tersedia. Tidak ada kuis, karya, keputusan guru/industri, atau permintaan Gemini baru dikirim. Screenshot serta catatan pemeriksaan disimpan pada folder demo lokal yang diabaikan Git. Build APK, iOS, perangkat fisik, dan pembaca layar belum diuji pada sesi ini.
