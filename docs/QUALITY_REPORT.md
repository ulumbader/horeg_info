# Quality Report — FASE 11

Tanggal verifikasi: 13 Juli 2026  
Target saat laporan dibuat: Next.js 16.2.10, Chromium Playwright 1.61.1, Prisma 5.22.0, SQLite terisolasi.

> Catatan: hasil di bawah adalah quality gate historis sebelum migrasi Supabase PostgreSQL. Harness terbaru membutuhkan schema PostgreSQL test terisolasi melalui `TEST_DATABASE_URL`/`TEST_DIRECT_URL` dan `E2E_DATABASE_URL`/`E2E_DIRECT_URL`.

## Ringkasan quality gate

- `npm run check`: lulus tanpa warning ESLint, error TypeScript, atau test gagal.
- Vitest: 34 test lulus pada 4 file (29 unit dan 5 integration).
- Playwright: 5 test E2E lulus pada Chromium; kelima test menguji 10 alur acceptance.
- `npm run build`: lulus dan menghasilkan output standalone.
- Audit dependency: 0 high, 0 critical, 2 moderate yang berasal dari PostCSS 8.4.31 bawaan Next.js 16.2.10.
- Database test: `prisma/vitest.db` dan `prisma/e2e.db`, keduanya dihapus/dibuat ulang oleh harness dan diabaikan Git melalui pola `*.db`.

## Test matrix

| Lapisan | Cakupan | Hasil |
| --- | --- | --- |
| Unit domain | Estimasi dB, radius ambang, kategori, Haversine, formatter, status waktu, sorting, filter URL | 18 lulus |
| Unit validasi | Payload valid, batas koordinat, rentang 80–160 dB, HTTP(S), urutan waktu, normalisasi slug | 11 lulus |
| Integration (historis) | Validasi/action tanpa session, create/update dengan SQLite test, query publik hanya `PUBLISHED` | 5 lulus sebelum migrasi PostgreSQL |
| E2E auth | Login benar, login salah generik, endpoint public sign-up ditolak | Lulus |
| E2E event | Create draft, edit/publish, tampil dan terpilih di publik, search URL, archive hilang dari publik | Lulus |
| E2E UI | Theme toggle, geolocation sukses/ditolak dengan mock, overflow 360/768/1024/1440 | Lulus |

Playwright berjalan serial karena alur event memang membentuk satu lifecycle data. Setup selalu memigrasikan database E2E baru sebelum server Next.js dimulai; tidak ada akses ke `dev.db` atau database production.

## Accessibility findings

Perbaikan yang diterapkan:

- Seluruh field form acara dan pengaturan utama kini memiliki pasangan `label`/`id`; tombol ikon memiliki accessible name.
- Error login memakai pesan generik dengan live alert. Error geolocation memakai live status.
- Sheet detail publik dan navigasi mobile memakai Radix Dialog agar focus trap, Escape, dan pemulihan focus ditangani primitive aksesibel.
- Peta memiliki accessible name dan ringkasan tekstual berisi judul, alamat, kota, dan dB setiap acara.
- Zona memiliki label dan simbol tekstual, bukan hanya warna.
- Focus ring global ditampilkan dan `prefers-reduced-motion` mematikan animasi/transisi non-esensial.
- Link sumber eksternal dan preview publik memakai `noopener noreferrer`.
- Uji browser memastikan tidak ada overflow dokumen pada 360, 768, 1024, dan 1440 px.

Audit struktur heading, keyboard control native, label form, dialog, dan token kontras dilakukan secara statis serta melalui alur Chromium. Tidak ada pelanggaran blocking yang ditemukan. Audit otomatis khusus seperti axe-core belum menjadi bagian harness; ini residual risiko rendah dan dapat ditambahkan saat CI FASE 12.

## Security findings

Perbaikan yang diterapkan:

- Better Auth `disableSignUp` aktif; bootstrap admin tidak lagi bergantung pada endpoint sign-up publik dan menolak admin kedua.
- Login memakai custom rate limit 5 request per 60 detik. Rate limit umum tetap 100 request per 60 detik.
- `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, dan `TRUSTED_ORIGINS` menjadi sumber origin tepercaya; CSRF/origin check bawaan tidak dimatikan.
- Setiap Server Action mutasi event/settings memanggil `requireAdmin`; input event, ID, status, key setting, dan value divalidasi server-side.
- Pesan exception Prisma/Better Auth tidak lagi diteruskan mentah ke browser. Log hanya mencatat nama kelas error pada boundary tersebut.
- Public DAL dan Prisma ditandai `server-only`; query publik tetap memfilter `PUBLISHED`.
- URL sumber dibatasi ke `http`/`https`; link eksternal memakai rel aman.
- Header `nosniff`, frame deny, referrer policy, dan permissions policy diterapkan global.
- Audit `NEXT_PUBLIC_*` hanya menemukan URL aplikasi, URL tile, dan attribution peta; tidak ada secret.
- `.env*`, database/WAL/SHM, coverage, `.tmp`, `test-results`, dan `playwright-report` diabaikan. `.env.example` secara eksplisit boleh dilacak dan hanya berisi contoh.

`npm audit` masih melaporkan GHSA-qx2v-qp2m-jg93 pada PostCSS 8.4.31 yang dibundel langsung oleh Next.js 16.2.10. Audit menyarankan downgrade breaking ke Next.js 9.3.3, sehingga tidak diterapkan. Tidak ada high/critical issue. Risiko moderate ini terbatas pada proses stringify CSS dengan input berbahaya; aplikasi tidak menerima atau membangun CSS dari input pengguna.

Residual security risk:

- Rate limit Better Auth memakai memory process dan akan reset saat restart; sesuai target satu instance, tetapi belum cocok untuk multi-instance.
- CSP penuh belum dipasang karena origin tile bersifat configurable dan kebijakan yang salah dapat mematikan Leaflet/Next. Header pertahanan lain sudah aktif; CSP nonce/dynamic tile allowlist perlu difinalkan pada FASE 12 bersama konfigurasi deployment.
- Secret/origin production wajib diberikan saat build/runtime. `.env.example` bukan credential nyata dan tidak boleh digunakan apa adanya.
- Route operasional `/api/health` dan verifikasi startup/deployment belum tersedia; keduanya tetap menjadi scope FASE 12, sehingga laporan ini tidak menyatakan production-ready final.

## Performance findings

- Leaflet tetap dimuat dengan `next/dynamic` dan `ssr: false`; loading fallback mempertahankan tinggi kontainer.
- Duplikasi instance Leaflet mobile/desktop ditemukan dan diperbaiki. Dashboard kini merender satu peta yang diposisikan ulang secara responsif dengan CSS.
- Animasi `flyTo` diganti `setView` non-animasi setelah E2E menemukan koordinat antara `NaN` pada transisi; ini juga mengurangi kerja animasi dan menghormati reduced motion.
- Query data tetap berada di Server Component/DAL, sedangkan client boundary dipakai untuk filter, URL state, geolocation, form, dialog, dan Leaflet.
- Blur dekoratif tidak ditumpuk pada daftar kartu; blur dipertahankan hanya pada header/overlay utama.
- Build production berhasil untuk seluruh route. Bundle analyzer tidak ditambahkan karena tidak ada indikasi regresi dependency baru selain Playwright yang hanya dev dependency.

## Perbaikan tambahan yang dipicu test

- Memperbaiki `package.json` yang memiliki kurung penutup ekstra sehingga npm semula tidak dapat berjalan.
- Memperbaiki validasi URL yang sebelumnya dapat melempar exception saat form belum lengkap.
- Menstabilkan theme toggle agar label SSR/client tidak menyebabkan hydration mismatch.
- Menambahkan guard koordinat finite pada peta.
- Menambah konfigurasi standalone dan security headers.

## Residual risk dan keputusan release

Tidak ada blocker high/critical dan seluruh acceptance command lulus. Dua advisory moderate transitive, ketiadaan axe automation, serta CSP deployment dicatat untuk FASE 12. Dengan batasan tersebut, quality gate FASE 11 lulus; klaim production-ready final tetap menunggu artefak dan verifikasi operasional FASE 12.
