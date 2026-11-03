module.exports={
  title:'Memahami integrasi API',objectives:['Membaca respons API','Menangani kegagalan permintaan'],
  sections:[{title:'Struktur respons',body:'Pelajari status HTTP, struktur JSON, dan pemisahan data dari pesan galat.'},{title:'Penanganan galat',body:'Tampilkan informasi yang membantu pengguna saat jaringan terputus dan jangan mencetak kredensial.'}],
  miniProject:{title:'Integrasi katalog produk',instructions:'Buat tampilan katalog yang mengambil data dari API dan menangani keadaan memuat serta galat.',criteria:['Data ditampilkan dengan benar','Galat dapat ditangani']},
  quiz:[
    {question:'Apa yang menunjukkan permintaan HTTP berhasil?',options:['Status 200','Status 404','Status 500','Tidak ada respons'],correctIndex:0,explanation:'Status 200 menunjukkan permintaan berhasil.'},
    {question:'Apa yang dilakukan ketika koneksi terputus?',options:['Menyembunyikan layar','Menampilkan pesan dan pilihan mencoba lagi','Menghapus akun','Menganggap data tersimpan'],correctIndex:1,explanation:'Pengguna memerlukan pesan yang jelas dan cara mencoba kembali.'},
    {question:'Di mana kredensial layanan disimpan?',options:['Pada teks UI','Dalam tautan publik','Di backend yang terlindungi','Dalam nama gambar'],correctIndex:2,explanation:'Kredensial layanan tidak dibagikan melalui kode atau UI klien.'},
  ],
};
