function mostrarBankroll() {

    const display =
        document.getElementById("bankroll");

    if (!display) return;

    const bankroll =
        obtenerBankroll();

    const fullValue =
        formatearDinero(bankroll);

    display.textContent =
        display.dataset.format === "compact"
        ? formatearDineroCompacto(bankroll)
        : fullValue;

    display.title =
        fullValue;

    const fullValueDisplay =
        document.getElementById("bankrollFullValue");

    if (fullValueDisplay) {
        fullValueDisplay.textContent =
            fullValue;
    }

}

function formatearDineroCompacto(valor) {

    return valor.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        notation: "compact",
        compactDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });

}

// ==========================
// 🗑 RESET
// ==========================
function resetearDatos() {

    const btn =
        document.getElementById("reset");

    if (!btn) return;

    btn.addEventListener("click", async () => {

        const confirmed =
            await window.gameTrackConfirm?.(
                "Seguro que queres borrar todo?",
                {
                    title: "Reiniciar datos",
                    confirmText: "Resetear",
                    danger: true
                }
            );

        if (!confirmed) return;

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

    btn.addEventListener("click", async () => {

        const confirmar =
            await window.gameTrackConfirm?.(
                "Seguro que queres borrar TODAS las sesiones?",
                {
                    title: "Borrar sesiones",
                    confirmText: "Borrar",
                    danger: true
                }
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
