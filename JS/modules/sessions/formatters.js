function formatearDinero(valor) {

    return valor.toLocaleString("es-AR", {

        style: "currency",

        currency: "ARS",

        minimumFractionDigits: 0,

        maximumFractionDigits: 0

    });

}

// ==========================
// 📅 FECHA
// ==========================
function formatearFecha(fechaISO) {

    const fecha =
        new Date(fechaISO);

    return fecha.toLocaleDateString(
        "es-AR",
        {

            day: "2-digit",

            month: "2-digit",

            year: "numeric"

        }
    );

}

function formatearHora(fechaISO) {

    const fecha =
        new Date(fechaISO);

    return fecha.toLocaleTimeString(
        "es-AR",
        {

            hour: "2-digit",

            minute: "2-digit"

        }
    );

}

// ==========================
// 💾 GUARDAR SESIÓN
// ==========================
