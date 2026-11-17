# Perombakan UI/UX bertahap Finetern

Diperbarui 18 November 2026. Fokus awal: alur siswa. Ini pekerjaan UI/UX pada fitur Tahap 2–5; **bukan izin memulai Tahap 6**. Pengujian siklus penuh dan build APK tetap menunggu perintah eksplisit pemilik.

## Dasar riset dan cara mengadaptasi

Pemilik menyerahkan pemilihan referensi kepada pengembang. Tidak perlu menunggu satu template yang dipilih pemilik. Referensi dipakai untuk memahami hierarki informasi dan tindakan, kemudian disesuaikan dengan tugas siswa SMK di Finetern.

- [Mobbin — katalog mobile](https://mobbin.com/explore/mobile): dipakai sebagai tempat mengamati pola layar. Pratinjau publik tersedia; tidak menganggap seluruh alur aplikasi sudah diteliti hanya dari satu pratinjau.
- [Mobbin — Nextdoor iOS Profile Setup](https://mobbin.com/explore/screens/a1a199f9-9429-41f0-bc64-ff228b62f44e): pratinjau yang dibaca dan dilihat menampilkan tindakan profil sebagai baris berlabel jelas, misalnya unggah foto dan perbarui informasi kontak. Adaptasi untuk Finetern: pengelolaan profil harus berupa tindakan yang mudah ditemukan dan benar-benar berfungsi. Tidak menyalin tampilan, hadiah, atau proses bisnis Nextdoor.
- [NN/g — 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/): status sistem perlu terlihat, tindakan mudah dikenali, pengguna mempunyai jalan keluar, kesalahan penting dicegah, dan informasi yang bersaing dikurangi. Adaptasi: status lamaran tampil sebelum rincian penilaian, penarikan tidak tersembunyi setelah bukti karya, dan konfirmasi menjelaskan akibatnya.
- [Indeed — Managing Applied Jobs](https://www.indeed.com/help/job-seekers/articles/4412589551757-my-jobs-managing-applied-jobs?co=US&hl=en): status dan pengelolaan lamaran ditempatkan dalam area lamaran; detail dan penarikan mempunyai jalur yang jelas. Adaptasi: Lamaran saya menjadi tempat memantau sekaligus mengelola lamaran. Aturan bisnis Indeed tidak diterapkan ke Finetern.

Kesimpulan desain di bawah adalah keputusan adaptasi Finetern berdasarkan referensi dan pemeriksaan kode, bukan klaim bahwa referensi tersebut mempunyai alur identik.

## Pedoman peletakan elemen

1. Awal halaman menjawab: ini halaman apa, status saya bagaimana, dan apa yang bisa saya lakukan sekarang. Judul, konteks, status, lalu tindakan ditempatkan dalam urutan itu.
2. Satu tugas utama per halaman. Informasi pendukung dikelompokkan menurut pertanyaan pengguna, bukan menurut urutan kolom database.
3. Baris berpemisah tipis untuk kumpulan item setara. Permukaan berwarna hanya untuk informasi yang perlu penekanan, misalnya catatan seleksi. Jangan membungkus setiap paragraf dengan kartu besar.
4. Rincian panjang bisa dibuka dari judul dan ringkasan yang bermakna. Tindakan utama dan status tidak disembunyikan dalam lipatan. Akses bukti untuk industri tetap mudah dibuka sebelum keputusan seleksi.
5. Label berupa kata kerja dan objek: Tarik lamaran, Ajukan karya, Buka bukti berkas. Hindari ikon tanpa label untuk tindakan penting.
6. Sertakan keadaan memuat, kosong, gagal, berhasil, akses tidak tersedia, dan perubahan data oleh pihak lain. Jangan menampilkan nol sebagai fakta ketika data belum dimuat.
7. Burgundy `#842D3E`, latar ivory `#FAF8F5`, logo F, ikon SVG, serta navbar mengambang tetap menjadi identitas Finetern. Warna bukan satu-satunya penanda status. Target sentuh minimal 44, dukung teks yang membesar dan pembaca layar.
8. Tombol hanya ditampilkan bila mempunyai alur nyata. Jangan menambahkan edit, unggah foto, atau notifikasi dekoratif tanpa API, penyimpanan, izin, dan umpan balik yang sesuai.

## Peta tugas dan tujuan halaman siswa

Tabel ini memetakan kode yang telah diperiksa. Kolom tindak lanjut adalah pekerjaan terbuka; tidak berarti seluruh halaman telah dirombak atau seluruh perilaku telah diuji ulang di perangkat.

| Halaman | Tujuan dan informasi yang didahulukan | Tindakan dan perpindahan | Keadaan penting / tindak lanjut |
| --- | --- | --- | --- |
| Perkenalan | Memahami manfaat Finetern secara singkat | Masuk → pilih peran; Buat akun → pendaftaran | Pertahankan jalur terpisah, animasi mengikuti Reduce motion. Tidak dirombak pada putaran lamaran. |
| Pilih peran / login | Mengetahui sedang masuk sebagai Siswa, Guru, atau Industri | Pilih/ganti peran, login, daftar | Salah peran, sandi salah, jaringan gagal. Role server tetap diperiksa; tidak cukup mengganti label layar. |
| Pendaftaran / status verifikasi | Memahami siapa yang memverifikasi akun dan apa yang masih perlu diperbaiki | Kirim pendaftaran, baca catatan, revisi bila diizinkan | Pending/needs_revision/rejected berbeda. Form revisi akun bukan pengganti edit profil sehari-hari. |
| Beranda siswa | Menentukan langkah berikutnya tanpa membaca semua fitur sekaligus | Lanjut belajar atau cari magang; pintasan karya, lamaran, keterampilan, dan materi | Saat ini beberapa kelompok tindakan masih bersaing. Perlu menetapkan satu prioritas sesuai kondisi nyata siswa; jangan mengarang angka kelengkapan profil. |
| Magang — Cari lowongan | Menemukan posisi dan mengetahui kelayakannya | Cari/filter, buka detail | Kosong, gagal, sudah dilamar, syarat belum terpenuhi. Skor tinggi tidak selalu berarti bisa melamar. |
| Detail lowongan | Memahami pekerjaan, syarat, dan tindakan berikutnya | Belajar untuk kekurangan skill atau kirim lamaran dengan persetujuan; bila sudah melamar → detail lamaran | Wajib ≥80% dan seluruh syarat wajib terpenuhi, tenggat/kuota/aktivitas valid. Persetujuan berbagi tidak boleh otomatis tercentang. |
| Magang — Lamaran saya | Menemukan lamaran dan mengenali statusnya | Filter status, buka rincian untuk membaca catatan atau menarik lamaran | Putaran pertama menambah petunjuk pengelolaan. Pagination, refresh, filter, dan mode guru/industri tetap ada. |
| Detail lamaran | Menjawab “statusnya apa dan apa yang bisa saya lakukan?” | Tarik lamaran aktif dengan konfirmasi; buka kecocokan, profil/bukti, dan riwayat sesuai kebutuhan | **Putaran pertama diterapkan.** Status → penarikan → catatan → rincian. Status final/legacy menjelaskan batas tindakan. Tidak menghapus bukti, profil, snapshot, atau riwayat dari alur. |
| Karya — proyek / keterampilan | Memisahkan pengajuan bukti dari hasil penilaian keterampilan | Ajukan karya, filter status, buka detail; lihat nilai tervalidasi | Perlu memastikan siswa memahami bahwa nilai berasal dari guru, bukan jumlah unggahan atau hasil kuis. |
| Form / detail karya | Mengirim bukti untuk satu keterampilan dan memahami umpan balik guru | Foto/PDF/tautan, klaim nilai, simpan pengajuan, revisi pending/revision atau data lama; lihat riwayat/bukti | Ditolak final diarahkan membuat karya baru. Hapus karya belum tersedia; perlu keputusan aturan penyimpanan bukti/riwayat sebelum menawarkan tindakan hapus. Tidak disisipkan diam-diam pada putaran lamaran. |
| AI Mentor / target belajar | Memilih atau melanjutkan materi untuk kekurangan keterampilan pada lowongan | Pilih target, minta materi, buka riwayat | Generating/ready/failed, batas permintaan, dan kegagalan koneksi harus jelas; jangan memicu Gemini baru saat hanya melihat riwayat. |
| Detail materi / kuis / mini proyek | Belajar, mencoba latihan, lalu menghasilkan bukti karya | Baca materi, jawab tiga soal, lihat pembahasan, ajukan mini proyek → form karya | Progres latihan bukan nilai guru. Pengajuan proyek tetap harus dinilai; kuis tidak mengubah matching. Perlu pemeriksaan hierarki belajar tersendiri. |
| Profil | Melihat dan mengelola identitas pribadi | Saat ini: muat ulang, lihat verifikasi, keluar | **Edit profil umum dan unggah/ganti foto belum tersedia**, termasuk API penyimpanan. Ini prioritas putaran berikutnya. Aturan perubahan identitas/sekolah perlu menjaga verifikasi; jangan memberi edit bebas untuk seluruh kolom. |

## Putaran pertama — Lamaran saya dan detail lamaran

Masalah yang ditemukan pada kode: penarikan sebenarnya telah tersedia di backend dan mobile, tetapi tombol berada setelah seluruh kecocokan, profil, dan bukti karya. Pada lamaran yang sudah ditarik, tindakan memang tidak tersedia lagi. Kedua keadaan ini sebelumnya kurang membantu pengguna memahami apa yang terjadi.

Perubahan:

- Daftar memberi petunjuk “Lihat detail atau tarik lamaran” hanya bila server mengirim `can_withdraw`. Lamaran lainnya mengarahkan ke rincian dan riwayat.
- Detail mendahulukan identitas lowongan, status dengan penjelasan singkat, tanggal, dan tombol Tarik lamaran. Catatan seleksi berada sebelum rincian pendukung. Teks catatan yang panjang tidak menempatkan tombol penarikan di bawahnya.
- Kecocokan, profil/bukti, serta riwayat menjadi bagian yang bisa dibuka. Ringkasan tetap terbaca saat tertutup. Keterampilan, bukti berkas/tautan, dan riwayat tidak dihapus. Profil yang ditampilkan adalah snapshot lamaran.
- Riwayat menampilkan aktivitas terbaru terlebih dahulu. Tidak mengubah urutan atau isi event di database.
- Pada status Ditarik, pesan penarikan tidak diulang sebagai kartu besar. Catatan lengkap tetap tersedia dalam riwayat; ringkasan penghentian berbagi ada di atas dan penjelasan privasi lengkap ada di bagian profil/bukti.
- Untuk industri/guru, kecocokan dan profil/bukti terbuka dari awal; tindakan seleksi industri dan batas akses tetap mengikuti API. Sekolah tidak mendapat akses berkas privat melalui perubahan tampilan.
- Konfirmasi penarikan menjelaskan penghentian berbagi, pelepasan kuota bila sudah diterima, dan tidak bisa melamar ulang. Batal tidak mengirim permintaan.
- Permintaan ganda dicegah selama operasi berlangsung. Respons dari kunjungan lama tidak menimpa kunjungan yang lebih baru.
- Setelah server menyimpan keputusan/penarikan, kontrol lama disingkirkan sebelum pemuatan ulang. Jika jaringan gagal saat pemuatan ulang, tampilkan status yang sudah dikonfirmasi beserta pesan kegagalan membaca rincian; tombol retry hanya membaca ulang.

Aturan yang dipertahankan: `can_withdraw`, `can_review`, dan `can_view_evidence` berasal dari server; versi ikut dikirim untuk mencegah perubahan berdasarkan data kedaluwarsa. Penarikan lamaran accepted tetap didukung. Satu siswa belum bisa melamar ulang pada lowongan yang sama setelah penarikan; ini perilaku produk/backend yang sudah ada, bukan pembatasan baru dari desain. Evaluasi kebijakan melamar ulang memerlukan pekerjaan terpisah.

## Urutan berikutnya

1. **Profil siswa:** pisahkan identitas terverifikasi dan informasi pribadi yang boleh diperbarui; rancang dan implementasikan edit profil serta foto dengan penyimpanan/izin nyata, keadaan simpan/gagal/berhasil, dan pantulan data terbaru pada sesi. Tentukan dampak perubahan identitas terhadap verifikasi dan snapshot lamaran.
2. **Beranda dan jalur utama siswa:** kurangi persaingan tindakan, tentukan pintasan yang konsisten untuk belajar/karya/lamaran, dan periksa apakah letak Lamaran saya di dalam Magang cukup mudah ditemukan. Jangan mengubah semua tab sekaligus sebelum alurnya jelas.
3. **Lowongan, karya, dan belajar:** selesaikan satu rangkaian tugas pada setiap putaran, termasuk kembali, revisi, unggah, dan kegagalan. Pertahankan semua fungsi yang sudah berjalan.
4. **Guru dan industri:** inventarisasi tujuan halaman dan tindakan mereka secara terpisah; jangan menganggap audit siswa telah mencakup seluruh peran. Perubahan komponen bersama perlu pemeriksaan dampak ke kedua peran.

Setiap putaran: baca alur/kode → tulis tujuan dan kondisi halaman → implementasikan lingkup kecil → pemeriksaan sesuai perubahan → commit dan push `develop`. Pengujian siklus penuh serta APK tetap ditunda.

## Validasi putaran pertama

- 38 tes mobile lulus, termasuk sepuluh regresi baru untuk versi penarikan, klik ganda, kegagalan pemuatan ulang setelah sukses, retry, kegagalan awal, respons kedaluwarsa lintas kunjungan, posisi tombol, konfirmasi/Batal, izin server, serta buka/tutup rincian dan kelengkapan catatan penarikan.
- Sembilan tes backend lamaran lulus pada database uji terpisah, mencakup kuota, penarikan, penghentian akses bukti, persetujuan, dan batas peran. Data demo tidak direset.
- Export Android/Hermes berhasil, 1050 modul. Ini pemeriksaan bundling UI; tidak menghasilkan APK dan tidak memulai Tahap 6.
- Emulator Android: pintasan Beranda → Lamaran saya, label pengelolaan, detail status Ditarik, buka/tutup kecocokan dan profil/bukti, riwayat terbaru/awal, serta pemuatan ulang diperiksa. Kedua lamaran demo sudah berstatus Ditarik saat pemeriksaan; tidak membuat atau menarik lamaran demo baru. Tampilan tindakan aktif dan konfirmasi/Batal diperiksa dengan tes komponen, dan akibat penarikan diperiksa oleh tes backend terisolasi, bukan pengiriman penarikan dari emulator.
- Pemeriksaan ini belum mencakup pengujian langsung iOS, alur penuh semua peran, atau fitur profil baru. Daftar guru/industri dan keputusan tetap tersedia pada kode; tombol seleksi serta pembatasan peran diperiksa pada tes komponen/backend. Edit profil/foto tetap pekerjaan berikutnya.
