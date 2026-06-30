import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Chart from "chart.js/auto";
import { initPwaUpdates } from "./pwa-updater.js";
import { initTauriUpdater } from "./tauri-updater.js";

window.Toastify = Toastify;
window.Chart = Chart;

const legacyBasePath = window.location.pathname.includes("/PAGES/") ? "../../JS/" : "./JS/";

const legacyScripts = {
  storage: `${legacyBasePath}storage.js`,
  alerts: `${legacyBasePath}alerts.js`,
  sessions: `${legacyBasePath}sessions.js`,
  insights: `${legacyBasePath}insights.js`,
  roulette: `${legacyBasePath}roulette.js`,
  app: `${legacyBasePath}app.js`,
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
