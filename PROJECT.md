# Hackathon OS — Project Documentation

## Tujuan

Hackathon OS adalah workspace internal untuk memilih hackathon, mengelola task, memvalidasi ide, menyimpan resource UI, menyiapkan submission, dan menghubungkan evidence dengan Google Drive. Google Sheets digunakan sebagai source of truth yang dapat diedit dari aplikasi maupun langsung.

## Fitur

- Dashboard command center dengan KPI actionable dan needs attention.
- Hackathon event workspace.
- Project delivery workspace dengan table, kanban, timeline, progress, dan status.
- Idea management.
- UI resource catalog.
- Submission checklist.
- Google Sheets read/write CRUD, refresh, auto-sync, version conflict, dan audit log.
- Google Drive browse, folder navigation, upload, preview, linking file, search/filter, dan Open in Drive.
- Internal authentication dan protected pages.
- Monochrome shadcn design system dengan semantic status colors.

## Struktur kode

```text
src/
  app/
    (pages)/             halaman aplikasi
    api/                 auth, Sheets, Drive, health, integrations
  components/
    hackathon/           command center dan workspace components
    ui/                  shadcn primitives
  lib/
    auth.ts              session dan security helpers
    google-workspace.ts  server-only Sheets/Drive adapter
    hackathon-data.ts    fallback snapshot dan project metadata
docs/
  ai-maintenance/       konteks agent, fix log, dan testing guide
tests/
  unit/                 pure logic dan formatter tests
  api/                  route tests dengan Google API mock
```

## Local development

```bash
pnpm install
pnpm dev
```

Build verification:

```bash
pnpm test
pnpm lint
pnpm check-types
pnpm build
```

## Branching dan commit

Gunakan branch sesuai pekerjaan, misalnya `feature/drive-evidence-workspace` atau `fix/dashboard-data-guard`.

Gunakan commit standar:

- `feat(scope): add capability`
- `fix(scope): correct behavior`
- `test(scope): cover behavior`
- `docs(scope): update project context`

Jangan menambahkan label AI/Codex ke branch atau commit.

## Security

- Jangan memasukkan nilai credential ke source code, test, markdown, log, atau commit.
- Google service account hanya dipakai pada server.
- Validasi session dan same-origin dilakukan pada mutation API.
- API upload membatasi ukuran dan tipe file.
- Audit log menyimpan perubahan CRUD dan upload.

## Integrasi Google

Pastikan Sheets API dan Drive API aktif, spreadsheet serta folder dibagikan ke service account, dan tab memiliki header yang sesuai. Jika integrasi belum siap, UI tetap menggunakan fallback lokal agar pengguna dapat memahami struktur workspace.

## Dokumentasi lanjutan

Baca [AI Maintenance Guide](docs/ai-maintenance/README.md), [Project State](docs/ai-maintenance/PROJECT_STATE.md), [AI Fix Log](docs/ai-maintenance/CHANGELOG.md), [Testing Guide](docs/ai-maintenance/TESTING.md), dan [SYSTEM UX Rules](docs/ai-maintenance/SYSTEM_UX.md) sebelum melakukan perubahan berikutnya.
