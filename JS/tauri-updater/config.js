export const AUTO_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
export const AUTO_CHECK_DELAY_MS = 4000;
export const CHECK_TIMEOUT_MS = 25000;
export const RETRY_DELAY_MS = 1200;
export const REQUIRED_MARKER = "[GAMETRACK_UPDATE_REQUIRED]";

export const keys = {
  lastCheck: "gametrack.updater.lastCheckAt",
  skippedVersion: "gametrack.updater.skippedVersion",
  autoCheck: "gametrack.updater.autoCheck",
  autoDownload: "gametrack.updater.autoDownload",
};
