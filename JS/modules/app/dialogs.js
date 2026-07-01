function closeGameTrackDialog(backdrop, result, resolve) {
  backdrop.classList.add("closing");
  window.setTimeout(() => {
    backdrop.remove();
    resolve(result);
  }, 160);
}

function showGameTrackDialog({
  title = "GameTrack",
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  danger = false,
  confirmOnly = false,
} = {}) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "gt-dialog-backdrop";
    let keyHandler;

    const finish = (result) => {
      document.removeEventListener("keydown", keyHandler);
      closeGameTrackDialog(backdrop, result, resolve);
    };

    const dialog = document.createElement("section");
    dialog.className = `gt-dialog ${danger ? "danger" : ""}`;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");

    const badge = document.createElement("div");
    badge.className = "gt-dialog-badge";
    badge.textContent = danger ? "!" : "GT";

    const heading = document.createElement("h2");
    heading.textContent = title;

    const text = document.createElement("p");
    text.textContent = message;

    const actions = document.createElement("div");
    actions.className = "gt-dialog-actions";

    if (!confirmOnly) {
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "gt-dialog-btn secondary";
      cancel.textContent = cancelText;
      cancel.addEventListener("click", () => finish(false));
      actions.appendChild(cancel);
    }

    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = `gt-dialog-btn primary ${danger ? "danger" : ""}`;
    confirm.textContent = confirmText;
    confirm.addEventListener("click", () => finish(true));
    actions.appendChild(confirm);

    dialog.append(badge, heading, text, actions);
    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    keyHandler = (event) => {
      if (event.key === "Escape" && !confirmOnly) {
        finish(false);
      }
    };

    document.addEventListener("keydown", keyHandler);
    confirm.focus();
  });
}

window.gameTrackAlert = function(message, options = {}) {
  return showGameTrackDialog({
    title: options.title || "Aviso",
    message,
    confirmText: options.confirmText || "Entendido",
    confirmOnly: true,
    danger: Boolean(options.danger),
  });
};

window.gameTrackConfirm = function(message, options = {}) {
  return showGameTrackDialog({
    title: options.title || "Confirmar accion",
    message,
    confirmText: options.confirmText || "Aceptar",
    cancelText: options.cancelText || "Cancelar",
    danger: Boolean(options.danger),
  });
};
