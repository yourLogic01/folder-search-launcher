interface Window {
  api: {
    selectRootFolder: () => Promise<string | null>;
    getRootFolder: () => Promise<string | null>;
    getProjects: () => Promise<{ name: string; path: string }[]>;
    openInVSCode: (path: string) => Promise<void>;
    hideWindow: () => Promise<void>;
    toggleFavorite: (path: string) => Promise<string[]>;
    getMeta: () => Promise<{ favorites: string[]; recents: string[] }>;
    recordRecent: (path: string) => Promise<string[]>;
  };
}
