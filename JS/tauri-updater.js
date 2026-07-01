import { keys } from "./tauri-updater/config.js";
import { getStoredBoolean } from "./tauri-updater/helpers.js";
import { methods as lifecycleMethods } from "./tauri-updater/lifecycle.js";
import { methods as operationMethods } from "./tauri-updater/operations.js";
import { methods as modalMethods } from "./tauri-updater/modal.js";

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
    this.handleKeydown = this.handleKeydown.bind(this);
  }
}

Object.assign(
  GameTrackUpdater.prototype,
  lifecycleMethods,
  operationMethods,
  modalMethods,
);

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
