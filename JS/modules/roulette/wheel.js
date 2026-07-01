function crearRueda() {
  if (!wheel) return;

  wheel.replaceChildren();
  wheel.classList.remove("settled");

  const rim = document.createElement("div");
  rim.className = "wheel-rim";

  wheelInner = document.createElement("div");
  wheelInner.className = "wheel-inner";
  wheelInner.id = "wheel-inner";

  const pockets = document.createElement("div");
  pockets.className = "roulette-pockets";
  pockets.style.background = getPocketGradient();

  const separators = document.createElement("div");
  separators.className = "roulette-separators";
  separators.style.background = getSeparatorGradient();

  const numbersLayer = document.createElement("div");
  numbersLayer.id = "numbers";
  numbersLayer.className = "roulette-numbers";

  numeros.forEach((number, index) => {
    numbersLayer.appendChild(createWheelNumber(number, index));
  });

  const innerBowl = document.createElement("div");
  innerBowl.className = "inner-bowl";

  const spindle = document.createElement("div");
  spindle.className = "roulette-spindle";

  wheelInner.append(pockets, separators, numbersLayer, innerBowl, spindle);

  ballTrack = document.createElement("div");
  ballTrack.className = "ball-track";

  ball = document.createElement("div");
  ball.className = "roulette-ball";
  ballTrack.appendChild(ball);

  const glare = document.createElement("div");
  glare.className = "wheel-glare";

  wheel.append(rim, wheelInner, ballTrack, glare);
  setWheelRotation(rotation);
  setBallAngle(ballAngle, BALL_TRACK_RADIUS);
}

function getPocketGradient() {
  return `conic-gradient(from ${-SLOT_ANGLE / 2}deg, ${
    numeros.map((number, index) => {
      const start = index * SLOT_ANGLE;
      const end = (index + 1) * SLOT_ANGLE;
      return `${getPocketColor(number)} ${start}deg ${end}deg`;
    }).join(",")
  })`;
}

function getSeparatorGradient() {
  return `repeating-conic-gradient(from ${-SLOT_ANGLE / 2}deg,
    rgba(248,214,133,.95) 0deg .5deg,
    rgba(20,12,5,.75) .5deg 1.15deg,
    transparent 1.15deg ${SLOT_ANGLE}deg
  )`;
}

function getPocketColor(number) {
  if (number === 0) {
    return "#087b50";
  }

  return rojos.includes(number)
    ? "#a91117"
    : "#111217";
}

function createWheelNumber(number, index) {
  const item = document.createElement("span");
  item.className = `wheel-number ${getNumberColorClass(number)}`;
  item.dataset.number = String(number);
  item.textContent = number;

  const angle = index * SLOT_ANGLE;
  item.style.setProperty("--number-angle", `${angle}deg`);

  return item;
}

function setWheelRotation(angle) {
  rotation = angle;
  if (wheelInner) {
    wheelInner.style.transform = `rotate(${angle}deg)`;
  }
}

function setBallAngle(angle, radius = BALL_TRACK_RADIUS) {
  ballAngle = angle;
  if (!ball) return;

  ball.style.setProperty("--ball-angle", `${angle}deg`);
  ball.style.setProperty("--ball-radius", String(radius / 100));
}

function highlightWinningPocket(number) {
  document.querySelectorAll(".wheel-number").forEach((item) => {
    item.classList.toggle("winner", Number(item.dataset.number) === number);
  });

  const pointer = document.querySelector(".pointer");
  pointer?.classList.add("settled");
  wheel?.classList.add("settled");

  window.setTimeout(() => {
    pointer?.classList.remove("settled");
  }, 1400);
}

function dibujarNumeros() {
  if (!wheelInner) crearRueda();
}

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
