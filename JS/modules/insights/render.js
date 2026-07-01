function getSessionResult(session) {

    return Number(
        session.resultado ??
        (session.final - session.inicial) ??
        0
    );

}

function getTone(value) {

    if (value > 0) return "positive";
    if (value < 0) return "negative";
    return "neutral";

}

function escapeInsightText(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function getStreak(sessions) {

    let streak = 0;

    for (let i = sessions.length - 1; i >= 0; i--) {
        const result =
            getSessionResult(sessions[i]);

        if (result > 0) {
            if (streak >= 0) streak++;
            else break;
        } else if (result < 0) {
            if (streak <= 0) streak--;
            else break;
        } else {
            break;
        }
    }

    return streak;

}

function getStreakText(streak) {

    if (streak > 0) return `${streak} ganadas`;
    if (streak < 0) return `${Math.abs(streak)} perdidas`;
    return "Sin racha";

}

function getRecommendation({ total, winrate, streak, drawdown }) {

    if (total < 0 && streak < 0) {
        return {
            title: "Baja el ritmo",
            text: "Balance y racha estan en rojo. Reducir exposicion y cerrar antes puede proteger capital.",
            tone: "negative"
        };
    }

    if (winrate >= 60 && total > 0) {
        return {
            title: "Ventaja activa",
            text: "El rendimiento es fuerte. Mantene stake estable y evita subir por impulso.",
            tone: "positive"
        };
    }

    if (drawdown > 0) {
        return {
            title: "Riesgo bajo observacion",
            text: "Hay retroceso desde el pico. Revisar limites por sesion puede mejorar control.",
            tone: "warning"
        };
    }

    return {
        title: "Lectura estable",
        text: "No hay una senal extrema. Segui registrando sesiones para mejorar la muestra.",
        tone: "neutral"
    };

}

function renderMetricRow({ label, value, detail, tone = "neutral" }) {

    return `
        <div class="insight-metric-row">
            <span>${label}</span>
            <strong class="${tone}">${value}</strong>
            <em>${detail}</em>
        </div>
    `;

}

function renderGameBreakdown(games) {

    const entries =
        Object.entries(games)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);

    if (entries.length === 0) {
        return `
            <p class="insight-empty-line">
                No hay juegos suficientes para comparar.
            </p>
        `;
    }

    const maxAbs =
        Math.max(
            ...entries.map(([, value]) => Math.abs(value)),
            1
        );

    return entries.map(([game, value]) => {
        const percent =
            Math.max(8, Math.abs(value) / maxAbs * 100);

        return `
            <div class="game-breakdown__row">
                <div class="game-breakdown__top">
                    <span>${escapeInsightText(game)}</span>
                    <strong class="${getTone(value)}">
                        ${formatearDinero(value)}
                    </strong>
                </div>
                <div class="game-breakdown__track">
                    <span
                        class="${getTone(value)}"
                        style="width:${percent.toFixed(1)}%"
                    ></span>
                </div>
            </div>
        `;
    }).join("");

}

function renderRecentSessions(sessions) {

    return [...sessions]
        .reverse()
        .slice(0, 6)
        .map(session => {
            const result =
                getSessionResult(session);

            const date =
                session.date
                ? new Date(session.date).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "2-digit"
                })
                : "Sin fecha";

            return `
                <div class="insight-session-row">
                    <span>${date}</span>
                    <strong>${escapeInsightText(session.game || "Juego")}</strong>
                    <em class="${getTone(result)}">${formatearDinero(result)}</em>
                </div>
            `;
        }).join("");

}

function mostrarInsights() {

    const contenedor =
        document.getElementById("insights");

    if (!contenedor) return;

    const sesiones =
        JSON.parse(
            localStorage.getItem("sessions")
        ) || [];

    if (sesiones.length === 0) {
        contenedor.innerHTML = `
            <section class="insights-empty">
                <span>Analytics</span>
                <h2>Todavia no hay datos para analizar</h2>
                <p>
                    Registra algunas sesiones y este panel va a detectar
                    tendencias, rachas, juego top y oportunidades de control.
                </p>
            </section>
        `;
        return;
    }

    const now =
        new Date();

    const sevenDaysAgo =
        new Date();

    sevenDaysAgo.setDate(now.getDate() - 7);

    const fourteenDaysAgo =
        new Date();

    fourteenDaysAgo.setDate(now.getDate() - 14);

    const currentWeek =
        sesiones.filter(session => {
            if (!session.date) return false;
            return new Date(session.date) >= sevenDaysAgo;
        });

    const previousWeek =
        sesiones.filter(session => {
            if (!session.date) return false;
            const date = new Date(session.date);
            return date >= fourteenDaysAgo && date < sevenDaysAgo;
        });

    const total =
        sesiones.reduce(
            (sum, session) => sum + getSessionResult(session),
            0
        );

    const currentWeekTotal =
        currentWeek.reduce(
            (sum, session) => sum + getSessionResult(session),
            0
        );

    const previousWeekTotal =
        previousWeek.reduce(
            (sum, session) => sum + getSessionResult(session),
            0
        );

    const trend =
        previousWeekTotal !== 0
        ? ((currentWeekTotal - previousWeekTotal) / Math.abs(previousWeekTotal)) * 100
        : currentWeekTotal === 0
        ? 0
        : 100;

    const results =
        sesiones.map(getSessionResult);

    const wins =
        results.filter(result => result > 0).length;

    const losses =
        results.filter(result => result < 0).length;

    const winrate =
        (wins / sesiones.length) * 100;

    const bestSession =
        Math.max(...results);

    const worstSession =
        Math.min(...results);

    const average =
        total / sesiones.length;

    const streak =
        getStreak(sesiones);

    let equity = 0;
    let peak = 0;
    let drawdown = 0;

    const games = {};

    sesiones.forEach(session => {
        const result =
            getSessionResult(session);

        equity += result;

        if (equity > peak) peak = equity;

        drawdown =
            Math.max(drawdown, peak - equity);

        const game =
            session.game || "Sin juego";

        games[game] =
            (games[game] || 0) + result;
    });

    const topGame =
        Object.entries(games)
            .sort((a, b) => b[1] - a[1])[0];

    const recommendation =
        getRecommendation({
            total,
            winrate,
            streak,
            drawdown
        });

    const totalTone =
        getTone(total);

    contenedor.innerHTML = `
        <section class="insight-terminal insight-terminal--${totalTone}">
            <div class="insight-terminal__header">
                <span>Panel de datos</span>
                <strong>${sesiones.length} sesiones analizadas</strong>
            </div>

            <div class="insight-terminal__body">
                <div>
                    <span class="insight-terminal__label">Balance acumulado</span>
                    <h2 class="${totalTone}">${formatearDinero(total)}</h2>
                    <p>
                        Promedio por sesion:
                        <strong>${formatearDinero(average)}</strong>
                    </p>
                </div>

                <div class="insight-terminal__signal insight-terminal__signal--${recommendation.tone}">
                    <span>Lectura</span>
                    <strong>${recommendation.title}</strong>
                    <p>${recommendation.text}</p>
                </div>
            </div>
        </section>

        <section class="insight-data-panel">
            <div class="insight-panel-heading">
                <span>Indicadores clave</span>
                <strong>${topGame ? escapeInsightText(topGame[0]) : "Sin juego"} lidera el rendimiento</strong>
            </div>

            <div class="insight-metrics-table">
                ${renderMetricRow({
                    label: "Tendencia semanal",
                    value: `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`,
                    detail: `Semana actual ${formatearDinero(currentWeekTotal)}`,
                    tone: getTone(trend)
                })}

                ${renderMetricRow({
                    label: "Winrate",
                    value: `${winrate.toFixed(1)}%`,
                    detail: `${wins} ganadas / ${losses} perdidas`,
                    tone: getTone(winrate - 50)
                })}

                ${renderMetricRow({
                    label: "Mejor sesion",
                    value: formatearDinero(bestSession),
                    detail: "Pico individual",
                    tone: getTone(bestSession)
                })}

                ${renderMetricRow({
                    label: "Peor sesion",
                    value: formatearDinero(worstSession),
                    detail: `Drawdown max ${formatearDinero(drawdown)}`,
                    tone: getTone(worstSession)
                })}

                ${renderMetricRow({
                    label: "Racha actual",
                    value: getStreakText(streak),
                    detail: "Ultimas sesiones consecutivas",
                    tone: getTone(streak)
                })}
            </div>
        </section>

        <section class="insight-split-panel">
            <div class="insight-data-panel game-breakdown">
                <div class="insight-panel-heading">
                    <span>Rentabilidad por juego</span>
                    <strong>Top ${Math.min(Object.keys(games).length, 6)}</strong>
                </div>

                <div class="game-breakdown__list">
                    ${renderGameBreakdown(games)}
                </div>
            </div>

            <div class="insight-data-panel insight-session-log">
                <div class="insight-panel-heading">
                    <span>Ultimos movimientos</span>
                    <strong>Recientes</strong>
                </div>

                <div class="insight-session-table">
                    <div class="insight-session-row head">
                        <span>Fecha</span>
                        <strong>Juego</strong>
                        <em>Resultado</em>
                    </div>
                    ${renderRecentSessions(sesiones)}
                </div>
            </div>
        </section>
    `;

}

