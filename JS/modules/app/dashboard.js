const dashboardSessions =
  JSON.parse(
    localStorage.getItem("sessions")
  ) || [];

function getDashboardResult(session) {
  return Number(
    session.resultado ??
    (session.final - session.inicial) ??
    0
  );
}

function formatDashboardMoney(value) {
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

function formatDashboardSignedMoney(value) {
  const sign =
    value >= 0 ? "+" : "-";

  return `${sign}${formatDashboardMoney(Math.abs(value))}`;
}

function setDashboardText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value;

    if (id === "dashboardProfit") {
      const compactLength =
        String(value).replace(/\s/g, "").length;

      element.dataset.amountSize =
        compactLength > 13
        ? "long"
        : compactLength > 9
          ? "medium"
          : "normal";
    }
  }
}

function getDashboardStreak(sessions) {
  let streak = 0;

  for (let i = sessions.length - 1; i >= 0; i--) {
    const result =
      getDashboardResult(sessions[i]);

    if (result > 0) {
      if (streak >= 0) streak++;
      else break;
    } else if (result < 0) {
      if (streak <= 0) streak--;
      else break;
    } else {
      break;
    }
  }

  return streak;
}

function getStreakCopy(streak) {
  if (streak > 0) return `${streak} ganadas`;
  if (streak < 0) return `${Math.abs(streak)} perdidas`;
  return "Sin racha";
}

function getTopGame(sessions) {
  const games = {};

  sessions.forEach(session => {
    const game =
      session.game || "Sin juego";

    games[game] =
      (games[game] || 0) + getDashboardResult(session);
  });

  return Object.entries(games)
    .sort((a, b) => b[1] - a[1])[0];
}

function getDashboardLevel(total) {
  if (total > 1000000) return "Casino King";
  if (total > 200000) return "High Roller";
  if (total > 50000) return "Pro Player";
  if (total > 0) return "Rising Player";
  return "Rookie";
}

function getDashboardTip({ total, winrate, streak }) {
  if (dashboardSessions.length === 0) {
    return {
      title: "Crea tu primera muestra",
      text: "Registra varias sesiones con notas cortas para detectar patrones de juego, rachas y limites saludables."
    };
  }

  if (total < 0 && streak < 0) {
    return {
      title: "Momento de proteger capital",
      text: "Tu balance y tu racha estan en rojo. Baja el monto por sesion y evita perseguir perdidas."
    };
  }

  if (winrate >= 60 && total > 0) {
    return {
      title: "Buen ritmo, mantene disciplina",
      text: "Los datos vienen fuertes. Mantene apuesta estable y usa el historial para no sobreexponerte."
    };
  }

  return {
    title: "Sigue construyendo lectura",
    text: "El panel mejora con cada registro. Agrega notas sobre estrategia, estado y tipo de mesa."
  };
}

const dashboardTotal =
  dashboardSessions.reduce(
    (sum, session) => sum + getDashboardResult(session),
    0
  );

const dashboardWins =
  dashboardSessions.filter(
    session => getDashboardResult(session) > 0
  ).length;

const dashboardInvested =
  dashboardSessions.reduce(
    (sum, session) => sum + (Number(session.inicial) || 0),
    0
  );

const dashboardWinrate =
  dashboardSessions.length
  ? (dashboardWins / dashboardSessions.length) * 100
  : 0;

const dashboardRoi =
  dashboardInvested
  ? (dashboardTotal / dashboardInvested) * 100
  : 0;

const dashboardAverage =
  dashboardSessions.length
  ? dashboardTotal / dashboardSessions.length
  : 0;

const dashboardResults =
  dashboardSessions.map(getDashboardResult);

const dashboardBest =
  dashboardResults.length
  ? Math.max(...dashboardResults)
  : 0;

const dashboardStreak =
  getDashboardStreak(dashboardSessions);

const dashboardLast =
  dashboardSessions.length
  ? getDashboardResult(dashboardSessions[dashboardSessions.length - 1])
  : null;

const dashboardTopGame =
  getTopGame(dashboardSessions);

setDashboardText(
  "dashboardProfit",
  formatDashboardSignedMoney(dashboardTotal)
);

setDashboardText(
  "dashboardSignal",
  dashboardSessions.length
  ? dashboardTotal >= 0
    ? "Balance positivo acumulado"
    : "Balance en zona de recuperacion"
  : "Sin sesiones registradas"
);

setDashboardText(
  "dashboardWinrate",
  `${dashboardWinrate.toFixed(0)}%`
);

setDashboardText(
  "dashboardSessions",
  String(dashboardSessions.length)
);

setDashboardText(
  "dashboardROI",
  `${dashboardRoi.toFixed(1)}%`
);

setDashboardText(
  "dashboardAverage",
  formatDashboardMoney(dashboardAverage)
);

setDashboardText(
  "dashboardBest",
  formatDashboardMoney(dashboardBest)
);

setDashboardText(
  "dashboardStreak",
  getStreakCopy(dashboardStreak)
);

setDashboardText(
  "dashboardLevel",
  getDashboardLevel(dashboardTotal)
);

setDashboardText(
  "dashboardLevelHint",
  dashboardSessions.length
  ? `${dashboardSessions.length} sesiones analizadas`
  : "Nivel automatico"
);

setDashboardText(
  "dashboardLastSession",
  dashboardLast === null
  ? "Sin datos"
  : formatDashboardSignedMoney(dashboardLast)
);

setDashboardText(
  "dashboardTopGame",
  dashboardTopGame?.[0] || "Sin datos"
);

const dashboardTip =
  getDashboardTip({
    total: dashboardTotal,
    winrate: dashboardWinrate,
    streak: dashboardStreak
  });

setDashboardText(
  "dashboardTipTitle",
  dashboardTip.title
);

setDashboardText(
  "dashboardTipText",
  dashboardTip.text
);

const activityList =
  document.getElementById(
    "activityList"
  );

function escapeDashboardHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

if (activityList) {
  if (dashboardSessions.length === 0) {
    activityList.innerHTML = `
      <div class="activity-empty">
        Todavia no hay sesiones guardadas.
      </div>
    `;
  } else {
    const recent =
      [...dashboardSessions]
        .reverse()
        .slice(0, 4);

    activityList.innerHTML =
      recent.map(session => {
        const profit =
          getDashboardResult(session);

        const gameName =
          escapeDashboardHtml(session.game || "Juego");

        return `
          <div class="activity-item">
            <div class="activity-left">
              <span class="activity-dot ${profit >= 0 ? "win" : "loss"}"></span>
              <div>
                <div class="activity-game">${gameName}</div>
                <div class="activity-time">Sesion reciente</div>
              </div>
            </div>

            <div class="activity-profit ${profit >= 0 ? "win" : "loss"}">
              ${formatDashboardSignedMoney(profit)}
            </div>
          </div>
        `;
      }).join("");
  }
}
