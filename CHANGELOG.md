# Changelog

Semua perubahan penting pada proyek **SOUND HOREG.INFO** dicatat di file ini.

Format mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) dan versi proyek mengikuti Semantic Versioning ketika rilis mulai dibuat.

---

## Aturan untuk AI/Coding Agent

1. Baca changelog sebelum memulai pekerjaan.
2. Catat perubahan aktual pada bagian `[Unreleased]` dalam sesi yang sama.
3. Gunakan kategori:
   - `Added`
   - `Changed`
   - `Fixed`
   - `Security`
   - `Deprecated`
   - `Removed`
   - `Documentation`
4. Sebutkan route, migration, environment variable, atau breaking change yang terdampak.
5. Jangan menghapus atau menulis ulang histori.
6. Jangan menulis entri kabur seperti “update project” atau “fix code”.
7. Saat membuat rilis, pindahkan entri relevan dari `[Unreleased]` ke versi baru dan tambahkan tanggal `YYYY-MM-DD`.
8. Bila pemeriksaan gagal, catat masalah pada laporan agent; jangan mencatat fitur sebagai selesai.

---

## [Unreleased]

### Added

- Menambahkan tombol share pada panel rincian acara publik dengan dialog glass terpusat, blur layar penuh, animasi masuk/keluar bergaya iOS, focus trap, tombol tutup, target WhatsApp/Facebook/Instagram/X/Telegram, serta copy URL acara yang stabil. Pada mobile, bottom sheet rincian ditutup sementara selama dialog aktif dan dipulihkan otomatis setelah dialog ditutup; Instagram menggunakan native share sheet dengan fallback salin tautan.
- Menambahkan konfigurasi open-source dan GitHub untuk nama proyek **SOUND HOREG.INFO**: MIT License, panduan kontribusi, kebijakan keamanan, kode etik, issue forms, pull request template, Dependabot, atribut/editor lintas platform, serta panduan publikasi repository tanpa membuat remote atau melakukan upload.
- Menambahkan workflow `.github/workflows/ci.yml` read-only untuk menjalankan lint, typecheck, Vitest, dan production build pada push atau pull request tanpa deployment maupun akses database production.
- Menambahkan engagement per acara melalui migration `20260715090000_event_engagement`: like idempotent per browser, komentar anonim plain-text, label komentar ADMIN, pagination komentar, hitungan publik, serta panel komentar responsif yang menggantikan informasi acara melalui `?panel=comments`.
- Menambahkan endpoint Node.js `GET /api/events/[slug]/engagement`, `GET/POST /api/events/[slug]/comments`, dan `PUT /api/events/[slug]/like`, dilindungi cookie anonim bertanda tangan, pemeriksaan same-origin, honeypot, request UUID idempoten, dan rate limit tanpa Cloudflare Turnstile selama pengembangan.
- Menambahkan halaman `/admin/comments` agar admin dapat menambah komentar berlabel ADMIN, mengedit hanya komentar ADMIN, melakukan soft-delete komentar ADMIN/anonim, memfilter komentar, dan mencatat mutasi ke audit log.
- Menambahkan environment server-only opsional `ANONYMOUS_ID_SECRET` dengan fallback aman ke `BETTER_AUTH_SECRET`, dokumentasi penggunaan, unit/integration test engagement, serta Playwright untuk alur like, komentar anonim, dan moderasi ADMIN.
- Menambahkan pencarian alamat admin-only pada form acara melalui route Node.js `/api/admin/geocode`, dengan validasi query, pembatasan hasil Indonesia, timeout, rate limit, cache sementara, konfigurasi provider server-only, dan atribusi OpenStreetMap.
- Menambahkan pemilih lokasi acara terkontrol yang mendukung klik peta, marker draggable, koordinat manual responsif, tombol pencarian dari alamat form, state kosong/loading/error, serta test pemetaan respons geocoding.
- Menambahkan smart preload musik acara secara berurutan saat browser idle, dengan prioritas pada acara dari URL terpilih, deduplikasi URL, pemanfaatan cache HTTP, serta penghematan otomatis ketika Data Saver atau koneksi 2G terdeteksi.
- Menambahkan baseline migration PostgreSQL `20260714050000_postgresql_baseline`, konfigurasi `DIRECT_URL`, script idempotent `db:transfer:sqlite` dengan dry-run/konfirmasi/admin guard, dependency migrasi read-only `better-sqlite3`, serta panduan `docs/DEPLOY_VERCEL.md` untuk Supabase dan Vercel.
- Menambahkan fitur analitik pada panel admin: tracking **jumlah kunjungan halaman** (page views) harian dan **pengunjung online real-time**. Terdiri dari 2 model Prisma baru (`PageView` dengan agregasi harian `@@unique([path, date])` dan `ActiveVisitor` dengan heartbeat 30 detik), migration `20260714020235_add_analytics_models`, DAL `src/server/dal/analytics.ts` dengan `server-only`, 3 API endpoint (`POST /api/analytics/pageview`, `POST /api/analytics/heartbeat`, `GET /api/analytics/stats` admin-only), client hook `useAnalytics` yang mengirim page view sekali per mount dan heartbeat periodik hanya saat tab visible, serta widget dashboard admin yang menampilkan pengunjung online (live pulse indicator), kunjungan hari ini, total sepanjang waktu, dan mini bar chart 7 hari terakhir (CSS murni) dengan polling 15 detik. Tidak ada data identifikasi pengunjung yang disimpan — hanya session ID anonim dari `crypto.randomUUID()` di `sessionStorage`.
- Menambahkan upload MP3 opsional per acara sebagai BLOB SQLite melalui migration `20260714020000_store_event_audio_blob`, validasi ekstensi/MIME/signature dan batas 10 MB di server, aksi keep/replace/remove, preview admin, endpoint streaming byte-range `/api/events/[id]/audio`, serta player publik global yang dipicu hanya oleh klik eksplisit kartu/marker. Kolom URL dari iterasi sebelumnya dipertahankan sebagai legacy nullable agar migration tidak menghapus data.
- Menambahkan pusat notifikasi bahaya pada header publik: hasil zona dampak hanya disimpan setelah pengguna menekan Cek Lokasi, dipersistenkan secara lokal tanpa koordinat pengguna, di-upsert per acara, dan dapat dibuka kembali untuk memilih acara di peta atau dihapus seluruhnya.
- Menambahkan sistem motion bergaya iOS dengan token durasi/easing, transisi halaman berbasis React View Transitions, animasi spring ringan pada card dan kontrol, transisi dialog/sheet, notifikasi Sonner glass, serta animasi masuk/keluar peringatan kedekatan yang menghormati `prefers-reduced-motion`.
- **[FASE 11]** Menambahkan harness Vitest dengan database `prisma/vitest.db` terisolasi dan 34 test unit/integration untuk domain kebisingan, Haversine, temporal, filter, slug, validasi, authorization, mutasi, dan filter query publik.
- **[FASE 11]** Menambahkan Playwright 1.61.1 dengan database `prisma/e2e.db` terisolasi dan 5 test Chromium yang mencakup login benar/salah, signup tertutup, lifecycle draft-publish-archive, filter/select, tema, empat viewport, serta mock geolocation sukses/ditolak.
- **[FASE 11]** Menambahkan `docs/QUALITY_REPORT.md`, script `test`, `test:run`, `test:e2e`, `test:e2e:setup`, dan `check`.
- **[FASE 11]** Menambahkan security headers global dan `output: "standalone"` pada `next.config.ts`.

### Changed

- Mengubah identitas metadata repository, manifest PWA, label antarmuka, dan package dari `horeg_ews`/`Sound Horeg EWS` menjadi `SOUND HOREG.INFO`/`sound-horeg-info`, serta memperbarui README publik dengan setup, batasan estimasi, dokumentasi, kontribusi, keamanan, dan lisensi. Identifier teknis persisten tetap dipertahankan untuk kompatibilitas.
- **Breaking:** Mengganti database runtime Prisma dan adapter Better Auth dari SQLite lokal menjadi Supabase PostgreSQL. Migration SQLite lama dipindahkan ke `prisma/migrations-sqlite`; runtime kini membutuhkan `DATABASE_URL` pooled dan `DIRECT_URL` non-pooling.
- Mengubah integration/E2E database menjadi schema PostgreSQL test terisolasi melalui `TEST_DATABASE_URL`/`TEST_DIRECT_URL` dan `E2E_DATABASE_URL`/`E2E_DIRECT_URL`; test database dilewati bila credential test tidak tersedia dan guard menolak reset schema production.
- Mengubah legenda peta pada mobile menjadi panel ringkas yang dibuka melalui tombol hamburger 44 px dengan state `aria-expanded`; legenda desktop tetap selalu terlihat.
- Memadatkan floating music player pada mobile dengan lebar maksimum yang lebih pendek, margin viewport lebih lega, metadata sekunder tersembunyi pada layar kecil, dan konten internal yang tidak dapat melampaui panel.

### Fixed

- Mengecualikan service worker Serwist hasil generate dari ESLint dan memodelkan nilai awal `datetime-local` form acara sebagai input tanggal bertipe aman tanpa `any`, sehingga quality gate GitHub tidak gagal pada artefak generated atau cast form lama.
- Memperbaiki kegagalan typecheck build pada halaman `/admin/events` akibat prop `title` yang tidak didukung tipe ikon Lucide untuk indikator musik pengiring.
- Menambahkan deklarasi `data-scroll-behavior="smooth"` pada root layout agar navigasi Next.js 16 menangani global smooth scrolling tanpa warning runtime.
- Memperbaiki lint widget analitik admin dengan menjadwalkan fetch awal dari effect serta membersihkan timer dan interval saat unmount.
- Menghapus marker default Surabaya pada acara baru; peta admin kini membuka tampilan Indonesia tanpa marker sampai koordinat valid benar-benar dipilih.
- Memperbaiki console error React 19/Next.js 16 `Encountered a script tag while rendering React component` dengan compatibility provider tanpa tag script pada client render dan bootstrap tema melalui `next/script` `beforeInteractive`; persistensi, sinkronisasi antar-tab, preferensi sistem, color scheme, dan toggle light/dark tetap dipertahankan.
- Memperbaiki konfigurasi development pascamigrasi PostgreSQL yang masih membaca `DATABASE_URL` SQLite dengan menyediakan environment Supabase development terisolasi untuk runtime lokal.
- Memperbaiki runtime error Leaflet `Invalid LatLng object: (NaN, NaN)` saat memilih acara dari Daftar mobile dengan memperbarui ukuran peta setelah panel terlihat, mengganti transisi fokus ke `setView` yang stabil, dan menolak koordinat non-finite atau di luar rentang sebelum mencapai Leaflet.
- Menambahkan tombol Cari eksplisit dengan target sentuh 44 px pada search bar mobile agar pencarian dapat dikirim tanpa bergantung pada tombol keyboard virtual; sinkronisasi filter memakai History API agar perpindahan otomatis ke Daftar tidak direset oleh navigasi route.
- Memperbaiki pencarian dashboard pada mobile agar otomatis membuka tampilan Daftar setelah pencarian dikirim serta menampilkan jumlah hasil atau pesan tidak ditemukan yang aksesibel.
- Memperbaiki panel detail acara desktop dan mobile yang hilang seketika saat ditutup dengan mempertahankan data selama exit animation; panel desktop kini ikut masuk/keluar dari kanan sambil mengubah lebar secara halus, sedangkan bottom sheet mobile menyelesaikan animasi turun sebelum dilepas dari DOM.
- Memperbaiki bug panel detail acara "mental" dan tidak bisa ditutup karena geolocation auto-select effect terus memilih ulang acara terdekat setiap kali `selectedSlug` di-null-kan. Ditambahkan `useRef` guard agar auto-select hanya berjalan sekali saat geolocation pertama kali berhasil (`DashboardClient.tsx`).

### Added

- Menambahkan gesture swipe-down-to-close pada bottom sheet detail acara di mobile view (`EventDetail.tsx`). Handle bar dan area konten (saat di posisi scroll teratas) merespons swipe ke bawah dengan visual translateY mengikuti jari, lalu menutup panel saat melewati threshold 100px.
- Mengubah marker peta dari lingkaran kecil menjadi ikon drop-pin SVG bergaya maps (`PublicMap.tsx`). Pin terpilih berwarna merah dan lebih besar, pin lainnya berwarna teal.
- Lingkaran zona dampak suara (radius 75/65/55 dB) kini ditampilkan untuk **semua** acara sekaligus, bukan hanya acara terpilih. Zona acara yang tidak dipilih ditampilkan dengan opacity lebih rendah agar tidak mengganggu. Legenda zona selalu tampil.
- Peta kini melakukan animasi `flyTo` saat lokasi pengguna pertama kali terdeteksi (zoom ke level 14) dan saat memilih acara (zoom ke level 13). Sebelumnya `setView` tanpa animasi membuat transisi terasa instan dan membingungkan (`PublicMap.tsx`).
- Redesain layout mobile: mengganti pola scroll vertikal (peta di atas, daftar tersembunyi di bawah) menjadi **tab toggle Peta/Daftar** mengambang di bawah layar. Pengguna cukup tap untuk berganti tampilan tanpa scroll. Memilih acara dari daftar otomatis beralih ke tampilan peta. Layout desktop (side-by-side) tidak berubah (`DashboardClient.tsx`).
- Menambahkan **sistem peringatan kedekatan otomatis** (`ProximityAlertBanner`). Saat geolocation berhasil, aplikasi menghitung estimasi dB di lokasi pengguna untuk semua acara yang sedang berlangsung atau mendatang. Jika pengguna berada di dalam zona dampak (≥55 dB), banner peringatan muncul di bawah header dengan level BAHAYA (merah, ≥75 dB), WASPADA (kuning, ≥65 dB), atau TERDENGAR (teal, ≥55 dB). Banner menampilkan nama acara, estimasi dB, jarak, status waktu, tombol lihat ke peta, dan tombol dismiss. Maksimal 2 peringatan ditampilkan bersamaan, diurutkan dari dB tertinggi (`DashboardClient.tsx`).
- **[FASE 10]** Pembuatan halaman **Pengaturan Admin** (`/admin/settings`) yang memusatkan kontrol keamanan, profil, log sistem, dan preferensi antarmuka publik secara komprehensif.
- **[FASE 10]** Integrasi antarmuka _Profile Settings_ untuk modifikasi *Display Name* administrator (email dibuat _read-only_ untuk mengunci sesi primer).
- **[FASE 10]** Modul _Security Settings_ terpadu: perubahan *password* (tervalidasi *current password*) dengan pembersihan (_revocation_) paksa sesi lama via eksekusi Node SDK Better Auth, ditambah utilitas penutupan semua sisi (_revoke all other sessions_) untuk *emergency kill switch*.
- **[FASE 10]** Manajemen _App Settings_ dinamis (`AppSettingsForm.tsx`) untuk variabel *Public Header Announcement* & *Contact Email* tersinkronisasi database.
- **[FASE 10]** Log Audit UI canggih di dasar dashboard pengaturan yang menyajikan *Data Table* komplit riwayat tindakan, berbekal fitur asinkron *pagination* dan *real-time text filtering* tanpa melanggar batasan SSR.
- **[FASE 09]** Integrasi formulir Manajemen Acara dinamis (`EventForm.tsx`) dengan dukungan komponen Map Location Picker interaktif, penghitungan presisi Radius Bahaya Suara secara _real-time_, serta auto-slugging.
- **[FASE 09]** Skema validasi Zod kuat (`EventSchema`) baik untuk _client_ maupun perlindungan absolut di sisi _server action_.
- **[FASE 09]** Jaminan _atomicity_ melalui `prisma.$transaction` yang menautkan perubahan state _event_ dengan pembuatan *Audit Log* sistem (meliputi *eventType* dan *description* siapa yang merubah data).
- **[FASE 09]** Komponen UI `DeleteEventDialog` interaktif untuk *permanent deletion* yang mewajibkan input teks konfirmasi.
- **[FASE 09]** *Integration tests* untuk Server Actions yang memverifikasi filter Zod dan menolak aksi _unauthorized_ secara konsisten.
- **[FASE 08]** Pembuatan Admin Shell (Layout & Navigation) yang dilindungi oleh autentikasi (menggunakan `requireAdmin`). Komponen `AdminShell` responsif (Sidebar di Desktop, *Sheet overlay* di *Mobile*).
- **[FASE 08]** Pembuatan *Dashboard* Admin (`/admin`) dengan widget statistik, menampilkan jumlah total data, status *published*/*draft*/*archived*, serta rincian acara mendatang (*upcoming/ongoing* vs *past*) menggunakan agregasi query sisi server (`getAdminDashboardStats`).
- **[FASE 08]** Penambahan halaman List Manajemen Acara (`/admin/events`) yang _read-only_ dengan kapabilitas *pagination*, pencarian teks (*search*), dan filter *publication status*. Format tampilan tabel untuk *desktop* dan *card list* untuk *mobile*.
- **[FASE 08]** Format waktu Asia/Jakarta terintegrasi pada Admin panel untuk kejelasan zona waktu (menggunakan `Intl.DateTimeFormat`).
- **[FASE 08]** Status komponen UI error & loading untuk halaman admin (`error.tsx`, `loading.tsx`).
- **[FASE 07]** Implementasi pelacakan geolokasi pengguna melalui *hook* `useGeolocation.ts` dengan penanganan *state* lengkap (*idle, requesting, success, denied, unavailable, timeout*).
- **[FASE 07]** Sinkronisasi otomatis lokasi pengguna dengan daftar acara: secara proaktif memilih acara terdekat apabila lokasi pengguna terdeteksi dan tidak ada acara lain yang dipilih.
- **[FASE 07]** Penghitungan jarak langsung di *browser* (tanpa mengirim koordinat ke server demi privasi pengguna) menggunakan Haversine formula dari Fase 04, kemudian ditampilkan di dalam panel detail `EventDetail.tsx`.
- **[FASE 07]** Penambahan kontrol UI baru (`GeoControl`) pada peta untuk meminta akses lokasi secara eksplisit dari pengguna.
- **[FASE 07]** Penyempurnaan filter UX di *dashboard*: tombol hapus filter, validasi auto-deselect acara yang tidak cocok dengan filter, dan proteksi URL refresh data.
- **[FASE 06]** Integrasi Leaflet (`react-leaflet`) untuk pemetaan interaktif pada halaman publik dan pondasi `LocationPickerMap` untuk fasa admin.
- **[FASE 06]** Pembuatan `DynamicPublicMap` untuk me-render peta secara _client-side_ tanpa konflik _hydration SSR_ (menggunakan `next/dynamic`).
- **[FASE 06]** Pembuatan marker Leaflet khusus menggunakan `L.divIcon` murni untuk menghindari masalah jalur aset (_asset path_) bundler Webpack/Turbopack.
- **[FASE 06]** Fitur lingkaran zona dampak (`NoiseZoneCircles`) yang secara reaktif menggambar radius bahaya/peringatan/aman hanya untuk acara yang dipilih.
- **[FASE 06]** Sinkronisasi status peta interaktif dengan interaksi UI (flyTo ke koordinat acara yang dipilih).
- **[FASE 06]** Penambahan variabel _environment_ `NEXT_PUBLIC_MAP_TILE_URL` dan `NEXT_PUBLIC_MAP_ATTRIBUTION` ke dalam file `.env` sebagai konfigurasi Leaflet.
- **[FASE 05]** Pembuatan shell UI publik utama (`DashboardClient`) dengan layout responsif (tiga kolom di desktop, sheet overlay di mobile/tablet).
- **[FASE 05]** Penambahan state URL sync untuk filter (`?search=`, `?status=`, `?event=`) tanpa reload halaman menggunakan fitur Server Component + router replace.
- **[FASE 05]** Komponen `EventList`, `EventCard`, `EventDetail` dengan gaya translucency glass dan tema dinamis.
- **[FASE 05]** Implementasi placeholder peta (`MapPlaceholder`) yang mengindikasikan modul geospasial pada fase 06.
- **[FASE 04]** Setup `vitest` murni untuk pengujian *unit test* modul domain tanpa reaktivasi React/DOM.
- **[FASE 04]** Modul domain fisika jarak dan akustik di `src/lib/domain/noise.ts` dan `src/lib/domain/distance.ts` (mengimplementasi model redaman jarak bebas dan kalkulasi Haversine).
- **[FASE 04]** Modul domain filter dan waktu di `src/lib/domain/temporal.ts` dan `src/lib/domain/filter.ts`.
- **[FASE 04]** Penambahan utilitas pemformat jarak `src/lib/domain/formatter.ts`.
- **[FASE 04]** Penambahan 18 unit tests murni pada `tests/domain.test.ts` (100% lulus, menangani *edge case* jarak <= 0, NaN/Infinity, dll).
- **[FASE 04]** Dokumentasi batasan dan teori fisika pada `docs/NOISE_MODEL.md`.
- **[FASE 04]** Penambahan script `"test"` dan `"test:watch"` di `package.json`.
- **[FASE 02]** Instalasi Prisma (v5.20.0), `@prisma/client`, dan `tsx` untuk manajemen ORM dan seed.
- **[FASE 02]** Inisialisasi skema database SQLite yang mencakup model `SoundEvent`, `AuditLog`, dan `AppSetting`.
- **[FASE 02]** Pembuatan file `docs/DATABASE.md` untuk dokumentasi workflow database development.
- **[FASE 02]** Penambahan script database di `package.json` (`db:generate`, `db:migrate`, `db:migrate:deploy`, `db:seed`, `db:studio`).
- **[FASE 02]** Pembuatan Zod schema (`eventFormSchema`, `eventCreateSchema`, `eventUpdateSchema`, `eventFilterSchema`) di `src/lib/validators/event.ts`.
- **[FASE 02]** Implementasi Data Access Layer (DAL) di `src/server/dal/event.ts` untuk query event publik dan admin, lengkap dengan mapper DTO publik.
- **[FASE 02]** Skrip seed idempotent (`prisma/seed.ts`) dengan penambahan data dummy untuk tujuan demo.
- Instal dependency dasar UI dan domain (`lucide-react`, `next-themes`, `zod`, `date-fns`, `sonner`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`, `@radix-ui/react-separator`).
- Menambahkan primitif desain sistem (token warna light/dark di `globals.css` dengan aksen cyan/teal).
- Menambahkan utilitas dan primitif UI seperti `GlassPanel`, `Button`, `Input`, `Textarea`, `Badge`, `Skeleton`, `Alert`, `Separator`, dan `Dialog` (sebagai basis Sheet/Dialog).
- Menambahkan `ThemeProvider` berbasis `next-themes` beserta `ThemeToggle`.
- Membuat halaman `page.tsx` smoke test dashboard sementara.
- Menambahkan script `typecheck` pada `package.json`.

### Changed

- Mengubah player musik menjadi panel floating yang dapat digeser melalui handle khusus dengan pointer/touch maupun tombol panah keyboard; posisi dibatasi di dalam viewport, dipersistenkan secara lokal sebagai rasio layar, dan otomatis di-clamp saat resize atau rotasi perangkat.
- Mengoptimalkan dimensi responsif player musik, truncation metadata, dan target sentuh kontrol mobile minimal 44 px agar tetap dapat digunakan pada viewport sempit.
- Memindahkan folder `app/` ke `src/app/` dan mengatur struktur folder `src/components`, `src/lib`, `src/server`, dan `src/types` agar lebih konsisten dengan standard Next.js `src` directory dan alias import `@/*`.

### Fixed

- **[FASE 11]** Memperbaiki label/input, accessible name tombol ikon, focus trap Sheet Radix, live status, ringkasan tekstual peta, label zona non-warna, focus ring, reduced motion, dan overflow responsif.
- **[FASE 11]** Menghapus render ganda Leaflet mobile/desktop, menambahkan guard koordinat finite, serta mengganti animasi `flyTo` yang tidak stabil dengan `setView`.
- **[FASE 11]** Memperbaiki exception validasi URL pada form parsial, hydration mismatch label theme toggle, dan sintaks `package.json` yang rusak.

### Security

- Mengecualikan dokumen prompt internal `GEMINI_IMPLEMENTATION_PROMPTS.md` dan aset sumber duplikat `hrg_logo (1).svg` dari repository publik.
- Mengabaikan output service worker Serwist, log, cache lint, credential environment, database, dan artefak test/build agar tidak ikut terunggah; kebijakan pelaporan kerentanan mengarahkan laporan ke private vulnerability reporting GitHub.
- Menambahkan konfirmasi eksplisit sebelum transfer SQLite menulis ke PostgreSQL, menolak target dengan admin berbeda, membaca snapshot SQLite dalam mode read-only, dan tidak mencatat connection string maupun credential.
- Membatasi upload MP3 acara pada 10 MB dengan verifikasi ekstensi, MIME, dan magic signature di Server Action terautorisasi; `serverActions.bodySizeLimit` dinaikkan menjadi 11 MB hanya untuk menampung overhead multipart, sedangkan BLOB tidak pernah masuk DTO publik atau log.
- Mereset credential `admin@example.com` melalui prosedur CLI lokal dan mencabut seluruh sesi aktif; password baru tidak disimpan di source code, changelog, environment, atau log aplikasi.
- **[FASE 11]** Menutup public sign-up Better Auth, memperketat login menjadi 5 request/60 detik, memvalidasi trusted origins, ID/key/value mutasi, protokol URL sumber, dan menyamarkan error internal.
- **[FASE 11]** Mengubah bootstrap admin menjadi idempotent melalui transaksi credential hash dan menolak pembuatan admin kedua tanpa membuka endpoint registrasi.
- **[FASE 11]** Menandai Prisma/DAL publik sebagai `server-only`, mengamankan external link, serta mengabaikan artefak Playwright, database, WAL/SHM, dan file environment.

### Documentation

- Mendokumentasikan dampak penyimpanan MP3 sebagai BLOB terhadap ukuran database, backup/restore, volume persisten, dan pola query pada `docs/DATABASE.md`.
- **[FASE 11]** Mendokumentasikan test matrix, temuan accessibility/security/performance, perbaikan, audit dependency, dan residual risk menuju FASE 12.
- Mencatat rencana arsitektur Next.js 16.2 dengan React 19 menggunakan struktur root App Router.
- Memastikan tidak ada rencana implementasi registrasi (sign-up) publik.
- Mengatur aturan dan skema testing (Vitest dan Playwright).
- Menetapkan model deployment Docker standalone dan pengelolaan persistent volume untuk SQLite.

---

## [0.0.0] - 2026-07-13

### Added

- Inisialisasi aturan kerja agent melalui `AGENTS.md`.
- Inisialisasi changelog untuk menjaga kontinuitas pekerjaan lintas sesi AI.
- Penyusunan rangkaian prompt implementasi Gemini secara bertahap.
- Penetapan arah produk: dashboard EWS publik, peta zona kebisingan, geolocation lokal, admin tunggal, dark/light mode, dan glass translucency.

### Security

- Menetapkan bahwa public sign-up harus dimatikan.
- Menetapkan bahwa setiap mutasi admin wajib memverifikasi session pada server.
- Menetapkan larangan menyimpan password, token, cookie, atau secret pada source code dan log.

### Documentation

- Menetapkan deployment produksi SQLite pada satu instance dengan persistent volume, migration, backup, restore, dan health check.
- Menetapkan bahasa UI Indonesia dan zona waktu bisnis Asia/Jakarta.

---

## Template Entri

Salin hanya kategori yang diperlukan:

```md
## [Unreleased]

### Added

- Menambahkan ...

### Changed

- Mengubah ...

### Fixed

- Memperbaiki ...

### Security

- Mengamankan ...

### Documentation

- Mendokumentasikan ...
```
