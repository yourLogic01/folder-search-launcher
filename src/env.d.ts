interface Window {
  api: {
    // Multi-root APIs
    addRootFolder: () => Promise<string[] | null>;
    getRootFolders: () => Promise<string[]>;
    removeRootFolder: (folderPath: string) => Promise<string[]>;

    // Project APIs
    getProjects: () => Promise<{ name: string; path: string; root: string }[]>;
    openInVSCode: (path: string) => Promise<void>;

    // Window APIs
    hideWindow: () => Promise<void>;

    // Meta APIs
    toggleFavorite: (path: string) => Promise<string[]>;
    getMeta: () => Promise<{ favorites: string[]; recents: string[] }>;
    recordRecent: (path: string) => Promise<string[]>;
  };
}
