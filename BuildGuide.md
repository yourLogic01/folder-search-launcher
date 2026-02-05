# Project Searcher Launcher - Build & Deployment Guide

## 📦 Build Setup

### Prerequisites

1. Install dependencies:

```bash
npm install
# or
yarn install
```

### Development Mode

```bash
npm run electron:dev
```

- Vite dev server akan jalan di `http://localhost:5173`
- Electron akan auto-reload saat ada perubahan

### Build Production

#### Build untuk Windows (.exe installer)

```bash
npm run build:win
```

Output:

- File installer akan ada di folder `release/`
- Nama file: `Project Searcher Launcher Setup x.x.x.exe`

#### Build untuk testing (tanpa installer)

```bash
npm run build:dir
```

- Untuk testing build tanpa membuat installer
- Output di `release/win-unpacked/`

## 🚀 Auto-Launch Setup

### Sudah Built-in di Aplikasi

Aplikasi sudah dikonfigurasi untuk:

- ✅ Auto-start saat Windows startup
- ✅ Mulai dalam mode hidden (background)
- ✅ Shortcut `Ctrl+Space` langsung aktif

### Cara Kerja

1. Saat install, aplikasi akan otomatis menambahkan dirinya ke Windows startup
2. Setiap kali laptop dinyalakan, aplikasi akan berjalan di background
3. User tinggal tekan `Ctrl+Space` untuk memunculkan launcher

### Disable Auto-Launch (Optional)

Jika user ingin disable auto-launch:

1. Buka Task Manager → Tab "Startup"
2. Cari "Project Searcher Launcher"
3. Klik "Disable"

## 📁 File Structure

```
project-root/
├── src/                    # Vue source files
│   ├── App.vue
│   └── main.ts
├── electron/               # Electron main process
│   ├── main.ts            # Main process (dikompilasi ke dist-electron/)
│   |── preload.ts         # Preload script
│   ├── main.js            # versi js
│   └── preload.js         # versi js
├── dist/                   # Vite build output (production)
├── dist-electron/          # Electron build output
├── release/                # Final installer output
└── build/                  # Icons & build resources
    ├── icon.ico           # Windows icon
    ├── icon.icns          # macOS icon
    └── icon.png           # Linux icon
```

## 🎨 Icon Setup

Untuk custom icon, siapkan file:

- **Windows**: `build/icon.ico` (256x256)
- **macOS**: `build/icon.icns`
- **Linux**: `build/icon.png` (512x512)

Bisa generate dari PNG menggunakan:

```bash
# Install electron-icon-builder
npm install -g electron-icon-builder

# Generate dari PNG
electron-icon-builder --input=./icon.png --output=./build --flatten
```

## ⚙️ Vite Configuration

Pastikan `vite.config.ts` sudah benar:

```javascript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    electron([
      {
        entry: "electron/main.ts",
      },
      {
        entry: "electron/preload.ts",
      },
    ]),
  ],
});
```

## 🔧 Troubleshooting

### Build Error: "Cannot find module"

- Pastikan semua dependencies sudah terinstall
- Run `npm install` lagi

### Aplikasi tidak auto-launch

- Cek Windows Task Manager → Startup tab
- Pastikan aplikasi enabled

### Shortcut tidak bekerja

- Restart aplikasi
- Cek apakah ada aplikasi lain yang pakai `Ctrl+Space`

### White screen saat dibuka

- Cek path di `main.ts` → `loadFile()` sudah benar
- Pastikan `vite.config.ts` punya `base: './'`

## 📝 Notes

- **Development**: Pakai `npm run electron:dev` untuk development
- **Production Build**: Pakai `npm run build:win` untuk build installer
- **Auto-launch**: Sudah otomatis enabled saat install
- **Shortcut**: `Ctrl+Space` (bisa diubah di `main.ts`)

## 🔄 Update Version

Edit di `package.json`:

```json
{
  "version": "1.0.1"
}
```

Then rebuild:

```bash
npm run build:win
```

## 📦 Distribution

Setelah build, file installer ada di:

```
release/Project Searcher Launcher Setup x.x.x.exe
```

User tinggal:

1. Download file .exe
2. Install (double click)
3. Aplikasi otomatis jalan di background
4. Tekan `Ctrl+Space` untuk buka launcher
