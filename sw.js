const CACHE_NAME = "gametrack-v1";

const urlsToCache = [

  "./",
  "./index.html",

  "./PAGES/historial/index.html",
  "./PAGES/estadisticas/index.html",
  "./PAGES/configuracion/index.html",
  "./PAGES/roulette/index.html",

  "./CSS/base.css",
  "./CSS/layout.css",
  "./CSS/utilities.css",

  "./CSS/components/buttons.css",
  "./CSS/components/cards.css",
  "./CSS/components/forms.css",
  "./CSS/components/navbar.css",
  "./CSS/components/stats.css",

  "./JS/app.js",
  "./JS/storage.js",
  "./JS/sessions.js",
  "./JS/roulette.js"

];

// ==========================
// INSTALL
// ==========================

self.addEventListener(

  "install",

  event => {

    console.log(
      "SW installing..."
    );

    event.waitUntil(

      caches
        .open(CACHE_NAME)

        .then(cache => {

          return cache.addAll(
            urlsToCache
          );

        })

    );

  }

);

// ==========================
// ACTIVATE
// ==========================

self.addEventListener(

  "activate",

  event => {

    console.log(
      "SW activated"
    );

    event.waitUntil(

      caches.keys()

        .then(keys =>

          Promise.all(

            keys.map(key => {

              if (
                key !== CACHE_NAME
              ) {

                return caches.delete(
                  key
                );

              }

            })

          )

        )

        .then(() => {

          return self.clients.claim();

        })

    );

  }

);

// ==========================
// FETCH
// ==========================

self.addEventListener(

  "fetch",

  event => {

    if (
      event.request.method !== "GET"
    ) return;

    event.respondWith(

      fetch(event.request)

        .then(response => {

          const responseClone =
            response.clone();

          caches
            .open(CACHE_NAME)

            .then(cache => {

              cache.put(
                event.request,
                responseClone
              );

            });

          return response;

        })

        .catch(() => {

          return caches.match(
            event.request
          );

        })

    );

  }

);

// ==========================
// UPDATE MANUAL
// ==========================

self.addEventListener(

  "message",

  event => {

    if (

      event.data?.type ===
      "SKIP_WAITING"

    ) {

      console.log(
        "🚀 skipWaiting"
      );

      self.skipWaiting();

    }

  }

);