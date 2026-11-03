# Tahap 3: Portofolio bukti karya dan validasi guru

Status 4 November 2026: implementasi backend/mobile tersedia, migrasi v3 sudah diterapkan pada database lokal setelah backup berhasil dipulihkan dan diuji pada salinan. Pengujian otomatis serta bundling Android lulus. Sesuai arahan pengguna, crosscheck langsung pada HP ditunda sampai akhir pengembangan.

## Alur MVP

1. Siswa dengan akun dan sekolah aktif approved membuka Portofolio, lalu mengajukan karya.
2. Satu pengajuan membuktikan satu keterampilan dari kamus `skills`. Siswa mengisi judul, penjelasan karya/peran pribadi, dan menyertakan foto/PDF atau tautan proyek HTTP/HTTPS.
3. Guru aktif approved di sekolah yang sama melihat tab “Bukti Karya”, membuka karya dan bukti, lalu memberikan catatan wajib.
4. Guru menyetujui dengan nilai keterampilan 1–100, meminta perbaikan, atau menolak. Nilai adalah penilaian manual terhadap bukti, bukan hasil kuis, jumlah unggahan, atau persentase yang dihitung otomatis.
5. Perbaikan siswa membuat versi berikutnya dan kembali pending. Guru harus memeriksa versi baru; keputusan dari rincian versi lama ditolak dengan 409.
6. Siswa melihat catatan, riwayat karya, dan keterampilan tervalidasi pada portofolio serta beranda.

Tautan proyek dibuka atas tindakan pengguna; backend tidak mengambil isi situs tersebut. Pengajuan boleh memakai tautan saja, berkas saja, atau keduanya. Foto dipilih dari galeri melalui Expo ImagePicker; pemilih dokumen mendukung PDF/JPG/PNG. Maksimal satu berkas 5 MB per versi. Untuk beberapa halaman, gunakan satu PDF; untuk beberapa keterampilan, ajukan klaim terpisah dengan penjelasan relevansinya.

## Aturan keputusan dan nilai

- `pending`: siswa boleh memperbaiki pengajuan; tiap perubahan menaikkan nomor versi.
- `revision`: guru meminta perbaikan dengan catatan; siswa memperbaiki dan mengajukan ulang.
- `approved`: karya terkunci dari pengubahan siswa. Nilai wajib bilangan bulat 1–100.
- `rejected`: pengajuan final, tidak dapat diedit/diajukan ulang. Siswa membaca alasan dan membuat karya baru jika memiliki bukti berikutnya.

Guru memeriksa bahwa bukti dapat dibuka, siswa menjelaskan bagian yang dikerjakan sendiri, dan karya menunjukkan keterampilan yang diklaim. Catatan sebaiknya menjelaskan bukti yang dinilai serta perbaikan yang diperlukan. Rubrik lintas sekolah belum distandardisasi; jangan menyebut skor ini sebagai sertifikasi atau hasil pengukuran otomatis yang objektif.

Nilai satu keterampilan adalah nilai tertinggi dari karya approved yang memiliki penilaian terstruktur Tahap 3. Beberapa karya tidak dijumlahkan; pengajuan baru/revisi/penolakan tidak menghapus nilai dari karya lain yang sudah disetujui. Endpoint `student-skills` mengembalikan nilai, jumlah bukti approved, dan waktu validasi terbaru.

`student_skills` diperbarui sebagai cache pada persetujuan karya. Untuk matching Tahap 4, **gunakan query berbasis karya approved pada `portfolioService.studentSkills`**, bukan membaca `student_skills.is_validated` sendirian. Data seed lama atau hasil kuis dapat memiliki flag/nilai lama yang tidak didukung penilaian proyek. Persetujuan akun tidak mengesahkan keterampilan.

## Akses dan bukti privat

Hanya siswa pemilik dan guru yang berwenang pada sekolah siswa dapat membaca karya/bukti. Akun siswa, guru, keanggotaan, dan sekolah harus aktif/approved. Status dibaca kembali oleh backend; JWT lama tidak melewati penonaktifan. Industri dan admin belum mempunyai akses portofolio pada MVP ini. Alur publikasi portofolio kepada industri ditetapkan pada tahap rekrutmen berikutnya.

Berkas baru tersimpan di `backend/private-portfolios/`, tidak melalui `/uploads`. Backend memeriksa signature PDF/JPG/PNG dan ukuran, lalu mengirim attachment dengan nosniff/no-store. Jalur filesystem tidak diberikan dalam respons. Snapshot serta versi bukti terdahulu dipertahankan; unduhan versi historis harus berasal dari karya yang sama dan tetap melewati pemeriksaan akses saat ini.

Mobile mengunduh dengan header Bearer ke cache aplikasi melalui Expo FileSystem, lalu membuka pemilih aplikasi pembaca melalui Expo Sharing. Token tidak ditempatkan pada URL. Cache dibersihkan saat logout; hasil unduhan dari sesi yang sudah berubah tidak dibuka. Jika pengguna menyimpan/membagikan salinan melalui aplikasi pembaca, salinan tersebut berada di luar pengelolaan cache Finetern. Perilaku pemilih foto/berkas/pembaca di perangkat tetap perlu diuji pada crosscheck akhir.

Riwayat backend dan bukti privat belum memiliki pembersihan otomatis/retensi. Sertakan folder privat dalam backup operasional bersama database; dump SQL saja tidak memuat berkas. Pengelolaan kapasitas dan kebijakan retensi diperlukan sebelum penggunaan produksi.

## Kontrak API

Semua endpoint di bawah membutuhkan `Authorization: Bearer <token>` dan akun terverifikasi sesuai kewenangan. Respons JSON mengikuti `{success,message,data}`, kecuali attachment bukti.

| Endpoint | Hasil |
| --- | --- |
| `GET /api/portfolios/skills` | Kamus keterampilan untuk siswa/guru |
| `GET /api/portfolios/mine?offset=0` | Karya siswa sendiri, ringkasan semua karya, dan keterampilan tervalidasi |
| `GET /api/portfolios/student-skills` | Keterampilan siswa sendiri yang didukung penilaian proyek |
| `GET /api/portfolios/queue?status=pending&offset=0` | Antrean karya siswa aktif approved di sekolah guru; 30 per halaman |
| `POST /api/portfolios` | Pengajuan karya baru; hasil 201, versi 1 pending |
| `GET /api/portfolios/:id` | Rincian, penilaian, status legacy, dan riwayat |
| `PATCH /api/portfolios/:id` | Perbaikan dengan versi yang cocok; kembali pending |
| `POST /api/portfolios/:id/review` | Keputusan guru; hasil dan event dalam satu transaksi |
| `GET /api/portfolios/:id/evidence` | Bukti terbaru; `?eventId=<id>` untuk bukti versi terdahulu |

Form pengajuan/perbaikan berupa multipart dengan `title` (maks 150), `deskripsi` (maks 5000), `skillId`, `projectUrl` opsional (maks 255), dan `file` opsional. Perbaikan wajib membawa `version` dari `revision_number`; berkas lama dipakai jika tidak diganti. Keputusan guru berupa JSON `{status,note,version,proficiency}`; `proficiency` wajib berupa number integer hanya pada approved, `note` maksimal 2000 karakter.

Data siswa/role/approved/nilai yang dikirim siswa tidak menentukan pemilik, status, atau penilaian. Pengajuan baru selalu pending. Endpoint pemeriksaan tidak dapat dipakai siswa untuk mengangkat nilainya sendiri. Keputusan simultan pada karya yang sama hanya menerima satu keputusan; kunci per siswa juga menjaga konsistensi nilai terbaik saat beberapa karya dinilai bersamaan.

## Migrasi dan data contoh

`database/schema.sql` sekarang v3 untuk instalasi kosong. Untuk v1/v2 yang sudah ada, gunakan `npm run db:migrate` dari backend. Runner memilih migrasi yang belum applied, menguji dump pada database salinan, memeriksa pelestarian data, kemudian menerapkan migrasi pada sumber. Hentikan penulisan backend selama proses. Server mensyaratkan marker 001 dan 002 applied.

Migrasi 002 menambah metadata versi/penilai/nilai/berkas pada `portfolios`, status rejected, serta `portfolio_events`. Record dan keputusan lama tetap utuh dan disalin ke riwayat `legacy_imported`. Versi 0 menandai data sebelum penilaian terstruktur; tidak dihitung sebagai keterampilan tervalidasi baru. Siswa dapat melengkapi lalu mengajukan ulang data legacy; barulah guru menilai melalui alur baru.

Seed khusus pengembangan tidak menimpa karya dan cache nilai yang sudah ada. Jangan memakai seed sebagai alat perawatan database pengguna nyata.

## Pengujian dan pekerjaan berikutnya

- Backend: `npm test` atau khusus fitur `npm run test:portfolio`.
- Mobile: `npm test` memeriksa sesi, validasi formulir, kontrak nilai guru, unduhan privat, perubahan sesi saat unduh, dan pembersihan cache dengan batas native/HTTP diganti simulasi.
- Bundling: `npx expo export --platform android --output-dir dist`.

Tes backend membuat database acak lokal dan folder sementara, lalu membersihkan hanya sumber yang dibuat run tersebut. Cakupan meliputi migrasi v2, legacy, signature berkas, otorisasi lintas sekolah, revisi/versi, persetujuan bersamaan, nilai maksimum, penolakan final, dan penonaktifan dengan JWT yang sama.

Crosscheck HP ditunda sesuai arahan pengguna; tes otomatis/bundling bukan pengganti uji perangkat. Belum ada penghapusan karya, pencabutan keputusan approved, kamera langsung, beberapa lampiran per versi, maupun publikasi bukti kepada industri. Tahap 4 melanjutkan katalog lowongan nyata, matching, dan lamaran memakai keterampilan yang didukung bukti.
