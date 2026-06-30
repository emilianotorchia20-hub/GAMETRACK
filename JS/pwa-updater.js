import { isTauri } from "@tauri-apps/api/core";

export async function initPwaUpdates() {
  const runningInTauri = await Promise.resolve(isTauri());

  if (runningInTauri || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await reg.update();

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    const showPwaUpdate = () => {
      if (document.getElementById("pwaUpdateBtn")) {
        return;
      }

      const btn = document.createElement("button");
      btn.id = "pwaUpdateBtn";
      btn.className = "install-btn";
      btn.type = "button";
      btn.textContent = "Actualizar web";
      btn.addEventListener("click", () => {
        reg.waiting?.postMessage({ type: "SKIP_WAITING" });
      });
      document.body.appendChild(btn);
    };

    if (reg.waiting) {
      showPwaUpdate();
    }

    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          showPwaUpdate();
        }
      });
    });
  } catch (error) {
    console.debug("No se pudo registrar el Service Worker web.", error);
  }
}
