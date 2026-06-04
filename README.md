# Vitara Frontend

Vitara adalah aplikasi web kesehatan holistik berbasis AI yang membantu pengguna
memantau kondisi mental, nutrisi, tidur, dan aktivitas harian. Frontend ini
menyediakan dashboard kesehatan, pencatatan harian, companion chat bersama Vee,
serta pengalaman Progressive Web App (PWA) yang responsif di desktop dan mobile.

> Vitara merupakan alat pendamping kebiasaan sehat, bukan pengganti diagnosis
> atau konsultasi tenaga medis profesional.

## Fitur Utama

- **Autentikasi**: daftar dan masuk menggunakan email/password atau Google OAuth
  melalui backend gateway.
- **Dashboard kesehatan**: menampilkan skor kesehatan, rangkuman mental,
  nutrisi, tidur, serta status interaktif maskot Vee.
- **Jurnal mental**: menganalisis jurnal dan telemetry ritme mengetik untuk
  membantu memperkirakan emosi serta tingkat stres.
- **Pencatatan nutrisi**: mendukung input makanan manual dan analisis foto
  makanan.
- **Pencatatan tidur**: mencatat waktu tidur, waktu bangun, dan gangguan tidur.
- **Aktivitas**: menampilkan grafik kesehatan tujuh hari dan riwayat aktivitas.
- **Companion chat**: menerima respons AI secara streaming melalui Server-Sent
  Events (SSE).
- **PWA dan fallback lokal**: memasang aplikasi ke perangkat, menyimpan cache
  halaman/data tertentu, dan mencoba menyinkronkan kembali pencatatan tertunda
  saat koneksi tersedia.
- **Dark mode dan layout responsif**: mendukung navigasi desktop maupun mobile.

## Arsitektur Singkat

```text
Browser / Vitara Frontend
          |
          | HTTP + Bearer token / cookie
          v
Vitara Backend Gateway (/api)
          |
          +--> Supabase Auth, Database, dan Storage
          |
          +--> Vitara AI Service
```

Frontend tidak berkomunikasi langsung dengan Supabase atau AI service. Seluruh
autentikasi, penyimpanan data, upload, dan orkestrasi AI dilakukan melalui
backend gateway. Detail request dan response tersedia di
[`api-contract.md`](./api-contract.md).

## Teknologi

- React 19
- TypeScript 6
- Vite 8
- Tailwind CSS 4
- Zustand 5
- Axios
- Vite PWA / Workbox
- Lucide React

## Prasyarat

Pastikan perangkat telah memiliki:

- Git
- Node.js `^20.19.0` atau `>=22.12.0`
- npm
- Vitara Backend Gateway yang berjalan dan dapat diakses frontend

Secara default frontend mengharapkan backend di `http://localhost:3000`.
Backend harus menyediakan endpoint dengan base path `/api` sesuai
[`api-contract.md`](./api-contract.md).

## Cara Replikasi Lokal

### 1. Clone repositori

```bash
git clone https://github.com/Vitara-hub/vitara-fe.git
cd vitara-fe
```

### 2. Install dependensi

Gunakan `npm ci` agar versi dependensi sama dengan `package-lock.json`.

```bash
npm ci
```

### 3. Buat konfigurasi environment

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Isi `.env` dengan origin backend gateway:

```env
VITE_API_URL=http://localhost:3000
```

Nilai `VITE_API_URL` tidak perlu diakhiri `/api` karena frontend menambahkan
base path tersebut pada setiap request.

### 4. Jalankan layanan pendukung

Jalankan Vitara Backend Gateway pada URL yang telah ditentukan di `.env`.
Untuk menggunakan seluruh fitur, backend juga perlu terhubung ke Supabase dan
Vitara AI Service. Konfigurasi layanan tersebut berada di repositori backend.

Frontend tetap dapat menampilkan landing page tanpa backend, tetapi login dan
fitur utama membutuhkan backend yang aktif.

### 5. Jalankan frontend

```bash
npm run dev
```

Buka `http://localhost:5173`.

### 6. Verifikasi hasil replikasi

Periksa alur berikut:

1. Landing page dan halaman login dapat dibuka.
2. Daftar atau login berhasil dan pengguna diarahkan ke `/dashboard`.
3. Dashboard, pencatatan mental/nutrisi/tidur, aktivitas, chat, dan profil dapat
   mengambil data dari backend.
4. PWA dapat dipasang dari browser yang mendukung.
5. Setelah membuat pencatatan saat koneksi terputus, aplikasi menampilkan data
   lokal dan mencoba sinkronisasi kembali ketika online.

## Build dan Preview Produksi

```bash
npm run lint
npm run build
npm run preview
```

Hasil build tersedia di direktori `dist/`. Preview produksi secara default dapat
diakses melalui URL yang ditampilkan oleh Vite, biasanya
`http://localhost:4173`.

## Replikasi Deployment Vercel

Repositori telah menyediakan [`vercel.json`](./vercel.json) untuk:

- meneruskan request `/api/*` ke backend produksi;
- mengarahkan seluruh route aplikasi ke `index.html`;
- menambahkan security headers.

Langkah deployment:

1. Import fork/replikasi repositori ke Vercel.
2. Tambahkan environment variable `VITE_API_URL=/`.
3. Pastikan tujuan rewrite `/api/(.*)` di `vercel.json` mengarah ke backend yang
   digunakan.
4. Sesuaikan `Content-Security-Policy`, `Access-Control-Allow-Origin`, dan
   konfigurasi CORS backend apabila domain frontend atau backend berubah.
5. Deploy menggunakan perintah build `npm run build` dengan output directory
   `dist`.

Menggunakan `VITE_API_URL=/` membuat frontend memanggil `/api` pada domain yang
sama, lalu Vercel meneruskannya ke backend melalui rewrite.

## Skrip npm

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan development server Vite |
| `npm run build` | Type-check dan membuat build produksi |
| `npm run lint` | Menjalankan ESLint pada proyek |
| `npm run preview` | Menjalankan preview dari build produksi |

## Route Aplikasi

| Route | Keterangan |
| --- | --- |
| `/` | Landing page |
| `/login` | Login dan registrasi |
| `/dashboard` | Ringkasan kesehatan hari ini |
| `/logbook` | Pencatatan mental, nutrisi, dan tidur |
| `/activity` | Grafik dan riwayat aktivitas |
| `/chat` | Companion chat bersama Vee |
| `/profile` | Profil dan pengaturan akun |

Selain landing page dan login, seluruh route memerlukan sesi autentikasi.

## Struktur Direktori

```text
vitara-fe/
|-- public/                     # Ikon, favicon, dan aset PWA
|-- src/
|   |-- components/
|   |   |-- activity/           # Grafik dan riwayat aktivitas
|   |   |-- chat/               # Antarmuka companion chat
|   |   |-- dashboard/          # Widget dashboard kesehatan
|   |   |-- landing/            # Komponen landing page
|   |   |-- layout/             # Sidebar, bottom nav, dan splash screen
|   |   |-- logbook/            # Form jurnal, nutrisi, dan tidur
|   |   |-- mascot/             # Maskot interaktif Vee
|   |   |-- profile/            # Komponen profil
|   |   `-- ui/                 # Komponen UI umum
|   |-- hooks/                  # Hook telemetry, PWA, dan auto-sync
|   |-- pages/                  # Halaman utama aplikasi
|   |-- services/               # API client dan pengelolaan sesi
|   |-- store/                  # Global state Zustand
|   |-- types/                  # Tipe data dan kontrak API frontend
|   |-- utils/                  # Mapper dan logika Vee
|   |-- App.tsx                 # Navigasi dan shell aplikasi
|   |-- index.css               # Style global dan Tailwind
|   `-- main.tsx                # Entry point React
|-- .env.example                # Contoh konfigurasi environment
|-- api-contract.md             # Kontrak frontend dan backend gateway
|-- package.json                # Dependensi dan skrip npm
|-- vercel.json                 # Rewrite dan header deployment Vercel
`-- vite.config.ts              # Konfigurasi Vite, Tailwind, dan PWA
```

## Troubleshooting

### Login gagal atau API tidak dapat dijangkau

- Pastikan backend aktif pada URL yang sama dengan `VITE_API_URL`.
- Pastikan backend mengizinkan origin frontend melalui CORS.
- Pastikan `VITE_API_URL` berisi origin backend tanpa tambahan `/api`.
- Restart `npm run dev` setelah mengubah `.env`.

### Google OAuth kembali ke URL yang salah

Pastikan redirect URL frontend telah didaftarkan pada konfigurasi OAuth backend
dan Supabase.

### Route menghasilkan 404 setelah deployment

Pastikan hosting menerapkan SPA fallback ke `index.html`. Konfigurasi tersebut
sudah tersedia untuk Vercel melalui `vercel.json`.

### PWA masih memakai versi lama

Tutup seluruh tab Vitara, hapus service worker/cache melalui DevTools, lalu buka
ulang aplikasi.
