
// =========================
// 🎯 DATOS RULETA
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
// 🧠 ESTADO
// =========================
let wheel, result;
let rotation = 0;
let historial = JSON.parse(localStorage.getItem("historialRuleta")) || [];
let currentChip = 100;
let bets = [];
let saldoFichas = Number(localStorage.getItem("saldoFichas")) || 1000;
// =========================
// 🚀 INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  
  wheel = document.getElementById("wheel");
  result = document.getElementById("resultado");
  renderHistorial();
  crearRueda();
  dibujarNumeros();
  generarGridNumeros();
  renderSaldo();
  setupChips();
  setupBotonesApuesta();

  // 👇 ESTO AGREGÁS
  document.querySelectorAll(".strategy-card").forEach(card => {
    card.addEventListener("click", () => {
      const tipo = card.dataset.strategy;
      mostrarEstrategia(tipo);
    });
  });

  const btn = document.getElementById("girar");
  if (btn) btn.addEventListener("click", girar);

});

// =========================
// 🎨 RULETA VISUAL (FIXED)
// =========================
function crearRueda() {
  if (!wheel) return;

  const ang = 360 / numeros.length;

  const grad = numeros.map((n, i) => {
    const start = i * ang;
    const end = (i + 1) * ang + 0.5; // 👈 overlap clave

    return `${getColor(n)} ${start}deg ${end}deg`;
  }).join(",");

  const wheelInner = document.getElementById("wheel-inner");

  wheelInner.style.background = `conic-gradient(${grad})`; 
}

// =========================
// 🔢 NÚMEROS EN LA RUEDA
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
// 🔢 GRID DE APUESTAS
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
// 💰 FICHAS
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
// 🎯 BOTONES DE APUESTA
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
// ➕ AGREGAR APUESTA
// =========================
function agregarApuesta(tipo, valor = null) {

  // 🔍 buscar si ya existe esa apuesta
  const existente = bets.find(b => 
    b.tipo === tipo && b.valor === valor
  );

  if (existente) {
    // 👉 acumular fichas
    existente.monto += currentChip;
  } else {
    // 👉 crear nueva
    bets.push({
      tipo,
      valor,
      monto: currentChip
    });
  }

  renderApuestas();
}
// =========================
// 📊 MOSTRAR APUESTAS
// =========================
function renderApuestas() {
  const cont = document.getElementById("betsList");
  if (!cont) return;

  if (bets.length === 0) {
    cont.innerHTML = "Sin apuestas";
    return;
  }

  cont.innerHTML = bets.map((b, index) => {
    let texto = "";

    if (b.tipo === "numero") {
      texto = `🎯 ${b.valor} → ${b.monto}`;
    } else {
      texto = `🎲 ${b.tipo} → ${b.monto}`;
    }

    return `
      <div class="bet-item">
        <span>${texto}</span>
        <button class="delete-bet" data-index="${index}">✖</button>
      </div>
    `;
  }).join("");

  // 👇 agregar eventos a cada botón
  document.querySelectorAll(".delete-bet").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.index);
      eliminarApuesta(i);
    });
  });
}

// =========================
// 💰 CÁLCULO DE GANANCIA
// =========================
function calcularGanancia(resultado) {
  let totalApostado = 0;
  let totalGanado = 0;

  bets.forEach(b => {
    totalApostado += b.monto;

    // 🎯 número
    if (b.tipo === "numero" && b.valor === resultado) {
      totalGanado += b.monto * 36;
    }

    // 🔴 rojo
    if (b.tipo === "rojo" && rojos.includes(resultado)) {
      totalGanado += b.monto * 2;
    }

    // ⚫ negro
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

  // 🎯 ganancia neta real
  return totalGanado;
}


function girar() {

  if (bets.length === 0) {
    alert("Hacé una apuesta primero");
    return;
  }

  const wheelInner = document.getElementById("wheel-inner");

  const ang = 360 / numeros.length;
  const vueltas = 5;

  // 🎯 elegimos número random
  const index = Math.floor(Math.random() * numeros.length);

  // 👉 rotación hacia ese número
  const target = index * ang;

  const OFFSET = ang / 2-1;

 rotation += vueltas * 360 + (360 - target) - OFFSET;

  wheelInner.style.transform = `rotate(${rotation}deg)`;

 setTimeout(() => {

  let angle = rotation % 360;
  angle = (360 - angle) % 360;

  const realIndex = Math.floor(angle / ang);
  const numeroReal = numeros[realIndex];

  // 🎯 AGREGAR AL HISTORIAL (ESTO FALTABA)
  historial.unshift(numeroReal);

  // limitar historial
  if (historial.length > 12) {
    historial.pop();
  }

  // guardar en localStorage
  localStorage.setItem("historialRuleta", JSON.stringify(historial));

  // renderizar
  renderHistorial();

  // 👇 mostrar resultado
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
function mostrarEstrategia(tipo) {

  const info = {

    martingale: `

      <h3>🎯 Martingale</h3>

      <strong>¿Cómo funciona?</strong>

      <p>
        Duplicás la apuesta cada vez que perdés hasta recuperar todo.
      </p>

      <strong>Regla</strong>

      <ul>
        <li>Perdés → duplicás</li>
        <li>Ganás → volvés al monto inicial</li>
      </ul>

      <div class="strategy-example">

        <strong>Ejemplo</strong>

        <ul>
          <li><code>100</code> → perdés</li>
          <li><code>200</code> → perdés</li>
          <li><code>400</code> → ganás</li>
        </ul>

      </div>

      <strong>Ventajas</strong>

      <ul>
        <li>Simple de entender</li>
        <li>Recuperación rápida</li>
      </ul>

      <strong>Riesgos</strong>

      <ul>
        <li>Consume mucho saldo</li>
        <li>Las malas rachas son peligrosas</li>
      </ul>

    `,

    dalembert: `

      <h3>📊 D’Alembert</h3>

      <strong>¿Cómo funciona?</strong>

      <p>
        Subís una unidad al perder y bajás una al ganar.
      </p>

      <strong>Regla</strong>

      <ul>
        <li>Perdés → +1 unidad</li>
        <li>Ganás → -1 unidad</li>
      </ul>

      <div class="strategy-example">

        <strong>Ejemplo</strong>

        <ul>
          <li><code>100</code> → perdés → <code>200</code></li>
          <li><code>200</code> → ganás → <code>100</code></li>
        </ul>

      </div>

      <strong>Ventajas</strong>

      <ul>
        <li>Más estable que Martingale</li>
        <li>Menor exposición</li>
      </ul>

      <strong>Riesgos</strong>

      <ul>
        <li>Recupera pérdidas lentamente</li>
      </ul>

    `,

    fibonacci: `

      <h3>🔢 Fibonacci</h3>

      <strong>¿Cómo funciona?</strong>

      <p>
        Usás la secuencia:
        <code>1,1,2,3,5,8...</code>
      </p>

      <strong>Regla</strong>

      <ul>
        <li>Perdés → avanzás en la secuencia</li>
        <li>Ganás → retrocedés 2 pasos</li>
      </ul>

      <div class="strategy-example">

        <strong>Ejemplo</strong>

        <ul>
          <li><code>100</code> → perdés → <code>100</code></li>
          <li><code>100</code> → perdés → <code>200</code></li>
          <li><code>200</code> → ganás → volvés atrás</li>
        </ul>

      </div>

      <strong>Ventajas</strong>

      <ul>
        <li>Menos agresiva que Martingale</li>
      </ul>

      <strong>Riesgos</strong>

      <ul>
        <li>Puede crecer rápido igual</li>
      </ul>

    `,

    labouchere: `

      <h3>🧠 Labouchere</h3>

      <strong>¿Cómo funciona?</strong>

      <p>
        Creás una secuencia numérica y apostás la suma
        del primer y último número.
      </p>

      <strong>Regla</strong>

      <ul>
        <li>Ganás → tachás extremos</li>
        <li>Perdés → agregás monto al final</li>
      </ul>

      <div class="strategy-example">

        <strong>Ejemplo</strong>

        <ul>
          <li>Lista: <code>1-2-3-4</code></li>
          <li>Apuesta: <code>1 + 4 = 5</code></li>
        </ul>

      </div>

      <strong>Ventajas</strong>

      <ul>
        <li>Estructurada y flexible</li>
      </ul>

      <strong>Riesgos</strong>

      <ul>
        <li>Las rachas largas destruyen la secuencia</li>
      </ul>

    `,

    reverseMartingale: `

      <h3>🔥 Reverse Martingale</h3>

      <strong>¿Cómo funciona?</strong>

      <p>
        Duplicás solo cuando ganás.
      </p>

      <strong>Regla</strong>

      <ul>
        <li>Ganás → duplicás</li>
        <li>Perdés → volvés al inicio</li>
      </ul>

      <div class="strategy-example">

        <strong>Ejemplo</strong>

        <ul>
          <li><code>100</code> → ganás → <code>200</code></li>
          <li><code>200</code> → ganás → <code>400</code></li>
        </ul>

      </div>

      <strong>Ventajas</strong>

      <ul>
        <li>Aprovecha rachas positivas</li>
      </ul>

      <strong>Riesgos</strong>

      <ul>
        <li>Podés perder ganancias rápido</li>
      </ul>

    `,

    flat: `

      <h3>🟢 Apuesta plana</h3>

      <strong>¿Cómo funciona?</strong>

      <p>
        Apostás siempre la misma cantidad.
      </p>

      <strong>Regla</strong>

      <ul>
        <li>Mismo monto siempre</li>
        <li>Sin progresiones</li>
      </ul>

      <div class="strategy-example">

        <strong>Ejemplo</strong>

        <ul>
          <li><code>100</code> → siempre <code>100</code></li>
        </ul>

      </div>

      <strong>Ventajas</strong>

      <ul>
        <li>Muy segura</li>
        <li>Control del bankroll</li>
      </ul>

      <strong>Riesgos</strong>

      <ul>
        <li>Ganancias lentas</li>
      </ul>

    `,

    paroli: `

      <h3>⚡ Paroli</h3>

      <strong>¿Cómo funciona?</strong>

      <p>
        Aumentás apuesta solo cuando ganás.
      </p>

      <strong>Regla</strong>

      <ul>
        <li>Ganás → subís apuesta</li>
        <li>Perdés → reiniciás</li>
      </ul>

      <div class="strategy-example">

        <strong>Ejemplo</strong>

        <ul>
          <li><code>100</code> → <code>200</code></li>
          <li><code>200</code> → <code>400</code></li>
        </ul>

      </div>

      <strong>Ventajas</strong>

      <ul>
        <li>Protege tu saldo</li>
      </ul>

      <strong>Riesgos</strong>

      <ul>
        <li>Las rachas pueden terminar rápido</li>
      </ul>

    `,

    sector: `

      <h3>🎯 Estrategia de sectores</h3>

      <strong>¿Cómo funciona?</strong>

      <p>
        Apostás grupos cercanos dentro de la rueda.
      </p>

      <strong>Regla</strong>

      <ul>
        <li>Cubrís zonas específicas</li>
        <li>Buscás repeticiones regionales</li>
      </ul>

      <div class="strategy-example">

        <strong>Ejemplo</strong>

        <ul>
          <li>Zona <code>17-20</code></li>
          <li>Zona <code>26-32</code></li>
        </ul>

      </div>

      <strong>Ventajas</strong>

      <ul>
        <li>Cubre múltiples números</li>
      </ul>

      <strong>Riesgos</strong>

      <ul>
        <li>No asegura resultados</li>
      </ul>

    `,

    contra: `

      <h3>🔄 Contra racha</h3>

      <strong>¿Cómo funciona?</strong>

      <p>
        Apostás contra la tendencia reciente.
      </p>

      <strong>Regla</strong>

      <ul>
        <li>Muchos rojos → apostás negro</li>
        <li>Muchos pares → apostás impar</li>
      </ul>

      <div class="strategy-example">

        <strong>Ejemplo</strong>

        <ul>
          <li><code>5</code> rojos seguidos → negro</li>
        </ul>

      </div>

      <strong>Ventajas</strong>

      <ul>
        <li>Busca reversión estadística</li>
      </ul>

      <strong>Riesgos</strong>

      <ul>
        <li>Las rachas pueden continuar</li>
      </ul>

    `
  };

  const panel = document.getElementById("strategyInfo");

  panel.innerHTML = info[tipo] || "<p>Sin información</p>";

  panel.classList.add("active");

  document.querySelectorAll(".strategy-card").forEach(card => {
    card.classList.remove("active");
  });

  const activeCard = document.querySelector(
  `.strategy-card[data-strategy="${tipo}"]`
 );

  if (activeCard) {
    activeCard.classList.add("active");
  }

}

  const panel = document.getElementById("strategyInfo");

  panel.innerHTML = info[tipo] || "<p>Sin información</p>";
  panel.classList.add("active");

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