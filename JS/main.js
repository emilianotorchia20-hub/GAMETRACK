import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import Chart from "chart.js/auto";
import { initPwaUpdates } from "./pwa-updater.js";
import { initTauriUpdater } from "./tauri-updater.js";

window.Toastify = Toastify;
window.Chart = Chart;

const legacyBasePath = window.location.pathname.includes("/PAGES/") ? "../../JS/" : "./JS/";

const scriptGroups = {
  storage: ["storage.js"],
  alerts: ["alerts.js"],
  sessions: [
    "modules/sessions/formatters.js",
    "modules/sessions/form.js",
    "modules/sessions/history.js",
    "modules/sessions/stats.js",
    "modules/sessions/bankroll.js",
    "modules/sessions/boot.js",
  ],
  insights: [
    "modules/insights/formatters.js",
    "modules/insights/render.js",
    "modules/insights/boot.js",
  ],
  roulette: [
    "modules/roulette/state.js",
    "modules/audio/roulette-audio.js",
    "modules/roulette/wheel.js",
    "modules/roulette/bets.js",
    "modules/roulette/spin.js",
    "modules/roulette/strategies.js",
    "modules/roulette/history.js",
    "modules/roulette/boot.js",
  ],
  app: [
    "modules/app/dialogs.js",
    "modules/app/navigation.js",
    "modules/app/shell.js",
    "modules/app/alert-settings.js",
    "modules/app/audio-settings.js",
    "modules/app/bankroll-goal.js",
    "modules/app/dashboard.js",
    "modules/app/backup-events.js",
    "modules/app/settings-maintenance.js",
  ],
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
    for (const file of scriptGroups[key]) {
      await loadClassicScript(`${legacyBasePath}${file}`);
    }
  }
}

await loadLegacyPageScripts();

initPwaUpdates();
initTauriUpdater();
