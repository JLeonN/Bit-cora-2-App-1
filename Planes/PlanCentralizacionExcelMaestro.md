# Plan para centralizar el Excel maestro en Configuración

## Descripción del plan

Bitácora 2 carga un único catálogo de artículos mediante `SelectorExcel.vue` y `LectorExcel.js`. Hoy el selector aparece en Ubicaciones, Consulta de ubicación, Listados, Stock y Ubicaciones compartidas. El Excel recibido por Android ofrece elegir entre maestro y listado; la elección de maestro abre Ubicaciones. Este plan mueve toda la interfaz de carga, cambio y limpieza del maestro a Configuración, sin cambiar el formato, almacenamiento ni uso de sus datos. El Excel que se importa **como listado** conserva su flujo separado.

## Objetivo principal

- Mostrar «Base de datos para búsqueda» como primera tarjeta de Configuración, encima de «Información Personal», con el selector actual, un ícono y el texto explicativo actual de Ubicaciones.
- Quitar el selector del maestro de todas las demás pantallas. Mostrar un botón con el mismo ícono en el extremo derecho del encabezado de los módulos que dependen de la base, exclusivamente mientras no haya maestro cargado.
- Hacer que el botón abra Configuración con la primera tarjeta expandida y resaltada. Mantener el modal Android para decidir si un Excel recibido será maestro o listado.
- Conservar las rutas pendientes de archivos recibidos, las sesiones de Stock, los datos de Ubicaciones y el funcionamiento manual de Etiquetas.

## Contexto técnico verificado

- `AGENTS.md` es la instrucción principal: español, UTF-8, archivos/carpetas nuevos en PascalCase, símbolos nuevos en camelCase español, colores de `src/css/app.css`, CSS sin líneas vacías entre reglas y prioridad a ESLint.
- La app usa Quasar 2, Vue 3, Vue Router 4, Capacitor y `@tabler/icons-vue`. `IconDatabase` existe en la dependencia instalada y se usará tanto en la tarjeta como en los botones de aviso.
- `src/components/BaseDeDatos/LectorExcel.js` mantiene el estado del maestro en memoria y lo persiste con Capacitor Preferences. `SelectorExcel.vue` ya ofrece selección, cambio, limpieza, estado, errores y procesamiento de Excel compartido. No duplicar ni reescribir esa lógica.
- `src/components/Configuracion/Tutoriales/TarjetaSeccion.vue` acepta `icono`, `expandidaPorDefecto` y `solicitudResaltado`. Esta última usa el brillo global `.resaltado-atencion` de `src/css/app.css`. `MainLayout.vue` vuelve a montar la página cuando cambia `$route.fullPath`.
- `src/layouts/MainLayout.vue` muestra `ModalDestinoExcelCompartido.vue` y envía actualmente el maestro a `/AjustarUbicaciones`. `PaginaListados.vue` usa `destinoExcel=listado` y `archivoCompartido` para importar un listado compartido después de tener el maestro.
- Etiquetas usa el maestro para buscar y completar datos, pero permite crear etiquetas sin él. Su pantalla no llama hoy a `inicializarBaseDatos()`; esto importa si es el primer módulo abierto después de reiniciar.
- Stock conserva una sesión asociada a la identidad del archivo maestro. Cambiar el maestro debe seguir mostrando el aviso de conflicto y la opción de iniciar una sesión nueva; no modificar `UsoAlmacenamientoStock.js`.
- `src/components/Logica/Ubicaciones/CacheExcelUbicacionesWeb.js` incluye la identidad del archivo en su firma. Al volver a Ubicaciones después de cambiar el maestro, la preparación existente detecta esa identidad.
- `package.json` define `npm run lint`, `npm test` y `npm run build`. `npm test` ejecuta tres suites existentes y no cubre todos los recorridos de esta interfaz.

## Alcance

### Incluye

- Ubicaciones, Consulta de ubicación, Listados, Stock, Etiquetas y Ubicaciones compartidas por enlace.
- Carga local, cambio, limpieza y recepción de un Excel maestro compartido por Android.
- Conservación de un Excel recibido para importarlo como listado cuando todavía falta el maestro.
- Actualización de los tutoriales que actualmente indican cargar el maestro desde otro módulo.

### No incluye

- Cambios al esquema del Excel, al parseo de sus columnas, a la persistencia, al formato de exportación ni a los registros de otros módulos.
- Cambios al botón «Cargar Excel» de `FormularioListado.vue`, que importa filas de **otro listado** una vez cargado el maestro.
- Cambios al modal que permite elegir maestro o listado ni a la lógica que importa un Excel como listado.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Logica/Compartidos/BotonBaseDatosFaltante.vue` | Crear | `BotonBaseDatosFaltante`, `actualizarEstadoBase`, `abrirConfiguracion` | Botón común, estado y navegación |
| `src/pages/PaginaConfiguracion.vue` | Modificar | `TarjetaSeccion`, `SelectorExcel`, `identificadorExcelMaestroCompartido`, `finalizarExcelMaestroCompartido` | Único sitio de carga, cambio y limpieza |
| `src/pages/AjustarUbicaciones.vue` | Modificar | encabezado, `SelectorExcel`, `baseDatosExpandida`, manejadores del selector | Quitar carga local y mostrar aviso |
| `src/pages/ConsultaDeUbicacion.vue` | Modificar | encabezado, `SelectorExcel`, manejadores del selector | Quitar carga local y mostrar aviso |
| `src/pages/PaginaStock.vue` | Modificar | encabezado, tarjeta «Base e importación», `SelectorExcel`, manejadores del selector | Conservar importación desde Ubicaciones y conflicto de fuente |
| `src/pages/PaginaListados.vue` | Modificar | encabezado, `FormularioListado`, `manejarBaseCargada`, `procesarExcelCompartidoPendiente` | Mostrar aviso y conservar importación pendiente |
| `src/components/Logica/Listados/FormularioListado.vue` | Modificar | `SelectorExcel`, `baseDatosCargada`, `establecerBaseCargada` | Quitar carga del maestro sin alterar importación de listados |
| `src/components/Logica/Listados/TablaListados.vue` | Modificar | `baseDatosCargada`, estado vacío | Indicar cómo cargar el maestro cuando el listado está vacío |
| `src/pages/PaginaEtiquetas.vue` | Modificar | encabezado, `onMounted` | Avisar sobre base ausente e inicializar base guardada |
| `src/pages/RecibirUbicaciones.vue` | Modificar | encabezado, tarjeta «Cargá tu Excel base», `SelectorExcel` | Llevar a Configuración sin perder el enlace |
| `src/layouts/MainLayout.vue` | Modificar | `rutaPoseeDestinoPendiente`, `navegarADestinoExcel` | Enviar el maestro recibido a Configuración y conservar listado pendiente |
| `src/components/Configuracion/Tutoriales/LosTutoriales/TutorialUbicaciones.vue` | Modificar | texto introductorio y paso 1 | Indicar ubicación nueva de la carga |
| `src/components/Configuracion/Tutoriales/LosTutoriales/TutorialConsultaDeUbicacion.vue` | Modificar | paso 1 | Indicar botón del encabezado |
| `src/components/Configuracion/Tutoriales/LosTutoriales/TutorialStock.vue` | Modificar | descripción y paso 1 | Indicar Configuración como origen de la base |
| `src/components/Configuracion/Tutoriales/LosTutoriales/TutorialListados.vue` | Modificar | paso 2 | Distinguir maestro de Excel de listado |
| `src/components/Configuracion/Tutoriales/LosTutoriales/TutorialEtiquetas.vue` | Modificar | paso 3 | Aclarar que el maestro es opcional para etiquetas manuales |
| `src/css/app.css` | Modificar | clases globales del encabezado y botón; animación | Presentación común y movimiento reducido |

## FASE 1: Crear el destino único en Configuración

### Objetivo

La primera tarjeta de Configuración carga, muestra, cambia y limpia el maestro, además de consumir el maestro recibido desde Android.

### Pasos de ejecución

- [x] Modificar `src/pages/PaginaConfiguracion.vue`: insertar antes de «Información Personal» una `TarjetaSeccion` con `titulo="Base de datos para búsqueda"`, `:icono="IconDatabase"`, el resumen actual de `AjustarUbicaciones.vue`, `:ocultar-resumen-al-expandir="true"` y el texto literal: «Cargá el archivo Excel de artículos para actualizar la base de búsqueda y validar códigos en tiempo real.» Dentro, reutilizar **una** instancia de `SelectorExcel.vue` con su ayuda, tarjeta de archivo, cambio, limpieza y errores actuales.
  - Importar `IconDatabase`, `SelectorExcel`, `inicializarBaseDatos`, `obtenerEstadoCarga`, `useRouter` y lo necesario para los eventos. No mover ni duplicar el componente selector.
  - Definir `baseDatosExpandida` (`ref(false)`) y `baseDatosInicializada` (`ref(false)`). En `onMounted`, esperar `inicializarBaseDatos()`, establecer la expansión en `!obtenerEstadoCarga().cargado || haySolicitudBaseDatos.value` y, por último, marcar la inicialización como terminada. Montar `SelectorExcel` con `v-if="baseDatosInicializada"` para que su evento de carga automática o compartida no compita con la inicialización de la tarjeta. Si la ruta solicita abrir la tarjeta después del montaje, hacerla `true` mediante `watch`; no cerrarla automáticamente por un cambio de consulta no relacionado.
  - Definir `haySolicitudBaseDatos` como `computed`: verdadero si `route.query.baseDatos` tiene un valor o si `route.query.destinoExcel === 'maestro'` con `archivoCompartido` presente. Pasar como `solicitudResaltado` un valor de consulta no vacío que cambie ante cada pulsación. El botón compartido generará un valor nuevo, de modo que también funcione al pulsarlo repetidamente desde el mismo origen.
  - Definir `identificadorExcelMaestroCompartido` como `computed` que devuelve el identificador de `route.query.archivoCompartido` solo con `destinoExcel === 'maestro'` (normalizar valor simple o arreglo como lo hace hoy `AjustarUbicaciones.vue`). Pasarlo a `SelectorExcel` mediante `identificador-archivo-compartido`.
  - Escuchar `archivo-compartido-finalizado` con `finalizarExcelMaestroCompartido({ identificador })`: comprobar que coincida con el identificador de la ruta y hacer `router.replace` quitando solo `destinoExcel` y `archivoCompartido`; conservar las demás consultas. Dejar la lógica de reintento, descarte y limpieza del pendiente dentro de `SelectorExcel.vue`.
  - Tras `base-datos-cargada`, cerrar la tarjeta solo para una carga manual o compartida exitosa, y no para `cargaAutomatica`. Tras `base-datos-limpia`, abrirla. El selector conserva sus mensajes y modal de confirmación. Comprobar que un fallo deja la tarjeta abierta con el error visible.
  - La tarjeta queda primero en teléfono y escritorio. Conservar el ancho y los márgenes actuales de Configuración.

## FASE 2: Sustituir los selectores por el aviso del encabezado

### Objetivo

Cada módulo relacionado muestra solo un botón pequeño al extremo derecho de su título cuando falta el maestro; el botón abre la primera tarjeta de Configuración.

### Pasos de ejecución

- [x] Crear `src/components/Logica/Compartidos/BotonBaseDatosFaltante.vue`, sin props obligatorias ni eventos públicos. Responsabilidad exclusiva: averiguar si falta el maestro y navegar a la tarjeta; no cargar ni modificar la base.
  - Importar `IconDatabase`, `useRouter`, `useRoute`, `inicializarBaseDatos` y `obtenerEstadoCarga`.
  - Usar `baseDatosCargada = ref(false)` y `estadoInicializado = ref(false)`. En `onMounted`, esperar `inicializarBaseDatos()` y ejecutar `actualizarEstadoBase()`. Renderizar el botón únicamente si `estadoInicializado && !baseDatosCargada`, para evitar un parpadeo falso durante la lectura de Preferences.
  - Mientras esté montado, revisar el estado con un intervalo de 1000 ms, igual que los consumidores actuales; liberar el intervalo en `onUnmounted`. `actualizarEstadoBase()` debe reflejar `obtenerEstadoCarga().cargado` tanto al cargar como al limpiar el maestro.
  - `abrirConfiguracion()` hará `router.push({ path: '/configuracion', query: { baseDatos: solicitudUnica, ...consultaPendiente } })`. Crear `solicitudUnica` con la hora actual y un contador incremental del componente para que cambie incluso ante pulsaciones consecutivas en el mismo milisegundo. `consultaPendiente` contiene **solo** `destinoExcel='listado'` y su `archivoCompartido` cuando el botón se pulsa en `/listados` con un listado compartido pendiente; en cualquier otro caso está vacía. Esto conserva el identificador sin confundirlo con un maestro.
  - Dar al botón `type="button"`, `title` y `aria-label` «Cargar Excel maestro en Configuración», y un `IconDatabase` de 20 px con `aria-hidden`. Agregar `:focus-visible` y una zona táctil cómoda sin agrandar visualmente el ícono. El botón desaparece al cargarse la base.
- [x] Modificar `src/css/app.css`: crear clases globales `encabezado-con-base-datos` y `boton-base-datos-faltante` (kebab-case) para una fila de tres columnas: espacio simétrico a la izquierda, título centrado y botón pegado al extremo derecho. Añadir una animación suave de brillo/opacidad para el ícono **solo** mientras existe el botón, con colores ya definidos en `:root`; no inventar colores. En `@media (prefers-reduced-motion: reduce)`, desactivar la animación y conservar un estado visual fijo y visible. Ajustar separación, anchura mínima y altura de línea para títulos largos en teléfono sin tapar acciones vecinas.
- [x] En `src/pages/AjustarUbicaciones.vue`, envolver el `<h2>Ubicaciones</h2>` y `BotonBaseDatosFaltante` en el encabezado común. Eliminar la tarjeta de maestro, el `SelectorExcel`, `TarjetaSeccion`, `baseDatosExpandida`, `identificadorExcelMaestroCompartido`, `manejarBaseDatosCargada`, `manejarBaseDatosLimpia`, `manejarErrorCarga` y `finalizarExcelMaestroCompartido`, junto con imports que queden sin uso. Conservar `inicializarBaseDatos()` en `onMounted`, las ubicaciones guardadas, `sincronizarBaseConListaActual()` y toda la preparación/exportación de Excel. Quitar únicamente la asignación obsoleta a `baseDatosExpandida`.
- [x] En `src/pages/ConsultaDeUbicacion.vue`, poner el botón al extremo derecho de «Consulta de ubicación» y quitar el `SelectorExcel` condicional y sus dos manejadores dedicados. Conservar `baseDatosCargada`, el intervalo y las verificaciones de búsqueda, edición y envío. Al volver de Configuración, el montaje debe reflejar el estado nuevo.
- [x] En `src/pages/PaginaStock.vue`, poner el botón a la derecha de «Stock». Quitar ambas instancias de `SelectorExcel` y sus manejadores. Mantener la tarjeta «Base e importación» con **solo** «Importar artículos desde Ubicaciones», su deshabilitación actual cuando falta la base o hay conflicto y el aviso de sesión asociada a otro Excel. Ajustar título y descripción de la tarjeta para que ya no digan que allí se carga el maestro. Mantener `actualizarEstadoBase()`, el intervalo, la identidad de fuente y la sesión.
- [x] En `src/components/Logica/Listados/FormularioListado.vue`, quitar el `SelectorExcel` y sus importaciones y manejadores de carga/limpieza. Mantener `baseDatosCargada`, `establecerBaseCargada(cargada)`, la rama del formulario que exige base, la búsqueda y el botón «Cargar Excel» que importa otro listado. Sustituir el `v-else` asociado al selector por `v-if="baseDatosCargada"`, para que el formulario no quede activo sin maestro.
- [x] En `src/pages/PaginaListados.vue`, poner el botón a la derecha de «Listados» y quitar de `FormularioListado` los listeners `base-datos-cargada`, `base-datos-limpia` y `error-carga` vinculados al selector eliminado. Quitar `manejarBaseCargada`, `manejarErrorCarga` y `esperandoMaestroParaImportar` si ya no tienen consumidores. Mantener `onMounted` con `inicializarBaseDatos()`, `cargarDatosLocales()`, `establecerBaseCargada()` y `procesarExcelCompartidoPendiente()`. La importación manual y de un listado compartido siguen exigiendo el maestro.
- [x] En `src/components/Logica/Listados/TablaListados.vue`, agregar la prop booleana obligatoria `baseDatosCargada` desde `PaginaListados.vue`. Cuando el listado esté vacío y falte el maestro, reemplazar «Buscá o escaneá...» por una indicación para tocar el ícono del encabezado; conservar el texto anterior con maestro cargado.
- [x] En `src/pages/PaginaEtiquetas.vue`, agregar el botón a la derecha del texto «Etiquetas» dentro de `header-etiquetas`, sin desplazar ni tapar las pestañas de tamaño. En su `onMounted`, esperar `inicializarBaseDatos()` antes de mostrar el estado del botón y antes de búsquedas que dependan del maestro. Mantener formulario, etiquetas manuales, memorias, tamaños y generación de PDF utilizables aunque falte la base.
- [x] En `src/pages/RecibirUbicaciones.vue`, poner el botón a la derecha de «Ubicaciones compartidas» cuando falte el maestro. Quitar por completo la tarjeta «Cargá tu Excel base», `SelectorExcel` y los manejadores `manejarBaseDatosCargada`/`manejarErrorCarga`; el único acceso a la carga será el botón del encabezado. Mantener `route.query.id`, lectura de las ubicaciones recibidas y generación del archivo final. Al volver con el historial del navegador o el botón Atrás de Android, la URL original con `id` debe recuperarse y `onMounted` debe detectar el maestro recién cargado.

## FASE 3: Mantener los recorridos de archivos compartidos

### Objetivo

Android continúa mostrando la elección maestro/listado, y ninguno de los dos recorridos pierde el archivo pendiente al cambiar de pantalla.

### Pasos de ejecución

- [x] Modificar `src/layouts/MainLayout.vue` en `navegarADestinoExcel(destino)`: enviar `destino === 'maestro'` a `/configuracion` y `destino === 'listado'` a `/listados`, conservando `destinoExcel` y `archivoCompartido`. No modificar `ModalDestinoExcelCompartido.vue`, `ServicioArchivoCompartido.js` ni el tratamiento del listado recibido.
- [x] Modificar `rutaPoseeDestinoPendiente(pendiente)` para reconocer como destino legítimo `/configuracion` cuando `destinoExcel === 'maestro'`, además de `/listados` para `listado`. Reconocer también `/configuracion` con `destinoExcel === 'listado'`, `archivoCompartido` coincidente y `baseDatos` presente como parada temporal tras pulsar el botón de base faltante en Listados. Esto impide que el `watch` de `fullPath` reabra el modal mientras se carga el maestro. En ninguna de esas condiciones consumir o borrar un listado pendiente.
- [x] Revisar `procesarExcelCompartidoPendiente()` de `src/pages/PaginaListados.vue`: si falta el maestro, conservar el archivo y los parámetros `destinoExcel=listado`/`archivoCompartido`, mostrar una sola indicación breve para usar el botón del encabezado y salir. Al regresar a la URL de Listados con esos parámetros, `onMounted` debe procesarlo automáticamente una vez, con el maestro cargado, y limpiar el archivo/consulta según el flujo existente. Si el usuario descarta o cancela el listado, seguir usando las funciones actuales de limpieza.
- [x] En `src/pages/PaginaConfiguracion.vue`, asegurar que `SelectorExcel` reciba `identificador-archivo-compartido` **solo** para `destinoExcel=maestro`. Con `destinoExcel=listado` en la parada temporal, permitir selección manual del maestro y dejar intacto el archivo de listado pendiente. Después de éxito o descarte de un maestro compartido, limpiar únicamente sus dos parámetros de consulta para que `MainLayout` no vuelva a presentar el modal.

## FASE 4: Corregir las instrucciones visibles

### Objetivo

Los tutoriales describen la nueva ubicación del Excel maestro y no confunden su carga con la importación de otro listado.

### Pasos de ejecución

- [x] Actualizar el texto introductorio y el paso de carga de `TutorialUbicaciones.vue`: señalar Configuración > Base de datos para búsqueda y el botón del encabezado cuando falta el maestro.
- [x] Actualizar el paso de carga de `TutorialConsultaDeUbicacion.vue`: ya no afirmar que la propia pantalla muestra un selector.
- [x] Actualizar la descripción y el paso de carga de `TutorialStock.vue`: el maestro se carga en Configuración; «Importar artículos desde Ubicaciones» sigue dentro de Stock y es otra función.
- [x] Actualizar el paso «Cargar la base maestra» de `TutorialListados.vue`: señalar Configuración y distinguirlo del botón «Cargar Excel», que agrega filas desde otro listado. Conservar los demás pasos.
- [x] Actualizar el paso de autocompletado de `TutorialEtiquetas.vue`: señalar Configuración como sitio del maestro y aclarar que las etiquetas también pueden crearse manualmente.
- [x] Buscar con `rg -n "SelectorExcel|Cargar la base|Cargar Excel|base de datos" src/components/Configuracion/Tutoriales src/pages` y corregir cualquier otra instrucción visible que todavía indique cargar el maestro en los módulos anteriores. No modificar referencias válidas a importación de listados ni a exportación de Excel.

## FASE TESTING

### Objetivo

Comprobar que cambió solo el lugar de administración del maestro y que los datos y flujos anteriores siguen disponibles.

### Pruebas automatizadas

- [x] Ejecutar `npm run lint` y resolver cualquier error ESLint introducido por imports, variables, eventos o estilos.
- [x] Ejecutar `npm test` y comprobar las suites existentes.
- [x] Ejecutar `npm run build` y comprobar la compilación Quasar; este comando regenera `public/version.json` mediante `prebuild`, así que verificar el diff y no incluir cambios de versión ajenos al plan.
- [x] Usar `rg -n "<SelectorExcel|cargarArticulosDesdeExcel\(|cargarArticulosDesdeExcelCompartido\(" src` y comprobar que la interfaz del maestro solo se monta desde `PaginaConfiguracion.vue`; los usos de `LectorExcel.js` para lectura, búsqueda y actualización permanecen.

### Pruebas manuales

- [x] En navegador, comprobar sin maestro el ícono en Ubicaciones, Consulta, Stock, Listados y Etiquetas; comprobar en teléfono que el ícono no tapa títulos ni pestañas.
- [x] En navegador, tocar el ícono desde Ubicaciones y Consulta, cargar un `.xlsx` válido en Configuración, verificar nombre/cantidad, volver y comprobar que desaparece; limpiar la base y comprobar que reaparece.
- [x] En navegador, abrir Etiquetas primero tras recargar con la base persistida y comprobar que no muestra el aviso.
- [ ] Sin maestro persistido, abrir directamente Ubicaciones, Consulta de ubicación, Listados, Stock, Etiquetas y Ubicaciones compartidas. Confirmar botón pequeño animado a la derecha del título de cada pantalla; en Etiquetas debe funcionar la carga manual de etiquetas, y el formulario de Listados debe esperar al maestro.
- [ ] Pulsar el botón desde cada pantalla: Configuración abre la primera tarjeta y la resalta, con el mismo texto y selector que tenía Ubicaciones. Repetir la pulsación para comprobar que vuelve a resaltarse.
- [ ] Cargar un `.xlsx` maestro válido desde Configuración: comprobar nombre, cantidad, búsqueda/autocompletado y que los botones desaparecen al volver a los módulos. Reiniciar la app y abrir Etiquetas primero para comprobar recuperación del maestro guardado.
- [ ] Cambiar el maestro y luego limpiarlo en Configuración: comprobar actualización de las búsquedas y reaparición de los botones. En Stock, comprobar el aviso de conflicto si una sesión existente pertenece al Excel anterior.
- [ ] En Android, abrir un Excel recibido desde WhatsApp con Bitácora: comprobar que aparece el modal maestro/listado. Elegir maestro: abre Configuración, despliega la primera tarjeta y carga el archivo; probar también error, reintento y descarte sin perder el archivo antes de una decisión final.
- [ ] En Android, elegir «listado» con el maestro ya cargado: comprobar la importación existente. Repetir sin maestro: conservar el listado pendiente, pulsar el botón del encabezado, cargar el maestro en Configuración, volver a Listados y comprobar importación única del pendiente.
- [ ] Abrir un enlace de Ubicaciones compartidas sin maestro: conservar la lista y su `id` al ir a Configuración y volver; cargar el maestro y descargar el Excel final.
- [ ] Confirmar que «Cargar Excel» en Listados sigue importando otro listado y que los datos guardados de Ubicaciones, Etiquetas, Listados y Stock no se borran al trasladar el selector.

### Casos responsivos

- [x] En navegador a 390 px, comprobar Ubicaciones, Consulta, Stock, Listados, Etiquetas y la tarjeta de Configuración; con movimiento reducido, la animación del botón queda desactivada y su nombre accesible permanece.
- [ ] Revisar encabezados en teléfono estrecho y web/escritorio: el botón queda contra el borde derecho, el título conserva legibilidad y las pestañas de Etiquetas no se superponen.
- [ ] Verificar teclado y lector de pantalla mediante `title`, `aria-label` y foco visible; con movimiento reducido, el ícono permanece visible sin parpadeo.

## Progreso del plan

- [x] Fase 1: Crear el destino único en Configuración
- [x] Fase 2: Sustituir los selectores por el aviso del encabezado
- [x] Fase 3: Mantener los recorridos de archivos compartidos
- [x] Fase 4: Corregir las instrucciones visibles
- [ ] Fase Testing

Fecha de creación: 10 de octubre de 2026

Fecha de última actualización: 10 de octubre de 2026

Estado: EN PROCESO
