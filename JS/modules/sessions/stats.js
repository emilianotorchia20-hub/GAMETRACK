function getNivel(roi, pf) {

    if (pf === Infinity)
        return "🟢 Perfecto";

    if (roi > 10 && pf > 1.5)
        return "🟢 Rentable";

    if (roi > 0)
        return "🟡 Aceptable";

    return "🔴 Perdedor";

}

// ==========================
// 📊 CHART
// ==========================
function renderChart(data) {

    const canvas =
        document.getElementById(
            "bankrollChart"
        );

    if (!canvas) return;

    const ctx =
        canvas.getContext("2d");

    if (window.chart)
        window.chart.destroy();

    window.chart = new Chart(ctx, {

        type: "line",

        data: {

            labels:
                data.map((_, i) => i + 1),

            datasets: [{

                data,

                tension: 0.3,

                borderWidth: 2

            }]

        },

        options: {

            plugins: {

                legend: {

                    display: false

                }

            },

            scales: {

                x: {

                    display: false

                }

            }

        }

    });

}

// ==========================
// 📈 ESTADÍSTICAS
// ==========================
function mostrarEstadisticas() {

    const contenedor =
        document.getElementById("stats");

    if (!contenedor) return;

    const sesiones =
        JSON.parse(
            localStorage.getItem("sessions")
        ) || [];

    let total = 0;
    let totalInicial = 0;

    let ganadas = 0;
    let perdidas = 0;

    let mejor = -Infinity;
    let peor = Infinity;

    let mejorRacha = 0;
    let peorRacha = 0;

    let rachaActual = 0;

    let rachaGanadora = 0;
    let rachaPerdedora = 0;

    let gananciasTotales = 0;
    let perdidasTotales = 0;

    let equity = 0;
    let maxEquity = 0;

    let drawdownMax = 0;

    let equityHistory = [];

    sesiones.forEach(s => {

        const resultado =
            s.resultado ??
            (s.final - s.inicial);

        total += resultado;

        totalInicial += s.inicial;

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

            if (
                rachaGanadora >
                mejorRacha
            ) {

                mejorRacha =
                    rachaGanadora;

            }

        }

        else if (resultado < 0) {

            perdidas++;

            perdidasTotales +=
                Math.abs(resultado);

            rachaPerdedora++;

            rachaGanadora = 0;

            if (
                rachaPerdedora >
                peorRacha
            ) {

                peorRacha =
                    rachaPerdedora;

            }

        }

        else {

            rachaGanadora = 0;
            rachaPerdedora = 0;

        }

        if (resultado > mejor)
            mejor = resultado;

        if (resultado < peor)
            peor = resultado;

    });

    rachaActual =
        rachaGanadora > 0
        ? rachaGanadora
        : -rachaPerdedora;

    const promedio =
        sesiones.length
        ? total / sesiones.length
        : 0;

    const porcentaje =
        sesiones.length
        ? (ganadas / sesiones.length) * 100
        : 0;

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

    const colorTotal =
        total >= 0
        ? "#22c55e"
        : "#ef4444";

    const colorROI =
        roi >= 0
        ? "#22c55e"
        : "#ef4444";

    if (equityHistory.length === 0) {

        equityHistory = [0];

    }

    contenedor.innerHTML = `

        <div class="chart-container">
            <canvas id="bankrollChart" height="120"></canvas>
        </div>

        <div class="stats-grid">

            <div class="stat-card">
                <p class="stat-title">Nivel</p>
                <p class="stat-value">${nivel}</p>
            </div>

            <div class="stat-card">
                <p class="stat-title">Ganancia total</p>
                <p class="stat-value" style="color:${colorTotal}">
                    ${formatearDinero(total)}
                </p>
            </div>

            <div class="stat-card">
                <p class="stat-title">EV</p>
                <p class="stat-value">${formatearDinero(promedio)}</p>
            </div>

            <div class="stat-card">
                <p class="stat-title">% ganadas</p>
                <p class="stat-value">${porcentaje.toFixed(1)}%</p>
            </div>

            <div class="stat-card">
                <p class="stat-title">ROI</p>
                <p class="stat-value" style="color:${colorROI}">
                    ${roi.toFixed(1)}%
                </p>
            </div>

        </div>
    `;

    renderChart(equityHistory);

}

// ==========================
// 💰 BANKROLL
// ==========================
