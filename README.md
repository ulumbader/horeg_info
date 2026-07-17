# SOUND HOREG.INFO

SOUND HOREG.INFO adalah aplikasi open-source untuk memetakan acara sound horeg dan menampilkan estimasi zona dampak kebisingan. Aplikasi membantu masyarakat melihat jadwal acara, jarak dari lokasi pengguna, serta estimasi tingkat suara berdasarkan model propagasi sederhana.

> Hasil yang ditampilkan adalah estimasi, bukan pengukuran kebisingan aktual. Bangunan, topografi, cuaca, arah speaker, penghalang, dan kondisi lapangan tidak dimodelkan.

## Fitur utama

- Peta acara interaktif dengan marker dan zona estimasi 75/65/55 dB.
- Filter acara mendatang, sedang berlangsung, dan telah lewat.
- Pemeriksaan lokasi pengguna yang diproses hanya di browser.
- Detail sumber acara, estimasi jarak, audio opsional, like, dan komentar anonim.
- Panel admin tunggal untuk CRUD, publikasi, arsip, map picker, moderasi, dan audit.
- Tema gelap/terang, tampilan responsif, dan dukungan PWA.

## Teknologi

- Next.js 16 App Router, React 19, dan TypeScript strict.
- Tailwind CSS, Radix UI, Lucide, dan `next-themes`.
- React Leaflet, Leaflet, dan OpenStreetMap.
- Prisma ORM dengan Supabase PostgreSQL.
- Better Auth untuk autentikasi admin tunggal.
- Vitest dan Playwright.

## Menjalankan secara lokal

Prasyarat:

- Node.js 20 atau lebih baru.
- npm.
- Database PostgreSQL development yang terisolasi.

Salin `.env.example` menjadi `.env.local`, lalu isi koneksi dan secret lokal. Jangan gunakan database production untuk development atau pengujian.

```bash
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Aplikasi tersedia di `http://localhost:3000`. Admin pertama dibuat sekali melalui:

```bash
npm run bootstrap
```

Hapus `ADMIN_BOOTSTRAP_PASSWORD` dari environment setelah bootstrap berhasil. Pendaftaran publik selalu dinonaktifkan.

## Pemeriksaan kualitas

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Integration test membutuhkan `TEST_DATABASE_URL` dan `TEST_DIRECT_URL` dengan schema PostgreSQL terisolasi berawalan `vitest`. E2E membutuhkan `E2E_DATABASE_URL` dan `E2E_DIRECT_URL` yang tidak mengarah ke production.

## Dokumentasi

- [Model estimasi kebisingan](docs/NOISE_MODEL.md)
- [Database](docs/DATABASE.md)
- [Autentikasi](docs/AUTH.md)
- [Deployment Vercel dan Supabase](docs/DEPLOY_VERCEL.md)
- [Persiapan repository GitHub](docs/GITHUB_SETUP.md)

## Berkontribusi dan keamanan

Kontribusi dipersilakan. Baca [CONTRIBUTING.md](CONTRIBUTING.md) dan [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) sebelum membuka pull request.

Jangan melaporkan kerentanan atau membagikan secret melalui issue publik. Ikuti [SECURITY.md](SECURITY.md).

## Lisensi

Kode proyek tersedia di bawah [MIT License](LICENSE).
