# Berkontribusi ke SOUND HOREG.INFO

Terima kasih telah membantu mengembangkan SOUND HOREG.INFO. Kontribusi kode, dokumentasi, laporan bug, dan usulan aksesibilitas dipersilakan.

## Sebelum mulai

1. Cari issue yang sudah ada agar pekerjaan tidak duplikat.
2. Untuk perubahan besar atau arsitektural, buka proposal terlebih dahulu.
3. Jangan memasukkan credential, data pribadi, database, backup, atau lokasi pengguna ke issue maupun commit.
4. Gunakan Bahasa Indonesia untuk antarmuka dan pesan error pengguna.
5. Pertahankan keputusan arsitektur di `AGENTS.md`.

## Setup development

Gunakan Node.js 20+, npm, dan PostgreSQL development yang terisolasi.

```bash
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

Salin `.env.example` menjadi `.env.local` dan gunakan nilai lokal. Jangan pernah memakai database production untuk test.

## Standar perubahan

- Server Component adalah default; gunakan Client Component pada boundary terkecil.
- Semua input eksternal wajib divalidasi di server.
- Semua mutasi admin wajib memverifikasi session di server.
- Koordinat geolocation pengguna tetap diproses di browser.
- Jangan menyebut estimasi kebisingan sebagai pengukuran aktual.
- Tambahkan migration baru; jangan mengubah migration yang sudah diterapkan.
- Tambahkan atau perbarui test untuk perilaku yang berubah.
- Catat perubahan aktual pada bagian `[Unreleased]` di `CHANGELOG.md`.

## Sebelum membuka pull request

Jalankan:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

Jelaskan perubahan, cara verifikasi, risiko, migration atau environment variable baru, serta sertakan tangkapan layar untuk perubahan UI. Pastikan diff tidak memuat `.env`, credential, database, backup, log, atau artefak build.

Dengan mengirim kontribusi, Anda menyetujui bahwa kontribusi tersebut dilisensikan di bawah MIT License proyek ini.
