# IMPORTACIÓN AUTOMÁTICA DE ARTÍCULOS DESDE EXCEL EN LISTADOS

## Descripción del plan

Agregar a la página de Listados una importación masiva y exclusiva para archivos Excel (`.xlsx` y `.xls`). El archivo importado representa una lista de artículos distinta del Excel maestro que ya utiliza la aplicación como catálogo.

El procesamiento debe ejecutarse localmente, sin Capitana Bita ni ningún servicio de inteligencia artificial. Se recorrerán todas las hojas, filas y columnas del archivo importado. Cada fila útil representará como máximo una incorporación al listado activo: se buscará primero un código exacto del catálogo y, si no existe, se intentará resolver la descripción. Cantidad, stock, ubicación, sububicación, precio y datos similares no deben alterar el artículo ni la cantidad de filas agregadas.

Las coincidencias únicas se agregarán automáticamente. Las filas ambiguas, no encontradas o inconsistentes no se agregarán y aparecerán en un resumen final. Si el mismo artículo aparece en varias filas, se incorporará una vez por cada fila y el resumen advertirá la repetición sin abrir la confirmación individual existente.

Cuando Android entregue un Excel desde WhatsApp, Drive, el explorador de archivos u otra aplicación, Bitácora no debe volver a cargarlo automáticamente como maestro. Antes de navegar debe mostrar un modal de destino con las acciones, en este orden: `Usar como Excel maestro`, `Importar como listado` y `Cancelar`. La primera conserva el flujo actual; la segunda abre Listados y entrega allí el mismo archivo pendiente; la tercera elimina la copia temporal sin modificar datos.

## Objetivo principal

- Permitir cargar un Excel secundario desde el formulario del listado activo.
- Identificar artículos sin exigir posiciones fijas para las columnas.
- Priorizar coincidencias exactas por código y usar la descripción solo cuando no haya un código válido.
- Agregar automáticamente una fila por cada coincidencia única, incluidos los artículos repetidos en distintas filas.
- Informar al finalizar cuántos artículos se agregaron y qué filas quedaron repetidas, ambiguas, no encontradas o inconsistentes.
- Mantener esta función completamente local y separada de Capitana Bita.
- Pedir una decisión explícita antes de usar cualquier Excel recibido desde otra aplicación.
- Conservar la carga externa del Excel maestro y añadir la importación externa como listado sin inferir el destino por nombre, MIME ni acción Android.

## Contexto técnico verificado

- El proyecto usa Vue 3 con `script setup`, Quasar 2, Vite y Capacitor.
- `xlsx` ya está instalada y se utiliza en `src/components/BaseDeDatos/LectorExcel.js`; no se necesita una dependencia nueva.
- El catálogo maestro se obtiene mediante `obtenerArticulosCargados()` y cada artículo tiene como mínimo `codigo` y `nombre`, además de datos opcionales como `stock` y `ubicacionAntigua`.
- `src/pages/PaginaListados.vue` es responsable de crear filas, detectar repetidos, persistir el listado activo y coordinar los resultados de Capitana Bita.
- `crearFilaListado()` ya resuelve el stock y la ubicación locales y genera la estructura persistida de una fila de listado.
- `ServicioCoincidenciasEvidenciaArticulo.js` ya ofrece resolución determinista por código y descripción. La importación debe reutilizar sus normalizaciones y coincidencias, sin llamar a Firebase AI.
- La selección manual actual usa `FormularioListado.vue`; el input y el botón de cámara están dentro de `.fila-codigo-camara`.
- Los listados se persisten con `guardarListado()` mediante Capacitor Preferences.
- La confirmación individual de repetidos usada por `agregarArticulo()` no corresponde a la importación masiva: esta debe insertar el bloque completo y resumir los repetidos al finalizar.
- `android/app/src/main/AndroidManifest.xml` registra `MainActivity` para recibir Excel mediante `ACTION_SEND` y `ACTION_VIEW`; ambos casos llegan al mismo flujo y no identifican si el usuario pretende actualizar el maestro o importar un listado.
- `PluginArchivoCompartido.java` copia el archivo recibido al caché, guarda URI, nombre, MIME, identificador y acción en SharedPreferences, y publica `archivoRecibido`; este contrato nativo ya sirve para ambos destinos y no debe modificarse.
- `MainLayout.vue` ejecuta actualmente `redirigirExcelCompartidoPendiente()` y envía todo Excel externo a `/AjustarUbicaciones`.
- `SelectorExcel.vue` ejecuta actualmente `cargarExcelCompartidoPendiente()` al montarse y llama `cargarArticulosDesdeExcelCompartido()`, por lo que cualquier Excel pendiente reemplaza el maestro sin pedir destino.
- `ServicioArchivoCompartido.js` ya expone `obtenerArchivoCompartidoPendiente()`, `leerArchivoCompartidoComoBase64()`, `limpiarArchivoCompartidoPendiente()` y `escucharArchivoCompartido()`; deben reutilizarse sin duplicar acceso al plugin.
- `MainLayout.vue` usa `<router-view :key="$route.fullPath">`, por lo que agregar o retirar los parámetros del archivo compartido vuelve a montar la página destino.
- `ServicioBotonAtrasNativo.js` solo contempla actualmente el drawer como interacción global; debe generalizarse para cerrar correctamente el nuevo modal antes de delegar el botón Atrás a la página o al router.
- Los estilos deben usar las variables existentes de `src/css/app.css`, mantener CSS compacto y conservar nombres de archivos en PascalCase y símbolos en español.
- El comando general de lint es `npm run lint` y el build verificable es `npm run build`.

## Decisiones funcionales confirmadas

- El alcance de lectura es exclusivamente Excel `.xlsx` y `.xls`.
- El procesamiento del contenido es local y no usa Capitana Bita ni otra inteligencia artificial.
- Cada fila útil representa como máximo una incorporación; cantidad, stock, ubicación, sububicación, precio y costo se ignoran.
- Un artículo repetido en distintas filas se agrega una vez por cada fila y se informa al finalizar.
- Las coincidencias únicas se agregan automáticamente; las ambiguas, no encontradas e inconsistentes solo se informan.
- El código exacto tiene prioridad absoluta sobre cualquier descripción presente en la misma fila.
- El nuevo botón `Cargar Excel` aparece debajo del input y a la izquierda del botón `Escanear`, ambos con el mismo ancho.
- Un Excel externo siempre abre un modal interno antes de utilizarse.
- El modal muestra primero `Usar como Excel maestro`, segundo `Importar como listado` y tercero `Cancelar`.
- `Importar como listado` navega automáticamente a `/listados`.
- No se intentará decidir el destino a partir del nombre del archivo, `ACTION_SEND`, `ACTION_VIEW` ni el MIME porque esas señales no expresan de forma confiable la intención del usuario.

## Alcance

### Incluye

- Archivos `.xlsx` y `.xls` seleccionados desde Listados.
- Lectura de todas las hojas con datos del libro.
- Recorrido de todas las filas y columnas no excluidas por un encabezado reconocido.
- Detección flexible de encabezados de código, descripción y columnas ignoradas.
- Coincidencia exacta por código contra el Excel maestro.
- Coincidencia determinista por descripción cuando la fila no contiene un código exacto válido.
- Agregado automático y persistencia conjunta de todas las coincidencias únicas.
- Repetición deliberada de un artículo cuando aparece en varias filas del Excel importado.
- Resumen visual detallado de la importación.
- Diseño responsivo para teléfono y web/escritorio.
- Pruebas automatizadas del lector y del algoritmo de resolución.
- Recepción de Excel desde aplicaciones Android y selección explícita entre maestro y listado.
- Conservación temporal del archivo externo mientras Listados espera que exista un Excel maestro.

### No incluye

- PDF, Word, CSV, imágenes ni otros formatos.
- OCR, Capitana Bita, Firebase AI o cualquier procesamiento remoto.
- Lectura o aplicación de cantidad, stock, ubicación, sububicación, precio o costo desde el Excel importado.
- Modificación o reemplazo del Excel maestro.
- Corrección manual de filas ambiguas dentro del flujo de importación.
- Confirmaciones individuales para artículos repetidos durante la importación masiva.
- Persistencia del archivo importado después de terminar el análisis.
- Cambios en los intent filters, `MainActivity.java` o `PluginArchivoCompartido.java`; el contrato nativo actual se conserva.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Modales/ModalDestinoExcelCompartido.vue` | Crear | props `nombreArchivo`, `procesando`; eventos `usar-como-maestro`, `importar-como-listado`, `cancelar` | Pedir el destino de un Excel recibido externamente con el orden de acciones confirmado. |
| `src/layouts/MainLayout.vue` | Modificar | reemplazar `redirigirExcelCompartidoPendiente` por `revisarExcelCompartidoPendiente`; agregar selección y navegación | Interceptar el Excel externo, abrir el modal y entregar el identificador a la página elegida. |
| `src/components/Logica/Navegacion/ServicioBotonAtrasNativo.js` | Modificar | reemplazar `estaDrawerAbierto`/`cerrarDrawer` por `hayInteraccionGlobalAbierta`/`cerrarInteraccionGlobal` | Cerrar drawer o modales globales antes de navegar hacia atrás. |
| `src/pages/AjustarUbicaciones.vue` | Modificar | `identificadorExcelMaestroCompartido`, `finalizarExcelMaestroCompartido` | Autorizar explícitamente que `SelectorExcel` consuma el pendiente como maestro y limpiar la consulta al finalizar. |
| `src/components/Logica/Ubicaciones/SelectorExcel.vue` | Modificar | prop `identificadorArchivoCompartido`, evento `archivo-compartido-finalizado`, `cargarExcelCompartidoPendiente` | Eliminar el consumo automático y cargar como maestro solo el identificador autorizado. |
| `src/components/Logica/Listados/ServicioImportacionExcelListado.js` | Crear | `procesarArchivoExcelListado`, `procesarExcelCompartidoListado`, `analizarLibroExcelListado`, `clasificarFilaEncabezado`, `resolverFilaExcelListado` | Leer archivos locales o base64 nativo y resolver cada fila contra el catálogo maestro sin IA. |
| `src/components/Logica/Listados/PanelResultadoImportacionExcel.vue` | Crear | props `resultado`, evento `cerrar` | Mostrar cantidades, repetidos y filas que no pudieron agregarse. |
| `src/components/Logica/Listados/FormularioListado.vue` | Modificar | `seleccionarExcelListado`, `inputExcelListadoRef`, evento `archivo-excel-seleccionado` | Reorganizar el buscador y ofrecer el nuevo botón de importación junto a la cámara. |
| `src/pages/PaginaListados.vue` | Modificar | `importarExcelListado`, `procesarExcelCompartidoPendiente`, `ejecutarImportacionExcel`, `aplicarResultadoImportacionExcel`, `finalizarExcelCompartidoPendiente`, `resultadoImportacionExcel`, `importandoExcel`, `crearFilaListado` | Procesar selección local o archivo externo, agregar el bloque válido, persistirlo y presentar el resumen. |
| `Pruebas/Listados/ServicioImportacionExcelListado.test.js` | Crear | casos de `analizarLibroExcelListado` | Verificar hojas, columnas, prioridades, omisiones, ambigüedades y repetidos. |

## FASE 1: Elegir el destino de un Excel recibido en Android

### Objetivo

Evitar que un Excel abierto o compartido desde otra aplicación reemplace automáticamente el maestro y entregar el archivo pendiente únicamente al destino elegido por el usuario.

### Archivos y símbolos involucrados

- Archivo nuevo `src/components/Modales/ModalDestinoExcelCompartido.vue`.
- `src/layouts/MainLayout.vue`: recepción global, estado del modal y navegación.
- `src/components/Logica/Compartidos/ServicioArchivoCompartido.js`: API existente, sin duplicarla.
- `src/components/Logica/Navegacion/ServicioBotonAtrasNativo.js`: contrato de interacciones globales.
- `src/pages/AjustarUbicaciones.vue`: autorización de carga como maestro.
- `src/components/Logica/Ubicaciones/SelectorExcel.vue`: consumo condicionado por identificador.
- `src/pages/PaginaListados.vue`: recepción del archivo destinado a Listados.
- Verificar sin modificar `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/java/bitacora/v2/MainActivity.java` y `android/app/src/main/java/bitacora/v2/PluginArchivoCompartido.java`.

### Contrato de navegación

- Destino maestro: `/AjustarUbicaciones?destinoExcel=maestro&archivoCompartido=<identificador>`.
- Destino listado: `/listados?destinoExcel=listado&archivoCompartido=<identificador>`.
- `archivoCompartido` siempre contiene el identificador persistido por `PluginArchivoCompartido`; no usar fechas alternativas cuando ya exista ese identificador.
- `destinoExcel` solo admite `maestro` o `listado`; cualquier otro valor debe ignorarse y nunca autorizar el consumo del archivo.

### Pasos de ejecución

- [x] Crear `src/components/Modales/ModalDestinoExcelCompartido.vue` con responsabilidad exclusivamente visual.
  - Definir la prop `nombreArchivo` de tipo `String` con valor inicial `''`.
  - Definir la prop `procesando` de tipo `Boolean` con valor inicial `false` y deshabilitar las tres acciones mientras sea verdadera.
  - Definir exclusivamente los eventos `usar-como-maestro`, `importar-como-listado` y `cancelar`; `MainLayout` ya conoce la visibilidad mediante `excelCompartidoPendiente`.
  - Mostrar el título exacto `¿Cómo querés usar este Excel?` y el nombre del archivo cuando esté disponible.
  - Mostrar tres botones verticales en este orden exacto: `Usar como Excel maestro`, `Importar como listado` y `Cancelar`.
  - El primer botón emite `usar-como-maestro`, el segundo `importar-como-listado` y el tercero `cancelar`.
  - Pulsar el fondo del modal debe ejecutar la misma acción que `Cancelar`; no debe dejar un archivo pendiente oculto.
  - Usar `.modal-fondo` para la capa existente, `.modal-destino-excel` para la tarjeta, `.nombre-excel-compartido` para el nombre y `.acciones-destino-excel` para la columna de acciones.
  - Usar `.boton-destino-excel` como clase base y las variantes `.boton-destino-maestro`, `.boton-destino-listado` y `.boton-cancelar-destino` para mantener significado y orden explícitos.
  - Aplicar variables de `src/css/app.css`, botones táctiles de al menos 44 px, foco visible y textos que no desborden.
  - No importar router, servicios nativos, almacenamiento, `xlsx` ni lógica de Listados dentro del modal.
- [x] Reemplazar el comportamiento automático de `MainLayout.vue` por una decisión explícita.
  - Importar `watch` desde Vue, `ModalDestinoExcelCompartido` y `limpiarArchivoCompartidoPendiente`.
  - Crear `excelCompartidoPendiente = ref(null)`; su valor debe ser el contrato completo retornado por `obtenerArchivoCompartidoPendiente()` o `null`.
  - Crear `resolviendoDestinoExcel = ref(false)` para impedir dobles pulsaciones, limpiezas concurrentes y navegaciones duplicadas.
  - Reemplazar `redirigirExcelCompartidoPendiente()` por `revisarExcelCompartidoPendiente()`.
  - Hacer que `escucharArchivoCompartido()` invoque `revisarExcelCompartidoPendiente` y ejecutar también esa función al montar para cubrir inicio frío de la app.
  - Observar `router.currentRoute.value.fullPath` y volver a ejecutar `revisarExcelCompartidoPendiente()` después de cada navegación; si el usuario abandona una página que todavía conservaba un pendiente sin consumir, el selector de destino debe reaparecer en vez de dejar el archivo oculto hasta reiniciar.
  - `revisarExcelCompartidoPendiente()` debe validar URI, identificador y `esArchivoExcel()` antes de asignar el ref.
  - Si la ruta actual ya contiene el mismo `archivoCompartido` y un `destinoExcel` válido, no reabrir el modal: la página de destino ya es dueña del pendiente.
  - Si llega otro identificador mientras el modal está abierto, reemplazar el estado visual por el último archivo que el plugin dejó pendiente; nunca procesar dos URI bajo un mismo identificador.
  - Si el modal de actualización estuviera visible, cerrarlo al presentar el selector de Excel para impedir dos diálogos simultáneos; conservar `hayActualizacionDisponible` para que el indicador del menú no se pierda.
- [x] Agregar en `MainLayout.vue` las tres acciones del modal.
  - Las tres funciones deben retornar sin actuar cuando `resolviendoDestinoExcel` ya sea `true`; de lo contrario deben activarlo hasta completar su operación.
  - `usarExcelCompartidoComoMaestro()` captura el identificador actual y ejecuta `router.replace()` hacia el contrato de destino maestro.
  - `importarExcelCompartidoComoListado()` captura el identificador actual y ejecuta `router.replace()` hacia el contrato de destino listado.
  - Ninguna de las dos funciones debe limpiar el pendiente antes de navegar; la página elegida lo limpia solo después de consumirlo o descartarlo.
  - Tras navegar, poner `excelCompartidoPendiente` en `null` solo si su identificador todavía coincide con el capturado; si llegó un archivo nuevo durante la operación, conservarlo para presentar su propio modal.
  - Si la navegación falla, conservar `excelCompartidoPendiente` y registrar un error legible, sin perder el archivo temporal.
  - `cancelarExcelCompartido()` debe llamar `limpiarArchivoCompartidoPendiente(identificador)` y poner el ref en `null` únicamente cuando el servicio confirme `exito: true`; si falla, conservar el modal para permitir reintento.
  - Restablecer `resolviendoDestinoExcel` en `finally` en las tres funciones.
  - Montar `ModalDestinoExcelCompartido` al final de `q-layout` con `v-if="excelCompartidoPendiente"`, pasar `:procesando="resolviendoDestinoExcel"` y conectar los tres eventos a estas funciones.
- [x] Integrar el modal con el estado global y el botón Atrás.
  - Crear `hayModalGlobalActivo = computed(() => modalActivo.value || mostrarModalActualizacion.value || Boolean(excelCompartidoPendiente.value))` y pasarlo a `BarraBotonesInferior` en lugar de `modalActivo` para bloquear acciones inferiores detrás del diálogo.
  - En `ServicioBotonAtrasNativo.js`, renombrar dentro de `estadoBotonAtras` las claves `estaDrawerAbierto` y `cerrarDrawer` a `hayInteraccionGlobalAbierta` y `cerrarInteraccionGlobal`.
  - Actualizar `limpiarEstadoBotonAtrasNativo()` y `manejarBotonAtrasNativo()` con esos nombres; no dejar compatibilidad duplicada porque `MainLayout.vue` es el único consumidor verificado.
  - En `MainLayout.vue`, pasar `hayInteraccionGlobalAbierta()` y `cerrarInteraccionGlobal()` a `configurarEstadoBotonAtrasNativo()`.
  - Aplicar este orden dentro de `cerrarInteraccionGlobal()`: cerrar drawer; cancelar el selector de Excel mediante `cancelarExcelCompartido()`; cerrar el modal de actualización. Ejecutar una sola acción por pulsación.
  - Permitir que `cerrarInteraccionGlobal()` sea asíncrona y hacer que `manejarBotonAtrasNativo()` espere su resultado antes de continuar.
- [x] Impedir que `SelectorExcel.vue` consuma cualquier pendiente sin autorización.
  - Cambiar el `defineProps()` actual a `const props = defineProps()`.
  - Agregar `identificadorArchivoCompartido: { type: String, default: '' }`.
  - Agregar el evento `archivo-compartido-finalizado` a `defineEmits`; su payload será `{ identificador, resultado }`, donde `resultado` será `cargado`, `descartado` o `noDisponible`.
  - Cambiar la firma a `cargarExcelCompartidoPendiente(identificadorAutorizado)`.
  - Retornar `false` sin leer base64 cuando el identificador autorizado esté vacío.
  - Si existe identificador autorizado pero no hay un Excel pendiente con ese mismo identificador, emitir `archivo-compartido-finalizado` con resultado `noDisponible`; no limpiar un pendiente diferente.
  - En `onMounted()`, llamar `cargarExcelCompartidoPendiente(props.identificadorArchivoCompartido)` únicamente cuando la prop tenga valor; eliminar el consumo incondicional actual.
  - Tras cargar exitosamente y limpiar el pendiente, emitir `archivo-compartido-finalizado` con resultado `cargado`.
  - `descartarExcelCompartido()` debe limpiar exactamente el identificador autorizado o pendiente y emitir resultado `descartado` solo si la limpieza fue exitosa.
  - Mantener las acciones actuales de reintento cuando la lectura o carga del maestro falle; el archivo no se considera finalizado mientras el usuario pueda reintentarlo.
- [x] Autorizar el destino maestro desde `AjustarUbicaciones.vue`.
  - Importar `useRoute` y `useRouter` desde `vue-router` y crear `route` y `router`.
  - Crear `identificadorExcelMaestroCompartido = computed()` que retorne `route.query.archivoCompartido` únicamente cuando `route.query.destinoExcel === 'maestro'`; en cualquier otro caso retorna `''`.
  - Pasar `:identificador-archivo-compartido="identificadorExcelMaestroCompartido"` a `SelectorExcel`.
  - Escuchar `@archivo-compartido-finalizado="finalizarExcelMaestroCompartido"`.
  - Crear `finalizarExcelMaestroCompartido({ identificador })` para comprobar que coincide con la consulta actual y ejecutar `router.replace()` conservando los demás query params, pero eliminando `destinoExcel` y `archivoCompartido`.
  - No cambiar `manejarBaseDatosCargada()` ni la persistencia de `LectorExcel.js`: elegir maestro debe producir el mismo resultado funcional actual.
- [x] Preparar la entrega al destino Listados sin consumir aún el archivo.
  - `PaginaListados.vue` debe validar los query params mediante `useRoute`; la lectura y limpieza efectiva se detallan en la fase de integración.
  - Si no existe un maestro cargado, mantener intactos URI e identificador nativos, abrir igualmente `/listados` y mostrar `Cargá primero el Excel maestro; después importaremos el listado recibido.`.
  - Al renderizar `SelectorExcel` desde `FormularioListado.vue` por falta de maestro, no pasar `identificadorArchivoCompartido`; así el archivo destinado al listado nunca puede cargarse accidentalmente como base.
- [x] Verificar que no se requieren cambios nativos.
  - Mantener los intent filters de Excel para `ACTION_SEND` y `ACTION_VIEW`.
  - Mantener `launchMode="singleTask"`, `MainActivity.onNewIntent()` y la copia a caché del plugin.
  - Mantener la limpieza condicionada por identificador para que un consumidor antiguo no elimine un archivo nuevo recibido mientras procesaba otro.

## FASE 2: Crear el lector y resolver las filas del Excel

### Objetivo

Obtener un resultado determinista y ordenado de todas las filas útiles del libro, sin modificar el catálogo maestro ni el listado activo.

### Archivos y símbolos involucrados

- Archivo nuevo `src/components/Logica/Listados/ServicioImportacionExcelListado.js`.
- Reutilizar de `src/components/Logica/Compartidos/ServicioCoincidenciasEvidenciaArticulo.js`: `crearIndiceCodigosMaestro` y `resolverCoincidenciasPorEvidencia`.
- Reutilizar de `src/components/Logica/Compartidos/ServicioBusquedaArticulos.js`: `normalizarTextoComparacionArticulo` y las reglas de contexto ya existentes.

### Pasos de ejecución

- [x] Crear `ServicioImportacionExcelListado.js` con importación de `xlsx` y sin dependencias de Capitana Bita.
  - Exportar `procesarArchivoExcelListado({ archivo, articulos, contextoBusqueda })` como entrada para el selector local.
  - Validar que `archivo` exista y que su nombre o MIME corresponda a `.xlsx` o `.xls`.
  - Leer `archivo.arrayBuffer()` y delegar el análisis a una función separada y testeable.
  - Exportar `procesarExcelCompartidoListado({ base64, nombreArchivo, tipoArchivo, articulos, contextoBusqueda })` como entrada para Android.
  - Validar nombre/MIME y convertir el base64 sin encabezado `data:` a `Uint8Array.buffer`; no crear un `File` artificial ni duplicar innecesariamente los bytes.
  - Hacer que ambas entradas públicas deleguen exclusivamente en `analizarLibroExcelListado()` para que archivo local y archivo compartido produzcan el mismo resultado.
  - Devolver errores en español para archivo inválido, libro vacío, archivo corrupto o catálogo maestro inexistente.
- [x] Exportar `analizarLibroExcelListado({ buffer, nombreArchivo, articulos, contextoBusqueda })` como núcleo testeable.
  - Abrir el libro con `XLSX.read(buffer, { type: 'array' })`.
  - Recorrer `SheetNames` en su orden original, sin limitarse a la primera hoja.
  - Convertir cada hoja mediante `XLSX.utils.sheet_to_json()` usando `header: 1`, `raw: false`, `defval: ''` y `blankrows: false` para trabajar con valores visibles y preservar códigos formateados, incluidos ceros iniciales cuando el formato de Excel los represente.
  - Mantener por cada fila su hoja, número real de fila, índice global y valores normalizados para el resumen y el orden de inserción.
- [x] Definir constantes internas de encabezados normalizados para clasificar columnas sin exigir nombres exactos.
  - Crear `ENCABEZADOS_CODIGO`, `ENCABEZADOS_DESCRIPCION` y `ENCABEZADOS_IGNORADOS` como `Set` internos.
  - `ENCABEZADOS_CODIGO` debe contener exactamente `CODIGO`, `COD`, `ARTICULO`, `SKU` y `REFERENCIA` después de normalizar.
  - `ENCABEZADOS_DESCRIPCION` debe contener exactamente `DESCRIPCION`, `DESC`, `NOMBRE`, `DETALLE` y `PRODUCTO`.
  - `ENCABEZADOS_IGNORADOS` debe contener exactamente `CANTIDAD`, `CANT`, `UNIDADES`, `STOCK`, `UBICACION`, `UBIC`, `SUBUBICACION`, `PRECIO`, `COSTO` y `DEPOSITO`.
  - Normalizar encabezados eliminando diferencias de mayúsculas, acentos y espacios.
  - Tratar una fila como encabezado cuando tenga al menos dos celdas pertenecientes a cualquiera de los tres conjuntos, o cuando tenga una sola celda reconocida y todas las demás celdas no vacías también sean encabezados reconocidos.
  - Recorrer toda la hoja y permitir que una fila de encabezado válida actualice el mapa de columnas para las filas siguientes; esto admite encabezados alejados del inicio o varias tablas sin imponer un límite arbitrario de filas.
  - Excluir cada fila reconocida como encabezado del análisis y del total de filas útiles.
  - Si todavía no apareció un encabezado válido, analizar todas las columnas de la fila.
  - No convertir el valor de ninguna columna ignorada en cantidad, stock, ubicación ni metadatos del listado.
  - Implementar `clasificarFilaEncabezado(valores)` para devolver `{ esEncabezado, indicesCodigo, indicesDescripcion, indicesIgnorados }`; mantenerla interna porque ningún consumidor debe conocer el formato de columnas.
- [x] Implementar una resolución por fila con prioridad absoluta para el código exacto.
  - Crear la función interna `resolverFilaExcelListado({ valores, mapaColumnas, indiceCodigos, articulos, contextoBusqueda, hoja, numeroFila, indiceGlobal })` y hacer que retorne exactamente una resolución o `null` para una fila vacía.
  - Inspeccionar todas las celdas no excluidas de la fila, aunque el código no esté en una columna llamada `Código`.
  - Comparar los valores normalizados contra el índice exacto de códigos del catálogo maestro.
  - Si una o varias celdas identifican el mismo código único, devolver estado `unica` y un solo artículo para esa fila.
  - Si una misma fila contiene códigos exactos de artículos diferentes, devolver estado `ambigua` y no elegir automáticamente.
  - Si el código exacto está duplicado dentro del catálogo maestro, devolver estado `inconsistente` y no agregarlo.
  - Una vez encontrado un código exacto único, no usar el resto de las celdas como descripción: el código debe prevalecer y los datos auxiliares deben ignorarse.
- [x] Implementar la búsqueda por descripción únicamente cuando no exista ningún código exacto válido en la fila.
  - Si se reconoció una columna de descripción, usar primero sus celdas de texto no vacías.
  - Si no se reconocieron encabezados, considerar como posibles descripciones las celdas de texto no vacías y no puramente numéricas.
  - Resolver cada texto posible con `resolverCoincidenciasPorEvidencia`, pasando `codigoVisible: ''`, el texto como `descripcionVisible` y el `contextoBusqueda` del listado activo.
  - Priorizar en este orden: coincidencia exacta del nombre normalizado completo; coincidencia compatible con un solo candidato; coincidencia compatible con varios candidatos.
  - Si una celda produce un único candidato y ninguna otra celda produce un candidato único diferente, devolver ese artículo como `unica`, aunque otra celda genérica de la fila produzca varios candidatos que lo incluyan.
  - Si distintas celdas producen candidatos únicos diferentes, devolver `ambigua` con la unión de esos artículos.
  - Si ninguna celda produce un único candidato y las coincidencias compatibles dejan varios artículos, devolver `ambigua` con candidatos sin duplicar por identidad del artículo.
  - Si ninguna evidencia produce candidatos, devolver estado `noEncontrada`.
- [x] Tratar cada fila como una sola unidad independiente.
  - Nunca usar una celda de cantidad para multiplicar incorporaciones.
  - Si el mismo código se resuelve en dos o más filas, conservar todas las resoluciones `unica` en el orden original.
  - Si el mismo código aparece varias veces dentro de una sola fila, generar una sola resolución porque la regla funcional es una incorporación por fila.
  - Excluir filas completamente vacías y la fila usada como encabezado del total de filas útiles.
- [x] Devolver un contrato estable desde `analizarLibroExcelListado`.
  - Incluir `nombreArchivo`, `totalHojas`, `totalFilasUtiles` y `resoluciones` en orden de hoja y fila.
  - Cada resolución debe incluir `idFilaImportada`, `hoja`, `numeroFila`, `textoOriginal`, `estado`, `articuloUnico` y `candidatos`.
  - Los estados permitidos deben ser `unica`, `ambigua`, `noEncontrada` e `inconsistente`.
  - Incluir un motivo legible en español para estados ambiguos e inconsistentes.
  - No incluir objetos de archivo, buffers ni datos binarios en el resultado final.
  - Considerar terminado el análisis cuando un mismo `buffer`, catálogo y contexto produzcan siempre resoluciones idénticas y en el mismo orden.

## FASE 3: Incorporar el selector de Excel al formulario

### Objetivo

Mostrar el buscador en una línea completa y, debajo, dos botones del mismo ancho: `Cargar Excel` y `Escanear`.

### Archivos y símbolos involucrados

- `src/components/Logica/Listados/FormularioListado.vue`: plantilla, props, emits, referencias, métodos expuestos y estilos scoped.
- Estilos globales existentes de `src/css/app.css`: `.camara-ubicacion`, `.fila-codigo-camara` y `.contenedor-input-codigo`, solo como referencia para evitar afectar Ubicaciones y otras pantallas.

### Pasos de ejecución

- [x] Reorganizar el bloque actual `.fila-codigo-camara` sin cambiar el buscador ni `BuscadorArticulos`.
  - Mantener `.contenedor-input-codigo` con el input, el botón de copiar y el desplegable de resultados ocupando el ancho completo.
  - Crear debajo la fila scoped `.acciones-entrada-listado`, con dos columnas iguales.
  - Usar `.boton-accion-entrada-listado` como clase base compartida por ambos botones.
  - Colocar primero `.boton-importar-excel-listado` con `IconFileSpreadsheet` y el texto visible `Cargar Excel`.
  - Mover la acción de cámara a `.boton-escanear-listado`, conservar `abrirCamara()` y mostrar el texto `Escanear`.
  - Retirar `.camara-ubicacion` solamente de este botón; no eliminar ni cambiar la clase global porque continúa usándose en Ubicaciones y otros formularios.
  - Reutilizar colores de `src/css/app.css`; no introducir colores literales nuevos.
- [x] Agregar un input de archivo oculto y controlado por el formulario.
  - Crear `inputExcelListadoRef = ref(null)` con clase `.input-excel-listado-oculto`, `type="file"` y `accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`.
  - Crear `seleccionarExcelListado()` para limpiar el valor anterior y abrir el selector, permitiendo volver a elegir el mismo archivo.
  - Crear `manejarArchivoExcelSeleccionado(evento)` para tomar exclusivamente el primer archivo y emitir `archivo-excel-seleccionado` con el objeto `File`.
  - No leer ni procesar el libro dentro del componente visual.
- [x] Ampliar el contrato de `FormularioListado`.
  - Agregar la prop booleana `importandoExcel`, con valor inicial `false`.
  - Agregar `archivo-excel-seleccionado` a `defineEmits`.
  - Deshabilitar ambos botones, el input y las interacciones incompatibles cuando `busquedaDeshabilitada` o `importandoExcel` estén activos.
  - Mostrar `Procesando…` en el botón de Excel durante la importación y usar `IconLoader2` con la animación ya presente o una animación scoped consistente.
  - Incorporar el selector abierto al método `cerrarInteraccion()` solo si existe una interacción cancelable real; no simular que se puede cancelar un diálogo nativo ya entregado al sistema.
- [x] Ajustar la experiencia responsiva.
  - Mantener ambos botones en una fila de dos columnas en teléfonos y escritorio.
  - Usar ancho disponible, separación uniforme y altura táctil mínima coherente con los controles existentes.
  - Evitar desbordamiento del texto en anchos pequeños y mantener visibles los iconos.
  - No modificar las clases globales compartidas de cámara si el mismo resultado puede obtenerse con estilos scoped del formulario.

## FASE 4: Integrar la importación automática con el listado activo

### Objetivo

Procesar el archivo seleccionado, insertar todas las coincidencias únicas mediante una sola persistencia y conservar los fallos para el resumen.

### Archivos y símbolos involucrados

- `src/pages/PaginaListados.vue`: `FormularioListado`, `ocupado`, `crearFilaListado`, `persistirActivo`, cambios de listado, recepción externa y navegación atrás.
- `src/components/Logica/Listados/ServicioImportacionExcelListado.js`: `procesarArchivoExcelListado`, `procesarExcelCompartidoListado`.
- `src/components/Logica/Compartidos/ServicioArchivoCompartido.js`: lectura y limpieza del pendiente nativo existente.

### Pasos de ejecución

- [x] Agregar el estado de importación en `PaginaListados.vue`.
  - Importar `useRoute` y `useRouter`, crear `route` y `router`, e importar `esArchivoExcel`, `obtenerArchivoCompartidoPendiente`, `leerArchivoCompartidoComoBase64` y `limpiarArchivoCompartidoPendiente`.
  - Crear `importandoExcel = ref(false)`.
  - Crear `resultadoImportacionExcel = ref(null)`.
  - Crear `esperandoMaestroParaImportar = ref(false)` para distinguir un pendiente válido que todavía no puede analizarse por falta del catálogo.
  - Incluir `importandoExcel.value` dentro de `ocupado` para bloquear administración, exportación, búsqueda y cámara mientras se procesa y persiste el archivo.
  - Pasar `:importando-excel="importandoExcel"` a `FormularioListado` y escuchar `@archivo-excel-seleccionado="importarExcelListado"`.
- [x] Implementar `importarExcelListado(archivo)`.
  - Verificar que haya un listado activo, que el catálogo maestro esté cargado y que no exista otra operación ocupada.
  - Llamar `ejecutarImportacionExcel()` pasando una función `obtenerResultado` que invoque `procesarArchivoExcelListado()` con el archivo, `obtenerArticulosCargados()` y `listadoActivo.value.contextoBusqueda`.
  - No enviar el archivo, sus filas ni sus resultados a `ServicioCapitanaBita.js`.
- [x] Implementar `procesarExcelCompartidoPendiente()` para el destino externo.
  - Validar que `route.query.destinoExcel === 'listado'` y obtener `route.query.archivoCompartido` como string no vacío.
  - Consultar el pendiente nativo y exigir que URI, formato e identificador coincidan con la consulta; si no coinciden, retirar ambos query params mediante `limpiarConsultaExcelCompartido()` sin tocar otro pendiente diferente.
  - Si no hay maestro cargado, asignar `esperandoMaestroParaImportar.value = true`, mostrar una sola vez el aviso `Cargá primero el Excel maestro; después importaremos el listado recibido.` y retornar sin leer ni limpiar el pendiente.
  - Si hay maestro, poner `esperandoMaestroParaImportar.value = false` y llamar `ejecutarImportacionExcel()` con el identificador y una función `obtenerResultado` que lea el base64 e invoque `procesarExcelCompartidoListado()` con nombre, MIME, catálogo y contexto actuales.
- [x] Implementar el ciclo de vida del pendiente externo en `PaginaListados.vue`.
  - Crear `limpiarConsultaExcelCompartido()` para conservar cualquier query param ajeno y eliminar solo `destinoExcel` y `archivoCompartido` mediante `router.replace()`.
  - Crear `finalizarExcelCompartidoPendiente(identificador, { conservarConsulta = false } = {})` para llamar `limpiarArchivoCompartidoPendiente(identificador)`; nunca invocar la limpieza sin el identificador esperado.
  - Cuando `conservarConsulta` sea `false`, ejecutar después `limpiarConsultaExcelCompartido()` aunque la limpieza nativa retorne `exito: false`; la validación por identificador garantiza que un archivo nuevo no sea eliminado.
  - Cuando `conservarConsulta` sea `true`, limpiar el archivo nativo pero mantener temporalmente los query params para que `<router-view :key="$route.fullPath">` no remonte la página y borre el resumen recién creado.
  - Ejecutar `procesarExcelCompartidoPendiente()` en `onMounted()` solamente después de `inicializarBaseDatos()`, `cargarDatosLocales()` y `cargarListados()`.
  - Después de una carga manual exitosa del maestro en `manejarBaseCargada(datos)`, volver a ejecutar `procesarExcelCompartidoPendiente()` cuando `esperandoMaestroParaImportar` sea `true`.
  - Agregar un `watch()` sobre ambos query params para cubrir recepción de otro archivo mientras `PaginaListados` ya está montada; impedir dobles ejecuciones mediante `importandoExcel` y el identificador en curso.
  - Crear `identificadorExcelCompartidoEnProceso = ref('')`; asignarlo antes de leer y limpiarlo en `finally` para que un evento repetido no duplique filas.
- [x] Crear `ejecutarImportacionExcel({ obtenerResultado, identificadorCompartido = '' })` como orquestador único.
  - Retornar si `importandoExcel` ya es `true`, si no hay listado activo o si `obtenerResultado` no es una función.
  - Activar `importandoExcel`, guardar `identificadorCompartido` en `identificadorExcelCompartidoEnProceso` y cerrar resultados anteriores de esta importación, sin alterar Capitana Bita.
  - Ejecutar `const resultadoAnalisis = await obtenerResultado()` y después `resultadoImportacionExcel.value = await aplicarResultadoImportacionExcel(resultadoAnalisis, { identificadorCompartido })`.
  - Si la aplicación y persistencia terminan correctamente y existe identificador, llamar `finalizarExcelCompartidoPendiente(identificadorCompartido, { conservarConsulta: true })`; el identificador ya debe formar parte del resumen retornado.
  - Si falla lectura, análisis o persistencia, confiar en el rollback de `aplicarResultadoImportacionExcel()`, mostrar una notificación negativa y no presentar como agregado ningún artículo revertido.
  - Cuando el origen sea externo y falle, limpiar ese archivo temporal y los query params para evitar reapertura indefinida; indicar al usuario que vuelva a compartirlo.
  - En `finally`, restablecer `importandoExcel`, limpiar el identificador en proceso y devolver el foco al buscador.
- [x] Crear `aplicarResultadoImportacionExcel(resultadoAnalisis, { identificadorCompartido = '' } = {})` como única función de inserción y resumen.
  - Separar resoluciones únicas, ambiguas, no encontradas e inconsistentes.
  - Capturar `articulosAnteriores = [...listadoActivo.value.articulos]` y el conteo de sus códigos antes de modificar el listado.
  - Retornar el objeto completo que se asignará a `resultadoImportacionExcel`; incluir `identificadorCompartido` sin leer el router dentro de esta función.
  - No conocer si el resultado vino de un `File` local o del plugin nativo.
- [x] Insertar automáticamente todas las resoluciones únicas como un bloque.
  - Reutilizar `crearFilaListado()` para conservar `idFila`, código normalizado, descripción del maestro, stock y ubicación locales.
  - No llamar `agregarArticulo()`, porque esa función abre la confirmación individual de repetidos.
  - Generar una fila nueva por cada resolución única aunque su código ya exista en el listado o haya aparecido antes en el mismo archivo.
  - Recorrer las resoluciones únicas en sentido inverso al llamar `crearFilaListado()`; como esa función asigna fechas crecientes y el orden predeterminado es descendente, la primera fila del Excel debe quedar visualmente antes que la segunda.
  - Guardar los identificadores generados en `idsFilasImportadas`, agregar temporalmente todas las filas al listado activo y llamar `persistirActivo()` una sola vez cuando exista al menos una fila nueva.
  - Si la persistencia falla, restaurar exactamente `listadoActivo.value.articulos = articulosAnteriores` y relanzar el error; no intentar persistir parcialmente.
  - Si no hay resoluciones únicas, no llamar `persistirActivo()` y devolver igualmente un resumen válido con cero agregados.
- [x] Calcular los repetidos para el resumen sin impedir la inserción.
  - Contar códigos repetidos entre las resoluciones únicas del propio archivo.
  - Detectar también cuántas apariciones del código ya existían en el listado antes de importar.
  - Crear para cada código repetido un registro con código, descripción, cantidad de filas importadas y cantidad previa en el listado.
  - No reutilizar `articuloPendienteRepetido`, no abrir el aviso `aviso-articulo-repetido` y no detener la importación.
- [x] Construir `resultadoImportacionExcel` después de completar la persistencia.
  - Incluir el nombre del archivo, hojas y filas útiles analizadas, cantidad realmente agregada, repetidos, ambiguas, no encontradas, inconsistencias e `identificadorCompartido` cuando corresponda.
  - Considerar éxito válido un archivo sin coincidencias únicas: mostrar el resumen con cero agregados y los problemas encontrados.
  - Mostrar una notificación positiva breve con la cantidad agregada y dejar el detalle en el panel.
  - Ante error de lectura o persistencia, usar `Notify` con mensaje negativo y no presentar como agregado ningún artículo revertido.
  - Mantener en esta función solamente la construcción del resumen; el estado ocupado y el foco pertenecen a `ejecutarImportacionExcel()`.
- [x] Limpiar correctamente el estado al cambiar de contexto.
  - Crear `cerrarResultadoImportacionExcel()` para capturar `resultadoImportacionExcel.value?.identificadorCompartido`, cerrar el panel y llamar `limpiarConsultaExcelCompartido()` únicamente cuando ese identificador coincida con la consulta actual.
  - Crear `limpiarEstadoImportacionExcel()` para retirar el resultado visual y los estados transitorios sin borrar archivos nativos ni query params por su cuenta.
  - Limpiar el resultado al crear, abrir, duplicar o eliminar un listado para impedir que un resumen anterior aparezca asociado a otro listado.
  - En `cerrarPasoAtrasNativo()`, cerrar primero las interacciones activas del formulario y después el panel de importación antes de continuar con otros estados cerrables.
  - No mezclar `resultadoImportacionExcel` con `resultadoPendienteCapitanaBita`; ambos flujos deben poder mantenerse separados.
  - No limpiar un archivo externo que espera la carga del maestro cuando se cambie de listado dentro de la misma página; el query y el identificador siguen definiendo el destino hasta que se procese o falle.

## FASE 5: Mostrar el resumen final de importación

### Objetivo

Dar un resultado comprensible de lo agregado automáticamente y de cada fila que requirió advertencia.

### Archivos y símbolos involucrados

- Archivo nuevo `src/components/Logica/Listados/PanelResultadoImportacionExcel.vue`.
- `src/pages/PaginaListados.vue`: montaje del panel y evento `cerrar`.

### Pasos de ejecución

- [x] Crear `PanelResultadoImportacionExcel.vue` como componente de presentación.
  - Definir la prop `resultado` de tipo `Object`, requerida.
  - Definir el evento `cerrar`.
  - No realizar búsquedas, mutaciones del listado ni persistencia dentro del panel.
  - Usar iconos de `@tabler/icons-vue` y variables de color ya existentes.
- [x] Mostrar un encabezado con resultado general.
  - Informar el nombre del archivo.
  - Mostrar `Se agregaron N artículos de M filas útiles`.
  - Incluir un botón accesible para cerrar el resumen.
- [x] Mostrar secciones únicamente cuando tengan contenido.
  - `Repetidos agregados`: código, descripción, cantidad de filas del Excel y cantidad que ya existía en el listado.
  - `Filas ambiguas`: hoja, número de fila, texto original, motivo y códigos/descripciones candidatos.
  - `No encontrados`: hoja, número de fila y texto original.
  - `Inconsistencias`: hoja, número de fila, texto original y motivo, incluidos códigos duplicados en el catálogo maestro.
  - Aclarar que las filas ambiguas, no encontradas e inconsistentes no fueron agregadas.
- [x] Integrar el panel en `PaginaListados.vue`.
  - Ubicarlo dentro de `.zona-agregar-listado`, inmediatamente después de `FormularioListado` y antes de otros paneles o de `Columnas visibles`.
  - Pasar `:resultado="resultadoImportacionExcel"` y conectar `@cerrar="cerrarResultadoImportacionExcel"`.
  - Mantener `aria-live="polite"` para anunciar el final del proceso sin convertir el panel en un diálogo bloqueante.
  - Comprobar que una importación externa mantenga el panel visible hasta que el usuario lo cierre; cerrar el panel puede retirar entonces los query params y remontar la página porque las filas ya quedaron persistidas.
- [x] Ajustar el diseño responsivo.
  - Presentar las secciones en una columna en teléfono.
  - Permitir que códigos, descripciones y nombres de hojas largos hagan salto de línea sin desbordar.
  - En escritorio, aprovechar el ancho disponible sin crear tablas horizontales difíciles de leer.
  - Mantener botones con área táctil suficiente y contraste basado en los tokens existentes.

## FASE TESTING

### Objetivo

Validar que cualquier formato razonable de Excel se recorra completamente, que una fila produzca como máximo una incorporación, que los datos excluidos nunca afecten el listado y que el flujo sea seguro en móvil y web.

### Pruebas automatizadas

- [x] Crear `Pruebas/Listados/ServicioImportacionExcelListado.test.js` con `node:test`, `node:assert/strict` y libros generados en memoria mediante `xlsx`.
  - Verificar un libro con código y descripción en columnas habituales.
  - Verificar código en una columna no predeterminada.
  - Verificar varias hojas y preservar su orden.
  - Verificar un libro sin encabezados.
  - Verificar encabezados con mayúsculas, minúsculas y acentos.
  - Verificar códigos representados como texto y códigos con ceros iniciales visibles.
  - Verificar que un código exacto prevalezca sobre otros textos de la fila.
  - Verificar que una descripción única se resuelva cuando no hay código.
  - Verificar descripción ambigua, descripción inexistente, varios códigos diferentes en una fila y código duplicado en el maestro.
  - Verificar que cantidad, stock, ubicación, sububicación, precio y costo no multipliquen filas ni modifiquen los artículos.
  - Verificar que tres filas con el mismo artículo generen tres resoluciones únicas y el mismo código.
  - Verificar que el mismo código repetido dentro de una sola fila produzca una única resolución.
  - Verificar que filas vacías y encabezados no se cuenten como filas útiles.
  - Verificar un encabezado ubicado después de filas introductorias y un segundo encabezado dentro de la misma hoja.
  - Verificar que una celda descriptiva única prevalezca frente a otra celda genérica cuyos candidatos incluyen el mismo artículo.
  - Verificar que dos celdas que señalan artículos únicos diferentes produzcan estado `ambigua`.
  - Verificar que `procesarArchivoExcelListado()` y `procesarExcelCompartidoListado()` entreguen el mismo resultado para los mismos bytes.
- [x] Ejecutar la prueba nueva directamente y exigir cero fallos:

  ```text
  node --test Pruebas/Listados/ServicioImportacionExcelListado.test.js
  ```

- [x] Ejecutar las pruebas existentes para comprobar que la resolución reutilizada de Capitana Bita no cambió:

  ```text
  npm test
  ```

- [x] Ejecutar ESLint y corregir todos los errores relacionados con los archivos modificados o creados:

  ```text
  npm run lint
  ```

- [x] Ejecutar el build completo de Quasar y comprobar que `xlsx` funciona dentro del bundle web/Capacitor:

  ```text
  npm run build
  ```

- [x] Después de completar lint, pruebas y build, ejecutar el flujo Android oficial para sincronizar la WebView, generar el AAB y abrir Android Studio:

  ```text
  npm run cel
  ```

### Pruebas manuales

- [ ] Desde WhatsApp o el explorador de Android, abrir y compartir un `.xlsx` con Bitácora; ambos caminos deben mostrar el mismo modal sin navegar antes de elegir.
- [ ] Repetir la selección local y externa con un `.xls` válido para comprobar ambos formatos admitidos.
- [ ] Comprobar que el modal muestre, en orden vertical, `Usar como Excel maestro`, `Importar como listado` y `Cancelar`.
- [ ] Elegir `Usar como Excel maestro` y comprobar que navegue a Ubicaciones, cargue la base mediante el flujo actual y retire los query params al finalizar.
- [ ] Elegir `Importar como listado` con un maestro existente y comprobar que navegue a Listados, procese una sola vez el archivo, agregue coincidencias y elimine la copia temporal.
- [ ] Confirmar que el resumen de una importación externa no desaparezca al limpiar el archivo nativo y que los query params se retiren recién al cerrar ese resumen.
- [ ] Elegir `Importar como listado` sin maestro cargado y comprobar que el archivo no se convierta en maestro, permanezca pendiente, solicite cargar la base y se importe automáticamente después de esa carga manual.
- [ ] Pulsar `Cancelar`, tocar fuera del modal y usar el botón Atrás de Android en pruebas separadas; cada acción debe limpiar el pendiente sin reemplazar el maestro ni importar filas.
- [ ] Forzar un identificador distinto entre query y plugin; la página no debe leer ni borrar el archivo nuevo mediante el identificador anterior.
- [ ] Recibir un segundo Excel mientras el modal muestra el primero y verificar que solo el último pendiente pueda elegirse y consumirse.
- [ ] Reiniciar la aplicación con un archivo pendiente sin destino y comprobar que reaparezca el modal; reiniciarla con un destino válido ya escrito en la ruta y comprobar que la página continúe el consumo sin duplicar el modal.
- [ ] Elegir un destino, abandonar la página antes de que el archivo pueda consumirse y comprobar que `MainLayout` vuelva a presentar el modal para el pendiente.
- [ ] Comprobar que el modal de actualización y el selector de destino no aparezcan simultáneamente, y que el indicador de actualización siga disponible en el menú.
- [ ] Cargar primero el Excel maestro y abrir un listado activo vacío.
- [ ] Verificar que el input ocupe una fila completa y que debajo aparezcan `Cargar Excel` y `Escanear` con el mismo ancho.
- [ ] Importar un Excel con códigos exactos distribuidos en columnas diferentes y comprobar que se agreguen automáticamente.
- [ ] Importar un Excel que contenga únicamente descripciones y comprobar que solo se agreguen coincidencias únicas.
- [ ] Importar un Excel con columnas de cantidad, stock, ubicación, sububicación y precio y confirmar que esos valores no cambien el número de incorporaciones ni los campos locales.
- [ ] Importar tres filas del mismo artículo y comprobar que aparezcan tres filas en el listado sin confirmaciones intermedias y con advertencia de repetido en el resumen.
- [ ] Importar filas ambiguas, inexistentes e inconsistentes y comprobar que no se agreguen, pero sí aparezcan con hoja y número de fila.
- [ ] Verificar que cerrar el resumen no elimine los artículos importados.
- [ ] Verificar que cambiar de listado cierre el resumen anterior y no transfiera resultados ni filas al nuevo listado.
- [ ] Simular un archivo corrupto o con extensión incorrecta y comprobar que el listado permanezca intacto.
- [ ] Verificar que una falla de persistencia revierta solamente el bloque nuevo.
- [ ] Confirmar que la función continúa disponible sin conexión y que no genera solicitudes de red ni registros de Capitana Bita.

### Casos responsivos

- [ ] Probar teléfono angosto: input completo, dos botones alineados, etiquetas legibles y sin desbordamiento.
- [ ] Probar teléfono en orientación horizontal y confirmar que el panel pueda desplazarse verticalmente.
- [ ] Probar web/escritorio y comprobar que formulario y resumen respeten el ancho máximo actual.
- [ ] Verificar estados normal, deshabilitado y `Procesando…` de los botones.
- [ ] Verificar navegación atrás de Android con el panel visible y con la cámara abierta.
- [ ] Verificar el modal de destino en teléfono vertical y horizontal: nombre largo con salto de línea, tres botones completos, desplazamiento si fuera necesario y barra inferior bloqueada.

## Progreso del plan

- [x] Fase 1: Elegir el destino de un Excel recibido en Android
- [x] Fase 2: Crear el lector y resolver las filas del Excel
- [x] Fase 3: Incorporar el selector de Excel al formulario
- [x] Fase 4: Integrar la importación automática con el listado activo
- [x] Fase 5: Mostrar el resumen final de importación
- [ ] Fase Testing

Fecha de creación: 14 de septiembre de 2026
Fecha de última actualización: 14 de septiembre de 2026
Estado: IMPLEMENTACIÓN COMPLETA, PRUEBAS MANUALES PENDIENTES
