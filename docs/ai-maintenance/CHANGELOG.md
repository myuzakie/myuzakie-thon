# AI Fix Log

Log ini mencatat perubahan yang sudah dilakukan agar agent berikutnya tidak mengulang diagnosis yang sama.

## 2026-10-18 — Drive upload and SYSTEM UX hardening

- Branch: `fix/dashboard-data-guard`
- Commits: `e28b798a fix(drive): correct multipart upload endpoint`, `ca408a5a feat(workspace): strengthen typed record editing`, `a0224714 test(ui): cover drive transport and field rules`
- Masalah: upload membentuk URL `/drive/v3/upload/drive/v3/files` sehingga Google mengembalikan 404 HTML; drawer terlalu sempit; detail menampilkan nilai teknis dan URL sebagai teks biasa; editor belum membedakan currency, select, URL, dan textarea.
- Perbaikan: endpoint multipart dipisah dari Drive metadata endpoint; error provider disanitasi; drawer Evidence diperlebar; URL menjadi link aktif; raw Drive IDs dipindahkan ke System information; editor memakai rule field type; ditambahkan `SYSTEM_UX.md` sebagai gate wajib.
- Validasi: 6 test files, 16 tests lulus; lint, type check, dan production build lulus.

## 2026-10-18 — Live table serialization and regression tests

- Branch: `fix/dashboard-data-guard`
- Commits: `50e30527 fix(workspace): serialize live table columns`, `086b1e1b test(workspace): cover dashboard sheets and drive actions`
- Masalah: `/hackathons` mengirim function formatter dari Server Component ke Client Component dan dashboard/workspace belum memiliki regression test otomatis.
- Perbaikan: formatter menjadi descriptor serializable; ditambahkan Vitest untuk normalisasi dashboard, metric, formatter, Sheets CRUD validation, Drive listing/upload/linking, dan audit log.
- Validasi: 4 test files, 12 tests lulus; lint, type check, dan production build lulus.

## 2026-10-18 — Dashboard data guard

- Branch: `fix/dashboard-data-guard`
- Commit: `0794c2e8 fix(dashboard): guard against missing sheet rows`
- Masalah: `/dashboard` crash pada `events.filter(...)` ketika props atau response API tidak berisi array.
- Perbaikan: normalisasi `events`, `tasks`, dan `submission`; fallback lokal dipakai ketika `rows` hilang atau invalid; metric dashboard dipisahkan menjadi fungsi yang dapat dites.
- Validasi: dashboard metrics dan invalid payload regression tests lulus.

## 2026-10-18 — Server/client serialization

- Branch: `fix/dashboard-data-guard`
- Masalah: `/hackathons` mengirim `format: function` dari Server Component ke `LiveSheetTable` Client Component.
- Perbaikan: formatter diganti descriptor serializable `format: 'linked-status'`; formatting dieksekusi di client melalui `formatColumnValue`.
- Validasi: test formatter lulus dan production build lulus.

## 2026-10-18 — Evidence workspace

- Branch: `feature/drive-evidence-workspace`
- Commit: `0a80f05b feat(drive): redesign evidence workspace`
- Perbaikan: modal Drive menjadi drawer lebar dengan breadcrumb, list/grid, search, filter, metadata, preview, empty state, drag-and-drop upload, dan progress upload.

## 2026-10-18 — Record detail drawer

- Branch: `feature/drive-evidence-workspace`
- Commit: `12b1f6ee feat(workspace): improve record detail drawer`
- Perbaikan: grouping Overview/Planning/Status/Evidence/Activity, sticky header/footer, system information, Edit, Change status, Open evidence, dan Copy ID.

## Riwayat dasar yang relevan

- `51f40feb feat(dashboard): build live command center`
- `539d52b5 feat(hackathons): streamline event workspace`
- `ec375195 feat(projects): add delivery workspace views`
- `f5b8a4c5 feat(production): add live operations sync and metadata migration`
- `55215060 feat(security): protect workspace and audit spreadsheet changes`
- `bfce4b15 fix(sheets): expand grids for metadata migration`
- `14f5f586 fix(auth): normalize login credentials`
