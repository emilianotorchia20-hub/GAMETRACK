import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { debug, error as logError, info, warn } from "@tauri-apps/plugin-log";

const AUTO_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const AUTO_CHECK_DELAY_MS = 4000;
const CHECK_TIMEOUT_MS = 25000;
const RETRY_DELAY_MS = 1200;
const REQUIRED_MARKER = "[GAMETRACK_UPDATE_REQUIRED]";

const keys = {
  lastCheck: "gametrack.updater.lastCheckAt",
  skippedVersion: "gametrack.updater.skippedVersion",
  autoCheck: "gametrack.updater.autoCheck",
  autoDownload: "gametrack.updater.autoDownload",
};

function getStoredBoolean(key, fallback) {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === "true";
}

function setStoredBoolean(key, value) {
  localStorage.setItem(key, String(Boolean(value)));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Tamaño desconocido";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(value) {
  if (!value) return "No disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No disponible";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function compareVersions(a, b) {
  const left = String(a).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const right = String(b).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] || 0) - (right[index] || 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

function classifyError(error) {
  const raw = String(error?.message || error || "");
  const normalized = raw.toLowerCase();

  if (normalized.includes("timeout") || normalized.includes("network") || normalized.includes("offline") || normalized.includes("dns") || normalized.includes("connection")) {
    return { state: "offline", message: "No hay conexión disponible o GitHub no respondió a tiempo." };
  }

  if (normalized.includes("404") || normalized.includes("not found")) {
    return { state: "error", message: "No se encontró el archivo de actualización en GitHub Releases." };
  }

  if (normalized.includes("json") || normalized.includes("parse") || normalized.includes("manifest")) {
    return { state: "error", message: "El archivo latest.json no tiene un formato válido." };
  }

  if (normalized.includes("signature") || normalized.includes("sign") || normalized.includes("pubkey")) {
    return { state: "error", message: "La firma criptográfica de la actualización no es válida." };
  }

  if (normalized.includes("download") || normalized.includes("interrupted")) {
    return { state: "error", message: "La descarga se interrumpió. Podés reintentar." };
  }

  if (normalized.includes("permission") || normalized.includes("denied") || normalized.includes("access")) {
    return { state: "error", message: "El sistema no permitió completar la actualización." };
  }

  if (normalized.includes("install")) {
    return { state: "error", message: "La instalación falló. Cerrá otras instancias de GameTrack y reintentá." };
  }

  return { state: "error", message: "Ocurrió un error inesperado al actualizar GameTrack." };
}

async function safeLog(level, message, details) {
  try {
    const text = details ? `${message} ${details}` : message;
    if (level === "error") await logError(text);
    else if (level === "warn") await warn(text);
    else if (level === "debug") await debug(text);
    else await info(text);
  } catch {
    console[level === "error" ? "error" : "log"](message, details || "");
  }
}

class GameTrackUpdater {
  constructor() {
    this.state = "idle";
    this.isNative = false;
    this.installedVersion = "Web";
    this.update = null;
    this.operation = null;
    this.modal = null;
    this.modalOpen = false;
    this.lastFocused = null;
    this.required = false;
    this.autoDownloadTimer = null;
    this.downloaded = 0;
    this.total = 0;
    this.lastProgressLogAt = 0;
    this.prefs = {
      autoCheck: getStoredBoolean(keys.autoCheck, true),
      autoDownload: getStoredBoolean(keys.autoDownload, false),
    };
  }

  async init() {
    this.isNative = await Promise.resolve(isTauri());
    this.installedVersion = this.isNative ? await this.getInstalledVersion() : "Web";
    this.renderVersionFooter();
    this.bindSettingsPanel();
    this.emitState();

    if (!this.isNative) {
      this.setStatus("idle", "Actualizaciones nativas disponibles solo en la app de escritorio.");
      return;
    }

    await safeLog("info", "Updater iniciado.");
    await safeLog("info", `Versión instalada: ${this.installedVersion}`);

    if (this.prefs.autoCheck) {
      window.setTimeout(() => this.autoCheck(), AUTO_CHECK_DELAY_MS);
    }
  }

  async getInstalledVersion() {
    try {
      return await getVersion();
    } catch (err) {
      await safeLog("warn", "No se pudo obtener la versión instalada.", String(err));
      return "Desconocida";
    }
  }

  bindSettingsPanel() {
    const versionEl = document.getElementById("updaterInstalledVersion");
    const channelEl = document.getElementById("updaterChannel");
    const statusEl = document.getElementById("updaterStatus");
    const lastCheckEl = document.getElementById("updaterLastCheck");
    const manualBtn = document.getElementById("checkUpdatesBtn");
    const autoCheckInput = document.getElementById("autoCheckUpdates");
    const autoDownloadInput = document.getElementById("autoDownloadUpdates");

    if (versionEl) versionEl.textContent = this.installedVersion;
    if (channelEl) channelEl.textContent = "Estable";
    if (statusEl) statusEl.textContent = this.statusText();
    if (lastCheckEl) lastCheckEl.textContent = this.lastCheckText();

    if (autoCheckInput) {
      autoCheckInput.checked = this.prefs.autoCheck;
      autoCheckInput.addEventListener("change", () => {
        this.prefs.autoCheck = autoCheckInput.checked;
        setStoredBoolean(keys.autoCheck, this.prefs.autoCheck);
        this.emitState();
      });
    }

    if (autoDownloadInput) {
      autoDownloadInput.checked = this.prefs.autoDownload;
      autoDownloadInput.addEventListener("change", () => {
        this.prefs.autoDownload = autoDownloadInput.checked;
        setStoredBoolean(keys.autoDownload, this.prefs.autoDownload);
        this.emitState();
      });
    }

    if (manualBtn) {
      manualBtn.disabled = !this.isNative;
      manualBtn.addEventListener("click", () => this.manualCheck(manualBtn));
    }
  }

  renderVersionFooter() {
    if (document.getElementById("gametrackVersionFooter")) return;

    const footer = document.createElement("div");
    footer.id = "gametrackVersionFooter";
    footer.className = "app-version-footer";
    footer.textContent = `GameTrack ${this.installedVersion}`;
    document.body.appendChild(footer);
  }

  emitState() {
    const detail = {
      state: this.state,
      status: this.statusText(),
      installedVersion: this.installedVersion,
      lastCheck: this.lastCheckText(),
      autoCheck: this.prefs.autoCheck,
      autoDownload: this.prefs.autoDownload,
    };

    document.dispatchEvent(new CustomEvent("gametrack-updater-state", { detail }));

    const statusEl = document.getElementById("updaterStatus");
    const lastCheckEl = document.getElementById("updaterLastCheck");
    const versionEl = document.getElementById("updaterInstalledVersion");
    const footer = document.getElementById("gametrackVersionFooter");

    if (statusEl) statusEl.textContent = detail.status;
    if (lastCheckEl) lastCheckEl.textContent = detail.lastCheck;
    if (versionEl) versionEl.textContent = this.installedVersion;
    if (footer) footer.textContent = `GameTrack ${this.installedVersion}`;
  }

  statusText() {
    const labels = {
      idle: "En espera",
      checking: "Buscando actualizaciones",
      updateAvailable: "Actualización disponible",
      downloading: "Descargando actualización",
      installing: "Instalando actualización",
      readyToRestart: "Lista para reiniciar",
      upToDate: "GameTrack está actualizado",
      offline: "Sin conexión",
      error: "Error al actualizar",
    };

    return labels[this.state] || "En espera";
  }

  lastCheckText() {
    const stored = localStorage.getItem(keys.lastCheck);
    return stored ? formatDate(stored) : "Nunca";
  }

  setState(state) {
    this.state = state;
    this.emitState();
    this.updateModal();
  }

  setStatus(state, message) {
    this.state = state;
    this.userMessage = message;
    this.emitState();
    this.updateModal();
  }

  async autoCheck() {
    if (!this.isNative || !this.prefs.autoCheck || this.operation) return;

    const lastCheck = Date.parse(localStorage.getItem(keys.lastCheck) || "");
    if (Number.isFinite(lastCheck) && Date.now() - lastCheck < AUTO_CHECK_INTERVAL_MS) {
      return;
    }

    try {
      await this.checkForUpdates({ manual: false });
    } catch (err) {
      await safeLog("warn", "Comprobación automática fallida.", String(err));
    }
  }

  async manualCheck(button) {
    if (!this.isNative) return;
    if (this.operation) {
      this.showToast("Ya hay una operación de actualización en curso.");
      return;
    }

    if (button) button.disabled = true;
    try {
      await this.checkForUpdates({ manual: true });
    } finally {
      if (button) button.disabled = false;
    }
  }

  async checkForUpdates({ manual }) {
    if (this.operation) return this.operation;

    this.operation = this.runCheck({ manual }).finally(() => {
      this.operation = null;
    });

    return this.operation;
  }

  async runCheck({ manual }) {
    this.setStatus("checking", "Buscando actualizaciones...");
    await safeLog("info", `Inicio de comprobación (${manual ? "manual" : "automática"}).`);

    const attempts = manual ? 2 : 1;
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const update = await withTimeout(check(), CHECK_TIMEOUT_MS, "Timeout al consultar actualizaciones");
        localStorage.setItem(keys.lastCheck, new Date().toISOString());
        await this.replaceUpdate(update);
        await safeLog("info", "Fin de comprobación.");

        if (!update) {
          this.setStatus("upToDate", "GameTrack está actualizado.");
          if (manual) this.showToast("GameTrack está actualizado.");
          return null;
        }

        await safeLog("info", `Versión encontrada: ${update.version}`);
        this.prepareUpdate(update, { manual });
        return update;
      } catch (err) {
        lastError = err;
        await safeLog("warn", `Intento ${attempt} de comprobación fallido.`, String(err));
        if (attempt < attempts) await delay(RETRY_DELAY_MS);
      }
    }

    const classified = classifyError(lastError);
    this.setStatus(classified.state, classified.message);
    await safeLog("error", "Error completo al comprobar actualizaciones.", String(lastError?.stack || lastError));
    if (manual) {
      this.openModal();
      this.showToast(classified.message);
    }
    throw lastError;
  }

  async replaceUpdate(update) {
    if (this.update && this.update !== update) {
      await this.closeCurrentUpdate();
    }
    this.update = update;
  }

  prepareUpdate(update, { manual }) {
    const skipped = localStorage.getItem(keys.skippedVersion);
    if (skipped && compareVersions(update.version, skipped) > 0) {
      localStorage.removeItem(keys.skippedVersion);
    }

    this.required = String(update.body || "").includes(REQUIRED_MARKER);

    if (!manual && skipped === update.version && !this.required) {
      this.setStatus("updateAvailable", `La versión ${update.version} está omitida por el usuario.`);
      return;
    }

    this.setStatus("updateAvailable", `La versión ${update.version} está disponible.`);
    this.openModal();

    if (!manual && this.prefs.autoDownload && typeof update.download === "function") {
      this.scheduleAutomaticDownload();
    }
  }

  scheduleAutomaticDownload() {
    this.cancelAutomaticDownload();
    this.setAutoDownloadMessage("La descarga automática empezará en unos segundos. Podés cancelarla antes de que comience.");
    this.autoDownloadTimer = window.setTimeout(() => {
      this.autoDownloadTimer = null;
      if (!this.operation && this.update && this.state === "updateAvailable") {
        this.downloadOnly();
      }
    }, 5000);
  }

  cancelAutomaticDownload() {
    if (this.autoDownloadTimer) {
      window.clearTimeout(this.autoDownloadTimer);
      this.autoDownloadTimer = null;
      this.setAutoDownloadMessage("");
    }
  }

  setAutoDownloadMessage(message) {
    this.autoDownloadMessage = message;
    this.updateModal();
  }

  async downloadOnly() {
    if (!this.update || typeof this.update.download !== "function" || this.operation) return;

    this.operation = this.runDownloadOnly().finally(() => {
      this.operation = null;
    });

    return this.operation;
  }

  async runDownloadOnly() {
    this.setState("downloading");
    this.downloaded = 0;
    this.total = 0;
    await safeLog("info", "Comienzo de descarga automática.");

    try {
      await this.update.download((event) => this.handleDownloadEvent(event));
      this.setStatus("updateAvailable", "La actualización se descargó. Confirmá la instalación cuando quieras continuar.");
      await safeLog("info", "Fin de descarga automática.");
    } catch (err) {
      const classified = classifyError(err);
      this.setStatus(classified.state, classified.message);
      await safeLog("error", "Error completo en descarga automática.", String(err?.stack || err));
    }
  }

  async downloadAndInstall() {
    this.cancelAutomaticDownload();

    if (!this.update || this.operation) return;

    this.operation = this.runDownloadAndInstall().finally(() => {
      this.operation = null;
    });

    return this.operation;
  }

  async runDownloadAndInstall() {
    this.setState("downloading");
    this.downloaded = 0;
    this.total = 0;
    this.lastProgressLogAt = 0;
    await safeLog("info", "Comienzo de descarga.");

    try {
      await this.update.downloadAndInstall((event) => this.handleDownloadEvent(event));
      await safeLog("info", "Fin de descarga.");
      this.setStatus("installing", "Instalando actualización...");
      await safeLog("info", "Inicio de instalación.");
      this.setStatus("readyToRestart", "Actualización instalada. GameTrack se reiniciará.");
      await safeLog("info", "Reinicio solicitado.");
      await relaunch();
    } catch (err) {
      const classified = classifyError(err);
      this.setStatus(classified.state, classified.message);
      await safeLog("error", "Error completo al instalar actualización.", String(err?.stack || err));
      this.openModal();
    }
  }

  handleDownloadEvent(event) {
    if (event.event === "Started") {
      this.total = Number(event.data?.contentLength || 0);
      this.downloaded = 0;
      this.updateModal();
      return;
    }

    if (event.event === "Progress") {
      this.downloaded += Number(event.data?.chunkLength || 0);
      this.updateModal();

      const now = Date.now();
      if (now - this.lastProgressLogAt > 2500) {
        this.lastProgressLogAt = now;
        safeLog("debug", `Progreso de descarga: ${this.downloaded}/${this.total || "desconocido"}`);
      }
      return;
    }

    if (event.event === "Finished") {
      this.setStatus("installing", "Instalando actualización...");
      this.updateModal();
    }
  }

  async retry() {
    if (this.state === "error" || this.state === "offline") {
      await this.checkForUpdates({ manual: true });
    }
  }

  async restartNow() {
    if (this.operation) return;
    this.operation = relaunch()
      .catch(async (err) => {
        const classified = classifyError(err);
        this.setStatus(classified.state, classified.message);
        await safeLog("error", "Error completo al reiniciar.", String(err?.stack || err));
      })
      .finally(() => {
        this.operation = null;
      });
  }

  skipVersion() {
    if (!this.update || this.required) return;
    localStorage.setItem(keys.skippedVersion, this.update.version);
    this.closeModal();
    this.setStatus("idle", `Versión ${this.update.version} omitida.`);
  }

  later() {
    if (this.required) return;
    this.closeModal();
    this.setStatus("idle", "Actualización pospuesta.");
  }

  async closeCurrentUpdate() {
    try {
      if (this.update && typeof this.update.close === "function") {
        await this.update.close();
      }
    } catch (err) {
      await safeLog("warn", "No se pudo liberar el objeto Update.", String(err));
    } finally {
      this.update = null;
    }
  }

  showToast(message) {
    if (window.Toastify) {
      window.Toastify({
        text: message,
        duration: 3500,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
          background: "linear-gradient(to right, #1f2937, #111827)",
          borderRadius: "12px",
        },
      }).showToast();
    }
  }

  openModal() {
    if (this.modalOpen) {
      this.updateModal();
      return;
    }

    this.lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.modalOpen = true;
    this.modal = document.createElement("div");
    this.modal.className = "updater-modal-backdrop";
    this.modal.setAttribute("role", "presentation");
    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal && this.canCloseModal()) this.closeModal();
    });

    document.body.appendChild(this.modal);
    document.addEventListener("keydown", this.handleKeydown);
    this.updateModal();
  }

  handleKeydown = (event) => {
    if (event.key === "Escape" && this.canCloseModal()) {
      this.closeModal();
    }

    if (event.key === "Tab" && this.modal) {
      const focusable = [...this.modal.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  canCloseModal() {
    return !["downloading", "installing"].includes(this.state) && !this.required;
  }

  closeModal() {
    if (!this.modalOpen || !this.modal) return;
    this.cancelAutomaticDownload();
    document.removeEventListener("keydown", this.handleKeydown);
    this.modal.remove();
    this.modal = null;
    this.modalOpen = false;

    if (this.lastFocused && typeof this.lastFocused.focus === "function") {
      this.lastFocused.focus();
    }
  }

  cleanReleaseNotes() {
    return String(this.update?.body || "Sin notas de versión disponibles.")
      .replace(REQUIRED_MARKER, "")
      .trim() || "Sin notas de versión disponibles.";
  }

  hasUsableUpdate() {
    return Boolean(this.update && this.update.version);
  }

  modalTitle() {
    if (this.state === "upToDate") return "GameTrack actualizado";
    if (this.state === "error") return "No se pudo comprobar la actualizaci\u00f3n";
    if (this.state === "offline") return "Sin conexi\u00f3n";
    return "Actualizaci\u00f3n disponible";
  }

  updateModal() {
    if (!this.modal) return;

    this.modal.replaceChildren();

    const dialog = document.createElement("section");
    dialog.className = "updater-modal";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "updaterTitle");
    dialog.setAttribute("aria-describedby", "updaterDescription");

    const closeBtn = document.createElement("button");
    closeBtn.className = "updater-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Cerrar");
    closeBtn.textContent = "×";
    closeBtn.disabled = !this.canCloseModal();
    closeBtn.addEventListener("click", () => this.closeModal());

    const icon = document.createElement("div");
    icon.className = "updater-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "↻";

    const title = document.createElement("h2");
    title.id = "updaterTitle";
    title.textContent = this.modalTitle();

    const description = document.createElement("p");
    description.id = "updaterDescription";
    description.className = "updater-status";
    description.textContent = this.userMessage || this.statusText();

    const meta = document.createElement("div");
    meta.className = "updater-meta";
    meta.append(
      this.metaItem("Versi\u00f3n instalada", this.installedVersion),
      this.metaItem("Nueva versi\u00f3n", this.update?.version || "No disponible"),
      this.metaItem("Publicada", formatDate(this.update?.date)),
    );

    const notesLabel = document.createElement("h3");
    notesLabel.textContent = this.hasUsableUpdate() ? "Novedades" : "Detalle";

    const notes = document.createElement("pre");
    notes.className = "updater-notes";
    notes.textContent = this.hasUsableUpdate()
      ? this.cleanReleaseNotes()
      : "Revis\u00e1 que GitHub Releases tenga adjunto un archivo latest.json v\u00e1lido, junto al instalador y su firma.";

    const progress = this.createProgress();
    const actions = this.createActions();

    if (this.required) {
      const required = document.createElement("p");
      required.className = "updater-required";
      required.textContent = "Esta actualización es necesaria para continuar usando GameTrack con seguridad.";
      dialog.append(closeBtn, icon, title, required, description, meta, notesLabel, notes, progress, actions);
    } else {
      dialog.append(closeBtn, icon, title, description, meta, notesLabel, notes, progress, actions);
    }

    this.modal.appendChild(dialog);
    const firstButton = dialog.querySelector("button:not([disabled])");
    firstButton?.focus();
  }

  metaItem(label, value) {
    const item = document.createElement("div");
    const labelEl = document.createElement("span");
    const valueEl = document.createElement("strong");
    labelEl.textContent = label;
    valueEl.textContent = value;
    item.append(labelEl, valueEl);
    return item;
  }

  createProgress() {
    const wrap = document.createElement("div");
    wrap.className = "updater-progress-wrap";
    const knownTotal = this.total > 0;
    const percent = knownTotal ? Math.min(100, Math.round((this.downloaded / this.total) * 100)) : 0;

    const bar = document.createElement("div");
    bar.className = `updater-progress ${knownTotal ? "" : "indeterminate"}`;
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-valuemin", "0");
    bar.setAttribute("aria-valuemax", "100");
    if (knownTotal) bar.setAttribute("aria-valuenow", String(percent));

    const fill = document.createElement("div");
    fill.style.width = knownTotal ? `${percent}%` : "35%";
    bar.appendChild(fill);

    const text = document.createElement("p");
    text.className = "updater-progress-text";
    if (this.state === "downloading") {
      text.textContent = knownTotal
        ? `${percent}% · ${formatBytes(this.downloaded)} de ${formatBytes(this.total)}`
        : `Descargando · ${formatBytes(this.downloaded)}`;
    } else if (this.state === "installing") {
      text.textContent = "Instalando actualización. GameTrack se reiniciará al finalizar.";
    } else if (this.autoDownloadMessage) {
      text.textContent = this.autoDownloadMessage;
    } else {
      text.textContent = "La descarga comenzará cuando confirmes la instalación.";
    }

    wrap.hidden = !["downloading", "installing", "updateAvailable", "readyToRestart"].includes(this.state);
    wrap.append(bar, text);
    return wrap;
  }

  createActions() {
    const actions = document.createElement("div");
    actions.className = "updater-actions";
    const critical = ["downloading", "installing"].includes(this.state);

    const install = this.button("Descargar e instalar", "primary", () => this.downloadAndInstall());
    install.disabled = critical || !this.update || this.state === "readyToRestart";
    install.hidden = !this.hasUsableUpdate();

    const later = this.button("Más tarde", "secondary", () => this.later());
    later.hidden = this.required || !this.hasUsableUpdate();
    later.disabled = critical;

    const skip = this.button("Omitir esta versión", "ghost", () => this.skipVersion());
    skip.hidden = this.required || !this.hasUsableUpdate();
    skip.disabled = critical || !this.update;

    const retry = this.button("Reintentar", "secondary", () => this.retry());
    retry.hidden = !["error", "offline"].includes(this.state);
    retry.disabled = critical;

    const restart = this.button("Reiniciar ahora", "primary", () => this.restartNow());
    restart.hidden = this.state !== "readyToRestart";

    const cancelAuto = this.button("Cancelar descarga automática", "ghost", () => this.cancelAutomaticDownload());
    cancelAuto.hidden = !this.autoDownloadTimer;

    actions.append(install, later, skip, retry, restart, cancelAuto);
    return actions;
  }

  button(label, variant, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `updater-btn ${variant}`;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }
}

export async function initTauriUpdater() {
  if (window.gameTrackUpdater) {
    window.gameTrackUpdater.emitState?.();
    return window.gameTrackUpdater;
  }

  const controller = new GameTrackUpdater();
  window.gameTrackUpdater = controller;
  await controller.init();
  return controller;
}
