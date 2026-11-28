# Plan de consulta por ubicación

## Descripción del plan

Permitir consultar una ubicación exacta, como `3-B7`, y mostrar los artículos que se encuentran allí según la última información conocida. Cada Excel nuevo es una base vigente garantizada por el usuario; las actualizaciones locales posteriores tienen prioridad. Registrar desde ahora fecha y hora de carga y de cada cambio; no inventar fechas anteriores.

## Objetivo principal

- Consultar artículos por ubicación exacta usando el Excel maestro y las actualizaciones locales posteriores.
- Mostrar en Configuración la fecha real de carga del Excel y conservar el historial y las listas de trabajo.

## Contexto técnico verificado

- Proyecto Vue 3, Quasar y Capacitor; persistencia con `Preferences`. Respetar `AGENTS.md`, español y estilos existentes.
- `LectorExcel.js` guarda artículos, base original e historial como cadenas; `fechaCarga` se reescribe en cada persistencia y no acredita cuándo se cargó el archivo. `fechaModificacion` corresponde al archivo, no a su carga.
- El Excel admite columnas de historial; la última ubicación del historial importado prevalece sobre `ubicacionAntigua` para determinar la ubicación de base.
- `AjustarUbicaciones.vue` guarda una lista de trabajo y reconstruye el historial; Consulta y Stock usan `ServicioRegistroUbicacion.js`; Listados escribe en la lista directamente. Borrar filas no debe borrar la ubicación conocida.
- El usuario autorizó que la IA ejecute las comprobaciones de la fase testing durante la implementación.

## Alcance

### Incluye

- Persistencia interna compatible con datos existentes, prioridad coherente y consulta exacta.
- Fecha de carga visible, nuevas fechas internas, interfaz adaptable y pruebas por la IA.

### No incluye

- Recuperar fechas históricas desconocidas, editar el Excel original o cambiar el formato exportado.
- Considerar las ediciones de la pantalla temporal de ubicaciones compartidas como cambios locales: actualmente prepara una descarga, no modifica la base local.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/BaseDeDatos/LectorExcel.js` | Modificar | `cargarArticulosDesdeExcel`, `cargarArticulosDesdeExcelCompartido`, `guardarBaseDatosEnPreferences`, `reconstruirUbicacionesDesdeLista` | Fecha de carga y preservación de la base e historial. |
| `src/components/Logica/Ubicaciones/ServicioUbicacionVigente.js` | Crear | `resolverUbicacionVigente`, `buscarArticulosPorUbicacion` | Resolver prioridad y consulta exacta. |
| `src/components/Logica/Ubicaciones/ServicioRegistroUbicacion.js` | Modificar | `registrarUbicacionArticulo`, `obtenerUltimaUbicacionRegistrada` | Registrar cambios y compartir la resolución vigente. |
| `src/components/BaseDeDatos/UsoHistorialUbicaciones.js` | Crear | `obtenerCambiosUbicacion`, `registrarCambiosUbicacion` | Persistir cambios con fecha independientemente de la lista de trabajo. |
| `src/pages/AjustarUbicaciones.vue` | Modificar | `agregarUbicacion`, `guardarEdicion`, `sincronizarBaseConListaActual` | Registrar solo cambios efectivos, sin fechar de nuevo toda la lista. |
| `src/components/Logica/Listados/ServicioIntegracionListados.js` | Modificar | `enviarTodosAUbicaciones` | Registrar movimientos enviados desde Listados. |
| `src/pages/PaginaStock.vue`, `src/pages/ConsultaDeUbicacion.vue` | Modificar | consumidores de `obtenerUltimaUbicacionRegistrada` | Aplicar la misma prioridad a los flujos existentes. |
| `src/components/Logica/Ubicaciones/SelectorExcel.vue` | Modificar | `informacionArchivo`, `actualizarEstado` | Mostrar fecha de carga o fecha desconocida. |
| `src/pages/ConsultaDeUbicacion.vue` | Modificar | template, estado y búsqueda | Incorporar consulta por ubicación. |
| `Pruebas/Ubicaciones/ServicioUbicacionVigente.test.js` | Crear | pruebas con `node:test` | Verificar prioridad, migración y coincidencia exacta. |

## FASE 1: Registrar fechas y conservar datos

### Objetivo

Persistir la fecha real de carga y los cambios nuevos sin alterar ni fechar artificialmente los datos antiguos.

### Pasos de ejecución

- [x] En `LectorExcel.js`, agregar `fechaCargaExcel` como número de milisegundos o `null` en `informacionArchivo`; asignar `Date.now()` solo al finalizar correctamente cada importación, tanto local como compartida. Conservarla al guardar cambios y restaurarla desde Preferences. Una carga cancelada, fallida o no persistida no debe reemplazar los datos ni la fecha anteriores; propagar errores de persistencia y restaurar el estado previo. Mantener `fechaModificacion` y sus consumidores sin cambios semánticos.
- [x] Para bases anteriores sin fecha confiable, mantener `fechaCargaExcel: null`; no reutilizar el `fechaCarga` que cambia al persistir ni la fecha de modificación del archivo. Mostrar fecha desconocida hasta cargar un nuevo Excel.
- [x] Crear `UsoHistorialUbicaciones.js`, con clave propia de Preferences y esquema versionado. Exportar `obtenerCambiosUbicacion(): Promise<Array<{ codigo, ubicacion, fechaActualizacion }>>` y `registrarCambiosUbicacion(cambios): Promise<void>`; normalizar código y ubicación, validar fecha, persistir cada cambio efectivo en orden y propagar errores. Conservar este registro al eliminar filas o reemplazar el Excel. No inventar fechas al migrar.
- [x] Registrar cada cambio efectivo desde `agregarUbicacion` y `guardarEdicion` en `AjustarUbicaciones.vue`, desde `registrarUbicacionArticulo` en Consulta y Stock, y desde `enviarTodosAUbicaciones` en Listados. Mantener la fecha anterior si una edición no cambia código ni ubicación; una edición real produce un evento nuevo. Envíos masivos registran solo artículos válidos. No volver a fechar todos los registros durante una reconstrucción.
- [x] Mantener coherentes lista, historial y registro: ante fallo informar al usuario y evitar que una operación se anuncie como completa con datos parcialmente guardados; aplicar recuperación o reversión a cada flujo. Conservar los comportamientos existentes para códigos duplicados y artículos ausentes del Excel, sin atribuirles una descripción inventada.
- [x] Mantener `historialUbicaciones` como cadenas para no romper Consulta ni `ExportarUbicacionesExcel.js`. En `reconstruirUbicacionesDesdeLista`, evitar que registros anteriores a un Excel nuevo se vuelvan a incorporar como actualizaciones posteriores por el mero hecho de reconstruir; borrar una fila no elimina el historial ni el registro de cambios.

## FASE 2: Resolver la ubicación vigente

### Objetivo

Unificar la prioridad para la consulta inversa y los consumidores existentes.

### Pasos de ejecución

- [x] Crear `ServicioUbicacionVigente.js` con funciones puras: `resolverUbicacionVigente({ articulo, cambios, fechaCargaExcel, ubicacionesLegadas })`, que devuelva `{ ubicacion, origen, fechaActualizacion }`, y `buscarArticulosPorUbicacion({ articulos, cambios, fechaCargaExcel, ubicacionesLegadas, ubicacion })`, que devuelva artículos del Excel con su ubicación y origen. Normalizar con recorte y mayúsculas; comparar la ubicación completa, no prefijos.
- [x] Para un Excel con fecha conocida, resolver la base desde la última entrada del historial importado de `articulosBaseOriginal`, o `ubicacionAntigua` si no hay historial. Aplicar el último cambio fechado posterior a esa carga por código; los movimientos anteriores o sin fecha no prevalecen. Conservar la información anterior sin borrarla. Establecer una regla determinista para empates de milisegundos respetando el orden real de las operaciones.
- [x] Para la base cargada antes de esta función, sin fecha conocida, mantener el comportamiento previo: priorizar la primera entrada correspondiente de la lista legada y después el último historial o la ubicación original. Los cambios nuevos fechados prevalecen. Al cargar posteriormente un Excel válido se pasa a la regla fechada.
- [x] Evitar búsquedas repetidas por artículo: construir índices por código para cambios y registros legados una vez por consulta. No incluir como artículos del maestro registros sin correspondencia en él; conservarlos en la lista de trabajo.
- [x] Adaptar `obtenerUltimaUbicacionRegistrada` y sus consumidores en Consulta y Stock para usar la misma resolución, incluyendo cambios guardados aunque se haya eliminado su fila de trabajo. Revisar `ServicioIntegracionListados.js` y los datos enviados a Stock y Etiquetas para evitar que una ubicación previa a la carga vuelva a prevalecer. Mantener contratos o actualizar todos sus consumidores explícitamente.
- [x] Mantener el historial visual existente y asegurar que el valor vigente mostrado para un artículo no contradiga la consulta inversa. No presentar la fecha desconocida como cierta.

## FASE 3: Consulta por ubicación

### Objetivo

Permitir encontrar todos los artículos de una ubicación exacta desde la consulta existente.

### Pasos de ejecución

- [x] En `ConsultaDeUbicacion.vue`, incorporar dos modos accesibles: «Buscar artículo» y «Buscar ubicación», conservando el modo artículo, cámara, acciones y navegación actuales. Al cambiar de modo, limpiar estados de resultados y evitar que botones o modales del otro modo interfieran.
- [x] Añadir campo y acción de búsqueda por ubicación, normalizando mayúsculas y espacios exteriores, sin cambiar el significado de separadores. Cargar artículos, base original, cambios y lista legada mediante las APIs correspondientes; resolver con el servicio compartido y mostrar ubicación consultada, cantidad, código, descripción y origen por resultado. Cada artículo aparece una sola vez.
- [x] Mostrar estados claros: sin Excel, entrada vacía, sin resultados y error de lectura; no afirmar que un estante está físicamente vacío si no existen resultados en los datos. Mantener buen rendimiento para una base de al menos 13 763 artículos.
- [x] Reutilizar colores y componentes existentes; en teléfono evitar desbordes horizontales y permitir leer descripciones largas; en escritorio usar el espacio disponible. Mantener etiquetas accesibles, foco y navegación de vuelta compatibles con los patrones de la página.

## FASE 4: Mostrar fecha de carga

### Objetivo

Informar al usuario cuándo se cargó la base vigente.

### Pasos de ejecución

- [x] En `SelectorExcel.vue`, mostrar en la tarjeta del archivo la fecha y hora de `informacionArchivo.fechaCargaExcel`, formateadas para el usuario con `Intl.DateTimeFormat('es-UY', { dateStyle: 'medium', timeStyle: 'short' })`. Si no se conoce, mostrar «Fecha de carga no disponible». Actualizar la tarjeta tras carga, restauración y limpieza; no confundir fecha de modificación con fecha de carga.

## FASE TESTING

### Objetivo

La IA ejecutará las comprobaciones y comunicará los resultados; si una comprobación depende de dispositivo o datos que no estén disponibles, documentará la limitación.

### Pruebas automatizadas

- [x] Crear pruebas de comportamiento con `node:test` para la resolución: ubicación original, historial importado, cambio posterior, cambio anterior, varios cambios, empate, base legada sin fecha y Excel nuevo. Comprobar coincidencia exacta `3-B7` frente a `3-B70`, normalización, duplicados y artículo ausente.
- [x] Ejecutar `node --test Pruebas/Ubicaciones/ServicioUbicacionVigente.test.js` y `npm test`; ejecutar `npm run lint` y corregir errores atribuibles al cambio.
- [x] Comprobar persistencia y fallos: fecha estable tras actualizaciones y reinicio; importación fallida conserva base anterior; registro nuevo sobrevive al borrado de la fila y no se vuelve a fechar al reconstruir; carga posterior del Excel prevalece y un cambio subsiguiente vuelve a prevalecer. Verificar Consulta, Stock y envío desde Listados.

### Pruebas manuales y responsivas

Comprobado: búsqueda exacta en escritorio y en Chrome del teléfono físico, con Excel aislado; fecha y estado sin base en teléfono. Pruebas automatizadas adicionales cubren cambios, persistencia, reinicio y cargas sucesivas. El teléfono se probó mediante el navegador, sin compilar ni instalar APK.

- [ ] Con datos de prueba aislados, consultar una ubicación con varios artículos, una sin resultados y otra con nombre parecido; comprobar código, descripción, origen y ausencia de duplicados. Cambiar un artículo de ubicación y comprobar ambas búsquedas.
- [ ] Comprobar la tarjeta con Excel nuevo y anterior sin fecha, carga compartida, cancelación y reinicio. Comprobar en teléfono y escritorio legibilidad, desbordamiento, modo artículo, cámara y navegación existentes.

## Progreso del plan

- [x] Fase 1: Registrar fechas y conservar datos
- [x] Fase 2: Resolver la ubicación vigente
- [x] Fase 3: Consulta por ubicación
- [x] Fase 4: Mostrar fecha de carga
- [ ] Fase Testing

Fecha de creación: 27 de noviembre de 2026  
Fecha de última actualización: 28 de noviembre de 2026
Estado: EN PROCESO
