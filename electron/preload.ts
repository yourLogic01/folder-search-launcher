import { contextBridge, ipcRenderer } from "electron";

// Types
interface Project {
  name: string;
  path: string;
  root: string;
}

interface ProjectMeta {
  favorites: string[];
  recents: string[];
}

interface ElectronAPI {
  // Multi-root APIs
  addRootFolder: () => Promise<string[] | null>;
  getRootFolders: () => Promise<string[]>;
  removeRootFolder: (folderPath: string) => Promise<string[]>;

  // Project APIs
  getProjects: () => Promise<Project[]>;
  openInVSCode: (path: string) => Promise<void>;
  openInExplorer: (path: string) => Promise<void>;
  openInTerminal: (path: string) => Promise<void>;
  openInGitBash: (path: string) => Promise<void>;

  // Window APIs
  hideWindow: () => Promise<void>;

  // Meta APIs
  toggleFavorite: (path: string) => Promise<string[]>;
  getMeta: () => Promise<ProjectMeta>;
  recordRecent: (path: string) => Promise<string[]>;
}

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  // Multi-root APIs
  addRootFolder: () => ipcRenderer.invoke("add-root-folder"),
  getRootFolders: () => ipcRenderer.invoke("get-root-folders"),
  removeRootFolder: (folderPath: string) => ipcRenderer.invoke("remove-root-folder", folderPath),

  // Project APIs
  getProjects: () => ipcRenderer.invoke("get-projects"),
  openInVSCode: (projectPath: string) => ipcRenderer.invoke("open-vscode", projectPath),
  openInExplorer: (projectPath: string) => ipcRenderer.invoke("open-explorer", projectPath),
  openInTerminal: (projectPath: string) => ipcRenderer.invoke("open-terminal", projectPath),
  openInGitBash: (projectPath: string) => ipcRenderer.invoke("open-gitbash", projectPath),

  // Window APIs
  hideWindow: () => ipcRenderer.invoke("hide-window"),

  // Meta APIs
  toggleFavorite: (path: string) => ipcRenderer.invoke("toggle-favorite", path),
  getMeta: () => ipcRenderer.invoke("get-meta"),
  recordRecent: (path: string) => ipcRenderer.invoke("record-recent", path),
} as ElectronAPI);
