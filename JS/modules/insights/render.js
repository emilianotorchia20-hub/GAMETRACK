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
            text: "Tu saldo y tu racha estan en zona roja. Conviene reducir apuesta media y cerrar sesiones antes.",
            tone: "negative"
        };
    }

    if (winrate >= 60 && total > 0) {
        return {
            title: "Aprovecha la ventaja",
            text: "El rendimiento es fuerte. Mantene el stake estable y evita subirlo por impulso.",
            tone: "positive"
        };
    }

    if (drawdown > 0) {
        return {
            title: "Controla el drawdown",
            text: "Hay retroceso desde el pico. Usa limites por sesion para proteger capital.",
            tone: "warning"
        };
    }

    return {
        title: "Base estable",
        text: "Todavia no hay una senal extrema. Segui registrando sesiones para mejorar la lectura.",
        tone: "neutral"
    };

}

function renderKpiCard({ title, value, detail, tone = "neutral", label }) {

    return `
        <article class="insight-kpi insight-kpi--${tone}">
            <span class="insight-kpi__label">${label}</span>
            <h3>${title}</h3>
            <strong>${value}</strong>
            <p>${detail}</p>
        </article>
    `;

}

function renderGameBreakdown(games) {

    const entries =
        Object.entries(games)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

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
        <section class="insight-command insight-command--${totalTone}">
            <div class="insight-command__main">
                <span class="insight-chip">Resumen inteligente</span>
                <h2>${formatearDinero(total)}</h2>
                <p>
                    Balance total en ${sesiones.length} sesiones.
                    Promedio por sesion: ${formatearDinero(average)}.
                </p>
            </div>

            <div class="insight-command__side">
                <span>Winrate</span>
                <strong>${winrate.toFixed(1)}%</strong>
                <small>${wins} ganadas / ${losses} perdidas</small>
            </div>
        </section>

        <section class="insights-panel insight-action insight-action--${recommendation.tone}">
            <span class="insight-chip">Lectura recomendada</span>
            <h3>${recommendation.title}</h3>
            <p>${recommendation.text}</p>
        </section>

        <section class="insight-kpi-grid">
            ${renderKpiCard({
                label: "Tendencia",
                title: "Semana actual",
                value: `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`,
                detail: `Esta semana: ${formatearDinero(currentWeekTotal)}`,
                tone: getTone(trend)
            })}

            ${renderKpiCard({
                label: "Pico",
                title: "Mejor sesion",
                value: formatearDinero(bestSession),
                detail: "Record individual registrado",
                tone: getTone(bestSession)
            })}

            ${renderKpiCard({
                label: "Riesgo",
                title: "Peor sesion",
                value: formatearDinero(worstSession),
                detail: `Drawdown max: ${formatearDinero(drawdown)}`,
                tone: getTone(worstSession)
            })}

            ${renderKpiCard({
                label: "Racha",
                title: "Estado actual",
                value: getStreakText(streak),
                detail: "Sesiones consecutivas",
                tone: getTone(streak)
            })}
        </section>

        <section class="insights-panel game-breakdown">
            <div class="insights-panel__header">
                <div>
                    <span class="insight-chip">Mapa de juegos</span>
                    <h3>Rentabilidad por juego</h3>
                </div>
                <strong>${escapeInsightText(topGame?.[0] || "Sin juego")}</strong>
            </div>

            <div class="game-breakdown__list">
                ${renderGameBreakdown(games)}
            </div>
        </section>

        <section class="insight-mini-grid">
            <article>
                <span>Total sesiones</span>
                <strong>${sesiones.length}</strong>
            </article>
            <article>
                <span>EV promedio</span>
                <strong>${formatearDinero(average)}</strong>
            </article>
            <article>
                <span>Esta semana</span>
                <strong>${formatearDinero(currentWeekTotal)}</strong>
            </article>
            <article>
                <span>Juego top</span>
                <strong>${escapeInsightText(topGame?.[0] || "Sin juego")}</strong>
            </article>
        </section>
    `;

}

