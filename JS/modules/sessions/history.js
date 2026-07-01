function mostrarHistorial() {

    const lista =
        document.getElementById("lista");

    if (!lista) return;

    const sesiones =
        JSON.parse(
            localStorage.getItem("sessions")
        ) || [];

    lista.innerHTML = "";

    sesiones.forEach((s, index) => {

        const resultado =
            s.resultado ??
            (s.final - s.inicial);

        const clase =
            resultado >= 0
            ? "ganancia"
            : "perdida";

        const div =
            document.createElement("div");

        div.className = "stat-card";

        div.innerHTML = `

            <p style="
                opacity:0.6;
                font-size:0.9rem;
                margin-bottom:10px;
            ">

                📅 ${
                    s.date
                    ? formatearFecha(s.date)
                    : "Sin fecha"
                }

                •

                ${
                    s.date
                    ? formatearHora(s.date)
                    : ""
                }

            </p>

            <p>
                <strong>${s.game}</strong>
            </p>

            <p>
                Inicial:
                ${formatearDinero(s.inicial)}
            </p>

            <p>
                Final:
                ${formatearDinero(s.final)}
            </p>

            <p class="resultado ${clase}">

                Resultado:

                ${resultado >= 0 ? "+" : ""}

                ${formatearDinero(resultado)}

            </p>

            ${s.notes
                ? `
                <p style="opacity:0.7;">
                    📝 ${s.notes}
                </p>
                `
                : ""
            }

            <button class="delete-btn">
                Eliminar
            </button>

        `;

        const btn =
            div.querySelector(".delete-btn");

        btn.addEventListener("click", () => {

            if (
                !confirm(
                    "¿Eliminar esta sesión?"
                )
            ) return;

            let sesiones =
                JSON.parse(
                    localStorage.getItem("sessions")
                ) || [];

            sesiones.splice(index, 1);

            localStorage.setItem(
                "sessions",
                JSON.stringify(sesiones)
            );

            mostrarHistorial();

            mostrarEstadisticas();

            mostrarBankroll();

        });

        lista.appendChild(div);

    });

}

// ==========================
// 🏆 NIVEL
// ==========================
