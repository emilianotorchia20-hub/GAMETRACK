
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

const SLOT_COUNT = numeros.length;
const SLOT_ANGLE = 360 / SLOT_COUNT;
const POINTER_ANGLE = 0;
const SPIN_DURATION_MS = 7600;
const REDUCED_MOTION_DURATION_MS = 900;
const BALL_TRACK_RADIUS = 46;
const BALL_POCKET_RADIUS = 38;

function getColor(n) {
  if (n === 0) return "#047857";
  return rojos.includes(n) ? "#a91117" : "#111217";
}

function getNumberColorClass(n) {
  if (n === 0) return "green";
  return rojos.includes(n) ? "red" : "black";
}

function getNumberIndex(number) {
  return numeros.indexOf(Number(number));
}

function getNumberAngle(number) {
  const index = getNumberIndex(number);
  return index < 0 ? 0 : index * SLOT_ANGLE;
}

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function getFinalWheelRotation(targetNumber) {
  const targetAngle = getNumberAngle(targetNumber);
  const alignedAngle = normalizeAngle(POINTER_ANGLE - targetAngle);
  let finalRotation = alignedAngle + 8 * 360;

  while (finalRotation <= rotation + 5 * 360) {
    finalRotation += 360;
  }

  return finalRotation;
}

function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

function easeOutBackSoft(t) {
  const c1 = 1.25;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

// =========================
//
// =========================
let wheel, wheelInner, ballTrack, ball, result;
let rotation = 0;
let ballAngle = 0;
let isSpinning = false;
let activeWinningNumber = null;
let historial = JSON.parse(localStorage.getItem("historialRuleta")) || [];
let currentChip = 100;
let bets = [];
let saldoFichas = Number(localStorage.getItem("saldoFichas")) || 1000;
// =========================
//
// =========================
