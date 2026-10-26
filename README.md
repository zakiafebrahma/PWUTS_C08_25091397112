# WashMate Laundry — UTS Pemrograman Web (Ganjil 2026/2027)

Website layanan laundry dengan tema pink pastel. Dibuat dengan **HTML, CSS, dan JavaScript/jQuery** (tanpa framework).

- Nama: _Zakia Febri Rahmawati Basuki_  ·  NIM: _25091397112_  ·  Kelompok: _C08_  ·  Kelas: D4 MI 2025 / _C_
- Topik proposal kelompok: Website laundry (WashMate)

## Struktur folder
```
index.html        -> homepage (layout utama)
layanan.html      -> halaman interaktif: filter kategori + simulasi harga   (butir 2.b)
pemesanan.html    -> form transaksi dengan validasi jQuery                  (butir 2.c)
tentang.html      -> tentang WashMate
css/washmate.css  -> gaya, responsif (breakpoint 780px dan 520px)
js/washmate.js    -> seluruh logika jQuery
js/jquery.min.js  -> jQuery 3.6.1 (lokal)
images/           -> logo, ilustrasi hero, ikon layanan (SVG)
api/pesanan.php   -> endpoint server (HTTP POST) + api/config.php
database.sql      -> skema tabel `pesanan`
```

## Penjelasan fitur per butir tugas
**2.a Homepage responsif + navigasi AJAX.** `index.html` memakai layout grid/flex dan media query; menu berubah jadi hamburger di layar kecil. Klik menu tidak me-reload halaman: `$.ajax` mengambil file HTML tujuan, lalu hanya isi `<main>` yang diganti. Judul, menu aktif, dan history (tombol back/forward) ikut diperbarui. Jika AJAX gagal, otomatis kembali ke navigasi biasa. Gambar dipakai untuk layout (logo, ilustrasi hero) dan konten (ikon tiap layanan).

**2.b Halaman interaktif (`layanan.html`).**
- Filter kategori (Reguler/Ekspres/Perawatan/Khusus) dengan animasi `fadeIn/fadeOut`.
- Simulasi harga: pilih layanan, geser berat 1–30 kg, tambah opsi antar-jemput/parfum. Total (dengan animasi angka), rincian, dan perkiraan tanggal selesai berubah langsung. Tombol "Pesan dengan pilihan ini" mengisi otomatis formulir pemesanan.

**2.c Form transaksi + validasi (`pemesanan.html`).** Field mengikuti tabel `pesanan` di `database.sql` (nama, telepon, alamat, layanan, berat, jadwal, catatan; kode, total biaya, dan status dibuat server). Validasi jQuery berjalan saat keluar dari kolom dan saat submit: wajib isi, panjang, format nama, nomor HP Indonesia, rentang berat (kelipatan 0,5), tanggal tidak boleh lampau. **Jika ada yang salah, tidak ada request ke server.** Jika valid, data dikirim lewat `$.ajax` POST ke `api/pesanan.php`, yang memvalidasi ulang dan menyimpan ke MySQL dengan prepared statement.

**2.d** 

## Cara menjalankan
**Hanya tampilan (tanpa server PHP):** buka folder dengan VS Code + ekstensi Live Server, atau jalankan `python -m http.server` lalu buka `http://localhost:8000`. (Navigasi AJAX butuh server lokal; jika `index.html` dibuka langsung via `file://`, menu tetap jalan sebagai link biasa.) Tanpa PHP, pengiriman form berjalan dalam **mode simulasi** dan diberi label jelas; data hanya disimpan di browser.

**Dengan database:**
1. Nyalakan Apache + MySQL (XAMPP/Laragon), taruh folder ini di `htdocs`.
2. Impor `database.sql` lewat phpMyAdmin.
3. Sesuaikan `api/config.php` bila user/password MySQL berbeda.
4. Buka `http://localhost/<nama-folder>/index.html`.

## Catatan
Harga bersifat simulasi
