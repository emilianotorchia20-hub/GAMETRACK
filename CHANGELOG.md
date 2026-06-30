# Changelog

Todas las notas relevantes para GitHub Releases se documentan en este archivo.

## [1.0.0] - 2026-06-29

### Agregado

- Migración inicial de GameTrack a Tauri 2.
- Sistema de actualizaciones nativas con GitHub Releases, `latest.json` y firma criptográfica obligatoria de Tauri.
- Configuración de Vite multipágina y dependencias locales para Toastify y Chart.js.
- Sección de actualizaciones en Configuración.

### Seguridad

- Eliminada la confusión entre actualizaciones PWA y actualizaciones del ejecutable.
- Service Worker deshabilitado dentro de Tauri.
- Política CSP para escritorio sin `unsafe-eval`.
