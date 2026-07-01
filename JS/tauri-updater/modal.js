import { REQUIRED_MARKER } from "./config.js";
import { formatBytes, formatDate } from "./helpers.js";

export function showToast(message) {
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

export function openModal() {
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

export function handleKeydown(event) {
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
  }

export function canCloseModal() {
    return !["downloading", "installing"].includes(this.state) && !this.required;
  }

export function closeModal() {
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

export function cleanReleaseNotes() {
    return String(this.update?.body || "Sin notas de versión disponibles.")
      .replace(REQUIRED_MARKER, "")
      .trim() || "Sin notas de versión disponibles.";
  }

export function hasUsableUpdate() {
    return Boolean(this.update && this.update.version);
  }

export function modalTitle() {
    if (this.state === "upToDate") return "GameTrack actualizado";
    if (this.state === "error") return "No se pudo comprobar la actualizaci\u00f3n";
    if (this.state === "offline") return "Sin conexi\u00f3n";
    return "Actualizaci\u00f3n disponible";
  }

export function updateModal() {
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

export function metaItem(label, value) {
    const item = document.createElement("div");
    const labelEl = document.createElement("span");
    const valueEl = document.createElement("strong");
    labelEl.textContent = label;
    valueEl.textContent = value;
    item.append(labelEl, valueEl);
    return item;
  }

export function createProgress() {
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

export function createActions() {
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

export function button(label, variant, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `updater-btn ${variant}`;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

export const methods = {
  showToast,
  openModal,
  handleKeydown,
  canCloseModal,
  closeModal,
  cleanReleaseNotes,
  hasUsableUpdate,
  modalTitle,
  updateModal,
  metaItem,
  createProgress,
  createActions,
  button,
};
