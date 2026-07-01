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
