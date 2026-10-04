# Status implementasi Paket Profesional

Diperiksa pada 4 Oktober 2026. Acuan: `../../proposal-website-klinik.md`.

**Aplikasi lokal berjalan dengan Next.js, Payload CMS, dan PostgreSQL. Peluncuran klinik produksi belum selesai.** Identitas serta data klinik yang tersedia masih contoh. Tidak ada domain, server produksi, sumber migrasi lama, atau akun integrasi klinik yang diberikan.

| Persyaratan | Implementasi dan bukti | Status |
| --- | --- | --- |
| Beranda, Tentang, Layanan/kondisi, Dokter/profil, Lokasi/detail, Blog, Berita, Kontak, link bio, Privasi, 404 | Rute publik, CMS tiap jenis konten, build prerender, tes browser desktop/ponsel pada 11 rute utama | Tersedia lokal |
| Informasi biaya sebelum booking | Jadwal menghubungkan dokter, layanan, lokasi, hari/jam, biaya; server membaca biaya resmi dari database | Tes integrasi dan browser lulus |
| Form di semua halaman dan WhatsApp | Dialog booking global; form detail dan halaman booking; tautan WhatsApp setelah tersimpan serta tombol kontak jika nomor dikonfigurasi | Form teruji; nomor WhatsApp klinik belum tersedia |
| Pencarian dokter | Nama, spesialisasi, lokasi, hari; hasil tanpa reload | Tes filter desktop/ponsel lulus |
| Profil dokter | Pendidikan, pengalaman, keahlian, jadwal/biaya, artikel ditinjau, booking | Tersedia; data resmi belum diberikan |
| Lokasi dan peta jaringan | Alamat, koordinat, jam, dokter, biaya; pemilih lokasi dan peta OpenStreetMap; foto dokter jika diunggah | Tersedia; koordinat/foto resmi belum diberikan |
| Artikel edukasi dan kondisi | Daftar isi, subjudul, FAQ, dokter/artikel terkait, CTA, reviewer dan tanggal tinjauan | Tersedia; isi medis final belum diberikan/disetujui |
| Booking tersimpan dan asal kunjungan | PostgreSQL, ID permintaan unik untuk retry, referensi, persetujuan, UTM/referrer, snapshot biaya, status tindak lanjut, catatan admin | Tes dua permintaan serentak menghasilkan satu rekaman |
| Ekspor Excel | CSV UTF-8 BOM dengan perlindungan formula; akses Admin/Editor SEO | Implementasi tersedia dan akses tanpa login ditolak dalam tes |
| Email admin | Status antrean persisten pada booking, proses cron terkunci, retry, email hanya berisi referensi/tanggal/tautan admin | Tes SMTP lokal berhasil; SMTP klinik belum tersedia |
| Empat peran dan login | Admin, Editor SEO, Penulis, Peninjau Medis; akses booking dibatasi; 5 kegagalan login menyebabkan lock 15 menit; cookie secure pada origin HTTPS | Aturan akses tersedia; tes akses anonim/penulis dan pencegahan kenaikan peran lulus |
| Draf → tinjauan medis → terbit | Persetujuan dan fingerprint isi; perubahan isi membatalkan persetujuan; terbit hanya Admin/Editor SEO | Tes workflow termasuk penolakan terbit tanpa review dan invalidasi review lulus |
| Publikasi terjadwal | Payload jobs dan endpoint cron dengan secret; penulis tidak dapat menjadwalkan | Publikasi via cron nyata teruji; scheduler produksi belum dipasang |
| CRUD dokter, lokasi, jadwal, biaya, layanan, artikel, FAQ, media | Koleksi Payload dan Pengaturan Klinik | Admin login/dashboard berhasil diperiksa di browser |
| SEO tiap halaman | Title, description, slug, canonical, noindex, OG image; halaman utama/daftar melalui Pengaturan Klinik | Tersedia |
| Dashboard SEO dan preview | Skor kelengkapan per dokumen, preview pencarian/WhatsApp, audit tautan internal/eksternal, daftar 404 | Tersedia; tautan eksternal diperiksa otomatis; alamat yang dibatasi/tidak terjangkau ditandai untuk ditinjau |
| Redirect otomatis | Slug berubah membuat redirect permanen; validasi loop termasuk PATCH parsial | Tes otomatis lulus |
| Sitemap, robots, schema | Clinic, Person/dokter, Article, FAQ, Breadcrumb; sitemap mengecualikan noindex/draf | Implementasi tersedia; mode demo sengaja memblokir indeks |
| Gambar cepat dan alt | Upload dibatasi 8 MB dan tipe gambar; WebP + ukuran card/hero; alt wajib | Tes upload/resize/alt lulus |
| Performa mobile minimal 90 | Hasil Lighthouse pada beranda, dokter, booking, artikel, lokasi disimpan di `performance-results.json` | Target tercapai pada sampel build lokal; harus diulang dengan konten/domain produksi |
| GA4, Search Console, Meta Pixel/CAPI | Integrasi env, consent analitik, event booking/WhatsApp, deduplikasi ID browser/server, kode verifikasi GSC | Kode tersedia; aktivasi dan pembuktian event di akun klinik belum dilakukan |
| SSL dan deployment | Build standalone, Dockerfile/Compose, contoh Caddy HTTPS, systemd service/timer | Artefak tersedia; belum ada hosting/domain produksi |
| Backup harian | Script pg_dump + arsip media; timer harian contoh | Backup dan restore ke database terpisah teruji; timer/offsite produksi belum aktif |
| Migrasi hingga 150 halaman | Import JSON, validasi/dry-run, draf dan redirect tanpa menimpa URL yang sudah ada | Importer tersedia; sumber konten lama belum diberikan |
| Panduan, dua pelatihan, garansi 60 hari | Panduan tertulis, agenda dua sesi, gerbang serah terima | Panduan selesai; sesi pelatihan, penerimaan, dan layanan garansi belum dilaksanakan |

## Verifikasi yang dijalankan

- Typecheck dan build produksi berhasil.
- 13 tes unit/integrasi HTTP lulus, termasuk booking serentak, akses pasien, role escalation, loop redirect, serta upload gambar.
- 8 tes browser desktop/ponsel lulus, termasuk 11 rute publik, satu H1, tidak ada overflow, filter, dialog booking, pengiriman booking, dan halaman 404.
- Verifikasi workflow medis, penjadwalan lewat cron, perubahan isi, dan redirect lulus.
- Verifikasi SMTP lokal berhasil; cron berulang tidak mengirim ulang email yang sudah ditandai terkirim.
- Dua migrasi berhasil dijalankan pada database kosong; backup berhasil direstore pada database terpisah.
- Audit dependensi produksi melaporkan 0 kerentanan pada pemeriksaan ini. Ini bukan klaim audit keamanan menyeluruh.

## Yang dibutuhkan untuk meluncurkan

Nama/logo/foto klinik, data dokter beserta jadwal dan biaya, lokasi nyata, konten medis yang disetujui, kebijakan privasi final, nomor WhatsApp, akses SMTP/GA4/GSC/Meta, konten lama, serta domain/server tujuan. Setelah tersedia: isi CMS, aktifkan integrasi dan timer, deploy HTTPS, ulangi pengujian pada domain final, lalu lakukan penerimaan dan pelatihan.

Akun lokal tersimpan melalui variabel `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` dalam `.env` yang diabaikan Git. Jangan membagikan `.env`, folder `.local`, backup, atau `.next/standalone` mentah karena dapat memuat rahasia/data lokal. Docker build mengecualikan semua berkas `.env`.
