# Plan de etiquetas 10 × 15 y 2,5 × 6,7 cm

## Descripción del plan

Agregar una segunda presentación de la lista de etiquetas mediante pestañas. La etiqueta 10 × 15 cm es el comportamiento de producción y debe conservar su diseño, generación de PDF, datos y memoria. La etiqueta chica (2,5 × 6,7 cm) reutiliza los mismos artículos y cantidades, pero puede tener una descripción editada y una memoria independientes. El formato 5 × 10 cm queda fuera de este trabajo.

## Objetivo principal

- Mostrar las mismas etiquetas en dos pestañas, primero 10 × 15 cm y luego 2,5 × 6,7 cm.
- Permitir que una descripción sin memoria propia tome como punto de partida la del otro tamaño, en ambas direcciones, conservando saltos de línea y espacios; una edición posterior pertenece solo al tamaño activo.
- Hacer que la vista chica tenga proporción y tamaño físico menores, y que su PDF mida 67 × 25 mm.
- Preservar el comportamiento actual de 10 × 15 cm, incluidos PDF, previsualización, memoria existente y etiquetas ya guardadas.

## Contexto técnico verificado

- Proyecto Quasar/Vue 3 con JavaScript; `AGENTS.md` exige nombres de archivos PascalCase, símbolos en español, UTF-8 y prioridad a ESLint.
- `src/pages/PaginaEtiquetas.vue` fija `tamanoSeleccionado` en `10x15cm`, muestra un texto de tamaño único y ya conoce las tres configuraciones para PDF.
- `src/components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta2.5x6.7.js` ya define 67 × 25 mm. No hay que recrearla. La configuración 5 × 10 cm existe, pero no se activará.
- `TablaEtiquetas.vue` muestra una lista común; `TarjetaPreviewEtiquetaMovil.vue` y `UsoLayoutEtiquetaPreview.js` usan 10 × 15 por defecto. La tarjeta fija `15cm`, `10cm` y `aspect-ratio: 15 / 10` en CSS.
- `UsoLayoutEtiquetaPreview.js` usa anchos de barra de 70 a 110 mm y limita la descripción a cinco líneas. También compacta espacios y omite renglones vacíos. Pasarle solo la configuración chica produciría una vista incorrecta y podría cortar texto.
- `TarjetaPreviewEtiquetaMovil.vue` inicia la edición de descripción con `lineasDescripcion.value.join('\n')`: esto reconstruye el texto desde el render y puede alterar el texto manual. En la rama chica hay que editar el `String` original de la variante visible.
- `GeneradorEtiquetasPDF.js` genera el PDF desde ese layout y toma las dimensiones de `configuracion.pagina`; la vista y el PDF deben coincidir.
- `usoAlmacenamientoEtiquetas.js` guarda una única lista bajo `historial_etiquetas`; `ServicioEnvioEtiquetas.js` también agrega artículos a esa lista. Los registros anteriores pueden no tener `tamano` ni variantes de descripción.
- `usoAlmacenamientoMemoriaEtiquetas.js` guarda la memoria actual bajo `memoria_etiquetas_v1`, indexada solo por código. `ServicioMemoriasEtiquetas.js` y `PaginaMemoriasEtiquetas.vue` gestionan exportación, importación y recuento. Los JSON anteriores no identifican tamaño.
- `TablaEtiquetas.vue` emite hoy `editar-etiqueta` y `guardar-memoria-etiqueta` uno detrás del otro al confirmar; sus manejadores asíncronos pueden competir. `PaginaEtiquetas.vue` usa `Promise.all` al guardar las memorias durante el PDF; como cada actualización reescribe el objeto de Preferences, las escrituras simultáneas pueden perder entradas.
- `PaginaEtiquetas.vue` sondea `historial_etiquetas` cada dos segundos y hoy reemplaza la lista completa cuando cambia la cantidad. La integración nueva debe incorporar los artículos llegados desde Listados sin pisar ediciones locales.
- `package.json` dispone de `npm run lint`, `npm run build` y `npm test`; no hay pruebas actuales del módulo de etiquetas.

## Alcance

### Incluye

- Pestañas simples en el encabezado de Etiquetas, con 10 × 15 seleccionado al abrir.
- Lista, códigos, ubicaciones, cantidades y orden compartidos entre pestañas; descripciones y memorias independientes por tamaño.
- Adaptación inicial bidireccional desde la otra memoria o descripción disponible, sin guardar una copia nueva por el solo hecho de cambiar de pestaña.
- Vista chica y PDF chico ajustables en una implementación separada, con reducción de texto hasta un mínimo inicial de 4 pt. Si aun así el contenido excede el área, debe verse el corte en el límite de la tarjeta y del PDF; no se eliminan renglones del dato ni se informa falsamente que cabe.
- Exportación, importación y respaldo de ambas memorias, con compatibilidad para JSON antiguos como memorias de 10 × 15.

### No incluye

- Activar o ajustar 5 × 10 cm.
- Rediseñar el layout de 10 × 15 cm ni cambiar `ConfiguracionEtiqueta10x15.js`.
- Clasificar automáticamente las partes de la descripción provenientes del Excel maestro.
- Refactorizar de forma general los dos layouts mientras se afina la etiqueta chica.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/TamanosEtiqueta.js` | Crear | `TAMANO_ETIQUETA_GRANDE`, `TAMANO_ETIQUETA_CHICA`, `OPCIONES_TAMANOS_ETIQUETA` | Centralizar los dos IDs y las pestañas visibles. |
| `src/components/BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js` | Modificar | `upsertMemoriaEtiqueta`, `obtenerMemoriaEtiquetaPorCodigo`, exportación/importación/respaldo | Separar por tamaño y conservar la memoria antigua de 10 × 15. |
| `src/components/Logica/Etiquetas/ResolverDescripcionEtiqueta.js` | Crear | `resolverDescripcionEtiqueta`, `guardarDescripcionDeTamano` | Centralizar la precedencia de memoria y variante local sin mutar el otro tamaño. |
| `src/pages/PaginaEtiquetas.vue` | Modificar | `tamanoSeleccionado`, `listaEtiquetas`, `aplicarMemoriaEtiqueta`, `agregarEtiqueta`, `editarEtiqueta`, `generarPDF` | Añadir pestañas y pasar la variante activa a vista, edición y PDF. |
| `src/components/Logica/Etiquetas/TablaEtiquetas.vue` | Modificar | `props`, `TarjetaPreviewEtiquetaMovil`, edición y restablecimiento | Recibir configuración activa y editar solo la descripción del tamaño visible. |
| `src/components/Logica/Etiquetas/TarjetaPreviewEtiquetaMovil.vue` | Modificar | `props`, `usarLayoutEtiquetaPreview`, estilo de contenedor | Renderizar proporción chica y mantener la interacción de edición. |
| `src/components/Logica/Etiquetas/UsoLayoutEtiquetaChica.js` | Crear | `calcularLayoutEtiquetaChica` | Calcular exclusivamente el layout de 67 × 25 mm, conservando el texto manual. |
| `src/components/Logica/Etiquetas/UsoLayoutEtiquetaPreview.js` | Modificar | `calcularLayoutEtiquetaPreview`, `usarLayoutEtiquetaPreview` | Despachar al layout chico y dejar intacta la rama actual de 10 × 15. |
| `src/components/Logica/Etiquetas/GeneradorEtiquetasPDF.js` | Revisar; modificar solo si falla la comparación | `generarDocumentoEtiquetas` | Mantener la ruta grande y generar 67 × 25 mm desde la configuración chica. |
| `src/components/Logica/Etiquetas/ServicioMemoriasEtiquetas.js` | Modificar | `exportarMemoriasEtiquetas`, `importarMemoriasDesdeTexto` | Transportar memorias de ambos tamaños. |
| `src/pages/PaginaMemoriasEtiquetas.vue` | Modificar | `refrescarDatosMemorias`, texto de resumen | Mostrar el recuento por tamaño y total, sin mezclar memorias. |
| `src/components/Logica/Etiquetas/ServicioEnvioEtiquetas.js` | Conservar contrato; verificar integración | `crearEtiquetaDesdeArticulo` | Los artículos enviados desde Listados siguen naciendo en 10 × 15 y se ven en ambas pestañas. |
| `src/components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta2.5x6.7.js` | Modificar solo si el ajuste chico lo requiere | `configuracionEtiqueta2_5x6_7` | Afinar únicamente valores del formato chico. |
| `Pruebas/Etiquetas/ResolverDescripcionEtiqueta.test.js` | Crear | Casos de resolución y edición | Cubrir precedencia bidireccional y aislamiento. |
| `Pruebas/Etiquetas/UsoLayoutEtiquetaChica.test.js` | Crear | Casos de layout chico | Cubrir dimensiones, saltos y no truncamiento del dato original. |
| `Pruebas/Etiquetas/MemoriaEtiquetasPorTamano.test.js` | Crear | Casos JSON v1/v2 | Cubrir importación/exportación por código y tamaño. |

## FASE 1: Separar datos y memoria por tamaño

### Objetivo

Permitir dos descripciones por artículo sin que cambiar de pestaña ni editar la chica sobrescriba 10 × 15.

### Pasos de ejecución

- [ ] Crear `TamanosEtiqueta.js` con `TAMANO_ETIQUETA_GRANDE = '10x15cm'`, `TAMANO_ETIQUETA_CHICA = '2.5x6.7cm'` y `OPCIONES_TAMANOS_ETIQUETA = [{ id, nombre }]` en orden grande/chica. Exportar estos símbolos para almacenamiento, resolución y página. No incluir `5x10cm` en las opciones visibles.
- [ ] Mantener `memoria_etiquetas_v1` como clave exclusiva de 10 × 15; crear `memoria_etiquetas_2_5x6_7_v1` para la chica. Ambas guardan `entradas` por código normalizado, con `{ codigo, descripcionFormateada, actualizadoEn }`. Leer la clave antigua sin reescribirla ni borrar `respaldo_memoria_etiquetas_v1`.
  - En `usoAlmacenamientoMemoriaEtiquetas.js`, usar `upsertMemoriaEtiqueta({ codigo, descripcionFormateada, tamano = TAMANO_ETIQUETA_GRANDE })` y `obtenerMemoriaEtiquetaPorCodigo(codigo, tamano = TAMANO_ETIQUETA_GRANDE)`. También añadir tamaño opcional a `eliminarMemoriaEtiquetaPorCodigo` y `limpiarMemoriaEtiquetas`. El valor omitido conserva el contrato anterior; un tamaño desconocido devuelve `{ exito: false, mensaje }` en operaciones de escritura y lanza error en lecturas. Nunca cae silenciosamente en 10 × 15.
  - Mantener `obtenerTodasLasMemoriasEtiquetas(tamano = TAMANO_ETIQUETA_GRANDE)` para el consumidor anterior. Agregar `obtenerTodasLasMemoriasPorTamano()` que devuelve `{ '10x15cm': Entrada[], '2.5x6.7cm': Entrada[] }` para la página y exportación. Aplicar el límite de 1500 entradas a cada memoria por separado.
- [ ] Crear `ResolverDescripcionEtiqueta.js` sin dependencia de Vue ni Preferences. Exportar `resolverDescripcionEtiqueta({ etiqueta, tamano, memoriaPropia = null, memoriaAlterna = null })` y `guardarDescripcionDeTamano({ etiqueta, tamano, descripcion })`.
  - Contrato persistido de cada registro: conservar `id`, `codigo`, `cantidad`, `ubicacion`, `descripcion` y `descripcionOriginal`; añadir `tamano` como tamaño de creación y `descripcionesPorTamano` como objeto opcional con claves `10x15cm` y `2.5x6.7cm`. `descripcion` queda como texto del tamaño de creación; cambiar de pestaña no lo reemplaza. `memoriaActiva` y `memoriaActualizadaEn` son datos derivados de la vista y no deben escribirse por un cambio de pestaña.
  - Registro histórico sin `tamano`: interpretar `descripcion` como variante 10 × 15. Registro con un tamaño histórico distinto de los dos visibles: conservarlo sin migración destructiva y usar su descripción como texto de origen; no activar 5 × 10.
  - `resolverDescripcionEtiqueta` devuelve `{ descripcion, origen, memoriaActiva, memoriaActualizadaEn }`. Precedencia fija: memoria propia; variante propia; memoria del otro tamaño; variante del otro tamaño; `descripcion`/`descripcionOriginal` como origen. Solo una memoria propia cuenta como activa; una descripción prestada no se marca como memoria activa del tamaño nuevo.
  - Tratar cadena vacía como ausencia de variante y conservar literalmente las cadenas no vacías, incluidos saltos `\n`, renglones vacíos y espacios internos. No refluír ni añadir Enter al cambiar de pestaña; solo cambia la escala visual.
  - `guardarDescripcionDeTamano` devuelve una copia con la variante indicada actualizada, sin cambiar la variante opuesta. Actualiza también el campo legado `descripcion` únicamente si se edita el tamaño de creación. No modifica Preferences; lo usará la página al confirmar una edición.
- [ ] En `PaginaEtiquetas.vue`, conservar `listaEtiquetas` como lista canónica persistida y añadir `memoriasPorTamano` (objeto reactivo con mapas por código) y `etiquetasVisibles` (proyección calculada de `listaEtiquetas` para `tamanoSeleccionado`). `TablaEtiquetas` y `generarPDF` deben consumir `etiquetasVisibles`; `guardarEtiquetas` recibe siempre la lista canónica, nunca la proyección.
  - `cargarEtiquetasGuardadas` carga la lista sin mutar su `descripcion`; `cargarMemoriasPorTamano` lee ambos mapas al entrar y después de importar. `aplicarMemoriaEtiqueta`/`reaplicarMemoriasEnPantalla` deben pasar a actualizar la proyección, sin copiar la descripción prestada sobre la lista canónica.
  - `agregarEtiqueta` marca el tamaño de creación actual y su primera variante, conservando el texto recibido del formulario como origen. Un artículo enviado desde Listados conserva `tamano: '10x15cm'`; si llega mientras se ve la chica, aparece allí mediante la proyección. No duplicar registros al alternar.
  - `editarEtiqueta` para cambios de cantidad/código/ubicación busca el registro canónico por `id` y copia solo los campos compartidos que cambiaron; nunca reemplaza ese registro por la proyección visible. La edición confirmada de descripción se guarda mediante `guardarDescripcionDeTamano` para el tamaño activo. Si cambia el código, recalcular memorias por el código nuevo sin alterar la memoria del código anterior.
  - Al confirmar descripción o restablecer desde maestro, guardar primero la memoria del tamaño activo; si falla, avisar y no presentar como confirmado el cambio. Después actualizar la variante local y persistir la lista. La memoria opuesta no se escribe. En `generarPDF`, guardar las memorias activas en serie, no con `Promise.all`, para evitar pérdidas por lecturas/escrituras simultáneas de Preferences.
  - `verificarNuevasEtiquetas` compara IDs y fusiona las nuevas filas externas con la lista canónica sin reemplazar variantes editadas durante el sondeo. No limpiar ni reordenar las filas existentes por cambiar de tamaño.

## FASE 2: Pestañas e integración de edición

### Objetivo

Cambiar entre 10 × 15 y la etiqueta chica sobre las mismas etiquetas, con controles claros en móvil y escritorio.

### Pasos de ejecución

- [ ] Reemplazar el texto fijo del encabezado de `PaginaEtiquetas.vue` por dos botones con aspecto de pestañas: `10 × 15 cm` y `2,5 × 6,7 cm`, en ese orden.
  - `tamanoSeleccionado` inicia siempre en `TAMANO_ETIQUETA_GRANDE`; no persistir la pestaña activa. Renderizar `OPCIONES_TAMANOS_ETIQUETA` como botones tipo pestaña de navegador y resolver cada ID mediante `obtenerConfiguracionPorTamano`. Mantener `5x10cm` fuera del control.
  - Usar clic, flechas izquierda/derecha y Home/End para cambiar pestaña, con `role="tablist"`, `role="tab"`, `aria-selected` y foco visible; indicar claramente la activa. Usar variables de `src/css/app.css` y el breakpoint móvil de 600 px existente; permitir que dos pestañas compartan el ancho sin desbordar.
  - El encabezado deja de afirmar que todas se generan en 10 × 15; el texto, si se conserva, debe indicar el tamaño activo. Conservar acceso a Memorias y Agregar etiquetas debajo.
- [ ] En `TablaEtiquetas.vue`, añadir prop obligatoria `configuracion` (objeto de configuración existente) y pasarla a `TarjetaPreviewEtiquetaMovil.vue`. Dar a la tarjeta una `key` formada por `etiqueta.id` y `configuracion.id` para reconstruir `usarLayoutEtiquetaPreview` al alternar; observar `configuracion.id` para borrar `borradoresEdicion` y cancelar ediciones en curso antes de mostrar el otro tamaño.
- [ ] Sustituir las dos emisiones consecutivas de `confirmarEdicionInline` y `restablecerEtiquetaDesdeMaestro` por un único evento `confirmar-etiqueta` con `{ etiqueta, tamano }`; manejarlo secuencialmente en `PaginaEtiquetas.vue` mediante `confirmarEtiquetaEditada`. Las actualizaciones de cantidad siguen usando `editar-etiqueta` y no crean memoria. No duplicar guardados ni dejar que el cierre visual de la edición oculte un fallo de persistencia.
  - El restablecimiento desde Excel maestro afecta solo a la variante activa; su descripción pasa a la memoria de ese tamaño cuando se confirme, como hace hoy el flujo grande. Código y ubicación siguen siendo campos compartidos.
  - `cantidadMemoriasActivas` cuenta solo `memoriaActiva` de `etiquetasVisibles`, sin contar texto prestado desde la otra pestaña. `obtenerEtiquetasOrdenadas()` conserva el orden actual y devuelve la proyección visible para el PDF.
- [ ] Revisar el formulario y `ServicioEnvioEtiquetas.js` en ambas pestañas: la nueva etiqueta se agrega una sola vez a `historial_etiquetas`; no se crea una lista por tamaño. Con un mismo artículo repetido, la memoria sigue aplicándose por código y tamaño a ambas filas, como ya sucede por código en 10 × 15.

## FASE 3: Vista y PDF de la etiqueta chica

### Objetivo

Mostrar una tarjeta visualmente menor y generar un PDF de 67 × 25 mm con el mismo contenido y distribución.

### Pasos de ejecución

- [ ] Crear `UsoLayoutEtiquetaChica.js` con `calcularLayoutEtiquetaChica({ etiqueta, configuracion, anchoReferenciaPx })`, que devuelva la misma estructura de layout que `calcularLayoutEtiquetaPreview`.
  - Usar `ConfiguracionEtiqueta2.5x6.7.js` como fuente de página de 67 × 25 mm, márgenes y parámetros chicos. Ajustar solo ese archivo y el layout nuevo al afinar; no modificar `ConfiguracionEtiqueta10x15.js` ni la configuración 5 × 10.
  - Duplicar las operaciones de medición y distribución necesarias para experimentar sin tocar el algoritmo grande. Entregar el contrato `{ codigo, codigoBarra, descripcion, ubicacion }` con las mismas propiedades y unidades que `calcularLayoutEtiquetaPreview`, para reutilizar `convertirLayoutPreviewAPixeles` y el generador PDF.
  - Limitar barra y texto a 67 mm menos márgenes. Conservar saltos `\n` explícitos, renglones vacíos y espacios internos al medir, dividir y devolver `descripcion.lineas`; una línea manual no se fusiona con otra. Puede mantenerse la presentación en mayúsculas actual sin alterar el `String` guardado. Reducir letra por ancho y alto disponibles hasta un mínimo inicial de 4 pt, configurable solo en la rama chica. No usar `slice` para quitar líneas.
  - Si aun al mínimo no entra todo, devolver todas las líneas: el límite físico de la tarjeta y de la página PDF hará visible el corte. No alterar el texto persistido ni afirmar que la etiqueta cabe. Ajustar durante revisión visual hasta que vista y PDF representen el mismo límite.
- [ ] En `UsoLayoutEtiquetaPreview.js`, despachar a `calcularLayoutEtiquetaChica` solo cuando `configuracion.id === TAMANO_ETIQUETA_CHICA`. Conservar el cuerpo y valores del cálculo 10 × 15 sin cambios; el punto de despacho debe ser la única diferencia en esa rama. `GeneradorEtiquetasPDF.js` ya consume layout y dimensiones de la configuración: tocarlo solo para corregir una diferencia observada entre vista y PDF chico.
- [ ] En `TarjetaPreviewEtiquetaMovil.vue`, aplicar tamaño máximo `6.7cm × 2.5cm` y proporción `67 / 25` solo a la pestaña chica. Conservar las reglas existentes de 10 × 15 para esa pestaña.
  - Añadir prop obligatoria `configuracion` y pasarla a `usarLayoutEtiquetaPreview({ anchoBase: 360, configuracion, alCambiarEscala })`. Aplicar la clase/estilo chico según `configuracion.id`, sin sobreescribir el CSS base de 10 × 15. En teléfono, usar `width: min(100%, 6.7cm)` y mantener controles fuera del rectángulo de impresión.
  - En `iniciarEdicion('descripcion')` de la rama chica, iniciar `borradorDescripcion` desde `props.etiqueta.descripcion` literal; no desde `lineasDescripcion.value.join('\n')`. Mantener el inicio actual para 10 × 15. En la chica, renderizar líneas con `white-space: pre` para que los espacios internos no se colapsen y mostrar renglones vacíos con su altura. El `textarea` debe conservar el texto literal al confirmar.
  - Verificar código, barras, líneas, ubicación y edición en teléfono y escritorio. Mantener la misma descripción visible en tarjeta y PDF, incluidos espacios y saltos manuales; comprobar que `UsoCodigoBarraEtiqueta.js` y el canvas PDF siguen mostrando CODE39 legible en la barra chica sin modificar la barra grande.

## FASE 4: Compartir memorias sin mezclar tamaños

### Objetivo

Respaldar e intercambiar memorias de los dos tamaños sin perder la compatibilidad con archivos existentes.

### Pasos de ejecución

- [ ] Ampliar el JSON de `ServicioMemoriasEtiquetas.js` y `usoAlmacenamientoMemoriaEtiquetas.js` para incluir el identificador de tamaño por entrada en una versión nueva del formato de intercambio.
  - El nuevo payload es `{ version: '2.0', exportadoEn, exportadoPor, cantidad, entradas }`, con cada entrada `{ codigo, tamano, descripcionFormateada, actualizadoEn }`. `construirJsonCompartirMemorias` exporta ambas memorias y `parsearJsonCompartirMemorias` valida versión, tamaño y campos antes de escribir nada.
  - Un JSON `version: '1.0'` sin tamaño se interpreta íntegramente como 10 × 15. Una entrada v2 con tamaño desconocido se cuenta como inválida y no se asigna a 10 × 15. Para códigos repetidos, la clave de identidad es `(codigo, tamano)` y prevalece la entrada válida con fecha más nueva; en empate conserva la local, como ahora.
  - Evitar la pérdida silenciosa que produciría el límite actual de 1000 entradas al reunir dos memorias: admitir hasta 3000 entradas en JSON v2, equivalente a los dos límites de 1500, y rechazar de forma visible un archivo que exceda ese máximo. Conservar la importación de archivos v1 existentes.
  - `crearRespaldoMemoriaEtiquetas` guarda ambas memorias antes de fusionar bajo una clave nueva `respaldo_memorias_etiquetas_v2`; deja intacta la clave de respaldo anterior. Construir la fusión de ambos tamaños antes de persistirla. Escribir únicamente las claves afectadas y, si una escritura falla, restaurar las claves ya escritas desde el respaldo y mostrar error. No informar éxito parcial.
- [ ] Actualizar `PaginaMemoriasEtiquetas.vue` para informar memorias 10 × 15, memorias chicas y total. `ServicioMemoriasEtiquetas.js` mantiene el nombre genérico del JSON y los metadatos actuales de última exportación/importación; el resultado de importación informa nuevas, actualizadas, ignoradas e inválidas sumando ambos tamaños.
  - En `PaginaEtiquetas.vue`, el importador automático recarga ambos mapas de memoria y recompone la proyección del tamaño visible. La importación manual en `PaginaMemoriasEtiquetas.vue` refleja los tres recuentos al terminar.

## FASE TESTING

### Pruebas automatizadas

- [ ] Crear y ejecutar `node --test Pruebas/Etiquetas/ResolverDescripcionEtiqueta.test.js Pruebas/Etiquetas/UsoLayoutEtiquetaChica.test.js Pruebas/Etiquetas/MemoriaEtiquetasPorTamano.test.js`.
  - Cubrir etiqueta histórica grande, etiqueta nacida chica, ida y vuelta sin edición, edición aislada, memoria propia frente a memoria prestada, dos filas con el mismo código, cuatro `\n`, renglón vacío y espacios internos. Verificar que la lista canónica no cambie al alternar.
  - Cubrir layout chico: página 67 × 25 mm, ancho de barra dentro de márgenes, líneas manuales completas y mínimo de 4 pt sin `slice`. Una prueba de texto demasiado largo debe mantener la cantidad de líneas devueltas, aunque visualmente excedan la página.
  - Cubrir JSON v1 como memoria grande, JSON v2 con el mismo código en ambos tamaños, tamaño inválido, límite de entradas y exportación/reimportación sin mezcla. Usar un doble de Preferences o funciones puras extraídas para probar almacenamiento sin acceder a datos reales.
- [ ] Ejecutar `npm run lint`, `npm test` y `npm run build`; corregir todos los errores nuevos.

### Pruebas manuales

- [ ] Antes de modificar el layout, registrar una referencia visual y un PDF 10 × 15 representativos en un entorno de prueba; al final verificar que tamaño de página, posición, contenido, barras, edición y memoria coincidan con esa referencia. Comprobar en Git que `ConfiguracionEtiqueta10x15.js` y el cuerpo original de cálculo grande no cambiaron.
- [ ] Con una copia de una lista existente de unas 35 etiquetas, o con datos equivalentes si no se dispone del dispositivo de Leo, alternar a la chica y volver: deben conservarse los mismos registros, cantidades, orden y descripciones grandes. No limpiar ni sobrescribir las etiquetas reales para probar.
- [ ] Editar una etiqueta en la chica, cerrar y reabrir la página, y alternar: la chica debe mostrar su ajuste y 10 × 15 su versión original. Repetir con un artículo creado primero en la chica y luego abierto en grande.
- [ ] Revisar descripciones de una y varias líneas, cuatro saltos manuales, renglones vacíos, varios espacios entre palabras, códigos largos y ubicaciones largas. Abrir la edición chica y cancelarla o confirmarla sin cambios: el texto persistido debe seguir idéntico. Ajustar solo el layout chico según la previsualización y el PDF impreso.
- [ ] Generar PDF para cada pestaña y comprobar 150 × 100 mm en 10 × 15 y 67 × 25 mm en la chica, una página por copia y el nombre de archivo correspondiente.
- [ ] Exportar e importar memorias antiguas y nuevas en un entorno de prueba; comprobar respaldo, recuentos por tamaño y que una importación chica no sobrescriba 10 × 15. Repetir importación compartida desde la pantalla de Etiquetas.
- [ ] Verificar en Android con una instalación de prueba y una impresión o PDF abierto a escala real. No declarar terminado el trabajo si 10 × 15 difiere de la referencia o si los controles de la chica no se pueden usar.

### Casos responsivos

- [ ] Comprobar pestañas y tarjetas en teléfono angosto, teléfono ancho y escritorio. La vista chica debe ser visiblemente menor que la de 10 × 15 y conservar controles alcanzables, sin desbordar la pantalla.

## Progreso del plan

- [ ] Fase 1: Separar datos y memoria por tamaño
- [ ] Fase 2: Pestañas e integración de edición
- [ ] Fase 3: Vista y PDF de la etiqueta chica
- [ ] Fase 4: Compartir memorias sin mezclar tamaños
- [ ] Fase Testing

Fecha de creación: 9 de octubre de 2026
Fecha de última actualización: 9 de octubre de 2026
Estado: BORRADOR
