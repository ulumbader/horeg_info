# Persiapan Repository GitHub

Dokumen ini mencatat langkah manual saat repository SOUND HOREG.INFO siap dipublikasikan. Pembuatan file konfigurasi ini tidak membuat remote, repository, commit, atau upload apa pun.

## Identitas repository

- Nama tampilan proyek: **SOUND HOREG.INFO**.
- Slug repository yang disarankan: `sound-horeg-info`.
- Deskripsi: `Peta open-source peringatan dini dan estimasi dampak kebisingan acara sound horeg.`
- Topics yang disarankan: `nextjs`, `typescript`, `openstreetmap`, `leaflet`, `prisma`, `supabase`, `early-warning-system`, `indonesia`, `open-source`.

## Sebelum repository dijadikan publik

1. Periksa `git status` dan review seluruh file yang akan ditambahkan.
2. Pastikan `.env`, `.env.local`, database, backup, log, `.next`, report test, dan generated service worker tidak terlacak.
3. Jalankan pencarian secret serta review manual connection string, token, password, cookie, dan credential lama pada seluruh histori yang akan dipublikasikan.
4. Jalankan `npm run lint`, `npm run typecheck`, `npm run test:run`, dan `npm run build`.
5. Verifikasi bahwa data seed hanya berupa data demo yang jelas, bukan data pribadi atau koordinat yang diklaim sebagai data nyata.
6. Pastikan pemilik hak cipta pada `LICENSE` sudah sesuai.

## Pengaturan GitHub setelah repository dibuat

1. Jadikan repository public dan pilih branch default yang benar.
2. Aktifkan branch protection/ruleset: wajibkan pull request dan status check `Lint, typecheck, test, and build` sebelum merge.
3. Aktifkan **Private vulnerability reporting**, Dependabot alerts, dan Dependabot security updates.
4. Batasi permission `GITHUB_TOKEN` ke read-only secara default. Workflow CI saat ini sudah menetapkan `contents: read`.
5. Tambahkan topic, deskripsi, dan social preview tanpa memasukkan data pribadi.
6. Simpan secret deployment hanya di Vercel/Supabase atau GitHub Environments yang diperlukan; jangan menyalinnya ke source code.
7. Jangan menjalankan migration production dari beberapa build paralel. Jalankan `prisma migrate deploy` secara eksplisit menggunakan koneksi direct.

## CI dan database test

Workflow `.github/workflows/ci.yml` menjalankan lint, typecheck, unit test, dan production build tanpa deployment. Integration dan E2E PostgreSQL sengaja tidak diberi credential pada workflow publik awal.

Jika integration/E2E akan diaktifkan di GitHub Actions, gunakan project atau schema PostgreSQL khusus test dengan guard yang sudah tersedia. Jangan pernah mengisi `TEST_DATABASE_URL` atau `E2E_DATABASE_URL` dengan database production.
