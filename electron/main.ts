import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import Store from "electron-store";
import fs from "fs";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define store schema
interface StoreSchema {
  favorites: string[];
  recents: string[];
  rootFolders: string[];
  rootFolder?: string; // Legacy support
}

let mainWindow: BrowserWindow | null = null;
const store = new Store({
  defaults: {
    favorites: [],
    recents: [],
    rootFolders: [],
  },
}) as any;

const MAX_RECENT = 2;

// Types
interface ProjectMeta {
  favorites: string[];
  recents: string[];
}

interface Project {
  name: string;
  path: string;
  root: string;
}

// Store helpers
function getFavorites(): string[] {
  return store.get("favorites", []) as string[];
}

function setFavorites(list: string[]): void {
  store.set("favorites", list);
}

function getRecents(): string[] {
  return store.get("recents", []) as string[];
}

function setRecents(list: string[]): void {
  store.set("recents", list);
}

function getRootFolders(): string[] {
  return store.get("rootFolders", []) as string[];
}

function setRootFolders(list: string[]): void {
  store.set("rootFolders", list);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    frame: false,
    focusable: true,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.webContents.on("did-fail-load", () => {
    console.error("Failed to load window");
  });
}

app.whenReady().then(() => {
  createWindow();

  // Setup auto-launch on startup
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
    path: app.getPath("exe"),
  });

  globalShortcut.register("Control+Space", () => {
    if (!mainWindow) return;

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Add new root folder
  ipcMain.handle("add-root-folder", async (): Promise<string[] | null> => {
    if (!mainWindow) return null;

    return new Promise((resolve) => {
      if (!mainWindow) {
        resolve(null);
        return;
      }

      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();

      setImmediate(async () => {
        if (!mainWindow) {
          resolve(null);
          return;
        }

        const result = await dialog.showOpenDialog(mainWindow, {
          title: "Add Project Root Folder",
          properties: ["openDirectory"],
          defaultPath: app.getPath("home"),
        });

        if (result.canceled) {
          resolve(null);
          return;
        }

        const folderPath = result.filePaths[0];
        const currentRoots = getRootFolders();

        if (!currentRoots.includes(folderPath)) {
          const updatedRoots = [...currentRoots, folderPath];
          setRootFolders(updatedRoots);
          resolve(updatedRoots);
        } else {
          resolve(currentRoots);
        }
      });
    });
  });

  // Get all root folders
  ipcMain.handle("get-root-folders", (): string[] => {
    return getRootFolders();
  });

  // Remove root folder
  ipcMain.handle("remove-root-folder", (_, folderPath: string): string[] => {
    const currentRoots = getRootFolders();
    const updatedRoots = currentRoots.filter((root) => root !== folderPath);
    setRootFolders(updatedRoots);
    return updatedRoots;
  });

  // Get projects from all root folders
  ipcMain.handle("get-projects", (): Project[] => {
    const rootFolders = getRootFolders();

    if (!rootFolders || rootFolders.length === 0) return [];

    const allProjects: Project[] = [];

    rootFolders.forEach((rootFolder) => {
      try {
        if (!fs.existsSync(rootFolder)) return;

        const entries = fs.readdirSync(rootFolder, { withFileTypes: true });

        const projects = entries
          .filter((e) => e.isDirectory())
          .map((e) => ({
            name: e.name,
            path: path.join(rootFolder, e.name),
            root: rootFolder,
          }));

        allProjects.push(...projects);
      } catch (err) {
        console.log(`Error reading ${rootFolder}:`, err);
      }
    });

    return allProjects;
  });

  ipcMain.handle("open-vscode", async (_, projectPath: string): Promise<void> => {
    exec(`code "${projectPath}"`);
  });

  ipcMain.handle("open-explorer", async (_, projectPath: string): Promise<void> => {
    if (process.platform === "win32") {
      exec(`explorer "${projectPath}"`);
    } else if (process.platform === "darwin") {
      exec(`open "${projectPath}"`);
    } else {
      exec(`xdg-open "${projectPath}"`);
    }
  });

  ipcMain.handle("open-terminal", async (_, projectPath: string): Promise<void> => {
    if (process.platform === "win32") {
      exec(`start cmd /K "cd /d "${projectPath}""`);
    } else if (process.platform === "darwin") {
      exec(`open -a Terminal "${projectPath}"`);
    } else {
      exec(`x-terminal-emulator --working-directory="${projectPath}" || gnome-terminal --working-directory="${projectPath}" || xterm -e "cd '${projectPath}' && bash"`);
    }
  });

  ipcMain.handle("open-gitbash", async (_, projectPath: string): Promise<void> => {
    if (process.platform === "win32") {
      exec(`"C:\\Program Files\\Git\\git-bash.exe" --cd="${projectPath}"`, (error) => {
        if (error) {
          exec(`start bash -c "cd '${projectPath}' && exec bash"`);
        }
      });
    } else if (process.platform === "darwin") {
      exec(`open -a Terminal "${projectPath}"`);
    } else {
      exec(`x-terminal-emulator --working-directory="${projectPath}" || gnome-terminal --working-directory="${projectPath}" || xterm -e "cd '${projectPath}' && bash"`);
    }
  });

  ipcMain.handle("hide-window", (): void => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  ipcMain.handle("toggle-favorite", (_, projectPath: string): string[] => {
    const favs = new Set(getFavorites());
    if (favs.has(projectPath)) {
      favs.delete(projectPath);
    } else {
      favs.add(projectPath);
    }
    const next = Array.from(favs);
    setFavorites(next);
    return next;
  });

  ipcMain.handle("get-meta", (): ProjectMeta => {
    return {
      favorites: getFavorites(),
      recents: getRecents(),
    };
  });

  ipcMain.handle("record-recent", (_, projectPath: string): string[] => {
    const recents = getRecents().filter((p) => p !== projectPath);
    recents.unshift(projectPath);
    setRecents(recents.slice(0, MAX_RECENT));
    return recents;
  });

  // Legacy support - migrate old single root to multi root
  const oldRoot = store.get("rootFolder");
  if (oldRoot && getRootFolders().length === 0) {
    setRootFolders([oldRoot as string]);
    store.delete("rootFolder");
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
