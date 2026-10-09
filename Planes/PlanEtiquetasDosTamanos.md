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
- `GeneradorEtiquetasPDF.js` genera el PDF desde ese layout y toma las dimensiones de `configuracion.pagina`; la vista y el PDF deben coincidir.
- `usoAlmacenamientoEtiquetas.js` guarda una única lista bajo `historial_etiquetas`; `ServicioEnvioEtiquetas.js` también agrega artículos a esa lista. Los registros anteriores pueden no tener `tamano` ni variantes de descripción.
- `usoAlmacenamientoMemoriaEtiquetas.js` guarda la memoria actual bajo `memoria_etiquetas_v1`, indexada solo por código. `ServicioMemoriasEtiquetas.js` y `PaginaMemoriasEtiquetas.vue` gestionan exportación, importación y recuento. Los JSON anteriores no identifican tamaño.
- `package.json` dispone de `npm run lint`, `npm run build` y `npm test`; no hay pruebas actuales del módulo de etiquetas.

## Alcance

### Incluye

- Pestañas simples en el encabezado de Etiquetas, con 10 × 15 seleccionado al abrir.
- Lista, códigos, ubicaciones, cantidades y orden compartidos entre pestañas; descripciones y memorias independientes por tamaño.
- Adaptación inicial bidireccional desde la otra memoria o descripción disponible, sin guardar una copia nueva por el solo hecho de cambiar de pestaña.
- Vista chica y PDF chico ajustables en una implementación separada, con reducción de texto hasta un mínimo práctico por afinar visualmente. Si el contenido excede el área, debe verse el desborde o corte como ocurre hoy, sin reescribir el texto guardado.
- Exportación, importación y respaldo de ambas memorias, con compatibilidad para JSON antiguos como memorias de 10 × 15.

### No incluye

- Activar o ajustar 5 × 10 cm.
- Rediseñar el layout de 10 × 15 cm ni cambiar `ConfiguracionEtiqueta10x15.js`.
- Clasificar automáticamente las partes de la descripción provenientes del Excel maestro.
- Refactorizar de forma general los dos layouts mientras se afina la etiqueta chica.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js` | Modificar | `upsertMemoriaEtiqueta`, `obtenerMemoriaEtiquetaPorCodigo`, exportación/importación/respaldo | Separar por tamaño y conservar la memoria antigua de 10 × 15. |
| `src/components/Logica/Etiquetas/ResolverDescripcionEtiqueta.js` | Crear | `resolverDescripcionEtiqueta`, `guardarDescripcionDeTamano` | Centralizar la precedencia de memoria y variante local sin mutar el otro tamaño. |
| `src/pages/PaginaEtiquetas.vue` | Modificar | `tamanoSeleccionado`, `listaEtiquetas`, `aplicarMemoriaEtiqueta`, `agregarEtiqueta`, `editarEtiqueta`, `generarPDF` | Añadir pestañas y pasar la variante activa a vista, edición y PDF. |
| `src/components/Logica/Etiquetas/TablaEtiquetas.vue` | Modificar | `props`, `TarjetaPreviewEtiquetaMovil`, edición y restablecimiento | Recibir configuración activa y editar solo la descripción del tamaño visible. |
| `src/components/Logica/Etiquetas/TarjetaPreviewEtiquetaMovil.vue` | Modificar | `props`, `usarLayoutEtiquetaPreview`, estilo de contenedor | Renderizar proporción chica y mantener la interacción de edición. |
| `src/components/Logica/Etiquetas/UsoLayoutEtiquetaChica.js` | Crear | `calcularLayoutEtiquetaChica` | Calcular exclusivamente el layout de 67 × 25 mm, conservando el texto manual. |
| `src/components/Logica/Etiquetas/UsoLayoutEtiquetaPreview.js` | Modificar | `calcularLayoutEtiquetaPreview`, `usarLayoutEtiquetaPreview` | Despachar al layout chico y dejar intacta la rama actual de 10 × 15. |
| `src/components/Logica/Etiquetas/ServicioMemoriasEtiquetas.js` | Modificar | `exportarMemoriasEtiquetas`, `importarMemoriasDesdeTexto` | Transportar memorias de ambos tamaños. |
| `src/pages/PaginaMemoriasEtiquetas.vue` | Modificar | `refrescarDatosMemorias`, texto de resumen | Mostrar el recuento por tamaño y total, sin mezclar memorias. |
| `src/components/Logica/Etiquetas/ServicioEnvioEtiquetas.js` | Revisar y modificar solo si hace falta | `crearEtiquetaDesdeArticulo` | Mantener los artículos enviados desde Listados como registros inicialmente 10 × 15 y compatibles con ambas vistas. |
| `Pruebas/Etiquetas/ResolverDescripcionEtiqueta.test.js` | Crear | Casos de resolución y edición | Cubrir precedencia bidireccional y aislamiento. |
| `Pruebas/Etiquetas/UsoLayoutEtiquetaChica.test.js` | Crear | Casos de layout chico | Cubrir dimensiones, saltos y no truncamiento del dato original. |

## FASE 1: Separar datos y memoria por tamaño

### Objetivo

Permitir dos descripciones por artículo sin que cambiar de pestaña ni editar la chica sobrescriba 10 × 15.

### Pasos de ejecución

- [ ] Mantener la clave existente `memoria_etiquetas_v1` como almacenamiento exclusivo de 10 × 15 y agregar una clave nueva exclusiva para 2,5 × 6,7. No migrar ni reescribir masivamente los datos viejos.
  - Añadir el parámetro de tamaño a `upsertMemoriaEtiqueta({ codigo, descripcionFormateada, tamano = '10x15cm' })` y `obtenerMemoriaEtiquetaPorCodigo(codigo, tamano = '10x15cm')`.
  - Validar los tamaños admitidos: `10x15cm` y `2.5x6.7cm`. El valor omitido conserva el comportamiento antiguo.
  - Hacer que listar, respaldar, fusionar y exportar consideren ambas claves. No cambiar el contenido de la memoria antigua por una simple lectura.
- [ ] Crear `ResolverDescripcionEtiqueta.js` como función pura que reciba el registro, el tamaño activo y las memorias consultadas de ambos tamaños.
  - `resolverDescripcionEtiqueta({ etiqueta, tamano, memoriaPropia, memoriaAlterna })` devuelve `{ descripcion, origen, memoriaActiva }`.
  - Prioridad: memoria del tamaño activo; variante local confirmada del tamaño activo; memoria del otro tamaño; variante local del otro tamaño; descripción de origen del artículo.
  - Para registros históricos, interpretar `etiqueta.descripcion` sin `tamano` como variante 10 × 15. Para registros nuevos, guardar el tamaño de creación y una variante local de ese tamaño.
  - Preservar el `String` original con sus `\n` y espacios. El cambio de tamaño solo cambia qué texto se muestra; no transforma ni persiste el texto de la otra variante.
  - `guardarDescripcionDeTamano({ etiqueta, tamano, descripcion })` devuelve un registro nuevo con la variante activa actualizada; nunca reemplaza la variante del otro tamaño. Mantener los campos heredados requeridos por los consumidores actuales.
- [ ] Actualizar `PaginaEtiquetas.vue` para que `cargarEtiquetasGuardadas`, `verificarNuevasEtiquetas`, `agregarEtiqueta`, `editarEtiqueta`, `guardarMemoriaDesdeEtiqueta` y `reaplicarMemoriasEnPantalla` utilicen esa resolución.
  - Mantener una sola lista persistida con los mismos IDs, códigos, ubicaciones, cantidades y orden. Pasar a la tabla una proyección de la variante visible, sin persistir el resultado de un simple cambio de pestaña.
  - Las etiquetas creadas en la pestaña chica deben nacer con variante chica; si después se abre 10 × 15 sin memoria propia, deben partir de esa variante chica. Hacer el mismo recorrido en sentido inverso.
  - La edición confirmada y la generación de PDF guardan memoria solo para el tamaño activo. Si se edita la chica, la descripción y memoria antiguas de 10 × 15 permanecen intactas.
  - Cuando llegue un artículo desde `ServicioEnvioEtiquetas.js`, conservar el contrato de `historial_etiquetas` y resolverlo correctamente aunque se esté viendo la pestaña chica.

## FASE 2: Pestañas e integración de edición

### Objetivo

Cambiar entre 10 × 15 y la etiqueta chica sobre las mismas etiquetas, con controles claros en móvil y escritorio.

### Pasos de ejecución

- [ ] Reemplazar el texto fijo del encabezado de `PaginaEtiquetas.vue` por dos botones con aspecto de pestañas: `10 × 15 cm` y `2,5 × 6,7 cm`, en ese orden.
  - Usar `tamanoSeleccionado` como estado único, iniciar siempre en `10x15cm` y seleccionar mediante clic o teclado; indicar la pestaña activa con estilo y atributos accesibles.
  - Usar colores de `src/css/app.css`, mantener el encabezado legible en teléfono y web, y evitar desbordamiento horizontal.
  - Exponer en el código una lista de opciones para que el aspecto del control pueda reemplazarse después sin rehacer la lógica de tamaños. No mostrar 5 × 10.
- [ ] Dar a `TablaEtiquetas.vue` la prop obligatoria `configuracion` y pasarla a `TarjetaPreviewEtiquetaMovil.vue`. Asegurar que cada tarjeta actualice su layout al cambiar de pestaña; remount por ID de configuración o soporte reactivo equivalente.
- [ ] Confirmar, cancelar y restablecer ediciones en la variante activa. El recuento `Memorias activas` debe reflejar las memorias del tamaño visible. No cambiar el comportamiento de código, ubicación, cantidad ni orden al alternar.
- [ ] Revisar el flujo de creación desde el formulario y el de envío desde Listados con ambas pestañas, sin duplicar etiquetas ni perder cambios durante el sondeo de almacenamiento.

## FASE 3: Vista y PDF de la etiqueta chica

### Objetivo

Mostrar una tarjeta visualmente menor y generar un PDF de 67 × 25 mm con el mismo contenido y distribución.

### Pasos de ejecución

- [ ] Crear `UsoLayoutEtiquetaChica.js` con `calcularLayoutEtiquetaChica({ etiqueta, configuracion, anchoReferenciaPx })`, que devuelva la misma estructura de layout que `calcularLayoutEtiquetaPreview`.
  - Usar `ConfiguracionEtiqueta2.5x6.7.js` como fuente de dimensiones, márgenes y valores chicos; ajustar allí solo parámetros de la etiqueta chica cuando la revisión visual lo exija.
  - Duplicar la lógica necesaria de 10 × 15 para experimentar con las posiciones chicas sin modificar la rama de producción. Limitar el ancho de barras y de texto a 67 mm menos márgenes.
  - Conservar los saltos `\n` explícitos, incluso los renglones vacíos, y los espacios dentro de cada renglón. Reducir fuente y espaciado según el espacio disponible; no cortar silenciosamente el `String` almacenado.
  - Si el texto no cabe incluso con el mínimo elegido durante el ajuste visual, permitir que el exceso se aprecie en la vista y comprobar su efecto en PDF. La edición manual debe seguir disponible.
- [ ] En `UsoLayoutEtiquetaPreview.js`, despachar al cálculo chico solo cuando `configuracion.id === '2.5x6.7cm'`. Conservar literalmente la lógica y valores de la rama 10 × 15, excepto el punto mínimo de despacho. `GeneradorEtiquetasPDF.js` ya consume el layout y las dimensiones de la configuración; modificarlo solo si una prueba concreta muestra que la vista y el PDF chico difieren.
- [ ] En `TarjetaPreviewEtiquetaMovil.vue`, aplicar tamaño máximo `6.7cm × 2.5cm` y proporción `67 / 25` solo a la pestaña chica. Conservar las reglas existentes de 10 × 15 para esa pestaña.
  - Permitir que la tarjeta chica reduzca ancho en pantallas estrechas y que sus controles de edición sigan siendo utilizables. Verificar código, barras, líneas, ubicación y cantidad en teléfono y escritorio.
  - Mantener la misma descripción visible en tarjeta y PDF, incluidos espacios y saltos manuales.

## FASE 4: Compartir memorias sin mezclar tamaños

### Objetivo

Respaldar e intercambiar memorias de los dos tamaños sin perder la compatibilidad con archivos existentes.

### Pasos de ejecución

- [ ] Ampliar el JSON de `ServicioMemoriasEtiquetas.js` y `usoAlmacenamientoMemoriaEtiquetas.js` para incluir el identificador de tamaño por entrada en una versión nueva del formato de intercambio.
  - Al importar un JSON anterior sin tamaño, asignar sus entradas a 10 × 15.
  - Al importar uno nuevo, fusionar por pareja `(codigo, tamano)` usando la política temporal existente; un código puede tener dos descripciones distintas.
  - Crear respaldo de ambas memorias antes de la fusión. Mantener los límites de cantidad y reportar entradas inválidas sin afectar la otra memoria.
- [ ] Actualizar `PaginaMemoriasEtiquetas.vue` para informar total y cantidad por tamaño, y revisar los mensajes de exportación/importación y el flujo automático desde `PaginaEtiquetas.vue`.

## FASE TESTING

### Pruebas automatizadas

- [ ] Crear y ejecutar `node --test Pruebas/Etiquetas/ResolverDescripcionEtiqueta.test.js Pruebas/Etiquetas/UsoLayoutEtiquetaChica.test.js` con casos de etiqueta histórica 10 × 15, etiqueta nueva chica, memoria en uno o ambos tamaños, edición aislada y conservación exacta de `\n` y espacios.
- [ ] Cubrir importación de JSON antiguo como 10 × 15 y de JSON nuevo con el mismo código en ambos tamaños; comprobar que exportar y reimportar no fusiona indebidamente las descripciones.
- [ ] Ejecutar `npm run lint`, `npm test` y `npm run build`; corregir todos los errores nuevos.

### Pruebas manuales

- [ ] Antes de modificar el layout, registrar una referencia visual y un PDF 10 × 15 representativos; al final verificar que tamaño de página, posición, contenido, barras, edición y memoria coincidan con esa referencia.
- [ ] Con una lista existente de unas 35 etiquetas, alternar a la chica y volver: deben conservarse los mismos 35 registros, cantidades, orden y descripciones 10 × 15.
- [ ] Editar una etiqueta en la chica, cerrar y reabrir la página, y alternar: la chica debe mostrar su ajuste y 10 × 15 su versión original. Repetir con un artículo creado primero en la chica y luego abierto en grande.
- [ ] Revisar descripciones de una y varias líneas, cuatro saltos manuales, renglones vacíos, espacios entre palabras, códigos largos y ubicaciones largas. Ajustar solo el layout chico según la previsualización y el PDF impreso.
- [ ] Generar PDF para cada pestaña y comprobar 150 × 100 mm en 10 × 15 y 67 × 25 mm en la chica, una página por copia y el nombre de archivo correspondiente.
- [ ] Exportar, importar y restaurar memorias antiguas y nuevas en un entorno de prueba; comprobar recuentos por tamaño y que una importación chica no sobrescriba 10 × 15.

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
