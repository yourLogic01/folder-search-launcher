# 🚀 Project Searcher Launcher

Quick project launcher dengan multi-root support untuk membuka project dengan cepat menggunakan keyboard shortcut.

## ✨ Features

- 🔍 **Quick Search** - Cari project dengan cepat menggunakan fuzzy search
- 📁 **Multi-Root** - Support multiple root folders
- ⭐ **Favorites** - Tandai project favorit
- 🕐 **Recents** - Track project yang baru dibuka
- ⌨️ **Keyboard Shortcuts** - Full keyboard navigation
- 💻 **Multiple Open Options**:
  - Open with VSCode
  - Open in File Explorer
  - Open in Terminal
  - Open with Git Bash
- 🎨 **Modern UI** - Clean, dark theme interface
- 🚀 **Auto-Launch** - Otomatis jalan saat startup

## ⌨️ Keyboard Shortcuts

| Shortcut     | Action              |
| ------------ | ------------------- |
| `Ctrl+Space` | Show/Hide launcher  |
| `↑/↓`        | Navigate projects   |
| `Enter`      | Show action menu    |
| `1-4`        | Quick select action |
| `Ctrl+D`     | Toggle favorite     |
| `Esc`        | Close/Cancel        |

## 🔧 Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm atau yarn

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run electron:dev
```

Aplikasi akan:

1. Start Vite dev server di `http://localhost:5173`
2. Launch Electron window
3. Auto-reload saat ada perubahan code

## 📦 Build Production

### Build Windows Installer

```bash
npm run build:win
```

Output: `release/Project Searcher Launcher Setup x.x.x.exe`

### Build untuk Testing

```bash
npm run build:dir
```

Output: `release/win-unpacked/` (portable version)

## 🎯 Project Structure

```
project-searcher-launcher/
├── src/                    # Vue source files
│   ├── App.vue            # Main UI component
│   └── main.js            # Vue entry point
├── electron/               # Electron main process
│   ├── main.js            # Main process
│   └── preload.js         # Preload script
├── dist/                   # Vite build output
├── dist-electron/          # Electron compiled files
├── release/                # Build output (.exe)
└── build/                  # Build resources (icons)
```

## 🎨 Icon Setup

Place your icons in `build/` folder:

- `icon.ico` - Windows icon (256x256)
- `icon.icns` - macOS icon
- `icon.png` - Linux icon (512x512)

## 🔧 Configuration

### Change Keyboard Shortcut

Edit `electron/main.js`:

```javascript
globalShortcut.register("Control+Space", () => {
  // Change 'Control+Space' to your preferred shortcut
});
```

### Disable Auto-Launch

Edit `electron/main.js`:

```javascript
app.setLoginItemSettings({
  openAtLogin: false, // Change to false
});
```

## 📝 Usage

1. **Add Root Folders**
   - Click folder icon di header
   - Click "Add Root"
   - Pilih folder yang berisi projects

2. **Search Projects**
   - Tekan `Ctrl+Space`
   - Ketik nama project
   - Navigate dengan arrow keys
   - Tekan `Enter`

3. **Open Project**
   - Pilih action (VSCode/Explorer/Terminal/Git Bash)
   - Or tekan `1-4` untuk quick select

4. **Mark as Favorite**
   - Navigate ke project
   - Tekan `Ctrl+D` atau click star icon
   - Favorites akan muncul di atas list

## 🐛 Troubleshooting

### Aplikasi tidak muncul saat tekan Ctrl+Space

- Pastikan aplikasi running di background
- Check Task Manager → ada process "Project Searcher Launcher"
- Restart aplikasi

### Build error: Cannot find module

```bash
# Clear cache dan reinstall
rm -rf node_modules
npm install
```

### White screen saat build production

- Pastikan `vite.config.js` punya `base: './'`
- Check path di `main.js` → `loadFile()` sudah benar

### Auto-launch tidak jalan

- Check Windows Settings → Apps → Startup
- Enable "Project Searcher Launcher"

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License

## 🙏 Credits

Built with:

- [Electron](https://www.electronjs.org/)
- [Vue 3](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Lucide Icons](https://lucide.dev/)
- [TailwindCSS](https://tailwindcss.com/)
