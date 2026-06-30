# Publicación de GameTrack

## 1. Generar claves del updater de Tauri

Ejecutá:

```powershell
npm run tauri -- signer generate -w .\src-tauri\gametrack-updater.key
```

El comando imprime la clave pública y crea la clave privada `src-tauri/gametrack-updater.key`. Si usás contraseña, guardala fuera del repositorio.

## 2. Copiar la clave pública

Copiá únicamente la clave pública al campo `plugins.updater.pubkey` de `src-tauri/tauri.conf.json`, reemplazando `REEMPLAZAR_CON_CLAVE_PUBLICA_TAURI`.

No copies la clave privada ni su contraseña en ningún archivo del repo.

## 3. Crear GitHub Secrets

En GitHub, abrí `Settings > Secrets and variables > Actions > New repository secret`.

Creá:

- `TAURI_SIGNING_PRIVATE_KEY`: contenido completo de la clave privada del updater.
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: contraseña de la clave privada, si se generó con contraseña. Si no tiene contraseña, dejalo vacío solo si la UI de GitHub lo permite o ajustá el workflow para omitir esa variable.

`GITHUB_TOKEN` lo provee GitHub Actions automáticamente.

## 4. Cambiar versión

Ejecutá:

```powershell
npm run version:set -- 1.0.1
npm run version:check
```

## 5. Actualizar CHANGELOG

Agregá una sección `## [1.0.1] - AAAA-MM-DD` con las novedades. Las notas de la release se toman de esa sección.

Para marcar una actualización como obligatoria, agregá este marcador dentro de la sección:

```text
[GAMETRACK_UPDATE_REQUIRED]
```

El marcador no se muestra en la app.

## 6. Crear commit

```powershell
git add .
git commit -m "Release v1.0.1"
```

## 7. Crear tag

```powershell
git tag v1.0.1
```

## 8. Publicar tag

```powershell
git push origin main
git push origin v1.0.1
```

También podés lanzar el workflow manualmente desde `Actions > Release GameTrack`.

## 9. Verificar GitHub Release

La release debe quedar publicada con:

- Instalador NSIS de Windows.
- Artefactos firmados del updater.
- `latest.json`.

Verificá que este endpoint responda:

```text
https://github.com/emilianotorchia20-hub/GAMETRACK/releases/latest/download/latest.json
```

## 10. Probar actualización desde una versión anterior

1. Generá e instalá `1.0.0`.
2. Confirmá que la app abre y guarda una sesión de prueba.
3. Cambiá a `1.0.1` con `npm run version:set -- 1.0.1`.
4. Actualizá `CHANGELOG.md`.
5. Creá commit y tag `v1.0.1`.
6. Publicá el tag y esperá que GitHub Actions cree la release.
7. Abrí la app instalada en `1.0.0`.
8. Usá `Configuración > Actualizaciones > Buscar actualizaciones`.
9. Confirmá que muestra `1.0.0` instalada y `1.0.1` disponible.
10. Descargá e instalá.
11. Confirmá el reinicio.
12. Verificá que la app reporta `1.0.1`.
13. Confirmá que las sesiones, configuración e historial siguen en `localStorage`.

La firma del updater de Tauri valida que el artefacto descargado no fue manipulado. Esto es distinto de Authenticode, que firma el ejecutable de Windows para reputación del sistema operativo. Authenticode es recomendable para producción, pero no reemplaza la firma del updater de Tauri.

## Build firmado local con latest.json

En esta máquina, el script local usa por defecto:

```powershell
V:\Password\updatetracker.key
```

Para compilar, firmar el instalador y regenerar `latest.json` automáticamente:

```powershell
npm.cmd run tauri:build:local
```

El archivo queda en:

```text
src-tauri/target/release/bundle/nsis/latest.json
```

Si querés usar otra clave sin editar el repo:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY="D:\otra\ruta\clave.key"
npm.cmd run tauri:build:local
```

Si la clave tiene contraseña, definí también:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD="TU_CONTRASEÑA"
```
