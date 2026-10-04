# Panduan admin dan peluncuran

## Penggunaan harian

1. Masuk melalui `/admin`. Admin mengundang akun melalui koleksi Pengguna; atur satu dari empat peran. Jangan memakai akun bersama.
2. Isi lokasi, dokter, dan layanan. Terbitkan profil dokter/lokasi, lalu buat jadwal yang menghubungkan dokter–layanan–lokasi beserta hari, jam, dan biaya konsultasi.
3. Penulis membuat draf artikel atau layanan. Isi judul, ringkasan, bagian konten, FAQ, serta title/deskripsi SEO. Penulis hanya dapat mengubah dokumen yang dibuatnya.
4. Peninjau Medis memilih dokter peninjau dan menyetujui isi. Admin/Editor SEO menerbitkan atau menjadwalkan publikasi. Perubahan judul/ringkasan/isi/FAQ membatalkan persetujuan lama dan mengembalikan dokumen menjadi draf.
5. Periksa Booking masuk. Ubah status menjadi sudah dihubungi, dikonfirmasi, selesai, atau dibatalkan. CSV dari dashboard dapat dibuka di Excel. File berisi data pribadi: simpan di penyimpanan internal yang terbatas aksesnya.
6. Periksa dashboard SEO, redirect, dan daftar 404. Perubahan slug otomatis membuat redirect permanen. Gambar wajib mempunyai teks alternatif. Halaman publik menggunakan satu H1 dan subjudul konten H2.
7. Pengaturan Klinik mengelola identitas, kontak, link bio, kode verifikasi Search Console, dan versi kebijakan privasi.

## Hak akses

| Tindakan                          | Admin | Editor SEO | Penulis       | Peninjau Medis |
| --------------------------------- | ----- | ---------- | ------------- | -------------- |
| Mengelola pengguna dan pengaturan | Ya    | Tidak      | Tidak         | Tidak          |
| Membaca/mengubah booking          | Ya    | Ya         | Tidak         | Tidak          |
| Menulis konten                    | Ya    | Ya         | Milik sendiri | Ya             |
| Menyetujui tinjauan medis         | Ya    | Tidak      | Tidak         | Ya             |
| Menerbitkan/menjadwalkan          | Ya    | Ya         | Tidak         | Tidak          |
| Mengelola jadwal dan redirect     | Ya    | Ya         | Tidak         | Tidak          |

Booking merupakan **permintaan konsultasi**, bukan inventori slot real-time. Konfirmasi tetap dilakukan admin. Pembayaran online dan pengingat WhatsApp otomatis tidak termasuk Paket Profesional.

## Konfigurasi eksternal

- `WHATSAPP_NUMBER`: nomor resmi format `628…`. Tanpa nomor, booking tetap disimpan tetapi tidak menawarkan tautan WhatsApp.
- `SMTP_*` dan `ADMIN_EMAIL`: pengiriman email menggunakan SMTP. Email pemberitahuan hanya berisi referensi, tanggal, dan tautan admin; detail pasien tetap di admin.
- Jalankan `GET /api/cron` setiap menit dengan header `Authorization: Bearer <CRON_SECRET>`. Endpoint memproses jadwal terbit dan antrean notifikasi. Kegagalan email/Meta tercatat dan dicoba kembali pada siklus berikutnya. Pantau status `failed`; email dapat terkirim ulang bila proses berhenti setelah pengiriman tetapi sebelum menyimpan status.
- `NEXT_PUBLIC_GA_ID`: measurement ID GA4. `NEXT_PUBLIC_META_PIXEL_ID`, `META_ACCESS_TOKEN`, dan `META_API_VERSION`: Pixel + Conversions API. Skrip analitik hanya dimuat setelah pengunjung mengizinkan. Event booking menggunakan ID yang sama di browser/server untuk deduplikasi; tidak mengirim nama/nomor pasien melalui event.
- Masukkan token verifikasi Search Console di Pengaturan Klinik, verifikasi domain di akun klinik, lalu kirim `/sitemap.xml`.
- Domain, sertifikat SSL, akun email/analitik, dan akses Meta harus disediakan pemilik klinik. Data rahasia hanya melalui environment server; jangan commit `.env`.

## Backup dan pemulihan

Jalankan `npm run backup` setiap hari melalui scheduler server, menggunakan akun database yang mempunyai hak backup. Backup mencakup seluruh database (termasuk booking) dan folder media lokal. Atur `BACKUP_DIR` ke direktori dengan akses terbatas dan salin secara terenkripsi ke penyimpanan terpisah. Jika memakai Docker, jalankan backup dari container/host yang dapat membaca **volume media aplikasi**; folder media kosong di host bukan backup volume.

Uji pemulihan pada database kosong yang terpisah:

```sh
pg_restore --no-owner --dbname="$RESTORE_DATABASE_URL" /path/backup/database.dump
# Ekstrak media ke direktori pemulihan terpisah dahulu, lalu verifikasi isinya.
tar -tzf /path/backup/media.tar.gz
```

Jangan menjalankan restore ke database produksi yang masih aktif. Frekuensi, retensi, enkripsi, lokasi penyimpanan, dan uji restore berkala harus ditetapkan oleh operator sebelum go-live.

## Impor konten lama

`npm run import:content -- berkas.json` memvalidasi hingga 150 halaman tanpa menulis. Tambahkan `--apply` untuk menyimpan draf dan redirect. Format setiap elemen: `collection` (`pages/articles/news/services`), `title`, `slug`, `summary`, `sections` (`heading`, `text`), `seo` (`title`, `description`), dan `oldPaths` (array path lama). URL yang sudah ada dilewati agar tidak menimpa konten. Konten medis tetap memerlukan tinjauan sebelum terbit. Foto dan kredensial dokter perlu diimpor/verifikasi terpisah.

## Agenda pelatihan (dua sesi)

1. Pengelolaan klinik, media, jadwal/biaya, tindak lanjut booking, ekspor, dan pengelolaan pengguna.
2. Penulisan dan tinjauan medis, penjadwalan, SEO, preview, redirect/404, backup, serta simulasi kesalahan dan pemulihan.

Sesi pelatihan, penetapan kontak dukungan, dan masa garansi 60 hari baru dapat disepakati bersama pihak klinik. Dokumen ini bukan bukti bahwa pelatihan atau serah terima sudah dilakukan.

## Gerbang go-live

- Ganti seluruh identitas, dokter, lokasi, jadwal, biaya, dan konten contoh dengan data yang disetujui klinik.
- Tinjau konten medis dan kebijakan privasi; isi PIC/kontak, masa simpan, serta prosedur permintaan data.
- Ganti kredensial admin demo, rahasia Payload/cron, dan aktifkan backup serta pemantauan uptime.
- Selesaikan migrasi konten lama dan audit redirect setelah sumber konten tersedia.
- Uji email admin dan WhatsApp dengan akun klinik, GA4 realtime, verifikasi Search Console, Meta Test Events, dan publikasi terjadwal.
- Jalankan tes penerimaan desktop/mobile, audit Lighthouse mobile minimal 90 pada build produksi, dan periksa data terstruktur.
- Atur domain dan HTTPS; set `NEXT_PUBLIC_SITE_URL` ke origin final dan `NEXT_PUBLIC_DEMO_MODE=false`, lalu build ulang.
- Dapatkan persetujuan desain dan uji coba sesuai proposal; lakukan dua sesi pelatihan.

## Contoh layanan produksi Linux

Folder `deploy/` berisi unit systemd untuk aplikasi, pemrosesan antrean setiap menit, dan backup setiap hari pukul 02.00 **zona waktu server**, serta Caddyfile untuk HTTPS otomatis. Sesuaikan `/opt/klinik`, pengguna layanan `klinik`, lokasi Node/npm, `BACKUP_DIR`, dan `CLINIC_DOMAIN` dengan server tujuan. File ini belum dipasang/diaktifkan pada server mana pun. Pastikan pengguna layanan dapat membaca `.env`, menulis cache Next/media/backup, dan menjalankan `pg_dump`. Aktifkan timer hanya setelah uji manual `npm run backup` dan `node scripts/run-jobs.mjs` berhasil. Caddy membutuhkan DNS yang sudah mengarah ke server serta port 80/443 yang dapat diakses untuk menerbitkan sertifikat.
