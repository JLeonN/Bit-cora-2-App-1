# Etiqueta horizontal de 5 × 2,5 cm

## Descripción del plan

Agregar una tercera pestaña de etiquetas para el soporte físico de 50 mm de ancho por 25 mm de alto, siempre horizontal. La medida corresponde a la etiqueta despegada, no a una hoja contenedora. La primera prueba usa 3 mm de margen interno en los cuatro lados: área útil de 44 × 19 mm. La experiencia de edición y cantidad debe seguir la de 67 × 25 mm; el trazado, la generación del PDF y la apertura del diálogo de impresión del nuevo formato deben poder ajustarse sin cambiar los otros dos. Este plan está escrito para ejecutarse en un chat nuevo sin depender de la conversación.

## Objetivo principal

- Mostrar `5 × 2,5 cm` como tercera pestaña de `PaginaEtiquetas.vue` y ofrecer vista previa, edición, cantidad, PDF y botón de impresión de escritorio.
- Conservar una memoria local propia para sus descripciones y tamaños manuales; incluirla en el respaldo y en la importación/exportación JSON existentes.
- Mantener sin cambios el resultado de PDF de `10x15cm` y `2.5x6.7cm`; ambos deben pasar sus pruebas de regresión.

## Contexto técnico verificado

- Raíz: `C:/Z-Programacion/Quasar/Bitacora-2-App`. Antes de ejecutar, leer íntegro `AGENTS.md` de la raíz, revisar `Memory.md`, `git status --short` y volver a inspeccionar los archivos del mapa de cambios, porque este plan describe el código visto el 14 de octubre de 2026. Respetar cambios posteriores y no sobrescribir trabajo ajeno.
- Vue 3 con Quasar 2; `PaginaEtiquetas.vue` mantiene una lista canónica de tarjetas y cambia su proyección por `tamanoSeleccionado`. `TablaEtiquetas.vue`, `TarjetaPreviewEtiquetaMovil.vue` y `ControlesFilaEtiqueta.vue` contienen la edición y cantidad reutilizables. El PDF actual se genera en `GeneradorEtiquetasPDF.js`, con una página por copia, en milímetros y orientación horizontal.
- La configuración 10 × 15 usa página `[150, 100]` mm y margen configurado de 4 mm; la de 6,7 × 2,5 usa `[67, 25]` mm y 1,5 mm. No cambiar esas configuraciones. El archivo heredado `ConfiguracionEtiqueta2.5x6.7.js` ya existe con puntos en el nombre: conservarlo como está; todos los archivos nuevos deben cumplir PascalCase sin separadores, según `AGENTS.md`.
- `UsoLayoutEtiquetaChica.js` traza el formato de 67 × 25 mm. `UsoLayoutEtiquetaPreview.js` selecciona ese trazado y convierte las posiciones en milímetros a estilos de la tarjeta. El generador PDF actual dibuja un canvas a partir de esa vista previa. La nueva medida necesita su propio trazado y su propio generador; la conversión de posiciones a píxeles y los controles visuales sí se comparten.
- `usoAlmacenamientoMemoriaEtiquetas.js` usa `@capacitor/preferences`: `memoria_etiquetas_v1` para la grande y `memoria_etiquetas_2_5x6_7_v1` para la chica. JSON v2 identifica cada entrada con `tamano`; JSON v1 siempre se interpreta como memoria grande. Cada memoria admite 1500 entradas. Actualmente el archivo compartido admite 3000, justo el máximo de dos tamaños.
- `npm run lint`, `npm run build` y `node --test Pruebas/Etiquetas/*.test.js` son comandos aplicables; `npm test` omite las pruebas de etiquetas, así que no usarlo como sustituto.

## Alcance

### Incluye

- Etiqueta nueva de 50 × 25 mm, margen interno inicial de 3 mm, código, Code 39, descripción y ubicación, igual que las otras.
- Edición en línea de código, descripción, ubicación, tamaño de letra automático/manual de la descripción y cantidad, con memoria separada.
- Descarga/compartición de PDF y diálogo de impresión web para esta medida mediante un módulo nuevo independiente.
- Respaldo, exportación, importación y resumen de memorias para tres tamaños.

### No incluye

- Recalibrar físicamente las etiquetas existentes, cambiar el formato del código de barras, alterar el ordenamiento o modificar el flujo de compartir en Android.
- Confirmar que la impresora física respeta 50 × 25 mm: eso requiere una prueba humana con papel real. La vista previa y el PDF deben permitir hacer esa prueba.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/TamanosEtiqueta.js` | Modificar | `TAMANO_ETIQUETA_5X2P5`, `OPCIONES_TAMANOS_ETIQUETA` | Registrar la tercera medida. |
| `src/components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta5x2p5.js` | Crear | `configuracionEtiqueta5x2p5` | Parámetros físicos y de trazado del nuevo tamaño. |
| `src/components/Logica/Etiquetas/UsoLayoutEtiqueta5x2p5.js` | Crear | `calcularLayoutEtiqueta5x2p5` | Calcular las posiciones propias de la etiqueta nueva. |
| `src/components/Logica/Etiquetas/UsoLayoutEtiquetaPreview.js` | Modificar | `calcularLayoutEtiquetaPreview` | Seleccionar el nuevo trazado y compartir solo la conversión a estilos. |
| `src/components/Logica/Etiquetas/GeneradorEtiquetas5x2p5PDF.js` | Crear | `generarDocumentoEtiquetas5x2p5` | Generar, descargar y abrir impresión sin modificar el generador existente; la página conserva el compartir en Android. |
| `src/pages/PaginaEtiquetas.vue` | Modificar | `obtenerConfiguracionPorTamano`, `etiquetasVisibles`, `generarPDF` | Conectar pestaña, proyección y ruta PDF/impresión. |
| `src/components/Logica/Etiquetas/TarjetaPreviewEtiquetaMovil.vue` | Modificar | `esChica`, `esEtiqueta5x2p5` | Reutilizar edición y fijar proporción 2:1 en la vista previa. |
| `src/components/Logica/Etiquetas/TablaEtiquetas.vue` | Modificar | `confirmarEdicionInline`, `restablecerEtiquetaDesdeMaestro` | Reutilizar controles y guardar tamaño manual de la nueva medida. |
| `src/components/Logica/Etiquetas/ResolverDescripcionEtiqueta.js` | Modificar | `resolverDescripcionEtiqueta`, `guardarDescripcionDeTamano` | Resolver descripción y tamaño manual propios sin prestarles persistencia a otros tamaños. |
| `src/components/BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js` | Modificar | `CLAVES`, `obtenerTodasLasMemoriasPorTamano`, JSON v2 | Clave local exclusiva y respaldo/importación/exportación. |
| `src/components/Logica/Etiquetas/ServicioMemoriasEtiquetas.js` | Modificar | `exportarMemoriasEtiquetas` | Incluir la tercera memoria en el JSON. |
| `src/pages/PaginaMemoriasEtiquetas.vue` | Modificar | `cantidadMemorias5x2p5`, `cantidadMemorias` | Mostrar cantidad propia y total de tres tamaños. |
| `Pruebas/Etiquetas/UsoLayoutEtiqueta5x2p5.test.js` | Crear | pruebas `node:test` | Verificar geometría y ajuste automático/manual. |
| `Pruebas/Etiquetas/MemoriaEtiquetasPorTamano.test.js` | Modificar | pruebas de tres memorias | Verificar separación, JSON y respaldo. |
| `Pruebas/Etiquetas/ResolverDescripcionEtiqueta.test.js` | Modificar | pruebas de tres variantes | Verificar cambios de pestaña y ausencia de contaminación. |

## FASE 1: Registrar tamaño y trazar la etiqueta

### Objetivo

Obtener una configuración horizontal de 50 × 25 mm y un layout independiente con contenido dentro del margen inicial.

### Pasos de ejecución

- [x] En `TamanosEtiqueta.js`, exportar `const TAMANO_ETIQUETA_5X2P5 = '5x2.5cm'` y añadir al final de `OPCIONES_TAMANOS_ETIQUETA` `{ id: TAMANO_ETIQUETA_5X2P5, nombre: '5 × 2,5 cm' }`. Mantener los identificadores y el orden de las dos primeras opciones.
- [x] Crear `ConfiguracionEtiqueta5x2p5.js` con exportación nombrada `configuracionEtiqueta5x2p5`. Copiar íntegro el objeto de `ConfiguracionEtiqueta2.5x6.7.js`, sin importar ni mutar el original, y cambiar únicamente estos valores: `nombre: '5x2.5 cm'`, `id: TAMANO_ETIQUETA_5X2P5`, `pagina.ancho: 50`, `pagina.alto: 25`, `pagina.margenes.todos: 3`, `codigoBarra.ancho: 38`, `codigoBarra.alto: 4`, `codigoBarra.posicionY: 7.5`, `descripcion.maximoLineas: 4`, `ubicacion.tamanoFuente: 4.5`, `ubicacion.posicionX: 3`, `ubicacion.posicionY: 22`, `codigoArticulo.tamanosAutomaticos.corto.tamano: 9`. Mantener sin cambios todos los demás campos copiados; el nuevo layout ajustará el tamaño del código hacia abajo según el ancho. El objeto tiene identidad propia y ningún parámetro nuevo se lee desde la configuración de 67 × 25 mm.
- [x] Crear `UsoLayoutEtiqueta5x2p5.js` con `export function calcularLayoutEtiqueta5x2p5({ etiqueta = {}, configuracion, anchoReferenciaPx = 1500 })`. Debe devolver exactamente el contrato de `calcularLayoutEtiquetaChica`: objetos `codigo`, `codigoBarra`, `descripcion`, `ubicacion` y `anchoReferenciaPx`, con textos normalizados y posiciones en mm. No llamar ni modificar `calcularLayoutEtiquetaChica`; copiar solo la técnica local de medición de texto con canvas y su alternativa para Node.
  - Definir dentro del archivo `MM_POR_PT = 0.352777778`, `TAMANO_MINIMO_PT = 4`, `TAMANO_MAXIMO_AUTOMATICO_PT = 18`, `INICIO_DESCRIPCION_MM = 12.5`, `RESERVA_INFERIOR_MM = 3`. Usar `margen = configuracion.pagina.margenes.todos`, `anchoDisponible = pagina.ancho - 2 * margen` y `altoDisponible = pagina.alto - margen - INICIO_DESCRIPCION_MM - RESERVA_INFERIOR_MM`.
  - Código: mayúsculas y trim; empezar en `Math.min(9, configuracion.codigoArticulo.tamanosAutomaticos.corto.tamano)`, reducir de 0,25 pt hasta 4 pt cuando su ancho medido supere 44 mm. Usar `posicionY = margen + tamanoCodigo * MM_POR_PT * 0.79`.
  - Barra: `ancho = Math.min(configuracion.codigoBarra.ancho, anchoDisponible)`; centrarla con `(pagina.ancho - ancho) / 2`; usar alto y Y de configuración. Descripción: conservar saltos manuales, mayúsculas y como máximo las primeras cuatro líneas solo para dibujar, sin truncar la descripción persistida. Empezar en 18 pt y reducir de 0,25 pt hasta 4 pt mientras alguna línea exceda 44 mm o el bloque (`cantidadLineas * tamanoPt * MM_POR_PT * 0.95`) exceda `altoDisponible`. Su Y es `INICIO_DESCRIPCION_MM + tamanoFinal * MM_POR_PT * 0.79`, con interlineado `tamanoFinal * 0.95`.
  - Tamaño manual: si `etiqueta.tamanoDescripcionPt` es `null` o `undefined`, usar automático. Si es numérico, limitarlo al rango de 2 a 40 pt como en la chica, incluso si el usuario decide desbordar durante las pruebas. Ubicación: usar texto existente o `Sin ubicación`, tamaño y coordenadas de configuración. No introducir redondeos de tamaño de página.
- [x] En `UsoLayoutEtiquetaPreview.js`, importar la constante y el nuevo layout; en `calcularLayoutEtiquetaPreview`, enviar solo `5x2.5cm` a `calcularLayoutEtiqueta5x2p5`, conservar el caso `2.5x6.7cm` y dejar intacta la rama 10 × 15. Reutilizar `convertirLayoutPreviewAPixeles` y `usarLayoutEtiquetaPreview` sin duplicarlos.

## FASE 2: Reutilizar interfaz, edición y memoria propia

### Objetivo

Mostrar la tercera medida con los mismos controles de edición y cantidad, guardando descripción y tamaño manual con su identificador exclusivo.

### Pasos de ejecución

- [x] En `PaginaEtiquetas.vue`, importar `TAMANO_ETIQUETA_5X2P5` y `configuracionEtiqueta5x2p5`; añadirla al mapa de `obtenerConfiguracionPorTamano` con clave computada `[TAMANO_ETIQUETA_5X2P5]`. Inicializar `memoriasPorTamano` con `{ [TAMANO_ETIQUETA_5X2P5]: {} }` además de las existentes. Mantener selección inicial 10 × 15. El `v-for` de pestañas y navegación por flechas/Home/End deben incluirla mediante `OPCIONES_TAMANOS_ETIQUETA`.
- [x] En `PaginaEtiquetas.vue`, mantener `listaEtiquetas` única y `tamano` al agregar. En `etiquetasVisibles`, para el tamaño nuevo usar la memoria 10 × 15 como `memoriaAlterna` únicamente para texto inicial; la memoria propia es `memoriasPorTamano[TAMANO_ETIQUETA_5X2P5]`. Para la grande y la chica conservar el emparejamiento grande↔chica actual. Nunca guardar una memoria alterna como memoria propia solo por cambiar de pestaña o generar el PDF.
- [x] En `ResolverDescripcionEtiqueta.js`, importar `TAMANO_ETIQUETA_5X2P5`. Para `resolverDescripcionEtiqueta`, fijar alterno grande→chica, chica→grande y 5 × 2,5→grande; conservar la prioridad actual: memoria propia, variante propia, memoria alterna, variante alterna, descripción original. Solo las memorias propias dan `memoriaActiva: true`. Tanto `TAMANO_ETIQUETA_CHICA` como `TAMANO_ETIQUETA_5X2P5` deben proyectar `tamanoDescripcionPt` desde su memoria propia o `tamanosDescripcionPorTamano[tamano]`, y `guardarDescripcionDeTamano` debe escribirlo bajo la clave del tamaño activo, sin tocar los otros.
- [x] En `TarjetaPreviewEtiquetaMovil.vue`, conservar el componente compartido y su lógica de click para editar código, descripción y ubicación. Definir `esEtiqueta5x2p5 = computed(() => props.configuracion.id === TAMANO_ETIQUETA_5X2P5)` y redefinir `esChica` como pertenencia a los dos tamaños de 25 mm de alto; así reutiliza límite de cuatro líneas, botones −/+/Auto, `borradorTamanoDescripcionPt`, guardado sin cambios y textarea. Dar a la nueva variante clases CSS `envoltura-preview-5x2p5` y `preview-etiqueta-5x2p5`, aplicadas junto con las clases de chica; situar la regla nueva después de `.preview-etiqueta-chica` para que sobrescriba `aspect-ratio` con `50 / 25` y mantenga ancho de presentación `min(100%, 12cm)`. Mantener las reglas CSS compactas y colores de `src/css/app.css`.
- [x] En `TablaEtiquetas.vue`, aplicar la clase visual `tarjeta-etiqueta-chica` también a `5x2.5cm` para reutilizar disposición y controles de cantidad, confirmar/restablecer. Cambiar las dos condiciones de `TAMANO_ETIQUETA_CHICA` en `confirmarEdicionInline` y `restablecerEtiquetaDesdeMaestro` a pertenencia de ambos tamaños pequeños: pasar el tamaño manual cuando exista en el borrador y restablecerlo a `null` para el tamaño activo. No tocar el comportamiento de la grande.
- [x] En `usoAlmacenamientoMemoriaEtiquetas.js`, incorporar `[TAMANO_ETIQUETA_5X2P5]: 'memoria_etiquetas_5x2_5_v1'` a `CLAVES` y devolver la tercera lista en `obtenerTodasLasMemoriasPorTamano`. En `upsertMemoriaEtiqueta` y validación de `tamanoDescripcionPt` de `parsearJsonCompartirMemorias`, admitir el campo manual de 2 a 40 pt y `null` para ambas etiquetas de 25 mm. Respetar 1500 entradas por tamaño y mantener JSON v1→grande. Elevar `MAXIMO_ENTRADAS_COMPARTIR` a 4500 (máximo teórico de tres memorias), ajustar el mensaje de error a esa constante y usarla para JSON v2; conservar el límite histórico de 1000 para JSON v1. Los bucles de respaldo y fusión que iteran `CLAVES` deben incluir la tercera memoria y preservar la reversión si falla una escritura.
- [x] En `ServicioMemoriasEtiquetas.js`, agregar las entradas `memorias[TAMANO_ETIQUETA_5X2P5]` con su campo `tamano` a la lista de `exportarMemoriasEtiquetas`. Mantener nombre de archivo y metadatos actuales.
- [x] En `PaginaMemoriasEtiquetas.vue`, crear `cantidadMemorias5x2p5 = ref(0)`, llenarla en `refrescarDatosMemorias`, mostrar `Memorias 5 × 2,5:` entre chica y total, y sumar las tres referencias en `cantidadMemorias`. No crear una página nueva.

## FASE 3: Generar y mandar a imprimir el PDF independiente

### Objetivo

Obtener un PDF horizontal de 50 × 25 mm con una página por copia sin cambiar los módulos de PDF e impresión de los tamaños anteriores.

### Pasos de ejecución

- [x] Crear `GeneradorEtiquetas5x2p5PDF.js` con exportación pública `async function generarDocumentoEtiquetas5x2p5(listaEtiquetas, configuracion, destino = 'descargar')`, mismo contrato de resultado que `generarDocumentoEtiquetas`: `{ exito, mensaje, rutaArchivo, nombreArchivo }`. Importar `jsPDF`, `JsBarcode`, `Filesystem`, `Directory`, `obtenerNombreUsuario`, `limpiarCodigoParaBarra`, `validarCodigoParaBarra` y `calcularLayoutEtiqueta5x2p5`. Usar `convertirLayoutPreviewAPixeles` solo como conversión visual de mm a píxeles; no llamar a `generarDocumentoEtiquetas`, `generarCanvasEtiquetaDesdePreview`, `crearPaginaEtiqueta` ni `imprimirPDFEnNavegador`.
  - Crear el PDF con `orientation: 'landscape'`, `unit: 'mm'`, `format: [25, 50]`, `compress: true`; validar lista y configuración antes de iterar. Recorrer la lista ya ordenada y añadir `etiqueta.cantidad || 1` páginas por artículo. Renderizar una imagen por artículo y reutilizarla para sus copias como hace hoy el caso chico, liberando los canvas temporales. Los campos se dibujan desde el layout propio: código, Code 39 centrado, líneas de descripción y ubicación. Fondo blanco, texto negro y ausencia de barras si el código es incompatible, igual que el generador actual. Usar el perfil web `{ anchoRenderPx: 1200, escalaCanvas: 1.35, calidadJpeg: 0.82 }` y móvil `{ anchoRenderPx: 680, escalaCanvas: 1, calidadJpeg: 0.68 }` como valores iniciales de la prueba; insertar la imagen en `(0, 0, 50, 25)` mm. Pausar cooperativamente cada ocho páginas.
  - Para `destino === 'descargar'` en web, implementar en este archivo la descarga Blob/URL temporal. Para `destino === 'imprimir'` en web, implementar `imprimirPDF5x2p5EnNavegador(pdf)` local al módulo, con iframe, `print()`, timeout de carga de 20 s, limpieza por `afterprint` y limpieza de reserva a los 300 s, siguiendo el contrato de errores del archivo existente sin importarlo. En Android escribir base64 en `Directory.Cache` y devolver su URI; `PaginaEtiquetas.vue` conservará el acto de compartir el archivo. El nombre debe seguir `Etiquetas - ${nombreUsuario} - 5x2.5cm ${fecha} # ${hora}.pdf`.
  - Usar `try/catch` y devolver `exito: false` con mensaje y `rutaArchivo: null` cuando falle. El generador nuevo es el único lugar donde se ajustarán posteriormente las reglas de descarga e impresión de esta medida.
- [x] En `PaginaEtiquetas.vue`, conservar `generarPDF(destino)` como controlador compartido de Loading, Notify, ordenación y compartir en Android. Dentro de él seleccionar por `tamanoSeleccionado`: si es `TAMANO_ETIQUETA_5X2P5`, llamar `generarDocumentoEtiquetas5x2p5`; en los otros casos llamar exactamente al `generarDocumentoEtiquetas` existente. Conservar los botones actuales de la barra y el aviso de impresora; este último mostrará 50 × 25 mm mediante `configuracionActiva.pagina`.
- [x] En `PaginaEtiquetas.vue`, conservar la condición actual de persistir automáticamente la memoria grande al generar y las memorias chicas solo si están activas. Para 5 × 2,5, persistir únicamente cuando `etiqueta.memoriaActiva` sea verdadera. Una descripción tomada de 10 × 15 no debe crear una memoria 5 × 2,5. `confirmarEtiquetaEditada` sí debe guardar la memoria nueva al editar, mediante el servicio de almacenamiento común.

## FASE TESTING

### Objetivo

Comprobar datos, medidas, interacción y regresiones antes de la prueba física de Leo.

### Pruebas automatizadas

- [x] Crear `Pruebas/Etiquetas/UsoLayoutEtiqueta5x2p5.test.js` con `node:test`: comprobar página `[50, 25]`, margen 3, barra dentro de `[3, 47]` mm, código y ubicación iniciados dentro del área útil, máximo cuatro líneas visibles sin mutar ni truncar el dato original, reducción automática al estrecharse la etiqueta, y tamaño manual/automático. Verificar que una etiqueta de una línea puede usar más puntos que la misma descripción en cuatro líneas.
- [x] Ampliar `MemoriaEtiquetasPorTamano.test.js` para guardar el mismo código con tres descripciones/tamaños manuales distintos; comprobar tres claves locales, respaldo de tres memorias, JSON v2 de tres tamaños, importación y rechazo de tamaño desconocido o tamaño manual fuera de 2–40 pt. Ampliar el caso de fallo durante fusión para que, si falla la escritura de la tercera memoria tras escribir las primeras dos, ambas vuelvan a sus valores originales. Conservar los casos v1 existentes.
- [x] Ampliar `ResolverDescripcionEtiqueta.test.js`: al alternar grande→chica→5 × 2,5→grande no cambia `id`, cantidad ni datos persistidos; la nueva medida toma texto inicial de la grande cuando no tiene propio, pero la memoria de 5 × 2,5 gana cuando existe; tamaño manual, Auto y restablecimiento quedan por tamaño. Comprobar que un click sin edición no escribe una descripción truncada mediante la revisión manual de la tarjeta.
- [x] Ejecutar `node --test Pruebas/Etiquetas/*.test.js`, `npm run lint` y `npm run build`. Resolver errores nuevos; distinguir fallos previos si los hubiera revisando el estado inicial. Ejecutar pruebas de PDF con inspección del archivo: 50 × 25 mm por página y número de páginas igual a suma de cantidades, incluso con varios artículos. Mantener un caso de regresión que confirme las dimensiones 150 × 100 y 67 × 25 mm.

### Pruebas manuales

- [ ] En web de escritorio: abrir las tres pestañas con mouse y flechas/Home/End; crear una etiqueta, cambiar código/descripción/ubicación, probar Auto, −, +, saltos de línea, cantidad numérica y ±; descargar cada tamaño y verificar que la lista y el orden no cambian. En 5 × 2,5, imprimir y verificar que el navegador ofrece papel 50 × 25 mm a tamaño real (100 %, sin ajustar). No dar por verificada la salida física solo porque apareció el diálogo.
- [ ] En 5 × 2,5, probar un código Code 39 válido, otro incompatible, descripción corta, cuatro renglones y tamaño manual grande. Confirmar que el resultado coincide con la vista previa dentro de las restricciones del tamaño; si un tamaño manual extremo desborda, el comportamiento es explícito y voluntario como en 6,7 × 2,5.
- [ ] Guardar una descripción distinta para el mismo código en cada pestaña. Cerrar y reabrir, exportar/importar el JSON en web y Android, y comprobar que cada memoria reaparece en su pestaña, que el resumen suma las tres y que cambiar de pestaña sin editar no crea memorias nuevas.
- [ ] En Android, generar y compartir el PDF 5 × 2,5 con dos copias, reabrirlo y comprobar tamaño de página y número de páginas. En teléfono de 320–340 px, 360 px y escritorio, comprobar pestañas legibles o desplazables sin corte, tarjeta con proporción 2:1, controles accesibles y sin desbordamiento horizontal.
- [ ] Leo: imprimir una etiqueta física con papel 50 × 25 mm, escala 100 %, márgenes de impresión desactivados si el controlador lo permite; medir página y margen interno de 3 mm y comprobar legibilidad/escaneo. Registrar cualquier ajuste físico posterior solo para esta medida.

## Progreso del plan

- [x] Fase 1: Registrar tamaño y trazar la etiqueta
- [x] Fase 2: Reutilizar interfaz, edición y memoria propia
- [x] Fase 3: Generar y mandar a imprimir el PDF independiente
- [ ] Fase Testing: automatización completa; pruebas manuales y físicas pendientes de Leo

Fecha de creación: 14 de octubre de 2026
Fecha de última actualización: 14 de octubre de 2026
Estado: IMPLEMENTADO, PENDIENTE DE PRUEBAS MANUALES Y FÍSICAS

Verificaciones ejecutadas el 14 de octubre de 2026: 22 pruebas de etiquetas, lint y build correctos; PDF nuevo de 3 páginas (50 × 25 mm), regresión PDF grande (150 × 100 mm) y chica (67 × 25 mm). Inspección visual de páginas 1 y 3 del nuevo PDF; web a 320 px con pestañas desplazables, proporción 2:1, edición de tamaño manual y exportación JSON v2 de la memoria nueva. Las pruebas con Android, diálogo de impresión y papel real permanecen sin marcar.
Adaptación al código vigente: `PaginaEtiquetas.vue` conserva un mapeo heredado para `5x10cm` que no aparece en las pestañas. Se agregó la tercera medida al mapa sin retirar ese caso ni cambiar los generadores PDF existentes.
