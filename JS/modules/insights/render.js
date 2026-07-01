function mostrarInsights() {

    const contenedor =
        document.getElementById("insights");

    if (!contenedor) return;

    const sesiones =
        JSON.parse(
            localStorage.getItem("sessions")
        ) || [];

    // 🚫 sin sesiones
    if (sesiones.length === 0) {

        contenedor.innerHTML = `

            <div class="stat-card">

                <p class="stat-title">
                    Sin datos
                </p>

                <p class="stat-value">
                    😴
                </p>

                <p style="opacity:0.7;">

                    Todavía no hay
                    sesiones registradas.

                </p>

            </div>

        `;

        return;

    }

    // ==========================
    // 📅 FECHAS
    // ==========================
    const ahora =
        new Date();

    const hace7Dias =
        new Date();

    hace7Dias.setDate(
        ahora.getDate() - 7
    );

    const hace14Dias =
        new Date();

    hace14Dias.setDate(
        ahora.getDate() - 14
    );

    // ==========================
    // 📈 SEMANA ACTUAL
    // ==========================
    const semanaActual =
        sesiones.filter(s => {

            if (!s.date) return false;

            const fecha =
                new Date(s.date);

            return fecha >= hace7Dias;

        });

    // ==========================
    // 📉 SEMANA ANTERIOR
    // ==========================
    const semanaAnterior =
        sesiones.filter(s => {

            if (!s.date) return false;

            const fecha =
                new Date(s.date);

            return (
                fecha >= hace14Dias &&
                fecha < hace7Dias
            );

        });

    // ==========================
    // 💰 TOTAL ACTUAL
    // ==========================
    const totalActual =
        semanaActual.reduce((acc, s) => {

            return acc + Number(
                s.resultado ?? 0
            );

        }, 0);

    // ==========================
    // 💰 TOTAL ANTERIOR
    // ==========================
    const totalAnterior =
        semanaAnterior.reduce((acc, s) => {

            return acc + Number(
                s.resultado ?? 0
            );

        }, 0);

    // ==========================
    // 📈 TENDENCIA
    // ==========================
    let tendencia = 0;

    if (totalAnterior !== 0) {

        tendencia =
            (
                (
                    totalActual -
                    totalAnterior
                ) / Math.abs(totalAnterior)
            ) * 100;

    }

    const positiva =
        tendencia >= 0;

    const colorTendencia =
        positiva
        ? "#22c55e"
        : "#ef4444";

    // ==========================
    // 🏆 MEJOR SESIÓN
    // ==========================
    let mejorSesion =
        Math.max(
            ...sesiones.map(
                s => s.resultado ?? 0
            )
        );

    // ==========================
    // 📉 PEOR SESIÓN
    // ==========================
    let peorSesion =
        Math.min(
            ...sesiones.map(
                s => s.resultado ?? 0
            )
        );

    // ==========================
    // 🎯 WINRATE
    // ==========================
    const ganadas =
        sesiones.filter(
            s => (s.resultado ?? 0) > 0
        ).length;

    const winrate =
        (
            ganadas /
            sesiones.length
        ) * 100;

    // ==========================
    // 🔥 RACHA ACTUAL
    // ==========================
    let racha = 0;

    for (
        let i = sesiones.length - 1;
        i >= 0;
        i--
    ) {

        const r =
            sesiones[i].resultado ?? 0;

        if (r > 0) {

            if (racha >= 0)
                racha++;

            else break;

        }

        else if (r < 0) {

            if (racha <= 0)
                racha--;

            else break;

        }

    }

    // ==========================
    // 🎮 JUEGO MÁS RENTABLE
    // ==========================
    const juegos = {};

    sesiones.forEach(s => {

        if (!juegos[s.game]) {

            juegos[s.game] = 0;

        }

        juegos[s.game] +=
            s.resultado ?? 0;

    });

    let mejorJuego =
        Object.keys(juegos)[0];

    Object.keys(juegos).forEach(juego => {

        if (
            juegos[juego] >
            juegos[mejorJuego]
        ) {

            mejorJuego = juego;

        }

    });

    // ==========================
    // 🎨 RENDER
    // ==========================
    contenedor.innerHTML = `

        <div class="stat-card">

            <p class="stat-title">
                📈 Tendencia semanal
            </p>

            <p
                class="stat-value"
                style="color:${colorTendencia}"
            >

                ${
                    positiva
                    ? "↑"
                    : "↓"
                }

                ${Math.abs(
                    tendencia
                ).toFixed(1)}%

            </p>

            <p class="stat-description">

                ${
                    positiva
                    ? "Ganaste más"
                    : "Ganaste menos"
                }

                que la semana pasada

            </p>

        </div>

        <div class="stat-card">

            <p class="stat-title">
                💰 Esta semana
            </p>

            <p class="stat-value">

                ${formatearDinero(
                    totalActual
                )}

            </p>

            <p class="stat-description">

                Profit semanal

            </p>

        </div>

        <div class="stat-card">

            <p class="stat-title">
                🏆 Mejor sesión
            </p>

            <p class="stat-value">

                ${formatearDinero(
                    mejorSesion
                )}

            </p>

            <p class="stat-description">

                Récord histórico

            </p>

        </div>

        <div class="stat-card">

            <p class="stat-title">
                📉 Peor sesión
            </p>

            <p class="stat-value">

                ${formatearDinero(
                    peorSesion
                )}

            </p>

            <p class="stat-description">

                Mayor pérdida

            </p>

        </div>

        <div class="stat-card">

            <p class="stat-title">
                🎯 Winrate
            </p>

            <p class="stat-value">

                ${winrate.toFixed(1)}%

            </p>

            <p class="stat-description">

                Sesiones ganadas

            </p>

        </div>

        <div class="stat-card">

            <p class="stat-title">
                🔥 Racha actual
            </p>

            <p class="stat-value">

                ${racha}

            </p>

            <p class="stat-description">

                Sesiones consecutivas

            </p>

        </div>

        <div class="stat-card">

            <p class="stat-title">
                🎮 Juego top
            </p>

            <p class="stat-value">

                ${mejorJuego}

            </p>

            <p class="stat-description">

                Más rentable

            </p>

        </div>

        <div class="stat-card">

            <p class="stat-title">
                📚 Total sesiones
            </p>

            <p class="stat-value">

                ${sesiones.length}

            </p>

            <p class="stat-description">

                Registradas

            </p>

        </div>

    `;

}

// ==========================
// 🚀 INIT
// ==========================
