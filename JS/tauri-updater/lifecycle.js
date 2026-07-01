import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { AUTO_CHECK_DELAY_MS, keys } from "./config.js";
import { formatDate, safeLog, setStoredBoolean } from "./helpers.js";

export async function init() {
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

    this.prefs.autoCheck = true;
    setStoredBoolean(keys.autoCheck, true);
    this.emitState();
    window.setTimeout(() => this.autoCheck({ ignoreCooldown: true }), AUTO_CHECK_DELAY_MS);
  }

export async function getInstalledVersion() {
    try {
      return await getVersion();
    } catch (err) {
      await safeLog("warn", "No se pudo obtener la versión instalada.", String(err));
      return "Desconocida";
    }
  }

export function bindSettingsPanel() {
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

export function renderVersionFooter() {
    if (document.getElementById("gametrackVersionFooter")) return;

    const footer = document.createElement("div");
    footer.id = "gametrackVersionFooter";
    footer.className = "app-version-footer";
    footer.textContent = `GameTrack ${this.installedVersion}`;
    document.body.appendChild(footer);
  }

export function emitState() {
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

export function statusText() {
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

export function lastCheckText() {
    const stored = localStorage.getItem(keys.lastCheck);
    return stored ? formatDate(stored) : "Nunca";
  }

export function setState(state) {
    this.state = state;
    this.emitState();
    this.updateModal();
  }

export function setStatus(state, message) {
    this.state = state;
    this.userMessage = message;
    this.emitState();
    this.updateModal();
  }

export const methods = {
  init,
  getInstalledVersion,
  bindSettingsPanel,
  renderVersionFooter,
  emitState,
  statusText,
  lastCheckText,
  setState,
  setStatus,
};
