const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // Multi-root APIs
  addRootFolder: () => ipcRenderer.invoke("add-root-folder"),
  getRootFolders: () => ipcRenderer.invoke("get-root-folders"),
  removeRootFolder: (folderPath) => ipcRenderer.invoke("remove-root-folder", folderPath),

  // Project APIs
  getProjects: () => ipcRenderer.invoke("get-projects"),
  openInVSCode: (projectPath) => ipcRenderer.invoke("open-vscode", projectPath),

  // Window APIs
  hideWindow: () => ipcRenderer.invoke("hide-window"),

  // Meta APIs
  toggleFavorite: (path) => ipcRenderer.invoke("toggle-favorite", path),
  getMeta: () => ipcRenderer.invoke("get-meta"),
  recordRecent: (path) => ipcRenderer.invoke("record-recent", path),
});
