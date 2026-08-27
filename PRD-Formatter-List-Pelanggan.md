# PRD — Formatter List Pelanggan (Bad Debt / FAT)

## 1. Latar Belakang
Sanjaya rutin menerima data lapangan (list pelanggan per kode FAT — misal `DPRA036`, `DPRF009`) dalam bentuk teks mentah yang di-paste (dari WA/catatan lapangan). Format teks ini berisi campuran:
- Baris kode FAT (heading grup)
- Baris entri pelanggan bernomor (`#1`, `#2`, dst) berisi ID, nama, koordinat
- Baris catatan/instruksi bebas (misal `add 1:2`, `#7 pindah Buana raya (HAR)`, `#14 user`)

Saat ini proses merapikan teks ini ke dokumen Word (lihat referensi `ICON_BAD_DEBT_SAM_SAM.docx`: heading `## KODE_FAT` diikuti baris `#N ID Nama (STATUS)`) dilakukan manual. Dibutuhkan alat bantu (web app) untuk mempercepat proses ini.

## 2. Tujuan
Membuat web app formatter yang:
1. Menerima paste teks mentah apa adanya (baris campuran seperti di atas).
2. Memecah teks menjadi baris-baris (rows) yang bisa **diedit** dan **dihapus** satu per satu sebelum finalisasi.
3. Mengekspor hasil final ke dua bentuk:
   - File **.docx**
   - **Plain text** yang bisa langsung di-copy-paste ke Word / Google Docs

## 3. Target Pengguna
Sanjaya sendiri (personal tool), untuk mempercepat pekerjaan merapikan data bad debt/FAT.

## 4. Contoh Input Mentah (dari pengguna)
```
DPRA036
DPRF009
add 1:2
#1
#2 551002363888 Ary Asmara -8.6613081,115.18696929999999
#3 551001871139 Irwan Kurnia Yulianto -8.6594235891829,115.185283832
#4 14364847120 Ayusti Septia Husnaini -8.6524973,115.2191175
#5 551001299317 Reza Bregas Pangestu -8.6592797380178,115.187905021
#6 551002874007 I KETUT RAYUN -8.6609014,115.1866814
#7 pindah Buana raya (HAR)
#8 01102178421 Muhkammad Abdul Rohman -8.658885423636457,115.18660185184319
#9 151000424613 Fajar Antonius -8.660867,115.188022
#10 151003423717 DODI ARIYANTO
#11 32109078090 Bitaqia Yumna Agustia -8.66313887081594,115.18745974966966
#12 151000009922 PUTU GEDE HARI DHANANJAYA DAS -8.6609370, 115.1872351
#13 151000021655 *BETI -8.660390,115.189087
#14 user
```

**Catatan penting:** baris seperti `add 1:2`, `#7 pindah Buana raya (HAR)`, `#14 user` **tidak diproses/diinterpretasi secara khusus** — aplikasi cukup memperlakukan setiap baris apa adanya sebagai satu row yang bisa diedit/dihapus manual oleh pengguna. Tidak ada parsing logika khusus di balik baris-baris ini di MVP.

## 5. Cara Kerja (Flow Utama)
1. **Paste Area** — pengguna paste teks mentah ke textarea besar.
2. **Tombol "Proses"** — teks dipecah per baris (setiap baris non-kosong = satu row), ditampilkan sebagai list.
3. **List Editable** — setiap row ditampilkan sebagai satu baris dengan:
   - Teks row (klik untuk edit inline, langsung ubah teksnya)
   - Tombol hapus (ikon ✕) — klik langsung hilangkan row itu dari list
4. Pengguna bisa terus edit/hapus row sampai list sesuai keinginan.
5. **Export**:
   - Tombol **"Export DOCX"** → unduh file `.docx` berisi seluruh row tersisa, urut sesuai list, format mengikuti gaya dokumen referensi (heading untuk baris kode FAT, baris biasa untuk entri lain).
   - Tombol **"Copy as Text"** → salin seluruh row (gabung dengan newline) ke clipboard, siap paste ke Word/Google Docs.

## 6. Aturan Format Output (mengacu ke dokumen referensi)
Berdasarkan `ICON_BAD_DEBT_SAM_SAM.docx`, gaya output yang diikuti:
- Baris yang berupa **kode FAT** (contoh: `DPRA036`, `TABA1153`) → ditulis sebagai **heading** (mis. Heading 2 di docx / `##` di markdown/plain text).
- Baris lain (`#N ...`) → ditulis sebagai **paragraf/list biasa**, urut sesuai daftar, satu baris kosong sebagai pemisah antar entri (mengikuti gaya dokumen referensi).
- **Deteksi baris kode FAT**: baris yang tidak diawali `#` dan tidak mengandung spasi (heuristik sederhana untuk MVP) dianggap kode FAT/heading. Pengguna tetap bisa override manual dengan edit row jika deteksi salah (lihat §8 asumsi).

## 7. Fitur MVP
| # | Fitur | Prioritas |
|---|---|---|
| 1 | Paste teks mentah ke textarea | Wajib |
| 2 | Parse teks jadi list of rows (split per baris) | Wajib |
| 3 | Edit row inline | Wajib |
| 4 | Hapus row (klik ✕) | Wajib |
| 5 | Export ke .docx (mengikuti gaya heading/paragraf di atas) | Wajib |
| 6 | Copy as plain text ke clipboard | Wajib |
| 7 | Auto-save teks mentah & list row ke `localStorage` (persist antar reload) | Wajib |
| 8 | Tombol Reset yang menghapus data di `localStorage` | Wajib |
| 9 | Tambah row baru secara manual | Nice-to-have |
| 10 | Reorder row (drag/naik-turun) | Nice-to-have |
| 11 | Auto-highlight baris yang terdeteksi sebagai heading kode FAT (preview visual sebelum export) | Nice-to-have |
| 12 | Riwayat/simpan beberapa list terpisah (multi-project) di localStorage | Nice-to-have |

## 8. Persistensi Data (localStorage) — WAJIB
Aplikasi ini **100% client-side**, tanpa backend/server, dan **tidak memakai API eksternal apa pun**. Semua data disimpan di `localStorage` browser:

| Key | Isi | Kapan disimpan |
|---|---|---|
| `formatter_raw_text` | Isi textarea teks mentah terakhir | Setiap kali user mengetik/paste (debounce ~300ms) |
| `formatter_rows` | Array of string — daftar row hasil parse yang sedang diedit (termasuk hasil edit/hapus) | Setiap kali row ditambah/diedit/dihapus |

Perilaku:
- Saat halaman dibuka kembali, textarea & list row otomatis di-restore dari `localStorage` (state tidak hilang saat reload/tutup tab).
- Sediakan tombol **"Reset / Mulai Baru"** yang menghapus `formatter_raw_text` dan `formatter_rows` dari `localStorage` serta mengosongkan tampilan.
- Karena tidak ada backend, tidak ada isu privasi lintas-pengguna — data hanya tersimpan lokal di browser device yang dipakai.

## 9. Deployment — GitHub Pages (WAJIB)
Aplikasi harus bisa di-build sebagai **static site** dan di-deploy ke GitHub Pages:

- Build tool: **Vite** (React + Vite), karena output-nya native static (HTML/CSS/JS) dan ringan untuk GitHub Pages.
- Di `vite.config.js`, set `base: '/<nama-repo>/'` (wajib untuk GitHub Pages project site, bukan root domain).
- Routing: **tidak perlu client-side router** — ini single-page tool (satu layar saja), jadi tidak ada isu refresh 404 khas SPA multi-halaman di GitHub Pages.
- Cara deploy (pilih salah satu, sebutkan ke AI IDE mana yang dipakai):
  1. **gh-pages package**: `npm run build` → `npx gh-pages -d dist` (push folder `dist` ke branch `gh-pages`).
  2. **GitHub Actions**: workflow `deploy.yml` yang build otomatis tiap push ke `main` dan publish ke Pages (opsi lebih rapi kalau repo akan terus di-update).
- Tidak boleh ada dependency yang butuh server (no Express, no database, no API key tersembunyi) — semua logic (parse, edit, export docx, localStorage) jalan di browser.

## 10. Tech Stack (final, bukan lagi usulan)
- **Frontend**: React 18 + Vite, Tailwind CSS
- **State & persistensi**: React state (`useState`) + sinkronisasi manual ke `localStorage` (tanpa library tambahan, cukup `localStorage.getItem/setItem` + `JSON.stringify/parse` untuk array `rows`)
- **Export docx**: library `docx` (npm, generate `.docx` di client, lalu trigger download pakai `Blob` + `URL.createObjectURL`)
- **Copy to clipboard**: Clipboard API browser (`navigator.clipboard.writeText`)
- **Hosting**: GitHub Pages (static, lihat §9)
- Tidak ada backend, tidak ada database, tidak ada API key.

## 11. Struktur Proyek yang Disarankan (untuk prompt ke Antigravity)
```
formatter-list-pelanggan/
├── index.html
├── vite.config.js         (base: '/<nama-repo>/')
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx             (layout utama: textarea + list + tombol export)
│   ├── components/
│   │   ├── PasteArea.jsx   (textarea input + tombol "Proses")
│   │   ├── RowList.jsx     (render list row, handle edit inline + hapus)
│   │   ├── RowItem.jsx     (satu row: teks + tombol edit/hapus)
│   │   └── ExportBar.jsx   (tombol Export DOCX, Copy as Text, Reset)
│   ├── utils/
│   │   ├── parseRows.js    (split teks mentah -> array rows, filter baris kosong)
│   │   ├── exportDocx.js   (rows -> generate .docx pakai lib `docx`, deteksi heading kode FAT sesuai §6)
│   │   └── storage.js      (helper get/set/remove localStorage untuk raw_text & rows)
└── .github/workflows/deploy.yml   (opsional, kalau pakai GitHub Actions)
```

## 12. Asumsi & Batasan (perlu dikonfirmasi ulang bila salah)
- Baris kosong di teks mentah diabaikan (tidak jadi row).
- Tidak ada validasi format ID/nama/koordinat di MVP — aplikasi murni text-based row editor, bukan structured data parser.
- Deteksi heading kode FAT bersifat heuristik sederhana (baris tanpa spasi & tanpa `#`); tidak 100% akurat untuk semua kasus, tapi row tetap bisa diedit manual sebelum export.
- Tidak butuh login/akun — tool personal, jalan di browser, data tersimpan di `localStorage` device tersebut saja.
- 100% static & client-side — cocok untuk GitHub Pages, tidak butuh server.

## 13. Kriteria Sukses
- Pengguna bisa paste teks mentah → edit/hapus row → export docx atau copy text dalam < 1 menit, tanpa harus retype manual di Word.
- Hasil export docx terbuka rapi (heading kode FAT terpisah jelas dari entri) tanpa perlu dirapikan ulang di Word.
- Setelah reload browser, teks mentah & list row terakhir tetap ada (localStorage berfungsi).
- Aplikasi bisa di-build (`npm run build`) dan tayang normal di URL GitHub Pages tanpa error 404/aset hilang.

## 14. Langkah Selanjutnya
Setelah PRD ini dikonfirmasi, lanjut buat:
- **Rules file** (aturan teknis/coding untuk AI IDE)
- **AI Execution Brief** (instruksi eksekusi step-by-step untuk Antigravity/AI IDE, siap paste sebagai prompt awal)
