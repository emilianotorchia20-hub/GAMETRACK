function initRoulettePage() {
  
  wheel = document.getElementById("wheel");
  result = document.getElementById("resultado");
  renderHistorial();
  crearRueda();
  dibujarNumeros();
  generarGridNumeros();
  renderSaldo();
  setupChips();
  setupBotonesApuesta();
  renderStrategyCards();

  //
  document.querySelectorAll(".strategy-card").forEach(card => {
    card.addEventListener("click", () => {
      const tipo = card.dataset.strategy;
      mostrarEstrategia(tipo);
    });
  });

  const btn = document.getElementById("girar");
  if (btn) btn.addEventListener("click", girar);

}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initRoulettePage,
    { once: true }
  );
} else {
  initRoulettePage();
}

// =========================
//
// =========================
