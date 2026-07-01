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

function renderStatCard({ title, value, detail, tone = "neutral", featured = false }) {

    return `
        <article class="stat-card stat-card--${tone} ${featured ? "is-featured" : ""}">
            <span class="stat-title">${title}</span>
            <strong class="stat-value">${value}</strong>
            ${detail ? `<span class="stat-detail">${detail}</span>` : ""}
        </article>
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

// ==========================
// CHART
// ==========================
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

// ==========================
// ESTADISTICAS
// ==========================
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

    sesiones.forEach(s => {

        const resultado =
            s.resultado ??
            (s.final - s.inicial);

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
        profitFactor === Infinity
        ? "∞"
        : profitFactor.toFixed(2);

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

        <section class="stats-grid">
            ${renderStatCard({
                title: "Nivel",
                value: nivel,
                detail: `PF ${profitText}`,
                tone: totalTone,
                featured: true
            })}

            ${renderStatCard({
                title: "Ganancia total",
                value: formatearDinero(total),
                detail: `${sesiones.length} sesiones`,
                tone: totalTone
            })}

            ${renderStatCard({
                title: "EV",
                value: formatearDinero(promedio),
                detail: "Promedio por sesion",
                tone: getMetricTone(promedio)
            })}

            ${renderStatCard({
                title: "% ganadas",
                value: `${porcentaje.toFixed(1)}%`,
                detail: `${ganadas} ganadas / ${perdidas} perdidas`,
                tone: getMetricTone(porcentaje - 50)
            })}

            ${renderStatCard({
                title: "ROI",
                value: `${roi.toFixed(1)}%`,
                detail: `Base ${formatearDinero(totalInicial)}`,
                tone: getMetricTone(roi)
            })}

            ${renderStatCard({
                title: "Mejor sesion",
                value: formatearDinero(mejor),
                detail: "Pico individual",
                tone: getMetricTone(mejor)
            })}

            ${renderStatCard({
                title: "Peor sesion",
                value: formatearDinero(peor),
                detail: "Mayor golpe",
                tone: getMetricTone(peor)
            })}

            ${renderStatCard({
                title: "Drawdown max",
                value: formatearDinero(drawdownMax),
                detail: `${drawdownPct.toFixed(1)}% desde maximo`,
                tone: drawdownMax > 0 ? "negative" : "neutral"
            })}

            ${renderStatCard({
                title: "Racha",
                value: getStreakLabel(rachaActual),
                detail: `Mejor ${mejorRacha} / peor ${peorRacha}`,
                tone: getMetricTone(rachaActual)
            })}

            ${renderStatCard({
                title: "Ratio W/L",
                value: winLossRatio.toFixed(2),
                detail: "Ganadas contra perdidas",
                tone: getMetricTone(winLossRatio - 1)
            })}
        </section>
    `;

    renderChart(equityHistory, totalTone);

}

