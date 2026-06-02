window.mostrarUpdateUI = function (reg) {

  // 🔥 evitar duplicados
  if (document.getElementById("updateBanner")) return;

  const div = document.createElement("div");

  div.id = "updateBanner";

  div.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #0f172a;
      color: white;
      padding: 12px 18px;
      border-radius: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
      box-shadow: 0 0 15px rgba(0,0,0,0.5);
      z-index: 9999;
    ">

      <span>🔄 Nueva actualización disponible</span>

      <button id="updateBtn" style="
        background: #22c55e;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
      ">
        Actualizar
      </button>

    </div>
  `;

  document.body.appendChild(div);

  const btn = document.getElementById("updateBtn");

  btn.onclick = () => {

    btn.disabled = true;

    btn.textContent = "Actualizando...";

    // 🔥 esperar al nuevo controller
    navigator.serviceWorker.addEventListener("controllerchange", () => {

      window.location.reload();

    });

    // 🔥 activar nuevo SW
    if (reg.waiting) {

      reg.waiting.postMessage({
        type: "SKIP_WAITING"
      });

    }

  };

};