// ==========================
// ðŸŽ¬ LOADER + NAVEGACIÃ“N
// ==========================
function initAppShell() {

  const loader =
    document.getElementById("loader");

  // ==========================
  // ðŸŽ¬ LOADER SYSTEM
  // ==========================
  if (loader) {

    const navegando =
      localStorage.getItem("navegando");

    // ðŸ”¥ navegaciÃ³n interna
    if (navegando) {

      loader.classList.add("hidden");

      // ðŸ’€ remover totalmente
      setTimeout(() => {

        loader.remove();

      }, 700);

      localStorage.removeItem(
        "navegando"
      );

    } else {

      const yaMostrado =
        localStorage.getItem(
          "loaderVisto"
        );

      // ðŸŽ¬ primera carga
      if (!yaMostrado) {

        loader.classList.remove(
          "hidden"
        );

        setTimeout(() => {

          loader.classList.add(
            "hidden"
          );

          // ðŸ’€ eliminar loader
          setTimeout(() => {

            loader.remove();

          }, 700);

          localStorage.setItem(
            "loaderVisto",
            "true"
          );

        }, 1800);

      } else {

        loader.classList.add(
          "hidden"
        );

        // ðŸ’€ remover instantÃ¡neo
        setTimeout(() => {

          loader.remove();

        }, 100);

      }

    }

  }

  // ==========================
  // ðŸ”„ PAGE TRANSITIONS
  // ==========================
  document
    .querySelectorAll("nav a")
    .forEach(link => {

      link.addEventListener(
        "click",
        e => {

          e.preventDefault();

          localStorage.setItem(
            "navegando",
            "true"
          );

          const url = link.href;

          document.body.classList.add(
            "fade-out"
          );

          setTimeout(() => {

            window.location.href = url;

          }, 220);

        }
      );

    });

}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initAppShell,
    { once: true }
  );
} else {
  initAppShell();
}

// ==========================
// ðŸ” RESET LOADER
// ==========================
window.addEventListener(
  "beforeunload",
  () => {

    localStorage.removeItem(
      "loaderVisto"
    );

  }
);

// ==========================
// ðŸ“± SERVICE WORKER + UPDATE
// ==========================
// ==========================
// ðŸ”” CONFIG ALERTAS
// ==========================
