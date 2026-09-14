# IMPORTACIÓN AUTOMÁTICA DE ARTÍCULOS DESDE EXCEL EN LISTADOS

## Descripción del plan

Agregar a la página de Listados una importación masiva y exclusiva para archivos Excel (`.xlsx` y `.xls`). El archivo importado representa una lista de artículos distinta del Excel maestro que ya utiliza la aplicación como catálogo.

El procesamiento debe ejecutarse localmente, sin Capitana Bita ni ningún servicio de inteligencia artificial. Se recorrerán todas las hojas, filas y columnas del archivo importado. Cada fila útil representará como máximo una incorporación al listado activo: se buscará primero un código exacto del catálogo y, si no existe, se intentará resolver la descripción. Cantidad, stock, ubicación, sububicación, precio y datos similares no deben alterar el artículo ni la cantidad de filas agregadas.

Las coincidencias únicas se agregarán automáticamente. Las filas ambiguas, no encontradas o inconsistentes no se agregarán y aparecerán en un resumen final. Si el mismo artículo aparece en varias filas, se incorporará una vez por cada fila y el resumen advertirá la repetición sin abrir la confirmación individual existente.

## Objetivo principal

- Permitir cargar un Excel secundario desde el formulario del listado activo.
- Identificar artículos sin exigir posiciones fijas para las columnas.
- Priorizar coincidencias exactas por código y usar la descripción solo cuando no haya un código válido.
- Agregar automáticamente una fila por cada coincidencia única, incluidos los artículos repetidos en distintas filas.
- Informar al finalizar cuántos artículos se agregaron y qué filas quedaron repetidas, ambiguas, no encontradas o inconsistentes.
- Mantener esta función completamente local y separada de Capitana Bita.

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
- Los estilos deben usar las variables existentes de `src/css/app.css`, mantener CSS compacto y conservar nombres de archivos en PascalCase y símbolos en español.
- El comando general de lint es `npm run lint` y el build verificable es `npm run build`.

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

### No incluye

- PDF, Word, CSV, imágenes ni otros formatos.
- OCR, Capitana Bita, Firebase AI o cualquier procesamiento remoto.
- Lectura o aplicación de cantidad, stock, ubicación, sububicación, precio o costo desde el Excel importado.
- Modificación o reemplazo del Excel maestro.
- Corrección manual de filas ambiguas dentro del flujo de importación.
- Confirmaciones individuales para artículos repetidos durante la importación masiva.
- Persistencia del archivo importado después de terminar el análisis.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Logica/Listados/ServicioImportacionExcelListado.js` | Crear | `procesarImportacionExcelListado`, `analizarLibroExcelListado` | Leer todo el libro y resolver cada fila contra el catálogo maestro sin IA. |
| `src/components/Logica/Listados/PanelResultadoImportacionExcel.vue` | Crear | props `resultado`, evento `cerrar` | Mostrar cantidades, repetidos y filas que no pudieron agregarse. |
| `src/components/Logica/Listados/FormularioListado.vue` | Modificar | `seleccionarExcelListado`, `inputExcelListadoRef`, evento `archivo-excel-seleccionado` | Reorganizar el buscador y ofrecer el nuevo botón de importación junto a la cámara. |
| `src/pages/PaginaListados.vue` | Modificar | `importarExcelListado`, `resultadoImportacionExcel`, `importandoExcel`, `crearFilaListado` | Ejecutar el análisis, agregar el bloque válido, persistirlo y presentar el resumen. |
| `Pruebas/Listados/ServicioImportacionExcelListado.test.js` | Crear | casos de `analizarLibroExcelListado` | Verificar hojas, columnas, prioridades, omisiones, ambigüedades y repetidos. |

## FASE 1: Crear el lector y resolver las filas del Excel

### Objetivo

Obtener un resultado determinista y ordenado de todas las filas útiles del libro, sin modificar el catálogo maestro ni el listado activo.

### Archivos y símbolos involucrados

- Archivo nuevo `src/components/Logica/Listados/ServicioImportacionExcelListado.js`.
- Reutilizar de `src/components/Logica/Compartidos/ServicioCoincidenciasEvidenciaArticulo.js`: `crearIndiceCodigosMaestro` y `resolverCoincidenciasPorEvidencia`.
- Reutilizar de `src/components/Logica/Compartidos/ServicioBusquedaArticulos.js`: `normalizarTextoComparacionArticulo` y las reglas de contexto ya existentes.

### Pasos de ejecución

- [ ] Crear `ServicioImportacionExcelListado.js` con importación de `xlsx` y sin dependencias de Capitana Bita.
  - Exportar `procesarImportacionExcelListado({ archivo, articulos, contextoBusqueda })` como entrada para la interfaz.
  - Validar que `archivo` exista y que su nombre o MIME corresponda a `.xlsx` o `.xls`.
  - Leer el archivo como `ArrayBuffer` y delegar el análisis a una función separada y testeable.
  - Devolver errores en español para archivo inválido, libro vacío, archivo corrupto o catálogo maestro inexistente.
- [ ] Exportar `analizarLibroExcelListado({ buffer, nombreArchivo, articulos, contextoBusqueda })` como núcleo testeable.
  - Abrir el libro con `XLSX.read(buffer, { type: 'array' })`.
  - Recorrer `SheetNames` en su orden original, sin limitarse a la primera hoja.
  - Convertir cada hoja mediante `XLSX.utils.sheet_to_json()` usando `header: 1`, `raw: false`, `defval: ''` y `blankrows: false` para trabajar con valores visibles y preservar códigos formateados, incluidos ceros iniciales cuando el formato de Excel los represente.
  - Mantener por cada fila su hoja, número real de fila, índice global y valores normalizados para el resumen y el orden de inserción.
- [ ] Definir constantes internas de encabezados normalizados para clasificar columnas sin exigir nombres exactos.
  - Reconocer código mediante equivalentes como `CODIGO`, `ARTICULO`, `SKU` y `REFERENCIA`.
  - Reconocer descripción mediante equivalentes como `DESCRIPCION`, `NOMBRE`, `DETALLE` y `PRODUCTO`.
  - Ignorar columnas identificadas como `CANTIDAD`, `CANT`, `STOCK`, `UBICACION`, `SUBUBICACION`, `PRECIO`, `COSTO`, `DEPOSITO` y equivalentes coherentes ya utilizados por el proyecto.
  - Normalizar encabezados eliminando diferencias de mayúsculas, acentos y espacios.
  - Buscar la fila de encabezado al comienzo de cada hoja y conservar los índices identificados; si no existe encabezado reconocible, analizar todas las columnas de cada fila.
  - No convertir el valor de ninguna columna ignorada en cantidad, stock, ubicación ni metadatos del listado.
- [ ] Implementar una resolución por fila con prioridad absoluta para el código exacto.
  - Inspeccionar todas las celdas no excluidas de la fila, aunque el código no esté en una columna llamada `Código`.
  - Comparar los valores normalizados contra el índice exacto de códigos del catálogo maestro.
  - Si una o varias celdas identifican el mismo código único, devolver estado `unica` y un solo artículo para esa fila.
  - Si una misma fila contiene códigos exactos de artículos diferentes, devolver estado `ambigua` y no elegir automáticamente.
  - Si el código exacto está duplicado dentro del catálogo maestro, devolver estado `inconsistente` y no agregarlo.
  - Una vez encontrado un código exacto único, no usar el resto de las celdas como descripción: el código debe prevalecer y los datos auxiliares deben ignorarse.
- [ ] Implementar la búsqueda por descripción únicamente cuando no exista ningún código exacto válido en la fila.
  - Si se reconoció una columna de descripción, usar primero sus celdas de texto no vacías.
  - Si no se reconocieron encabezados, considerar como posibles descripciones las celdas de texto no vacías y no puramente numéricas.
  - Resolver cada texto posible con `resolverCoincidenciasPorEvidencia`, pasando `codigoVisible: ''`, el texto como `descripcionVisible` y el `contextoBusqueda` del listado activo.
  - Priorizar una coincidencia exacta de nombre normalizado; en su ausencia, aceptar automáticamente solo cuando las evidencias útiles de la fila terminan señalando un único código.
  - Si distintas evidencias señalan artículos únicos diferentes, o la evidencia compatible conserva varios candidatos sin uno inequívoco, devolver estado `ambigua` con los candidatos sin duplicar.
  - Si ninguna evidencia produce candidatos, devolver estado `noEncontrada`.
- [ ] Tratar cada fila como una sola unidad independiente.
  - Nunca usar una celda de cantidad para multiplicar incorporaciones.
  - Si el mismo código se resuelve en dos o más filas, conservar todas las resoluciones `unica` en el orden original.
  - Si el mismo código aparece varias veces dentro de una sola fila, generar una sola resolución porque la regla funcional es una incorporación por fila.
  - Excluir filas completamente vacías y la fila usada como encabezado del total de filas útiles.
- [ ] Devolver un contrato estable desde `analizarLibroExcelListado`.
  - Incluir `nombreArchivo`, `totalHojas`, `totalFilasUtiles` y `resoluciones` en orden de hoja y fila.
  - Cada resolución debe incluir `idFilaImportada`, `hoja`, `numeroFila`, `textoOriginal`, `estado`, `articuloUnico` y `candidatos`.
  - Los estados permitidos deben ser `unica`, `ambigua`, `noEncontrada` e `inconsistente`.
  - Incluir un motivo legible en español para estados ambiguos e inconsistentes.
  - No incluir objetos de archivo, buffers ni datos binarios en el resultado final.

## FASE 2: Incorporar el selector de Excel al formulario

### Objetivo

Mostrar el buscador en una línea completa y, debajo, dos botones del mismo ancho: `Cargar Excel` y `Escanear`.

### Archivos y símbolos involucrados

- `src/components/Logica/Listados/FormularioListado.vue`: plantilla, props, emits, referencias, métodos expuestos y estilos scoped.
- Estilos globales existentes de `src/css/app.css`: `.camara-ubicacion`, `.fila-codigo-camara` y `.contenedor-input-codigo`, solo como referencia para evitar afectar Ubicaciones y otras pantallas.

### Pasos de ejecución

- [ ] Reorganizar el bloque actual `.fila-codigo-camara` sin cambiar el buscador ni `BuscadorArticulos`.
  - Mantener `.contenedor-input-codigo` con el input, el botón de copiar y el desplegable de resultados ocupando el ancho completo.
  - Crear debajo una fila scoped, por ejemplo `.acciones-entrada-listado`, con dos columnas iguales.
  - Colocar primero el nuevo botón `Cargar Excel`, con `IconFileSpreadsheet` y texto visible.
  - Mover el botón de cámara existente a la segunda columna, conservar `abrirCamara()` y mostrar también el texto `Escanear` para que ambas acciones sean claras.
  - Reutilizar colores de `src/css/app.css`; no introducir colores literales nuevos.
- [ ] Agregar un input de archivo oculto y controlado por el formulario.
  - Crear `inputExcelListadoRef = ref(null)` con `type="file"` y `accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`.
  - Crear `seleccionarExcelListado()` para limpiar el valor anterior y abrir el selector, permitiendo volver a elegir el mismo archivo.
  - Crear `manejarArchivoExcelSeleccionado(evento)` para tomar exclusivamente el primer archivo y emitir `archivo-excel-seleccionado` con el objeto `File`.
  - No leer ni procesar el libro dentro del componente visual.
- [ ] Ampliar el contrato de `FormularioListado`.
  - Agregar la prop booleana `importandoExcel`, con valor inicial `false`.
  - Agregar `archivo-excel-seleccionado` a `defineEmits`.
  - Deshabilitar ambos botones, el input y las interacciones incompatibles cuando `busquedaDeshabilitada` o `importandoExcel` estén activos.
  - Mostrar `Procesando…` en el botón de Excel durante la importación y usar `IconLoader2` con la animación ya presente o una animación scoped consistente.
  - Incorporar el selector abierto al método `cerrarInteraccion()` solo si existe una interacción cancelable real; no simular que se puede cancelar un diálogo nativo ya entregado al sistema.
- [ ] Ajustar la experiencia responsiva.
  - Mantener ambos botones en una fila de dos columnas en teléfonos y escritorio.
  - Usar ancho disponible, separación uniforme y altura táctil mínima coherente con los controles existentes.
  - Evitar desbordamiento del texto en anchos pequeños y mantener visibles los iconos.
  - No modificar las clases globales compartidas de cámara si el mismo resultado puede obtenerse con estilos scoped del formulario.

## FASE 3: Integrar la importación automática con el listado activo

### Objetivo

Procesar el archivo seleccionado, insertar todas las coincidencias únicas mediante una sola persistencia y conservar los fallos para el resumen.

### Archivos y símbolos involucrados

- `src/pages/PaginaListados.vue`: `FormularioListado`, `ocupado`, `crearFilaListado`, `persistirActivo`, cambios de listado y navegación atrás.
- `src/components/Logica/Listados/ServicioImportacionExcelListado.js`: `procesarImportacionExcelListado`.

### Pasos de ejecución

- [ ] Agregar el estado de importación en `PaginaListados.vue`.
  - Crear `importandoExcel = ref(false)`.
  - Crear `resultadoImportacionExcel = ref(null)`.
  - Incluir `importandoExcel.value` dentro de `ocupado` para bloquear administración, exportación, búsqueda y cámara mientras se procesa y persiste el archivo.
  - Pasar `:importando-excel="importandoExcel"` a `FormularioListado` y escuchar `@archivo-excel-seleccionado="importarExcelListado"`.
- [ ] Implementar `importarExcelListado(archivo)`.
  - Verificar que haya un listado activo, que el catálogo maestro esté cargado y que no exista otra operación ocupada.
  - Cerrar resultados anteriores de esta importación antes de comenzar, sin cerrar ni alterar permanentemente Capitana Bita.
  - Llamar `procesarImportacionExcelListado()` con el archivo, `obtenerArticulosCargados()` y `listadoActivo.value.contextoBusqueda`.
  - Separar resoluciones únicas, ambiguas, no encontradas e inconsistentes.
  - No enviar el archivo, sus filas ni sus resultados a `ServicioCapitanaBita.js`.
- [ ] Insertar automáticamente todas las resoluciones únicas como un bloque.
  - Reutilizar `crearFilaListado()` para conservar `idFila`, código normalizado, descripción del maestro, stock y ubicación locales.
  - No llamar `agregarArticulo()`, porque esa función abre la confirmación individual de repetidos.
  - Generar una fila nueva por cada resolución única aunque su código ya exista en el listado o haya aparecido antes en el mismo archivo.
  - Crear las filas en un orden que preserve visualmente el orden original del Excel bajo el orden predeterminado descendente del listado; procesar el bloque en sentido inverso o asignar fechas coherentes sin cambiar el contrato de almacenamiento.
  - Agregar temporalmente todas las filas al listado activo y llamar `persistirActivo()` una sola vez.
  - Si la persistencia falla, retirar únicamente las filas creadas por esa importación, mantener intacto el contenido anterior y mostrar un error.
- [ ] Calcular los repetidos para el resumen sin impedir la inserción.
  - Contar códigos repetidos entre las resoluciones únicas del propio archivo.
  - Detectar también cuántas apariciones del código ya existían en el listado antes de importar.
  - Crear para cada código repetido un registro con código, descripción, cantidad de filas importadas y cantidad previa en el listado.
  - No reutilizar `articuloPendienteRepetido`, no abrir el aviso `aviso-articulo-repetido` y no detener la importación.
- [ ] Construir `resultadoImportacionExcel` después de completar la persistencia.
  - Incluir el nombre del archivo, hojas y filas útiles analizadas, cantidad realmente agregada, repetidos, ambiguas, no encontradas e inconsistencias.
  - Considerar éxito válido un archivo sin coincidencias únicas: mostrar el resumen con cero agregados y los problemas encontrados.
  - Mostrar una notificación positiva breve con la cantidad agregada y dejar el detalle en el panel.
  - Ante error de lectura o persistencia, usar `Notify` con mensaje negativo y no presentar como agregado ningún artículo revertido.
  - Restablecer `importandoExcel` en `finally` y devolver el foco al buscador cuando termine.
- [ ] Limpiar correctamente el estado al cambiar de contexto.
  - Crear `cerrarResultadoImportacionExcel()` y `limpiarEstadoImportacionExcel()` con responsabilidades explícitas.
  - Limpiar el resultado al crear, abrir, duplicar o eliminar un listado para impedir que un resumen anterior aparezca asociado a otro listado.
  - En `cerrarPasoAtrasNativo()`, cerrar primero las interacciones activas del formulario y después el panel de importación antes de continuar con otros estados cerrables.
  - No mezclar `resultadoImportacionExcel` con `resultadoPendienteCapitanaBita`; ambos flujos deben poder mantenerse separados.

## FASE 4: Mostrar el resumen final de importación

### Objetivo

Dar un resultado comprensible de lo agregado automáticamente y de cada fila que requirió advertencia.

### Archivos y símbolos involucrados

- Archivo nuevo `src/components/Logica/Listados/PanelResultadoImportacionExcel.vue`.
- `src/pages/PaginaListados.vue`: montaje del panel y evento `cerrar`.

### Pasos de ejecución

- [ ] Crear `PanelResultadoImportacionExcel.vue` como componente de presentación.
  - Definir la prop `resultado` de tipo `Object`, requerida.
  - Definir el evento `cerrar`.
  - No realizar búsquedas, mutaciones del listado ni persistencia dentro del panel.
  - Usar iconos de `@tabler/icons-vue` y variables de color ya existentes.
- [ ] Mostrar un encabezado con resultado general.
  - Informar el nombre del archivo.
  - Mostrar `Se agregaron N artículos de M filas útiles`.
  - Incluir un botón accesible para cerrar el resumen.
- [ ] Mostrar secciones únicamente cuando tengan contenido.
  - `Repetidos agregados`: código, descripción, cantidad de filas del Excel y cantidad que ya existía en el listado.
  - `Filas ambiguas`: hoja, número de fila, texto original, motivo y códigos/descripciones candidatos.
  - `No encontrados`: hoja, número de fila y texto original.
  - `Inconsistencias`: hoja, número de fila, texto original y motivo, incluidos códigos duplicados en el catálogo maestro.
  - Aclarar que las filas ambiguas, no encontradas e inconsistentes no fueron agregadas.
- [ ] Integrar el panel en `PaginaListados.vue`.
  - Ubicarlo dentro de `.zona-agregar-listado`, inmediatamente después de `FormularioListado` y antes de otros paneles o de `Columnas visibles`.
  - Pasar `:resultado="resultadoImportacionExcel"` y conectar `@cerrar="cerrarResultadoImportacionExcel"`.
  - Mantener `aria-live="polite"` para anunciar el final del proceso sin convertir el panel en un diálogo bloqueante.
- [ ] Ajustar el diseño responsivo.
  - Presentar las secciones en una columna en teléfono.
  - Permitir que códigos, descripciones y nombres de hojas largos hagan salto de línea sin desbordar.
  - En escritorio, aprovechar el ancho disponible sin crear tablas horizontales difíciles de leer.
  - Mantener botones con área táctil suficiente y contraste basado en los tokens existentes.

## FASE TESTING

### Objetivo

Validar que cualquier formato razonable de Excel se recorra completamente, que una fila produzca como máximo una incorporación, que los datos excluidos nunca afecten el listado y que el flujo sea seguro en móvil y web.

### Pruebas automatizadas

- [ ] Crear `Pruebas/Listados/ServicioImportacionExcelListado.test.js` con `node:test`, `node:assert/strict` y libros generados en memoria mediante `xlsx`.
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
- [ ] Ejecutar la prueba nueva directamente y exigir cero fallos:

  ```text
  node --test Pruebas/Listados/ServicioImportacionExcelListado.test.js
  ```

- [ ] Ejecutar las pruebas existentes para comprobar que la resolución reutilizada de Capitana Bita no cambió:

  ```text
  npm test
  ```

- [ ] Ejecutar ESLint y corregir todos los errores relacionados con los archivos modificados o creados:

  ```text
  npm run lint
  ```

- [ ] Ejecutar el build completo de Quasar y comprobar que `xlsx` funciona dentro del bundle web/Capacitor:

  ```text
  npm run build
  ```

### Pruebas manuales

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

## Progreso del plan

- [ ] Fase 1: Crear el lector y resolver las filas del Excel
- [ ] Fase 2: Incorporar el selector de Excel al formulario
- [ ] Fase 3: Integrar la importación automática con el listado activo
- [ ] Fase 4: Mostrar el resumen final de importación
- [ ] Fase Testing

Fecha de creación: 14 de septiembre de 2026
Fecha de última actualización: 14 de septiembre de 2026
Estado: BORRADOR
