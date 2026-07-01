function calcularGanancia(resultado) {
  let totalApostado = 0;
  let totalGanado = 0;

  bets.forEach(b => {
    totalApostado += b.monto;

    if (b.tipo === "numero" && b.valor === resultado) {
      totalGanado += b.monto * 36;
    }

    if (b.tipo === "rojo" && rojos.includes(resultado)) {
      totalGanado += b.monto * 2;
    }

    if (b.tipo === "negro" && !rojos.includes(resultado) && resultado !== 0) {
      totalGanado += b.monto * 2;
    }

    if (b.tipo === "par" && resultado % 2 === 0 && resultado !== 0) {
      totalGanado += b.monto * 2;
    }

    if (b.tipo === "impar" && resultado % 2 === 1) {
      totalGanado += b.monto * 2;
    }

    if (b.tipo === "docena1" && resultado >= 1 && resultado <= 12) {
      totalGanado += b.monto * 3;
    }

    if (b.tipo === "docena2" && resultado >= 13 && resultado <= 24) {
      totalGanado += b.monto * 3;
    }

    if (b.tipo === "docena3" && resultado >= 25 && resultado <= 36) {
      totalGanado += b.monto * 3;
    }
  });

  return totalGanado;
}

function elegirResultado() {
  const index = Math.floor(Math.random() * numeros.length);
  return numeros[index];
}

function getBallFinalAngle() {
  const offsetToPointer = normalizeAngle(ballAngle - POINTER_ANGLE);
  return ballAngle - (10 * 360 + offsetToPointer);
}

function getSpinDuration() {
  return prefersReducedMotion()
    ? REDUCED_MOTION_DURATION_MS
    : SPIN_DURATION_MS + Math.round(Math.random() * 1200);
}

function animateSpin(targetNumber, onComplete) {
  const startTime = performance.now();
  const duration = getSpinDuration();
  const startWheel = rotation;
  const endWheel = getFinalWheelRotation(targetNumber);
  const startBall = ballAngle;
  const endBall = getBallFinalAngle();
  const reducedMotion = prefersReducedMotion();

  function frame(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    const wheelProgress = easeOutQuint(progress);
    const ballProgress = easeOutBackSoft(progress);

    const wheelAngle = startWheel + (endWheel - startWheel) * wheelProgress;
    let currentBallAngle = startBall + (endBall - startBall) * ballProgress;
    let ballRadius = BALL_TRACK_RADIUS;

    if (!reducedMotion && progress > .68) {
      const endPhase = (progress - .68) / .32;
      const bounce = Math.sin(endPhase * Math.PI * 16) * (1 - endPhase);
      currentBallAngle += bounce * (SLOT_ANGLE * .42);
      ballRadius = BALL_TRACK_RADIUS - (BALL_TRACK_RADIUS - BALL_POCKET_RADIUS) * endPhase;
    }

    setWheelRotation(wheelAngle);
    setBallAngle(currentBallAngle, ballRadius);

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    setWheelRotation(endWheel);
    setBallAngle(POINTER_ANGLE, BALL_POCKET_RADIUS);
    onComplete();
  }

  requestAnimationFrame(frame);
}

function girar() {
  if (isSpinning) return;

  if (bets.length === 0) {
    window.gameTrackAlert?.(
      "Hace una apuesta primero",
      { title: "Sin apuesta" }
    );
    return;
  }

  const spinButton = document.getElementById("girar");
  const targetNumber = elegirResultado();
  activeWinningNumber = targetNumber;
  isSpinning = true;

  if (spinButton) {
    spinButton.disabled = true;
    spinButton.classList.add("spinning");
    spinButton.textContent = "Girando";
  }

  wheel?.classList.remove("settled");
  document.querySelectorAll(".wheel-number").forEach(item => {
    item.classList.remove("winner");
  });

  animateSpin(targetNumber, () => finalizarGiro(targetNumber, spinButton));
}

function finalizarGiro(numeroReal, spinButton) {
  actualizarHistorial(numeroReal);

  if (result) {
    result.textContent = numeroReal;
    result.style.color = getTextColor(numeroReal);
    result.classList.remove("result-pop");
    void result.offsetWidth;
    result.classList.add("result-pop");
  }

  const ganancia = calcularGanancia(numeroReal);
  const resultadoEl = document.getElementById("resultadoApuesta");

  if (resultadoEl) {
    resultadoEl.textContent =
      ganancia > 0 ? `Ganaste ${ganancia}` : "Perdiste";

    resultadoEl.style.color =
      ganancia > 0 ? "#22c55e" : "#ef4444";
  }

  highlightWinningPocket(numeroReal);
  bets = [];
  renderApuestas();
  activeWinningNumber = null;
  isSpinning = false;

  if (spinButton) {
    spinButton.disabled = false;
    spinButton.classList.remove("spinning");
    spinButton.textContent = "Girar";
  }
}

function getTextColor(n) {
  if (n === 0) return "#22c55e";
  return rojos.includes(n) ? "#ef4444" : "#ffffff";
}

function renderSaldo() {
  const el = document.getElementById("saldo");
  if (!el) return;

  el.textContent = `Fichas: ${saldoFichas}`;
}

function eliminarApuesta(index) {
  if (isSpinning) return;
  bets.splice(index, 1);
  renderApuestas();
}
