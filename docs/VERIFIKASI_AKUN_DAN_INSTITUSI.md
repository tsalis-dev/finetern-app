# Rancangan Verifikasi Akun dan Institusi

Status: alur produk disetujui pengguna; schema v2 dan migrasi v1 sudah disiapkan serta diuji di database terpisah. Migrasi belum diterapkan ke database aplikasi. API, pemeriksaan kewenangan, dan UI belum diimplementasikan. Sekolah dan industri diverifikasi admin platform, guru disetujui koordinator sekolah, dan siswa diverifikasi guru sekolahnya. Setiap guru memiliki akun pribadi yang terhubung ke sekolah. Rincian bukti pemeriksaan dan penanggung jawab operasional masih perlu ditetapkan.

## 1. Prinsip

Pendaftaran menghasilkan akun untuk masuk dan melihat proses pengajuan. Hak menjalankan pekerjaan sebagai siswa, guru, atau industri diberikan setelah persyaratan verifikasinya terpenuhi. Memilih peran atau memasukkan nama institusi tidak langsung memberikan kewenangan.

Sekolah adalah institusi, sedangkan guru adalah orang yang memiliki akun dan keanggotaan pada sekolah tersebut. Verifikasi sekolah tidak otomatis memverifikasi semua orang yang mengaku sebagai gurunya.

## 2. Pembagian pemeriksa yang disepakati

| Pengajuan | Pemeriksa | Hasil setelah disetujui |
| --- | --- | --- |
| Institusi sekolah dan perwakilan awal | Admin platform | Sekolah terverifikasi dan perwakilan yang sah ditetapkan sebagai koordinator sekolah |
| Guru bergabung ke sekolah terverifikasi | Koordinator sekolah tersebut | Guru dapat menjalankan kewenangan sekolah sesuai keanggotaan yang disetujui |
| Siswa mengaku berasal dari sekolah tertentu | Guru yang memiliki keanggotaan disetujui di sekolah tersebut | Keanggotaan siswa di sekolah terverifikasi |
| Industri dan perwakilannya | Admin platform | Akun industri dapat menerbitkan lowongan serta memproses lamaran |

Koordinator adalah kewenangan tambahan pada keanggotaan sekolah, bukan akun bersama. Guru lain tetap menggunakan akun pribadi. Orang yang pertama mendaftar tidak otomatis menjadi koordinator; penetapan awal dilakukan admin setelah pemeriksaan.

Admin platform diperlukan karena aplikasi tidak dapat mengambil keputusan manual sendiri. Untuk MVP, admin disiapkan oleh pengelola dan tidak memiliki jalur pendaftaran publik. Antrean institusi dapat dikelola melalui halaman internal sederhana; tidak perlu menambahkan tab admin pada aplikasi siswa.

## 3. Alur yang disepakati

Sekolah beserta koordinator awal harus terverifikasi sebelum menyetujui guru; guru harus disetujui sebelum memverifikasi siswa. Pendaftaran/verifikasi industri berjalan mandiri: proses sekolah tidak harus menunggu ada industri yang mendaftar, dan sebaliknya.

### Sekolah dan guru pertama

1. Perwakilan membuat akun pribadi dan mengajukan sekolah beserta identitas institusi dan bukti kewenangannya sebagai perwakilan.
2. Backend mencegah pengajuan institusi yang sama dibuat berulang; bentuk identitas unik sekolah ditetapkan sebelum migrasi.
3. Admin mencocokkan informasi sekolah dan mengonfirmasi perwakilannya. Nama atau domain email saja bukan dasar persetujuan otomatis.
4. Jika disetujui, sekolah berstatus terverifikasi dan akun perwakilan memperoleh keanggotaan koordinator yang disetujui.
5. Jika belum lengkap, admin meminta perbaikan dengan catatan yang bisa dibaca pengaju.

### Guru berikutnya

Guru mendaftar dengan akun pribadi dan memilih sekolah terverifikasi. Keanggotaannya menunggu persetujuan koordinator sekolah tersebut. Sebelum disetujui, guru tidak dapat melihat data siswa atau memvalidasi karya. Pada MVP, satu guru memiliki satu keanggotaan sekolah aktif; kebutuhan mengajar di beberapa sekolah dapat ditambah setelah alur inti terbukti.

### Siswa

Siswa membuat akun dan memilih sekolah terverifikasi, lalu mengisi data akademik. Guru sekolah tersebut memeriksa pengajuan berdasarkan daftar siswa atau data sekolah yang memang dimiliki. Memilih sekolah tidak langsung membuktikan bahwa pendaftar adalah siswanya.

Akun yang menunggu dapat masuk, melengkapi data pengajuan, dan melihat status serta catatan pemeriksaan. Pengajuan lamaran dan kewenangan berbasis sekolah menunggu persetujuan. Jika sekolah belum terdaftar/terverifikasi, tampilkan arahan menghubungi sekolah; jangan memberikan akses berdasarkan nama sekolah bebas.

### Industri

Perwakilan mendaftar dan mengajukan identitas perusahaan beserta bukti kewenangan. Admin memeriksa institusi dan perwakilannya sebelum akses rekrutmen dibuka. Untuk MVP, satu akun perwakilan per industri cukup; beberapa akun HR belum menjadi kebutuhan yang diminta.

## 4. Status dan pembatasan akses

Status pengajuan yang disarankan: `pending`, `approved`, `needs_revision`, dan `rejected`. Penghentian akses akun/institusi yang sebelumnya disetujui dicatat terpisah sebagai penonaktifan; jangan mencampurkannya dengan status pengajuan awal.

- Pengajuan belum disetujui tetap dapat diakses pemiliknya sendiri untuk melihat hasil pemeriksaan.
- `needs_revision` menyertakan catatan, mengizinkan perbaikan, lalu mengembalikan pengajuan ke `pending`.
- `rejected` menyertakan alasan. Hak pengajuan ulang setelah penolakan perlu ditetapkan sebelum endpoint dibuat.
- Pemeriksa tidak boleh menyetujui keanggotaan/pengajuannya sendiri.
- Guru atau koordinator hanya mengakses pengajuan siswa/guru dalam sekolah yang menjadi kewenangannya.
- Status aktif akun, status institusi, dan keanggotaan yang disetujui diperiksa backend pada aksi terlindungi. JWT lama bukan izin untuk mengabaikan penonaktifan yang baru terjadi.

Setiap keputusan menyimpan pengaju, pemeriksa, waktu, dan catatan. Riwayat keputusan dan pengajuan ulang tidak boleh hilang ketika status terbaru berubah. Bukti pengajuan institusi hanya tersedia bagi pengaju dan pemeriksa yang berwenang.

## 5. Tiga hal yang harus dibedakan

1. Konfirmasi email membuktikan akses ke alamat email, bukan keabsahan sekolah, perusahaan, atau jabatan penggunanya.
2. Persetujuan siswa/guru membuktikan keanggotaan pada sekolah dalam konteks platform, bukan penguasaan semua keterampilan.
3. Validasi bukti proyek oleh guru pada Tahap 3 membuktikan klaim keterampilan tertentu. Persetujuan akun dan hasil kuis tidak menggantikannya.

Dengan demikian, siswa yang sudah disetujui sekolah tetap harus mengajukan bukti karya untuk memperoleh keterampilan tervalidasi.

## 6. Dampak pada schema dan API

Schema v2 dan migrasi sudah tersedia pada `database/schema.sql` serta `database/migrations/001_identity_verification.sql`. [Panduan database](../database/README.md) menjelaskan struktur, pemetaan data lama, batas jaminan schema, dan cara pengujian. Database aplikasi yang belum dimigrasi tetap memakai v1.

- Pisahkan `schools` dari kepemilikan satu akun pada `schools.user_id` dan pindahkan hubungan akun lama menjadi keanggotaan yang sesuai.
- Tambahkan profil guru dan keanggotaan sekolah yang menghubungkan akun, sekolah, kewenangan guru/koordinator, serta status pengajuan. Tidak perlu menambahkan NIP jika alur pemeriksaan tidak membutuhkannya.
- Tambahkan verifikasi institusi sekolah/industri dan verifikasi keanggotaan siswa; gunakan data yang berbeda untuk setiap tujuan.
- Tambahkan akses admin platform yang tidak dapat dipilih melalui endpoint pendaftaran publik.
- Simpan rekam keputusan dan informasi penonaktifan dengan pemeriksa serta waktunya.
- Respons sesi/profil perlu memuat status verifikasi dan kewenangan sehingga mobile dapat menampilkan halaman menunggu atau fitur yang memang diizinkan. Backend tetap menjadi penentu akses.

Tabel baru adalah `teachers`, `school_memberships`, `verification_requests`, dan `verification_events`, ditambah metadata `schema_migrations`. `schools.submitted_by` menggantikan kepemilikan akun lama. NPSN dan nomor registrasi unik tetapi nullable untuk data lama. Format identifier pada pendaftaran baru, endpoint pemeriksaan, format bukti, dan batas ukuran berkas masih perlu ditetapkan saat implementasi API.

## 7. Pembagian kerja Tahap 2 yang diperbarui

| Bagian | Hasil |
| --- | --- |
| 2A: Identitas dan sesi | Migrasi akun guru/keanggotaan, login, profil, logout, dan pemeriksaan sesi |
| 2B: Pengajuan dan verifikasi | Pendaftaran sesuai peran, status pengajuan, persetujuan institusi oleh admin, guru oleh koordinator, dan siswa oleh sekolah |
| 2C: Integrasi dan pengujian | Layar daftar/status/profil, antrean pemeriksa, otorisasi, penolakan, perbaikan data, serta pengujian di mobile |

Halaman internal untuk admin adalah bagian dari alur verifikasi yang berfungsi, bukan sekadar kolom status yang hanya bisa diubah langsung lewat SQL. Teknologi dan tempat akses halaman tersebut masih perlu dipilih; targetnya satu antrean sederhana, bukan portal admin besar.

Kriteria penting: guru berbeda memiliki sesi sendiri; guru sekolah A tidak dapat menyetujui siswa sekolah B; guru pending tidak dapat memvalidasi; industri pending tidak dapat membuka rekrutmen; pengguna tidak dapat menjadikan diri admin/koordinator lewat request; penonaktifan berlaku walau JWT lama belum kedaluwarsa.

## 8. Keputusan yang disetujui dan rincian yang belum ditetapkan

**Disetujui pengguna:** akun guru bersifat pribadi dan terhubung ke sekolah; admin platform memverifikasi sekolah dan industri beserta perwakilannya; koordinator sekolah menyetujui guru; guru memverifikasi siswa sekolahnya.

**Alur pelaksanaan yang diterima:** pendaftaran dengan akses terbatas sebelum persetujuan dan verifikasi manual bertingkat untuk MVP. Koordinator pertama ditetapkan setelah pemeriksaan admin. Persetujuan akun tidak menggantikan validasi keterampilan berbasis proyek.

**Belum dipilih:** siapa admin operasional dalam tim, bukti institusi/perwakilan yang diperlukan, aturan pengajuan ulang setelah penolakan, serta teknologi halaman pemeriksaan internal. Jangan menganggap persetujuan alur sebagai bukti bahwa rincian tersebut sudah ditentukan atau fiturnya sudah dibuat.
