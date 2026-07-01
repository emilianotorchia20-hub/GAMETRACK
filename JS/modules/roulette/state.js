
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
