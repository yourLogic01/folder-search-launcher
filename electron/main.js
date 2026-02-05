import { app, BrowserWindow, globalShortcut } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import Store from "electron-store";
import { ipcMain, dialog } from "electron";
import fs from "fs";
import { exec } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
const store = new Store();

const MAX_RECENT = 2;

function getFavorites() {
  return store.get("favorites", []);
}

function setFavorites(list) {
  store.set("favorites", list);
}

function getRecents() {
  return store.get("recents", []);
}

function setRecents(list) {
  store.set("recents", list);
}

// New multi-root functions
function getRootFolders() {
  return store.get("rootFolders", []);
}

function setRootFolders(list) {
  store.set("rootFolders", list);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 400,
    show: false,
    frame: false,
    focusable: true,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile("dist/index.html");
  }
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("Control+Space", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Add new root folder
  ipcMain.handle("add-root-folder", async () => {
    if (!mainWindow) return null;

    return new Promise((resolve) => {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();

      setImmediate(async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
          title: "Add Project Root Folder",
          properties: ["openDirectory"],
          modal: true,
          defaultPath: app.getPath("home"),
        });

        if (result.canceled) {
          resolve(null);
          return;
        }

        const folderPath = result.filePaths[0];
        const currentRoots = getRootFolders();

        // Check if already exists
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
  ipcMain.handle("get-root-folders", () => {
    return getRootFolders();
  });

  // Remove root folder
  ipcMain.handle("remove-root-folder", (_, folderPath) => {
    const currentRoots = getRootFolders();
    const updatedRoots = currentRoots.filter((root) => root !== folderPath);
    setRootFolders(updatedRoots);
    return updatedRoots;
  });

  // Get projects from all root folders
  ipcMain.handle("get-projects", () => {
    const rootFolders = getRootFolders();

    if (!rootFolders || rootFolders.length === 0) return [];

    const allProjects = [];

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

  ipcMain.handle("open-vscode", async (_, projectPath) => {
    exec(`code "${projectPath}"`);
  });

  ipcMain.handle("hide-window", () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  ipcMain.handle("toggle-favorite", (_, projectPath) => {
    const favs = new Set(getFavorites());
    if (favs.has(projectPath)) favs.delete(projectPath);
    else favs.add(projectPath);
    const next = Array.from(favs);
    setFavorites(next);
    return next;
  });

  ipcMain.handle("get-meta", () => {
    return {
      favorites: getFavorites(),
      recents: getRecents(),
    };
  });

  ipcMain.handle("record-recent", (_, projectPath) => {
    const recents = getRecents().filter((p) => p !== projectPath);
    recents.unshift(projectPath);
    setRecents(recents.slice(0, MAX_RECENT));
    return recents;
  });

  // Legacy support - migrate old single root to multi root
  const oldRoot = store.get("rootFolder");
  if (oldRoot && getRootFolders().length === 0) {
    setRootFolders([oldRoot]);
    store.delete("rootFolder");
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
