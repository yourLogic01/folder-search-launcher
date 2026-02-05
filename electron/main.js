import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import Store from 'electron-store';
import { ipcMain, dialog } from 'electron';
import fs from 'fs';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
const store = new Store();

const MAX_RECENT = 2;

function getFavorites() {
  return store.get('favorites', []);
}

function setFavorites(list) {
  store.set('favorites', list);
}

function getRecents() {
  return store.get('recents', []);
}

function setRecents(list) {
  store.set('recents', list);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    frame: false,
    focusable: true,
    transparent: true,                 
    backgroundColor: '#00000000',       
    hasShadow: false, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Pastikan path ini benar
      contextIsolation: true, // Tambahkan ini
      nodeIntegration: false, // Tambahkan ini untuk keamanan
    }
  });


  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
      mainWindow.loadFile('dist/index.html');
    }
  }



app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('Control+Space', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

    ipcMain.handle('select-root-folder', async () => {
    if (!mainWindow) return null;

        return new Promise((resolve) => {
            // Show dan focus window dulu
            if (!mainWindow.isVisible()) {
            mainWindow.show();
            }
            mainWindow.focus();

            // Gunakan setImmediate atau nextTick untuk memastikan window ready
            setImmediate(async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
                title: 'Select Project Root Folder',
                properties: ['openDirectory'],
                modal: true,
                defaultPath: store.get('rootFolder', app.getPath('home'))
            });

            if (result.canceled) {
                resolve(null);
                return;
            }

            const folderPath = result.filePaths[0];
            store.set('rootFolder', folderPath);
            resolve(folderPath);
            });
        });
    });


    ipcMain.handle('get-root-folder', () => {
        return store.get('rootFolder', null);
    });

    ipcMain.handle('get-projects', () => {
        const rootFolder = store.get('rootFolder');

        if(!rootFolder) return [];

        try {
            const entries = fs.readdirSync(rootFolder, {withFileTypes:true});

            return entries.filter(e => e.isDirectory())
                          .map(e => (
                                {   name : e.name,
                                    path : path.join(rootFolder, e.name)
                                })
                            );
        } catch(err) {
            console.log(err);
            return []
        }
    });

    ipcMain.handle('open-vscode', async (_, projectPath) => {
        exec(`code "${projectPath}"`);
    });

    ipcMain.handle('hide-window', () => {
      if (mainWindow) {
        mainWindow.hide();
      }
    });

    ipcMain.handle('toggle-favorite', (_, projectPath) => {
      const favs = new Set(getFavorites());
      if (favs.has(projectPath)) favs.delete(projectPath);
      else favs.add(projectPath);
      const next = Array.from(favs);
      setFavorites(next);
      return next;
    });

    ipcMain.handle('get-meta', () => {
      return {
        favorites: getFavorites(),
        recents: getRecents(),
      };
    });

    ipcMain.handle('record-recent', (_, projectPath) => {
      const recents = getRecents().filter(p => p !== projectPath);
      recents.unshift(projectPath);
      setRecents(recents.slice(0, MAX_RECENT));
      return recents;
    });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

