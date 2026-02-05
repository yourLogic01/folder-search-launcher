<script setup lang="ts">
import { Folder, Star, Plus, X, FolderOpen } from "lucide-vue-next";
import { ref, onMounted, computed, watch, nextTick } from "vue";

type Project = { name: string; path: string; root: string };

const projects = ref<Project[]>([]);
const keyword = ref("");
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const listContainerRef = ref<HTMLDivElement | null>(null);
const favorites = ref<Set<string>>(new Set());
const recents = ref<string[]>([]);
const rootFolders = ref<string[]>([]);
const showRootManager = ref(false);

const addRootFolder = async () => {
  const updated = await window.api.addRootFolder();
  if (updated) {
    rootFolders.value = updated;
    projects.value = await window.api.getProjects();
    await focusInput();
  }
};

const removeRootFolder = async (folderPath: string) => {
  const updated = await window.api.removeRootFolder(folderPath);
  rootFolders.value = updated;
  projects.value = await window.api.getProjects();
};

const toggleRootManager = () => {
  showRootManager.value = !showRootManager.value;
  if (!showRootManager.value) {
    focusInput();
  }
};

onMounted(async () => {
  rootFolders.value = await window.api.getRootFolders();
  if (rootFolders.value.length > 0) {
    projects.value = await window.api.getProjects();
  }
  const meta = await window.api.getMeta();
  favorites.value = new Set(meta.favorites);
  recents.value = meta.recents;
  if (rootFolders.value.length > 0) {
    await focusInput();
  }
});

const isFav = (p: Project) => favorites.value.has(p.path);
const recentIndex = (p: Project) => recents.value.indexOf(p.path);

const baseFiltered = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return [];
  return projects.value.filter((p) => p.name.toLowerCase().includes(q));
});

const sorted = computed(() => {
  return [...baseFiltered.value].sort((a, b) => {
    const af = isFav(a) ? 1 : 0;
    const bf = isFav(b) ? 1 : 0;
    if (af !== bf) return bf - af;

    const ar = recentIndex(a);
    const br = recentIndex(b);
    if (ar !== -1 || br !== -1) {
      if (ar === -1) return 1;
      if (br === -1) return -1;
      return ar - br;
    }
    return a.name.localeCompare(b.name);
  });
});

const toggleFav = async (p: Project) => {
  const next = await window.api.toggleFavorite(p.path);
  favorites.value = new Set(next);
};

const focusInput = async () => {
  await nextTick();
  inputRef.value?.focus();
};

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return [];
  return projects.value.filter((p) => p.name.toLowerCase().includes(q));
});

watch(keyword, () => {
  selectedIndex.value = 0;
});

const scrollToSelected = () => {
  nextTick(() => {
    if (!listContainerRef.value) return;
    const selectedElement = listContainerRef.value.querySelector(`[data-index="${selectedIndex.value}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  });
};

const openSelected = async () => {
  const item = sorted.value[selectedIndex.value];
  if (!item) return;
  await window.api.recordRecent(item.path);
  await window.api.openInVSCode(item.path);
  keyword.value = "";
  selectedIndex.value = 0;
  await window.api.hideWindow();
};

const hideLauncher = async () => {
  keyword.value = "";
  selectedIndex.value = 0;
  showRootManager.value = false;
  await window.api.hideWindow();
};

const onKeydown = (e: KeyboardEvent) => {
  if (showRootManager.value && e.key !== "Escape") return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (!filtered.value.length) return;
    selectedIndex.value = (selectedIndex.value + 1) % filtered.value.length;
    scrollToSelected();
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (!filtered.value.length) return;
    selectedIndex.value = (selectedIndex.value - 1 + filtered.value.length) % filtered.value.length;
    scrollToSelected();
  }

  if (e.key === "Enter") {
    e.preventDefault();
    openSelected();
  }

  if (e.key === "Escape") {
    e.preventDefault();
    if (showRootManager.value) {
      showRootManager.value = false;
      focusInput();
    } else {
      hideLauncher();
    }
  }

  if (e.key === "d" && e.ctrlKey) {
    e.preventDefault();
    const item = sorted.value[selectedIndex.value];
    if (item) toggleFav(item);
  }
};

const getRootName = (rootPath: string) => {
  return rootPath.split(/[\\/]/).filter(Boolean).pop() || rootPath;
};
</script>

<template>
  <div class="h-screen w-screen flex items-center justify-center">
    <div class="w-132 rounded-2xl bg-zinc-900 text-zinc-100 shadow-2xl border border-zinc-700/50 overflow-hidden animate-[scaleFadeIn_120ms_ease-out_forwards] flex flex-col" style="max-height: 90vh" tabindex="0" @keydown="onKeydown">
      <!-- HEADER - FIXED -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50 flex-shrink-0">
        <div class="text-sm font-semibold tracking-wide">Project Searcher Launcher</div>

        <div class="flex items-center gap-2">
          <button class="text-zinc-400 hover:text-white transition p-1.5 rounded hover:bg-zinc-800" title="Manage Root Folders" @click="toggleRootManager">
            <FolderOpen :size="18" />
          </button>
          <div class="text-xs text-zinc-400">{{ rootFolders.length }} {{ rootFolders.length === 1 ? "root" : "roots" }}</div>
        </div>
      </div>

      <!-- ROOT MANAGER PANEL - SCROLLABLE -->
      <div v-if="showRootManager" class="border-b border-zinc-700/50 bg-zinc-800/40 flex-shrink-0" style="max-height: 280px; display: flex; flex-direction: column">
        <div class="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
          <div class="text-sm font-medium">Root Folders</div>
          <button class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors text-sm" @click="addRootFolder">
            <Plus :size="16" />
            Add Root
          </button>
        </div>

        <div v-if="rootFolders.length === 0" class="text-center py-4 text-zinc-500 text-sm px-4">No root folders configured</div>

        <div v-else class="overflow-y-auto custom-scrollbar px-4 pb-4">
          <ul class="space-y-2">
            <li v-for="root in rootFolders" :key="root" class="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 transition-colors group">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <Folder :size="16" class="text-zinc-400 flex-shrink-0" />
                <div class="min-w-0 flex-1">
                  <div class="text-sm font-medium truncate">{{ getRootName(root) }}</div>
                  <div class="text-xs text-zinc-500 truncate" :title="root">{{ root }}</div>
                </div>
              </div>
              <button class="ml-2 p-1 text-zinc-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100" title="Remove root folder" @click="removeRootFolder(root)">
                <X :size="16" />
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- CONTENT - SCROLLABLE -->
      <div class="p-4 flex-1 overflow-hidden flex flex-col min-h-0">
        <input
          ref="inputRef"
          v-model="keyword"
          :disabled="rootFolders.length === 0"
          placeholder="Search project…"
          class="w-full mb-3 px-3 py-2 rounded-lg bg-zinc-800 outline-none placeholder:text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        />

        <!-- Message when no root folders configured -->
        <div v-if="rootFolders.length === 0" class="text-center py-8">
          <p class="text-zinc-400 mb-3">Please add a root folder first</p>
          <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 mx-auto" @click="addRootFolder">
            <Plus :size="18" />
            Add Root Folder
          </button>
        </div>

        <!-- PROJECT LIST - MAX 5 ITEMS VISIBLE WITH SCROLL -->
        <div v-else-if="sorted.length" ref="listContainerRef" class="overflow-y-auto custom-scrollbar -mr-1 pr-1" style="max-height: 310px">
          <ul class="space-y-1 list-none">
            <li
              v-for="(p, i) in sorted"
              :key="p.path"
              :data-index="i"
              :class="['flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer', i === selectedIndex ? 'bg-indigo-500/90' : 'bg-zinc-800/60 hover:bg-zinc-800']"
              @click="
                selectedIndex = i;
                openSelected();
              "
            >
              <div class="flex items-center gap-3 truncate min-w-0 flex-1">
                <Folder :size="18" :class="['flex-shrink-0', i === selectedIndex ? 'text-zinc-100' : 'text-zinc-400']" />
                <div class="min-w-0 flex-1">
                  <div class="truncate">
                    {{ p.name }}
                    <span v-if="recents.includes(p.path)" class="ml-2 text-xs opacity-70"> • recent </span>
                  </div>
                  <div class="text-xs text-zinc-500 truncate mt-0.5">{{ getRootName(p.root) }}</div>
                </div>
              </div>

              <button class="ml-3 flex-shrink-0 p-1" @click.stop="toggleFav(p)" :title="isFav(p) ? 'Unfavorite (Ctrl+D)' : 'Favorite (Ctrl+D)'">
                <Star :size="18" :class="['transition-all', isFav(p) ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-400 hover:text-zinc-200']" />
              </button>
            </li>
          </ul>
        </div>

        <p v-else-if="rootFolders.length > 0 && !keyword.trim()" class="text-sm text-zinc-500 mt-4 text-center">Start typing to search project…</p>

        <p v-else-if="rootFolders.length > 0 && keyword.trim() && !sorted.length" class="text-sm text-zinc-500 mt-4 text-center">No projects found</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom Scrollbar - Smooth & Minimal */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.5) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin: 4px 0;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(99, 102, 241, 0.5);
  border-radius: 3px;
  transition: background-color 0.2s;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(99, 102, 241, 0.7);
}

/* Smooth scroll behavior */
.custom-scrollbar {
  scroll-behavior: smooth;
}
</style>
