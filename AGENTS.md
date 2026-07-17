<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# AGENTS.md — SOUND HOREG.INFO

Dokumen ini adalah aturan pakem untuk semua AI/coding agent yang mengerjakan proyek **`horeg_ews`**. Baca seluruh dokumen sebelum menganalisis, merencanakan, menulis, menghapus, atau memindahkan kode.

---

## 1. Tujuan Produk

Bangun aplikasi **Sound Horeg Early Warning System (EWS)** yang:

1. Menampilkan acara sound horeg pada peta interaktif.
2. Menampilkan estimasi zona dampak suara berdasarkan tingkat dB sumber.
3. Membantu pengguna memeriksa jarak dan estimasi paparan dari lokasinya.
4. Menyediakan halaman admin tunggal untuk mengelola data acara.
5. Konsisten pada desktop dan mobile.
6. Memiliki dark mode dan light mode.
7. Menggunakan visual modern dengan efek glass translucency yang tetap terbaca, cepat, dan aksesibel.
8. Dapat dijalankan production-ready di Vercel dengan Supabase PostgreSQL persisten.

Nama produk di antarmuka: **SOUND HOREG.INFO**.  
Nama direktori/proyek: **`horeg_ews`**.  
Bahasa antarmuka utama: **Bahasa Indonesia**.  
Zona waktu bisnis: **Asia/Jakarta**.  
Format lokal: **id-ID**.

---

## 2. Urutan Prioritas Instruksi

Saat ada konflik, ikuti urutan berikut:

1. Instruksi terbaru pengguna.
2. `AGENTS.md`.
3. Spesifikasi atau dokumen proyek yang sudah disetujui.
4. Implementasi dan pola kode yang sudah ada.
5. Keputusan teknis agent.

Agent tidak boleh mengganti keputusan inti hanya karena memiliki preferensi teknis lain. Bila perubahan arsitektur memang diperlukan, berhenti dan jelaskan alasan, dampak, migrasi, serta alternatifnya sebelum mengubah kode.

---

## 3. Aturan Wajib Sebelum Mulai

Pada setiap sesi kerja:

1. Baca `AGENTS.md`.
2. Baca `CHANGELOG.md`.
3. Baca `package.json`, lockfile, `next.config.*`, `tsconfig.json`, dan struktur `src/` atau `app/`.
4. Periksa status Git dan perubahan yang belum selesai.
5. Identifikasi fase implementasi terakhir dari changelog.
6. Jangan mengulang pekerjaan yang sudah selesai.
7. Jangan menghapus perubahan pengguna atau agent sebelumnya tanpa alasan eksplisit.
8. Gunakan package manager yang sudah dipakai proyek. Jika terdapat `package-lock.json`, gunakan **npm** dan jangan membuat lockfile lain.
9. Setelah perubahan, jalankan pemeriksaan yang relevan.
10. Perbarui `CHANGELOG.md` pada sesi yang sama.

---

## 4. Keputusan Arsitektur yang Dikunci

### 4.1 Stack utama

Gunakan:

- Next.js App Router.
- TypeScript dengan mode strict.
- React Server Components sebagai default.
- Client Component hanya ketika membutuhkan state browser, event handler, geolocation, peta, atau API DOM.
- Tailwind CSS yang sudah tersedia pada proyek.
- Komponen UI aksesibel berbasis shadcn/ui atau Radix primitives.
- Lucide React untuk ikon.
- `next-themes` untuk tema.
- React Leaflet + Leaflet untuk peta.
- OpenStreetMap sebagai tile default, dengan URL tile dan attribution yang dapat diganti melalui konfigurasi.
- Prisma ORM dengan Supabase PostgreSQL.
- Prisma Migrate untuk riwayat migrasi.
- Better Auth dengan Prisma adapter untuk autentikasi admin.
- Zod untuk validasi boundary.
- React Hook Form untuk formulir admin kompleks.
- `date-fns` untuk presentasi tanggal bila diperlukan.
- Vitest untuk unit/integration test.
- Playwright untuk alur end-to-end utama.

Jangan mengganti ORM, database, library peta, atau library autentikasi tanpa persetujuan pengguna.

### 4.2 Runtime

- Gunakan runtime Node.js untuk route/action yang mengakses Prisma, Better Auth, BLOB, atau filesystem.
- Jangan menggunakan Edge Runtime untuk Prisma/Better Auth pada implementasi ini.
- Jangan mengandalkan static export.
- Jangan membangun custom server Next.js kecuali benar-benar diperlukan.
- Konfigurasi produksi menggunakan `output: "standalone"`.

### 4.3 Deployment PostgreSQL

Production target adalah Vercel dengan Supabase PostgreSQL:

- Gunakan transaction pooler untuk `DATABASE_URL` runtime serverless.
- Gunakan koneksi direct/non-pooling terpisah melalui `DIRECT_URL` untuk Prisma Migrate dan operasi administrasi.
- Preview dan test harus memakai database atau schema terisolasi, bukan schema production.
- Migration dijalankan eksplisit dengan `prisma migrate deploy`, bukan otomatis dari beberapa build paralel.
- Backup/restore mengikuti fasilitas dan prosedur Supabase; SQLite lama dipertahankan hanya sebagai backup migrasi sampai verifikasi selesai.
- BLOB MP3 masih didukung PostgreSQL, tetapi upload di Vercel harus mematuhi batas payload platform atau dipindahkan ke object storage.

---

## 5. Struktur Rute yang Diharapkan

Struktur boleh menyesuaikan `src/`, tetapi tujuan rute harus dipertahankan.

### Publik

- `/` — dashboard EWS utama.
- `/?status=upcoming|past` — filter status yang dapat dibagikan.
- `/?date=YYYY-MM-DD` — filter tanggal.
- `/?event=<slug>` — acara terpilih yang dapat dibagikan.
- `/tentang` — penjelasan singkat metode, keterbatasan, dan disclaimer bila halaman terpisah diperlukan.

### Admin

- `/admin/login` — login admin tunggal.
- `/admin` — ringkasan admin.
- `/admin/events` — daftar dan filter data acara.
- `/admin/events/new` — tambah acara.
- `/admin/events/[id]/edit` — edit acara.
- `/admin/settings` — profil admin, ganti password, dan pengaturan aplikasi yang memang didukung.

### API internal

- `/api/auth/[...all]` — handler Better Auth.
- `/api/health` — health check minimal tanpa membocorkan secret atau detail internal.

Gunakan Server Actions untuk mutasi internal bila sesuai. Route Handler tetap dianggap endpoint publik dan wajib divalidasi serta diotorisasi.

---

## 6. Model Domain Acara

Model inti bernama `SoundEvent` atau nama setara yang jelas.

Field minimum:

- `id`
- `slug` unik dan stabil
- `title`
- `summary` opsional
- `description` atau `sourceCaption` opsional
- `venueName` opsional
- `address`
- `district` opsional
- `city`
- `province`
- `latitude`
- `longitude`
- `sourceDb`
- `sourcePlatform`
- `sourceUrl`
- `sourceAccount` opsional
- `startAt`
- `endAt`
- `publicationStatus`: `DRAFT`, `PUBLISHED`, atau `ARCHIVED`
- `featured`
- `publishedAt` opsional
- `createdAt`
- `updatedAt`
- relasi pembuat/pengubah bila implementasi auth memungkinkan tanpa merusak skema Better Auth

Aturan wajib:

1. `title`, alamat, koordinat, waktu, dB sumber, platform, dan URL sumber wajib valid.
2. `endAt` harus lebih besar dari `startAt`.
3. Latitude: `-90` hingga `90`.
4. Longitude: `-180` hingga `180`.
5. `sourceDb` berupa angka wajar yang dibatasi oleh validasi aplikasi. Gunakan rentang awal `80–160 dB` kecuali spesifikasi berubah.
6. URL sumber wajib `http` atau `https`.
7. Slug dibuat dari judul, tetapi tidak boleh berubah otomatis setelah dipublikasikan jika perubahan tersebut memutus URL lama.
8. Hanya `PUBLISHED` yang tampil pada halaman publik.
9. `DRAFT` hanya terlihat oleh admin.
10. `ARCHIVED` tidak tampil publik dan tetap dipertahankan untuk histori.
11. Hapus permanen harus memakai dialog konfirmasi dan hanya dilakukan bila pengguna memang memilih hapus; pengarsipan lebih diutamakan.

### 6.1 Status waktu

Status waktu tidak disimpan sebagai sumber kebenaran. Hitung dari `startAt`, `endAt`, dan waktu sekarang:

- `upcoming`: sekarang sebelum `startAt`.
- `ongoing`: sekarang berada di antara `startAt` dan `endAt`.
- `past`: sekarang setelah `endAt`.

Tab publik tetap:

- **Mendatang**: berisi `ongoing` lebih dahulu, lalu `upcoming`.
- **Telah lewat**: berisi `past`, terbaru lebih dahulu.

Badge **Sedang berlangsung** harus membedakan acara aktif.

---

## 7. Perhitungan Kebisingan

Gunakan model propagasi sederhana sebagai estimasi:

```text
L(r) = L_source - 20 × log10(r)
```

Dengan:

- `L_source`: dB sumber pada jarak referensi 1 meter.
- `r`: jarak dalam meter.
- Untuk mencegah log nol, gunakan jarak minimum 1 meter.

Radius ambang:

```text
r = 10 ^ ((L_source - L_target) / 20)
```

Ambang zona default:

- `>= 75 dB`: sulit mendengar percakapan.
- `>= 65 dB`: suara keras / jendela dapat bergetar.
- `>= 55 dB`: suara masih samar terdengar.
- `< 55 dB`: di luar zona utama model.

Aturan implementasi:

1. Simpan fungsi pada modul domain murni, bukan di komponen React.
2. Tambahkan unit test untuk rumus dan edge case.
3. Render lingkaran dari radius terbesar ke terkecil.
4. Jangan menyebut hasil sebagai pengukuran aktual.
5. Selalu tampilkan disclaimer bahwa bangunan, topografi, cuaca, arah speaker, penghalang, dan kondisi lapangan tidak dimodelkan.
6. Jarak pengguna ke acara dihitung dengan rumus Haversine pada modul terpisah.
7. Jangan mengirim koordinat pengguna ke server kecuali fitur masa depan benar-benar memerlukannya dan pengguna menyetujui. Untuk versi ini, proses geolocation di browser.

---

## 8. Aturan UI dan Design System

### 8.1 Arah visual

Tampilan harus modern, tenang, informatif, dan tidak terasa seperti template dashboard generik.

Karakter visual:

- Glass translucency.
- Layer permukaan jelas.
- Aksen utama teal/cyan.
- Aksen risiko memakai merah-oranye-kuning.
- Latar memiliki gradient halus atau glow dekoratif yang tidak mengganggu peta.
- Border tipis.
- Shadow lembut.
- Radius panel konsisten.
- Animasi ringan dan fungsional.

Jangan memakai glass yang terlalu transparan hingga teks, form, atau peta sulit dibaca.

### 8.2 Token

Definisikan token sebagai CSS variables, lalu gunakan token tersebut. Minimum:

- `--background`
- `--foreground`
- `--muted`
- `--muted-foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--border`
- `--input`
- `--primary`
- `--primary-foreground`
- `--accent`
- `--destructive`
- `--ring`
- `--glass-bg`
- `--glass-border`
- `--glass-shadow`
- `--noise-high`
- `--noise-medium`
- `--noise-low`

Tidak boleh menyebarkan hard-coded warna yang sama ke banyak komponen.

### 8.3 Tema

- Dark/light mode melalui class.
- Default mengikuti system.
- Toggle tema tersedia pada halaman publik dan admin.
- Tema harus tersimpan.
- Tidak boleh terjadi hydration mismatch atau flash tema yang mencolok.
- Peta dan marker harus tetap terbaca pada kedua tema.
- Tile map tidak perlu dimanipulasi secara ekstrem; gunakan overlay/panel yang selaras.

### 8.4 Komponen glass

Buat primitive reusable, misalnya `GlassPanel`, atau utility class yang terdokumentasi.

Glass minimum:

- Background cukup opak untuk keterbacaan.
- `backdrop-filter`/`backdrop-blur`.
- Border halus.
- Shadow tidak berlebihan.
- Fallback solid background jika browser tidak mendukung backdrop filter.
- Form field memiliki permukaan lebih solid daripada panel dekoratif.

### 8.5 Tipografi dan ikon

- Gunakan font bawaan Next/Geist bila tersedia.
- Hierarki heading harus semantik.
- Jangan memakai ikon tanpa label/tooltip jika maknanya tidak jelas.
- Ikon hanya dari satu keluarga, yaitu Lucide.
- Hindari emoji sebagai ikon UI utama.

### 8.6 Motion

- Durasi umumnya 150–250 ms.
- Hormati `prefers-reduced-motion`.
- Jangan menambahkan parallax, cursor effect, atau animasi looping yang tidak memberi fungsi.
- Loading gunakan skeleton atau indikator yang stabil, bukan layout jump.

---

## 9. Responsivitas

### Desktop besar

- Layout utama tiga area:
  - panel daftar acara,
  - peta sebagai area terbesar,
  - panel detail.
- Tinggi aplikasi memanfaatkan `100dvh`.
- Panel kiri dan kanan boleh memiliki scroll internal yang jelas.
- Peta tidak boleh menyusut menjadi area kecil.

### Tablet

- Daftar dan peta tetap prioritas.
- Detail dapat menjadi Sheet/Drawer.
- Sidebar admin dapat collapse.

### Mobile

- Tidak boleh ada horizontal overflow.
- Header ringkas dan sticky bila membantu.
- Peta tampil cukup tinggi untuk dipakai.
- Filter menggunakan Sheet/Drawer atau area ringkas.
- Detail acara terpilih menggunakan bottom sheet atau halaman yang jelas.
- Daftar kartu mudah disentuh.
- Target sentuh minimum sekitar 44 × 44 px.
- Hindari tiga kolom yang dipaksa berdampingan.
- Hindari nested scroll kecil yang membingungkan.
- Gunakan `100dvh`, bukan hanya `100vh`, untuk perilaku browser mobile.

Uji setidaknya pada lebar 360 px, 768 px, 1024 px, dan 1440 px.

---

## 10. Perilaku Halaman Publik

Fitur minimum:

1. Daftar acara.
2. Tab Mendatang dan Telah lewat.
3. Jumlah acara per tab.
4. Filter tanggal.
5. Tombol reset filter.
6. Search judul/lokasi bila tetap ringan.
7. Peta marker acara.
8. Marker terpilih memiliki state visual berbeda.
9. Klik kartu memusatkan peta dan membuka detail.
10. Klik marker memilih kartu yang sama.
11. Zona 75/65/55 dB untuk acara terpilih.
12. Legenda peta.
13. Detail jadwal, lokasi, sumber, akun sumber, dB, dan estimasi pada 100 m, 500 m, serta 1 km.
14. Tombol membuka sumber asli di tab baru dengan `noopener noreferrer`.
15. Tombol cek posisi pengguna.
16. Marker pengguna.
17. Jarak ke acara terpilih atau terdekat.
18. Kategori estimasi dampak.
19. State loading, empty, error, izin lokasi ditolak, geolocation tidak didukung, dan timeout.
20. Disclaimer estimasi.

State filter utama harus tercermin pada URL search params bila layak agar dapat dibagikan dan dipulihkan saat refresh.

Jangan memuat seluruh fitur sebagai satu Client Component besar. Server-fetch data awal, lalu kirim data serializable yang diperlukan ke bagian interaktif.

---

## 11. Perilaku Halaman Admin

Admin hanya satu orang.

### 11.1 Login

- Tidak ada halaman pendaftaran publik.
- Tidak ada tautan daftar.
- Login menggunakan email dan password.
- Pesan gagal login bersifat generik.
- Jangan mengungkap apakah email terdaftar.
- Terapkan rate limit.
- Redirect admin yang sudah login dari `/admin/login` ke `/admin`.
- Logout mengakhiri session.
- Semua halaman admin harus terlindungi.

### 11.2 Dashboard

Tampilkan minimum:

- Jumlah acara published.
- Jumlah draft.
- Acara mendatang/berlangsung.
- Acara lewat.
- Daftar acara terdekat waktunya.
- Shortcut tambah acara.
- Aktivitas admin terbaru bila audit log sudah tersedia.

### 11.3 Manajemen acara

Admin dapat:

- Membuat acara.
- Melihat daftar.
- Search dan filter publication/time status.
- Mengedit.
- Preview.
- Publish/unpublish atau ubah ke draft.
- Archive.
- Hapus permanen dengan konfirmasi eksplisit.
- Memilih koordinat melalui map picker.
- Mengisi latitude/longitude manual.
- Melihat preview zona berdasarkan dB sebelum menyimpan.

Form dikelompokkan secara jelas:

1. Informasi dasar.
2. Jadwal.
3. Lokasi.
4. Sumber dan estimasi suara.
5. Publikasi.

Tidak boleh kehilangan input secara diam-diam. Tampilkan error per-field dan ringkasan error bila perlu.

### 11.4 Pengaturan

Minimum:

- Nama admin.
- Email admin sesuai dukungan auth.
- Ganti password dengan verifikasi password saat ini.
- Theme toggle.
- Pengaturan aplikasi hanya jika benar-benar digunakan oleh halaman publik.

Jangan membuat manajemen multi-user, role matrix, organisasi, atau undangan pengguna.

---

## 12. Autentikasi dan Keamanan

Gunakan Better Auth dengan Prisma adapter PostgreSQL.

Konfigurasi wajib:

- Email/password enabled.
- Public sign-up disabled.
- Session disimpan secara aman.
- Cookie secure pada production.
- Trusted origin dikonfigurasi.
- CSRF dan origin checks tidak boleh dimatikan.
- Rate limit auth aktif dan diperketat untuk endpoint login bila API library mendukung.
- Secret hanya dari environment.
- Tidak ada credential hard-coded.
- Initial admin dibuat melalui script bootstrap CLI, bukan route pendaftaran publik.
- Script bootstrap harus idempotent dan menolak membuat admin kedua.
- Setelah bootstrap production, password awal tidak boleh tetap tersimpan di `.env`/compose history lebih lama dari yang diperlukan.
- Password tidak pernah dicatat ke log.

Authorization berlapis:

1. Proxy/middleware hanya untuk redirect UX awal.
2. Setiap Server Action, Route Handler, dan DAL mutasi tetap memverifikasi session.
3. Jangan percaya `userId`, role, atau authorization flag yang dikirim client.
4. Data sensitif hanya dibaca di server-only module.
5. Tandai DAL sensitif dengan `server-only` bila sesuai.

Tambahkan security headers yang kompatibel dengan Leaflet/tile provider. Jangan membuat CSP yang tampak ketat tetapi mematikan aplikasi. Dokumentasikan origin tile map yang diizinkan.

Error production:

- Jangan kirim stack trace ke browser.
- Jangan mengirim detail query/database.
- Log server boleh menyimpan error teknis tanpa secret, password, token, cookie, atau data koordinat pengguna.

---

## 13. Database dan Data Access Layer

### 13.1 Prisma

- Gunakan satu instance Prisma per process dengan pola singleton untuk development.
- Ikuti sintaks Prisma yang sesuai dengan versi terpasang; jangan menyalin konfigurasi versi lama tanpa verifikasi.
- Commit seluruh migration SQL.
- Development: gunakan `prisma migrate dev`.
- Production: gunakan `prisma migrate deploy`.
- Jangan memakai `prisma db push` sebagai mekanisme deployment production.
- Seed harus idempotent.
- Jangan mengedit migration lama yang sudah dianggap diterapkan; buat migration baru.
- Gunakan pooled connection untuk runtime dan direct connection untuk Prisma CLI.

### 13.2 Supabase PostgreSQL

Wajib:

- Foreign keys dan unique constraint tetap dipertahankan oleh migration.
- Runtime Vercel memakai transaction pooler.
- Migration, introspection, backup, dan restore memakai direct/non-pooling connection.
- Preview, Vitest integration, dan Playwright E2E memakai schema terisolasi dengan guard anti-reset production.

Sediakan:

- Dokumentasi transfer SQLite lama.
- Dokumentasi migration, backup, dan restore Supabase.
- Retention sesuai paket Supabase; jangan menghapus backup pengguna tanpa konfigurasi eksplisit.

### 13.3 DAL

Pisahkan:

- query publik,
- query admin,
- mutasi,
- mapping DTO,
- validasi.

Jangan melakukan query Prisma langsung dari Client Component.  
Jangan mengembalikan seluruh record auth atau field internal ke client.  
Pilih hanya field yang diperlukan.

---

## 14. Validasi dan Form

- Semua input eksternal divalidasi dengan Zod pada server.
- Validasi client hanya untuk UX; server tetap sumber kebenaran.
- Form admin menggunakan schema yang dapat dibagi tanpa mengimpor kode server ke client.
- Normalisasi string dengan aman.
- Jangan menyimpan string kosong jika field seharusnya `null`.
- Validasi URL sumber.
- Validasi tanggal dengan zona waktu yang jelas.
- Pesan error antarmuka menggunakan Bahasa Indonesia.
- Jangan memakai `any` untuk menghindari persoalan tipe.
- Jangan melakukan cast buta hanya agar build lolos.

---

## 15. Konvensi Kode

### TypeScript

- `strict: true`.
- Utamakan type inference yang jelas.
- Gunakan type/domain name yang deskriptif.
- Hindari `any`; gunakan `unknown` lalu narrowing.
- Hindari non-null assertion kecuali invariannya benar-benar dijelaskan.
- Fungsi domain murni harus mudah diuji.

### React/Next.js

- Server Component sebagai default.
- Tambahkan `"use client"` hanya pada boundary terkecil.
- Jangan fetch data dari API internal milik aplikasi sendiri bila Server Component dapat memanggil DAL langsung.
- Gunakan `loading.tsx`, `error.tsx`, dan empty state secara tepat.
- Gunakan `next/image` untuk image lokal/remote yang memang ada.
- Peta dimuat client-only/dynamic karena bergantung pada DOM.
- Jangan menonaktifkan SSR pada seluruh halaman hanya karena peta.

### Naming

- Komponen: PascalCase.
- Fungsi/variabel: camelCase.
- Konstanta global: UPPER_SNAKE_CASE bila benar-benar konstan.
- File komponen: kebab-case atau pola yang sudah ada; jangan mencampur tanpa alasan.
- Server action diberi nama verba jelas: `createSoundEvent`, `updateSoundEvent`, dan seterusnya.

### Komentar

- Komentari alasan, invariant, atau workaround.
- Jangan menulis komentar yang hanya mengulang kode.
- TODO wajib menjelaskan pemilik/tujuan atau issue; jangan meninggalkan TODO kabur.

---

## 16. Aksesibilitas

Minimum:

- Navigasi keyboard.
- Focus ring terlihat.
- Heading berurutan.
- Form memiliki label.
- Error terkait input terhubung melalui `aria-describedby`.
- Dialog/Sheet mengelola focus.
- Tombol ikon memiliki accessible name.
- Kontras teks memadai pada glass.
- Informasi zona tidak hanya dibedakan oleh warna; sertakan label atau pola.
- Peta memiliki judul/label dan tersedia ringkasan tekstual acara.
- Perubahan status penting dapat memakai live region secara proporsional.
- Hormati reduced motion.
- Tidak boleh ada trap keyboard.

---

## 17. Performa

- Jangan memasukkan library besar tanpa alasan.
- Lazy-load peta.
- Hindari re-render seluruh daftar dan peta karena perubahan kecil.
- Gunakan memoization hanya saat ada manfaat terukur.
- Batasi data publik ke field yang diperlukan.
- Pagination admin bila jumlah data dapat berkembang.
- Debounce search client bila perlu; jangan berlebihan.
- Hindari efek blur bertumpuk pada banyak node.
- Pertahankan layout stabil.
- Jalankan production build sebelum menyatakan fase selesai.

---

## 18. Testing Minimum

### Unit

Wajib mencakup:

- estimasi dB berdasarkan jarak,
- radius berdasarkan ambang,
- Haversine,
- status waktu,
- schema validasi acara,
- slug/normalisasi penting.

### Integration

Wajib mencakup:

- query hanya mengembalikan published untuk publik,
- mutasi ditolak tanpa session,
- create/update event valid,
- invalid date/coordinate/source URL ditolak,
- admin tunggal/bootstrap idempotent bila dapat diuji dengan aman.

### End-to-end

Alur minimum:

1. Login berhasil.
2. Login gagal menampilkan pesan generik.
3. Admin membuat draft.
4. Admin mengedit lalu publish.
5. Acara muncul pada halaman publik.
6. Filter dan pemilihan acara berfungsi.
7. Admin archive/unpublish dan acara hilang dari publik.
8. Mobile viewport tidak memiliki overflow utama.
9. Theme toggle bekerja.

Geolocation dapat dimock pada Playwright.

---

## 19. Logging dan Audit

- Gunakan logger server terpusat atau wrapper sederhana.
- Log memiliki level dan konteks.
- Jangan log password, token, cookie, auth header, secret, atau isi `.env`.
- Jangan log koordinat pengguna dari geolocation.
- Catat mutasi admin utama dalam `AuditLog`: create, update, publish, unpublish, archive, delete, password change, login sukses/gagal bila aman.
- Metadata audit harus disanitasi dan tidak menyimpan credential.
- UI audit dapat menampilkan ringkasan manusiawi.

---

## 20. Deployment dan Operasional

Artefak production minimum:

- `next.config.*` dengan standalone output.
- Konfigurasi Vercel/Git deployment.
- Supabase PostgreSQL terhubung ke project.
- Prosedur eksplisit `prisma migrate deploy` sebelum deployment yang membutuhkan migration.
- Health check.
- `.env.example`.
- Dokumentasi deploy.
- Dokumentasi bootstrap admin.
- Dokumentasi backup/restore.
- Graceful failure bila environment wajib hilang.

Docker/VPS boleh dipertahankan sebagai target alternatif, tetapi bukan alasan untuk memakai SQLite kembali tanpa persetujuan pengguna.

---

## 21. Environment Variables

Dokumentasikan dan validasi environment pada startup. Nama dapat menyesuaikan library, tetapi minimum:

```env
NODE_ENV=
DATABASE_URL=
DIRECT_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MAP_TILE_URL=
NEXT_PUBLIC_MAP_ATTRIBUTION=
ADMIN_BOOTSTRAP_EMAIL=
ADMIN_BOOTSTRAP_NAME=
ADMIN_BOOTSTRAP_PASSWORD=
SQLITE_SOURCE_PATH=
```

Aturan:

- `.env.example` hanya berisi placeholder.
- `.env`, `.env.local`, database, backup, dan secret tidak di-commit.
- Variabel `NEXT_PUBLIC_*` dianggap terlihat publik.
- Jangan memasukkan secret ke variabel publik.
- Bootstrap password hanya untuk proses awal dan harus dapat dihapus setelah berhasil.

---

## 22. Workflow Perubahan Agent

Sebelum coding, tuliskan ringkas:

- fase yang sedang dikerjakan,
- file yang kemungkinan diubah,
- risiko,
- pemeriksaan akhir.

Saat coding:

- Kerjakan hanya scope fase.
- Jangan melakukan refactor besar yang tidak terkait.
- Jangan mengubah desain produk diam-diam.
- Pertahankan kompatibilitas dengan pekerjaan fase sebelumnya.

Setelah coding:

1. Format bila ada formatter.
2. Jalankan lint.
3. Jalankan typecheck.
4. Jalankan test terkait.
5. Jalankan build pada milestone besar.
6. Periksa Git diff.
7. Pastikan tidak ada secret/database ter-commit.
8. Perbarui `CHANGELOG.md`.
9. Beri laporan:
   - ringkasan,
   - file penting,
   - command yang dijalankan,
   - hasil test,
   - masalah tersisa,
   - fase berikutnya.

Jangan mengatakan “selesai” bila build/test gagal. Jelaskan kegagalan apa adanya.

---

## 23. Aturan CHANGELOG

Setiap sesi yang mengubah file proyek wajib memperbarui `CHANGELOG.md`.

- Tambahkan perubahan ke `[Unreleased]`.
- Gunakan kategori Added, Changed, Fixed, Security, Deprecated, Removed, atau Documentation.
- Tulis perubahan aktual, bukan rencana abstrak.
- Sertakan migration, route, env, dan breaking change.
- Jangan menghapus histori.
- Jangan mengganti seluruh changelog hanya untuk merapikan format.
- Hindari entri seperti “update code” yang tidak informatif.

---

## 24. Larangan

Agent dilarang:

- Mengaktifkan pendaftaran publik.
- Membuat multi-admin tanpa instruksi.
- Menyimpan password plain text.
- Menaruh secret di source code.
- Menghapus validasi server.
- Hanya mengandalkan proxy/middleware untuk authorization.
- Menjalankan Prisma/Better Auth di Edge Runtime tanpa verifikasi kompatibilitas.
- Menggunakan static export sebagai deployment aplikasi dinamis ini.
- Mengganti Supabase PostgreSQL tanpa persetujuan.
- Menghapus migration/database/data tanpa backup atau instruksi.
- Menggunakan koordinat placeholder lalu menyebutnya data nyata.
- Mengambil/scrape media sosial tanpa izin dan tanpa kebutuhan.
- Menyebut estimasi sebagai pengukuran real-time.
- Menambahkan analytics/tracker eksternal tanpa persetujuan.
- Mengirim lokasi pengguna ke server.
- Mengabaikan mobile.
- Menggunakan warna hard-coded acak di setiap komponen.
- Menambahkan efek glass yang mengurangi keterbacaan.
- Menonaktifkan TypeScript/ESLint rule hanya agar pemeriksaan lulus.
- Mengubah package manager.
- Meng-upgrade dependency besar di luar scope.
- Menulis ulang file yang tidak perlu.
- Membuat commit atau push tanpa instruksi pengguna.

---

## 25. Definition of Done

Sebuah fase hanya selesai apabila:

- Scope fase terpenuhi.
- UI desktop dan mobile pada fase tersebut dapat digunakan.
- Dark/light mode tetap benar.
- Validasi dan authorization berada di server.
- State loading/error/empty tersedia.
- Tidak ada TypeScript error.
- Lint relevan lulus.
- Test terkait lulus.
- Build lulus pada milestone yang meminta build.
- Tidak ada secret atau database masuk Git.
- Changelog diperbarui.
- Dokumentasi konfigurasi baru diperbarui.
- Agent melaporkan keterbatasan yang masih ada.

---

## 26. Ringkasan Keputusan Final

- Produk: SOUND HOREG.INFO.
- Frontend/backend: Next.js App Router dalam satu aplikasi.
- UI: modern glass translucency, dark/light, aksesibel, responsive.
- Peta: React Leaflet + Leaflet + tile configurable.
- Database: Prisma + Supabase PostgreSQL.
- Auth: Better Auth, satu admin, signup disabled.
- Mutasi: Server Actions/DAL dengan authorization ulang.
- Public: daftar, filter, peta, zona dB, geolocation lokal, detail sumber.
- Admin: login, dashboard, CRUD acara, map picker, publish/archive, settings.
- Production: Vercel + Supabase PostgreSQL, pooled runtime connection, direct migration connection, health check, dan backup.
<!-- END:nextjs-agent-rules -->
