# Deployment Vercel dengan Supabase PostgreSQL

Proyek ini memakai Supabase PostgreSQL ketika dijalankan di Vercel. SQLite lama hanya menjadi sumber transfer satu kali dan tidak dipakai oleh runtime production.

## 1. Hubungkan resource Supabase

Di Vercel, buka resource `supabase-horeg-db`, pilih **Connect Project**, lalu hubungkan ke project SOUND HOREG.INFO untuk environment Production dan Preview.

Integrasi menyediakan `POSTGRES_PRISMA_URL` dan `POSTGRES_URL_NON_POOLING`. Tambahkan dua alias pada Project Settings tanpa memasukkan nilainya ke source code:

```env
DATABASE_URL=<nilai POSTGRES_PRISMA_URL>
DIRECT_URL=<nilai POSTGRES_URL_NON_POOLING>
```

- `DATABASE_URL` adalah transaction pooler untuk runtime serverless.
- `DIRECT_URL` adalah koneksi non-pooling untuk Prisma Migrate dan transfer data.
- Gunakan database atau schema terpisah untuk Preview agar deployment preview tidak menulis data production.

Tambahkan juga environment aplikasi dari `.env.example`. URL auth/origin harus memakai domain HTTPS production yang sebenarnya.

### Identitas anonim untuk like dan komentar

Set `ANONYMOUS_ID_SECRET` sebagai secret server-only acak minimal 32 karakter pada Production dan Preview. Nilai ini menandatangani cookie browser anonim untuk menjaga satu like per acara dan rate limit komentar; jangan memakai prefix `NEXT_PUBLIC_`. Jika tidak diisi aplikasi memakai `BETTER_AUTH_SECRET`, tetapi secret terpisah direkomendasikan agar rotasi auth dan engagement tidak saling memengaruhi.

### Pencarian lokasi admin

Pemilih lokasi pada form admin melakukan pencarian eksplisit melalui route internal `/api/admin/geocode`. Konfigurasikan provider server-only berikut:

```env
GEOCODING_BASE_URL=https://nominatim.openstreetmap.org
GEOCODING_USER_AGENT=SoundHoregEWS/1.0 (email-kontak-operasional@example.com)
```

Default Nominatim publik hanya sesuai untuk penggunaan ringan oleh admin tunggal. Aplikasi tidak melakukan autocomplete, membatasi request provider sekitar satu request per detik per instance, menyimpan cache sementara, dan selalu membatasi hasil ke Indonesia. Untuk trafik lebih besar, arahkan `GEOCODING_BASE_URL` ke instance Nominatim sendiri atau provider yang kompatibel.

## 2. Terapkan baseline PostgreSQL

Link direktori lokal ke project Vercel, lalu jalankan migration menggunakan environment Production:

```powershell
npx vercel link
npx vercel env run -e production -- npm run db:migrate:deploy
```

Migration tidak dijalankan otomatis saat build untuk mencegah beberapa deployment menjalankan DDL secara bersamaan. Ini juga menerapkan migration `20260715090000_event_engagement` untuk tabel `EventComment`, `EventLike`, constraint penulis, dan index engagement.

## 3. Transfer data SQLite lama

Hentikan server lokal agar tidak ada mutasi admin selama transfer. Script bersifat idempotent, membaca snapshot SQLite secara read-only, tidak menghapus row target, dan menolak database target yang sudah memiliki admin berbeda.

Validasi sumber tanpa menulis target:

```powershell
$env:SQLITE_SOURCE_PATH = "./prisma/dev.db"
$env:MIGRATION_DRY_RUN = "true"
npx vercel env run -e production -- npm run db:transfer:sqlite
Remove-Item Env:MIGRATION_DRY_RUN
```

Setelah jumlah row diperiksa, jalankan transfer:

```powershell
$env:CONFIRM_SQLITE_TO_POSTGRES_MIGRATION = "YES"
npx vercel env run -e production -- npm run db:transfer:sqlite
Remove-Item Env:CONFIRM_SQLITE_TO_POSTGRES_MIGRATION
```

Jangan hapus SQLite lama sampai login admin, daftar acara, audit, analytics, dan streaming audio sudah diverifikasi pada production. Session row ikut dipindahkan, tetapi admin tetap perlu login ulang karena domain cookie berubah.

## 4. Deploy

Setelah migration dan transfer berhasil:

```powershell
npx vercel deploy
npx vercel deploy --prod
```

Atau push branch ke repository Git yang terhubung. Vercel akan membuat Preview untuk branch non-production dan Production untuk branch utama.

## 5. Verifikasi

Periksa minimum:

- `/` menampilkan acara published.
- `/admin/login` dapat login dengan credential lama.
- Create, update, publish, archive, dan analytics dapat menulis PostgreSQL.
- Audio lama dapat di-stream dengan byte range.
- Tidak ada secret, `.env`, database, atau backup yang ter-commit.

## Batas upload audio

BLOB MP3 lama tetap dipindahkan ke kolom PostgreSQL `BYTEA`. Namun request Vercel Functions memiliki batas platform 4,5 MB, sehingga upload MP3 baru berukuran hingga 10 MB belum production-ready di Vercel. Migrasi lanjutan ke Supabase Storage/direct upload diperlukan untuk mempertahankan batas 10 MB.
