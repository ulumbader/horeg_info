# Database Workflow

Database production adalah Supabase PostgreSQL. Migration SQLite lama dipertahankan di `prisma/migrations-sqlite` hanya sebagai histori; Prisma Migrate aktif memakai baseline PostgreSQL di `prisma/migrations`.

- **Generate Client**: `npm run db:generate`
- **Development Migration**: `npm run db:migrate` (runs `prisma migrate dev`)
- **Production Migration**: `npm run db:migrate:deploy` (runs `prisma migrate deploy`)
- **Seed Data**: `npm run db:seed`
- **Studio (GUI)**: `npm run db:studio`

Gunakan `DATABASE_URL` pooled untuk runtime dan `DIRECT_URL` non-pooling untuk migration. Jangan gunakan `db push` pada production. Jalankan `prisma migrate deploy` secara eksplisit sebelum deployment pertama atau saat ada migration baru.

Migration `20260715090000_event_engagement` menambahkan komentar dan like per acara. Penghapusan komentar oleh admin memakai `deletedAt` (soft delete) agar histori moderasi tetap tersedia; query dan hitungan publik wajib hanya membaca komentar dengan `deletedAt = null`.

Test integration wajib memakai `TEST_DATABASE_URL` dan `TEST_DIRECT_URL` dengan query parameter `schema=vitest...`. E2E memakai `E2E_DATABASE_URL` dan `E2E_DIRECT_URL` dengan schema berawalan `e2e`. Guard test menolak schema lain agar production tidak dapat ter-reset tanpa sengaja.

Panduan deployment dan transfer data tersedia di `docs/DEPLOY_VERCEL.md`.

## Penyimpanan MP3 acara

File MP3 acara disimpan langsung pada kolom BLOB `SoundEvent.audioData`, dengan batas aplikasi 10 MB per acara. Metadata file disimpan pada `audioFileName`, `audioMimeType`, dan `audioSize`. Mengganti file akan menimpa BLOB lama, menghapus musik akan mengosongkan seluruh kolom audio, dan menghapus acara otomatis menghapus BLOB bersama row tersebut.

Konsekuensi operasional:

- Ukuran database dan backup Supabase mencakup seluruh MP3.
- SQLite lama tetap harus disimpan sebagai backup sampai verifikasi transfer selesai.
- Pantau ukuran database PostgreSQL dan durasi backup ketika jumlah acara bertambah.
- Query daftar dan DTO publik tidak mengambil kolom BLOB; audio dibaca hanya melalui endpoint streaming byte-range.
