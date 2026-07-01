function readJsonArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function formatStorageSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getLocalStorageBytes() {
  let bytes = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) || "";
    const value = localStorage.getItem(key) || "";
    bytes += (key.length + value.length) * 2;
  }

  return bytes;
}

function formatLastBackup(value) {
  if (!value) return "Nunca";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nunca";

  return date.toLocaleDateString(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }
  );
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderSettingsDataHealth() {
  const sessions = readJsonArray("sessions");
  const rouletteHistory = readJsonArray("historialRuleta");

  setText("settingsSessionsCount", String(sessions.length));
  setText("settingsRouletteCount", String(rouletteHistory.length));
  setText("settingsStorageSize", formatStorageSize(getLocalStorageBytes()));
  setText(
    "settingsLastBackup",
    formatLastBackup(localStorage.getItem("gametrack.lastBackupAt"))
  );
}

function initSettingsMaintenance() {
  if (!document.getElementById("settingsSessionsCount")) return;

  renderSettingsDataHealth();
  window.renderSettingsDataHealth = renderSettingsDataHealth;

  document
    .getElementById("refreshDataHealthBtn")
    ?.addEventListener("click", renderSettingsDataHealth);

  document
    .getElementById("clearRouletteHistoryBtn")
    ?.addEventListener("click", async () => {
      const confirmed = await window.gameTrackConfirm?.(
        "Limpiar solo el historial de ruleta?",
        {
          title: "Limpiar historial",
          confirmText: "Limpiar",
          danger: true,
        }
      );

      if (!confirmed) return;

      localStorage.removeItem("historialRuleta");
      renderSettingsDataHealth();
      window.gameTrackAlert?.(
        "Historial de ruleta limpiado.",
        { title: "Listo" }
      );
    });
}

initSettingsMaintenance();
