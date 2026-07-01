function getNavigationItems(isNested) {
  return [
    { id: "home", label: "Inicio", href: isNested ? "../../index.html" : "./index.html" },
    { id: "historial", label: "Historial", href: isNested ? "../historial/index.html" : "./PAGES/historial/index.html" },
    { id: "estadisticas", label: "Estadisticas", href: isNested ? "../estadisticas/index.html" : "./PAGES/estadisticas/index.html" },
    { id: "insights", label: "Insights", href: isNested ? "../insights/index.html" : "./PAGES/insights/index.html" },
    { id: "configuracion", label: "Configuracion", href: isNested ? "../configuracion/index.html" : "./PAGES/configuracion/index.html" },
    { id: "roulette", label: "Ruleta", href: isNested ? "../roulette/index.html" : "./PAGES/roulette/index.html" },
  ];
}

function getActiveNavigationId(pathname) {
  if (pathname.includes("/historial/")) return "historial";
  if (pathname.includes("/estadisticas/")) return "estadisticas";
  if (pathname.includes("/insights/")) return "insights";
  if (pathname.includes("/configuracion/")) return "configuracion";
  if (pathname.includes("/roulette/")) return "roulette";
  return "home";
}

function renderNavigation() {
  const mount = document.getElementById("appNav");
  if (!mount) return;

  const isNested = window.location.pathname.includes("/PAGES/");
  const activeId = getActiveNavigationId(window.location.pathname);
  const nav = document.createElement("nav");

  for (const item of getNavigationItems(isNested)) {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    if (item.id === activeId) link.className = "active";
    nav.appendChild(link);
  }

  mount.replaceWith(nav);
}

renderNavigation();
