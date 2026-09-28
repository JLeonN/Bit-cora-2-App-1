### Módulo de Consulta De Ubicación - Bitácora II

Pantalla para buscar artículos y registrar cambios de ubicación sin salir del flujo operativo.

---

### Estado funcional actual (v4.2.45)

- La tarjeta principal muestra historial de movimientos en lugar de solo “Ubicación actual”.
- El historial se presenta con la ubicación más nueva primero.
- Si el artículo tiene origen `SL`, se aplica resaltado visual neón para facilitar detección.
- Al guardar ubicación:
  - Se conserva `ubicacionAntigua` como dato original del Excel base.
  - Se agrega el nuevo movimiento al historial del artículo.
  - Se sincroniza el registro con el módulo Ubicaciones para exportación posterior.
- Si el código ya existe en Ubicaciones, se permite coexistencia de filas para que el usuario vea duplicados y los resuelva manualmente.
- El contexto persistente limita búsquedas por descripción sin impedir códigos exactos ni escaneos.
- En pantallas angostas, el contexto ocupa una fila completa sobre el buscador y la cámara.
- La tarjeta permite compartir el nombre y código del artículo por WhatsApp.
- La tarjeta permite enviar el artículo a Stock como pendiente de conteo, a un listado elegido en el selector o a Etiquetas con una cantidad de copias.
- No sobrescribe registros existentes de Stock ni agrega dos veces el mismo artículo a un listado. Cada envío a Etiquetas crea una entrada independiente para detectar duplicados.
- Las acciones se apilan en pantallas angostas.

---

### Integraciones

- `SelectorExcel.vue`: usa la misma base cargada que Ubicaciones.
- `BuscadorArticulos.vue`: búsqueda compartida por código y nombre con contexto opcional.
- `ServicioBusquedaArticulos.js`: filtrado y resolución exacta reutilizable.
- `CamaraEscaneo.vue`: carga por escaneo.
- `LectorExcel.js`: fuente de artículo base + historial.
- `usoAlmacenamientoUbicaciones.js`: persistencia de filas operativas para enviar/exportar.

---

### Regla operativa

- Consulta De Ubicación no decide automáticamente qué fila conservar ante duplicados.
- El sistema prioriza visibilidad del conflicto para que la decisión la tome el usuario en Ubicaciones.
