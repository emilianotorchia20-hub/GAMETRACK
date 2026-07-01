import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { AUTO_CHECK_INTERVAL_MS, CHECK_TIMEOUT_MS, REQUIRED_MARKER, RETRY_DELAY_MS, keys } from "./config.js";
import { classifyError, compareVersions, delay, safeLog, withTimeout } from "./helpers.js";

export async function autoCheck() { ignoreCooldown = false }

export async function manualCheck(button) {
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

export async function checkForUpdates() { manual }

export async function runCheck() { manual }

export async function replaceUpdate(update) {
    if (this.update && this.update !== update) {
      await this.closeCurrentUpdate();
    }
    this.update = update;
  }

export function prepareUpdate() { manual }

export function scheduleAutomaticDownload() {
    this.cancelAutomaticDownload();
    this.setAutoDownloadMessage("La descarga automática empezará en unos segundos. Podés cancelarla antes de que comience.");
    this.autoDownloadTimer = window.setTimeout(() => {
      this.autoDownloadTimer = null;
      if (!this.operation && this.update && this.state === "updateAvailable") {
        this.downloadOnly();
      }
    }, 5000);
  }

export function cancelAutomaticDownload() {
    if (this.autoDownloadTimer) {
      window.clearTimeout(this.autoDownloadTimer);
      this.autoDownloadTimer = null;
      this.setAutoDownloadMessage("");
    }
  }

export function setAutoDownloadMessage(message) {
    this.autoDownloadMessage = message;
    this.updateModal();
  }

export async function downloadOnly() {
    if (!this.update || typeof this.update.download !== "function" || this.operation) return;

    this.operation = this.runDownloadOnly().finally(() => {
      this.operation = null;
    });

    return this.operation;
  }

export async function runDownloadOnly() {
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

export async function downloadAndInstall() {
    this.cancelAutomaticDownload();

    if (!this.update || this.operation) return;

    this.operation = this.runDownloadAndInstall().finally(() => {
      this.operation = null;
    });

    return this.operation;
  }

export async function runDownloadAndInstall() {
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

export function handleDownloadEvent(event) {
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

export async function retry() {
    if (this.state === "error" || this.state === "offline") {
      await this.checkForUpdates({ manual: true });
    }
  }

export async function restartNow() {
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

export function skipVersion() {
    if (!this.update || this.required) return;
    localStorage.setItem(keys.skippedVersion, this.update.version);
    this.closeModal();
    this.setStatus("idle", `Versión ${this.update.version} omitida.`);
  }

export function later() {
    if (this.required) return;
    this.closeModal();
    this.setStatus("idle", "Actualización pospuesta.");
  }

export async function closeCurrentUpdate() {
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

export const methods = {
  autoCheck,
  manualCheck,
  checkForUpdates,
  runCheck,
  replaceUpdate,
  prepareUpdate,
  scheduleAutomaticDownload,
  cancelAutomaticDownload,
  setAutoDownloadMessage,
  downloadOnly,
  runDownloadOnly,
  downloadAndInstall,
  runDownloadAndInstall,
  handleDownloadEvent,
  retry,
  restartNow,
  skipVersion,
  later,
  closeCurrentUpdate,
};
