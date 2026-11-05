# Konsep logo Finetern

Dibuat 5 November 2026 menggunakan tool imagegen bawaan. Pemilik meminta logo dengan karakter tersendiri, melampaui tulisan nama aplikasi. Papan konsep: [finetern-logo-concept-v1.png](finetern-logo-concept-v1.png).

Simbol F dibentuk dari gestur lipatan halaman dan gerak maju: pendidikan, karya, serta langkah menuju kesempatan magang. Papan memperlihatkan logo lengkap, simbol mandiri, aplikasi pada bidang persegi membulat, dan versi terang di atas burgundy. Arah warna mengikuti burgundy `#842D3E` serta putih tulang `#FAF8F5` milik Finetern.

Pemilik menyetujui konsep dan meminta penerapan ke aplikasi pada 5 November 2026. Simbol digambar ulang sebagai dua bidang vektor dengan warna solid agar tajam dan konsisten pada ukuran kecil; wordmark di aplikasi memakai teks native yang disesuaikan proporsinya.

## Aset aplikasi

- Sumber geometri: `mobile/assets/brand/mark.json`. Komponen `BrandLogo` membaca sumber ini untuk logo lengkap atau simbol saja, dalam burgundy maupun putih.
- Master SVG: `mobile/assets/brand/mark.svg`, diekspor dari geometri yang sama. File konsep PNG dipertahankan sebagai referensi persetujuan.
- Ikon umum 1024×1024 dan favicon 64×64: `mobile/assets/icon.png` dan `mobile/assets/favicon.png`.
- Layer Android 1024×1024: foreground/monochrome transparan, latar burgundy penuh. Simbol foreground berada dalam lingkaran aman di tengah canvas sehingga tidak terpotong pada mask launcher bulat. PNG dirender dari sumber vektor; favicon diperkecil dengan alat gambar bawaan Expo tanpa menambah dependensi aplikasi.

Logo digunakan pada pembuka, pemilihan peran, login, Beranda siswa, header form utama, dan layar pemulihan sesi awal/loading. Login menggunakan panel burgundy dengan watermark logo, penanda peran serta aksi Ganti, formulir email/kata sandi berikon, tombol tampilkan/sembunyikan sandi, dan tautan daftar. Pemeriksaan peran server sebelum penyimpanan token tetap berlaku.

Perubahan ikon launcher native baru diterapkan ketika membuat build Android/iOS berikutnya. Expo Go dipakai untuk memeriksa antarmuka dan logo dalam proyek, bukan untuk mengganti ikon launcher milik Expo Go. Native splash screen belum diberi konfigurasi plugin baru.

Referensi login: [Simple Login — Saad Shaikh](https://www.figma.com/community/file/1300432160609727073/simple-login-mobile-auth-ui-kit) dan [Login & Register — Ali Husni Majid](https://www.figma.com/community/file/1370757927948360864/20-screen-login-register-mobile-app). Yang diadaptasi adalah arah komposisinya; komponen dan ilustrasi template tidak disalin.

## Pemeriksaan implementasi

Seluruh 24 tes mobile dan bundling Android/Hermes lulus (1.048 modul, HBC 2,5 MB). Tes aset memeriksa PNG opaque 1024px, favicon 64px, transparansi foreground, area aman lingkaran, layer monochrome, dan kesesuaian warna latar dengan konfigurasi Expo. Pemeriksaan emulator mencakup pembuka/pilih peran/login, default sandi tersamarkan, toggle yang mempertahankan teks, validasi kosong, tautan daftar yang memilih peran siswa, login/logout guru dan industri, serta login siswa sampai Beranda berlogo baru. Pemeriksaan memakai akun demo sintetis; tidak membuat akun atau mengirim karya/kuis/permintaan Gemini baru. Screenshot tersimpan lokal dan diabaikan Git. iOS, tampilan launcher pada APK, dan perangkat fisik belum diperiksa.

## Prompt generasi

Use case: logo-brand. Create one polished professional brand identity presentation for Finetern, a mobile platform connecting vocational students' verified project portfolios, adaptive learning, and internship opportunities. This is a NEW original logo design. Art direction: elegant modern academic identity, warm approachable confidence, editorial restraint, premium useful mobile product, highly distinctive compact graphic symbol rather than typography alone. Design ONE coherent symbol: a bold folded-page/ribbon monogram F with an open-page gesture and a subtle ascending forward cut in its negative space. Strong simple silhouette, optically balanced geometry, softly eased corners, substantial shapes readable at 24px; maximum two or three solid interlocking shapes. The identity must feel like learning becoming forward opportunity. Do not literally stack a book, hat, briefcase and arrow; solve it as one elegant integrated abstract F mark. No graduation caps, shields, stock education icons, stars, sparkles, AI robot motifs, fine decorative lines, gradients, shadows, 3D, photography, or mockup objects. Main palette exact deep burgundy #842D3E, deeper #63202D if needed, ivory #FAF8F5, subtle warm beige #F0E3CF. Make the design in flat vector-like solid colors with crisp edges. On a spacious warm ivory rectangular landscape board, show the primary logo large and centered across the upper half: substantial burgundy standalone symbol on the left, lowercase exact word 'finetern' to its right in a custom carefully kerned humanist geometric sans serif, medium-bold, friendly distinctive letter details, burgundy. Below a fine restrained divider, show three smaller identical iterations of that SAME symbol, well separated and aligned: standalone burgundy symbol on ivory, ivory symbol on a burgundy rounded-square app icon tile, and a small ivory symbol with wordmark on a burgundy rectangular reverse field. The exact same mark geometry across all uses. Lots of clear space. Only visible text is 'finetern' in the lockups, no titles, no subtitles, no labels, no explanatory copy or decorative UI. Produce an identity with designer-level optical precision and a memorable ownable symbol.
