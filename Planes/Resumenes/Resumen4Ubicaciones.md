### Módulo de Ubicaciones - Bitácora II

Este módulo administra ajustes de ubicación de artículos a partir del Excel principal cargado por el usuario.

---

### Estado funcional actual (v4.2.22)

- Se permite que existan filas duplicadas por código en la tabla para que el usuario pueda ver conflictos reales en piso.
- Los duplicados se marcan visualmente y se informan al usuario.
- Con duplicados presentes, se bloquea enviar y descargar Excel para evitar exportaciones inconsistentes.
- El botón de descarga aparece solo en navegador (web) para facilitar pruebas; en móvil se mantiene el flujo nativo de compartir.
- En la mini tarjeta del artículo se muestra historial de movimientos y origen Excel cuando existe.
- Se añadió estilo visual destacado para artículos con ubicación original `SL` (efecto neón en tarjeta y texto).

---

### Flujo de datos Excel y historial

- `ubicacionAntigua` conserva siempre el valor original del Excel base (columna C inicial).
- El historial de cambios de ubicación se guarda internamente por artículo.
- En el Excel base persistido, los movimientos se registran desde columna `L` en adelante (`Historial 1`, `Historial 2`, etc.).
- En el Excel exportado de Ubicaciones:
  - `G` mantiene la ubicación antigua original.
  - `H` (Info) no se modifica de su lógica acordada.
  - `I` queda libre.
  - El historial sale desde `J` en adelante (`Historial 1`, `Historial 2`, etc.).

---

### Componentes clave

- `AjustarUbicaciones.vue`: Página principal, lógica de enviar/descargar y validaciones globales.
- `FormularioUbicacion.vue`: Alta y edición con vista previa del artículo e historial.
- `TablaUbicaciones.vue`: Tabla de trabajo, resaltado de duplicados y acciones.
- `ExportarUbicacionesExcel.js`: Exportación final con columnas fijas y columnas dinámicas de historial.
- `LectorExcel.js`: Carga y persistencia de Excel base, incluyendo ubicación antigua e historial.

---

### Regla operativa de duplicados

- Si hay más de una fila con el mismo código, el sistema lo considera conflicto.
- El conflicto no borra filas ni decide automáticamente cuál conservar.
- El usuario debe resolver manualmente (eliminar o editar) y recién entonces puede exportar/enviar.
