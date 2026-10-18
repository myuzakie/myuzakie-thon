# AI Maintenance Guide

Folder ini adalah sumber konteks pertama untuk agent yang melanjutkan project Hackathon OS.

## Urutan membaca

1. `PROJECT_STATE.md` — arsitektur, alur data, dan batasan integrasi saat ini.
2. `CHANGELOG.md` — perbaikan yang sudah dikerjakan dan alasan teknisnya.
3. `TESTING.md` — cara menjalankan validasi serta action yang sudah dicakup test.
4. `SYSTEM_UX.md` — rule wajib untuk setiap feature/fix UI.
5. Dokumentasi root `PROJECT.md` — panduan project yang lebih lengkap.

## Aturan kerja agent

- Baca dokumentasi di folder ini sebelum mendiagnosis atau mengubah kode.
- Cari akar masalah dan tambahkan regression test sebelum memperbaiki bug.
- Pertahankan branch per fitur/fix dan commit dengan pesan standar seperti `fix(scope): ...` atau `feat(scope): ...`.
- Jangan membaca, mencetak, menyalin, atau mengulang nilai credential dari `.env`, log, screenshot, atau terminal. Gunakan nama variabel saja.
- Credential Google harus tetap server-only. Jangan memindahkan service account key ke client bundle.
- Jangan mengubah struktur tab Google Sheets atau primary key tanpa migration plan dan test.
- Setelah perubahan, jalankan `pnpm test`, `pnpm lint`, `pnpm check-types`, dan `pnpm build`.
- Jika Google API tidak tersedia, gunakan fallback lokal untuk menjaga UI tetap hidup dan tampilkan error yang bisa ditindaklanjuti.

## Status saat ini

Perubahan terbaru ada di branch `fix/dashboard-data-guard` dan branch fitur sebelumnya tetap menjadi basis review. Lihat `CHANGELOG.md` untuk commit dan branch yang sudah dipush.
