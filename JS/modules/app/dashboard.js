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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (activityList) {

  if (sesionesDashboard.length === 0) {

    activityList.innerHTML = `

      <div class="activity-empty">

        Sin sesiones todavia

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

        const gameName = escapeHtml(s.game || "Juego");

        return `

          <div class="activity-item">

            <div class="activity-left">

              <div>

                <div class="activity-game">

                  ${gameName}

                </div>

                <div class="activity-time">

                  Sesion reciente

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
