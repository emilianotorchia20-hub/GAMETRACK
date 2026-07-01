function setupChips() {
  document.querySelectorAll(".chip").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentChip = Number(btn.dataset.value);
    };
  });
}

// =========================
//
// =========================
function setupBotonesApuesta() {
  document.querySelectorAll(".bet-options button").forEach(btn => {
    btn.onclick = () => {
      const tipo = btn.dataset.bet;
      agregarApuesta(tipo);
    };
  });
}

// =========================
//
// =========================
function agregarApuesta(tipo, valor = null) {

  //
  const existente = bets.find(b => 
    b.tipo === tipo && b.valor === valor
  );

  if (existente) {
    //
    existente.monto += currentChip;
  } else {
    //
    bets.push({
      tipo,
      valor,
      monto: currentChip
    });
  }

  renderApuestas();
}
// =========================
//
// =========================
function renderApuestas() {
  const cont = document.getElementById("betsList");
  if (!cont) return;

  if (bets.length === 0) {
    cont.innerHTML = "";
    return;
  }

  cont.innerHTML = bets.map((b, index) => {
    const titulo = b.tipo === "numero"
      ? `Numero ${b.valor}`
      : formatBetName(b.tipo);

    return `
      <div class="bet-item">
        <span class="bet-detail">
          <span class="bet-chip ${getBetChipClass(b)}"></span>
          <span>
            <span class="bet-title">${titulo}</span>
            <span class="bet-amount">${b.monto} fichas</span>
          </span>
        </span>
        <button class="delete-bet" data-index="${index}" aria-label="Eliminar apuesta">x</button>
      </div>
    `;
  }).join("");

  //
  document.querySelectorAll(".delete-bet").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index);
      eliminarApuesta(i);
    });
  });
}

function formatBetName(tipo) {
  const names = {
    rojo: "Rojo",
    negro: "Negro",
    par: "Par",
    impar: "Impar",
    docena1: "1-12",
    docena2: "13-24",
    docena3: "25-36",
  };

  return names[tipo] || tipo;
}

function getBetChipClass(bet) {
  if (bet.tipo === "rojo") return "red";
  if (bet.tipo === "negro") return "black";
  if (bet.tipo === "numero") {
    if (bet.valor === 0) return "green";
    return rojos.includes(bet.valor) ? "red" : "black";
  }
  if (bet.tipo.startsWith("docena")) return "gold";
  return "blue";
}

// =========================
//
// =========================
