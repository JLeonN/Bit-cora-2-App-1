# PLAN MÓDULO STOCK

## Descripción del plan

Agregar un apartado principal llamado `Stock` entre `Consulta de ubicación` y `Etiquetas`, tanto en el inicio como en el drawer. El módulo permitirá buscar artículos de la base Excel, registrar y actualizar conteos, importar artículos desde la tabla de trabajo de Ubicaciones, modificar ubicaciones, enviar artículos a Etiquetas y generar un Excel final con los conteos confirmados.

La experiencia inicial debe ser visual y funcionalmente similar a Consulta de ubicación y Ubicaciones. Se deben reutilizar componentes, funciones, estilos, modales y servicios existentes siempre que sea técnicamente posible, evitando duplicar lógica.

Cada lista de Stock representa una sesión de conteo ligada al archivo Excel desde el que se obtuvo el stock original. No se deben mezclar silenciosamente registros creados con archivos Excel distintos.

## Objetivo principal

- Permitir contar artículos rápidamente usando la búsqueda inteligente existente.
- Conservar un único registro de Stock por código y reemplazarlo al confirmar cambios.
- Diferenciar claramente artículos pendientes de confirmar y artículos confirmados.
- Facilitar conteos acumulativos cuando un mismo artículo aparece en distintas ubicaciones.
- Integrar Stock con Ubicaciones, Etiquetas y el sistema actual de archivos Excel.
- Generar información resumida y alertas útiles durante el conteo.
- Documentar el módulo para que otra IA pueda mantenerlo en el futuro.

## Reglas del plan

- Reutilizar todo componente, función, estilo, modal, servicio y patrón existente que resulte compatible.
- No copiar lógica existente si puede extraerse o reutilizarse mediante un contrato compartido.
- Mantener nombres de archivos y carpetas en PascalCase, variables y funciones en español y camelCase.
- Mantener archivos en UTF-8 y textos naturales en español.
- Usar únicamente variables de color definidas en `src/css/app.css`.
- Mantener el CSS compacto y sin líneas vacías entre reglas.
- Usar una persistencia propia para Stock, separada de Ubicaciones y de la base Excel.
- Mantener un solo registro de Stock por código.
- Trabajar únicamente con cantidades enteras iguales o mayores que `0`.
- Los artículos importados desde Ubicaciones deben quedar pendientes hasta que el usuario confirme el conteo.
- El Excel de Stock debe incluir únicamente artículos confirmados.
- Enviar siempre una sola etiqueta por artículo, sin usar el stock contado como cantidad de etiquetas.
- La ubicación original del Excel no debe sobrescribirse.
- Los cambios de ubicación realizados desde Stock deben actualizar el historial del artículo y agregarse a la tabla de Ubicaciones.
- Aplicar la señal visual neón únicamente cuando la ubicación original del Excel sea `SL`.
- No eliminar ni reemplazar conteos confirmados durante una importación desde Ubicaciones.
- No actualizar la UI de Stock como guardada hasta que la persistencia correspondiente termine correctamente.
- Mantener una sola fuente de verdad para resolver nombre, stock original, ubicación original y última ubicación registrada.
- No mezclar registros de sesiones creadas con archivos Excel distintos sin una decisión explícita del usuario.

### Contratos funcionales cerrados

- `stockExcel` es una copia numérica del stock del Excel al crear el registro y no cambia durante esa sesión.
- Si el stock Excel contiene decimales, se trunca hacia cero y se muestra una alerta; si está vacío o no es numérico, se usa `0` y se informa como dato inválido. Los enteros negativos se conservan.
- `stockContado` siempre es un número entero y puede ser negativo.
- Un registro pendiente puede editarse, pero solo pasa a confirmado mediante `Confirmar conteo` o la acción de confirmación de su fila.
- Editar cantidad o ubicación de un registro ya confirmado mantiene su estado confirmado.
- Cancelar o cerrar una selección nunca modifica el registro guardado.
- La tabla se ordena por `fechaActualizacion`, con el registro más reciente primero.
- Para importar desde Ubicaciones, la primera aparición de cada código en el array actual representa el movimiento más reciente, porque Ubicaciones agrega nuevas filas al inicio.
- Para mostrar o exportar la última ubicación se usa, en este orden: movimiento más reciente de la tabla de Ubicaciones, último valor de `historialUbicaciones`, ubicación guardada en el registro de Stock y cadena vacía.
- La ubicación original del Excel se muestra aparte y nunca se usa como sustituto de una ubicación registrada por el usuario.
- El envío individual a Etiquetas está disponible para registros pendientes y confirmados.
- Para Etiquetas, un registro válido debe tener código existente en la base Excel activa; la ubicación puede estar vacía.
- El envío masivo a Etiquetas incluye todos los registros válidos de Stock; omite inexistentes e informa cuántos fueron excluidos. La confirmación solo condiciona la exportación del Excel.
- Los totales de stock Excel, stock contado y diferencia se calculan únicamente con registros confirmados.
- La diferencia por artículo es `stockContado - stockExcel`.
- La diferencia total es la suma del stock contado confirmado menos la suma del stock Excel confirmado.
- La sesión de Stock guarda la identidad del Excel mediante `nombre`, `tamano` y `fechaModificacion`.
- Si se carga un Excel distinto mientras existen registros, Stock bloquea nuevas altas, importaciones y exportaciones hasta que el usuario vuelva a cargar el archivo anterior o confirme iniciar una sesión nueva eliminando los registros actuales.

## FASE 1: Integrar Stock en la navegación

### Objetivo

Incorporar Stock como un módulo principal de la aplicación respetando el orden y diseño actuales.

- [x] Crear la página principal de Stock siguiendo la estructura existente del proyecto.
- [x] Usar `PaginaStock.vue` como página y `src/components/Logica/Stock/` para componentes y servicios específicos.
- [x] Agregar la ruta de Stock entre Consulta de ubicación y Etiquetas.
- [x] Agregar la tarjeta de Stock en el inicio entre Consulta de ubicación y Etiquetas.
- [x] Agregar Stock al drawer en el mismo orden.
- [x] Elegir un icono de Tabler consistente con inventario o cajas.
- [x] Integrar la configuración de la barra inferior y el botón Atrás nativo.
- [x] Mantener el diseño responsive y las transiciones existentes.

## FASE 2: Crear el almacenamiento independiente de Stock

### Objetivo

Persistir los conteos sin alterar la tabla de Ubicaciones ni los datos originales del Excel.

- [x] Crear `UsoAlmacenamientoStock.js` usando `@capacitor/preferences`.
- [x] Definir una clave exclusiva para los registros de Stock.
- [x] Guardar un único registro por código.
- [x] Guardar una estructura versionada con metadatos de sesión y un array de registros.
- [x] Definir los metadatos `version`, `fuenteExcel` y `fechaInicio`.
- [x] Definir como mínimo los campos `codigo`, `nombre`, `stockExcel`, `stockContado`, `ubicacionActual`, `ubicacionOriginalExcel`, `confirmado` y `fechaActualizacion`.
- [x] Normalizar códigos, cantidades y ubicaciones antes de persistir.
- [x] Convertir stock vacío o inválido a `0` sin producir `NaN` y conservar enteros negativos.
- [x] Truncar hacia cero los decimales provenientes del Excel y alertar al usuario.
- [x] Rechazar decimales ingresados manualmente y conservar el último valor válido.
- [x] Implementar funciones para obtener la sesión, guardar o actualizar por código y eliminar registros.
- [x] Hacer que las funciones de escritura devuelvan un resultado verificable o lancen un error; no ocultar fallos de persistencia.
- [x] Implementar una función para eliminar toda la sesión; la confirmación visual queda a cargo de la página.
- [x] Reemplazar el registro anterior cuando se confirme nuevamente el mismo código.
- [x] Mantener compatibilidad ante datos incompletos o versiones anteriores del almacenamiento.
- [x] Detectar si el Excel cargado coincide con `fuenteExcel`.
- [x] Bloquear operaciones que mezclarían fuentes distintas y mostrar opciones claras para resolverlo.
- [x] No borrar automáticamente una sesión por cargar o limpiar la base Excel.

## FASE 3: Construir la búsqueda y selección del artículo

### Objetivo

Ofrecer un flujo de búsqueda rápido y consistente con Ubicaciones.

- [x] Reutilizar `SelectorExcel.vue` cuando no exista una base cargada.
- [x] Reutilizar `CodigoMasNombre.vue` para buscar por código o descripción.
- [x] Reutilizar la normalización del input, el doble espacio, el resaltado y el botón para copiar texto.
- [x] Autoseleccionar el artículo cuando la búsqueda tenga una sola coincidencia, incluyendo búsquedas normales y escaneadas.
- [x] Ajustar el contrato reutilizable de `CodigoMasNombre.vue` si es necesario, sin cambiar el comportamiento actual de Ubicaciones y Consulta de ubicación.
- [x] Extraer lógica compartida únicamente cuando elimine duplicación real y pueda verificarse en los módulos existentes.
- [x] Mostrar la mini tarjeta al seleccionar un artículo.
- [x] Agregar una cruz para cancelar, limpiar la selección y volver a enfocar el buscador.
- [x] Permitir iniciar inmediatamente otra búsqueda después de confirmar o cancelar.
- [x] Reutilizar el sistema de cámara y escaneo si encaja sin duplicar lógica.

## FASE 4: Diseñar la mini tarjeta y el contador

### Objetivo

Mostrar la información necesaria y permitir ajustar el conteo con rapidez.

- [x] Mostrar el encabezado `Artículo seleccionado` y la cruz de cierre.
- [x] Mostrar nombre y código del artículo.
- [x] Mostrar el stock original del Excel en la mini tarjeta.
- [x] Mostrar únicamente la última ubicación registrada por el usuario, si existe.
- [x] Mostrar la ubicación original del Excel.
- [x] Aplicar borde y texto neón cuando la ubicación original sea `SL`.
- [x] Agregar un input numérico con botones `−` y `+`.
- [x] Admitir valores enteros negativos mediante escritura directa y controles de suma o resta.
- [x] Usar teclado numérico móvil y seleccionar el contenido al enfocar para facilitar reemplazos.
- [x] Iniciar un artículo nuevo con el stock original del Excel.
- [x] Iniciar un artículo ya registrado con el último total contado.
- [x] Mostrar `Este artículo ya fue contado. Puedes actualizar la cantidad.` cuando exista un registro previo.
- [x] Indicar la ubicación asociada al conteo anterior para ayudar a detectar artículos encontrados en más de un estante.
- [x] Permitir sumar unidades encontradas posteriormente usando el total guardado como punto de partida.
- [x] Mantener visible el total acumulado; los botones `−` y `+` modifican ese total y no una cantidad separada.
- [x] Agregar el botón verde `Confirmar conteo`.
- [x] Agregar el botón `Cancelar conteo`.
- [x] Hacer que confirmar, cancelar o cerrar la tarjeta devuelva el foco al buscador.
- [x] Marcar el registro como confirmado aunque la cantidad coincida con el stock Excel.
- [x] Si el artículo ya estaba pendiente, confirmar el mismo registro sin crear duplicados.
- [x] Si el artículo ya estaba confirmado, guardar los cambios sobre el mismo registro y actualizar `fechaActualizacion`.
- [x] Si falla el guardado, conservar la tarjeta y el valor ingresado para permitir reintentar.

## FASE 5: Importar artículos desde Ubicaciones

### Objetivo

Preparar conteos a partir de los artículos que el usuario ya tiene en la tabla de trabajo de Ubicaciones.

- [x] Agregar debajo del título un desplegable cerrado por defecto.
- [x] Reutilizar `TarjetaSeccion.vue` para el desplegable.
- [x] Incluir la acción `Importar artículos desde Ubicaciones`.
- [x] Leer únicamente los artículos existentes en la tabla de trabajo de Ubicaciones.
- [x] Crear un solo registro por código aunque el código aparezca repetido en Ubicaciones.
- [x] Resolver duplicados conservando la primera aparición del código en la lista actual de Ubicaciones.
- [x] Inicializar cada registro importado con el stock original del Excel.
- [x] Usar la última ubicación registrada disponible.
- [x] Marcar todos los registros importados como pendientes de confirmar.
- [x] Mostrar el subtítulo `Pendiente de confirmar` en la tabla.
- [x] Quitar el subtítulo y mostrar un check cuando el usuario confirme el conteo.
- [x] Permitir artículos inexistentes con stock Excel `0` y su alerta correspondiente.
- [x] Conservar sin cambios todos los registros confirmados.
- [x] Actualizar registros pendientes ya importados sin duplicarlos y mantenerlos pendientes.
- [x] Mostrar al terminar un resumen con cantidades importadas, actualizadas, omitidas por estar confirmadas e inexistentes.
- [x] No iniciar la importación si la sesión pertenece a otro Excel.

## FASE 6: Crear la tabla de Stock y la edición en línea

### Objetivo

Mostrar todos los registros y permitir corregirlos sin abandonar la tabla.

- [x] Reutilizar la estructura visual y responsive de las tablas existentes.
- [x] Mostrar el nombre con mayor jerarquía visual.
- [x] Mostrar el código en tamaño normal.
- [x] Mostrar el stock original del Excel en cada fila.
- [x] Mostrar el stock contado con la misma jerarquía visual que el nombre.
- [x] Mostrar el estado pendiente o confirmado.
- [x] Agregar una acción visible para confirmar una fila pendiente sin abrir nuevamente la mini tarjeta.
- [x] Permitir editar en línea el stock contado al tocarlo.
- [x] Mostrar botones `−` y `+` durante la edición en línea.
- [x] Permitir editar en línea la ubicación antes o después de confirmar el conteo.
- [x] Mantener pendiente un registro pendiente después de editarlo hasta que el usuario lo confirme explícitamente.
- [x] Mantener confirmado un registro confirmado después de editarlo.
- [x] Guardar las ediciones solo con cantidades enteras válidas y nunca menores que `0`.
- [x] Permitir cancelar la edición en línea y restaurar el valor persistido.
- [x] Evitar que más de una fila quede en edición simultáneamente.
- [x] Agregar una acción individual para enviar el artículo a Etiquetas.
- [x] Enviar a Etiquetas código, descripción, ubicación y cantidad fija `1`.
- [x] Agregar un icono de papelera para eliminar el registro.
- [x] Reutilizar `ModalEliminar.vue` para confirmar eliminaciones.
- [x] Agregar una acción para eliminar todos los registros reutilizando el patrón existente.
- [x] Devolver el foco al buscador después de confirmar, cancelar o eliminar una fila.
- [x] Mostrar un estado vacío claro cuando todavía no existan registros de Stock.

## FASE 7: Integrar cambios de ubicación con Ubicaciones

### Objetivo

Permitir corregir la ubicación desde Stock y sincronizar el cambio con el flujo actual.

- [x] Reutilizar el formato, normalización y validaciones del editor de ubicación existente.
- [x] Permitir cambiar la ubicación desde la mini tarjeta.
- [x] Permitir cambiar la ubicación mediante edición en línea en la tabla.
- [x] Actualizar el historial del artículo usando `actualizarUbicacionArticulo`.
- [x] Mantener intacta la ubicación original del Excel.
- [x] Agregar la ubicación nueva a la tabla de trabajo de Ubicaciones.
- [x] Actualizar inmediatamente la ubicación visible en Stock.
- [x] Guardar la ubicación nueva como última ubicación asociada al conteo.
- [x] Mostrar una notificación clara indicando que la ubicación fue enviada a Ubicaciones.
- [x] Respetar las reglas actuales de duplicados de la tabla de Ubicaciones.
- [x] Crear o reutilizar una operación compartida que coordine historial Excel y tabla de Ubicaciones.
- [x] No marcar la ubicación como guardada en Stock hasta completar ambas persistencias.
- [x] Si una de las dos escrituras falla, restaurar el estado anterior cuando sea posible y mostrar un error específico.
- [x] Mantener el comportamiento actual de Consulta de ubicación: agregar el movimiento al inicio de Ubicaciones sin reemplazar filas anteriores.
- [x] No reconstruir ni ocultar conflictos cuando la nueva fila produce un código duplicado en Ubicaciones.

## FASE 8: Integrar Stock con Etiquetas

### Objetivo

Enviar artículos de Stock al módulo de Etiquetas usando el contrato existente.

- [x] Reutilizar el mecanismo actual de envío desde Ubicaciones hacia Etiquetas.
- [x] Agregar envío individual desde cada fila.
- [x] Permitir envío individual tanto para artículos pendientes como confirmados.
- [x] Agregar una acción general para enviar todos los artículos válidos de Stock.
- [x] Usar siempre cantidad de etiquetas `1`.
- [x] Enviar código, descripción y última ubicación disponible.
- [x] Mantener el contrato actual de Etiquetas: `id`, `codigo`, `descripcion`, `ubicacion`, `cantidad: 1` y `tamano: '10x15cm'`.
- [x] Generar identificadores únicos también durante envíos masivos.
- [x] Bloquear el envío individual de artículos inexistentes.
- [x] Omitir artículos inexistentes en el envío masivo e informar la cantidad excluida.
- [x] Mostrar notificaciones y animaciones consistentes con Ubicaciones.
- [x] Evitar duplicar la lógica de construcción y persistencia de etiquetas.

## FASE 9: Agregar Información e informes

### Objetivo

Mostrar un resumen compacto del estado del conteo y abrirlo automáticamente cuando exista una alerta.

- [x] Agregar una sección desplegable `Información`.
- [x] Reutilizar `TarjetaSeccion.vue` y el diseño del informe de Ubicaciones.
- [x] Mantener la sección cerrada por defecto.
- [x] Mostrar artículos totales.
- [x] Mostrar conteos confirmados.
- [x] Mostrar artículos pendientes de confirmar.
- [x] Mostrar artículos con diferencias respecto al stock Excel.
- [x] Mostrar artículos cuya ubicación original sea `SL`.
- [x] Mostrar artículos inexistentes.
- [x] Mostrar el total de unidades del Excel.
- [x] Mostrar el total de unidades contadas confirmadas.
- [x] Mostrar la diferencia total de unidades.
- [x] Calcular diferencias y totales de unidades únicamente sobre registros confirmados.
- [x] Contar pendientes, artículos `SL` e inexistentes sobre todos los registros.
- [x] Mostrar explícitamente la fórmula de diferencia como `Contado - Excel`.
- [x] Abrir automáticamente la sección ante artículos pendientes, diferencias, ubicación `SL` o artículos inexistentes.
- [x] Mantener textos breves y comprensibles para el usuario.

## FASE 10: Generar y enviar el Excel de Stock

### Objetivo

Exportar únicamente los conteos confirmados con el formato requerido.

- [x] Crear un generador de Excel específico para Stock reutilizando la estructura de `ExportarUbicacionesExcel.js`.
- [x] Usar `ExportarStockExcel.js` y reutilizar helpers existentes de plataforma, escritura y compartir cuando sea posible.
- [x] Colocar en la columna A el código.
- [x] Colocar en la columna B la descripción.
- [x] Colocar en la columna C el stock original del Excel.
- [x] Colocar en la columna D el stock contado por el usuario.
- [x] Colocar en la columna E la última ubicación registrada por el usuario.
- [x] Colocar en la columna F `✔️` o `❌`.
- [x] Usar `❌` cuando el artículo sea inexistente o su ubicación original del Excel sea `SL`.
- [x] Usar `✔️` en los demás casos.
- [x] Excluir todos los registros pendientes de confirmar.
- [x] Exportar la última ubicación aplicando el contrato de prioridad definido en este plan.
- [x] Usar anchos explícitos: A `18`, B `65`, C `14`, D `14`, E `14` y F `7`.
- [x] Guardar stock Excel y stock contado como celdas numéricas.
- [x] Definir encabezados exactos: `Código`, `Descripción`, `Stock Excel`, `Stock contado`, `Última ubicación` e `Info`.
- [x] Reutilizar el guardado con `Filesystem`, la descarga web y el menú nativo para compartir.
- [x] Configurar el nombre `Stock [Nombre de usuario] AAAA-MM-DD # HH-MM.xlsx`.
- [x] Mostrar el botón de enviar en móvil cuando existan registros confirmados.
- [x] Mostrar en navegador un botón personalizado de descarga en lugar del botón nativo de enviar.
- [x] Informar claramente cuando no existan registros confirmados para exportar.
- [x] Bloquear la exportación si la fuente Excel activa no coincide con la sesión.
- [x] Ordenar las filas exportadas igual que la tabla visible.

## FASE 11: Crear tutorial y documentación técnica

### Objetivo

Documentar el uso para el usuario y la arquitectura para futuras tareas de mantenimiento.

- [x] Crear un tutorial de Stock dentro de Configuración.
- [x] Explicar búsqueda, selección automática, conteo, pendientes, edición, Ubicaciones, Etiquetas, informes y Excel.
- [x] Integrar el tutorial en la sección actual de tutoriales.
- [x] Crear `Planes/Resumenes/Resumen7Stock.md`.
- [x] Documentar componentes, persistencia, estructura de registros e integraciones.
- [x] Documentar la sesión de conteo y su vínculo con el Excel de origen.
- [x] Documentar el significado de pendiente y confirmado.
- [x] Documentar cómo se calcula la última ubicación.
- [x] Documentar las fórmulas de informes y la política de importación y reimportación.
- [x] Documentar las reglas de `SL`, artículos inexistentes y columna Info del Excel.
- [x] Documentar qué lógica fue reutilizada y dónde se encuentran los contratos compartidos.
- [x] Actualizar el resumen general para incluir Stock como módulo principal.
- [x] Revisar que toda la documentación quede en UTF-8 y español natural.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano el flujo completo de Stock.

- [x] Verificar que Stock aparece entre Consulta de ubicación y Etiquetas en inicio y drawer.
- [x] Entrar sin base Excel y comprobar que aparece el selector existente.
- [ ] Buscar por código y por nombre y comprobar la selección correcta.
- [x] Confirmar que una única coincidencia se selecciona automáticamente.
- [ ] Comprobar el botón de copiar y el escaneo.
- [ ] Cerrar o cancelar la tarjeta y verificar que el buscador recupera el foco.
- [x] Seleccionar un artículo nuevo y comprobar que inicia con el stock Excel.
- [ ] Probar stock Excel vacío, texto y decimal, y verificar que los valores negativos se conserven.
- [ ] Ingresar manualmente un decimal y comprobar que se rechaza sin perder el último valor válido.
- [ ] Ajustar el contador con `−` y `+` y verificar que admite valores negativos.
- [ ] Confirmar una cantidad igual al stock Excel y comprobar que queda confirmada.
- [ ] Buscar nuevamente el mismo artículo y comprobar el aviso, total y ubicación anteriores.
- [ ] Sumar unidades encontradas en otra ubicación y verificar que se reemplaza el total guardado.
- [x] Importar artículos desde Ubicaciones y comprobar que quedan pendientes.
- [ ] Importar códigos repetidos y verificar que se conserva la aparición más reciente sin duplicar Stock.
- [ ] Reimportar y verificar que los confirmados se conservan y los pendientes se actualizan.
- [ ] Confirmar un artículo importado y comprobar que desaparece `Pendiente de confirmar` y aparece el check.
- [ ] Editar cantidad y ubicación en línea antes y después de confirmar.
- [ ] Cancelar una edición en línea y verificar que se restaura el valor persistido.
- [ ] Intentar editar dos filas a la vez y verificar que solo una permanece en edición.
- [x] Cambiar una ubicación y verificar historial, tabla de Ubicaciones y vista de Stock.
- [ ] Enviar un artículo a Etiquetas y comprobar cantidad fija `1`.
- [ ] Enviar todos los registros válidos a Etiquetas y comprobar que pendientes y confirmados usan cantidad `1`.
- [ ] Intentar enviar un artículo inexistente y comprobar que se bloquea con un mensaje claro.
- [ ] Ejecutar envío masivo con inexistentes y comprobar que se omiten y se informa la cantidad excluida.
- [ ] Eliminar un registro y eliminar todos usando confirmaciones.
- [x] Validar todas las métricas de Información.
- [x] Verificar que los totales de unidades y diferencias excluyen registros pendientes.
- [x] Provocar una diferencia, un artículo `SL`, un inexistente y un pendiente para comprobar la apertura automática del informe.
- [x] Generar el Excel y verificar columnas A a F, datos, checks, cruces y anchos.
- [x] Confirmar que el Excel excluye pendientes.
- [x] Confirmar el nombre `Stock [Nombre de usuario] AAAA-MM-DD # HH-MM.xlsx`.
- [ ] Verificar tipos numéricos y anchos exactos de las seis columnas.
- [ ] Cargar un Excel distinto con una sesión activa y comprobar que se bloquean altas, importación y exportación.
- [ ] Confirmar que la sesión anterior no se elimina automáticamente.
- [ ] Iniciar una sesión nueva mediante confirmación y comprobar que queda vinculada al Excel nuevo.
- [x] Descargar el Excel en navegador.
- [ ] Compartir el Excel desde Android.
- [x] Recargar la app y verificar la persistencia de conteos y estados.
- [x] Revisar tutorial y resumen técnico.
- [x] Ejecutar `npm run lint`.
- [x] Ejecutar `npm run build`.
- [x] Revisar visualmente el flujo en resolución móvil y escritorio.
- [x] Revisar consola y confirmar que no quedan errores ni advertencias nuevas durante los flujos principales.

## Progreso del plan

- [x] Fase 1: Integrar Stock en la navegación
- [x] Fase 2: Crear el almacenamiento independiente de Stock
- [x] Fase 3: Construir la búsqueda y selección del artículo
- [x] Fase 4: Diseñar la mini tarjeta y el contador
- [x] Fase 5: Importar artículos desde Ubicaciones
- [x] Fase 6: Crear la tabla de Stock y la edición en línea
- [x] Fase 7: Integrar cambios de ubicación con Ubicaciones
- [x] Fase 8: Integrar Stock con Etiquetas
- [x] Fase 9: Agregar Información e informes
- [x] Fase 10: Generar y enviar el Excel de Stock
- [x] Fase 11: Crear tutorial y documentación técnica
- [ ] Fase Testing

Fecha de creación: 06 de Junio 2026
Fecha de última actualización: 06 de Junio 2026
Estado: EN PROCESO
