# Tahap 4: Lowongan, pencocokan keterampilan, dan lamaran

Status 4 November 2026: implementasi backend/mobile tersedia, schema lokal sudah v4 setelah backup dipulihkan dan migrasi diuji pada salinan. Pengujian otomatis serta bundling Android lulus. Crosscheck langsung di HP tetap ditunda sampai akhir pengembangan sesuai arahan pengguna.

## Keputusan produk

Pengguna menyetujui bahwa siswa harus memenuhi **dua syarat sekaligus**: skor kecocokan minimal 80% dan nilai minimum **setiap keterampilan wajib**. Skor total tinggi tidak menggantikan syarat wajib yang belum terpenuhi.

Sumber nilai adalah karya approved dengan penilaian guru terstruktur Tahap 3. Flag/nilai cache `student_skills`, karya legacy, dan hasil kuis tidak dipakai sebagai bukti untuk matching. Per keterampilan digunakan nilai tertinggi dari bukti karya yang memenuhi syarat.

Industri hanya dapat membaca rincian profil/bukti pelamar melalui lamaran yang mendapat persetujuan berbagi dari siswa. Tidak ada direktori siswa terbuka atau rekomendasi profil tanpa persetujuan. Pencocokan ini memakai rumus deterministik, bukan respons AI.

## Alur lowongan

1. Industri aktif approved menerbitkan posisi dengan judul, deskripsi/bimbingan, lokasi, sistem kerja, kuota, batas lamaran, dan 1–20 syarat keterampilan. Uang saku per bulan opsional; nilai 0 berbeda dari belum dicantumkan.
2. Syarat memiliki keterampilan dari kamus, jenis wajib/nilai tambah, nilai minimum 1–100, dan bobot 1–100. Keterampilan tidak boleh berulang dalam satu posisi.
3. Siswa aktif approved melihat katalog terbaru, mencari posisi/industri/lokasi, dan membuka rincian skor serta kekurangan per keterampilan.
4. Sebelum ada lamaran, industri boleh memperbarui isi dan syarat menggunakan nomor versi yang sesuai. Setelah ada lamaran, isi/syarat terkunci; industri hanya dapat membuka/menutup penerimaan. Kebutuhan berbeda memakai lowongan baru.
5. Batas lamaran berlaku sampai akhir tanggal yang dipilih dalam WIB. Penutupan, tenggat, atau kuota penuh menghentikan lamaran baru; industri tetap dapat memproses lamaran yang sudah masuk.

Lowongan perusahaan nonaktif, akun penerbit nonaktif, dan institusi yang belum approved tidak muncul di katalog. Data legacy versi 0 tidak diterbitkan otomatis. Lowongan legacy tanpa lamaran dapat dilengkapi; yang mempunyai lamaran lama tetap dipertahankan dan kebutuhan baru menggunakan lowongan baru.

## Rumus pencocokan

`match = sum(min(1, nilai_tervalidasi / nilai_minimum) * bobot) / sum(bobot) * 100`

Nilai tanpa bukti dianggap 0. Nilai melebihi kebutuhan tidak memberi kontribusi lebih dari 100% pada keterampilan itu. Bobot harus positif dan nilai minimum tidak boleh 0. Syarat kosong/tidak valid tidak menghasilkan kecocokan otomatis. Skor ditampilkan dua desimal secara konservatif; pembulatan tampilan tidak membuka akses bagi skor di bawah 80%.

Contoh: API wajib minimum 70 dengan bobot 60; desain nilai tambah minimum 80 dengan bobot 40. Siswa dengan nilai API 85 dan desain 40 mendapat skor 80% dan boleh melamar. Siswa dengan API 69 dan desain 100 mendapat skor lebih tinggi, tetapi tetap tidak boleh melamar karena syarat wajib API belum tercapai.

Server menghitung ulang saat pengajuan. Skor, ID siswa, daftar bukti, dan status yang dikirim klien tidak menentukan hasil. Form membawa versi lowongan; bila lowongan berubah, permintaan lama ditolak 409 agar siswa membaca syarat terbaru.

## Lamaran, seleksi, dan kuota

Siswa harus memilih persetujuan berbagi sebelum mengirim lamaran. Satu siswa hanya memiliki satu lamaran untuk lowongan yang sama, termasuk setelah ditarik atau ditolak. Pengajuan bersamaan tidak menggandakan record.

Status dimulai `pending`. Industri pemilik dapat menandai `reviewed`, menerima (`accepted`), atau menolak (`rejected`), dengan catatan wajib yang bisa dibaca siswa serta guru berwenang. Accepted/rejected tidak dapat diubah kembali oleh industri pada MVP. Penarikan siswa menjadi `withdrawn`; tidak bisa diajukan ulang pada lowongan yang sama.

Siswa dapat menarik lamaran pending, reviewed, atau accepted. Menarik lamaran accepted melepaskan kuota. Kuota membatasi jumlah accepted, bukan jumlah lamaran pending. Keputusan penerimaan pada lowongan yang sama diserialkan sehingga dua permintaan bersamaan tidak bisa mengisi satu tempat terakhir. Lamaran ke lowongan berbeda tetap diperbolehkan; belum ada alur konfirmasi penempatan tunggal oleh sekolah.

Keputusan dan penarikan memakai nomor versi lamaran. Respons lama tidak dapat menimpa keputusan terbaru. Riwayat menyimpan pelaku, waktu, status, dan catatan. Tidak ada pengiriman email/push notification pada tahap ini; hasil tersedia di status dan catatan aplikasi.

Guru aktif approved dapat memantau status/catatan lamaran siswa aktif approved pada sekolahnya sendiri. Akses ini tidak memberi kewenangan memilih pelamar untuk industri lain atau membuka bukti melalui jalur industri.

## Persetujuan dan batas akses bukti

Saat melamar, snapshot menyimpan identitas posisi/persyaratan, skor serta rincian matching, profil dasar (nama, email, sekolah, jurusan, kelas), versi persetujuan `recruitment-v1`, dan waktu persetujuan. Untuk setiap keterampilan pada syarat lowongan, dipilih paling banyak satu karya approved bernilai terbaik. Karya yang tidak terkait dan unggahan mendatang tidak ikut dibagikan.

Rincian profil, nilai per keterampilan, dan karya tersedia bagi industri tujuan selama lamaran pending/reviewed/accepted, persetujuan belum dicabut, dan siswa/sekolahnya aktif approved. Setelah rejected/withdrawn, endpoint industri menyembunyikan rincian tersebut dan menolak unduhan bukti. Riwayat status, catatan, dan skor total tetap tercatat sebagai rekam lamaran. Siswa tetap dapat membaca data lamarannya sendiri selama akunnya memenuhi syarat akses aplikasi.

Penonaktifan perusahaan/akun penerbit menutup akses rekrutmen meskipun JWT lama belum kedaluwarsa. Industri lain tidak bisa membuka lamaran, mengubah lowongan, memilih pelamar, atau mengambil bukti perusahaan lain. Guru sekolah lain tidak bisa membaca lamaran siswa tersebut.

Bukti tetap di penyimpanan privat. Industri menggunakan endpoint bukti yang terikat pada **ID lamaran dan ID bukti yang dibagikan**, bukan akses umum `/portfolios/:id`. Detail industri tidak memuat filesystem path atau riwayat unggahan pribadi siswa. Unduhan tetap memeriksa izin terkini dan kondisi karya approved/versi yang sama. Token tidak diletakkan pada URL. Cache native dibersihkan saat logout.

Salinan yang disimpan penerima melalui aplikasi pembaca berada di luar kendali Finetern; penghentian akses tidak menarik salinan tersebut. Snapshot, riwayat, dan file belum mempunyai retensi/penghapusan otomatis. Tetapkan kebijakan penyimpanan serta backup database dan folder privat sebelum penggunaan produksi.

## Kontrak API

Seluruh endpoint membutuhkan Bearer JWT dan akun aktif/approved sesuai perannya. JSON memakai `{success,message,data}`; bukti dikirim sebagai attachment.

| Endpoint | Akses dan hasil |
| --- | --- |
| `GET /api/vacancies/skills` | Kamus keterampilan untuk akun rekrutmen terverifikasi |
| `GET /api/vacancies?q=...&offset=0` | Siswa; katalog aktif terbaru, 20 per halaman, beserta matching |
| `GET /api/vacancies/mine?offset=0` | Industri; lowongan sendiri dan ringkasan |
| `POST /api/vacancies` | Industri; terbitkan posisi baru, hasil 201 |
| `GET /api/vacancies/:id` | Siswa/industri pemilik; rincian syarat dan kewenangan tindakan |
| `PATCH /api/vacancies/:id` | Industri pemilik; edit penuh sebelum ada lamaran |
| `PATCH /api/vacancies/:id/activity` | Industri pemilik; `{active:boolean,version}` |
| `POST /api/vacancies/:id/apply` | Siswa; `{version,shareConsent:true}`; server menghitung ulang, hasil 201 |
| `GET /api/applications/mine` | Lamaran siswa sendiri |
| `GET /api/applications/industry` | Pelamar pada lowongan industri sendiri |
| `GET /api/applications/school` | Lamaran siswa dalam sekolah guru yang berwenang |
| `GET /api/applications/:id` | Rincian, snapshot yang boleh dilihat, riwayat, dan bukti yang boleh diakses |
| `POST /api/applications/:id/review` | Industri pemilik; `{status,note,version}` |
| `POST /api/applications/:id/withdraw` | Siswa pemilik; `{version}` |
| `GET /api/applications/:id/evidence/:proofId` | Pemilik siswa/industri berizin; bukti terkait lamaran tersebut |

Daftar lamaran menerima `status`, `vacancyId`, dan `offset`, 20 per halaman. Ringkasan mencakup semua status dalam cakupan pengguna/lowongan yang dipilih. Daftar katalog diurutkan terbaru, bukan diklaim sebagai ranking global AI.

Body lowongan: `title` maks 150, `deskripsi` maks 5000, `location` maks 150, `workMode` onsite/hybrid/remote, `allowance` null atau integer 0–100.000.000 rupiah/bulan, `quota` integer 1–1000, `deadline` YYYY-MM-DD, dan `requirements:[{skillId,importance,weight,minProficiency}]`. Pengubahan wajib membawa `version`. Importance adalah wajib/nilai_tambah; nilai/bobot integer 1–100. Catatan seleksi wajib, maksimal 2000 karakter. Admin tidak mempunyai akses rekrutmen umum pada MVP.

## Migrasi, pengujian, dan kelanjutan

Schema baru v4 menambah metadata posisi, versi lowongan/lamaran, snapshot/persetujuan, status withdrawn, `application_events`, dan `application_portfolios`. `npm run db:migrate` kini memilih migrasi 001–003 yang belum applied, menguji backup pada salinan, kemudian menerapkan ke sumber. Server mensyaratkan ketiganya applied.

Record lama tetap utuh. Versi 0 menandai lowongan/lamaran sebelum alur baru; migrasi tidak membuat persetujuan berbagi otomatis. Lamaran legacy bersifat baca saja, tanpa akses profil/bukti atau keputusan baru. Seed pengembangan tidak menimpa posisi, syarat, karya, ataupun cache nilai yang sudah ada.

Backend: `npm test` atau `npm run test:recruitment`. Tes mencakup migrasi, isolasi industri/sekolah, input, mandatory gate, batas 80%, cache palsu, persetujuan eksplisit, pengajuan ganda, bukti terbatas, snapshot yang tidak berubah, keputusan bersamaan, kuota, penarikan, serta penonaktifan dengan JWT sama. Mobile: `npm test` untuk validasi formulir/versi/persetujuan dan unduhan bukti terikat lamaran. `npx expo export --platform android --output-dir dist` memeriksa bundling/Hermes.

Crosscheck HP dan pengujian siklus penuh dilakukan di akhir sesuai arahan pengguna. Tahap berikutnya adalah modul Gemini dan kuis berdasarkan kekurangan keterampilan. Hasil kuis tidak otomatis menjadi bukti proyek; gunakan kontrak matching serta izin data yang sudah ada.
