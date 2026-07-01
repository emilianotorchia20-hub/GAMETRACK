import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig } from "vite";

function copyDirectory(source, target) {
  if (!existsSync(source)) return;

  mkdirSync(target, { recursive: true });

  for (const entry of readdirSync(source)) {
    const sourcePath = join(source, entry);
    const targetPath = join(target, entry);

    if (statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  }
}

export default defineConfig({
  base: "./",
  clearScreen: false,
  plugins: [
    {
      name: "gametrack-static-pwa-assets",
      closeBundle() {
        const dist = resolve(__dirname, "dist");
        const assets = join(dist, "assets");
        mkdirSync(assets, { recursive: true });

        for (const file of ["sw.js"]) {
          const source = resolve(__dirname, file);
          if (existsSync(source)) copyFileSync(source, join(dist, file));
        }

        for (const file of ["icon-192.png", "icon-512.png"]) {
          const source = resolve(__dirname, file);
          if (existsSync(source)) {
            copyFileSync(source, join(dist, file));
            copyFileSync(source, join(assets, file));
          }
        }

        const legacyJsDir = join(dist, "JS");
        mkdirSync(legacyJsDir, { recursive: true });
        for (const file of ["storage.js", "alerts.js", "sessions.js", "insights.js", "roulette.js", "app.js"]) {
          const source = resolve(__dirname, "JS", file);
          if (existsSync(source)) copyFileSync(source, join(legacyJsDir, file));
        }
        copyDirectory(resolve(__dirname, "JS", "modules"), join(legacyJsDir, "modules"));
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        configuracion: resolve(__dirname, "PAGES/configuracion/index.html"),
        estadisticas: resolve(__dirname, "PAGES/estadisticas/index.html"),
        historial: resolve(__dirname, "PAGES/historial/index.html"),
        insights: resolve(__dirname, "PAGES/insights/index.html"),
        roulette: resolve(__dirname, "PAGES/roulette/index.html"),
      },
    },
  },
});
