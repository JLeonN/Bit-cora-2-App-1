# PLAN DEL MÓDULO LISTADOS

## Descripción del plan

Crear un módulo nuevo llamado Listados para formar, conservar, recuperar, duplicar y compartir listas de artículos tomadas de la base Excel de Bitácora II. El flujo principal debe ser deliberadamente simple: buscar por código o descripción mediante el buscador inteligente existente, agregar el artículo una sola vez y exportar el resultado respetando el orden visual.

El módulo permitirá mostrar y editar opcionalmente stock y ubicación dentro del listado. Esas ediciones no modificarán automáticamente otros módulos: una tarjeta informativa detectará las diferencias y ofrecerá botones directos para enviarlas masivamente a Stock o a la lista persistida de Ubicaciones. Las correcciones finas continuarán realizándose dentro de los módulos de destino.

Este plan debe ejecutarse antes de `Planes/PlanOrdenamientoReutilizable.md`. La primera versión conservará las opciones visuales actuales de orden —más recientes, más antiguas y A–Z—, pero guardará el estado con un contrato de criterio y dirección que permita adoptar posteriormente el nuevo selector compartido sin migrar los listados.

## Objetivo principal

- Incorporar Listados entre Consulta de ubicación y Stock en Inicio, menú lateral y rutas.
- Permitir crear múltiples listados persistentes, abrirlos, renombrarlos, duplicarlos y eliminarlos.
- Reutilizar la base Excel, el buscador inteligente, la cámara, el manejo del lector, la barra inferior, los modales y los servicios de integración existentes.
- Exportar y compartir un Excel con anchos de columna calculados, únicamente con las columnas visibles y en el mismo orden mostrado en pantalla.
- Detectar cambios de stock y ubicación y enviarlos masivamente a sus módulos sin alterar las pantallas existentes de Stock o Ubicaciones.
- Enviar un artículo o todos los artículos válidos a Etiquetas con una copia por artículo.

## Contexto técnico verificado

- El proyecto usa Vue 3, Quasar 2, JavaScript, Vue Router, Capacitor 7, `@capacitor/preferences`, `@capacitor/filesystem`, `@capacitor/share` y `xlsx`.
- `src/components/Logica/Ubicaciones/CodigoMasNombre.vue` ya busca por código, descripción parcial y códigos normalizados provenientes de lectores; emite `articulo-seleccionado` y `estado-busqueda`.
- `src/components/Logica/Ubicaciones/CamaraEscaneo.vue` ya permite obtener códigos con la cámara.
- `src/components/BaseDeDatos/LectorExcel.js` mantiene una única base maestra y expone `inicializarBaseDatos()`, `obtenerArticulosCargados()`, `obtenerEstadoCarga()`, `obtenerInformacionArchivo()` y `obtenerArticuloPorCodigo()`.
- Bitácora trabaja con un solo Excel maestro como fuente de verdad. Listados no debe almacenar identidades de Excel, comparar archivos ni introducir flujos para múltiples fuentes.
- `src/components/Logica/Compartidos/CodigoEscaner.js` expone `normalizarCodigoBusqueda()` y `obtenerArticuloPorCodigoEscaneado()`; `src/components/Logica/Compartidos/NormalizarInputCursor.js` expone `normalizarInputPreservandoCursor()`.
- `src/components/Logica/Compartidos/UsoResaltadoAtencion.js` expone `usarResaltadoAtencion(duracion)` y devuelve `estaResaltado` y `activarResaltado()`.
- `src/components/Botones/BarraBotonesInferior.vue` y el evento `configurar-barra` de `src/layouts/MainLayout.vue` coordinan las acciones inferiores de las páginas.
- `src/components/Logica/Pedidos/CompartirExcel.js` abre el selector nativo de Android con Capacitor Share.
- `src/components/Logica/Stock/ExportarStockExcel.js` verifica el patrón actual de descarga web y escritura temporal en `Directory.Cache` para Android.
- `src/components/BaseDeDatos/UsoAlmacenamientoStock.js` permite fusionar registros por código mediante `guardarRegistrosStock()` y conserva los registros enviados con `confirmado: false`.
- `src/components/BaseDeDatos/usoAlmacenamientoUbicaciones.js` guarda la lista de ubicaciones. El envío desde Listados debe agregar movimientos directamente a esa lista, incluso si repite códigos, sin llamar a `registrarUbicacionArticulo()` y sin modificar la pantalla de Ubicaciones.
- `src/components/Logica/Etiquetas/ServicioEnvioEtiquetas.js` agrega artículos a Etiquetas con cantidad fija `1` y tamaño `10x15cm`.
- `src/components/Logica/Etiquetas/TablaEtiquetas.vue` contiene actualmente las opciones Más recientes, Más antiguas y A–Z dentro de `TarjetaSeccion`. Esta lógica sirve como referencia temporal, pero su rediseño pertenece al segundo plan.
- `IconListDetails`, `IconCalendarTime`, `IconSortAZ`, `IconArrowUp` e `IconArrowDown` están exportados por la versión instalada de `@tabler/icons-vue`; no se deben sustituir por iconos inventados.
- `src/css/app.css` contiene todos los colores permitidos. Los estilos nuevos deben usar esas variables y no dejar líneas vacías entre reglas CSS.
- No hay pruebas automatizadas reales: `npm test` es un placeholder. Los controles ejecutables disponibles son `npm run lint` y `npm run build`.

## Alcance

### Incluye

- Una página nueva de Listados y sus componentes de formulario, tabla/tarjetas, administración e información de cambios.
- Persistencia versionada de múltiples listados y del identificador del listado activo.
- Guardado automático después de cada cambio significativo.
- Nombre automático editable, apertura, renombrado, duplicado y eliminación con confirmación.
- Código y descripción siempre visibles.
- Interruptores para mostrar u ocultar Stock y Ubicación; sus valores se conservan aunque la columna quede oculta.
- Orden por más recientes, más antiguas o descripción A–Z; el Excel usa exactamente el arreglo visual ordenado.
- Rechazo de códigos duplicados dentro del mismo listado con notificación de su posición visual actual.
- Envíos masivos de diferencias a Stock y Ubicaciones mediante botones separados.
- Envío individual y masivo a Etiquetas.
- Exportación Excel, descarga web y menú nativo de compartir en Android.
- Integración en Inicio, drawer, router y botón Atrás nativo.
- Experiencia responsive para teléfonos, tabletas y escritorio.

### No incluye

- Modificar la interfaz, persistencia o comportamiento interno de `PaginaStock.vue`, `AjustarUbicaciones.vue` o sus tablas.
- Crear estados pendientes nuevos dentro de Ubicaciones.
- Aplicar automáticamente cambios de Listados sobre la base maestra de `LectorExcel.js`.
- Permitir códigos duplicados dentro de un listado.
- Agregar una columna Cantidad al listado.
- Cambiar la cantidad de copias enviada a Etiquetas; cada artículo genera una copia.
- Rediseñar el selector de orden de Etiquetas o retirar su acordeón; eso corresponde a `Planes/PlanOrdenamientoReutilizable.md`.
- Crear tutoriales o publicar una nueva versión.

## Anclas verificadas en archivos existentes

Los números de línea son referencias auxiliares del estado actual; durante la ejecución se debe localizar siempre el símbolo indicado.

| Archivo existente | Línea actual | Símbolo o bloque | Cambio cerrado |
| --- | ---: | --- | --- |
| `src/router/routes.js` | 44–54 | rutas `ConsultaDeUbicacion` y `Stock` | Insertar exactamente entre ambas la ruta `Listados` |
| `src/components/Inicio/PanelInicio.vue` | 41–51 | objetos de Consulta y Stock en `modulosDisponibles` | Insertar entre ambos el objeto de Listados con `IconListDetails` |
| `src/layouts/MainLayout.vue` | 52–64 | `q-item` de Consulta y Stock | Insertar entre ambos el `q-item` hacia `/listados` |
| `src/layouts/MainLayout.vue` | 207–218 | importaciones Tabler de navegación | Agregar `IconListDetails` al mismo import |
| `src/layouts/MainLayout.vue` | 443–452 | `manejarConfiguracionBarra` | Conservar el contrato de configuración y referencia de métodos |
| `src/pages/PaginaStock.vue` | 415–438 | `configuracionBarra` y `metodosParaBarra` | Replicar en Listados el patrón web/Android y `onAtrasNativo` |
| `src/pages/PaginaStock.vue` | 520–573 | `buscarArticuloExacto` y `seleccionarArticulo` | Reutilizar el flujo de Enter y selección sin copiar lógica de Stock |
| `src/pages/PaginaStock.vue` | 831–862 | `procesarEscaneo` y `cerrarPasoAtrasNativo` | Reutilizar cámara de escaneo único y prioridad del botón Atrás |
| `src/components/Logica/Ubicaciones/CodigoMasNombre.vue` | 83–91 | prop `busqueda` y emits | Consumir exactamente `articulo-seleccionado` y `estado-busqueda` |
| `src/components/Logica/Ubicaciones/CamaraEscaneo.vue` | 40–47 | prop `escaneoUnico` y emits | Usar `escaneo-unico="true"` y consumir `finalizar`, `cancelar`, `modal-abierto`, `modal-cerrado` |
| `src/components/Logica/Ubicaciones/SelectorExcel.vue` | 183–201 | props y emits | Consumir `base-datos-cargada`, `error-carga` y `base-datos-limpia` |
| `src/components/BaseDeDatos/UsoAlmacenamientoStock.js` | 125–197 | `obtenerSesionStock()` y `guardarRegistrosStock()` | Filtrar confirmados antes de fusionar registros pendientes |
| `src/components/BaseDeDatos/usoAlmacenamientoUbicaciones.js` | 7–25 | `guardarUbicaciones()` y `obtenerUbicaciones()` | Anteponer movimientos en una sola escritura sin deduplicarlos |
| `src/components/Logica/Etiquetas/ServicioEnvioEtiquetas.js` | 10–34 | `crearEtiquetaDesdeArticulo()` y `agregarEtiquetasDesdeArticulos()` | Reutilizar envíos individual y masivo con una copia |

## Modelo de datos propuesto

### Colección persistida

Guardar bajo claves nuevas y exclusivas de Capacitor Preferences:

- `CLAVE_LISTADOS = 'listados_trabajo'`: objeto versionado con todos los listados.
- `CLAVE_LISTADO_ACTIVO = 'listado_activo'`: identificador del último listado abierto.
- `VERSION_LISTADOS = '1.0'`.

Contrato de la colección:

```text
{
  version: '1.0',
  listados: ListadoGuardado[]
}
```

### Listado guardado

```text
{
  id: string,
  nombre: string,
  creadoEn: number,
  actualizadoEn: number,
  configuracion: {
    mostrarStock: boolean,
    mostrarUbicacion: boolean
  },
  orden: {
    criterio: 'fechaIngreso' | 'alfabetico',
    direccion: 'ascendente' | 'descendente'
  },
  articulos: ArticuloListado[]
}
```

Valores iniciales:

- `mostrarStock: false`.
- `mostrarUbicacion: false`.
- `orden: { criterio: 'fechaIngreso', direccion: 'descendente' }`, equivalente a más recientes primero.
- Nombre automático `Listado DD-MM-AAAA HH-MM`; si ya existe, añadir un sufijo correlativo.

### Artículo del listado

```text
{
  codigo: string,
  descripcion: string,
  stockOriginal: string | number,
  stockListado: string | number,
  ubicacionOriginal: string,
  ubicacionListado: string,
  fechaIngreso: number,
  stockProcesado: string | number | null,
  stockProcesadoEn: number | null,
  resultadoStock: 'enviado' | 'omitidoConfirmado' | null,
  ubicacionEnviada: string | null,
  ubicacionEnviadaEn: number | null
}
```

- `codigo` es la identidad única del artículo dentro del listado y se normaliza como el resto del proyecto.
- `descripcion`, `stockOriginal` y `ubicacionOriginal` son la fotografía del artículo al incorporarlo.
- `stockListado` y `ubicacionListado` comienzan con los valores del Excel y son los únicos valores editables.
- Un cambio de stock está pendiente si difiere de `stockOriginal` y de `stockProcesado`.
- Un cambio de ubicación está pendiente si difiere de `ubicacionOriginal` y de `ubicacionEnviada`.
- Después de procesar Stock se guardan `stockProcesado`, `stockProcesadoEn` y `resultadoStock`; un registro confirmado existente queda `omitidoConfirmado` y nunca se sobrescribe. Después de enviar Ubicación se guardan el valor y la fecha. Si el usuario vuelve a editar cualquier valor, reaparece como pendiente.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/pages/PaginaListados.vue` | Crear | coordinación de estado y `configurar-barra` | Página principal del módulo |
| `src/components/BaseDeDatos/UsoAlmacenamientoListados.js` | Crear | CRUD y normalización de listados | Persistencia versionada y listado activo |
| `src/components/Logica/Listados/FormularioListado.vue` | Crear | búsqueda y selección | Reutilizar Excel, buscador y cámara |
| `src/components/Logica/Listados/TablaListados.vue` | Crear | presentación, edición y acciones | Mostrar artículos como tabla o tarjetas |
| `src/components/Logica/Listados/GestorListados.vue` | Crear | crear, abrir, renombrar, duplicar y eliminar | Administrar múltiples listados |
| `src/components/Logica/Listados/ResumenCambiosListado.vue` | Crear | diferencias y envíos masivos | Informar cambios pendientes sin editarlos |
| `src/components/Logica/Listados/OrdenarArticulosListado.js` | Crear | `ordenarArticulosListado` | Aplicar un contrato compatible con el futuro selector |
| `src/components/Logica/Listados/ServicioIntegracionListados.js` | Crear | envíos a Stock, Ubicaciones y Etiquetas | Aislar contratos entre módulos |
| `src/components/Logica/Listados/ExportarListadosExcel.js` | Crear | generación, guardado y descarga | Exportar las columnas visibles en orden visual |
| `src/router/routes.js` | Modificar | ruta `Listados` | Registrar `/listados` |
| `src/components/Inicio/PanelInicio.vue` | Modificar | `modulosDisponibles` | Agregar tarjeta entre Consulta y Stock |
| `src/layouts/MainLayout.vue` | Modificar | drawer e importaciones de iconos | Agregar acceso lateral entre Consulta y Stock |

## FASE 1: Persistencia y administración de listados

### Objetivo

Disponer de múltiples listados seguros, normalizados y guardados automáticamente, sin depender del ciclo de vida visual de la página.

### Archivos y símbolos involucrados

- Nuevo `src/components/BaseDeDatos/UsoAlmacenamientoListados.js`: `obtenerColeccionListados`, `obtenerListados`, `obtenerListado`, `crearListado`, `guardarListado`, `renombrarListado`, `duplicarListado`, `eliminarListado`, `obtenerListadoActivo`, `guardarListadoActivo`.
- Nuevo `src/components/Logica/Listados/GestorListados.vue`: props y eventos de administración.

### Pasos de ejecución

- [x] Crear `UsoAlmacenamientoListados.js` con claves y versión exclusivas.
  - Normalizar datos inválidos al leer y devolver siempre una colección utilizable.
  - Clonar estructuras antes de retornarlas para que ningún consumidor modifique la caché accidentalmente.
  - Generar cada `id` con `crypto.randomUUID()`; el target Chrome 115 configurado por Quasar dispone de esta API.
  - Guardar fechas en milisegundos y ordenar el selector de listados por `actualizadoEn` descendente.
  - Manejar errores de Preferences con mensajes de consola identificables y retornos seguros.
- [x] Fijar las firmas y retornos del almacenamiento.
  - `obtenerListados(): Promise<ListadoGuardado[]>` devuelve clones ordenados por `actualizadoEn` descendente.
  - `obtenerListado(id): Promise<ListadoGuardado | null>` busca por identificador.
  - `crearListado(): Promise<ListadoGuardado>` crea, persiste y activa el nuevo listado.
  - `guardarListado(listado): Promise<ListadoGuardado>` reemplaza por `id` y devuelve la versión normalizada guardada.
  - `renombrarListado(id, nombre): Promise<ListadoGuardado>` rechaza nombres vacíos y normaliza espacios exteriores.
  - `duplicarListado(id): Promise<ListadoGuardado>` crea y activa la copia.
  - `eliminarListado(id): Promise<{ eliminado: boolean, listadoActivo: ListadoGuardado }>` garantiza que siempre quede uno activo.
  - `obtenerListadoActivo(): Promise<ListadoGuardado | null>` resuelve `CLAVE_LISTADO_ACTIVO` contra la colección.
  - `guardarListadoActivo(id): Promise<void>` guarda únicamente un identificador existente.
- [x] Implementar `crearListado()` con el contrato y valores iniciales verificados.
  - Crear un nombre automático local y garantizar que no colisione con nombres existentes.
- [x] Implementar `guardarListado(listado)` como actualización por `id`.
  - Normalizar códigos, descripción, ubicación, fechas, configuración y orden.
  - Eliminar artículos inválidos y resolver accidentalmente repetidos conservando la entrada más reciente.
  - Actualizar `actualizadoEn` en cada escritura.
- [x] Implementar `duplicarListado(id)`.
  - Crear un nuevo `id`, `creadoEn` y `actualizadoEn`.
  - Proponer `Copia de [Nombre original]`, agregando sufijo si fuera necesario.
  - Copiar artículos, configuración y orden.
  - Reiniciar `stockProcesado`, `stockProcesadoEn`, `resultadoStock`, `ubicacionEnviada` y `ubicacionEnviadaEn` para que la copia sea un trabajo independiente.
  - Convertir la copia en listado activo.
- [x] Crear `GestorListados.vue` con un panel compacto y responsive.
  - Props: `listados`, `listadoActivo`, `ocupado`.
  - Emits y payloads exactos: `crear` sin payload, `abrir` con `id`, `renombrar` con `{ id, nombre }`, `duplicar` con `id` y `solicitar-eliminar` con el listado completo.
  - Ofrecer nuevo listado, selector de guardados, renombrar, duplicar y eliminar.
  - Reutilizar `ModalEliminar.vue` desde la página para confirmar la eliminación, sin usar `confirm()` nativo.
  - No exigir un botón Guardar: toda edición debe persistirse automáticamente.
- [x] Al eliminar el listado activo, activar el listado restante actualizado más recientemente; si no queda ninguno, crear un listado vacío.

## FASE 2: Página, buscador inteligente y altas únicas

### Objetivo

Crear el flujo principal para agregar artículos rápidamente y evitar duplicados, reutilizando los mecanismos existentes.

### Archivos y símbolos involucrados

- Nuevo `src/pages/PaginaListados.vue`.
- Nuevo `src/components/Logica/Listados/FormularioListado.vue`.
- Existentes `CodigoMasNombre.vue`, `CamaraEscaneo.vue`, `SelectorExcel.vue`, `CodigoEscaner.js`, `NormalizarInputCursor.js`, `ServicioEnfoqueInput.js` y `UsoResaltadoAtencion.js`.

### Pasos de ejecución

- [x] Crear `PaginaListados.vue` como coordinador del listado activo.
  - Inicializar `LectorExcel`, cargar la colección, resolver el listado activo y crear uno si falta.
  - Declarar `listados`, `listadoActivo`, `baseDatosCargada`, `modalActivo`, `listadoAEliminar`, `exportando`, `enviandoStock`, `enviandoUbicaciones` y `codigoResaltado` como estados explícitos.
  - Declarar `articulosOrdenados`, `cambiosStockPendientes`, `cambiosUbicacionPendientes` y `configuracionBarra` como `computed`.
  - Implementar `cargarListados`, `crearNuevoListado`, `abrirListado`, `renombrarListadoActivo`, `duplicarListadoActivo`, `solicitarEliminarListado`, `confirmarEliminarListado`, `agregarArticulo`, `guardarCambioStock`, `guardarCambioUbicacion`, `eliminarArticulo`, `enviarCambiosStock`, `enviarCambiosUbicaciones`, `enviarArticuloAEtiquetas`, `enviarTodosAEtiquetas`, `exportarListado`, `actualizarBarra` y `cerrarPasoAtrasNativo`.
  - Configurar y limpiar la barra inferior mediante `configurar-barra`, siguiendo el patrón de `PaginaStock.vue`.
  - Implementar `onAtrasNativo` para cerrar cámara, buscador o modal antes de navegar.
- [x] Crear `FormularioListado.vue` alrededor del patrón de búsqueda de `PaginaStock.vue`.
  - Mostrar `SelectorExcel.vue` cuando no exista base cargada.
  - Usar un único input con placeholder “Código o descripción del artículo”.
  - Reutilizar `CodigoMasNombre.vue` para sugerencias y selección.
  - Mantener internamente `busquedaArticulo`, `mostrarBuscador`, `mostrarCamara` y `estadoBusqueda`.
  - Resolver Enter con `obtenerArticuloPorCodigoEscaneado(obtenerArticulosCargados(), busquedaArticulo)` y, si no hay coincidencia exacta, seleccionar solamente cuando `estadoBusqueda.articuloUnico` exista.
  - Normalizar el input mediante `normalizarInputPreservandoCursor()` y el código mediante `normalizarCodigoBusqueda()`.
  - Renderizar `CamaraEscaneo` con `:escaneo-unico="true"`; tomar `codigos[0]` de `finalizar` y pasarlo por el mismo flujo exacto de análisis de Enter.
  - Prop: `deshabilitado`.
  - Eventos: `articulo-seleccionado`, `base-datos-cargada`, `error-carga`, `modal-abierto`, `modal-cerrado`.
  - Exponer `cerrarInteraccion(): boolean`, que cierre primero cámara y después sugerencias, para que `PaginaListados.vue` lo use desde `onAtrasNativo`.
- [x] Al agregar un artículo nuevo, crear el registro con datos originales y editables tomados del Excel.
  - Insertarlo con una `fechaIngreso` monotónica para resolver escaneos realizados en el mismo milisegundo.
  - Guardar automáticamente, limpiar la búsqueda y devolver foco al input.
- [x] Rechazar duplicados por código normalizado.
  - No crear otra fila ni incrementar cantidades.
  - Calcular el índice sobre `articulosOrdenados`, no sobre el arreglo persistido.
  - Mostrar exactamente `El artículo ya está en el listado, posición N` mediante `Notify.create({ type: 'warning', position: 'top', timeout: 2400 })`.
  - Asignar el código a `codigoResaltado`, llamar `tablaListadosRef.enfocarArticulo(codigo)` y aplicar `resaltado-atencion` solamente a esa fila durante los 2400 ms administrados por `usarResaltadoAtencion()`.
  - Recalcular `N` como `articulosOrdenados.findIndex(...) + 1` cada vez; nunca reutilizar el índice del arreglo persistido.
- [x] Tratar la base cargada por `LectorExcel.js` como la única fuente maestra.
  - No guardar identidad de archivo en los listados.
  - No comparar nombre, tamaño ni fecha de modificación.
  - Si no hay base cargada, conservar y exportar los listados guardados, pero exigir cargar el Excel maestro antes de agregar artículos o enviarlos a Etiquetas.

## FASE 3: Presentación, configuración y orden actual

### Objetivo

Mostrar y editar los valores propios del listado con una interfaz legible en cualquier resolución, sin convertirla en una pantalla de gestión avanzada de Stock o Ubicaciones.

### Archivos y símbolos involucrados

- Nuevo `src/components/Logica/Listados/TablaListados.vue`.
- Nuevo `src/components/Logica/Listados/OrdenarArticulosListado.js`.
- `src/pages/PaginaListados.vue`: `configuracionListado`, `articulosOrdenados`.

### Pasos de ejecución

- [x] Crear `ordenarArticulosListado(articulos, orden)` como función pura.
  - `fechaIngreso` + `descendente`: más recientes primero.
  - `fechaIngreso` + `ascendente`: más antiguos primero.
  - `alfabetico` + `ascendente`: descripción A–Z con `localeCompare('es', { sensitivity: 'base' })` y desempate estable por fecha/código.
  - Aceptar ya `alfabetico` + `descendente`, aunque la interfaz de este primer plan no lo exponga todavía.
  - No mutar el arreglo persistido.
- [x] Añadir una sección de configuración compacta.
  - Código y descripción quedan siempre activos y no muestran interruptor.
  - Renderizar dos `q-toggle` etiquetados exactamente `Stock` y `Ubicación`; actualizan `configuracion.mostrarStock` y `configuracion.mostrarUbicacion` y guardan automáticamente.
  - Ocultar un campo no borra sus valores ni sus marcas de sincronización.
- [x] Incorporar temporalmente las tres opciones actuales: Más recientes, Más antiguas y A–Z.
  - Renderizarlas dentro de `TarjetaSeccion` con título `Ordenar listado`, `:expandida-por-defecto="false"`, descripción `Elegí cómo ver y exportar los artículos.` y tres botones: `Más recientes`, `Más antiguas`, `A–Z`.
  - Cada botón usa `type="button"`, `aria-pressed` según el objeto `orden` y una clase activa; no copiar nombres CSS scoped de Etiquetas.
  - Mapearlas al objeto `orden` en lugar de guardar textos heredados.
  - Persistir el orden por listado.
  - Mantener el bloque aislado para que `PlanOrdenamientoReutilizable.md` lo reemplace por el componente compartido.
- [x] Crear `TablaListados.vue`.
  - Props: `articulos`, `mostrarStock`, `mostrarUbicacion`, `codigoResaltado`.
  - Emits y payloads exactos: `editar-stock` con `{ codigo, stockListado }`, `editar-ubicacion` con `{ codigo, ubicacionListado }`, `eliminar` con el artículo completo y `enviar-etiqueta` con el artículo completo.
  - En escritorio mostrar encabezados y columnas alineadas.
  - En teléfono transformar cada fila en tarjeta, preservar código y descripción completos y evitar desplazamiento horizontal obligatorio.
  - Incluir acciones discretas para eliminar y enviar individualmente a Etiquetas.
  - Permitir editar únicamente `stockListado` y `ubicacionListado`; validar stock como valor numérico coherente con el patrón de Stock y normalizar ubicación en mayúsculas con espacios convertidos a guiones.
  - Mantener un borrador local durante la escritura y emitir el valor únicamente con Enter o `blur`; no persistir por cada pulsación.
  - Exponer `enfocarArticulo(codigo): void`, que localice la tarjeta/fila por un atributo `data-codigo` y ejecute `scrollIntoView({ behavior: 'smooth', block: 'center' })`.
- [x] Agregar estado vacío, contadores y acción “Eliminar todos los artículos” con `ModalEliminar.vue`.
  - Vaciar artículos no debe eliminar el listado ni su nombre/configuración.

## FASE 4: Detección e integración de cambios

### Objetivo

Informar los cambios realizados en Listados y enviarlos de manera masiva a los módulos existentes, sin introducir edición adicional ni modal de revisión.

### Archivos y símbolos involucrados

- Nuevo `src/components/Logica/Listados/ResumenCambiosListado.vue`.
- Nuevo `src/components/Logica/Listados/ServicioIntegracionListados.js`.
- Existentes `UsoAlmacenamientoStock.js`, `usoAlmacenamientoUbicaciones.js` y `ServicioEnvioEtiquetas.js` solo como dependencias públicas.

### Pasos de ejecución

- [x] Crear funciones puras para obtener `cambiosStockPendientes` y `cambiosUbicacionPendientes`.
  - No considerar como cambio un valor que solo haya sido mostrado u ocultado.
  - Comparar valores normalizados.
  - Excluir stock vacío o inválido y ubicaciones vacías de los envíos, informándolo al usuario.
- [x] Crear `ResumenCambiosListado.vue`.
  - Props exactas: `cantidadStock`, `cantidadUbicaciones`, `enviandoStock`, `enviandoUbicaciones`.
  - Emits sin payload: `enviar-stock` y `enviar-ubicaciones`.
  - Permanecer oculto si no hay diferencias pendientes.
  - Mostrar únicamente cantidades y mensajes informativos; no contener campos editables ni selectores individuales.
  - Ofrecer `Enviar cambios a Stock` y `Enviar cambios a Ubicaciones` por separado.
  - Deshabilitar cada botón durante su operación y emitir `enviar-stock` o `enviar-ubicaciones`.
  - Ocultar la categoría enviada cuando ya no queden cambios pendientes.
- [x] Implementar `enviarCambiosAStock(listado)` en `ServicioIntegracionListados.js`.
  - Obtener la fuente maestra actual con `obtenerInformacionArchivo()` porque `guardarRegistrosStock()` exige ese argumento por su contrato existente; no guardar esa identidad dentro del listado.
  - Si Stock rechaza la escritura por el control interno de sesión, mostrar literalmente el mensaje del servicio y no marcar ningún cambio como procesado.
  - Convertir cada diferencia a `{ codigo, nombre: descripcion, stockExcel, stockContado, stockExcelAjustado, ubicacionActual, ubicacionOriginalExcel, ubicacionOrigen, confirmado: false, fechaActualizacion }`.
  - Obtener `stockExcel` con `normalizarCantidadStock(stockOriginal, { permitirDecimal: true })` y `stockContado` con `normalizarCantidadStock(stockListado)`; omitir un `stockContado` cuyo resultado sea `null`.
  - Usar `ubicacionListado`, `ubicacionOriginal` y la comparación entre ambas para resolver `ubicacionActual`, `ubicacionOriginalExcel` y `ubicacionOrigen`.
  - Usar `guardarRegistrosStock()` para fusionar por código, sin modificar `PaginaStock.vue` ni `TablaStock.vue`.
  - Leer primero `obtenerSesionStock()` y separar los códigos que ya estén confirmados.
  - No sobrescribir registros confirmados: marcarlos como `omitidoConfirmado`, informar la cantidad y dejar que el usuario los edite dentro de Stock.
  - Fusionar los demás como pendientes y retornar códigos enviados, omitidos y errores.
  - Retorno exacto: `{ enviados: string[], omitidosConfirmados: string[], invalidos: string[] }`.
- [x] Implementar `enviarCambiosAUbicaciones(listado)`.
  - Leer la lista actual mediante `obtenerUbicaciones()`.
  - Anteponer todos los movimientos válidos conservando el orden visual del listado.
  - Permitir que el mismo código ya exista en Ubicaciones: no deduplicar, reemplazar ni modificar su interfaz.
  - Guardar una sola vez mediante `guardarUbicaciones()`.
  - No llamar a `registrarUbicacionArticulo()` ni actualizar `LectorExcel.js`; el alcance termina al cargar los movimientos en la lista de Ubicaciones.
  - Retorno exacto: `{ enviados: string[], invalidos: string[] }`.
- [x] Actualizar las marcas de procesamiento únicamente después de terminar la operación y persistir el listado una sola vez.
  - Para Stock registrar como procesados tanto los enviados como los omitidos por estar confirmados, diferenciándolos con `resultadoStock`.
  - Para Ubicaciones actualizar solo `ubicacionEnviada` y `ubicacionEnviadaEn` de códigos guardados correctamente.
  - Notificar cantidad enviada y omitida.
  - Si falla la operación, conservar todos los cambios como pendientes.
- [x] Implementar los envíos a Etiquetas mediante `agregarEtiquetasDesdeArticulos()`.
  - Acción individual por fila.
  - Acción masiva “Enviar todos a Etiquetas”.
  - Enviar código, descripción y `ubicacionListado` actual.
  - Mantener `cantidad: 1` mediante el contrato existente.
  - Omitir artículos que ya no existan en la base cargada e informar la cantidad.
  - `enviarArticuloAEtiquetas(articulo)` retorna el resultado del servicio; `enviarTodosAEtiquetas(articulosOrdenados)` filtra primero con `obtenerArticuloPorCodigo()` y conserva el orden visual.

## FASE 5: Exportación Excel y compartir

### Objetivo

Generar un Excel legible con el contenido visible y compartirlo por cualquier aplicación compatible en Android.

### Archivos y símbolos involucrados

- Nuevo `src/components/Logica/Listados/ExportarListadosExcel.js`.
- `src/pages/PaginaListados.vue`: `exportarListado` y configuración de barra.
- Existente `src/components/Logica/Pedidos/CompartirExcel.js`: `compartirArchivo`.

### Pasos de ejecución

- [x] Crear `construirLibroListado(articulosOrdenados, configuracion, nombreListado)`.
  - Columnas obligatorias: `Código`, `Descripción`.
  - Agregar `Stock` solo si `mostrarStock` está activo, usando `stockListado`.
  - Agregar `Ubicación` solo si `mostrarUbicacion` está activa, usando `ubicacionListado`.
  - Crear las filas directamente desde `articulosOrdenados`; no volver a ordenar dentro del exportador.
  - Sanitizar y limitar el nombre de la hoja a las restricciones de Excel.
- [x] Calcular anchos con una utilidad interna basada en encabezado y contenido.
  - Implementar `calcularAnchoColumna(valores, minimo, maximo)` como `Math.min(maximo, Math.max(minimo, mayorLongitud + 2))`.
  - Usar estos límites exactos: Código 14–24, Descripción 30–80, Stock 10–18 y Ubicación 12–30 caracteres.
  - Evitar que una descripción excepcionalmente larga vuelva inutilizable el archivo.
  - Asignar el resultado mediante `hoja['!cols']`.
- [x] Crear el nombre exacto `Listados [Usuario] AAAA-MM-DD # HH-MM.xlsx` usando `obtenerNombreUsuario()`.
  - Sanitizar solamente caracteres inválidos para archivos y conservar acentos válidos.
- [x] Implementar `generarYGuardarExcelListado(listado, articulosOrdenados)`.
  - Rechazar listas vacías con mensaje claro.
  - En web usar `XLSX.writeFile()` y retornar `{ uri: null, nombreArchivo }`.
  - En Android escribir Base64 en `Directory.Cache` y retornar la URI temporal.
  - Usar como hoja el `nombre` del listado, quitar `\\ / ? * [ ] :`, recortar a 31 caracteres y usar `Listado` si queda vacío.
- [x] Configurar la barra inferior.
  - Mostrar Enviar únicamente cuando haya artículos.
  - En Android generar y llamar `compartirArchivo()` para abrir el selector nativo: WhatsApp, correo, Bluetooth, Drive u otras aplicaciones instaladas.
  - En web descargar directamente y notificar el resultado.
  - Bloquear doble ejecución mientras se genera el archivo.

## FASE 6: Navegación e interfaz responsive

### Objetivo

Integrar Listados en la navegación y garantizar una experiencia consistente en teléfonos, tabletas y escritorio.

### Archivos y símbolos involucrados

- `src/router/routes.js`.
- `src/components/Inicio/PanelInicio.vue`.
- `src/layouts/MainLayout.vue`.
- Componentes nuevos de Listados.

### Pasos de ejecución

- [x] Agregar ruta con `path: '/listados'`, `name: 'Listados'` y carga diferida de `pages/PaginaListados.vue` inmediatamente después de Consulta de ubicación y antes de Stock.
- [x] Agregar una tarjeta a `modulosDisponibles` de `PanelInicio.vue` en la misma posición.
  - Título `Listados`.
  - Descripción exacta `Crea, guarda y comparte listados de artículos`.
  - Usar exactamente `IconListDetails` desde `@tabler/icons-vue`.
- [x] Agregar el `q-item` correspondiente en `MainLayout.vue` entre Consulta de Ubicación y Stock, reutilizando el mismo icono.
- [x] Mantener todos los colores en variables de `src/css/app.css` y respetar el CSS compacto exigido por `AGENTS.md`.
- [x] Diseñar los puntos de quiebre desde los patrones ya usados por Inicio, Stock y Etiquetas.
  - Teléfono angosto: controles apilados, tarjetas de ancho completo, botones táctiles y textos sin cortes de código.
  - Teléfono ancho/tableta: acciones distribuidas en filas sin superposición.
  - Escritorio: tabla alineada, contenedor centrado y ancho máximo legible.
  - Respetar `--espacio-inferior-contenido` para que el banner y la barra flotante no cubran filas ni acciones.
- [ ] Comprobar estados con lista vacía, lista extensa, nombres largos, teclado abierto, cámara, buscador desplegado y tarjeta de cambios visible.

## FASE TESTING

### Objetivo

Validar el módulo completo, sus integraciones y la ausencia de regresiones en los módulos reutilizados.

### Pruebas automatizadas

- [x] Ejecutar `npm run lint` y corregir todos los errores ESLint en archivos nuevos o modificados.
- [x] Ejecutar `npm run build` y comprobar que Quasar genere el SPA sin imports, iconos o rutas inválidas.

### Pruebas manuales funcionales

- [ ] Crear un listado sin Excel, verificar el estado informativo y cargar una base válida.
- [ ] Agregar mediante sugerencia, Enter, lector con prefijo y cámara.
- [ ] Intentar agregar el mismo código y comprobar que no se duplique, se resalte y se informe su posición bajo cada orden disponible.
- [ ] Activar y desactivar Stock y Ubicación verificando que los valores sobrevivan.
- [ ] Editar stock y ubicación, recargar la app y comprobar el guardado automático.
- [ ] Crear, abrir, renombrar, duplicar y eliminar listados; verificar que la copia sea independiente y reinicie sus marcas de envío.
- [ ] Cargar una versión actualizada del único Excel maestro y comprobar que los listados continúen utilizándolo sin crear identidades ni conflictos entre fuentes.
- [ ] Enviar cambios a Stock y confirmar que aparezcan pendientes sin modificar registros confirmados.
  - Repetir con un código ya confirmado y comprobar que se informe como omitido, quede marcado `omitidoConfirmado` y no reaparezca hasta que cambie nuevamente `stockListado`.
- [ ] Enviar ubicaciones y comprobar que se antepongan en la lista persistida, incluidos códigos repetidos, sin otros efectos automáticos.
- [ ] Enviar una fila y todas las filas a Etiquetas, verificando una copia por artículo y avisos de omitidos.
- [ ] Exportar con ninguna, una y ambas columnas opcionales; comparar orden y valores con la pantalla.
- [ ] Confirmar el nombre del archivo y los anchos limitados de sus columnas.
- [ ] En web comprobar descarga directa; en Android comprobar que se abra el selector nativo y que el archivo pueda elegirse para WhatsApp, correo o Bluetooth sin envío automático desde Bitácora.
- [ ] Verificar Atrás nativo cerrando buscador, cámara y modales antes de abandonar la página.

### Casos responsivos

- [ ] Revisar visualmente anchos cercanos a 320 px, 360 px, 480 px, 640 px, tableta y escritorio.
- [ ] Comprobar orientación vertical y horizontal en Android.
- [ ] Validar listas largas, descripciones extensas, códigos largos y botones con textos localizados.
- [ ] Confirmar que banner, área segura y barra inferior no oculten el último artículo.

## Progreso del plan

- [x] Fase 1: Persistencia y administración de listados
- [x] Fase 2: Página, buscador inteligente y altas únicas
- [x] Fase 3: Presentación, configuración y orden actual
- [x] Fase 4: Detección e integración de cambios
- [x] Fase 5: Exportación Excel y compartir
- [x] Fase 6: Navegación e interfaz responsive
- [ ] Fase Testing manual en web y Android

Fecha de creación: 8 de Septiembre 2026
Fecha de última actualización: 8 de Septiembre 2026
Estado: IMPLEMENTADO - PENDIENTE DE VALIDACIÓN MANUAL EN WEB Y ANDROID
