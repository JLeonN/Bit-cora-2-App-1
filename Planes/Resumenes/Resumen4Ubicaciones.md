### Módulo de Ubicaciones - Bitácora II

Administra ajustes de ubicación de artículos usando el Excel principal cargado en el dispositivo.

### Estado funcional actual (v4.2.33)

- Bitácora puede abrir directamente archivos Excel `.xlsx` y `.xls` recibidos desde WhatsApp y cargarlos como base local, incluso si ya estaba abierta.
- La pantalla muestra primero el estado de la base y un resumen más claro antes del formulario de trabajo.
- El formulario conserva la preferencia de tamaño de letra y permite activar o desactivar la autoselección de artículos únicos.
- La tarjeta del artículo muestra ubicación original, historial y stock como referencia.
- Se permiten filas duplicadas para que el usuario vea conflictos reales; mientras existan, se bloquea la exportación.

### Flujo de datos Excel e historial

- `ubicacionAntigua` conserva el valor original de la columna C del Excel.
- El historial de cambios se guarda internamente por artículo.
- Al recibir un Excel desde otra aplicación, Bitácora lo procesa localmente y persiste la base en el dispositivo.
- En el Excel exportado de Ubicaciones, la columna G conserva la ubicación antigua y el historial se exporta desde la columna J.

### Componentes clave

- `AjustarUbicaciones.vue`: pantalla principal y validaciones globales.
- `SelectorExcel.vue`: selección manual e importación automática de Excel compartido.
- `FormularioUbicacion.vue`: alta y edición con vista previa del artículo.
- `TablaUbicaciones.vue`: tabla de trabajo, conflictos y acciones.
- `LectorExcel.js`: lectura y persistencia local de la base Excel.

### Regla operativa de duplicados

- Más de una fila con el mismo código se considera un conflicto.
- El sistema no elimina ni decide automáticamente qué fila conservar.
- El usuario debe resolverlo antes de enviar o exportar el Excel.
