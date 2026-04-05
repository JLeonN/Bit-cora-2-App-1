# Bitácora 2 (bit-cora-2-app)

Aplicación móvil para registrar tareas y actividades diarias.

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Publicar en GitHub Pages

La publicacion se hace con el workflow `PublicarGitHubPages.yml` ubicado en `.github/workflows`.

- Cada `push` a `main` compila `dist/spa` y publica en GitHub Pages.
- El archivo `public/version.json` se genera solo antes de cada build a partir de `package.json`.
- En Android, la app consulta ese `version.json` para detectar actualizaciones.

Estructura de `public/version.json`:

```json
{
  "versionDisponible": "4.2.8",
  "urlPlayStore": "https://play.google.com/store/apps/details?id=bitacora.v2",
  "mostrarActualizacion": true
}
```

Regla de actualizacion:

- Cambiar `versionDisponible` no es necesario de forma manual; lo toma desde `package.json`.
- Mantener `urlPlayStore` con el `applicationId` correcto.
- Si `mostrarActualizacion` es `false`, no se mostrara modal ni boton de actualizacion.

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
