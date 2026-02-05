const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectRootFolder: () => ipcRenderer.invoke('select-root-folder'),
  getRootFolder: () => ipcRenderer.invoke('get-root-folder'),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  openInVSCode: (projectPath) =>
    ipcRenderer.invoke('open-vscode', projectPath),

  toggleFavorite: (path) => ipcRenderer.invoke('toggle-favorite', path),
  getMeta: () => ipcRenderer.invoke('get-meta'),
  recordRecent: (path) => ipcRenderer.invoke('record-recent', path),
});