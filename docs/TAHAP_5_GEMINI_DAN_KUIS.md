# Tahap 5 — Materi Gemini dan kuis formatif

Status 4 November 2026: backend dan mobile tersedia; database lokal sudah v5 setelah backup dipulihkan dan migrasi diuji pada salinan. Pembuatan materi lengkap melalui Gemini berhasil diuji memakai key lokal, termasuk validasi dua bagian materi dan tiga soal. Seluruh 50 tes backend, 18 tes mobile, dan bundling Android/Hermes lulus. Key tidak dikirim ke chat/Git. Pengujian HP fisik dan siklus akhir tetap dijadwalkan pada Tahap 6.

## Alur belajar

1. Siswa aktif dan terverifikasi membuka lowongan aktif dari industri terverifikasi.
2. Pada keterampilan yang belum memenuhi nilai minimum, pilih **Pelajari keterampilan ini**. Kekurangan dihitung dari karya approved yang dinilai guru, bukan cache nilai lama.
3. Siswa memilih membuat materi. Server mengirim hanya nama/kategori keterampilan, nilai awal, dan nilai target ke Gemini. Nama siswa, email, berkas karya, deskripsi lowongan, serta jawaban kuis tidak dikirim.
4. Modul memuat tujuan belajar, 2–4 bagian materi, satu mini proyek dengan kriteria, dan tepat tiga soal dengan empat pilihan. Estimasi 15 menit adalah perkiraan belajar.
5. Server menilai jawaban dan menyimpan progres. Nilai dibulatkan menjadi 0, 33, 67, atau 100; ambang 80 berarti ketiga soal perlu benar. Setelah mengirim, siswa mendapat pembahasan dan boleh mengulang latihan.
6. Siswa mengerjakan proyek, lalu tombol pengajuan bukti membuka formulir karya dengan keterampilan dan judul terisi. Siswa tetap perlu menjelaskan karya dan melampirkan bukti sendiri. Guru memeriksa dan menentukan nilainya.

**Hasil kuis tidak menulis ke student_skills, tidak menyetujui karya, dan tidak menaikkan matching.** Matching tetap memakai nilai karya yang diverifikasi guru. Kuis adalah latihan formatif; pengulangan dan pembahasan bukan sertifikasi keterampilan.

AI Mentor menampilkan riwayat modul dan nilai latihan terbaik milik siswa, 20 modul per halaman. Materi ditampilkan sebagai teks; jawaban benar tidak dikirim sebelum ada pengiriman kuis. Materi AI perlu ditelaah dan dapat didiskusikan dengan guru.

## Konfigurasi lokal

Isi hanya pada `backend/.env` yang diabaikan Git:

```dotenv
GEMINI_API_KEY=isi_secara_lokal
GEMINI_MODEL=gemini-3.5-flash-lite
```

Model default adalah Gemini 3.5 Flash-Lite melalui SDK `@google/genai`. Model dapat diganti melalui variabel tersebut; model pengganti harus mendukung structured JSON output. Key hanya dibaca backend, tidak memakai awalan EXPO_PUBLIC dan tidak dikirim ke mobile. Restart backend setelah mengubah konfigurasi.

Dari backend, `npm run gemini:check` melakukan **satu pembuatan modul nyata** dengan topik generik tanpa identitas siswa. Perintah ini menggunakan kuota/biaya provider dan hanya mencetak status, nama model, jumlah bagian, dan jumlah soal; bukan key atau respons mentah. Pengujian rutin `npm test` memakai provider simulasi dan tidak menghubungi Google.

Referensi resmi: [model Gemini 3.5 Flash-Lite](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite), [masa dukungan model](https://aistudio.google.com/docs/deprecations), dan [structured output](https://ai.google.dev/gemini-api/docs/structured-output).

## Batas permintaan dan kegagalan

- Maksimal **5 pembuatan baru per siswa dalam 24 jam berjalan**, termasuk percobaan yang gagal. Membuka atau mengulang kuis modul tersimpan tidak memakai kuota Gemini.
- Modul dipakai kembali jika siswa, lowongan/versinya, keterampilan, nilai awal/target, model, serta versi prompt sama. Perubahan konteks membuat kebutuhan baru. Cache tidak dibagikan antar siswa.
- Hanya satu pembuatan berjalan per siswa. Permintaan ulang konteks yang sama mendapat ID modul yang sama; konteks lain ditolak sampai selesai.
- Permintaan yang tertinggal lebih dari dua menit ditampilkan gagal dan dapat dicoba sebagai permintaan baru. Modul gagal tidak ditampilkan sebagai materi jadi. Tidak ada retry provider otomatis.
- Timeout HTTP provider 45 detik, batas pembatalan 50 detik. Transaksi database tidak ditahan selama menunggu jaringan. Respons dibatasi/ditelaah melalui schema dan validasi panjang sebelum disimpan.
- Error key, kuota provider, timeout, serta JSON yang tidak valid ditampilkan dengan pesan aman. Detail mentah provider tidak dikirim ke pengguna.
- Pembatas HTTP per proses: 20 permintaan generasi dan 30 pengiriman kuis per 15 menit per akun. Kuota berbayar tetap dihitung dan diserialkan di database. Penyimpanan limiter bersama diperlukan sebelum backend dipasang pada beberapa proses.

## Kontrak API

Semua endpoint di bawah memerlukan Bearer JWT siswa yang akun, keanggotaan, dan sekolahnya aktif/approved. Identitas diperiksa ulang saat penyimpanan hasil. Format JSON `{success,message,data}`.

| Endpoint | Permintaan dan hasil |
| --- | --- |
| GET /api/ai/gaps/:vacancyId | Kebutuhan nyata, nilai awal/target, cache modul, sisa kuota, dan status konfigurasi tanpa key |
| POST /api/ai/generate-sprint | `{vacancyId,skillId,version}`; 201 modul baru, 200 cache siap, 202 cache sedang dibuat |
| GET /api/ai/modules?offset=0 | Riwayat milik sendiri, 20 per halaman, status dan progres |
| GET /api/ai/modules/:id | Materi, pilihan kuis tanpa kunci sebelum percobaan, progres dan pembahasan percobaan terakhir |
| POST /api/ai/modules/:id/assessments | `{answers:[0,1,2],attemptKey:"quiz-..."}`; indeks pilihan 0–3, server menghitung nilai |

Penanda percobaan panjang 12–64 karakter huruf/angka/underscore/tanda minus. Pengiriman ulang penanda dan jawaban yang sama mengembalikan percobaan yang sama. Penanda sama dengan jawaban berbeda ditolak 409. Nilai/passed yang dikirim klien tidak dipercaya. Siswa lain, guru, industri, dan admin tidak diberi akses umum ke modul pribadi.

Materi tersimpan masih dapat dibuka bila key tidak tersedia atau lowongan/institusi industri berhenti aktif; siswa dan sekolahnya sendiri tetap harus berwenang. Pembuatan baru selalu memeriksa kondisi lowongan dan kekurangan terbaru.

## Penyimpanan dan verifikasi

Migrasi 004 menaikkan schema menjadi v5 dengan metadata konteks, status generasi/cache pada learning_modules dan hubungan modul/jawaban/penanda percobaan pada assessment_records. Tidak menambah tabel aplikasi. Materi lama berstatus legacy dan tetap terbaca oleh pemiliknya; asesmen lama tidak dihubungkan ke modul secara fiktif.

Runner `npm run db:migrate` membuat backup, memulihkannya ke salinan, memeriksa pelestarian data serta seluruh migrasi yang belum applied, lalu menerapkan ke sumber. Hentikan penulisan aplikasi saat menjalankannya.

- Backend: `npm test` atau khusus `npm run test:learning`. Mencakup validasi provider, migrasi, pemilik, role, perubahan kewenangan, kuota termasuk kegagalan, permintaan bersamaan, cache, stale generation, kunci jawaban, penilaian server, idempotensi, dan nilai karya yang tidak berubah.
- Mobile: `npm test`, termasuk jawaban belum lengkap/berlubang dan permintaan tanpa nilai buatan klien.
- Android: `npx expo export --platform android --output-dir dist` memeriksa bundling/Hermes; hasil ini belum merupakan APK.

Tahap 6 mencakup crosscheck alur akun → bukti → nilai guru → matching → belajar → mini proyek → validasi ulang → lamaran, pemeriksaan pada HP, dan build APK. Retensi/penghapusan otomatis modul dan percobaan belum tersedia pada MVP.
