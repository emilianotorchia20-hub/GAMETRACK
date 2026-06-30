
// =========================
//
// =========================
const numeros = [
  0,32,15,19,4,21,2,25,17,34,6,
  27,13,36,11,30,8,23,10,5,24,
  16,33,1,20,14,31,9,22,18,29,
  7,28,12,35,3,26
];

const rojos = [
  1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
];

function getColor(n) {
  if (n === 0) return "#22c55e"; // verde
  return rojos.includes(n) ? "#b91c1c" : "#111";
}

// =========================
//
// =========================
let wheel, result;
let rotation = 0;
let historial = JSON.parse(localStorage.getItem("historialRuleta")) || [];
let currentChip = 100;
let bets = [];
let saldoFichas = Number(localStorage.getItem("saldoFichas")) || 1000;
// =========================
//
// =========================
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
function crearRueda() {
  if (!wheel) return;

  const ang = 360 / numeros.length;

  const grad = numeros.map((n, i) => {
    const start = i * ang;
    const end = (i + 1) * ang + 0.5;

    return `${getColor(n)} ${start}deg ${end}deg`;
  }).join(",");

  const wheelInner = document.getElementById("wheel-inner");

  wheelInner.style.background = `conic-gradient(${grad})`; 
}

// =========================
//
// =========================
function dibujarNumeros() {
  const cont = document.getElementById("numbers");
  if (!cont) return;

  cont.innerHTML = "";

  const ang = 360 / numeros.length;
  const radio = 130;

  numeros.forEach((n, i) => {
  const el = document.createElement("div");
  el.textContent = n;

  const a = i * ang + ang / 2; // centrado + ajuste fino

  el.style.position = "absolute";
  el.style.left = "50%";
  el.style.top = "50%";

  el.style.transform = `
    translate(-50%, -50%)
    rotate(${a}deg)
    translateY(-${radio}px)
    rotate(-${a}deg)
  `;

  el.style.color = "#fff";
  el.style.fontWeight = "bold";

  cont.appendChild(el);
});
}
// =========================
//
// =========================
function generarGridNumeros() {
  const grid = document.getElementById("numbersGrid");
  if (!grid) return;

  grid.innerHTML = "";

  numeros.forEach(n => {
    const div = document.createElement("div");
    div.textContent = n;

    div.className =
      n === 0 ? "num-green" :
      rojos.includes(n) ? "num-red" : "num-black";

    div.onclick = () => agregarApuesta("numero", n);

    grid.appendChild(div);
  });
}

// =========================
//
// =========================
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
    cont.innerHTML = "Sin apuestas";
    return;
  }

  cont.innerHTML = bets.map((b, index) => {
    const texto = b.tipo === "numero"
      ? `Numero ${b.valor} -> ${b.monto}`
      : `${formatBetName(b.tipo)} -> ${b.monto}`;

    return `
      <div class="bet-item">
        <span>${texto}</span>
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

// =========================
//
// =========================
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

function getStrategyContent(tipo) {
  const strategies = {
    martingale: {
      title: "Martingale",
      description: "Duplicas la apuesta cada vez que perdes hasta recuperar lo perdido.",
      rules: ["Perdes: duplicas la apuesta", "Ganas: volves al monto inicial"],
      example: ["100 -> perdes", "200 -> perdes", "400 -> ganas"],
      benefits: ["Simple de entender", "Recuperacion rapida"],
      risks: ["Consume mucho saldo", "Las malas rachas son peligrosas"],
    },
    dalembert: {
      title: "D'Alembert",
      description: "Subis una unidad al perder y bajas una unidad al ganar.",
      rules: ["Perdes: sumas 1 unidad", "Ganas: restas 1 unidad"],
      example: ["100 -> perdes -> 200", "200 -> ganas -> 100"],
      benefits: ["Mas estable que Martingale", "Menor exposicion"],
      risks: ["Recupera perdidas lentamente"],
    },
    fibonacci: {
      title: "Fibonacci",
      description: "Usas la secuencia 1, 1, 2, 3, 5, 8 para definir el monto.",
      rules: ["Perdes: avanzas en la secuencia", "Ganas: retrocedes 2 pasos"],
      example: ["100 -> perdes -> 100", "100 -> perdes -> 200", "200 -> ganas -> retrocedes"],
      benefits: ["Menos agresiva que Martingale"],
      risks: ["Puede crecer rapido en una mala racha"],
    },
    labouchere: {
      title: "Labouchere",
      description: "Creas una secuencia numerica y apostas la suma del primer y ultimo numero.",
      rules: ["Ganas: tachas los extremos", "Perdes: agregas el monto al final"],
      example: ["Lista: 1-2-3-4", "Apuesta: 1 + 4 = 5"],
      benefits: ["Estructurada y flexible"],
      risks: ["Las rachas largas agrandan la secuencia"],
    },
    reverseMartingale: {
      title: "Reverse Martingale",
      description: "Duplicas solo cuando ganas para aprovechar una racha positiva.",
      rules: ["Ganas: duplicas", "Perdes: volves al inicio"],
      example: ["100 -> ganas -> 200", "200 -> ganas -> 400"],
      benefits: ["Aprovecha rachas positivas"],
      risks: ["Podes devolver ganancias rapido"],
    },
    flat: {
      title: "Apuesta plana",
      description: "Apostas siempre la misma cantidad, sin progresiones.",
      rules: ["Mismo monto siempre", "Sin subir por perdidas ni ganancias"],
      example: ["100 -> siempre 100"],
      benefits: ["Muy controlada", "Buena para cuidar bankroll"],
      risks: ["Ganancias lentas"],
    },
    paroli: {
      title: "Paroli",
      description: "Aumentas la apuesta solo cuando ganas y reinicias al perder.",
      rules: ["Ganas: subis apuesta", "Perdes: reinicias"],
      example: ["100 -> 200", "200 -> 400"],
      benefits: ["Protege tu saldo inicial"],
      risks: ["La racha puede terminar rapido"],
    },
    sector: {
      title: "Estrategia de sectores",
      description: "Apostas a grupos cercanos dentro de la rueda.",
      rules: ["Cubris zonas especificas", "Buscas repeticiones regionales"],
      example: ["Zona 17-20", "Zona 26-32"],
      benefits: ["Cubre multiples numeros"],
      risks: ["No asegura resultados"],
    },
    contra: {
      title: "Contra racha",
      description: "Apostas contra la tendencia reciente.",
      rules: ["Muchos rojos: apostas negro", "Muchos pares: apostas impar"],
      example: ["5 rojos seguidos -> negro"],
      benefits: ["Busca reversion estadistica"],
      risks: ["Las rachas pueden continuar"],
    },
  };

  return strategies[tipo];
}

function addStrategySection(panel, label, text) {
  const strong = document.createElement("strong");
  strong.textContent = label;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  panel.append(strong, paragraph);
}

function addStrategyList(panel, label, items, highlighted = false) {
  const strong = document.createElement("strong");
  strong.textContent = label;

  const list = document.createElement("ul");
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }

  if (highlighted) {
    const box = document.createElement("div");
    box.className = "strategy-example";
    box.append(strong, list);
    panel.appendChild(box);
    return;
  }

  panel.append(strong, list);
}

function mostrarEstrategia(tipo) {
  const panel = document.getElementById("strategyInfo");
  const data = getStrategyContent(tipo);

  document.querySelectorAll(".strategy-card").forEach(card => {
    card.classList.toggle("active", card.dataset.strategy === tipo);
  });

  if (!panel || !data) return;

  panel.replaceChildren();

  const title = document.createElement("h3");
  title.textContent = data.title;
  panel.appendChild(title);

  addStrategySection(panel, "Como funciona", data.description);
  addStrategyList(panel, "Regla", data.rules);
  addStrategyList(panel, "Ejemplo", data.example, true);
  addStrategyList(panel, "Ventajas", data.benefits);
  addStrategyList(panel, "Riesgos", data.risks);

  panel.classList.add("active");
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

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
