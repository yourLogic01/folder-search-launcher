<script setup lang="ts">
import { Folder, Star } from 'lucide-vue-next';
import { ref, onMounted, computed, watch, nextTick } from 'vue';

type Project = { name: string; path: string };

const projects = ref<Project[]>([]);
const keyword = ref('');
const selectedIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);
const favorites = ref<Set<string>>(new Set());
const recents = ref<string[]>([]);
const rootFolder = ref<string | null>(null);


const pickFolder = async () => {
  const selected = await window.api.selectRootFolder();
  if (selected) {
    rootFolder.value = selected;
    // refresh projects setelah pilih folder
    projects.value = await window.api.getProjects();
    await focusInput();
  }
};

// load projects sekali
onMounted(async () => {
  rootFolder.value = await window.api.getRootFolder();
  if (rootFolder.value) {
    projects.value = await window.api.getProjects();
  }
  const meta = await window.api.getMeta();
  favorites.value = new Set(meta.favorites);
  recents.value = meta.recents;
  if (rootFolder.value) {
    await focusInput();
  }
});

const isFav = (p: Project) => favorites.value.has(p.path);
const recentIndex = (p: Project) => recents.value.indexOf(p.path);

const baseFiltered = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return [];
  return projects.value.filter(p => p.name.toLowerCase().includes(q));
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
  return projects.value.filter(p => p.name.toLowerCase().includes(q));
});

watch(keyword, () => {
  selectedIndex.value = 0;
});

const openSelected = async () => {
  const item = sorted.value[selectedIndex.value];
  if (!item) return;
  await window.api.recordRecent(item.path);
  await window.api.openInVSCode(item.path);
  keyword.value = '';
  selectedIndex.value = 0;
  await window.api.hideWindow();
};

const hideLauncher = async () => {
  keyword.value = '';
  selectedIndex.value = 0;
  await window.api.hideWindow();
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (!filtered.value.length) return;
    selectedIndex.value =
      (selectedIndex.value + 1) % filtered.value.length;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (!filtered.value.length) return;
    selectedIndex.value =
      (selectedIndex.value - 1 + filtered.value.length) % filtered.value.length;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    openSelected();
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    hideLauncher();
  }

  if (e.key === 'd' && e.ctrlKey) {
    e.preventDefault();
    const item = sorted.value[selectedIndex.value];
    if (item) toggleFav(item);
  }
};
</script>

<template>
  <div class="h-screen w-screen flex items-center justify-center">
    <div
      class="w-132 rounded-2xl
             bg-zinc-900 text-zinc-100
             shadow-2xl border border-zinc-700/50
             overflow-hidden
             animate-[scaleFadeIn_120ms_ease-out_forwards]"
      tabindex="0"
      @keydown="onKeydown"
    >
      <!-- HEADER (sama) -->
      <div
        class="flex items-center justify-between
               px-4 py-3
               border-b border-zinc-700/50"
      >
        <div class="text-sm font-semibold tracking-wide">
          Project Searcher Launcher
        </div>

        <div class="flex items-center gap-2 min-w-0">
          <button
            class="text-zinc-400 hover:text-white transition"
            title="Change Root Folder"
            @click="pickFolder"
          >
            📁
          </button>
          <span
            v-if="rootFolder"
            class="text-xs text-zinc-400 truncate max-w-65"
            :title="rootFolder"
          >
            {{ rootFolder }}
          </span>
          <span v-else class="text-xs text-zinc-500 italic">
            No root folder
          </span>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="p-4">
        <input
          ref="inputRef"
          v-model="keyword"
          :disabled="!rootFolder"
          placeholder="Search project…"
          class="w-full mb-3 px-3 py-2 rounded-lg
                 bg-zinc-800 outline-none
                 placeholder:text-zinc-400
                 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <!-- Pesan kalau belum pilih folder -->
        <div v-if="!rootFolder" class="text-center py-8">
          <p class="text-zinc-400 mb-3">
            Please select a root folder first
          </p>
          <button
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500
                   rounded-lg transition-colors"
            @click="pickFolder"
          >
            📁 Select Folder
          </button>
        </div>

        <!-- LIST dengan ICON -->
        <ul v-else-if="sorted.length" class="space-y-1 list-none">
          <li
            v-for="(p, i) in sorted"
            :key="p.path"
            :class="[
              'flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer',
              i === selectedIndex
                ? 'bg-indigo-500/90'
                : 'bg-zinc-800/60 hover:bg-zinc-800'
            ]"
            @click="selectedIndex = i; openSelected()"
          >
            <div class="flex items-center gap-3 truncate min-w-0">
              <Folder 
                :size="18" 
                :class="[
                  'flex-shrink-0',
                  i === selectedIndex ? 'text-zinc-100' : 'text-zinc-400'
                ]"
              />
              <span class="truncate">
                {{ p.name }}
                <span
                  v-if="recents.includes(p.path)"
                  class="ml-2 text-xs opacity-70"
                >
                  • recent
                </span>
              </span>
            </div>

            <button
              class="ml-3 flex-shrink-0 p-1"
              @click.stop="toggleFav(p)"
              :title="isFav(p) ? 'Unfavorite (Ctrl+D)' : 'Favorite (Ctrl+D)'"
            >
              <Star 
                :size="18" 
                :class="[
                  'transition-all',
                  isFav(p) 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-zinc-400 hover:text-zinc-200'
                ]"
              />
            </button>
          </li>
        </ul>

        <p
          v-else-if="rootFolder && !keyword.trim()"
          class="text-sm text-zinc-500 mt-4 text-center"
        >
          Start typing to search project…
        </p>

        <p
          v-else-if="rootFolder && keyword.trim() && !sorted.length"
          class="text-sm text-zinc-500 mt-4 text-center"
        >
          No projects found
        </p>
      </div>
    </div>
  </div>
</template>