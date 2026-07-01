function calcularGanancia(resultado) {
  let totalApostado = 0;
  let totalGanado = 0;

  bets.forEach(b => {
    totalApostado += b.monto;

    //
    if (b.tipo === "numero" && b.valor === resultado) {
      totalGanado += b.monto * 36;
    }

    //
    if (b.tipo === "rojo" && rojos.includes(resultado)) {
      totalGanado += b.monto * 2;
    }

    //
    if (b.tipo === "negro" && !rojos.includes(resultado) && resultado !== 0) {
      totalGanado += b.monto * 2;
    }

    // par
    if (b.tipo === "par" && resultado % 2 === 0 && resultado !== 0) {
      totalGanado += b.monto * 2;
    }

    // impar
    if (b.tipo === "impar" && resultado % 2 === 1) {
      totalGanado += b.monto * 2;
    }

    // docenas
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

  //
  return totalGanado;
}


function girar() {

  if (bets.length === 0) {
    alert("Hace una apuesta primero");
    return;
  }

  const wheelInner = document.getElementById("wheel-inner");

  const ang = 360 / numeros.length;
  const vueltas = 5;

  //
  const index = Math.floor(Math.random() * numeros.length);

  //
  const target = index * ang;

  const OFFSET = ang / 2-1;

 rotation += vueltas * 360 + (360 - target) - OFFSET;

  wheelInner.style.transform = `rotate(${rotation}deg)`;

 setTimeout(() => {

  let angle = rotation % 360;
  angle = (360 - angle) % 360;

  const realIndex = Math.floor(angle / ang);
  const numeroReal = numeros[realIndex];

  //
  historial.unshift(numeroReal);

  // limitar historial
  if (historial.length > 12) {
    historial.pop();
  }

  // guardar en localStorage
  localStorage.setItem("historialRuleta", JSON.stringify(historial));

  // renderizar
  renderHistorial();

  //
  result.textContent = numeroReal;
  result.style.color = getTextColor(numeroReal);

  const ganancia = calcularGanancia(numeroReal);

  const resultadoEl = document.getElementById("resultadoApuesta");

  if (resultadoEl) {
    resultadoEl.textContent =
      ganancia > 0 ? `Ganaste ${ganancia}` : "Perdiste";

    resultadoEl.style.color =
      ganancia > 0 ? "#22c55e" : "#ef4444";
  }

  bets = [];
  renderApuestas();

 }, 2000);
}
function getTextColor(n) {
  if (n === 0) return "#22c55e"; // verde
  return rojos.includes(n) ? "#ef4444" : "#ffffff"; // blanco para negros
}
function renderSaldo() {
  const el = document.getElementById("saldo");
  if (!el) return;

  el.textContent = `Fichas: ${saldoFichas}`;
}
function eliminarApuesta(index) {
  bets.splice(index, 1);
  renderApuestas();
}
