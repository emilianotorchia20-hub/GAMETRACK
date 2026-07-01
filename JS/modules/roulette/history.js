function actualizarHistorial(number) {
  historial.unshift(number);

  if (historial.length > 24) {
    historial = historial.slice(0, 24);
  }

  localStorage.setItem("historialRuleta", JSON.stringify(historial));
  renderHistorial();
}

function renderHistorial() {
  const cont = document.getElementById("historial");
  if (!cont) return;

  cont.innerHTML = historial.map((n, index) => {
    return `
      <div class="history-item ${getNumberColorClass(n)} ${index === 0 ? "latest" : ""}">
        ${n}
      </div>
    `;
  }).join("");

  cont.scrollTo({ left: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}
