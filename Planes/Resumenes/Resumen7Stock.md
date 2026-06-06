# Módulo Stock - Bitácora II

Stock permite contar artículos usando la base Excel compartida por Ubicaciones, Consulta de ubicación y Etiquetas.

## Flujo principal

- La búsqueda reutiliza `CodigoMasNombre.vue` y selecciona automáticamente una coincidencia única.
- Un artículo nuevo inicia con el stock original del Excel.
- Un artículo contado anteriormente recupera el último total para continuar sumando.
- Los conteos se guardan con un único registro por código.
- Los registros importados desde Ubicaciones quedan pendientes hasta una confirmación explícita.
- La tabla permite editar cantidad y ubicación en línea, confirmar pendientes, eliminar y enviar a Etiquetas.

## Persistencia y sesión

- `UsoAlmacenamientoStock.js` guarda una estructura versionada en Capacitor Preferences.
- La sesión conserva la identidad del Excel mediante nombre, tamaño y fecha de modificación.
- Si el usuario carga un Excel distinto, se bloquean altas, importación y exportación hasta volver al archivo anterior o iniciar una sesión nueva.
- `stockExcel` queda congelado durante la sesión y `stockContado` siempre es un entero igual o mayor que cero.

## Ubicaciones

La última ubicación se resuelve con esta prioridad:

1. Movimiento más reciente de la tabla de Ubicaciones.
2. Último valor del historial del artículo.
3. Ubicación guardada en el registro de Stock.

Los cambios realizados desde Stock usan `ServicioRegistroUbicacion.js`, agregan el movimiento al inicio de Ubicaciones y actualizan el historial sin sobrescribir la ubicación original del Excel.

## Etiquetas

`ServicioEnvioEtiquetas.js` construye el contrato compartido:

- Código.
- Descripción.
- Última ubicación.
- Cantidad fija `1`.
- Tamaño `10x15cm`.

Los artículos inexistentes no se envían. En un envío masivo se omiten y se informa la cantidad excluida.

## Información

La sección Información muestra:

- Artículos totales, confirmados y pendientes.
- Conteos confirmados con diferencias.
- Artículos con ubicación original `SL`.
- Artículos inexistentes.
- Total Excel confirmado.
- Total contado confirmado.
- Diferencia total calculada como `Contado - Excel`.

## Excel de Stock

`ExportarStockExcel.js` exporta solamente registros confirmados:

- A: Código.
- B: Descripción.
- C: Stock Excel.
- D: Stock contado.
- E: Última ubicación.
- F: Info con `✔️` o `❌`.

El nombre sigue el formato `Stock [Nombre de usuario] AAAA-MM-DD # HH-MM.xlsx`. En navegador se descarga directamente y en Android se guarda en caché para compartir.

## Archivos clave

- `src/pages/PaginaStock.vue`: coordinación general del módulo.
- `src/components/Logica/Stock/TablaStock.vue`: lista y edición en línea.
- `src/components/BaseDeDatos/UsoAlmacenamientoStock.js`: persistencia de sesión y registros.
- `src/components/Logica/Stock/ExportarStockExcel.js`: generación del Excel.
- `src/components/Logica/Ubicaciones/ServicioRegistroUbicacion.js`: sincronización de ubicaciones.
- `src/components/Logica/Etiquetas/ServicioEnvioEtiquetas.js`: envío compartido a Etiquetas.
