# 🌐 Vitara

Vitara adalah aplikasi web berbasis kecerdasan buatan yang bertujuan untuk membantu pengguna dalam memantau dan mengelola kesehatan secara holistik. Aplikasi ini memberikan rekomendasi dan analisis kesehatan mental, nutrisi, serta pola tidur berdasarkan:

* 📝 Jurnal harian dan ritme mengetik pengguna
* 📸 Foto makanan yang diunggah
* 🌙 Data kualitas dan durasi tidur harian

Dengan dukungan sistem *offline-first*, data pencatatan pengguna tetap aman di perangkat lokal meskipun koneksi server mengalami gangguan.

---

## 🎯 Tujuan Vitara

Menyediakan antarmuka pengguna yang interaktif dan responsif untuk:

* Menampilkan skor kesehatan holistik dan status maskot interaktif (Vee)
* Mencatat jurnal mental, asupan nutrisi, dan riwayat tidur harian
* Mendukung penyimpanan data lokal serta sinkronisasi otomatis saat server kembali online

---

## 🧩 Fitur Vitara

### 👤 Bagi Pengguna

* **Dashboard Utama**: Melihat rangkuman skor kesehatan dalam bentuk bento grid beserta visualisasi kondisi maskot Vee (Fresh, Tired, Sick, Stressed, Waiting).
* **Pencatatan Mental**: Menulis jurnal harian yang dilengkapi dengan fitur pembaca ritme mengetik (WPM & backspace rate) untuk mendeteksi tingkat stres.
* **Pencatatan Nutrisi**: Mengunggah foto makanan untuk mendapatkan estimasi total kalori harian beserta komposisi makronutrisi.
* **Pencatatan Tidur**: Mencatat jam tidur dan bangun untuk memantau kualitas istirahat serta utang tidur.
* **Companion Chat**: Fitur interaksi pesan dua arah bersama AI companion.
* **Offline Mode & Dark Mode**: Aplikasi tetap berjalan dengan aman saat server down dan mendukung tema gelap untuk kenyamanan mata.

---

## 🛠️ Teknologi yang Digunakan

* ⚛️ React
* ⚡ Vite
* 🎨 Tailwind CSS
* 📘 TypeScript
* 📦 Zustand
* 🌐 Axios

---

## 🛠️ Instalasi & Menjalankan Proyek

```bash
# 1. Clone repositori
git clone https://github.com/Vitara-hub/vitara-fe.git
cd vitara-fe-ts

# 2. Install dependensi
npm install

# 3. Jalankan aplikasi
npm run dev

```

Buka browser dan akses `http://localhost:5173`

---

## 📁 Struktur Direktori

```
vitara-fe-ts/
├── public/                    # File publik (favicon, svg ikon, dll.)
├── src/                       # Source code utama aplikasi
│   ├── components/            # Komponen UI berdasarkan fitur aplikasi
│   │   ├── activity/          # Komponen grafik dan riwayat log aktivitas
│   │   ├── chat/              # Komponen antarmuka fitur chat companion
│   │   ├── dashboard/         # Komponen bento grid dan widget status dasbor
│   │   ├── landing/           # Seksi tampilan untuk halaman depan (landing page)
│   │   ├── layout/            # Kerangka navigasi (sidebar, bottom nav, splash screen)
│   │   ├── logbook/           # Sub-komponen pencatatan (jurnal, nutrisi, tidur)
│   │   ├── mascot/            # Logika render dan animasi interaktif maskot Vee
│   │   └── ui/                # Komponen UI global (popup alert, logo, dll.)
│   ├── hooks/                 # Custom hooks (keystroke tracker, auto sync, dll.)
│   ├── pages/                 # Halaman utama (dashboard, logbook, chat, profile, dll.)
│   ├── services/              # Layanan integrasi API backend (api.ts)
│   ├── store/                 # State management global menggunakan Zustand
│   ├── types/                 # Definisi tipe data TypeScript untuk API request/response
│   ├── App.tsx                # Komponen utama pembungkus aplikasi
│   ├── index.css              # File CSS utama dan konfigurasi Tailwind
│   ├── main.tsx               # Entry point aplikasi React
│   └── vite-env.d.ts          # Deklarasi tipe untuk environment variables
├── .env                       # Konfigurasi environment variable lokal
├── .gitignore
├── eslint.config.js           # Konfigurasi linting kode
├── index.html                 # Template HTML utama
├── package-lock.json          # Lock file untuk konsistensi dependensi
├── package.json               # Metadata proyek dan daftar dependensi
├── tsconfig.json              # Konfigurasi utama TypeScript
└── vite.config.ts             # Konfigurasi untuk Vite bundler

```