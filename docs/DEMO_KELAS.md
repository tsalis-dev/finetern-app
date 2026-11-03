# Demo Finetern — 5 November 2026

Pemilik memilih **emulator Android Studio** untuk ditampilkan lewat proyektor laptop. Gunakan Expo Go yang sesuai **SDK 57**, MySQL Laragon, dan backend lokal. Tidak perlu membuat APK untuk demonstrasi melalui Expo Go. Android Studio menyediakan perangkat virtual; Expo menjalankan aplikasi dan backend menyediakan data. Panduan resmi: [menjalankan pada emulator Android](https://docs.expo.dev/workflow/android-studio-emulator/) dan [Expo Go sesuai SDK](https://expo.dev/go?platform=android&device=false&sdkVersion=57).

**Persiapan emulator:** AVD tersedia, tetapi percobaan awal berhenti sebelum boot karena belum ada hypervisor yang dapat dipakai. Pemeriksaan menunjukkan AMD Ryzen 5 6600H mendukung virtualisasi dan virtualisasi firmware sudah aktif. Pengguna mengizinkan persiapan emulator dan bersedia restart. Jalur yang dipilih adalah Windows Hypervisor Platform sesuai [panduan resmi Android](https://developer.android.com/studio/run/emulator-acceleration#vm-windows), dengan konfirmasi administrator Windows dan tanpa restart otomatis. Hasil aktivasi lokal dicatat pada backend/.local/finetern_demo_class/emulator-acceleration-status.json. Jangan menyatakan emulator siap sebelum akselerasi dan boot berhasil diperiksa kembali setelah restart.

## Data demonstrasi yang sudah disiapkan

Database `finetern_demo_class` terpisah dari `finetern_db`; backend demo memakai port **5001**, backend utama tetap 5000. Semua nama, institusi, bukti, penilaian, dan lowongan demo adalah simulasi kelas. Alur aplikasi tetap nyata: pendaftaran, persetujuan berjenjang, penilaian guru, matching, kuis, persetujuan berbagi karya, dan seleksi disimpan oleh backend/database.

Data demo dibuat melalui API aplikasi. Hanya akun admin awal dan kamus keterampilan yang disiapkan langsung pada database demo. Ilustrasi bukti institusi menggunakan ikon aplikasi, bukan dokumen sah. Tautan example.com adalah placeholder, bukan repository proyek nyata. Jangan menyajikan identitas, dokumen, atau nilai demo sebagai data terverifikasi dunia nyata.

Akun dan password ada pada file lokal **backend/.local/finetern_demo_class/credentials.json**. Password tidak masuk Git atau panduan ini. Akun demo:

| Peran | Email |
| --- | --- |
| Siswa aktif | siswa@demo.finetern.test |
| Guru | guru@demo.finetern.test |
| Koordinator | koordinator@demo.finetern.test |
| Industri | industri@demo.finetern.test |
| Siswa pending | pending@demo.finetern.test |
| Admin demo | admin@demo.finetern.test |

Admin demo masuk lewat [halaman admin demo](http://localhost:5001/admin/). Jangan memakai admin database utama untuk demo. Berkas unggahan dan rahasia demo berada di bawah backend/.local/finetern_demo_class dan diabaikan Git.

## Menjalankan ulang sebelum presentasi

1. Nyalakan MySQL di Laragon.
2. Dari root proyek, buka terminal backend:

```powershell
cd backend
npm run demo:start
```

### Alternatif HP Android

Hubungkan laptop dan HP ke Wi-Fi/hotspot yang sama. Pasang Expo Go Android untuk SDK 57 sebelum presentasi. Temukan IPv4 adaptor Wi-Fi laptop dengan `ipconfig`, lalu dari terminal kedua di root proyek:

```powershell
cd mobile
# Ganti placeholder dengan IPv4 laptop pada jaringan yang sama.
$env:EXPO_PUBLIC_API_URL = 'http://<IPv4-laptop>:5001/api'
npx expo start --go --port 8082
```

Pindai QR lewat Expo Go. Jika HP tidak dapat mengakses backend, coba buka `http://<IPv4-laptop>:5001/api/health` di browser HP; pastikan kedua perangkat saling terjangkau. Alamat 10.0.2.2 hanya untuk emulator. Tunnel Expo tidak otomatis menyediakan tunnel untuk backend MySQL/API.

### Emulator setelah akselerasi siap

Buka Android Studio → Device Manager → jalankan **Medium_Phone_API_37.0**. Laptop ini mempunyai SDK di folder di bawah; sesuaikan bila dipindah ke laptop lain. Dari terminal kedua di root proyek:

```powershell
cd mobile
$env:ANDROID_HOME = Join-Path $env:USERPROFILE 'AppData/Local/Android/Sdk'
$env:EXPO_PUBLIC_API_URL = 'http://10.0.2.2:5001/api'
npx expo start --go --android --port 8082
```

Untuk proyektor, pilih Duplicate bila layar laptop dan proyektor ingin menampilkan tampilan yang sama, atau Extend lalu pindahkan jendela emulator ke layar proyektor. Tidak perlu menghubungkan HP atau melakukan mirroring.

Biarkan kedua terminal dan MySQL berjalan. Jika port dipakai layanan demo yang sudah aktif, gunakan layanan yang berjalan atau hentikan terminal demo sebelumnya dengan Ctrl+C. Jangan mengganti port backend tanpa menyamakan alamat API mobile.

Jika Expo Go terbaru meminta SDK lain, gunakan versi Android untuk SDK 57 dari tautan resmi di atas. Jangan upgrade SDK proyek menjelang presentasi. Jika emulator menampilkan sesi akun lama, keluar lalu masuk dengan akun demo.

Database demo **sudah disiapkan**. Untuk instalasi baru saja, dari backend jalankan `npm run demo:prepare`. Opsi `-- --with-ai` menambah satu pembuatan modul Gemini nyata dan memakai kuota provider. Persiapan menolak database/folder demo yang sudah ada, tidak melakukan reset atau menimpa data. Kegagalan persiapan meninggalkan data untuk pemeriksaan; jangan menghapus database utama.

Backend dan MySQL tetap diperlukan saat membuka materi tersimpan. Internet Google hanya diperlukan untuk membuat materi baru; membaca modul/kuis yang sudah tersimpan tidak memanggil Gemini lagi. Unduh Expo Go dan siapkan emulator sebelum masuk kelas.

## Urutan demo 7–10 menit

1. **Masuk sebagai siswa.** Tunjukkan profil Alya (Demo), portofolio dan nilai guru: UI 85, API 55, Git 75.
2. **Buka lowongan Mobile Developer Intern.** Skor awal 91,42%, tetapi belum bisa melamar karena API wajib minimal 70. Jelaskan skor total 80% saja belum cukup.
3. **Pilih Pelajari keterampilan ini pada API.** Buka modul yang sudah tersimpan. Materi ini benar-benar dibuat Gemini saat persiapan; akun dan lowongannya fiktif. Tunjukkan tujuan, materi, mini proyek, tiga soal, hasil dan pembahasan kuis. Nilai kuis tidak menaikkan nilai guru.
4. **Tunjukkan pengajuan mini proyek.** Tombol membuka formulir karya dengan judul/keterampilan terisi. Bila waktu terbatas, gunakan karya pending **Perbaikan Integrasi API (Demo — nilai guru saat presentasi)** yang sudah disiapkan.
5. **Keluar dan masuk sebagai guru.** Di Bukti Karya, periksa karya pending tersebut. Beri catatan dan setujui dengan nilai **85**. Ini adalah penilaian simulasi kelas.
6. **Kembali sebagai siswa.** Buka ulang lowongan utama. Nilai API kini 85 dan kecocokan 100%. Setujui pembagian bukti yang relevan, lalu lamar.
7. **Masuk sebagai industri.** Buka pelamar, profil dan karya yang dibagikan, lalu catat seleksi. Tersedia pula lamaran contoh pada **Frontend Intern (Demo — contoh seleksi)** yang sudah berstatus ditinjau.
8. Jika masih ada waktu, sebagai guru buka Verifikasi Akun dan setujui **Raka (Demo Pending)** untuk menunjukkan verifikasi siswa.

Alternatif demo singkat: lowongan **UI Mobile Intern (Demo — siap melamar)** sudah cocok 100% sejak awal dan belum dilamar. Cocok untuk menunjukkan persetujuan berbagi dan lamaran tanpa menunggu langkah belajar/penilaian.

Tindakan demo tersimpan. Setelah karya disetujui atau lamaran dikirim, data tidak kembali ke awal saat aplikasi ditutup. Urutkan presentasi sesuai kondisi latihan terakhir; jangan menjanjikan tombol “lamar” pada lowongan yang sudah dilamar.

## Batas kesiapan

Persiapan demo dan alur backend diperiksa otomatis; 51 tes backend lulus. Login siswa/guru/industri, modul tiga soal, dan cache pada layanan demo aktif juga lulus pemeriksaan HTTP. Materi Gemini nyata berhasil disimpan. Bundling Android dan 18 tes mobile lulus pada Tahap 5. Percobaan emulator tertahan driver akselerasi; interaksi native belum diverifikasi dan belum ada APK. Latih minimal masuk siswa → lowongan → modul/kuis → guru → lamaran sebelum presentasi.
