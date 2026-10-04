# Website Klinik — Paket Profesional

Next.js 16 + Payload CMS 3 + PostgreSQL. Aplikasi mencakup website publik, admin empat peran, workflow tinjauan medis, booking tersimpan, dan manajemen SEO. Acuan ruang lingkup: `../proposal-website-klinik.md`.

## Menjalankan

Node.js 24+ dan PostgreSQL 17+ diperlukan. Salin `.env.example` ke `.env`, isi database serta rahasia acak minimal 32 karakter. `SEED_ADMIN_PASSWORD` harus minimal 16 karakter. Gunakan kredensial berbeda untuk produksi.

```sh
npm ci
npm run dev
# Di terminal terpisah, untuk data demonstrasi:
npm run seed
```

Buka `http://localhost:3000` dan `/admin`. Akun demo berasal dari `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` pada `.env`; sandi tidak ditanam di kode. Seed hanya berjalan ketika `NEXT_PUBLIC_DEMO_MODE=true` dan tidak menimpa konten yang sudah ada.

Saat development, Payload menyinkronkan schema. Produksi memakai migrasi terlacak:

```sh
npm run migrate
npm run build
npm start
```

Build membutuhkan database yang sudah dimigrasi dan konten yang tersedia untuk prerender. Untuk instalasi produksi baru tanpa data demo, buat akun awal secara lokal sebelum membuka server ke internet; tetapkan peran Admin melalui `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` dan `npm run bootstrap:admin`. Jangan membiarkan formulir first-user terbuka di internet.

## Verifikasi

```sh
npm test                 # tes unit, tanpa server/database
npm run verify           # typecheck, lint, format, unit, build dan semua suite aplikasi
# Atau satu suite aplikasi:
npm run test:integration
npm run test:browser
npm run test:workflow
npm run test:email
npm run test:admin
```

Suite aplikasi membuat database `clinic_test_<id>` dan salinan build sementara, mengisi fixture sendiri, lalu menghapusnya dalam cleanup termasuk ketika tes gagal. Server demo tidak perlu aktif. Gunakan `TEST_DATABASE_ADMIN_URL` untuk koneksi PostgreSQL khusus pengujian dengan izin membuat database; jika kosong, runner memakai koneksi `DATABASE_URL` untuk membuat database terpisah pada server tersebut. Jangan gunakan koneksi produksi untuk pengujian.

Browser lokal memakai Chrome. Untuk Chromium Playwright, jalankan `npx playwright install chromium` lalu `PLAYWRIGHT_CHANNEL=chromium npm run verify`. Workflow `.github/workflows/verify.yml` menyediakan PostgreSQL sementara dan Chromium.

## Mengembangkan kode

Lihat [panduan arsitektur](docs/arsitektur.md) untuk struktur folder, alur booking dan publikasi, lokasi perubahan umum, serta prosedur mengubah skema. Jalankan `npm run format` untuk merapikan format kode.

## Operasional

Lihat [panduan serah terima](docs/serah-terima.md) untuk alur admin, SMTP/WhatsApp, cron, analitik, migrasi konten, backup, agenda pelatihan, dan gerbang peluncuran. `Dockerfile` mengemas hasil `npm run build`; `compose.yaml` menyediakan Postgres dan runtime aplikasi. Letakkan reverse proxy HTTPS di depan aplikasi.

Aplikasi belum merupakan website klinik produksi: data yang diberikan pada workspace hanya proposal, tanpa identitas klinik, konten resmi, domain, atau akun integrasi. Konten demo sengaja diberi label dan dicegah dari pengindeksan. Gunakan data sintetis selama pengujian.

Rujukan integrasi: [Payload installation](https://payloadcms.com/docs/getting-started/installation), [drafts & scheduled publishing](https://payloadcms.com/docs/versions/drafts).

## Lingkungan lokal yang disiapkan

Pada workspace ini database development berada di `.local/postgres` dan mendengarkan hanya pada `127.0.0.1:55439`. Jika layanan berhenti setelah restart komputer, jalankan dari folder proyek:

```sh
pg_ctl -D .local/postgres -l .local/postgres.log -o '-h 127.0.0.1 -p 55439' start
npm start
```

`npm start` memakai hasil build produksi terakhir. Setelah mengubah kode, jalankan `npm run build` atau gunakan `npm run dev`. Ringkasan implementasi dan hal yang masih menunggu pihak klinik tersedia di [status implementasi](docs/status-implementasi.md).
