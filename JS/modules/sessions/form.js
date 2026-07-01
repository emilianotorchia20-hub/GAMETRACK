const form =
    document.getElementById("formSesion");

if (form) {

    form.addEventListener("submit", function(e) {

        e.preventDefault();

        const game =
            document.getElementById("game").value;

        const inicial =
            Number(
                document.getElementById("inicial").value
            );

        const final =
            Number(
                document.getElementById("final").value
            );

        const notes =
            document.getElementById("notes").value;

        // 🚫 inválido
        if (
            isNaN(inicial) ||
            isNaN(final)
        ) {

            alert("Ingresá valores válidos");

            return;

        }

        // 📊 resultado sesión
        const resultado =
            final - inicial;

        // 🧠 objeto sesión
        const sesion = {

            game,

            inicial,

            final,

            notes,

            date:
                new Date().toISOString(),

            resultado

        };

        // 📚 sesiones
        let sesiones =
            JSON.parse(
                localStorage.getItem("sessions")
            ) || [];

        // ➕ agregar
        sesiones.push(sesion);

        // 💾 guardar
        localStorage.setItem(
            "sessions",
            JSON.stringify(sesiones)
        );

        // 💰 bankroll
        window.checkBankrollLimit?.();

        // 📉 sesión
        window.checkSessionLimit?.(
            Number(resultado)
        );

        // ✅ OK
        Toastify({

            text: "✅ Sesión guardada",

            duration: 3000,

            gravity: "top",

            position: "right",

            stopOnFocus: true,

            style: {

                background:
                    "linear-gradient(to right, #22c55e, #16a34a)",

                borderRadius: "12px"

            }

        }).showToast();

        form.reset();

    });

}

// ==========================
// 📜 HISTORIAL
// ==========================
