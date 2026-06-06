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
- Si el stock Excel contiene decimales, se trunca hacia cero y se muestra una alerta; si está vacío, es negativo o no es numérico, se usa `0` y se informa como dato inválido.
- `stockContado` siempre es un número entero igual o mayor que `0`.
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

- [ ] Crear la página principal de Stock siguiendo la estructura existente del proyecto.
- [ ] Usar `PaginaStock.vue` como página y `src/components/Logica/Stock/` para componentes y servicios específicos.
- [ ] Agregar la ruta de Stock entre Consulta de ubicación y Etiquetas.
- [ ] Agregar la tarjeta de Stock en el inicio entre Consulta de ubicación y Etiquetas.
- [ ] Agregar Stock al drawer en el mismo orden.
- [ ] Elegir un icono de Tabler consistente con inventario o cajas.
- [ ] Integrar la configuración de la barra inferior y el botón Atrás nativo.
- [ ] Mantener el diseño responsive y las transiciones existentes.

## FASE 2: Crear el almacenamiento independiente de Stock

### Objetivo

Persistir los conteos sin alterar la tabla de Ubicaciones ni los datos originales del Excel.

- [ ] Crear `UsoAlmacenamientoStock.js` usando `@capacitor/preferences`.
- [ ] Definir una clave exclusiva para los registros de Stock.
- [ ] Guardar un único registro por código.
- [ ] Guardar una estructura versionada con metadatos de sesión y un array de registros.
- [ ] Definir los metadatos `version`, `fuenteExcel` y `fechaInicio`.
- [ ] Definir como mínimo los campos `codigo`, `nombre`, `stockExcel`, `stockContado`, `ubicacionActual`, `ubicacionOriginalExcel`, `confirmado` y `fechaActualizacion`.
- [ ] Normalizar códigos, cantidades y ubicaciones antes de persistir.
- [ ] Convertir stock vacío, inválido o negativo a `0` sin producir `NaN`.
- [ ] Truncar hacia cero los decimales provenientes del Excel y alertar al usuario.
- [ ] Rechazar decimales ingresados manualmente y conservar el último valor válido.
- [ ] Implementar funciones para obtener la sesión, guardar o actualizar por código y eliminar registros.
- [ ] Hacer que las funciones de escritura devuelvan un resultado verificable o lancen un error; no ocultar fallos de persistencia.
- [ ] Implementar una función para eliminar toda la sesión; la confirmación visual queda a cargo de la página.
- [ ] Reemplazar el registro anterior cuando se confirme nuevamente el mismo código.
- [ ] Mantener compatibilidad ante datos incompletos o versiones anteriores del almacenamiento.
- [ ] Detectar si el Excel cargado coincide con `fuenteExcel`.
- [ ] Bloquear operaciones que mezclarían fuentes distintas y mostrar opciones claras para resolverlo.
- [ ] No borrar automáticamente una sesión por cargar o limpiar la base Excel.

## FASE 3: Construir la búsqueda y selección del artículo

### Objetivo

Ofrecer un flujo de búsqueda rápido y consistente con Ubicaciones.

- [ ] Reutilizar `SelectorExcel.vue` cuando no exista una base cargada.
- [ ] Reutilizar `CodigoMasNombre.vue` para buscar por código o descripción.
- [ ] Reutilizar la normalización del input, el doble espacio, el resaltado y el botón para copiar texto.
- [ ] Autoseleccionar el artículo cuando la búsqueda tenga una sola coincidencia, incluyendo búsquedas normales y escaneadas.
- [ ] Ajustar el contrato reutilizable de `CodigoMasNombre.vue` si es necesario, sin cambiar el comportamiento actual de Ubicaciones y Consulta de ubicación.
- [ ] Extraer lógica compartida únicamente cuando elimine duplicación real y pueda verificarse en los módulos existentes.
- [ ] Mostrar la mini tarjeta al seleccionar un artículo.
- [ ] Agregar una cruz para cancelar, limpiar la selección y volver a enfocar el buscador.
- [ ] Permitir iniciar inmediatamente otra búsqueda después de confirmar o cancelar.
- [ ] Reutilizar el sistema de cámara y escaneo si encaja sin duplicar lógica.

## FASE 4: Diseñar la mini tarjeta y el contador

### Objetivo

Mostrar la información necesaria y permitir ajustar el conteo con rapidez.

- [ ] Mostrar el encabezado `Artículo seleccionado` y la cruz de cierre.
- [ ] Mostrar nombre y código del artículo.
- [ ] Mostrar el stock original del Excel en la mini tarjeta.
- [ ] Mostrar únicamente la última ubicación registrada por el usuario, si existe.
- [ ] Mostrar la ubicación original del Excel.
- [ ] Aplicar borde y texto neón cuando la ubicación original sea `SL`.
- [ ] Agregar un input numérico con botones `−` y `+`.
- [ ] Evitar valores negativos mediante controles y validación.
- [ ] Usar teclado numérico móvil y seleccionar el contenido al enfocar para facilitar reemplazos.
- [ ] Iniciar un artículo nuevo con el stock original del Excel.
- [ ] Iniciar un artículo ya registrado con el último total contado.
- [ ] Mostrar `Este artículo ya fue contado. Puedes actualizar la cantidad.` cuando exista un registro previo.
- [ ] Indicar la ubicación asociada al conteo anterior para ayudar a detectar artículos encontrados en más de un estante.
- [ ] Permitir sumar unidades encontradas posteriormente usando el total guardado como punto de partida.
- [ ] Mantener visible el total acumulado; los botones `−` y `+` modifican ese total y no una cantidad separada.
- [ ] Agregar el botón verde `Confirmar conteo`.
- [ ] Agregar el botón `Cancelar conteo`.
- [ ] Hacer que confirmar, cancelar o cerrar la tarjeta devuelva el foco al buscador.
- [ ] Marcar el registro como confirmado aunque la cantidad coincida con el stock Excel.
- [ ] Si el artículo ya estaba pendiente, confirmar el mismo registro sin crear duplicados.
- [ ] Si el artículo ya estaba confirmado, guardar los cambios sobre el mismo registro y actualizar `fechaActualizacion`.
- [ ] Si falla el guardado, conservar la tarjeta y el valor ingresado para permitir reintentar.

## FASE 5: Importar artículos desde Ubicaciones

### Objetivo

Preparar conteos a partir de los artículos que el usuario ya tiene en la tabla de trabajo de Ubicaciones.

- [ ] Agregar debajo del título un desplegable cerrado por defecto.
- [ ] Reutilizar `TarjetaSeccion.vue` para el desplegable.
- [ ] Incluir la acción `Importar artículos desde Ubicaciones`.
- [ ] Leer únicamente los artículos existentes en la tabla de trabajo de Ubicaciones.
- [ ] Crear un solo registro por código aunque el código aparezca repetido en Ubicaciones.
- [ ] Resolver duplicados conservando la primera aparición del código en la lista actual de Ubicaciones.
- [ ] Inicializar cada registro importado con el stock original del Excel.
- [ ] Usar la última ubicación registrada disponible.
- [ ] Marcar todos los registros importados como pendientes de confirmar.
- [ ] Mostrar el subtítulo `Pendiente de confirmar` en la tabla.
- [ ] Quitar el subtítulo y mostrar un check cuando el usuario confirme el conteo.
- [ ] Permitir artículos inexistentes con stock Excel `0` y su alerta correspondiente.
- [ ] Conservar sin cambios todos los registros confirmados.
- [ ] Actualizar registros pendientes ya importados sin duplicarlos y mantenerlos pendientes.
- [ ] Mostrar al terminar un resumen con cantidades importadas, actualizadas, omitidas por estar confirmadas e inexistentes.
- [ ] No iniciar la importación si la sesión pertenece a otro Excel.

## FASE 6: Crear la tabla de Stock y la edición en línea

### Objetivo

Mostrar todos los registros y permitir corregirlos sin abandonar la tabla.

- [ ] Reutilizar la estructura visual y responsive de las tablas existentes.
- [ ] Mostrar el nombre con mayor jerarquía visual.
- [ ] Mostrar el código en tamaño normal.
- [ ] Mostrar el stock original del Excel en cada fila.
- [ ] Mostrar el stock contado con la misma jerarquía visual que el nombre.
- [ ] Mostrar el estado pendiente o confirmado.
- [ ] Agregar una acción visible para confirmar una fila pendiente sin abrir nuevamente la mini tarjeta.
- [ ] Permitir editar en línea el stock contado al tocarlo.
- [ ] Mostrar botones `−` y `+` durante la edición en línea.
- [ ] Permitir editar en línea la ubicación antes o después de confirmar el conteo.
- [ ] Mantener pendiente un registro pendiente después de editarlo hasta que el usuario lo confirme explícitamente.
- [ ] Mantener confirmado un registro confirmado después de editarlo.
- [ ] Guardar las ediciones solo con cantidades enteras válidas y nunca menores que `0`.
- [ ] Permitir cancelar la edición en línea y restaurar el valor persistido.
- [ ] Evitar que más de una fila quede en edición simultáneamente.
- [ ] Agregar una acción individual para enviar el artículo a Etiquetas.
- [ ] Enviar a Etiquetas código, descripción, ubicación y cantidad fija `1`.
- [ ] Agregar un icono de papelera para eliminar el registro.
- [ ] Reutilizar `ModalEliminar.vue` para confirmar eliminaciones.
- [ ] Agregar una acción para eliminar todos los registros reutilizando el patrón existente.
- [ ] Devolver el foco al buscador después de confirmar, cancelar o eliminar una fila.
- [ ] Mostrar un estado vacío claro cuando todavía no existan registros de Stock.

## FASE 7: Integrar cambios de ubicación con Ubicaciones

### Objetivo

Permitir corregir la ubicación desde Stock y sincronizar el cambio con el flujo actual.

- [ ] Reutilizar el formato, normalización y validaciones del editor de ubicación existente.
- [ ] Permitir cambiar la ubicación desde la mini tarjeta.
- [ ] Permitir cambiar la ubicación mediante edición en línea en la tabla.
- [ ] Actualizar el historial del artículo usando `actualizarUbicacionArticulo`.
- [ ] Mantener intacta la ubicación original del Excel.
- [ ] Agregar la ubicación nueva a la tabla de trabajo de Ubicaciones.
- [ ] Actualizar inmediatamente la ubicación visible en Stock.
- [ ] Guardar la ubicación nueva como última ubicación asociada al conteo.
- [ ] Mostrar una notificación clara indicando que la ubicación fue enviada a Ubicaciones.
- [ ] Respetar las reglas actuales de duplicados de la tabla de Ubicaciones.
- [ ] Crear o reutilizar una operación compartida que coordine historial Excel y tabla de Ubicaciones.
- [ ] No marcar la ubicación como guardada en Stock hasta completar ambas persistencias.
- [ ] Si una de las dos escrituras falla, restaurar el estado anterior cuando sea posible y mostrar un error específico.
- [ ] Mantener el comportamiento actual de Consulta de ubicación: agregar el movimiento al inicio de Ubicaciones sin reemplazar filas anteriores.
- [ ] No reconstruir ni ocultar conflictos cuando la nueva fila produce un código duplicado en Ubicaciones.

## FASE 8: Integrar Stock con Etiquetas

### Objetivo

Enviar artículos de Stock al módulo de Etiquetas usando el contrato existente.

- [ ] Reutilizar el mecanismo actual de envío desde Ubicaciones hacia Etiquetas.
- [ ] Agregar envío individual desde cada fila.
- [ ] Permitir envío individual tanto para artículos pendientes como confirmados.
- [ ] Agregar una acción general para enviar todos los artículos válidos de Stock.
- [ ] Usar siempre cantidad de etiquetas `1`.
- [ ] Enviar código, descripción y última ubicación disponible.
- [ ] Mantener el contrato actual de Etiquetas: `id`, `codigo`, `descripcion`, `ubicacion`, `cantidad: 1` y `tamano: '10x15cm'`.
- [ ] Generar identificadores únicos también durante envíos masivos.
- [ ] Bloquear el envío individual de artículos inexistentes.
- [ ] Omitir artículos inexistentes en el envío masivo e informar la cantidad excluida.
- [ ] Mostrar notificaciones y animaciones consistentes con Ubicaciones.
- [ ] Evitar duplicar la lógica de construcción y persistencia de etiquetas.

## FASE 9: Agregar Información e informes

### Objetivo

Mostrar un resumen compacto del estado del conteo y abrirlo automáticamente cuando exista una alerta.

- [ ] Agregar una sección desplegable `Información`.
- [ ] Reutilizar `TarjetaSeccion.vue` y el diseño del informe de Ubicaciones.
- [ ] Mantener la sección cerrada por defecto.
- [ ] Mostrar artículos totales.
- [ ] Mostrar conteos confirmados.
- [ ] Mostrar artículos pendientes de confirmar.
- [ ] Mostrar artículos con diferencias respecto al stock Excel.
- [ ] Mostrar artículos cuya ubicación original sea `SL`.
- [ ] Mostrar artículos inexistentes.
- [ ] Mostrar el total de unidades del Excel.
- [ ] Mostrar el total de unidades contadas confirmadas.
- [ ] Mostrar la diferencia total de unidades.
- [ ] Calcular diferencias y totales de unidades únicamente sobre registros confirmados.
- [ ] Contar pendientes, artículos `SL` e inexistentes sobre todos los registros.
- [ ] Mostrar explícitamente la fórmula de diferencia como `Contado - Excel`.
- [ ] Abrir automáticamente la sección ante artículos pendientes, diferencias, ubicación `SL` o artículos inexistentes.
- [ ] Mantener textos breves y comprensibles para el usuario.

## FASE 10: Generar y enviar el Excel de Stock

### Objetivo

Exportar únicamente los conteos confirmados con el formato requerido.

- [ ] Crear un generador de Excel específico para Stock reutilizando la estructura de `ExportarUbicacionesExcel.js`.
- [ ] Usar `ExportarStockExcel.js` y reutilizar helpers existentes de plataforma, escritura y compartir cuando sea posible.
- [ ] Colocar en la columna A el código.
- [ ] Colocar en la columna B la descripción.
- [ ] Colocar en la columna C el stock original del Excel.
- [ ] Colocar en la columna D el stock contado por el usuario.
- [ ] Colocar en la columna E la última ubicación registrada por el usuario.
- [ ] Colocar en la columna F `✔️` o `❌`.
- [ ] Usar `❌` cuando el artículo sea inexistente o su ubicación original del Excel sea `SL`.
- [ ] Usar `✔️` en los demás casos.
- [ ] Excluir todos los registros pendientes de confirmar.
- [ ] Exportar la última ubicación aplicando el contrato de prioridad definido en este plan.
- [ ] Usar anchos explícitos: A `18`, B `65`, C `14`, D `14`, E `14` y F `7`.
- [ ] Guardar stock Excel y stock contado como celdas numéricas.
- [ ] Definir encabezados exactos: `Código`, `Descripción`, `Stock Excel`, `Stock contado`, `Última ubicación` e `Info`.
- [ ] Reutilizar el guardado con `Filesystem`, la descarga web y el menú nativo para compartir.
- [ ] Configurar el nombre `Stock [Nombre de usuario] AAAA-MM-DD # HH-MM.xlsx`.
- [ ] Mostrar el botón de enviar en móvil cuando existan registros confirmados.
- [ ] Mostrar en navegador un botón personalizado de descarga en lugar del botón nativo de enviar.
- [ ] Informar claramente cuando no existan registros confirmados para exportar.
- [ ] Bloquear la exportación si la fuente Excel activa no coincide con la sesión.
- [ ] Ordenar las filas exportadas igual que la tabla visible.

## FASE 11: Crear tutorial y documentación técnica

### Objetivo

Documentar el uso para el usuario y la arquitectura para futuras tareas de mantenimiento.

- [ ] Crear un tutorial de Stock dentro de Configuración.
- [ ] Explicar búsqueda, selección automática, conteo, pendientes, edición, Ubicaciones, Etiquetas, informes y Excel.
- [ ] Integrar el tutorial en la sección actual de tutoriales.
- [ ] Crear `Planes/Resumenes/Resumen7Stock.md`.
- [ ] Documentar componentes, persistencia, estructura de registros e integraciones.
- [ ] Documentar la sesión de conteo y su vínculo con el Excel de origen.
- [ ] Documentar el significado de pendiente y confirmado.
- [ ] Documentar cómo se calcula la última ubicación.
- [ ] Documentar las fórmulas de informes y la política de importación y reimportación.
- [ ] Documentar las reglas de `SL`, artículos inexistentes y columna Info del Excel.
- [ ] Documentar qué lógica fue reutilizada y dónde se encuentran los contratos compartidos.
- [ ] Actualizar el resumen general para incluir Stock como módulo principal.
- [ ] Revisar que toda la documentación quede en UTF-8 y español natural.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano el flujo completo de Stock.

- [ ] Verificar que Stock aparece entre Consulta de ubicación y Etiquetas en inicio y drawer.
- [ ] Entrar sin base Excel y comprobar que aparece el selector existente.
- [ ] Buscar por código y por nombre y comprobar la selección correcta.
- [ ] Confirmar que una única coincidencia se selecciona automáticamente.
- [ ] Comprobar el botón de copiar y el escaneo.
- [ ] Cerrar o cancelar la tarjeta y verificar que el buscador recupera el foco.
- [ ] Seleccionar un artículo nuevo y comprobar que inicia con el stock Excel.
- [ ] Probar stock Excel vacío, texto, decimal y negativo y verificar su normalización.
- [ ] Ingresar manualmente un decimal y comprobar que se rechaza sin perder el último valor válido.
- [ ] Ajustar el contador con `−` y `+` y verificar que nunca baja de `0`.
- [ ] Confirmar una cantidad igual al stock Excel y comprobar que queda confirmada.
- [ ] Buscar nuevamente el mismo artículo y comprobar el aviso, total y ubicación anteriores.
- [ ] Sumar unidades encontradas en otra ubicación y verificar que se reemplaza el total guardado.
- [ ] Importar artículos desde Ubicaciones y comprobar que quedan pendientes.
- [ ] Importar códigos repetidos y verificar que se conserva la aparición más reciente sin duplicar Stock.
- [ ] Reimportar y verificar que los confirmados se conservan y los pendientes se actualizan.
- [ ] Confirmar un artículo importado y comprobar que desaparece `Pendiente de confirmar` y aparece el check.
- [ ] Editar cantidad y ubicación en línea antes y después de confirmar.
- [ ] Cancelar una edición en línea y verificar que se restaura el valor persistido.
- [ ] Intentar editar dos filas a la vez y verificar que solo una permanece en edición.
- [ ] Cambiar una ubicación y verificar historial, tabla de Ubicaciones y vista de Stock.
- [ ] Enviar un artículo a Etiquetas y comprobar cantidad fija `1`.
- [ ] Enviar todos los registros válidos a Etiquetas y comprobar que pendientes y confirmados usan cantidad `1`.
- [ ] Intentar enviar un artículo inexistente y comprobar que se bloquea con un mensaje claro.
- [ ] Ejecutar envío masivo con inexistentes y comprobar que se omiten y se informa la cantidad excluida.
- [ ] Eliminar un registro y eliminar todos usando confirmaciones.
- [ ] Validar todas las métricas de Información.
- [ ] Verificar que los totales de unidades y diferencias excluyen registros pendientes.
- [ ] Provocar una diferencia, un artículo `SL`, un inexistente y un pendiente para comprobar la apertura automática del informe.
- [ ] Generar el Excel y verificar columnas A a F, datos, checks, cruces y anchos.
- [ ] Confirmar que el Excel excluye pendientes.
- [ ] Confirmar el nombre `Stock [Nombre de usuario] AAAA-MM-DD # HH-MM.xlsx`.
- [ ] Verificar tipos numéricos y anchos exactos de las seis columnas.
- [ ] Cargar un Excel distinto con una sesión activa y comprobar que se bloquean altas, importación y exportación.
- [ ] Confirmar que la sesión anterior no se elimina automáticamente.
- [ ] Iniciar una sesión nueva mediante confirmación y comprobar que queda vinculada al Excel nuevo.
- [ ] Descargar el Excel en navegador.
- [ ] Compartir el Excel desde Android.
- [ ] Recargar la app y verificar la persistencia de conteos y estados.
- [ ] Revisar tutorial y resumen técnico.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Revisar visualmente el flujo en resolución móvil y escritorio.
- [ ] Revisar consola y confirmar que no quedan errores ni advertencias nuevas durante los flujos principales.

## Progreso del plan

- [ ] Fase 1: Integrar Stock en la navegación
- [ ] Fase 2: Crear el almacenamiento independiente de Stock
- [ ] Fase 3: Construir la búsqueda y selección del artículo
- [ ] Fase 4: Diseñar la mini tarjeta y el contador
- [ ] Fase 5: Importar artículos desde Ubicaciones
- [ ] Fase 6: Crear la tabla de Stock y la edición en línea
- [ ] Fase 7: Integrar cambios de ubicación con Ubicaciones
- [ ] Fase 8: Integrar Stock con Etiquetas
- [ ] Fase 9: Agregar Información e informes
- [ ] Fase 10: Generar y enviar el Excel de Stock
- [ ] Fase 11: Crear tutorial y documentación técnica
- [ ] Fase Testing

Fecha de creación: 06 de Junio 2026
Fecha de última actualización: 06 de Junio 2026
Estado: BORRADOR
