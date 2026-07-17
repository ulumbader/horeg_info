# Authentication

Proyek ini menggunakan [Better Auth](https://better-auth.com/) dengan adapter Prisma PostgreSQL pada Supabase.

## Kebijakan Akses
- Aplikasi hanya dioperasikan oleh **1 (satu) entitas admin** pengelola acara.
- Pendaftaran mandiri (Sign up) publik **dinonaktifkan** (`disableSignUp: true`).

## Skrip Bootstrap
Untuk membuat akun admin pertama tanpa mengekspos _password_ secara _hardcode_, gunakan skrip bootstrap yang membaca nilai _environment_:
```bash
npm run bootstrap
```
**Variabel yang dibutuhkan:**
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_NAME`
- `ADMIN_BOOTSTRAP_PASSWORD`

_**Perhatian Keamanan**_: Setelah `npm run bootstrap` berhasil, hapus atau kosongkan nilai `ADMIN_BOOTSTRAP_PASSWORD` dari file `.env` di _server_ produksi agar tidak terdeteksi oleh siapapun.

## Login & Logout
- Endpoint login: `/admin/login` (Aman dengan `lucide-react` forms dan penanganan _error_ yang tergeneralisasi).
- Endpoint admin: `/admin` (Sesi diverifikasi via layout Next.js di backend `requireAdmin()`).
- Endpoint logout: `/api/auth/sign-out` via POST atau helper CLI auth.

## Konfigurasi Lanjutan
- **Rate Limit**: Otomatis aktif. Maksimal 100 hit dalam 60 detik (bawaan _plugin_ Better Auth).
- **Update Umur Sesi**: Berlaku selama 7 hari (dapat diubah di `src/lib/auth.ts`).
