# Verifikasi akun dan institusi

Status 3 November 2026: alur yang disetujui pengguna sudah diterapkan pada schema v2, API, mobile, dan halaman admin. Pengujian otomatis lulus; pemeriksaan pada HP fisik masih terbuka. [Panduan menjalankan aplikasi dan kontrak API](TAHAP_2_AUTENTIKASI_DAN_PROFIL.md).

## Prinsip dan pemeriksa

Pendaftaran memberi akses melihat/memperbaiki pengajuan sendiri. Hak berdasarkan peran dibuka setelah syarat persetujuan dan status aktif terpenuhi. Sekolah adalah institusi; guru adalah orang dengan akun pribadi dan keanggotaan sekolah.

| Pengajuan | Pemeriksa | Hasil persetujuan |
| --- | --- | --- |
| Institusi sekolah dan perwakilan awal | Admin Finetern | Sekolah approved dan perwakilan sah menjadi koordinator; dua pengajuan disetujui dalam satu transaksi |
| Guru berikutnya | Koordinator sekolah tersebut | Keanggotaan guru approved |
| Siswa | Guru approved di sekolah siswa | Keanggotaan siswa approved |
| Industri dan perwakilan | Admin Finetern | Institusi dan akun perwakilan memenuhi syarat akses industri |

Pendaftar pertama tidak otomatis menjadi koordinator. Admin tidak mempunyai jalur pendaftaran publik. Sekolah dan industri dapat mendaftar secara mandiri; siswa/guru berikutnya memilih sekolah yang sudah aktif dan approved. Jika sekolah belum ditemukan, hubungi perwakilan sekolah agar mendaftar terlebih dahulu.

Untuk MVP, guru mempunyai satu sekolah, industri mempunyai satu perwakilan. Perpindahan sekolah, penggantian koordinator, dan beberapa akun HR memerlukan alur tersendiri; jangan memodifikasi relasi approved secara langsung.

## Pemeriksaan manual MVP

Aplikasi menyimpan pengajuan dan keputusan; manusia berwenang yang menilai kebenarannya. Email atau domain dan nomor registrasi yang unik tidak menghasilkan persetujuan otomatis.

- Sekolah: pengaju mengisi NPSN 8 angka, nama/alamat sekolah, nama dan telepon perwakilan. Admin mencocokkan identitas dengan sumber sekolah resmi serta mengonfirmasi bahwa orang tersebut berwenang menjadi koordinator.
- Industri: pengaju mengisi nomor registrasi usaha (misalnya NIB), nama, sektor, kota, nama/telepon perwakilan. Admin mencocokkan informasi institusi dan kewenangan perwakilan.
- Bukti institusi: satu PDF/JPG/PNG maksimal 5 MB. Bila perlu beberapa halaman, satukan dalam PDF. Isinya mendukung identitas institusi dan penunjukan perwakilan, misalnya surat keterangan/penugasan yang dapat dikonfirmasi. Admin dapat meminta perbaikan jika bukti belum cukup.
- Konfirmasi perwakilan melalui kontak institusi yang diperoleh secara independen; nomor yang baru dikirim pendaftar sendiri tidak cukup sebagai satu-satunya pembuktian.
- Koordinator mencocokkan pengaju guru dengan data staf. Guru mencocokkan nama siswa, kelas, jurusan, dan NISN bila diberikan dengan data sekolah. NISN opsional; jangan meminta dokumen pribadi tambahan tanpa kebutuhan pemeriksaan.
- Catat sumber pemeriksaan dan hasil konfirmasi pada catatan keputusan. Jika meragukan atau belum lengkap, minta perbaikan; jika tidak sah, tolak beserta alasan.

Ini adalah prosedur MVP, bukan integrasi otomatis dengan registri resmi atau verifikasi email. Pengelola platform bertanggung jawab menjalankan pemeriksaan manual. Password admin tidak dibagikan ke pemohon atau dicatat dalam riwayat.

## Status dan akses

- `pending`: menunggu pemeriksaan; pemilik boleh melengkapi data/bukti.
- `needs_revision`: catatan perbaikan wajib; pengajuan ulang kembali pending dan menambah snapshot riwayat.
- `approved`: data pengajuan tidak dapat diedit lewat jalur perbaikan. Akses tetap bergantung pada status aktif akun, institusi, dan keanggotaan.
- `rejected`: penolakan final pada MVP. Pengaju dapat membaca alasan, tetapi perlu menghubungi pengelola; tidak dapat membuka ulang lewat endpoint resubmit.
- Penonaktifan/pemulihan institusi dicatat sebagai event terpisah beserta alasan. Penonaktifan akun menyimpan pemeriksa, waktu, dan alasan pada data akun.

Pemeriksa tidak dapat menyetujui dirinya sendiri. Guru/koordinator tidak dapat memeriksa sekolah lain. Admin hanya memeriksa institusi; persetujuan founder sebagai koordinator adalah bagian dari pemeriksaan sekolah pertama. Guru biasa tidak dapat memeriksa pengajuan guru lain.

Role/claim/token yang dikirim klien tidak menentukan kewenangan. Backend membaca ulang identitas database pada permintaan terlindungi. Sekolah nonaktif menutup kewenangan guru dan akses fitur siswanya, walaupun JWT lama belum kedaluwarsa.

## Bukti dan riwayat

Bukti disimpan di `backend/private-verifications/`, di luar static `/uploads`. Hanya pemilik pengajuan atau pemeriksa berwenang yang dapat mengunduhnya. Header attachment dan nosniff disertakan; format diperiksa dari signature berkas, bukan hanya ekstensi.

Riwayat pengajuan, revisi, keputusan, dan versi bukti tidak ditimpa. Bukti lama tetap privat untuk penelusuran keputusan; halaman admin menyediakan unduhan per versi. Snapshot tidak memuat password. Belum ada fitur penghapusan otomatis/retensi; tetapkan kebijakan penyimpanan dan backup privat sebelum pemakaian produksi.

Admin bekerja melalui `/admin/`; guru/koordinator melalui tab “Verifikasi Akun” di mobile. Pemilik melihat status, catatan, dan formulir perbaikan. Endpoint lengkap berada pada [panduan Tahap 2](TAHAP_2_AUTENTIKASI_DAN_PROFIL.md).

## Akun berbeda dari keterampilan

Konfirmasi email hanya membuktikan akses email. Persetujuan akun membuktikan hubungan pengguna dengan institusi dalam konteks platform. Validasi proyek oleh guru pada Tahap 3 membuktikan klaim keterampilan tertentu. Siswa approved tetap perlu mengajukan bukti karya; hasil kuis dan persetujuan akun tidak otomatis memvalidasi portofolionya.

## Data lama dan pengujian

Migrasi menjaga record lama, membuat profil/keanggotaan guru, dan mengawali pengajuan dengan pending. Nama guru dan identifier institusi yang tidak ada dibiarkan NULL; pengaju melengkapinya melalui status/perbaikan, lalu menjalani pemeriksaan. Persetujuan institusi mensyaratkan identitas, kontak perwakilan, dan bukti yang lengkap. Tidak ada persetujuan otomatis dari seed.

`backend/test/authFlow.test.js` mencakup pendaftaran atomik, larangan mengangkat diri sebagai koordinator, batas sekolah, akun pending, revisi/penolakan final, keputusan bersamaan, bukti privat/versi, claim role palsu, dan penghentian akses dengan JWT yang sama. `mobile/test/authStore.test.cjs` memeriksa pemulihan, kegagalan jaringan, respons setelah logout, dan kegagalan penyimpanan. Pengujian ini tidak menggantikan uji alur pada perangkat Android.
