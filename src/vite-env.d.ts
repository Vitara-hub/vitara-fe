// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Tambahkan variabel .env lain di sini nanti kalau ada
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}