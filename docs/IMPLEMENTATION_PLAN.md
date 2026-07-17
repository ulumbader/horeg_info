# IMPLEMENTATION PLAN - SOUND HOREG.INFO

## Kondisi Awal Proyek
- Proyek telah diinisiasi dengan Next.js App Router.
- Terdapat file konfigurasi standar (`package.json`, `next.config.ts`, `tsconfig.json`).
- Tailwind CSS v4 sudah diatur dengan PostCSS (`postcss.config.mjs`).
- Direktori sumber menggunakan direktori `app/` (tidak memakai `src/` karena di konfigurasi TS `paths` diset ke `"@/*": ["./*"]` dan terdapat folder `app/` secara langsung di root).

## Versi Terdeteksi
- Next.js: 16.2.10
- React: 19.2.4
- TypeScript: ^5
- Tailwind CSS: ^4
- Node.js Requirement: ^20 (berdasarkan `@types/node`)

## Struktur Direktori Target
Sesuai kondisi proyek, kita akan menempatkan kode mengikuti akar root yang ada atau menyesuaikan dengan preferensi Next.js (bisa memindahkan `app/` ke `src/app/` jika diperlukan saat implementasi struktural FASE 01). Secara logis, struktur akan seperti berikut:
- `app/` (atau `src/app/`): Route Next.js (publik, admin, API)
- `components/ui/`: Komponen UI primitif (shadcn/Radix/glass panel)
- `components/shared/`: Komponen yang dipakai publik & admin
- `components/public/`: Komponen spesifik halaman publik
- `components/admin/`: Komponen spesifik halaman admin
- `lib/`: Utility, konstanta, dan konfigurasi
- `lib/validators/`: Zod schemas
- `lib/domain/`: Fungsi domain murni (perhitungan dB, geolokasi)
- `server/`: Data Access Layer (DAL) dan action server-only
- `types/`: Definisi TypeScript
- `docs/`: Dokumentasi (termasuk dokumen ini)

## Daftar Dependency (Rencana)
**Production:**
- `lucide-react`: Ikon UI.
- `next-themes`: Manajemen tema (dark/light).
- `zod`: Validasi schema server & client.
- `date-fns`: Manipulasi dan format tanggal (id-ID).
- `sonner`: Toast notifications.
- `@prisma/client`: ORM database.
- `better-auth`: Autentikasi server-side.
- `leaflet`, `react-leaflet`: Library peta dan komponen react.
- `@radix-ui/react-*`: Primitif komponen (dialog, popover, dll.).
- `react-hook-form`, `@hookform/resolvers`: Formulir (admin).

**Development:**
- `prisma`: Prisma CLI untuk migration & studio.
- `vitest`, `@vitest/ui`: Unit/integration testing.
- `@playwright/test`: End-to-end testing.
- `@types/leaflet`: TypeScript definition untuk leaflet.

## Rencana Model Data (Prisma)
- **SoundEvent**: id, slug (unik), title, summary, description, venueName, address, district, city, province, latitude, longitude, sourceDb, sourcePlatform, sourceUrl, sourceAccount, startAt, endAt, publicationStatus, featured, publishedAt, createdAt, updatedAt.
- **AuditLog**: id, eventType, description, createdAt.
- **AppSetting**: (Opsional) untuk konfigurasi global tunggal.
*(Model BetterAuth akan ditambahkan secara otomatis).*

## Rencana Route
**Publik:**
- `/` - Dashboard EWS (Daftar Acara & Peta).
- `/?status=upcoming|past` - Filter status acara.
- `/?date=YYYY-MM-DD` - Filter tanggal.
- `/?event=<slug>` - URL persisten untuk acara terpilih.
- `/tentang` - Halaman informasi dan disclaimer (bila diperlukan).

**Admin (Protected):**
- `/admin/login` - Halaman login admin tunggal.
- `/admin` - Dashboard admin (ringkasan acara).
- `/admin/events` - Daftar semua acara, filter, pagination.
- `/admin/events/new` - Form tambah acara baru.
- `/admin/events/[id]/edit` - Form edit acara.
- `/admin/settings` - Pengaturan admin (ubah password, dsb.).

**API:**
- `/api/auth/[...all]` - Endpoint Better Auth.
- `/api/health` - Endpoint health check ringan.

## Rencana Pembagian Server Component & Client Component
- **Server Component (Default):** Halaman layout, dashboard publik/admin awal, pemanggilan DAL untuk query Prisma (bukan lewat fetch API internal).
- **Client Component (`"use client"`):** Komponen Peta (Leaflet via `next/dynamic`), ThemeToggle, Geolocation API handler, formulir admin, UI list interaktif dengan filter.

## Rencana Autentikasi Admin Tunggal
- Menggunakan `better-auth` dengan adapter Prisma.
- `disableSignUp: true` (tidak ada pendaftaran terbuka).
- Autorisasi dicek pada server untuk setiap rute dan action `/admin`.
- Akun pertama kali dibuat menggunakan script CLI (Bootstrap) tanpa membuka route pendaftaran.

## Rencana Peta dan Perhitungan Noise Zone
- Leaflet untuk tile map dasar dan interaksi peta.
- Marker diletakkan berdasarkan latitude/longitude setiap acara.
- Perhitungan berdasarkan rumus $L(r) = L_{source} - 20 \times \log_{10}(r)$.
- Ambang kebisingan 75 dB, 65 dB, 55 dB digambarkan dalam radius bergradasi/fill yang bervariasi untuk visualisasi Zona Kebisingan di Peta.
- Geolokasi browser digunakan (berjalan murni lokal) untuk mengetahui jarak user dengan event via Haversine Formula. Koordinat tidak dikirim ke server.

## Rencana Responsive Desktop/Tablet/Mobile
- **Desktop:** Layout 3 kolom/area (List, Map utama, Detail Info).
- **Tablet:** Map dan List menjadi prioritas. Detail tampil sebagai Overlay/Drawer/Sheet.
- **Mobile:** Penggunaan `100dvh`. Peta tampil di atas, daftar acara di bawahnya (tanpa overflow horizontal). Detail informasi dibuka melalui Bottom Sheet.

## Rencana Testing
- **Unit Test (Vitest):** Fungsi domain (estimasi radius dB, perhitungan jarak Haversine, state waktu/tanggal).
- **Integration Test:** Server action (validasi status publik vs admin auth check).
- **E2E Test (Playwright):** Alur autentikasi admin, pembuatan draft hingga rilis publik acara (testing DOM publik dan map rendering placeholder).

## Rencana Vercel, Supabase PostgreSQL, Migration, Backup, Restore, dan Health Check
- **Vercel:** Deploy Next.js melalui Git integration atau Vercel CLI.
- **Supabase PostgreSQL:** Runtime memakai transaction pooler dan Prisma Migrate memakai direct/non-pooling connection.
- **Migration:** Jalankan `prisma migrate deploy` secara eksplisit sebelum deployment yang membutuhkan perubahan schema.
- **Backup:** Gunakan fasilitas backup Supabase dan pertahankan SQLite lama sampai transfer diverifikasi.
- **Health Check:** Endpoint API tanpa rahasia untuk pemantauan deployment.

## Risiko Teknis dan Mitigasinya
- **Isolasi Leaflet:** React 19 / Next.js SSR bisa bentrok dengan modul peta. Mitigasi: Bungkus peta secara ketat dengan `next/dynamic (ssr: false)`.
- **Kinerja Concurrent Database:** Gunakan Supabase transaction pooler untuk traffic serverless dan direct connection hanya untuk migration/administrasi.
- **Mismatch UI/CSS Theme:** Dark/light mode flash. Mitigasi: Konfigurasi `next-themes` secara ketat dengan `suppressHydrationWarning`.

## Checklist FASE 01–13
- [ ] **FASE 01:** Fondasi Proyek, Dependency, Design Tokens, dan Struktur
- [x] **FASE 02:** Prisma, schema, migration, seed, dan DAL dasar; kemudian dimigrasikan ke Supabase PostgreSQL.
- [ ] **FASE 03:** Better Auth dan Admin Tunggal
- [ ] **FASE 04:** Modul Domain: Waktu, Noise, Jarak, Filter, dan Unit Test
- [ ] **FASE 05:** Shell Halaman Publik yang Responsif
- [ ] **FASE 06:** Leaflet, Marker, Zona Dampak, dan Map Picker Foundation
- [ ] **FASE 07:** Geolocation dan Penyempurnaan Interaksi Publik
- [ ] **FASE 08:** Admin Shell dan Dashboard
- [ ] **FASE 09:** CRUD Acara, Map Picker, Publish, Archive, dan Audit
- [ ] **FASE 10:** Pengaturan Admin, Ganti Password, dan Audit UI
- [ ] **FASE 11:** End-to-end Testing dengan Playwright
- [ ] **FASE 12:** Keamanan, Health Check, dan Edge Cases
- [ ] **FASE 13:** Deployment Production, Docker, dan Backup Script
