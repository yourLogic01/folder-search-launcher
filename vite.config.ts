import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import electron from "vite-plugin-electron";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // ✅ Ini sudah benar
    electron([
      {
        entry: "electron/main.ts",
      },
      {
        entry: "electron/preload.ts",
      },
    ]),
  ],
});
