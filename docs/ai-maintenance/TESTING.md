# Testing Guide

## Commands

```bash
pnpm test
pnpm lint
pnpm check-types
pnpm build
```

`pnpm test` menjalankan Vitest dalam mode non-watch. `pnpm test:watch` tersedia untuk pengembangan lokal.

## Coverage saat ini

### Dashboard

`tests/unit/operations-command-center.test.ts` memeriksa:

- fallback ketika rows `undefined` atau invalid;
- filtering record invalid;
- active event calculation;
- completed/open/blocked/overdue task calculation;
- due-soon calculation;
- submission readiness;
- evidence missing;
- progress dan deadline sorting.

### Live table

`tests/unit/live-sheet-table.test.ts` memeriksa:

- formatter `linked-status` untuk Drive evidence;
- nilai biasa dan empty value;
- tidak ada callback function pada column descriptor.

### System UX field rules

`tests/unit/ui-field-rules.test.ts` memeriksa:

- inferensi currency, select, URL, textarea, dan folder link;
- opsi select yang mempertahankan nilai eksternal;
- deteksi URL dan prefix mata uang.

### Sheets API

`tests/api/sheets-route.test.ts` memeriksa:

- authentication guard;
- GET allowed sheet;
- payload validation POST/PATCH/DELETE;
- create record dan audit log.

### Drive API

`tests/api/drive-route.test.ts` memeriksa:

- authentication guard;
- listing folder;
- rejection file type;
- upload file yang diizinkan;
- linking file ke Sheets;
- audit log upload.

`tests/unit/google-workspace.test.ts` juga memastikan endpoint multipart Drive tidak menggandakan path `/drive/v3`.

## Manual smoke test

Setelah login, periksa:

1. `/dashboard` tetap tampil ketika Sheets unavailable dan menampilkan snapshot lokal.
2. `/hackathons` tidak menampilkan error Server/Client Component serialization.
3. Action View, Edit, Delete, Upload, Evidence, Refresh, dan pagination pada live table.
4. `/projects` pada Table, Kanban, dan Timeline.
5. Drawer detail: grouping, Copy ID, Change status, dan Open evidence.
6. Evidence drawer: breadcrumb, list/grid, search/filter, preview, upload progress, refresh, dan Open in Drive.
7. Conflict update menghasilkan pilihan Use latest Sheets atau Overwrite Sheets.

## Batasan test

Test otomatis memakai mock untuk Google API dan tidak mengubah spreadsheet atau Drive sungguhan. Smoke test integrasi tetap membutuhkan API Google aktif, permission service account, dan session aplikasi yang valid.
