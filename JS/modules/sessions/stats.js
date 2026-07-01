function getNivel(roi, pf) {

    if (pf === Infinity)
        return "Perfecto";

    if (roi > 10 && pf > 1.5)
        return "Rentable";

    if (roi > 0)
        return "Aceptable";

    return "Perdedor";

}

function getMetricTone(value) {

    if (value > 0) return "positive";
    if (value < 0) return "negative";
    return "neutral";

}

function getStreakLabel(rachaActual) {

    if (rachaActual > 0)
        return `${rachaActual} ganadas`;

    if (rachaActual < 0)
        return `${Math.abs(rachaActual)} perdidas`;

    return "Sin racha";

}

function getProfitFactorLabel(profitFactor, gananciasTotales, perdidasTotales) {

    if (perdidasTotales === 0 && gananciasTotales > 0)
        return "Sin perdidas";

    if (perdidasTotales === 0)
        return "Sin datos";

    return profitFactor.toFixed(2);

}

function getProfitFactorSummary(profitText) {

    return profitText === "Sin perdidas" || profitText === "Sin datos"
        ? `PF ${profitText}`
        : `${profitText} PF`;

}

function renderDetailPoint(label, value) {

    return `
        <div class="stat-detail-point">
            <span>${label}</span>
            <strong>${value}</strong>
        </div>
    `;

}

function renderStatDisclosure({
    title,
    value,
    subtitle,
    tone = "neutral",
    open = false,
    explanation,
    points = []
}) {

    return `
        <details class="stat-disclosure stat-disclosure--${tone}" ${open ? "open" : ""}>
            <summary>
                <span class="stat-disclosure__title">${title}</span>
                <strong>${value}</strong>
                <em>${subtitle}</em>
            </summary>

            <div class="stat-disclosure__body">
                <p>${explanation}</p>
                <div class="stat-detail-points">
                    ${points.map(point => renderDetailPoint(point.label, point.value)).join("")}
                </div>
            </div>
        </details>
    `;

}

function renderEmptyStats(contenedor) {

    contenedor.innerHTML = `
        <section class="stats-empty">
            <span class="stats-empty__chip">GameTrack</span>
            <h2>Todavia no hay sesiones para analizar</h2>
            <p>
                Cuando guardes tus primeras sesiones, este panel va a mostrar
                tu curva de bankroll, ROI, EV, rachas y control de riesgo.
            </p>
        </section>
    `;

}

function renderChart(data, tone) {

    const canvas =
        document.getElementById(
            "bankrollChart"
        );

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    if (window.chart)
        window.chart.destroy();

    const accent =
        tone === "positive"
        ? "#22c55e"
        : tone === "negative"
        ? "#ef4444"
        : "#d4af37";

    const gradient =
        ctx.createLinearGradient(0, 0, 0, canvas.offsetHeight || 260);

    gradient.addColorStop(0, `${accent}55`);
    gradient.addColorStop(.58, `${accent}12`);
    gradient.addColorStop(1, `${accent}00`);

    window.chart = new Chart(ctx, {

        type: "line",

        data: {

            labels:
                data.map((_, i) => `Sesion ${i + 1}`),

            datasets: [{

                data,
                tension: .38,
                borderWidth: 3,
                borderColor: accent,
                backgroundColor: gradient,
                fill: true,
                pointRadius: data.length === 1 ? 5 : 3,
                pointHoverRadius: 6,
                pointBackgroundColor: "#f8fafc",
                pointBorderColor: accent,
                pointBorderWidth: 2

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {
                    displayColors: false,
                    backgroundColor: "rgba(5,5,5,.92)",
                    borderColor: "rgba(212,175,55,.22)",
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label(context) {
                            return `Bankroll: ${formatearDinero(context.parsed.y)}`;
                        }
                    }
                }

            },

            scales: {

                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "rgba(248,250,252,.42)",
                        maxRotation: 0
                    }
                },

                y: {
                    grid: {
                        color: "rgba(255,255,255,.055)",
                        drawBorder: false
                    },
                    ticks: {
                        color: "rgba(248,250,252,.5)",
                        callback(value) {
                            return formatearDinero(value);
                        }
                    }
                }

            }

        }

    });

}

function mostrarEstadisticas() {

    const contenedor =
        document.getElementById("stats");

    if (!contenedor) return;

    const sesiones =
        JSON.parse(
            localStorage.getItem("sessions")
        ) || [];

    if (sesiones.length === 0) {
        renderEmptyStats(contenedor);
        return;
    }

    let total = 0;
    let totalInicial = 0;
    let ganadas = 0;
    let perdidas = 0;
    let mejor = -Infinity;
    let peor = Infinity;
    let mejorRacha = 0;
    let peorRacha = 0;
    let rachaGanadora = 0;
    let rachaPerdedora = 0;
    let gananciasTotales = 0;
    let perdidasTotales = 0;
    let equity = 0;
    let maxEquity = 0;
    let drawdownMax = 0;

    const equityHistory = [];
    const resultados = [];

    sesiones.forEach(s => {

        const resultado =
            Number(
                s.resultado ??
                (s.final - s.inicial) ??
                0
            );

        resultados.push(resultado);
        total += resultado;
        totalInicial += Number(s.inicial) || 0;
        equity += resultado;
        equityHistory.push(equity);

        if (equity > maxEquity)
            maxEquity = equity;

        const dd =
            maxEquity - equity;

        if (dd > drawdownMax)
            drawdownMax = dd;

        if (resultado > 0) {
            ganadas++;
            gananciasTotales += resultado;
            rachaGanadora++;
            rachaPerdedora = 0;

            if (rachaGanadora > mejorRacha)
                mejorRacha = rachaGanadora;

        } else if (resultado < 0) {
            perdidas++;
            perdidasTotales += Math.abs(resultado);
            rachaPerdedora++;
            rachaGanadora = 0;

            if (rachaPerdedora > peorRacha)
                peorRacha = rachaPerdedora;

        } else {
            rachaGanadora = 0;
            rachaPerdedora = 0;
        }

        if (resultado > mejor)
            mejor = resultado;

        if (resultado < peor)
            peor = resultado;

    });

    const rachaActual =
        rachaGanadora > 0
        ? rachaGanadora
        : -rachaPerdedora;

    const promedio =
        total / sesiones.length;

    const porcentaje =
        (ganadas / sesiones.length) * 100;

    const roi =
        totalInicial
        ? (total / totalInicial) * 100
        : 0;

    const profitFactor =
        perdidasTotales === 0
        ? (gananciasTotales > 0 ? Infinity : 0)
        : gananciasTotales / perdidasTotales;

    const profitText =
        getProfitFactorLabel(
            profitFactor,
            gananciasTotales,
            perdidasTotales
        );

    const profitSummary =
        getProfitFactorSummary(profitText);

    const winLossRatio =
        perdidas
        ? ganadas / perdidas
        : ganadas;

    const drawdownPct =
        maxEquity
        ? (drawdownMax / maxEquity) * 100
        : 0;

    const nivel =
        getNivel(roi, profitFactor);

    const totalTone =
        getMetricTone(total);

    const recentResults =
        resultados.slice(-5);

    const recentAverage =
        recentResults.length
        ? recentResults.reduce((sum, value) => sum + value, 0) / recentResults.length
        : 0;

    contenedor.innerHTML = `
        <section class="stats-hero stats-hero--${totalTone}">
            <div class="stats-hero__copy">
                <span class="stats-kicker">${sesiones.length} sesiones registradas</span>
                <h2>${formatearDinero(total)}</h2>
                <p>
                    Balance acumulado con ROI ${roi.toFixed(1)}% y
                    promedio por sesion de ${formatearDinero(promedio)}.
                </p>
            </div>

            <div class="stats-hero__badges">
                <span>${nivel}</span>
                <span>${porcentaje.toFixed(1)}% ganadas</span>
            </div>
        </section>

        <section class="chart-container chart-container--${totalTone}">
            <div class="chart-header">
                <div>
                    <span class="stats-kicker">Curva de bankroll</span>
                    <h3>Evolucion por sesion</h3>
                </div>
                <span class="chart-pill">${getStreakLabel(rachaActual)}</span>
            </div>
            <div class="chart-shell">
                <canvas id="bankrollChart"></canvas>
            </div>
        </section>

        <section class="stats-data-panel">
            <div class="stats-data-panel__header">
                <div>
                    <span class="stats-kicker">Analisis desplegable</span>
                    <h3>Toca una estadistica para ver detalle</h3>
                </div>
                <strong>${profitSummary}</strong>
            </div>

            <div class="stats-disclosure-list">
                ${renderStatDisclosure({
                    title: "Nivel",
                    value: nivel,
                    subtitle: profitSummary,
                    tone: totalTone,
                    open: true,
                    explanation: "El nivel combina ROI y profit factor para dar una lectura rapida de rendimiento.",
                    points: [
                        { label: "ROI", value: `${roi.toFixed(1)}%` },
                        { label: "Profit factor", value: profitText },
                        { label: "Balance", value: formatearDinero(total) }
                    ]
                })}

                ${renderStatDisclosure({
                    title: "Ganancia total",
                    value: formatearDinero(total),
                    subtitle: `${sesiones.length} sesiones registradas`,
                    tone: totalTone,
                    explanation: "Suma neta de todos los resultados. Es la foto general de tu bankroll registrado.",
                    points: [
                        { label: "Ganancias brutas", value: formatearDinero(gananciasTotales) },
                        { label: "Perdidas brutas", value: formatearDinero(perdidasTotales) },
                        { label: "Promedio reciente", value: formatearDinero(recentAverage) }
                    ]
                })}

                ${renderStatDisclosure({
                    title: "EV promedio",
                    value: formatearDinero(promedio),
                    subtitle: "Resultado esperado por sesion",
                    tone: getMetricTone(promedio),
                    explanation: "Mide cuanto estas ganando o perdiendo en promedio cada vez que registras una sesion.",
                    points: [
                        { label: "Promedio total", value: formatearDinero(promedio) },
                        { label: "Ultimas 5 sesiones", value: formatearDinero(recentAverage) },
                        { label: "Sesiones usadas", value: String(sesiones.length) }
                    ]
                })}

                ${renderStatDisclosure({
                    title: "Winrate",
                    value: `${porcentaje.toFixed(1)}%`,
                    subtitle: `${ganadas} ganadas / ${perdidas} perdidas`,
                    tone: getMetricTone(porcentaje - 50),
                    explanation: "Indica que porcentaje de sesiones terminan positivas. No mide tamano de ganancias, solo frecuencia.",
                    points: [
                        { label: "Ganadas", value: String(ganadas) },
                        { label: "Perdidas", value: String(perdidas) },
                        { label: "Neutras", value: String(sesiones.length - ganadas - perdidas) }
                    ]
                })}

                ${renderStatDisclosure({
                    title: "ROI",
                    value: `${roi.toFixed(1)}%`,
                    subtitle: `Base registrada ${formatearDinero(totalInicial)}`,
                    tone: getMetricTone(roi),
                    explanation: "Relaciona el resultado neto contra el dinero inicial acumulado de tus sesiones.",
                    points: [
                        { label: "Resultado neto", value: formatearDinero(total) },
                        { label: "Base total", value: formatearDinero(totalInicial) },
                        { label: "ROI", value: `${roi.toFixed(1)}%` }
                    ]
                })}

                ${renderStatDisclosure({
                    title: "Mejor sesion",
                    value: formatearDinero(mejor),
                    subtitle: "Mayor pico individual",
                    tone: getMetricTone(mejor),
                    explanation: "Tu mejor resultado individual. Sirve como referencia para comparar picos contra consistencia.",
                    points: [
                        { label: "Mejor", value: formatearDinero(mejor) },
                        { label: "Promedio", value: formatearDinero(promedio) },
                        { label: "Diferencia", value: formatearDinero(mejor - promedio) }
                    ]
                })}

                ${renderStatDisclosure({
                    title: "Peor sesion",
                    value: formatearDinero(peor),
                    subtitle: "Mayor golpe individual",
                    tone: getMetricTone(peor),
                    explanation: "Tu peor resultado individual. Es una buena senal para definir limites de perdida por sesion.",
                    points: [
                        { label: "Peor", value: formatearDinero(peor) },
                        { label: "Limite sugerido", value: formatearDinero(Math.abs(peor) * .75) },
                        { label: "Impacto vs promedio", value: formatearDinero(peor - promedio) }
                    ]
                })}

                ${renderStatDisclosure({
                    title: "Drawdown maximo",
                    value: formatearDinero(drawdownMax),
                    subtitle: `${drawdownPct.toFixed(1)}% desde maximo`,
                    tone: drawdownMax > 0 ? "negative" : "neutral",
                    explanation: "Mide la caida mas grande desde un pico de equity. Ayuda a evaluar riesgo y tolerancia.",
                    points: [
                        { label: "Drawdown", value: formatearDinero(drawdownMax) },
                        { label: "Pico equity", value: formatearDinero(maxEquity) },
                        { label: "Porcentaje", value: `${drawdownPct.toFixed(1)}%` }
                    ]
                })}

                ${renderStatDisclosure({
                    title: "Racha",
                    value: getStreakLabel(rachaActual),
                    subtitle: `Mejor ${mejorRacha} / peor ${peorRacha}`,
                    tone: getMetricTone(rachaActual),
                    explanation: "La racha actual mira solo las ultimas sesiones consecutivas con el mismo signo.",
                    points: [
                        { label: "Actual", value: getStreakLabel(rachaActual) },
                        { label: "Mejor ganadora", value: String(mejorRacha) },
                        { label: "Peor perdedora", value: String(peorRacha) }
                    ]
                })}

                ${renderStatDisclosure({
                    title: "Ratio W/L",
                    value: winLossRatio.toFixed(2),
                    subtitle: "Ganadas contra perdidas",
                    tone: getMetricTone(winLossRatio - 1),
                    explanation: "Compara cantidad de sesiones ganadas contra perdidas. Complementa al winrate.",
                    points: [
                        { label: "Ratio", value: winLossRatio.toFixed(2) },
                        { label: "Ganadas", value: String(ganadas) },
                        { label: "Perdidas", value: String(perdidas) }
                    ]
                })}
            </div>
        </section>
    `;

    renderChart(equityHistory, totalTone);

}
