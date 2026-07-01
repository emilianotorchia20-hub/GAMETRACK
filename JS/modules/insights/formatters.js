// ==========================
// 💰 FORMATEAR DINERO
// ==========================
function formatearDinero(valor) {

    return valor.toLocaleString("es-AR", {

        style: "currency",

        currency: "ARS",

        minimumFractionDigits: 0,

        maximumFractionDigits: 0

    });

}

// ==========================
// 🧠 INSIGHTS
// ==========================
