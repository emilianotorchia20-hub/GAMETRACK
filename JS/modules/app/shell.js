const INTERNAL_NAVIGATION_KEY =
  "gametrack.internalNavigation";

function removeLoader(loader, delay = 0) {
  if (!loader) return;

  window.setTimeout(() => {
    loader.remove();
  }, delay);
}

function hideInitialLoader(loader) {
  if (!loader) return;

  const isInternalNavigation =
    sessionStorage.getItem(INTERNAL_NAVIGATION_KEY) === "true";

  if (isInternalNavigation) {
    sessionStorage.removeItem(INTERNAL_NAVIGATION_KEY);
    removeLoader(loader);
    document.body.classList.add("page-enter");
    window.setTimeout(() => {
      document.body.classList.remove("page-enter");
    }, 260);
    return;
  }

  const loaderWasShown =
    localStorage.getItem("loaderVisto");

  if (!loaderWasShown) {
    loader.classList.remove("hidden");

    window.setTimeout(() => {
      loader.classList.add("hidden");
      removeLoader(loader, 620);
      localStorage.setItem("loaderVisto", "true");
    }, 1500);

    return;
  }

  removeLoader(loader);
}

function isInternalLink(link) {
  if (!link.href) return false;
  if (link.target && link.target !== "_self") return false;
  if (link.hasAttribute("download")) return false;

  const url =
    new URL(link.href, window.location.href);

  if (url.origin !== window.location.origin) return false;
  const currentPath =
    window.location.pathname.replace(/\/index\.html$/, "/");

  const nextPath =
    url.pathname.replace(/\/index\.html$/, "/");

  if (
    nextPath === currentPath &&
    url.search === window.location.search &&
    url.hash === window.location.hash
  ) return false;

  return true;
}

function startPageTransition(url) {
  if (document.body.classList.contains("page-leaving")) return;

  sessionStorage.setItem(INTERNAL_NAVIGATION_KEY, "true");
  document.body.classList.add("page-leaving");

  window.setTimeout(() => {
    window.location.href = url;
  }, 120);
}

function bindPageTransitions() {
  document.addEventListener("click", event => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    const link =
      event.target.closest("a");

    if (!link || !isInternalLink(link)) return;

    event.preventDefault();
    startPageTransition(link.href);
  });
}

function initAppShell() {
  hideInitialLoader(
    document.getElementById("loader")
  );

  bindPageTransitions();
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

window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-leaving");
});
