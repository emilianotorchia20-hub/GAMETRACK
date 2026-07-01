import { debug, error as logError, info, warn } from "@tauri-apps/plugin-log";

export function getStoredBoolean(key, fallback) {
  const value = localStorage.getItem(key);
  if (value === null) return fallback;
  return value === "true";
}

export function setStoredBoolean(key, value) {
  localStorage.setItem(key, String(Boolean(value)));
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function withTimeout(promise, ms, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

export function formatBytes(bytes) {
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

export function formatDate(value) {
  if (!value) return "No disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No disponible";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function compareVersions(a, b) {
  const left = String(a).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const right = String(b).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] || 0) - (right[index] || 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

export function classifyError(error) {
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

export async function safeLog(level, message, details) {
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
