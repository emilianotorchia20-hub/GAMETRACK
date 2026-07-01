const strategyGroups = [
  {
    title: "Progresivas",
    cards: [
      ["martingale", "Martingale", "Duplicar apuesta tras perder"],
      ["dalembert", "D'Alembert", "Sube y baja progresivamente"],
      ["fibonacci", "Fibonacci", "Recuperacion con secuencia"],
      ["labouchere", "Labouchere", "Sistema de cancelacion progresiva"],
      ["reverseMartingale", "Reverse Martingale", "Duplicar cuando ganas"],
    ],
  },
  {
    title: "Conservadoras",
    cards: [
      ["flat", "Apuesta plana", "Misma cantidad siempre"],
      ["paroli", "Paroli", "Aprovechar rachas ganadoras"],
    ],
  },
  {
    title: "Avanzadas",
    cards: [
      ["sector", "Estrategia de sectores", "Apostar zonas de la ruleta"],
      ["contra", "Contra racha", "Apostar contra tendencias"],
    ],
  },
];

function renderStrategyCards() {
  const container = document.getElementById("strategyCards");
  if (!container) return;

  container.replaceChildren();

  for (const group of strategyGroups) {
    const heading = document.createElement("h4");
    heading.textContent = group.title;
    container.appendChild(heading);

    for (const [id, title, description] of group.cards) {
      const card = document.createElement("div");
      card.className = "strategy-card";
      card.dataset.strategy = id;

      const cardTitle = document.createElement("h3");
      cardTitle.textContent = title;

      const text = document.createElement("p");
      text.textContent = description;

      card.append(cardTitle, text);
      container.appendChild(card);
    }
  }
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
