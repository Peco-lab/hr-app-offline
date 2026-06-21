<div align="center">

<img src="./.github/assets/banner.svg" alt="HR App — Offline Edition" width="100%" />

<br/>

[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-2A3A40)](#-cara-menjalankan)
[![Built with Electron](https://img.shields.io/badge/built%20with-Electron-1F6F5C)](https://www.electronjs.org/)
[![100% Offline](https://img.shields.io/badge/data-100%25%20offline-C98A1F)](#-kenapa-offline)
[![License: MIT](https://img.shields.io/badge/license-MIT-444444)](./LICENSE)

**Aplikasi HR untuk bisnis kecil (5–20 karyawan) yang hidup 100% di laptop kamu —**
**tanpa server, tanpa subscription, tanpa koneksi internet.**

</div>

<br/>

## Kenapa ini dibuat

Kebanyakan software HR itu SaaS bulanan yang nyimpen data gaji & data pribadi karyawan
kamu di server orang lain. Untuk warung, toko, atau tim kecil yang baru mulai, itu
biaya & risiko yang gak perlu. **HR App — Offline** lahir dari kebutuhan riil: catat
absensi, kelola cuti, hitung gaji (lengkap dengan BPJS & PPh21), dan cetak slip gaji —
semuanya tersimpan di file lokal, bisa jalan tanpa wifi sama sekali, dan gratis selamanya.

## ✨ Fitur

| | |
|---|---|
| 🕒 **Absensi** | Input harian per karyawan, rekap bulanan otomatis, export ke CSV |
| 📅 **Cuti & Izin** | Pengajuan → approve/reject, sisa kuota cuti tahunan dihitung otomatis |
| 💰 **Payroll** | Generate gaji bulanan: gaji pokok + tunjangan − potongan absen, lengkap dengan **BPJS** (Kesehatan + Ketenagakerjaan) dan **PPh21 metode TER** (sesuai PP 58/2023) |
| 🧾 **Slip Gaji PDF** | Cetak slip gaji langsung ke PDF, satu klik, tanpa software tambahan |
| 📁 **Dokumen Karyawan** | Simpan KTP, kontrak, ijazah — tersimpan rapi per karyawan |
| 🔐 **Multi-user** | Akun Admin (akses penuh) & Staff (lihat data diri sendiri saja), password di-hash lokal |
| 💾 **Backup Otomatis** | Auto-backup rotasi + atomic write, anti file korup, plus export manual ke USB/drive |
| 🌐 **100% Offline** | Tidak ada API call ke luar, tidak ada akun cloud, tidak ada telemetry |
| 🇮🇩 / 🇬🇧 **Bilingual** | Toggle Indonesia/English satu klik, di Settings maupun layar login — cocok kalau ada karyawan asing atau buat ditunjukkan ke audiens internasional |

## 🖼️ Tampilan

> Tambahkan screenshot kamu sendiri di sini setelah `npm start` — drag & drop gambar ke
> file ini lewat editor GitHub, atau simpan ke `.github/assets/screenshot-*.png` dan
> referensikan seperti contoh di bawah:
>
> ```md
> <img src=".github/assets/screenshot-dashboard.png" width="100%" />
> ```

## 🧱 Kenapa Offline?

Karena data gaji & data pribadi karyawan itu sensitif, dan bisnis kecil gak selalu punya
budget buat tools enterprise. Dengan menyimpan semua data sebagai file JSON lokal (bukan
database native yang butuh compile), aplikasi ini:

- Tetap jalan walau internet mati total
- Gak ada biaya bulanan/subscription
- Datanya 100% kamu yang pegang — gampang di-backup ke USB kapan saja
- `npm install` tetap ringan & cepat di komputer manapun, tanpa build tools/C++ compiler

## 🚀 Cara Menjalankan

```bash
git clone https://github.com/Peco-lab/HR-app.git
cd HR-app
npm install
npm start
```

Setup pertama kali akan minta kamu membuat akun **Admin** — dari situ kamu bisa mulai
menambahkan karyawan, mengatur rate BPJS, dan generate payroll pertama.

> Koneksi lambat/diblok pas `npm install`? Electron download binary-nya (~100–200MB) dari
> GitHub releases. Kalau gagal, coba pakai mirror:
> ```bash
> # macOS/Linux
> export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
> # Windows PowerShell
> $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
> npm install
> ```

## 🗂️ Struktur Proyek

```
main.js            Electron main process — window + semua IPC handler (CRUD)
preload.js          Jembatan aman ke renderer (contextBridge), tidak expose Node API langsung
store.js            Datastore JSON lokal: read/write/backup, atomic write, auto-recovery
auth.js / *.js       Autentikasi lokal (PBKDF2), tidak ada akun di cloud
payroll-calc.js      Engine BPJS & PPh21 (tabel TER resmi PP 58/2023)
slip-template.js     Template HTML untuk cetak slip gaji ke PDF
renderer/
  index.html         Shell HTML (sidebar + auth screen + view container)
  styles.css         Design system (warna, tipografi, komponen) — lihat di bawah
  app.js             Semua logic UI: render per-view, form, tabel — vanilla JS, no build step
  fonts/             Font lokal (Plus Jakarta Sans + Fraunces), 100% offline, lisensi OFL
```

Tidak ada Webpack/Vite/React di sini — sengaja. Buka `renderer/app.js`, edit, refresh
(<kbd>Ctrl/Cmd + R</kbd>), selesai. Cocok untuk proyek yang dikerjakan satu orang dan
ingin tetap mudah di-maintain dalam jangka panjang.

## 🎨 Tentang Desainnya

Warna & tipografi di app ini sengaja dirancang biar gak kelihatan kayak SaaS generik:
- **Palet**: ink navy + emas (gold) + teal — terinspirasi dari nuansa buku tabungan/slip
  gaji, bukan biru korporat default
- **Tipografi**: [Fraunces](https://fonts.google.com/specimen/Fraunces) untuk
  judul/angka (karakter, ada tekstur), [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
  untuk UI — keduanya di-bundle lokal (`renderer/fonts/`, lisensi OFL) jadi tetap 100%
  offline-safe, gak ada request ke Google Fonts
- **Signature motif**: garis putus-putus "perforasi" yang muncul di beberapa tempat —
  ngambil inspirasi dari sobekan slip gaji

## ⚠️ Soal PPh21 / BPJS

Tabel TER, PTKP, dan tarif Pasal 17 di `payroll-calc.js` disalin dari lampiran resmi
PP No. 58 Tahun 2023 & PMK No. 168 Tahun 2023 (berlaku sejak Jan 2024). Peraturan
pajak/BPJS bisa berubah sewaktu-waktu. **Aplikasi ini alat bantu hitung, bukan
pengganti kepatuhan pajak resmi** — selalu validasi angka penting lewat
[kalkulator.pajak.go.id](https://kalkulator.pajak.go.id) atau konsultan pajak terdaftar
sebelum dipakai untuk pembayaran resmi ke karyawan/negara.

## 🔮 Roadmap

- [ ] Multi-cabang / multi-departemen reporting
- [ ] Reminder otomatis (kontrak habis, ulang tahun karyawan, dll)
- [ ] Penerbitan Bukti Potong (1721-A1) untuk lapor SPT Tahunan via Coretax
- [ ] Installer `.exe` / `.dmg` siap pakai (electron-builder)

Ada ide fitur lain? Buka [issue](../../issues) atau langsung kirim PR.

## 🤝 Contributing

Proyek ini awalnya dibangun untuk kebutuhan internal, tapi terbuka untuk kontribusi:

1. Fork repo ini
2. Buat branch: `git checkout -b fitur/nama-fitur-kamu`
3. Commit perubahan & buka Pull Request

Tidak ada build step — `npm install && npm start` langsung jalan, jadi setup-nya cepat.

## 📄 License

[MIT](./LICENSE) — bebas dipakai, dimodifikasi, dan didistribusikan ulang.

Font yang di-bundle (Plus Jakarta Sans, Fraunces) berlisensi
[SIL Open Font License 1.1](./renderer/fonts/) — lisensi lengkapnya ada di folder
`renderer/fonts/`.

<br/>

<div align="center">
<sub>Dibuat dengan ☕ di Kalimantan, untuk bisnis kecil di mana saja.</sub>
</div>
