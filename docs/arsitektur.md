# Panduan pengembangan

Aplikasi memakai Next.js App Router untuk HTTP dan halaman, Payload untuk CMS, serta PostgreSQL untuk penyimpanan. Mulai membaca dari fitur yang ingin diubah; tidak perlu menelusuri seluruh aplikasi.

## Struktur kode

| Lokasi                   | Tanggung jawab                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `src/app/(public)`       | Routing berbasis folder: setiap URL memiliki `page.tsx`, layout, dan metadata sendiri.              |
| `src/components/pages`   | Tampilan bersama untuk daftar, detail konten, breadcrumb, CTA, dan tautan bio.                      |
| `src/components`         | Komponen tampilan bersama dan interaksi browser: filter dokter, peta, modal booking, analitik.      |
| `src/components/booking` | Pengiriman form booking dan tampilan konfirmasi.                                                    |
| `src/app/api`            | Validasi HTTP, autentikasi, status respons, dan pemanggilan proses server.                          |
| `src/server/content`     | Pembacaan konten, metadata, konten terkait, dan audit SEO.                                          |
| `src/server/bookings`    | Penyimpanan booking, idempotensi, pembatasan permintaan, serta pengiriman ulang notifikasi.         |
| `src/server/cms.ts`      | Inisialisasi Payload melalui konfigurasi aplikasi.                                                  |
| `src/collections`        | Skema CMS, akses koleksi, dan pengaturan klinik.                                                    |
| `src/collections/fields` | Field bersama untuk konten dan tinjauan medis.                                                      |
| `src/collections/hooks`  | Validasi publikasi, pembatalan persetujuan medis, redirect, dan invalidasi cache.                   |
| `src/lib`                | Tipe dan fungsi browser-safe: tanggal booking, URL, SEO, DTO konten publik, dan konfigurasi publik. |
| `scripts`                | Seed, import, backup, startup, dan verifikasi operasional.                                          |
| `src/migrations`         | Riwayat perubahan skema PostgreSQL.                                                                 |

Komponen browser tidak boleh mengimpor modul `src/server` atau koneksi database. Koneksi PostgreSQL dan pemeriksa tautan berada di `src/server/db.ts` dan `src/server/check-link.ts`; keduanya tetap dapat digunakan script CLI. Gunakan `import type` untuk tipe dari Payload. `src/lib/content.ts` menyediakan `DoctorProfile`, `ClinicLocation`, `ArticleDetail`, `ServiceDetail`, dan `PublicSchedule`. Query mempertahankan tipe sesuai koleksi sampai prop komponen. DTO memilih field publik secara eksplisit, termasuk relasi dan gambar; field author, hash review, serta field CMS baru tidak otomatis diteruskan ke browser. ID relasi yang belum dimuat tidak dianggap dokumen lengkap. Admin membaca dokumen CMS dengan hak akses staf, bukan DTO publik.

## Menambah halaman baru

Buat file sesuai URL yang diinginkan. Contoh `/karier`:

```tsx
// src/app/(public)/karier/page.tsx
export const metadata = { title: 'Karier' }

export default function KarierPage() {
  return (
    <section className="container section">
      <h1>Karier</h1>
      <p>Informasi lowongan klinik.</p>
    </section>
  )
}
```

Tidak perlu mendaftarkan halaman ke mapping, switch, atau file routing lain. Layout publik otomatis digunakan. Untuk URL `/karier/pendaftaran`, buat `karier/pendaftaran/page.tsx`. Tambahkan tautan navigasi di layout dan entri sitemap bila halaman perlu ditautkan atau diindeks; keduanya bukan persyaratan routing.

Halaman utama berada langsung di `src/app/(public)/page.tsx`. Booking dan kontak memiliki markup di folder URL masing-masing. Daftar konten seperti `dokter/page.tsx` memakai tampilan bersama; `dokter/[slug]/page.tsx` membaca detail dokter. Pola yang sama berlaku untuk lokasi, layanan, blog, dan berita.

`[...path]/page.tsx` hanya fallback untuk halaman yang dibuat lewat koleksi Halaman di CMS dan redirect lama. Tidak digunakan untuk mendaftarkan halaman kode. File route eksplisit selalu mendapat prioritas. Hindari memakai URL yang sama untuk halaman kode dan konten CMS karena konten CMS di URL itu tidak akan tampil.

## Menambah halaman admin

Route admin juga mengikuti folder Next.js:

```text
src/app/(payload)/admin/
├── page.tsx                               → /admin
├── login/page.tsx                         → /admin/login
├── account/page.tsx                       → /admin/account
├── collections/[collection]/page.tsx      → daftar koleksi
├── collections/[collection]/create/page.tsx
├── collections/[collection]/[id]/page.tsx → edit dokumen
├── globals/[global]/page.tsx              → pengaturan global
└── (custom)/layout.tsx                    → pemeriksaan login halaman tambahan
```

Untuk membuat `/admin/laporan`, cukup tambahkan `src/app/(payload)/admin/(custom)/laporan/page.tsx`:

```tsx
import Link from 'next/link'

export const metadata = { title: 'Laporan klinik' }

export default function LaporanPage() {
  return (
    <section>
      <Link href="/admin">Kembali ke dashboard</Link>
      <h1>Laporan klinik</h1>
      <p>Isi laporan Anda di sini.</p>
    </section>
  )
}
```

`(custom)` adalah route group, sehingga namanya tidak muncul pada URL. Layout grup memeriksa login dan peran staf. Halaman file biasa tidak perlu didaftarkan di `payload.config.ts` atau `importMap.js`. Halaman tambahan menerima provider dan CSS Payload; susunan konten serta navigasinya ditulis sendiri di halaman atau layout grup.

Untuk membaca data terbatas di halaman tambahan, panggil `requireAdminUser()` dari `src/server/admin/auth.ts`, lalu gunakan `overrideAccess: false` dan `user` pada query Payload. Login staf tidak berarti boleh membaca semua data; akses booking tetap khusus admin dan editor SEO. Server action dan route API juga harus memeriksa aksesnya sendiri.

Route bawaan tetap menggunakan `PayloadPage` dari `src/server/admin/payload-page.tsx` agar form, akses koleksi, metadata, dan navigasi CMS dikelola Payload. `[...segments]/page.tsx` hanya fallback fitur internal seperti riwayat revisi dan reset password. Jangan menghapus fallback tersebut. `importMap.js` tetap digunakan untuk komponen khusus CMS seperti field atau widget, bukan untuk mendaftarkan halaman Next.js.

Jalankan `npm run test:admin` setelah mengubah routing admin. Tes memakai browser, membuat/mengubah draft sementara, memeriksa login, daftar, revisi, pengaturan, dan logout, lalu menghapus data uji.

## Perubahan yang sering dilakukan

| Kebutuhan                                              | Mulai dari                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Mengubah hero atau urutan bagian beranda               | `src/app/(public)/page.tsx`                                                                          |
| Mengubah tampilan detail layanan, dokter, atau artikel | `DoctorPage.tsx`, `LocationPage.tsx`, `ServicePage.tsx`, `ArticlePage.tsx` di `src/components/pages` |
| Mengubah konten terkait                                | Komponen halaman fitur dan `src/server/content/queries.ts`                                           |
| Mengubah metadata atau structured data                 | `src/server/content/metadata.ts`, `src/lib/structured-data.ts`                                       |
| Mengubah filter atau field form                        | `src/components/BookingForm.tsx`                                                                     |
| Mengubah payload form atau respons setelah submit      | `src/components/booking/useBookingSubmission.ts`                                                     |
| Mengubah validasi atau penyimpanan booking             | `src/lib/booking.ts`, `src/server/bookings/create-booking.ts`                                        |
| Mengubah isi email atau pengiriman Meta                | `src/server/bookings/email.ts`, `src/server/bookings/meta.ts`                                        |
| Mengubah field booking atau jadwal di CMS              | `src/collections/Bookings.ts`, `src/collections/Schedules.ts`                                        |
| Mengubah workflow medis dan publikasi                  | `src/server/content/medical-review.ts`, `src/collections/hooks/content.ts`                           |
| Mengubah hak akses                                     | `src/lib/permissions.ts`, `src/lib/access.ts` dan koleksi terkait                                    |
| Mengubah warna, ukuran, atau responsivitas             | `src/app/(public)/styles.css`                                                                        |

Konten klinik sehari-hari diubah melalui `/admin`, bukan dengan mengedit seed. Seed khusus data demonstrasi.

## Alur yang harus dipertahankan

Booking: browser mengirim ke `/api/booking`; route memeriksa origin, ukuran, dan bentuk input; layanan server membatasi percobaan, memeriksa request yang sudah tersimpan, memvalidasi jadwal publik serta tanggal Jakarta, lalu menyimpan biaya dari database. `requestId` unik menangani dua kiriman bersamaan. Link WhatsApp diberikan setelah penyimpanan berhasil.

Notifikasi: `/api/cron` memeriksa secret dan memperoleh advisory lock PostgreSQL sebelum menjalankan publikasi terjadwal serta notifikasi pending/gagal. Setiap kanal menyimpan status dan metadata percobaan sendiri melalui `delivery.ts`; konfigurasi kanal berada di `src/server/config.ts`. Status `sending` disimpan sebelum pengiriman dan `sent` setelah berhasil. Kegagalan yang dipastikan belum terkirim dicoba ulang dengan jeda bertambah, maksimal lima percobaan. Kegagalan transport yang hasilnya tidak diketahui, atau status `sending` yang tertinggal dua menit, menjadi `uncertain` dan memerlukan pemeriksaan operator. Kotak “Coba ulang” di booking membuka ulang antrean `failed`/`uncertain`; periksa penyedia dahulu karena pengiriman SMTP tidak menjamin tepat satu kali. Email hanya memuat referensi dan tautan admin, bukan nama atau nomor pasien. Jangan memindahkan notifikasi ke sebelum penyimpanan booking.

Publikasi: artikel dan layanan membutuhkan persetujuan medis yang cocok dengan hash isi saat ini. Perubahan isi membatalkan persetujuan dan mengembalikan draft. Urutan validasi dan format hash merupakan bagian dari kontrak data. Perubahan slug memperbarui redirect dalam transaksi Payload yang sama melalui `req`.

Pembacaan publik memakai cache 60 detik dan akses publik Payload. Detail dibaca berdasarkan slug dengan `limit: 1`; jadwal dan artikel terkait memakai filter database. `src/collections/hooks/cache.ts` menghapus cache bertag saat konten/jadwal dibuat, diubah, atau dihapus, serta ketika pengaturan disimpan. CLI tanpa konteks Next melewati invalidasi; cache server yang sedang berjalan tetap berakhir menurut TTL. Modal meminta ulang opsi booking setiap dibuka, dan respons opsi tidak disimpan di cache browser. Jadwal hanya ditampilkan jika dokter, lokasi, dan layanan telah terbit. Audit tautan internal menggunakan HEAD ke origin aplikasi yang dikonfigurasi, tanpa cookie admin atau query URL. Redirect hanya diikuti ke halaman publik pada origin yang sama; timeout/kegagalan server ditandai perlu ditinjau. Halaman berbasis file tidak memerlukan registrasi pada audit. Audit admin menggunakan akses pengguna yang masuk; jangan memakai cache konten publik untuk data admin.

## Menambah field CMS

1. Ubah koleksi terkait atau field bersama.
2. Jalankan `npm run generate:types`. Jangan mengedit `src/payload-types.ts` manual.
3. Sesuaikan pembaca data, form, atau tampilan yang memakainya.
4. Buat migrasi dengan `npm run migrate:create`, tinjau SQL, lalu uji pada database terpisah. Produksi tidak memakai sinkronisasi skema development.
5. Jalankan verifikasi sesuai perubahan. Perubahan komponen admin juga memerlukan `npm run generate:importmap`.

`src/app/(payload)/admin/importMap.js`, tipe Payload, dan snapshot migrasi merupakan file yang dihasilkan tool. Refactor yang hanya memindahkan kode tidak memerlukan migrasi baru.

## Verifikasi sebelum serah terima

```sh
npm run verify
```

Perintah ini memeriksa tipe, format, tes unit, migrasi database kosong, build produksi, integrasi, browser, workflow publikasi, SMTP lokal, dan admin. Runner `scripts/test.mjs` membuat database `clinic_test_<id>`, kredensial, port, direktori upload, dan salinan build khusus satu run. Fixture berada di `tests/fixtures`; suite mutasi menolak berjalan tanpa lingkungan terisolasi. Cleanup menghapus database dan salinan run ketika berhasil maupun gagal.

`npm test` hanya menjalankan tes unit. `npm run test:integration`, `test:browser`, `test:workflow`, `test:email`, atau `test:admin` menyiapkan lingkungan yang sama untuk satu suite. Tidak perlu menjalankan server demo. Browser memakai Chrome lokal atau `PLAYWRIGHT_CHANNEL=chromium`; CI memakai Chromium dan PostgreSQL sementara. Gunakan `TEST_DATABASE_ADMIN_URL` untuk koneksi pengujian dengan izin membuat database.

`npm run lint` memakai compiler TypeScript untuk identifier tidak terpakai dan menelusuri import dari setiap komponen `use client`, termasuk helper perantara, re-export, dan import dinamis literal. Import runtime modul server, database, dan Node ditolak; `import type` tetap diperbolehkan. File hasil generator dikecualikan dari aturan identifier tidak terpakai, tetapi tetap diperiksa oleh typecheck. Pemeriksaan ini ada di `scripts/lint.mjs`, tanpa ketergantungan ESLint tambahan.

## Migrasi status notifikasi

Migrasi `20261004_073427_notification_delivery` menambahkan status pengiriman dan metadata percobaan. Jalankan migrasi sebelum menjalankan build baru pada database yang sudah ada. Verifikasi otomatis menguji migrasi maju pada database kosong; rollback belum diuji end-to-end.

Rollback menolak berjalan jika masih ada status `sending` atau `uncertain`, karena versi lama tidak dapat merepresentasikan hasil pengiriman yang belum pasti. Hentikan cron dan selesaikan pemeriksaan hasil pengiriman sebelum rollback; jangan mengubah status menjadi pending hanya untuk melewati pemeriksaan karena dapat menyebabkan pengiriman ganda.

## Menjaga perubahan fitur tetap lokal

`ContentPage` hanya menyusun bagian detail yang sama: breadcrumb, judul, isi, FAQ, dan structured data. Ia tidak mengambil data atau memilih perilaku berdasarkan jenis dokter/lokasi/artikel. Susunan fitur ada di `DoctorPage`, `LocationPage`, `ServicePage`, dan `ArticlePage`. Ubah komponen fitur tersebut untuk menambah pendidikan dokter, informasi lokasi, artikel terkait, atau bagian khusus lainnya.

Aturan visual booking berada di `src/components/booking/Booking.module.css`; aturan peta di `src/components/NetworkMap.module.css`. Komponen mengimpor kelas lokal. Token, reset, tipografi, dan style fitur lain masih berada di stylesheet publik. Saat memindahkan fitur berikutnya, pertahankan urutan selector dan aturan responsive.

Untuk membandingkan tampilan pada mesin/browser yang sama:

```sh
node scripts/test.mjs visual-baseline  # sebelum perubahan CSS
# lakukan perubahan
node scripts/test.mjs visual          # sesudah perubahan
```

Runner membuat fixture dan build terisolasi. Enam screenshot form, dialog, dan peta pada desktop/mobile disimpan di `.local/visual-comparison/before` dan `after`; pembandingan memakai piksel persis. Peta eksternal diganti latar deterministik agar hasil tidak bergantung pada jaringan/tiles. Artefak lokal ini tidak dipakai sebagai baseline lintas OS di CI.

Konfigurasi browser berada di `src/lib/public-config.ts`: origin aplikasi, mode demo, GA4, dan ID Meta Pixel divalidasi bersama. Rahasia SMTP dan token Meta tetap di `src/server/config.ts`. Nilai `NEXT_PUBLIC_*` dikompilasi ke bundle browser; perubahan memerlukan build ulang.
