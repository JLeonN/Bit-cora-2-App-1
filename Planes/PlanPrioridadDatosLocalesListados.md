# PRIORIDAD DE DATOS LOCALES EN LISTADOS

## Descripción del plan

Modificar el alta de artículos en el módulo Listados para que el stock y la ubicación iniciales se resuelvan primero desde la memoria del dispositivo y utilicen el Excel maestro únicamente como respaldo. La resolución será independiente por campo, conservará las ediciones y los artículos ya guardados en cada listado, y quedará encapsulada en un servicio compartido reutilizable.

## Objetivo principal

- Utilizar el `stockContado` de un registro local confirmado cuando exista para el código seleccionado.
- Utilizar la ubicación local más reciente y válida cuando exista para el código seleccionado.
- Mantener el stock o la ubicación del Excel como respaldo independiente cuando el dato local correspondiente no exista.
- Evitar que la resolución de fuentes sobrescriba artículos previamente guardados o editados dentro de un listado.
- Centralizar la prioridad de fuentes en una API reutilizable y ajena a la interfaz de Listados.

## Contexto técnico verificado

- El proyecto utiliza Vue 3, Quasar 2 y Capacitor Preferences.
- `src/components/Logica/Listados/FormularioListado.vue` busca y selecciona artículos exclusivamente desde la base cargada por `LectorExcel.js` y emite el artículo completo mediante `articulo-seleccionado`.
- `src/pages/PaginaListados.vue`, dentro de `agregarArticulo`, copia actualmente `articulo.stock` en `stockOriginal` y `stockListado`, y `articulo.ubicacionAntigua` en `ubicacionOriginal` y `ubicacionListado`.
- `src/components/BaseDeDatos/UsoAlmacenamientoStock.js` conserva la sesión local bajo `sesion_stock`; cada registro normalizado contiene `codigo`, `stockContado`, `confirmado` y metadatos del Excel.
- `src/components/BaseDeDatos/usoAlmacenamientoUbicaciones.js` conserva bajo `ubicaciones_trabajo` una lista de objetos con `codigo` y `ubicacion`.
- Los registros enviados desde Listados hacia Stock se guardan inicialmente con `confirmado: false`; por lo tanto, no deben alimentar nuevamente el stock inicial de otro listado hasta ser confirmados en Stock.
- Los valores `0` de stock son válidos y deben detectarse por existencia del registro, no mediante una evaluación booleana del valor.
- Los artículos de Listados ya se persisten como una copia propia mediante `UsoAlmacenamientoListados.js`; no se necesita cambiar su esquema ni incrementar `VERSION_LISTADOS` para este comportamiento.
- No existe una suite automatizada funcional: `npm test` es un comando informativo. Las verificaciones disponibles son `npm run lint`, `npm run build` y pruebas manuales.
- Deben mantenerse nombres de archivos en PascalCase, símbolos en camelCase español, texto UTF-8 y código sin errores de ESLint.

## Alcance

### Incluye

- Resolución de stock local confirmado por código con respaldo en el stock del artículo del Excel.
- Resolución de ubicación local válida por código con respaldo en `ubicacionAntigua` del Excel.
- Carga conjunta y eficiente de las dos fuentes locales mediante `Promise.all`.
- Integración de los datos resueltos al agregar un artículo nuevo en Listados.
- Preservación de `stockOriginal` y `ubicacionOriginal` como valores originales del Excel para las integraciones existentes.
- Pruebas de prioridades parciales, valores cero y registros pendientes.

### No incluye

- Actualizar automáticamente artículos que ya forman parte de un listado.
- Sobrescribir ediciones manuales hechas dentro de Listados.
- Considerar registros de Stock con `confirmado: false` como fuente prioritaria.
- Eliminar la dependencia del Excel para buscar artículos, obtener su descripción o validar envíos a Etiquetas.
- Cambiar el formato persistido de Stock, Ubicaciones o Listados.
- Agregar indicadores visuales del origen de cada dato.
- Modificar la sincronización, exportación o envío de artículos hacia Stock, Ubicaciones o Etiquetas.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Logica/Compartidos/ServicioDatosLocalesArticulo.js` | Crear | `cargarDatosLocalesArticulos`, `resolverDatosArticulo` | Encapsular la carga, indexación y prioridad de las fuentes locales frente al Excel. |
| `src/pages/PaginaListados.vue` | Modificar | `datosLocalesArticulos`, `cargarDatosLocales`, `agregarArticulo`, `onMounted` | Cargar el contexto local y aplicar la resolución solamente al incorporar artículos nuevos. |

## FASE 1: Crear el servicio compartido de resolución

### Objetivo

Disponer de una API independiente de Vue y de la interfaz que resuelva stock y ubicación por código aplicando las prioridades confirmadas.

### Archivos y símbolos involucrados

- Archivo nuevo `src/components/Logica/Compartidos/ServicioDatosLocalesArticulo.js`: `cargarDatosLocalesArticulos`, `resolverDatosArticulo` y ayudantes privados de normalización e indexación.
- Archivo existente `src/components/BaseDeDatos/UsoAlmacenamientoStock.js`: `obtenerSesionStock` y estructura normalizada de `registros`.
- Archivo existente `src/components/BaseDeDatos/usoAlmacenamientoUbicaciones.js`: `obtenerUbicaciones`.
- Archivo existente `src/components/Logica/Compartidos/CodigoEscaner.js`: `normalizarCodigoBusqueda`.

### Pasos de ejecución

- [ ] Crear `src/components/Logica/Compartidos/ServicioDatosLocalesArticulo.js` respetando PascalCase y UTF-8.
  - Importar `obtenerSesionStock`, `obtenerUbicaciones` y `normalizarCodigoBusqueda` desde sus rutas existentes.
  - Mantener privados los detalles de Capacitor Preferences y las estructuras completas de almacenamiento.
- [ ] Implementar `cargarDatosLocalesArticulos()` como función asíncrona.
  - Leer `obtenerSesionStock()` y `obtenerUbicaciones()` en paralelo mediante `Promise.all`.
  - Construir `stockConfirmadoPorCodigo` como `Map`, incorporando únicamente registros con código válido y `confirmado === true`.
  - Guardar como valor el `stockContado` incluso cuando sea numéricamente `0`.
  - Construir `ubicacionPorCodigo` como `Map` solamente con códigos y ubicaciones no vacíos.
  - Respetar la prioridad temporal de la lista local de ubicaciones: como los movimientos recientes se guardan al comienzo, la primera ubicación válida encontrada para un código debe prevalecer y no ser reemplazada por duplicados posteriores de la colección.
  - Devolver un contexto con ambos mapas; si los almacenamientos están vacíos, devolver mapas vacíos y permitir que el consumidor use el Excel.
- [ ] Implementar `resolverDatosArticulo(articuloExcel, datosLocales)` como función pura y síncrona.
  - Normalizar el código con la misma función utilizada por Listados.
  - Resolver `stockListado` mediante presencia en `stockConfirmadoPorCodigo`; si no existe, usar `articuloExcel.stock ?? ''`.
  - Resolver `ubicacionListado` mediante presencia de una ubicación local no vacía; si no existe, normalizar y usar `articuloExcel.ubicacionAntigua`.
  - Devolver además `origenStock` y `origenUbicacion`, limitados a los valores `memoria` y `excel`, para que futuros consumidores puedan diagnosticar o mostrar el origen sin repetir la decisión.
  - No mutar `articuloExcel`, los mapas ni los registros de almacenamiento recibidos.
  - Tratar stock y ubicación de forma independiente: la existencia de un dato local no debe forzar el origen del otro.
- [ ] Mantener el contrato del servicio desacoplado de `ref`, `computed`, notificaciones, componentes y objetos completos de Listados.
  - El servicio debe ser reutilizable desde cualquier página o servicio que disponga de un artículo del Excel.
  - Un error inesperado de lectura debe propagarse al consumidor; no debe confundirse silenciosamente con la ausencia legítima de datos locales.

## FASE 2: Integrar la prioridad en el alta de Listados

### Objetivo

Aplicar los datos locales resueltos al crear un artículo nuevo, conservando intactos los datos originales del Excel y los artículos que ya están guardados.

### Archivos y símbolos involucrados

- `src/pages/PaginaListados.vue`: importaciones, estado local, `agregarArticulo`, `manejarBaseCargada` y `onMounted`.
- `src/components/Logica/Listados/FormularioListado.vue`: contrato existente `articulo-seleccionado`, sin necesidad de modificarlo.
- `src/components/BaseDeDatos/UsoAlmacenamientoListados.js`: contrato existente de `guardarListado`, sin modificar su esquema.

### Pasos de ejecución

- [ ] Importar `cargarDatosLocalesArticulos` y `resolverDatosArticulo` desde el nuevo servicio compartido.
- [ ] Crear el estado `datosLocalesArticulos` con un contexto inicial que contenga mapas vacíos.
  - No almacenar copias completas de las sesiones dentro de cada artículo del listado.
  - Mantener un único contexto indexado durante la permanencia en la página para evitar lecturas de Preferences por cada escaneo.
- [ ] Crear `cargarDatosLocales()` para actualizar atómicamente el contexto mediante `cargarDatosLocalesArticulos()`.
  - Permitir que un error llegue al flujo de inicialización existente y se muestre con la notificación de error de la página.
  - No bloquear ni borrar los listados persistidos si falla esta carga.
- [ ] Ajustar `onMounted` para cargar el Excel persistido y las fuentes locales antes de habilitar el uso efectivo del formulario.
  - Ejecutar en paralelo las operaciones independientes cuando no altere el orden requerido.
  - Conservar la secuencia necesaria de `cargarListados`, `establecerBaseCargada` y `actualizarBarra`.
  - Garantizar que una interacción inmediata no use accidentalmente mapas iniciales vacíos mientras la memoria local todavía se está leyendo.
- [ ] Ajustar `manejarBaseCargada` para conservar el comportamiento de notificación y asegurar que el contexto local esté disponible después de cargar o reemplazar manualmente el Excel.
  - No filtrar los registros confirmados por la identidad exacta del archivo: la prioridad solicitada se determina por código y por la memoria vigente del dispositivo.
- [ ] Modificar `agregarArticulo(articulo)` únicamente después de comprobar que el artículo no existe ya en el listado activo.
  - Ejecutar `resolverDatosArticulo(articulo, datosLocalesArticulos.value)`.
  - Mantener `stockOriginal: articulo.stock ?? ''` como referencia original del Excel.
  - Asignar el resultado `stockListado` al campo editable `stockListado`.
  - Mantener `ubicacionOriginal` a partir de `articulo.ubicacionAntigua`, normalizada igual que en el comportamiento actual.
  - Asignar el resultado `ubicacionListado` al campo editable `ubicacionListado`.
  - No persistir `origenStock` ni `origenUbicacion` dentro del listado mientras no exista un consumidor real de esos metadatos.
  - Conservar `descripcion`, `codigo`, `fechaIngreso`, detección de duplicados, resaltado y persistencia actuales.
- [ ] Mantener sin cambios el tratamiento de artículos existentes.
  - Si el código ya está en el listado, conservar su stock y ubicación actuales y ejecutar solamente el aviso y resaltado ya implementados.
  - Al abrir o duplicar un listado, no volver a consultar Stock, Ubicaciones ni Excel para reconstruir sus artículos.
  - Las ediciones realizadas mediante `guardarCambioStock` y `guardarCambioUbicacion` deben seguir teniendo prioridad dentro del listado hasta que Leo elimine el artículo o decida enviarlo a otro módulo.

## FASE 3: Consolidar la reutilización y compatibilidad

### Objetivo

Dejar una frontera clara para que otros módulos reutilicen la misma prioridad sin introducir cambios funcionales fuera de Listados.

### Archivos y símbolos involucrados

- `src/components/Logica/Compartidos/ServicioDatosLocalesArticulo.js`: API pública y responsabilidades.
- `src/pages/PaginaListados.vue`: consumidor inicial.
- `src/components/Logica/Listados/ServicioIntegracionListados.js`: contratos de envío que deben permanecer compatibles.
- `src/components/BaseDeDatos/UsoAlmacenamientoListados.js`: normalización persistente que debe permanecer compatible.

### Pasos de ejecución

- [ ] Verificar que toda decisión sobre prioridad de fuentes quede dentro de `ServicioDatosLocalesArticulo.js` y no duplicada en `PaginaListados.vue`.
- [ ] Mantener como API pública solamente las operaciones necesarias:
  - `cargarDatosLocalesArticulos(): Promise<{ stockConfirmadoPorCodigo: Map, ubicacionPorCodigo: Map }>`.
  - `resolverDatosArticulo(articuloExcel, datosLocales): { stockListado, ubicacionListado, origenStock, origenUbicacion }`.
- [ ] Confirmar que la forma final del artículo de Listados sigue siendo compatible con:
  - `normalizarArticulo` y `guardarListado` de `UsoAlmacenamientoListados.js`.
  - `enviarTodosAStock` y `enviarTodosAUbicaciones` de `ServicioIntegracionListados.js`.
  - `generarYGuardarExcelListado` de `ExportarListadosExcel.js`.
  - `TablaListados.vue` y sus eventos de edición.
- [ ] No refactorizar `PaginaStock.vue` ni `ServicioRegistroUbicacion.js` en esta implementación.
  - Esos flujos incluyen reglas adicionales de historial, respaldo y edición que no forman parte del alta de Listados.
  - Un futuro consumidor podrá utilizar `resolverDatosArticulo` si necesita exactamente el mismo contrato de prioridad.
- [ ] Revisar que ningún nombre nuevo contenga guiones medios o bajos y que no se incorporen textos con caracteres dañados.

## FASE TESTING

### Objetivo

Validar que cada dato se obtiene de la fuente correcta, que los respaldos funcionan de forma independiente y que no se modifica información previamente guardada.

### Pruebas automatizadas

- [ ] Ejecutar `npm run lint` y corregir cualquier error o advertencia introducida por los archivos modificados.
- [ ] Ejecutar `npm run build` y comprobar que Quasar complete la compilación sin errores de importación, sintaxis o empaquetado.
- [ ] Ejecutar `npm test` únicamente como comprobación del script existente y documentar que el proyecto informa `No test specified`.

### Pruebas manuales

- [ ] Preparar un código con stock confirmado y ubicación guardada localmente; agregarlo a un listado nuevo y comprobar que ambos valores locales prevalecen sobre el Excel.
- [ ] Preparar un código con stock confirmado igual a `0`; comprobar que Listados muestre `0` y no recupere el stock del Excel.
- [ ] Preparar un código con registro de Stock pendiente y sin registro confirmado; comprobar que el stock provenga del Excel.
- [ ] Preparar un código con stock confirmado pero sin ubicación local; comprobar stock desde memoria y ubicación desde Excel.
- [ ] Preparar un código sin stock confirmado pero con ubicación local; comprobar stock desde Excel y ubicación desde memoria.
- [ ] Preparar un código sin datos locales; comprobar que stock y ubicación provengan del Excel como hasta ahora.
- [ ] Preparar ubicaciones locales repetidas para un mismo código; comprobar que prevalezca la ubicación válida más reciente según el orden persistido.
- [ ] Preparar una ubicación local vacía; comprobar que se ignore y se utilice la ubicación del Excel.
- [ ] Agregar un artículo, editar manualmente su stock y ubicación, cerrar y volver a abrir el listado; comprobar que las ediciones persistan sin ser reemplazadas por memoria ni Excel.
- [ ] Intentar agregar nuevamente un artículo existente después de cambiar Stock o Ubicaciones; comprobar que se conserve el artículo del listado y aparezca el aviso de duplicado actual.
- [ ] Duplicar y volver a abrir listados existentes; comprobar que sus valores permanezcan intactos.
- [ ] Enviar un listado a Stock y comprobar que los registros pendientes generados no sean usados como stock prioritario al agregar ese código en otro listado.
- [ ] Enviar artículos a Stock, Ubicaciones y Etiquetas, y exportar el listado; comprobar que los contratos actuales sigan funcionando.
- [ ] Probar un código inexistente o inválido y comprobar que no se agregue ni provoque errores.

### Casos de dispositivo y web

- [ ] Probar en Android con Capacitor Preferences para confirmar que los datos persistan entre cierres y aperturas de la aplicación.
- [ ] Probar en navegador, donde Capacitor Preferences usa su implementación web, y comprobar la misma prioridad de fuentes.
- [ ] Verificar que el escáner, la selección manual y la autoselección produzcan el mismo resultado porque todos convergen en `agregarArticulo`.

## Progreso del plan

- [ ] Fase 1: Crear el servicio compartido de resolución
- [ ] Fase 2: Integrar la prioridad en el alta de Listados
- [ ] Fase 3: Consolidar la reutilización y compatibilidad
- [ ] Fase Testing

Fecha de creación: 9 de septiembre de 2026
Fecha de última actualización: 9 de septiembre de 2026
Estado: BORRADOR
