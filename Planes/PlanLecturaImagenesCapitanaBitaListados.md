# LECTURA DE IMÁGENES CON CAPITANA BITA EN LISTADOS

## Descripción del plan

Extender exclusivamente el apartado Listados para que Capitana Bita pueda recibir una fotografía tomada con el celular o elegida desde la galería, identificar únicamente las filas útiles de artículos y resolverlas contra el Excel maestro cargado en el dispositivo.

La imagen podrá provenir de papel, una pantalla o un monitor y puede contener perspectiva, desenfoque, columnas cortadas, códigos incompletos y datos ajenos al listado. Gemini debe limitarse a transcribir evidencia visible sin completar ni inventar información. La decisión de agregar un artículo se realizará localmente y de forma determinista contra todos los artículos del maestro.

La captura, normalización y recuperación de imágenes se implementarán como infraestructura compartida, sin dependencias de Capitana Bita, Gemini ni Listados, para que otros apartados puedan reutilizarlas en el futuro. La interfaz específica y la interpretación de repuestos permanecerán dentro del módulo Capitana Bita.

## Objetivo principal

- Permitir tomar una fotografía o elegir una imagen existente desde Listados.
- Extraer código visible, descripción visible y cantidad de cada fila útil sin transcribir información irrelevante.
- Agregar automáticamente únicamente coincidencias locales únicas y confiables.
- Pedir confirmación cuando exista una opción dudosa o varias coincidencias posibles.
- No agregar filas ilegibles, inexistentes, contradictorias ni afectadas por códigos duplicados en el maestro.
- Mantener sin cambios funcionales las entradas actuales por texto, voz y escáner.
- Dejar una capa reutilizable de captura y preparación de imágenes para futuros módulos.

## Contexto técnico verificado

- El proyecto usa Vue 3, Quasar 2, JavaScript con módulos ES y Capacitor 7.
- Los nombres de archivos y carpetas deben usar PascalCase sin guiones bajos ni guiones medios; variables y funciones deben usar camelCase en español.
- El CSS debe permanecer compacto, sin líneas vacías entre reglas, y usar los colores definidos en `src/css/app.css`.
- `@capacitor/camera` versión `7.0.2` ya está instalado y sincronizado en Android.
- `android/app/src/main/AndroidManifest.xml` ya declara `android.permission.CAMERA`.
- La captura no debe usar `saveToGallery`, por lo que no requiere agregar permisos de almacenamiento.
- El proyecto tiene Android nativo y web; no existe una plataforma iOS configurada en el repositorio.
- El modelo configurado es `gemini-3.5-flash-lite`, admite entrada de imágenes y salida JSON estructurada.
- Firebase AI Logic ya se inicializa con App Check mediante `obtenerAplicacionFirebaseProtegida()`.
- `ServicioCapitanaBita.js` ya envía audio como `inlineData`, por lo que la imagen puede reutilizar el mismo patrón multimodal.
- El límite total documentado para solicitudes con archivos inline es 20 MB y las imágenes grandes se ajustan hasta 3072 x 3072; la preparación local debe mantener el archivo claramente por debajo de ese límite después de codificarlo en base64.
- El maestro se carga y persiste mediante `LectorExcel.js`; cada artículo válido tiene `codigo`, `nombre`, `ubicacionAntigua`, `stock` e `historialUbicaciones`.
- La imagen y el maestro no deben almacenarse ni enviarse juntos: Gemini recibe únicamente la imagen, mientras la resolución contra el maestro ocurre localmente.
- `ResolverSolicitudesCapitanaBita.js` resuelve texto y audio mediante búsquedas flexibles y memorias. Ese comportamiento no debe endurecerse porque afectaría entradas existentes.
- `buscarArticulos()` limita resultados y tolera códigos parciales o códigos escaneados con contenido adicional. No es una base suficiente para determinar certeza visual y no debe usarse como única prueba de coincidencia segura.
- `PaginaListados.vue` ya protege resultados demorados mediante `identificadorDestino` y descarta respuestas si cambió el listado activo.
- El modelo de Listados representa cantidades como filas repetidas, no como una propiedad de cantidad.
- La cola actual de Capitana Bita persiste cada fila por separado y se detiene ante duplicados; el flujo de imágenes puede producir hasta 60 solicitudes y requiere inserción por lotes sin perder la confirmación existente de duplicados.
- `PanelResultadosCapitanaBita.vue` admite varios candidatos, no encontrados y propuestas de memoria, pero todavía no permite confirmar una única coincidencia dudosa, omitir una solicitud individual ni presentar inconsistencias del maestro.
- El plugin Camera abre una actividad externa en Android; se debe escuchar `appRestoredResult` para recuperar el resultado si Android recrea la aplicación durante la captura.
- `npm run lint` fue ejecutado antes de crear este plan y terminó sin errores.
- `npm test` actualmente no ejecuta pruebas reales; se incorporarán pruebas unitarias con el runner nativo de Node, sin agregar dependencias.
- Ya existen cambios ajenos a este plan que mueven `Planes/PlanCapitanaBitaGemini.md` a `Planes/PlanesTerminados/PlanCapitanaBitaGemini.md`; deben conservarse sin alterarlos.

## Decisiones funcionales confirmadas

- El usuario podrá elegir entre cámara y galería.
- Se procesará una imagen por solicitud.
- Cada fila detectada tendrá cantidad `1`, salvo que exista una cantidad entera positiva claramente visible.
- Una coincidencia segura se agregará directamente al listado.
- Una coincidencia dudosa se consultará aunque exista un solo candidato.
- Cuando existan varios candidatos se preguntará cuál utilizar.
- Las filas ilegibles o sin coincidencia no generarán artículos inventados.
- Las imágenes serán temporales y no se guardarán después del procesamiento.

## Reglas deterministas de certeza

Una resolución visual solo puede tener uno de estos estados públicos:

- `unica`: puede agregarse automáticamente.
- `ambigua`: requiere intervención del usuario y puede contener uno o varios candidatos.
- `noEncontrada`: no existe candidato compatible.
- `inconsistente`: el maestro o la evidencia tienen una contradicción que impide seleccionar con seguridad.

Para devolver `unica` deben cumplirse todas estas condiciones:

- Gemini marcó la lectura de la fila como clara.
- Existe al menos un código visible o una descripción visible no vacía.
- Se recorrió el maestro completo, sin aplicar el límite de resultados del buscador interactivo.
- Todas las evidencias visibles no vacías son compatibles con el mismo artículo.
- Existe exactamente un artículo compatible.
- El código del candidato no está duplicado dentro del maestro.

Casos que obligan a devolver `ambigua`:

- Gemini indicó que la fila está cortada, borrosa o dudosa.
- Existe un único candidato flexible, pero la evidencia no permite marcar la lectura como clara.
- Hay dos o más candidatos compatibles con los fragmentos visibles.
- El código visible es parcial y los restantes datos no eliminan todas las alternativas.

Casos que obligan a devolver `inconsistente`:

- Un código visible completo identifica un artículo, pero una descripción legible identifica otro.
- El código exacto aparece más de una vez en el maestro.
- Dos filas del maestro con el mismo código no pueden distinguirse de manera compatible con el modelo persistido de Listados.

Un código se considera completo únicamente cuando coincide exactamente, después de normalizar mayúsculas y espacios, con un código del maestro. La tolerancia especial de `obtenerArticuloPorCodigoEscaneado()` no debe utilizarse para declarar certeza en imágenes.

## Alcance

### Incluye

- Cámara y galería desde Capitana Bita dentro de Listados.
- Selección explícita del origen de imagen.
- Preparación temporal reutilizable de imágenes.
- Corrección de orientación, reducción de dimensiones, conversión a JPEG y control de tamaño.
- Recuperación de capturas tras recreación de la actividad Android.
- Contrato estructurado exclusivo para interpretación visual.
- Resolución exhaustiva y estricta contra el maestro local.
- Agregado automático de coincidencias seguras.
- Confirmación de coincidencias dudosas o múltiples.
- Resumen de agregados, pendientes, no encontrados e inconsistencias.
- Manejo de cancelación, permisos, desconexión, imagen inválida y cambio de listado.
- Optimización de la cola para persistir bloques de artículos en lugar de guardar una vez por fila.
- Pruebas unitarias de la resolución visual y pruebas manuales en Android y web.

### No incluye

- Reconocimiento de imágenes en Pedidos, Stock, Ubicaciones, Etiquetas o Fotos.
- Guardado permanente o historial de las imágenes procesadas.
- Envío del maestro completo a Gemini.
- OCR sin conexión.
- Lectura de PDF, documentos de varias páginas o varias imágenes en una solicitud.
- Edición manual, recorte avanzado o filtros fotográficos dentro de la app.
- Cambios en el comportamiento funcional actual de texto, audio o escáner.
- Soporte nativo para iOS mientras esa plataforma no exista en el repositorio.
- Corrección general de códigos duplicados dentro del Excel maestro.

## Límite de reutilización

La infraestructura compartida debe resolver solamente estas responsabilidades:

- Abrir cámara o galería según un origen explícito.
- Traducir diferencias entre Android nativo y web.
- Obtener una imagen temporal.
- Corregir orientación cuando la plataforma lo permita.
- Convertir formatos compatibles a JPEG para consumo uniforme.
- Reducir dimensiones y calidad hasta cumplir el límite configurado.
- Entregar base64 limpio, MIME type, dimensiones, tamaño y origen.
- Clasificar cancelación, permisos, formato, lectura y tamaño mediante códigos de error estables.
- Recuperar una captura devuelta por Android después de recrear la aplicación.

La capa compartida no debe:

- Importar Firebase AI Logic.
- Conocer prompts, esquemas ni modelos Gemini.
- Leer el Excel maestro.
- Resolver artículos.
- Conocer Listados ni modificar su almacenamiento.
- Mostrar textos o estilos propios de Capitana Bita.

La primera consumidora será `EntradaCapitanaBita.vue`. Los módulos futuros deberán poder invocar el servicio compartido sin copiar captura, conversión ni recuperación. No se creará todavía un componente visual genérico porque solo existe un consumidor real; la reutilización se concentrará en el servicio y sus contratos, evitando una abstracción visual prematura.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Logica/Compartidos/ServicioCapturaImagen.js` | Crear | `ORIGENES_CAPTURA_IMAGEN`, `ErrorCapturaImagen`, `capturarImagen`, `prepararImagenCapturada` | Proveer captura, conversión y validación reutilizables sin conocer Capitana Bita. |
| `src/components/Logica/Compartidos/ServicioRecuperacionCapturaImagen.js` | Crear | `registrarCapturaPendiente`, `registrarResultadoCapturaRestaurada`, `consumirCapturaRestaurada`, `limpiarCapturaPendiente` | Mantener el contrato genérico de recuperación Android. |
| `src/boot/RecuperacionCapturaImagen.js` | Crear | boot predeterminado | Escuchar globalmente `appRestoredResult` y transferir resultados del plugin Camera al servicio compartido. |
| `quasar.config.js` | Modificar | `boot` | Registrar el boot de recuperación después del boot existente. |
| `src/components/Logica/Compartidos/ServicioCoincidenciasEvidenciaArticulo.js` | Crear | `resolverCoincidenciasPorEvidencia`, `crearIndiceCodigosMaestro` | Recorrer todo el maestro y comparar evidencia visible sin tolerancias propias del escáner. |
| `src/components/Logica/CapitanaBita/ConfiguracionCapitanaBita.js` | Modificar | `ESQUEMA_RESPUESTA_IMAGEN_CAPITANA_BITA`, constantes de límites, instrucciones visuales | Definir el contrato estricto de extracción visual. |
| `src/components/Logica/CapitanaBita/ServicioCapitanaBita.js` | Modificar | `obtenerModeloCapitanaBita`, `procesarContenido`, `procesarImagenCapitanaBita`, validadores | Enviar la imagen a Gemini y validar la respuesta sin alterar texto ni audio. |
| `src/components/Logica/CapitanaBita/ResolverSolicitudesImagenCapitanaBita.js` | Crear | `resolverSolicitudesImagenCapitanaBita` | Aplicar las reglas deterministas de certeza visual sobre la evidencia y el maestro. |
| `src/components/Logica/CapitanaBita/UsoCapitanaBita.js` | Modificar | `capturandoImagen`, `seleccionarImagen`, recuperación de captura | Coordinar captura, preparación, procesamiento y estados de la interfaz. |
| `src/components/Logica/CapitanaBita/EntradaCapitanaBita.vue` | Modificar | selector de origen, eventos y `cerrarInteraccion` | Incorporar cámara y galería a la entrada existente de Capitana Bita. |
| `src/components/Logica/CapitanaBita/PanelResultadosCapitanaBita.vue` | Modificar | candidatos dudosos, omisión, resumen e inconsistencias | Permitir revisar una o varias opciones y mostrar el resultado completo del lote. |
| `src/components/Logica/Listados/FormularioListado.vue` | Modificar | `estadoInteraccionCapitanaBita`, `cerrarInteraccion` | Integrar el nuevo estado de captura y mantener coherencia con el botón Atrás. |
| `src/pages/PaginaListados.vue` | Modificar | `procesarResultadoCapitanaBita`, cola de inserción, selección y omisión | Resolver por tipo de entrada, agregar lotes y presentar pendientes sin mezclar listados. |
| `Pruebas/CapitanaBita/ResolverSolicitudesImagenCapitanaBita.test.js` | Crear | casos del runner `node:test` | Verificar certeza, ambigüedad, contradicciones, cantidades y duplicados del maestro. |
| `package.json` | Modificar | script `test` | Ejecutar las pruebas unitarias reales sin una dependencia adicional. |

## FASE 1: Crear la infraestructura compartida de imágenes

### Objetivo

Disponer de una API reutilizable que entregue una imagen temporal normalizada y pueda ser consumida por Capitana Bita u otros módulos futuros.

### Archivos y símbolos involucrados

- Archivo nuevo `src/components/Logica/Compartidos/ServicioCapturaImagen.js`.
- Archivo nuevo `src/components/Logica/Compartidos/ServicioRecuperacionCapturaImagen.js`.
- Archivo nuevo `src/boot/RecuperacionCapturaImagen.js`.
- Archivo existente `quasar.config.js`: propiedad `boot`.
- Archivo existente `android/app/src/main/AndroidManifest.xml`: verificar solamente; no modificar si conserva el permiso actual.

### Pasos de ejecución

- [ ] Crear `ServicioCapturaImagen.js` sin dependencias de Capitana Bita, Listados o Firebase.
  - Exportar `ORIGENES_CAPTURA_IMAGEN` como objeto congelado con `CAMARA: 'camara'` y `GALERIA: 'galeria'`.
  - Exportar `ErrorCapturaImagen extends Error` con las propiedades `codigo` y `causa`.
  - Definir códigos estables: `cancelada`, `permiso`, `noDisponible`, `formatoInvalido`, `lecturaFallida`, `tamanoExcedido` y `desconocido`.
  - Mantener la cancelación separada de los errores visibles para que el consumidor pueda cerrarla silenciosamente.
  - Exportar `capturarImagen({ origen, metadatosRecuperacion })`.
  - Validar `origen` antes de abrir APIs nativas.
  - Usar `CameraSource.Camera` para cámara y `CameraSource.Photos` para galería; no depender de `CameraSource.Prompt`, de modo que la interfaz pueda mostrar opciones claras en español y la elección sea determinista.
  - Usar la cámara trasera, `correctOrientation: true`, `allowEditing: false`, `saveToGallery: false` y `CameraResultType.Uri`.
  - Solicitar como máximo 3072 píxeles de ancho y alto en Android, manteniendo la proporción.
  - En web, usar la ruta entregada por Camera y preparar la imagen mediante `fetch`, `Blob`, `Image` y `canvas`; la cámara web puede degradar al selector del navegador cuando no exista experiencia PWA nativa.
  - Revocar cualquier `blob:` URL creada después de finalizar la lectura.
- [ ] Implementar `prepararImagenCapturada({ url, formato, origen })` como exportación reutilizable y comprobable de manera aislada.
  - Aceptar únicamente JPEG, PNG y WebP como entradas confiables para Firebase AI Logic.
  - Cargar la imagen completa antes de crear el canvas.
  - Mantener la proporción y no aumentar imágenes pequeñas.
  - Convertir el resultado a `image/jpeg` para uniformar Android y web.
  - Comenzar con calidad JPEG `0.86` y dimensión máxima `3072`.
  - Si el tamaño estimado en base64 no cumple el máximo interno, reducir calidad y luego dimensiones mediante pasos constantes y limitados, nunca mediante un bucle sin salida.
  - Definir constantes compartidas para dimensión, calidad inicial, calidad mínima y bytes máximos; no dispersar números mágicos entre consumidores.
  - Fijar el máximo interno por debajo del límite de 20 MB de la solicitud completa, dejando margen para prompt y JSON.
  - Retornar `{ base64, mimeType, ancho, alto, tamanoBytes, origen }`.
  - Retornar base64 sin encabezado `data:` porque `inlineData.data` requiere solamente los bytes codificados.
  - Liberar canvas, blobs, URLs y referencias grandes al terminar o fallar.
- [ ] Implementar recuperación genérica de la actividad Camera.
  - `registrarCapturaPendiente({ idCaptura, consumidor, identificadorDestino, origen, creadaEn })` debe persistir metadatos mínimos antes de abrir la actividad externa.
  - Usar una clave de Preferences declarada como constante; los guiones bajos se permiten únicamente en constantes y valores persistidos.
  - `registrarResultadoCapturaRestaurada(resultado)` debe aceptar solamente eventos cuyo `pluginId` sea Camera y cuyo `methodName` sea `getPhoto`.
  - Asociar el resultado restaurado con los metadatos pendientes y almacenarlo temporalmente hasta que el consumidor correspondiente esté montado.
  - `consumirCapturaRestaurada(consumidor)` debe devolver el resultado una sola vez y limpiar tanto resultado como metadatos.
  - Aplicar vencimiento a metadatos pendientes antiguos para no procesar una fotografía en una sesión posterior.
  - `limpiarCapturaPendiente(idCaptura)` debe ejecutarse después de éxito, cancelación o error normal.
- [ ] Crear el boot `RecuperacionCapturaImagen.js`.
  - Usar `App.addListener('appRestoredResult', ...)` solamente en Android nativo.
  - Delegar toda la clasificación y persistencia al servicio compartido.
  - No navegar, mostrar notificaciones ni importar módulos de Capitana Bita desde el boot.
  - Registrar el boot en `quasar.config.js` después de `BotonAtrasNativo`.
- [ ] Verificar que `android/app/src/main/AndroidManifest.xml` conserve `android.permission.CAMERA` y no agregar permisos de lectura o escritura de almacenamiento.
- [ ] Considerar terminada la fase cuando cualquier consumidor pueda solicitar cámara o galería y obtener el mismo contrato normalizado sin conocer detalles de Capacitor.

## FASE 2: Definir la extracción visual estructurada de Capitana Bita

### Objetivo

Enviar una imagen normalizada a Gemini y recibir evidencia literal y validada de las filas útiles, sin resolver todavía artículos del maestro.

### Archivos y símbolos involucrados

- `src/components/Logica/CapitanaBita/ConfiguracionCapitanaBita.js`.
- `src/components/Logica/CapitanaBita/ServicioCapitanaBita.js`.

### Pasos de ejecución

- [ ] Mantener `ESQUEMA_RESPUESTA_CAPITANA_BITA` sin cambios incompatibles para texto y audio.
- [ ] Crear en `ConfiguracionCapitanaBita.js` un esquema independiente para imágenes.
  - Exportar `ESQUEMA_RESPUESTA_IMAGEN_CAPITANA_BITA`.
  - Cada fila debe contener `idSolicitud`, `textoVisible`, `codigoVisible`, `descripcionVisible`, `cantidad`, `lecturaClara` y `motivoDuda`.
  - `codigoVisible` y `descripcionVisible` pueden ser cadenas vacías individualmente, pero el validador rechazará una fila si ambas están vacías.
  - `cantidad` siempre será un entero; Gemini debe devolver `1` cuando no exista una cantidad inequívoca.
  - `lecturaClara` será booleano y solo describirá legibilidad visual; nunca decidirá por sí solo el agregado automático.
  - `motivoDuda` será vacío cuando la lectura sea clara y describirá brevemente corte, desenfoque o conflicto cuando sea dudosa.
  - La respuesta debe incluir `transcripcion`, `respuesta`, `esListadoDeArticulos`, `filas` y `advertencias`.
  - Limitar `filas` a `MAXIMO_SOLICITUDES_CAPITANA_BITA` y las advertencias a una constante pequeña y explícita.
- [ ] Crear una instrucción visual especializada.
  - Indicar que la fuente puede ser papel, monitor o pantalla fotografiada.
  - Pedir lectura fila por fila y en orden visual de arriba hacia abajo.
  - Ordenar que se ignore stock, precio, ubicación, encabezados, numeración de hoja, corrector ortográfico, bordes y demás columnas no útiles para Listados.
  - Ordenar que se conserve literalmente lo visible, incluidas abreviaciones.
  - Prohibir completar códigos, modelos, años, colores o palabras cortadas.
  - Prohibir convertir números cercanos en cantidades salvo que estén inequívocamente identificados como cantidad.
  - Indicar que las filas totalmente ilegibles no se conviertan en solicitudes y se resuman en `advertencias`.
- [ ] Refactorizar `obtenerModeloCapitanaBita()` para aceptar el esquema de respuesta y la instrucción adicional requeridos por cada tipo de entrada.
  - Texto y audio deben seguir usando el esquema, temperatura, tokens, thinking y validación actuales.
  - Imagen debe usar el nuevo esquema sin crear otro proveedor de Firebase ni omitir App Check.
- [ ] Refactorizar `procesarContenido()` para recibir una función de validación y conservar la clasificación de errores existente.
  - Mantener el timeout de 45 segundos salvo evidencia real obtenida durante implementación que obligue a ajustarlo.
  - Incluir `tipoEntrada: 'imagen'` en logs sin imprimir base64, contenido visual ni descripciones completas.
- [ ] Exportar `validarRespuestaImagenCapitanaBita(valor)`.
  - Validar tipos, límites, cadenas y cantidades antes de devolver datos a la interfaz.
  - Recortar cantidades al intervalo `1..999`, igual que el flujo existente.
  - Generar identificadores únicos cuando Gemini repita u omita `idSolicitud`.
  - Normalizar únicamente espacios exteriores; conservar la evidencia visible para la resolución posterior.
  - Rechazar respuestas que afirmen contener artículos pero no incluyan filas válidas.
  - Limitar `transcripcion`, `respuesta`, `motivoDuda` y advertencias con constantes existentes o nuevas verificadas.
- [ ] Exportar `procesarImagenCapitanaBita({ base64, mimeType, contextoBusqueda, nombreUsuario, memorias })`.
  - Rechazar base64 vacío o MIME type no admitido antes de crear el modelo.
  - Construir `contenido` como arreglo con la parte de texto primero y `{ inlineData: { data: base64, mimeType } }` después.
  - Incluir contexto y equivalencias confirmadas solo como ayuda interpretativa; ordenar que no se transformen en evidencia visible ni códigos inventados.
  - Devolver el contrato visual validado y añadir `tipoEntrada: 'imagen'` desde la capa coordinadora.
- [ ] Ampliar `MENSAJES_ERROR` con errores propios de imagen que no confundan cámara con micrófono.
  - El permiso de cámara debe indicar exactamente que se permita acceso a la cámara.
  - Formato, tamaño y lectura deben tener mensajes accionables.
  - Una cancelación voluntaria no debe convertirse en `ErrorCapitanaBita` ni iniciar enfriamiento.
- [ ] Considerar terminada la fase cuando el servicio entregue evidencia visual estructurada sin consultar ni modificar el maestro.

## FASE 3: Crear la resolución estricta y exhaustiva contra el maestro

### Objetivo

Convertir la evidencia visual validada en resoluciones locales deterministas que distingan agregado automático, confirmación y bloqueo por inconsistencia.

### Archivos y símbolos involucrados

- Archivo nuevo `src/components/Logica/Compartidos/ServicioCoincidenciasEvidenciaArticulo.js`.
- Archivo nuevo `src/components/Logica/CapitanaBita/ResolverSolicitudesImagenCapitanaBita.js`.
- Reutilización de `normalizarTextoComparacionArticulo()`, `expandirAbreviacionesArticulo()` y `sonPalabrasEquivalentesArticulo()`.

### Pasos de ejecución

- [ ] Crear `ServicioCoincidenciasEvidenciaArticulo.js` como servicio puro y reutilizable.
  - No importar Vue, Capacitor, Firebase, Preferences ni componentes.
  - Exportar `crearIndiceCodigosMaestro(articulos)` para agrupar todos los registros por código normalizado y detectar duplicados sin colapsarlos.
  - Exportar `resolverCoincidenciasPorEvidencia({ articulos, codigoVisible, descripcionVisible, contextoBusqueda })`.
  - Recorrer la colección completa y no usar el límite predeterminado de `buscarArticulos()`.
  - Comparar códigos exactos mediante igualdad normalizada estricta.
  - Comparar códigos parciales únicamente como generación de candidatos, nunca como coincidencia exacta.
  - Comparar la descripción mediante palabras normalizadas y las equivalencias ya definidas en `DiccionarioAbreviacionesArticulos.js`.
  - Reutilizar la semántica de contexto actual para filtrar descripciones, pero permitir que un código exacto único ignore el contexto, igual que el comportamiento operativo existente.
  - Separar los resultados en `coincidenciasCodigoExacto`, `candidatosCompatibles`, `codigosDuplicados` y `hayConflicto`.
  - No inventar un puntaje probabilístico ni utilizar números aleatorios.
- [ ] Crear `ResolverSolicitudesImagenCapitanaBita.js` con `resolverSolicitudesImagenCapitanaBita({ filas, articulos, contextoBusqueda })`.
  - Validar arreglos de entrada y devolver arreglo vacío ante contratos inválidos, registrando únicamente un warning técnico.
  - Resolver cada fila mediante `resolverCoincidenciasPorEvidencia()`.
  - Devolver para cada resolución `idSolicitud`, `textoOriginal`, `cantidad`, `estado`, `candidatos`, `articuloUnico`, `motivoConfirmacion` y `origen: 'imagen'`.
  - Usar `estado: 'unica'` exclusivamente cuando se cumplan todas las reglas de certeza de este plan.
  - Usar `estado: 'ambigua'` aunque exista un solo candidato cuando `lecturaClara` sea falsa o falte coherencia suficiente.
  - Usar `estado: 'noEncontrada'` cuando no exista candidato.
  - Usar `estado: 'inconsistente'` para códigos duplicados o conflicto entre código y descripción.
  - Conservar candidatos separados por identidad interna; no colapsar registros diferentes únicamente porque comparten código.
  - No ofrecer memorias de contexto a partir de imágenes dudosas. Una selección visual puede usarse en la operación actual, pero no debe contaminar automáticamente las memorias creadas para expresiones de texto o voz.
- [ ] Mantener `ResolverSolicitudesCapitanaBita.js` como resolutor de texto y audio.
  - No sustituir su búsqueda flexible por la lógica estricta de imágenes.
  - Compartir solamente normalizadores y equivalencias cuyo contrato sea verdaderamente común.
- [ ] Considerar terminada la fase cuando ejecutar dos veces la misma evidencia contra el mismo maestro produzca exactamente los mismos estados y candidatos.

## FASE 4: Integrar cámara y galería en la entrada de Capitana Bita

### Objetivo

Agregar una interacción clara y responsiva para obtener una imagen y procesarla sin bloquear ni degradar texto y audio.

### Archivos y símbolos involucrados

- `src/components/Logica/CapitanaBita/UsoCapitanaBita.js`.
- `src/components/Logica/CapitanaBita/EntradaCapitanaBita.vue`.
- `src/components/Logica/Listados/FormularioListado.vue`.

### Pasos de ejecución

- [ ] Ampliar `usarCapitanaBita()` con estado específico de imágenes.
  - Agregar `capturandoImagen` con valor inicial `false`.
  - Agregar `procesarImagenSeleccionada(origen)` como única entrada pública desde el componente.
  - Ejecutar `prepararSolicitud()` antes de abrir Camera para congelar `contextoBusqueda`, `identificadorDestino`, nombre y memorias del listado correcto.
  - Generar un `idCaptura` y registrar metadatos genéricos con consumidor `capitanaBitaListados` antes de abrir la actividad externa.
  - Usar `capturandoImagen` durante cámara, galería y preparación local; usar `procesando` únicamente durante la solicitud a Gemini.
  - Liberar la referencia base64 en un bloque `finally` tan pronto termine la solicitud.
  - Añadir al resultado `tipoEntrada: 'imagen'`, `contextoBusquedaUsado` e `identificadorDestino`.
  - Consumir al montar cualquier captura restaurada destinada a `capitanaBitaListados` y procesarla únicamente si el identificador de destino sigue vigente.
  - Si la captura se canceló, restaurar estados sin notificación negativa.
  - Si falla permiso o lectura de imagen, mostrar el error específico sin establecer `permisoBloqueado`, porque esa bandera corresponde al micrófono.
  - Mantener el enfriamiento compartido solo para errores de Gemini, cuota o saturación.
- [ ] Actualizar `disponible` y `motivoNoDisponible`.
  - Evitar iniciar texto, audio o una segunda captura mientras se captura o procesa una imagen.
  - No bloquear permanentemente texto y audio si la cámara fue rechazada.
  - Añadir mensajes de procesamiento relacionados con lectura de imagen sin eliminar los existentes.
- [ ] Modificar `EntradaCapitanaBita.vue`.
  - Añadir un botón con icono de imagen o cámara dentro de la fila existente.
  - Presentar opciones explícitas `Tomar foto` y `Elegir de galería`; cada opción enviará uno de los valores de `ORIGENES_CAPTURA_IMAGEN`.
  - Mantener botones táctiles de al menos 44 px.
  - Desactivar las acciones durante grabación, captura o procesamiento.
  - Cambiar el placeholder solo si sigue describiendo correctamente texto, voz e imagen sin volverlo extenso.
  - Emitir `estado-interaccion` con `{ grabando, procesando, capturandoImagen }`.
  - Emitir los resultados visuales mediante el evento existente `resultado-procesado` para no crear dos rutas paralelas hacia Listados.
  - Mantener `cerrarInteraccion()` capaz de cerrar menús propios y cancelar grabación; la actividad nativa Camera conservará el comportamiento del botón Atrás del sistema.
- [ ] Adaptar la grilla responsiva de `.fila-entrada-capitana-bita`.
  - En anchos suficientes, mantener input y botones en una sola fila.
  - En teléfonos estrechos, conservar el input legible y evitar desbordamiento horizontal.
  - Usar exclusivamente variables de `src/css/app.css`.
  - Mantener CSS compacto sin líneas vacías entre reglas.
- [ ] Actualizar `FormularioListado.vue`.
  - Ampliar `estadoInteraccionCapitanaBita` con `capturandoImagen: false`.
  - Considerar la captura dentro de `cerrarInteraccion()` cuando exista una interacción local cerrable.
  - Mantener sin cambios los eventos públicos actuales hacia `PaginaListados.vue`.
- [ ] Considerar terminada la fase cuando el usuario pueda elegir origen, cancelar, capturar y ver un estado de procesamiento sin afectar el buscador manual.

## FASE 5: Resolver e insertar resultados visuales en Listados

### Objetivo

Agregar de inmediato las coincidencias seguras y presentar todas las demás de manera comprensible, preservando almacenamiento, duplicados y destino correcto.

### Archivos y símbolos involucrados

- `src/pages/PaginaListados.vue`.
- `src/components/Logica/CapitanaBita/PanelResultadosCapitanaBita.vue`.

### Pasos de ejecución

- [ ] Dividir la resolución dentro de `procesarResultadoCapitanaBita()` según `tipoEntrada`.
  - Texto y audio deben continuar usando `resolverSolicitudesCapitanaBita()` y las memorias actuales.
  - Imagen debe usar `resolverSolicitudesImagenCapitanaBita()` y no crear propuestas de memoria.
  - Mantener la comparación entre `identificadorDestino` y `listadoActivo.id` antes de resolver o insertar.
  - Mantener el contexto exacto capturado al iniciar la solicitud.
- [ ] Crear una representación común de resultados para el panel.
  - Separar `unicas`, `ambiguedades`, `noEncontrados` e `inconsistencias`.
  - Conservar `transcripcion`, `advertencias`, `tipoEntrada` y un resumen con cantidades.
  - Contabilizar artículos según cantidad efectiva y solicitudes según filas detectadas; no mezclar ambos números en el mensaje.
  - Mostrar un resumen equivalente a `18 artículos preparados, 3 necesitan confirmación y 2 no pudieron identificarse`.
- [ ] Optimizar la cola de inserción de Capitana Bita para lotes.
  - Crear una función de encolado múltiple que reciba resoluciones seguras ya validadas.
  - Expandir la cantidad a filas porque ese es el modelo persistido actual.
  - Preparar consecutivamente filas no repetidas y ejecutar una sola llamada a `persistirActivo()` por bloque seguro.
  - Detener el bloque ante el primer artículo repetido y reutilizar `articuloPendienteRepetido` para solicitar confirmación.
  - Reanudar el resto de la cola después de confirmar o cancelar el repetido.
  - No perder elementos pendientes si falla Preferences; conservarlos o reportar con precisión cuáles no se guardaron.
  - Capturar errores por bloque y notificar al usuario en lugar de dejar promesas rechazadas sin manejar.
  - Mantener `ocupado` activo durante la escritura para impedir cambios de listado a mitad de lote.
- [ ] Ampliar `PanelResultadosCapitanaBita.vue`.
  - Para una ambigüedad con un candidato, mostrar `Confirmá si este es el artículo correcto` y el motivo de duda.
  - Para dos o más candidatos, mantener `Elegí el artículo correcto`.
  - Añadir una acción `Omitir` por solicitud para continuar cuando ninguna opción sea correcta.
  - Emitir `omitir-solicitud` con `idSolicitud`.
  - Mostrar `noEncontrados`, `inconsistencias` y `advertencias` en grupos separados.
  - Para un código duplicado en el maestro, explicar que debe corregirse el Excel; no ofrecer una selección que el almacenamiento de Listados no pueda representar de manera segura.
  - Usar una clave de candidato estable que no dependa exclusivamente del código cuando existan registros repetidos.
  - Mantener la acción de memorias solamente para resultados de texto o audio.
- [ ] Añadir `omitirSolicitudCapitanaBita(idSolicitud)` en `PaginaListados.vue`.
  - Eliminar únicamente la solicitud indicada.
  - Cerrar el panel cuando no queden pendientes, no encontrados, inconsistencias, advertencias ni memorias propuestas.
- [ ] Mantener las reglas actuales de duplicados del listado.
  - Una coincidencia segura que ya existe en el listado debe pasar por la confirmación existente.
  - Una cantidad mayor que uno crea filas repetidas y cada repetición sigue sujeta a la política vigente.
  - No fusionar filas ni introducir una nueva columna de cantidad dentro de este alcance.
- [ ] Ajustar notificaciones finales.
  - Si todas las filas fueron seguras, notificar la cantidad agregada desde la imagen.
  - Si existen pendientes, dejar visible el panel y no afirmar que todo fue agregado.
  - Si ninguna fila fue válida, informar sin modificar el listado.
  - Si el usuario cierra el panel, conservar solamente los artículos seguros ya persistidos y descartar pendientes visuales.
- [ ] Considerar terminada la fase cuando ningún caso dudoso pueda llegar a `insertarArticulo()` sin confirmación explícita.

## FASE 6: Robustecer errores, privacidad y navegación

### Objetivo

Cerrar los caminos secundarios que pueden dejar estados bloqueados, procesar imágenes antiguas o exponer datos innecesarios.

### Archivos y símbolos involucrados

- `src/components/Logica/Compartidos/ServicioCapturaImagen.js`.
- `src/components/Logica/Compartidos/ServicioRecuperacionCapturaImagen.js`.
- `src/components/Logica/CapitanaBita/UsoCapitanaBita.js`.
- `src/components/Logica/CapitanaBita/ServicioCapitanaBita.js`.
- `src/components/Logica/Listados/FormularioListado.vue`.
- `src/pages/PaginaListados.vue`.

### Pasos de ejecución

- [ ] Verificar el comportamiento sin conexión antes de enviar a Gemini.
  - La cámara o galería pueden abrirse, pero la app debe advertir antes del envío y liberar la imagen si no existe conexión.
  - No conservar una captura para un reintento automático posterior.
- [ ] Separar claramente cancelación y error.
  - Detectar el mensaje estable `User cancelled photos app` y equivalentes encapsulados por el servicio.
  - Cancelar debe dejar el formulario utilizable y no mostrar una alerta negativa.
  - Permiso denegado, formato no compatible, imagen demasiado grande y fallo de lectura deben mostrar mensajes distintos.
- [ ] Proteger el destino del resultado.
  - Descartar una respuesta si el listado activo cambió.
  - Limpiar resultados visuales y cola al crear, abrir, duplicar o eliminar listados, reutilizando `limpiarEstadoCapitanaBita()`.
  - No aplicar una captura restaurada si sus metadatos vencieron o pertenecen a otro listado.
- [ ] Proteger privacidad y memoria.
  - No guardar base64, transcripción visual ni miniaturas en Preferences, IndexedDB, Listados o memorias de Capitana Bita.
  - Preferences solo puede conservar metadatos mínimos de recuperación y debe limpiarlos al consumir o vencer.
  - No registrar base64, rutas temporales, texto completo de la imagen ni respuesta JSON completa en consola.
  - Liberar URLs temporales y referencias de imagen en todos los caminos de salida.
- [ ] Mantener navegación Android.
  - Mientras esté abierto el selector nativo, el botón Atrás debe cancelar la actividad nativa.
  - Después de regresar a la WebView, `cerrarPasoAtrasNativo()` debe seguir cerrando primero interacciones de formulario, resultados y modales antes de navegar.
  - `modalActivo` debe reflejar únicamente modales controlados por la WebView; no simular un modal mientras Camera controla su propia actividad.
- [ ] Confirmar que no se requieren cambios en `MainActivity.java`, `capacitor.config.json` ni el manifiesto fuera del permiso ya existente.
- [ ] Considerar terminada la fase cuando todos los caminos de cancelación y error restauren `capturandoImagen` y `procesando` a `false`.

## FASE TESTING

### Objetivo

Validar la extracción, certeza, persistencia, recuperación y experiencia completa sin depender únicamente de una fotografía ideal.

### Pruebas automatizadas

- [ ] Crear `Pruebas/CapitanaBita/ResolverSolicitudesImagenCapitanaBita.test.js` con `node:test` y `node:assert/strict`.
  - Código completo exacto y único más lectura clara produce `unica`.
  - Descripción completa única más lectura clara produce `unica`.
  - Descripción parcial distintiva que deja un solo candidato coherente produce `unica`.
  - Una sola coincidencia con `lecturaClara: false` produce `ambigua` con un candidato.
  - Un fragmento genérico produce `ambigua` con todos los candidatos compatibles.
  - Código parcial con varias coincidencias produce `ambigua`.
  - Código exacto y descripción contradictoria producen `inconsistente`.
  - Código duplicado en el maestro produce `inconsistente` y nunca `unica`.
  - Dos descripciones iguales con códigos diferentes producen `ambigua`.
  - Una fila sin código ni descripción no llega al resolutor después de validar la respuesta.
  - Una fila sin cantidad explícita conserva `1`.
  - Cantidades `0`, negativas, decimales o superiores a `999` se rechazan o normalizan según el contrato definido.
  - La resolución inspecciona más de 50 coincidencias y no hereda el límite del buscador interactivo.
  - El contexto filtra descripciones, pero un código exacto único sigue siendo autoritativo.
  - Repetir la misma resolución entrega el mismo orden, estados y candidatos.
- [ ] Modificar el script `test` de `package.json` para ejecutar exactamente el archivo anterior con Node.
- [ ] Ejecutar `npm test` y comprobar que todas las pruebas finalicen correctamente.
- [ ] Ejecutar `npm run lint` y corregir todos los errores antes de cerrar.
- [ ] Ejecutar `npm run build` y comprobar que Quasar genere la aplicación sin errores.

### Pruebas manuales de captura

- [ ] En Android, pulsar el botón de imagen y comprobar que ofrece `Tomar foto` y `Elegir de galería`.
- [ ] Cancelar desde la selección de origen, la cámara y la galería; no debe mostrarse error ni quedar la entrada bloqueada.
- [ ] Rechazar el permiso de cámara y comprobar que texto, voz y galería continúan disponibles.
- [ ] Conceder nuevamente el permiso y comprobar que la cámara funciona sin reiniciar datos del listado.
- [ ] Elegir una imagen JPEG, PNG y WebP compatible y comprobar que se normaliza a JPEG.
- [ ] Intentar procesar un archivo no compatible y comprobar el mensaje específico.
- [ ] Tomar una foto grande y verificar que se reduce sin deformarse y sin superar el máximo interno.
- [ ] Girar el teléfono antes de capturar y comprobar que Gemini recibe la imagen orientada correctamente.
- [ ] Simular recreación de la actividad Android durante Camera y comprobar que `appRestoredResult` recupera una sola captura o la descarta si venció.

### Pruebas manuales de interpretación

- [ ] Fotografiar una hoja de papel bien iluminada con códigos y descripciones completas.
  - Las coincidencias únicas y claras deben agregarse automáticamente.
  - Cada fila sin cantidad debe generar una unidad.
- [ ] Fotografiar un monitor con patrón de píxeles, perspectiva y corrector ortográfico visible, usando como referencia el caso entregado al definir el plan.
  - Deben ignorarse subrayados, cuadrícula y contenido ajeno.
  - Los códigos cortados deben tratarse como parciales.
  - Las descripciones legibles deben combinarse con el maestro sin completar texto inexistente.
- [ ] Fotografiar filas desenfocadas o cortadas.
  - Una opción posible pero dudosa debe solicitar confirmación.
  - Las filas ilegibles deben quedar en advertencias o no encontradas.
- [ ] Probar una fila con dos candidatos del maestro.
  - El panel debe mostrar ambos y permitir elegir u omitir.
- [ ] Probar una fila dudosa con un solo candidato.
  - El panel debe pedir confirmación y permitir omitir.
- [ ] Probar una cantidad explícita como `3` claramente asociada a una fila.
  - Debe preparar tres filas y respetar la confirmación de duplicados existente.
- [ ] Probar números de modelo, año, stock o ubicación próximos a la descripción.
  - Solo una columna inequívoca de cantidad puede modificar el valor predeterminado `1`.
- [ ] Procesar una imagen sin artículos.
  - No debe modificar el listado y debe informar el resultado.
- [ ] Procesar una imagen sin conexión.
  - No debe conservar la imagen ni dejar el formulario bloqueado.

### Pruebas manuales de integración con Listados

- [ ] Procesar una imagen con coincidencias seguras, dudosas, múltiples y no encontradas en el mismo lote.
  - Las seguras se agregan.
  - Las dudosas y múltiples permanecen en el panel.
  - Las no encontradas e inconsistencias se informan por separado.
- [ ] Seleccionar y omitir solicitudes en distinto orden; cada acción debe afectar únicamente su grupo.
- [ ] Cerrar el panel con pendientes; las filas seguras persisten y las pendientes se descartan.
- [ ] Incluir un artículo ya presente en el listado y comprobar que aparece la confirmación de repetido.
- [ ] Confirmar y cancelar repetidos mientras quedan elementos en cola; la cola debe continuar sin saltos ni dobles inserciones.
- [ ] Cambiar de listado antes de que Gemini responda; el resultado antiguo debe descartarse.
- [ ] Crear, abrir, duplicar o eliminar un listado con resultados pendientes y comprobar que se limpia el estado visual.
- [ ] Forzar un error de Preferences durante un lote y comprobar que se informa sin perder silenciosamente los elementos restantes.
- [ ] Verificar que texto y audio continúan agregando artículos y ofreciendo memorias igual que antes.
- [ ] Verificar que el escáner conserva su tolerancia y comportamiento actual.

### Casos responsivos

- [ ] En teléfono vertical estrecho, verificar que el campo y los botones no desborden y mantengan objetivos táctiles de al menos 44 px.
- [ ] En teléfono horizontal, verificar que el selector de origen, estados y panel no oculten acciones importantes.
- [ ] En web/escritorio, verificar selección desde archivo, legibilidad del panel y ausencia de desbordamiento horizontal.
- [ ] En una pantalla de hasta 600 px, verificar que candidatos, memoria, omisión y advertencias se apilen usando el breakpoint existente.
- [ ] Verificar que el panel pueda desplazarse cuando la imagen produzca muchos candidatos, sin impedir el acceso al resto del listado.

### Validación final en Android

- [ ] Ejecutar `npm run cel` según el flujo oficial del repositorio.
- [ ] Confirmar que se genera el AAB release, se sincronizan plugins y se abre Android Studio.
- [ ] Instalar la variante correspondiente en un dispositivo real y repetir los escenarios principales con cámara y galería.
- [ ] Confirmar en consola que no se imprimen imágenes base64 ni transcripciones completas.

## Progreso del plan

- [ ] Fase 1: Crear la infraestructura compartida de imágenes
- [ ] Fase 2: Definir la extracción visual estructurada de Capitana Bita
- [ ] Fase 3: Crear la resolución estricta y exhaustiva contra el maestro
- [ ] Fase 4: Integrar cámara y galería en la entrada de Capitana Bita
- [ ] Fase 5: Resolver e insertar resultados visuales en Listados
- [ ] Fase 6: Robustecer errores, privacidad y navegación
- [ ] Fase Testing

Fecha de creación: 13 de septiembre de 2026
Fecha de última actualización: 13 de septiembre de 2026
Estado: BORRADOR
