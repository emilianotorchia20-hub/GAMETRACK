const bankrollGoalInput =
  document.getElementById("bankrollGoalInput");

const bankrollGoalProgress =
  document.getElementById("bankrollGoalProgress");

const bankrollGoalStatus =
  document.getElementById("bankrollGoalStatus");

const bankrollGoalRemaining =
  document.getElementById("bankrollGoalRemaining");

const bankrollSessionsMeta =
  document.getElementById("bankrollSessionsMeta");

const bankrollTrendMeta =
  document.getElementById("bankrollTrendMeta");

const BANKROLL_GOAL_KEY = "gametrack.bankrollGoal";

function getSessionsForGoal() {
  return JSON.parse(localStorage.getItem("sessions")) || [];
}

function getGoalBankroll() {
  return typeof obtenerBankroll === "function"
    ? obtenerBankroll()
    : 0;
}

function getLastSessionResult(sessions) {
  const last =
    sessions[sessions.length - 1];

  if (!last) return 0;

  return Number(
    last.resultado ??
    (last.final - last.inicial) ??
    0
  );
}

function updateBankrollSummaryMeta() {
  if (!bankrollSessionsMeta && !bankrollTrendMeta) return;

  const sessions =
    getSessionsForGoal();

  if (bankrollSessionsMeta) {
    bankrollSessionsMeta.textContent =
      `${sessions.length} sesiones`;
  }

  if (bankrollTrendMeta) {
    const lastResult =
      getLastSessionResult(sessions);

    bankrollTrendMeta.textContent =
      sessions.length
      ? `Ultima: ${formatearDinero(lastResult)}`
      : "Sin movimiento";

    bankrollTrendMeta.dataset.tone =
      lastResult > 0
      ? "positive"
      : lastResult < 0
      ? "negative"
      : "neutral";
  }
}

function renderBankrollGoal() {
  if (
    !bankrollGoalInput ||
    !bankrollGoalProgress ||
    !bankrollGoalStatus ||
    !bankrollGoalRemaining
  ) return;

  const bankroll =
    getGoalBankroll();

  const goal =
    Number(localStorage.getItem(BANKROLL_GOAL_KEY)) || 0;

  bankrollGoalInput.value =
    goal > 0 ? goal : "";

  if (goal <= 0) {
    bankrollGoalProgress.style.width = "0%";
    bankrollGoalStatus.textContent = "Sin meta definida";
    bankrollGoalRemaining.textContent = "Agrega un objetivo para medir progreso";
    return;
  }

  const progress =
    Math.max(0, Math.min(100, (bankroll / goal) * 100));

  const remaining =
    goal - bankroll;

  bankrollGoalProgress.style.width =
    `${progress.toFixed(1)}%`;

  bankrollGoalStatus.textContent =
    `${progress.toFixed(1)}% completado`;

  bankrollGoalRemaining.textContent =
    remaining > 0
    ? `Faltan ${formatearDinero(remaining)}`
    : `Meta superada por ${formatearDinero(Math.abs(remaining))}`;

  bankrollGoalProgress.dataset.tone =
    remaining > 0 ? "pending" : "complete";
}

if (bankrollGoalInput) {
  bankrollGoalInput.addEventListener("input", () => {
    const goal =
      Number(bankrollGoalInput.value) || 0;

    if (goal > 0) {
      localStorage.setItem(BANKROLL_GOAL_KEY, String(goal));
    } else {
      localStorage.removeItem(BANKROLL_GOAL_KEY);
    }

    renderBankrollGoal();
  });
}

updateBankrollSummaryMeta();
renderBankrollGoal();

window.renderBankrollGoal =
  renderBankrollGoal;

