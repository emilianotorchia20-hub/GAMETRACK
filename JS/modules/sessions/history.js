function escapeSessionText(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function getSessionTone(resultado) {

    if (resultado > 0) return "profit";
    if (resultado < 0) return "loss";
    return "even";

}

function getSessionStatus(resultado) {

    if (resultado > 0) return "Ganancia";
    if (resultado < 0) return "Perdida";
    return "Sin cambio";

}

function renderSessionNote(notes) {

    if (!notes) return "";

    return `
        <div class="session-card__note">
            <span>Nota</span>
            <p>${escapeSessionText(notes)}</p>
        </div>
    `;

}

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

        const tone =
            getSessionTone(resultado);

        const clase =
            tone === "profit"
            ? "ganancia"
            : tone === "loss"
            ? "perdida"
            : "neutral";

        const dateLabel =
            s.date
            ? formatearFecha(s.date)
            : "Sin fecha";

        const timeLabel =
            s.date
            ? formatearHora(s.date)
            : "";

        const div =
            document.createElement("div");

        div.className =
            `stat-card session-card is-${tone}`;

        div.innerHTML = `

            <div class="session-card__topline">
                <span class="session-card__date">${dateLabel}</span>
                ${
                    timeLabel
                    ? `<span class="session-card__dot"></span>
                       <span>${timeLabel}</span>`
                    : ""
                }
            </div>

            <div class="session-card__header">
                <div>
                    <span class="session-card__eyebrow">Sesion</span>
                    <h2 class="session-card__game">
                        ${escapeSessionText(s.game)}
                    </h2>
                </div>

                <span class="session-card__status">
                    ${getSessionStatus(resultado)}
                </span>
            </div>

            <div class="session-card__metrics">
                <div class="session-card__metric">
                    <span class="session-card__label">Inicial</span>
                    <strong class="session-card__value">
                        ${formatearDinero(s.inicial)}
                    </strong>
                </div>

                <div class="session-card__metric">
                    <span class="session-card__label">Final</span>
                    <strong class="session-card__value">
                        ${formatearDinero(s.final)}
                    </strong>
                </div>
            </div>

            <div class="session-card__result resultado ${clase}">
                <span>Resultado</span>
                <strong>
                    ${resultado >= 0 ? "+" : ""}
                    ${formatearDinero(resultado)}
                </strong>
            </div>

            ${renderSessionNote(s.notes)}

            <div class="session-card__actions">
                <button class="delete-btn">
                    Eliminar
                </button>
            </div>

        `;

        const btn =
            div.querySelector(".delete-btn");

        btn.addEventListener("click", async () => {

            const confirmed =
                await window.gameTrackConfirm?.(
                    "Eliminar esta sesion?",
                    {
                        title: "Eliminar sesion",
                        confirmText: "Eliminar",
                        danger: true
                    }
                );

            if (!confirmed) return;

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

