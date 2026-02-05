"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  // Multi-root APIs
  addRootFolder: () => electron.ipcRenderer.invoke("add-root-folder"),
  getRootFolders: () => electron.ipcRenderer.invoke("get-root-folders"),
  removeRootFolder: (folderPath) => electron.ipcRenderer.invoke("remove-root-folder", folderPath),
  // Project APIs
  getProjects: () => electron.ipcRenderer.invoke("get-projects"),
  openInVSCode: (projectPath) => electron.ipcRenderer.invoke("open-vscode", projectPath),
  openInExplorer: (projectPath) => electron.ipcRenderer.invoke("open-explorer", projectPath),
  openInTerminal: (projectPath) => electron.ipcRenderer.invoke("open-terminal", projectPath),
  openInGitBash: (projectPath) => electron.ipcRenderer.invoke("open-gitbash", projectPath),
  // Window APIs
  hideWindow: () => electron.ipcRenderer.invoke("hide-window"),
  // Meta APIs
  toggleFavorite: (path) => electron.ipcRenderer.invoke("toggle-favorite", path),
  getMeta: () => electron.ipcRenderer.invoke("get-meta"),
  recordRecent: (path) => electron.ipcRenderer.invoke("record-recent", path)
});
