function renderHistorial() {
  const cont = document.getElementById("historial");
  if (!cont) return;

  cont.innerHTML = historial.map(n => {
    let color = "#111";

    if (n === 0) color = "#22c55e";
    else if (rojos.includes(n)) color = "#ef4444";

    return `
      <div class="history-item" style="background:${color}">
        ${n}
      </div>
    `;
  }).join("");
}
