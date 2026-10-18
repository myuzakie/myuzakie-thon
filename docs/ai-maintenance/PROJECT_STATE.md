# Project State

## Ringkasan

Hackathon OS adalah dashboard internal untuk mengelola event hackathon, task delivery, ide, UI resources, submission checklist, Google Sheets sebagai source of truth, dan evidence di Google Drive.

UI menggunakan shadcn/ui, Tailwind, Lucide, layout monochrome, dan warna semantic hanya untuk status: merah untuk blocked/overdue, amber untuk risk/review, hijau untuk complete/verified, dan biru untuk active/in progress.

## Arsitektur

- `src/app/(pages)` berisi route halaman utama.
- `src/components/hackathon` berisi command center, live table, detail drawer, project overview, dan Drive evidence workspace.
- `src/app/api/sheets/[sheet]` menangani list, create, update, soft delete, conflict response, dan audit.
- `src/app/api/drive/files` menangani listing file/folder.
- `src/app/api/drive/upload` menangani upload multipart, validasi ukuran/tipe, linking ke Sheets, dan audit.
- `src/lib/google-workspace.ts` adalah server-only adapter Google Sheets/Drive.
- `src/lib/auth.ts` menjaga session internal dan same-origin checks.
- `src/lib/hackathon-data.ts` menyediakan snapshot fallback untuk UI ketika integrasi belum tersedia.

## Halaman utama

- `/dashboard` — live operations command center: KPI, needs attention, progress task, deadline, dan submission readiness.
- `/hackathons` — event workspace dengan deadline, eligibility, verification, project/evidence, dan detail drawer.
- `/projects` — delivery workspace dengan table, kanban, timeline, task progress, risk, dan evidence.
- `/ideas` — idea vault.
- `/resources` — UI resource catalog.
- `/submission` — submission checklist dan evidence.

## Data source

Google Sheets memiliki tab utama:

- `Events_Master`
- `Task_Tracker`
- `Idea_Vault`
- `UI_Resources`
- `Submission_Checklist`
- `Operations_Dashboard`
- `Audit_Log`

Record memakai primary key stabil seperti `HACK-001`, `T-001`, `IDEA-001`, dan `SC-001`. Metadata stabil meliputi `Created_At`, `Updated_At`, `Updated_By`, `Record_Status`, `Last_Synced_At`, `Drive_File_ID`, dan `Drive_Folder_ID`.

## Client boundary penting

`LiveSheetTable` adalah Client Component. Props dari halaman Server Component harus serializable. Jangan mengirim callback/function dalam `columns`, `fields`, atau props lain. Untuk formatting kolom gunakan descriptor string yang diproses di client, misalnya `format: 'linked-status'`.

## Integrasi eksternal

Google Sheets dan Drive berjalan di server melalui service account. Akses membutuhkan:

1. Google Sheets API aktif pada project Google Cloud.
2. Google Drive API aktif pada project yang sama.
3. Spreadsheet dibagikan ke service account dengan akses editor bila diperlukan.
4. Folder Drive dibagikan ke service account dengan akses yang sesuai.
5. Nama environment variable tersedia di server runtime.

Nilai credential tidak boleh dicatat di dokumentasi, test, commit, atau output terminal.

## Known operational behavior

- Jika Sheets gagal, komponen live table memakai `initialRows` dan menampilkan error sync.
- Jika dashboard menerima `rows` yang hilang atau bukan array, normalisasi akan memakai fallback lokal.
- Perubahan bersamaan di Sheets dideteksi melalui `_version` dan dikembalikan sebagai HTTP 409.
- Delete adalah soft delete melalui `Record_Status = Deleted`.
- Upload Drive menghubungkan file ke row melalui `Drive_File_ID`, `Evidence_URL`, dan metadata folder.
