import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Chart from "chart.js/auto";
import { initPwaUpdates } from "./pwa-updater.js";
import { initTauriUpdater } from "./tauri-updater.js";

window.Toastify = Toastify;
window.Chart = Chart;

const legacyScripts = {
  storage: new URL("./storage.js", import.meta.url).href,
  alerts: new URL("./alerts.js", import.meta.url).href,
  sessions: new URL("./sessions.js", import.meta.url).href,
  insights: new URL("./insights.js", import.meta.url).href,
  roulette: new URL("./roulette.js", import.meta.url).href,
  app: new URL("./app.js", import.meta.url).href,
};

const pageScripts = [
  {
    test: (path) => path.endsWith("/PAGES/insights/") || path.endsWith("/PAGES/insights/index.html"),
    scripts: ["insights", "app"],
  },
  {
    test: (path) => path.endsWith("/PAGES/roulette/") || path.endsWith("/PAGES/roulette/index.html"),
    scripts: ["roulette", "app"],
  },
  {
    test: () => true,
    scripts: ["storage", "alerts", "sessions", "app"],
  },
];

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.body.appendChild(script);
  });
}

async function loadLegacyPageScripts() {
  const path = window.location.pathname;
  const entry = pageScripts.find((item) => item.test(path));

  for (const key of entry.scripts) {
    await loadClassicScript(legacyScripts[key]);
  }
}

await loadLegacyPageScripts();

initPwaUpdates();
initTauriUpdater();
