// ==========================
// ðŸŽ¬ LOADER + NAVEGACIÃ“N
// ==========================
function initAppShell() {

  const loader =
    document.getElementById("loader");

  // ==========================
  // ðŸŽ¬ LOADER SYSTEM
  // ==========================
  if (loader) {

    const navegando =
      localStorage.getItem("navegando");

    // ðŸ”¥ navegaciÃ³n interna
    if (navegando) {

      loader.classList.add("hidden");

      // ðŸ’€ remover totalmente
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

      // ðŸŽ¬ primera carga
      if (!yaMostrado) {

        loader.classList.remove(
          "hidden"
        );

        setTimeout(() => {

          loader.classList.add(
            "hidden"
          );

          // ðŸ’€ eliminar loader
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

        // ðŸ’€ remover instantÃ¡neo
        setTimeout(() => {

          loader.remove();

        }, 100);

      }

    }

  }

  // ==========================
  // ðŸ”„ PAGE TRANSITIONS
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

}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initAppShell,
    { once: true }
  );
} else {
  initAppShell();
}

// ==========================
// ðŸ” RESET LOADER
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
// ðŸ“± SERVICE WORKER + UPDATE
// ==========================
// ==========================
// ðŸ”” CONFIG ALERTAS
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

  // ðŸ’° bankroll
  bankrollAlertsCheckbox.checked =
    settings.bankrollAlertsEnabled;

  bankrollLimitInput.value =
    settings.bankrollLimit;

  // ðŸ“‰ sesiÃ³n
  sessionAlertsCheckbox.checked =
    settings.sessionAlertsEnabled;

  sessionLossLimitInput.value =
    settings.sessionLossLimit;

  // ðŸ’° guardar bankroll
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

  // ðŸ“‰ guardar sesiÃ³n
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

// ðŸš¨ verificar alertas
window.checkBankrollLimit?.();
// ==========================
// ðŸ‘‘ DASHBOARD REAL
// ==========================

const sesionesDashboard =
  JSON.parse(
    localStorage.getItem("sessions")
  ) || [];

// ðŸ’° total
const gananciaTotalDashboard =
  sesionesDashboard.reduce((acc, s) => {

    const resultado =
      s.resultado ??
      (s.final - s.inicial);

    return acc + resultado;

  }, 0);

// ðŸŸ¢ ganadas
const ganadasDashboard =
  sesionesDashboard.filter(s => {

    const resultado =
      s.resultado ??
      (s.final - s.inicial);

    return resultado > 0;

  }).length;

// ðŸ“Š winrate
const winrateDashboard =
  sesionesDashboard.length
    ? (
        ganadasDashboard /
        sesionesDashboard.length
      ) * 100
    : 0;

// ðŸ“ˆ invertido
const invertidoDashboard =
  sesionesDashboard.reduce(
    (acc, s) =>
      acc + Number(s.inicial),
    0
  );

// ðŸ’Ž ROI
const roiDashboard =
  invertidoDashboard
    ? (
        gananciaTotalDashboard /
        invertidoDashboard
      ) * 100
    : 0;

// ðŸ‘‘ nivel
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
// ðŸŽ¨ RENDER
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
// ðŸ“‹ ACTIVIDAD RECIENTE
// ==========================

const activityList =
  document.getElementById(
    "activityList"
  );

if (activityList) {

  if (sesionesDashboard.length === 0) {

    activityList.innerHTML = `

      <div class="activity-empty">

        Sin sesiones todavÃ­a

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

                  ðŸŽ° ${s.game}

                </div>

                <div class="activity-time">

                  SesiÃ³n reciente

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
// ðŸ’¾ EXPORTAR DATOS
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
// ðŸ“¥ IMPORTAR DATOS
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
