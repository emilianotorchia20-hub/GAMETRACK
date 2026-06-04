// ==========================
// 🎬 LOADER + NAVEGACIÓN
// ==========================
document.addEventListener("DOMContentLoaded", () => {

  const loader =
    document.getElementById("loader");

  // ==========================
  // 🎬 LOADER SYSTEM
  // ==========================
  if (loader) {

    const navegando =
      localStorage.getItem("navegando");

    // 🔥 navegación interna
    if (navegando) {

      loader.classList.add("hidden");

      // 💀 remover totalmente
      setTimeout(() => {

        loader.remove();

      }, 700);

      localStorage.removeItem(
        "navegando"
      );

    } else {

      const yaMostrado =
        localStorage.getItem(
          "loaderVisto"
        );

      // 🎬 primera carga
      if (!yaMostrado) {

        loader.classList.remove(
          "hidden"
        );

        setTimeout(() => {

          loader.classList.add(
            "hidden"
          );

          // 💀 eliminar loader
          setTimeout(() => {

            loader.remove();

          }, 700);

          localStorage.setItem(
            "loaderVisto",
            "true"
          );

        }, 1800);

      } else {

        loader.classList.add(
          "hidden"
        );

        // 💀 remover instantáneo
        setTimeout(() => {

          loader.remove();

        }, 100);

      }

    }

  }

  // ==========================
  // 🔄 PAGE TRANSITIONS
  // ==========================
  document
    .querySelectorAll("nav a")
    .forEach(link => {

      link.addEventListener(
        "click",
        e => {

          e.preventDefault();

          localStorage.setItem(
            "navegando",
            "true"
          );

          const url = link.href;

          document.body.classList.add(
            "fade-out"
          );

          setTimeout(() => {

            window.location.href = url;

          }, 220);

        }
      );

    });

});

// ==========================
// 🔁 RESET LOADER
// ==========================
window.addEventListener(
  "beforeunload",
  () => {

    localStorage.removeItem(
      "loaderVisto"
    );

  }
);

// ==========================
// 📱 SERVICE WORKER + UPDATE
// ==========================
if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("./sw.js")

    .then(reg => {

      console.log(
        "✅ SW registrado"
      );

      // Buscar updates
      reg.update();

      // Cuando el nuevo SW toma control
      navigator.serviceWorker
        .addEventListener(

          "controllerchange",

          () => {

            window.location.reload();

          }

        );

      // Si ya hay una actualización esperando
      if (reg.waiting) {

        window.mostrarUpdateUI(
          reg
        );

      }

      // Detectar nuevo SW
      reg.addEventListener(

        "updatefound",

        () => {

          const newWorker =
            reg.installing;

          if (!newWorker) return;

          newWorker.addEventListener(

            "statechange",

            () => {

              if (

                newWorker.state ===
                "installed"

                &&

                navigator
                  .serviceWorker
                  .controller

              ) {

                console.log(
                  "✅ Actualización lista"
                );

                window
                  .mostrarUpdateUI(
                    reg
                  );

              }

            }

          );

        }

      );

    })

    .catch(err => {

      console.log(
        "❌ Error SW:",
        err
      );

    });

}

// ==========================
// 🚀 UPDATE UI
// ==========================
window.mostrarUpdateUI =
function(reg){

  if (
    document.getElementById(
      "updateBtn"
    )
  ) {
    return;
  }

  const btn =
    document.createElement(
      "button"
    );

  btn.id = "updateBtn";

  btn.innerText =
    "🔄 Actualización disponible";

  btn.className =
    "install-btn";

  document.body.appendChild(
    btn
  );

  btn.addEventListener(

    "click",

    () => {

      if (
        reg.waiting
      ) {

        reg.waiting.postMessage({
          type: "SKIP_WAITING"
        });

      }

    }

  );

};
// ==========================
// 🚀 UPDATE UI
// ==========================
window.mostrarUpdateUI =
function(reg){

  // 🚫 evitar duplicados
  if (
    document.getElementById(
      "updateBtn"
    )
  ) {
    return;
  }

  const btn =
    document.createElement(
      "button"
    );

  btn.id = "updateBtn";

  btn.innerText =
    "🔄 Actualización disponible";

  btn.className =
    "install-btn";

  document.body.appendChild(btn);

  btn.addEventListener(
    "click",
    () => {

      if (reg.waiting) {

        reg.waiting.postMessage({
          type: "SKIP_WAITING"
        });

      }

    }
  );

};

// ==========================
// 🔔 CONFIG ALERTAS
// ==========================
const bankrollAlertsCheckbox =
  document.getElementById(
    "bankrollAlertsEnabled"
  );

const bankrollLimitInput =
  document.getElementById(
    "bankrollLimit"
  );

const sessionAlertsCheckbox =
  document.getElementById(
    "sessionAlertsEnabled"
  );

const sessionLossLimitInput =
  document.getElementById(
    "sessionLossLimit"
  );

if (

  bankrollAlertsCheckbox &&
  bankrollLimitInput &&
  sessionAlertsCheckbox &&
  sessionLossLimitInput

) {

  const settings =
    getSettings();

  // 💰 bankroll
  bankrollAlertsCheckbox.checked =
    settings.bankrollAlertsEnabled;

  bankrollLimitInput.value =
    settings.bankrollLimit;

  // 📉 sesión
  sessionAlertsCheckbox.checked =
    settings.sessionAlertsEnabled;

  sessionLossLimitInput.value =
    settings.sessionLossLimit;

  // 💰 guardar bankroll
  bankrollAlertsCheckbox
    .addEventListener(
      "change",
      () => {

        settings
          .bankrollAlertsEnabled =
            bankrollAlertsCheckbox.checked;

        saveSettings(settings);

      }
    );

  bankrollLimitInput
    .addEventListener(
      "input",
      () => {

        settings.bankrollLimit =
          Number(
            bankrollLimitInput.value
          );

        saveSettings(settings);

      }
    );

  // 📉 guardar sesión
  sessionAlertsCheckbox
    .addEventListener(
      "change",
      () => {

        settings
          .sessionAlertsEnabled =
            sessionAlertsCheckbox.checked;

        saveSettings(settings);

      }
    );

  sessionLossLimitInput
    .addEventListener(
      "input",
      () => {

        settings.sessionLossLimit =
          Number(
            sessionLossLimitInput.value
          );

        saveSettings(settings);

      }
    );

}

// 🚨 verificar alertas
window.checkBankrollLimit?.();
// ==========================
// 👑 DASHBOARD REAL
// ==========================

const sesionesDashboard =
  JSON.parse(
    localStorage.getItem("sessions")
  ) || [];

// 💰 total
const gananciaTotalDashboard =
  sesionesDashboard.reduce((acc, s) => {

    const resultado =
      s.resultado ??
      (s.final - s.inicial);

    return acc + resultado;

  }, 0);

// 🟢 ganadas
const ganadasDashboard =
  sesionesDashboard.filter(s => {

    const resultado =
      s.resultado ??
      (s.final - s.inicial);

    return resultado > 0;

  }).length;

// 📊 winrate
const winrateDashboard =
  sesionesDashboard.length
    ? (
        ganadasDashboard /
        sesionesDashboard.length
      ) * 100
    : 0;

// 📈 invertido
const invertidoDashboard =
  sesionesDashboard.reduce(
    (acc, s) =>
      acc + Number(s.inicial),
    0
  );

// 💎 ROI
const roiDashboard =
  invertidoDashboard
    ? (
        gananciaTotalDashboard /
        invertidoDashboard
      ) * 100
    : 0;

// 👑 nivel
let nivelDashboard = "Rookie";

if (gananciaTotalDashboard > 50000) {
  nivelDashboard = "Pro Player";
}

if (gananciaTotalDashboard > 200000) {
  nivelDashboard = "High Roller";
}

if (gananciaTotalDashboard > 1000000) {
  nivelDashboard = "Casino King";
}

// ==========================
// 🎨 RENDER
// ==========================

const profitEl =
  document.getElementById(
    "dashboardProfit"
  );

if (profitEl) {

  profitEl.textContent =
    `${gananciaTotalDashboard >= 0 ? "+" : "-"}$${Math.abs(
      gananciaTotalDashboard
    ).toLocaleString("es-AR")}`;

}

const winrateEl =
  document.getElementById(
    "dashboardWinrate"
  );

if (winrateEl) {

  winrateEl.textContent =
    `${winrateDashboard.toFixed(0)}%`;

}

const sessionsEl =
  document.getElementById(
    "dashboardSessions"
  );

if (sessionsEl) {

  sessionsEl.textContent =
    sesionesDashboard.length;

}

const roiEl =
  document.getElementById(
    "dashboardROI"
  );

if (roiEl) {

  roiEl.textContent =
    `${roiDashboard.toFixed(1)}%`;

}

const levelEl =
  document.getElementById(
    "dashboardLevel"
  );

if (levelEl) {

  levelEl.textContent =
    nivelDashboard;

}

// ==========================
// 📋 ACTIVIDAD RECIENTE
// ==========================

const activityList =
  document.getElementById(
    "activityList"
  );

if (activityList) {

  if (sesionesDashboard.length === 0) {

    activityList.innerHTML = `

      <div class="activity-empty">

        Sin sesiones todavía

      </div>

    `;

  }

  else {

    const recientes =
      [...sesionesDashboard]
        .reverse()
        .slice(0, 3);

    activityList.innerHTML =
      recientes.map(s => {

        const profit =
          s.resultado ??
          (s.final - s.inicial);

        return `

          <div class="activity-item">

            <div class="activity-left">

              <div>

                <div class="activity-game">

                  🎰 ${s.game}

                </div>

                <div class="activity-time">

                  Sesión reciente

                </div>

              </div>

            </div>

            <div class="
              activity-profit
              ${profit >= 0 ? "win" : "loss"}
            ">

              ${profit >= 0 ? "+" : "-"}$${Math.abs(
                profit
              ).toLocaleString("es-AR")}

            </div>

          </div>

        `;

      }).join("");

  }

}
// ==========================
// 💾 EXPORTAR DATOS
// ==========================

const exportBtn =
    document.getElementById(
        "exportDataBtn"
    );

if (exportBtn) {

    exportBtn.addEventListener(
        "click",
        () => {

            exportData();

        }
    );

}

// ==========================
// 📥 IMPORTAR DATOS
// ==========================

const importInput =
    document.getElementById(
        "importFile"
    );

if (importInput) {

    importInput.addEventListener(
        "change",
        (e) => {

            const file =
                e.target.files[0];

            importData(file);

        }
    );

}