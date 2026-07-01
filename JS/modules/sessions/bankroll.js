function mostrarBankroll() {

    const display =
        document.getElementById("bankroll");

    if (!display) return;

    display.textContent =
        formatearDinero(
            obtenerBankroll()
        );

}

// ==========================
// 🗑 RESET
// ==========================
function resetearDatos() {

    const btn =
        document.getElementById("reset");

    if (!btn) return;

    btn.addEventListener("click", () => {

        if (
            !confirm(
                "¿Seguro que querés borrar todo?"
            )
        ) return;

        localStorage.removeItem("sessions");

        location.reload();

    });

}

// ==========================
// 💰 OBTENER BANKROLL
// ==========================
function obtenerBankroll() {

    const sesiones =
        JSON.parse(
            localStorage.getItem("sessions")
        ) || [];

    return sesiones.reduce((acc, s) => {

        const r =
            s.resultado ??
            (s.final - s.inicial) ??
            0;

        return acc + Number(r);

    }, 0);

}

// ==========================
// 🗑 BORRAR TODO
// ==========================
function borrarTodo() {

    const btn =
        document.getElementById("deleteAll");

    if (!btn) return;

    btn.addEventListener("click", () => {

        const confirmar =
            confirm(
                "¿Seguro que querés borrar TODAS las sesiones?"
            );

        if (!confirmar) return;

        localStorage.removeItem("sessions");

        mostrarHistorial();

        mostrarEstadisticas();

        mostrarBankroll();

    });

}

// ==========================
// 🚀 INIT
// ==========================
