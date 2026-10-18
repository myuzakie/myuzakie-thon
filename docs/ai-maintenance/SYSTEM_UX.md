# SYSTEM UX Rules

Dokumen ini adalah gate wajib untuk setiap `feat`, `fix`, atau perubahan UI pada Hackathon OS.

## 1. Clarity first

- Setiap halaman harus menjawab: sedang berada di mana, data apa yang dilihat, statusnya apa, dan tindakan berikutnya apa.
- Jangan menampilkan raw ID folder/file sebagai label utama. Gunakan nama resource dan simpan ID hanya sebagai metadata teknis.
- Empty, loading, error, dan conflict state harus memiliki pesan yang bisa ditindaklanjuti.
- Error dari provider eksternal harus disanitasi; jangan menampilkan HTML, access token, service account, atau response mentah.

## 2. Data-aware controls

- URL harus tampil sebagai link yang dapat dibuka di tab baru dengan `target='_blank'`, `rel='noreferrer'`, dan icon external link.
- Status, priority, verification, eligibility, dan review memakai select/combo, bukan input teks bebas jika options sudah diketahui.
- Currency memakai input numeric-friendly dan mempertahankan prefix mata uang yang sudah ada.
- Catatan panjang memakai textarea.
- Date hanya memakai date control jika nilai dapat diparse secara aman; nilai tanggal eksternal yang tidak standar tetap memakai text input agar tidak rusak.
- Primary key tidak boleh diedit.

## 3. Evidence UX

- Evidence dibuka dalam drawer besar atau halaman khusus, bukan modal sempit.
- Breadcrumb harus menunjukkan nama folder.
- File browser harus mendukung list/grid, search, filter tipe, metadata, preview, upload progress, refresh, dan Open in Drive.
- Status linked/unlinked harus terlihat tanpa membuka detail.
- Upload gagal harus menampilkan pesan ringkas dan aman, bukan response HTML provider.

## 4. Interaction and accessibility

- Setiap icon-only action wajib memiliki `aria-label` dan tooltip/title yang jelas.
- Action destructive harus punya konfirmasi atau soft-delete behavior.
- Drawer memiliki sticky header/footer untuk context dan action utama.
- Button label harus berupa verb yang jelas: `Edit`, `Change status`, `Open evidence`, `Copy ID`, `Refresh`.
- Layout wajib responsif: 12-column content grid pada desktop dan full-width sheet pada mobile.

## 5. Design system

- Gunakan shadcn/ui primitives dan spacing yang sudah ada.
- Pertahankan monochrome sebagai base visual.
- Gunakan warna semantic hanya untuk makna status: destructive, amber, emerald, sky.
- Jangan menambahkan warna dekoratif yang tidak memperkuat hierarchy atau status.

## 6. Engineering gate

Sebelum merge setiap perubahan:

1. Tambahkan atau ubah regression test untuk behavior baru.
2. Jalankan `pnpm test`.
3. Jalankan `pnpm lint` dan `pnpm check-types`.
4. Jalankan `pnpm build`.
5. Tambahkan entry di `docs/ai-maintenance/CHANGELOG.md`.
6. Jika behavior UI berubah, update manual smoke test di `TESTING.md`.
