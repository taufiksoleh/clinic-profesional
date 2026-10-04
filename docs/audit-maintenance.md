# Audit keterbacaan dan maintenance

Tanggal: 4 Oktober 2026. Ruang lingkup: routing publik/admin, tampilan, query CMS, booking, notifikasi, akses, cache, dan tes. Audit ini tidak mengubah perilaku aplikasi. Prioritas didasarkan pada kemungkinan perubahan satu fitur memengaruhi fitur lain, bukan jumlah baris semata.

## Temuan yang berhasil direproduksi

| Kasus                                    | Hasil                                                                                                                | Metode                                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Booking pada batas 90 hari               | Dengan waktu acuan 4 Oktober 2026, form mengizinkan 2 Januari 2027, tetapi `validBookingDate` mengembalikan `false`. | Memanggil fungsi tanggal dengan waktu tetap dan rumus `max` yang digunakan form.                                              |
| Email berhasil, penyimpanan status gagal | Pemanggilan ulang menghasilkan dua pemanggilan `sendEmail` untuk satu booking.                                       | Payload tiruan: pengiriman berhasil; update pertama melempar error; percobaan kedua berhasil. Tidak mengirim email eksternal. |
| Audit tautan bio dokter                  | `/links/nadia-putri` mengembalikan HTTP 200, tetapi audit menandainya sebagai tautan internal rusak.                 | Data konten tiruan pada `getContentAudit`, lalu GET ke URL lokal sebenarnya.                                                  |

Dugaan lain juga diperiksa: PATCH jadwal dengan hanya `end: '08:00'` pada jadwal mulai `09:00` ditolak HTTP 400. Karena itu, dugaan bahwa validasi tersebut dapat dilewati tidak dimasukkan sebagai bug. Jadwal uji nonaktif sudah dihapus.

## P1 — Dahulukan sebelum memperluas fitur

### 1. Satukan aturan booking yang digunakan browser dan server

Lokasi: `src/lib/booking.ts`, `src/components/BookingForm.tsx`, `src/components/booking/useBookingSubmission.ts`, `src/server/bookings/create-booking.ts`.

Batas 90 hari dan validasi nomor telepon ditulis di lebih dari satu tempat. Perhitungan server memakai tanggal booking pada pukul 12:00 dibanding hari ini pukul 00:00, sehingga hari ke-90 dianggap 90,5 hari. Form memakai batas kalender 90 hari. Masalah ini tidak tertangkap tes tanggal yang ada.

Respons booking juga belum memiliki kontrak bersama. Hook browser menerima `response.json()` tanpa pemeriksaan bentuk respons, sedangkan bentuk konfirmasi ditulis lagi di komponen. Perubahan field respons dapat lolos typecheck tetapi merusak form.

Arah refactor:

- Buat fungsi tanggal Jakarta bersama, misalnya `getBookingDateRange` dan `isBookingDateAllowed`, dengan waktu acuan yang bisa diberikan saat tes.
- Tetapkan satu schema input dan tipe/schema respons booking yang dipakai server serta browser.
- Pertahankan validasi server sebagai penentu; batas HTML hanya membantu pengguna.
- Uji hari ke-89, ke-90, ke-91, pergantian hari Jakarta, jadwal hari ini yang sudah selesai, dan respons API tidak valid.

### 2. Jadikan aturan izin satu sumber yang jelas

Lokasi: `src/lib/access.ts`, `src/collections/fields/content.ts`, `src/collections/hooks/content.ts`, `src/components/AdminOverview.tsx`, route export/audit, `src/payload.config.ts`, dan layout admin.

Daftar peran `admin/seo` serta `admin/medical` diulang di banyak file. Menambah peran seperti resepsionis dapat membuka menu tetapi tetap menolak API, atau sebaliknya. Fungsi `isManager` juga menggabungkan izin yang kelak mungkin berbeda: publikasi, SEO, dan pengelolaan booking.

Arah refactor:

- Gunakan fungsi berdasarkan kemampuan: `canPublishContent`, `canReviewMedicalContent`, `canManageBookings`, `canExportBookings`, dan `canRunSEOAudit`.
- Pakai fungsi yang sama di adapter access Payload, API, dan tampilan menu.
- Pertahankan aturan kepemilikan artikel penulis secara terpisah.
- Uji matriks anonim/admin/seo/writer/medical untuk tiap kemampuan, termasuk request langsung ke API. Menyembunyikan menu bukan pemeriksaan akses.

### 3. Pisahkan workflow publikasi dari hook infrastruktur

Lokasi: `src/collections/hooks/content.ts:28`.

Satu hook mengurus author, slug, URL terlarang, izin publikasi, pembatalan review, persetujuan dokter, fingerprint, draft, dan skor SEO. Urutan mutasinya penting tetapi harus dipahami sekaligus ketika menambah field atau status. Hash review hanya memuat field tertentu; field medis baru tidak otomatis membatalkan persetujuan.

Arah refactor:

- Pisahkan fungsi aturan medis dan publikasi dari pemanggilan Payload, redirect, dan cache.
- Hook tetap menjadi penghubung tipis yang menjalankan aturan dalam urutan eksplisit.
- Definisikan isi yang dianggap membutuhkan review ulang di satu fungsi bertipe jelas.
- Sebelum mengubahnya, tambahkan tes transisi draft → approved → published → edited, perubahan metadata saja, dan kombinasi edit + permintaan publikasi.
- Pertahankan format hash yang sudah tersimpan; perubahan format memerlukan keputusan migrasi atau review ulang, bukan sekadar rename fungsi.

### 4. Perjelas pengiriman ulang notifikasi dan kegagalannya

Lokasi: `src/server/bookings/notifications.ts:21`, `src/server/bookings/create-booking.ts:70`, `src/app/api/cron/route.ts:21`.

Email dan Meta diproses dalam satu loop. Status baru disimpan setelah kedua kanal selesai. Jika email berhasil lalu proses berhenti atau update database gagal, cron berikutnya dapat mengirim email lagi. Advisory lock mencegah dua cron bersamaan, tetapi tidak mengatasi kegagalan antara pengiriman dan penyimpanan.

Saat ini kegagalan hanya menjadi status `failed`; alasan, jumlah percobaan, dan waktu percobaan berikutnya tidak disimpan. Kondisi konfigurasi kanal juga diulang saat booking dibuat dan saat dikirim.

Arah refactor:

- Pisahkan pengiriman email dan Meta menjadi fungsi khusus dengan hasil bertipe.
- Simpan hasil tiap kanal segera; catat attempt, waktu retry, dan ringkasan error tanpa data pasien atau secret.
- Tetapkan batas percobaan/backoff dan visibilitas kegagalan untuk operator.
- Gunakan kunci idempotensi penyedia jika tersedia. Jangan menganggap transaksi database bisa menjamin pengiriman SMTP tepat satu kali; kemungkinan duplikasi harus ditangani secara eksplisit.
- Tambahkan tes email gagal, Meta gagal setelah email berhasil, update status gagal, retry, dan cron bertabrakan. Tes email sekarang mencakup jalur sukses dan cron berikutnya setelah status tersimpan.

### 5. Isolasi lingkungan dan data tes

Lokasi: `tests/integration.test.ts:4`, `tests/browser/clinic.spec.ts:36`, `playwright.config.ts`, `scripts/verify-*.ts`, `package.json`.

Tes integrasi memakai URL dan akun demo dari `.env`, serta memilih jadwal pertama yang tersedia. Sebagian tes memiliki guard demo, sebagian tidak. Cleanup tidak selalu berada dalam `finally`; kegagalan assertion dapat meninggalkan data. Tes juga memakai akun admin bersama. Pada pengerjaan sebelumnya, pengujian yang berjalan bersamaan menghasilkan kegagalan autentikasi yang tidak muncul ketika dijalankan sendiri.

Tidak ditemukan workflow CI dalam repository ini. `npm test` juga tidak mencakup suite browser, workflow, email, dan admin; semuanya perintah terpisah.

Arah refactor:

- Sediakan database dan akun khusus pengujian, fixture per suite, serta guard sebelum test yang menulis data.
- Jangan bergantung pada nama dokter atau urutan jadwal dari seed demo; buat kebutuhan tes sendiri.
- Gunakan cleanup `finally` yang memeriksa hasil penghapusan.
- Pisahkan tes unit, integrasi, dan browser. Beri satu perintah verifikasi lengkap yang menyiapkan server dan menjalankan suite mutasi secara berurutan sampai isolasinya memadai.
- Tambahkan CI untuk typecheck, format/lint, tes, dan build dengan database sementara.

## P2 — Kurangi ketergantungan antarhalaman dan biaya perubahan

### 6. Ganti tipe konten serbaguna dengan tipe sesuai kebutuhan

Lokasi: `src/lib/content.ts:16`, `src/components/pages/ContentPage.tsx:12`, `src/server/content/related-content.ts:4`, `src/lib/structured-data.ts:4`.

`Content` mencampur field halaman, dokter, lokasi, dan artikel sebagai field opsional. `PublicSchedule` juga menggunakan `Content` untuk ketiga relasinya. Akibatnya, compiler tidak dapat menjamin bahwa suatu lokasi mempunyai koordinat atau bahwa prop `category='dokter'` benar-benar disertai data dokter.

`ContentPage` tetap menangani banyak jenis halaman dengan pemeriksaan `category`. Menambahkan profil dokter yang berbeda dapat memengaruhi markup artikel atau lokasi karena semuanya berbagi komponen besar yang sama.

Arah refactor:

- Gunakan tipe seperti `DoctorProfile`, `ClinicLocation`, `ArticleDetail`, dan `BookingOption` yang diturunkan dari tipe Payload.
- Susun halaman per fitur dari komponen bersama yang memang sama: breadcrumb, isi artikel, FAQ, tabel jadwal, dan kartu.
- Hubungkan data dan jenis halaman melalui tipe yang jelas; hindari pasangan `Content` dan string kategori bebas.
- Kembalikan field publik yang dibutuhkan secara eksplisit. `toPublicContent` masih menyebarkan seluruh dokumen, dan `/api/booking-options` mengirim seluruh hasil jadwal. Penambahan field CMS dapat ikut memperluas respons API tanpa disengaja.

### 7. Pisahkan query detail, daftar, dan relasi; tetapkan invalidasi cache

Lokasi: `src/server/content/page-content.ts:22`, `src/server/content/queries.ts:11`, `src/server/content/related-content.ts:5`, `src/collections/hooks/content.ts:141`.

Query detail mengambil semua konten koleksi lalu mencari slug di memori. Halaman terkait mengambil seluruh jadwal bahkan untuk konten yang tidak menampilkan jadwal. Cache mengurangi frekuensi query, tetapi tidak menghilangkan biaya pengisian cache, payload, dan pemrosesan ketika data bertambah. Belum dilakukan benchmark skala besar; ini temuan struktur query, bukan klaim aplikasi saat ini lambat.

Invalidasi konten masih memanggil `revalidatePath('/', 'layout')`. Tidak ada invalidasi eksplisit setelah delete konten atau perubahan jadwal/pengaturan; bagian tersebut mengandalkan masa cache. Modal booking menyimpan jadwal yang sudah diambil selama komponen hidup. Pengguna dapat melihat biaya/jadwal lama, meskipun server tetap memeriksa ulang data saat booking.

Arah refactor:

- Sediakan query detail berdasarkan slug dengan `limit: 1`, daftar dengan pagination, dan relasi dengan filter yang sesuai.
- Tetapkan tag/cache policy per konten, jadwal, dan pengaturan, termasuk create/update/delete.
- Segarkan opsi booking saat diperlukan tanpa menghapus validasi server.
- Uji perubahan biaya, penonaktifan jadwal, penghapusan konten, dan perubahan slug terhadap tampilan serta respons API.

### 8. Lepaskan audit SEO dari whitelist route manual

Lokasi: `src/server/content/audit.ts:37`, `src/app/sitemap.ts:7`, `src/lib/content-routes.ts`, `src/lib/constants.ts`.

Routing sudah berbasis file, tetapi audit SEO masih memutuskan keberadaan halaman memakai daftar route tetap dan slug CMS. Halaman bio dokter yang valid sudah dapat dianggap rusak. Halaman baru seperti `/karier` berpotensi mengalami hal yang sama.

Arah refactor: verifikasi keberadaan route yang sebenarnya dengan mekanisme internal yang dibatasi ke origin aplikasi, atau informasi route hasil build yang sesuai runtime. Pisahkan kebutuhan metadata/sitemap dari keputusan apakah URL ada. Jangan mengembalikan routing halaman ke registry atau mapping pusat. Tambahkan tes yang membuktikan halaman file baru dan bio dokter dikenali audit.

### 9. Batasi CSS berdasarkan komponen

Lokasi: `src/app/(public)/styles.css` — 1.192 baris.

Reset, tipografi, tombol, hero, form booking, peta, dan responsive rules berada dalam stylesheet global yang sama. Selector seperti `.card`, `.section`, serta selector elemen umum membuat perubahan desain berpotensi meluas ke halaman lain. Tes browser yang ada mengecek H1, overflow, dan interaksi, tetapi belum membandingkan tampilan.

Arah refactor: pertahankan reset, token warna/spacing, dan tipografi dasar secara global. Pindahkan styling khusus ke CSS Modules berdekatan dengan komponen. Mulai dari booking dan peta; bandingkan screenshot desktop/mobile sebelum dan sesudah. Tidak perlu mengganti framework CSS.

### 10. Tegaskan batas kode server, browser, dan konfigurasi

Lokasi: `src/lib/db.ts`, `src/lib/check-link.ts`, `src/server`, `src/payload.config.ts`, komponen analytics, dan modul notifikasi.

`lib` mencampur utilitas browser-safe dengan database dan DNS/HTTPS. Belum ada aturan import yang melarang komponen client mengimpor kode server. Konfigurasi SMTP, Meta, origin, dan mode demo dibaca di banyak tempat; kondisi aktivasi kanal dapat berbeda ketika salah satunya diubah.

Arah refactor:

- Pindahkan database dan pemeriksa tautan ke area server; gunakan aturan import/lint untuk menegakkan batas. Penanda `server-only` perlu diterapkan dengan memperhatikan script CLI yang juga memakai modul tersebut.
- Pisahkan konfigurasi server dan konfigurasi publik. Validasi variabel integrasi ketika integrasi diaktifkan, bukan memaksa semua layanan tersedia pada development.
- Gunakan satu fungsi konfigurasi kanal di pembuatan booking dan worker notifikasi.
- Tambahkan lint untuk import terlarang dan identifier tidak terpakai. Prettier hanya memeriksa format.

## Urutan pengerjaan yang disarankan

1. Isolasi tes dan tambahkan tes karakterisasi untuk tiga kasus yang direproduksi. Perbaiki ketidaksesuaian tanggal dalam perubahan kecil tersendiri.
2. Satukan kebijakan izin, lalu pisahkan aturan publikasi dari hook. Pertahankan kontrak error dan urutan validasi yang telah diuji.
3. Perbaiki alur notifikasi dan audit route sebagai perubahan perilaku yang terpisah dari pemindahan file.
4. Perjelas tipe dan kontrak API; setelah itu pisahkan tampilan serta query per fitur dan kebijakan cache.
5. Pindahkan CSS secara bertahap, tambahkan pemeriksaan batas import dan verifikasi otomatis.

Routing berbasis file yang sekarang sudah mudah ditambah sebaiknya dipertahankan. Jangan menambah generic repository, service factory, registry halaman, atau banyak interface yang hanya punya satu implementasi. Ukuran keberhasilan: fitur baru membutuhkan perubahan di area fitur tersebut, kontrak yang dilanggar terlihat saat typecheck/tes, dan reviewer dapat mengikuti alur tanpa membuka banyak file yang tidak terkait.

## Progres implementasi — 4 Oktober 2026

Audit di atas merekam keadaan sebelum refactor. Status pekerjaan saat ini:

| Area                  | Status dan bukti                                                                                                                                                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Isolasi tes           | Runner database/build/akun/port sementara, fixture mandiri, guard suite mutasi, perintah `verify`, dan workflow CI sudah dibuat. Seluruh suite lokal lolos; workflow CI belum dijalankan di layanan remote.                                                                                                    |
| Aturan booking        | Tanggal Jakarta, batas inklusif 90 hari, pola telepon, dan schema konfirmasi bersama sudah diterapkan; tes batas tanggal dan respons tidak valid lolos.                                                                                                                                                        |
| Izin                  | Fungsi kemampuan bersama dipakai CMS/API/UI; matriks peran diuji unit dan pembatasan penulis diuji lewat API. Cakupan integrasi seluruh peran masih perlu ditambah.                                                                                                                                            |
| Publikasi medis       | Aturan murni dipisahkan ke `medical-review.ts`; format hash lama dipertahankan. Tes transisi, perubahan isi/metadata, dan workflow aplikasi lolos.                                                                                                                                                             |
| Notifikasi            | Kanal email/Meta terpisah, pencatatan sebelum kirim, status tidak pasti, backoff, batas percobaan, dan retry operator tersedia. Tes kegagalan penyimpanan/transport serta SMTP lokal lolos. Tes kanal ganda, retry operator via API, dan benturan cron masih perlu diperluas.                                  |
| Query dan cache       | Detail berdasarkan slug; relasi difilter di database. Tag konten/jadwal/pengaturan dan hook create/update/delete tersedia. Modal memuat ulang jadwal. Tes perubahan publikasi, hapus konten, biaya, jadwal aktif, dan pengaturan lolos. Pagination daftar yang terlihat oleh pengunjung masih perlu dirancang. |
| Audit route           | Whitelist route dihapus. Pemeriksaan URL publik pada origin sendiri dengan batas waktu/redirect dan status perlu ditinjau. Tes bio dokter serta file route baru tanpa registrasi lolos.                                                                                                                        |
| Tipe/komposisi konten | Tipe dokter/lokasi/artikel/layanan serta DTO publik eksplisit tersedia. Halaman fitur dan structured data dipisahkan; tipe query dipertahankan sampai prop. Tes compile-time dan pencegahan field internal terbawa DTO lolos.                                                                                  |
| CSS                   | Booking dan peta memakai CSS Modules. Enam screenshot form/dialog/peta desktop/mobile cocok piksel demi piksel. Style fitur lain masih di stylesheet global dan dapat dipindahkan bertahap.                                                                                                                    |
| Batas server/browser  | Database/pemeriksa tautan dipindahkan ke server. Lint identifier dan import transitif tersedia dalam verify; percobaan client → helper → database ditolak. Konfigurasi publik divalidasi terpisah dari rahasia server.                                                                                         |

Verifikasi terakhir: `npm run verify` berhasil — typecheck, lint, format, 33 unit, 13 integrasi, 8 browser, build produksi, workflow publikasi, SMTP lokal, dan admin. Database tes dihapus setelah selesai. Refactor keseluruhan **belum selesai**; tabel ini bukan pernyataan bahwa semua cakupan audit sudah terpenuhi. Migrasi notifikasi belum diterapkan pada database demo utama dalam tahap ini.
