# PLAN HISTORIAL DE UBICACIONES EXCEL

## Descripcion del plan

Agregar historial de ubicaciones para los articulos cargados desde Excel sin sobrescribir la ubicacion antigua original. La ubicacion antigua debe seguir saliendo desde la columna C del Excel importado, mientras que cada nueva ubicacion se guarda como historial interno y se muestra en Consulta De Ubicacion y Ubicaciones. Al exportar, la ubicacion antigua debe quedar en la columna G y el historial debe salir desde la columna J en adelante.

## Objetivo principal

- Mantener intacta la ubicacion antigua original del Excel cargado.
- Guardar cada cambio de ubicacion en un array `historialUbicaciones`.
- Mostrar visualmente el historial con la ubicacion mas nueva arriba.
- Exportar la ubicacion antigua original y el historial en columnas separadas.

## Reglas del plan

- No sobrescribir `ubicacionAntigua` cuando el usuario guarda una nueva ubicacion.
- Usar `historialUbicaciones` como fuente del historial, no campos sueltos por letra de columna.
- En la base interna, el historial representa conceptualmente las columnas L, M, N y sucesivas.
- En el Excel exportado, el historial se escribe desde J, K, L y sucesivas.
- La columna H `Info` del Excel exportado queda fija y no se mueve.
- La columna I del Excel exportado queda libre y no se usa.
- Si un codigo aparece mas de una vez en Ubicaciones, siempre se considera error, aunque tenga ubicaciones distintas.
- Mientras exista un codigo duplicado en Ubicaciones, no se debe reconstruir historial ni exportar el Excel.
- Si una ubicacion se elimina desde Ubicaciones, tambien debe desaparecer del historial interno.
- Aplicar el mismo comportamiento para cambios hechos desde Consulta De Ubicacion y desde Ubicaciones.
- Guardar `historialUbicaciones` en orden cronologico de viejo a nuevo; mostrarlo visualmente invertido para que la ubicacion mas nueva quede arriba.
- El efecto neon aplica solo cuando `ubicacionAntigua` original de la columna C del Excel importado sea exactamente `SL`.
- El boton de descarga directa de Excel aplica solo en navegador; en telefono se mantiene el flujo nativo de compartir.

## FASE 1: Ajustar modelo de datos Excel

### Objetivo

Preparar la estructura interna para conservar ubicacion original e historial de cambios.

- [ ] Revisar `src/components/BaseDeDatos/LectorExcel.js` y ubicar donde se crean y migran los articulos.
- [ ] Agregar `historialUbicaciones: []` a cada articulo procesado desde el Excel.
- [ ] Mantener `ubicacionAntigua` como valor original de la columna C.
- [ ] Migrar bases persistidas viejas agregando `historialUbicaciones` cuando no exista.
- [ ] Verificar que `articulosBaseOriginal` tambien conserve `historialUbicaciones` vacio o compatible.
- [ ] Asegurar que `historialUbicaciones` se guarde en orden cronologico de viejo a nuevo.

## FASE 2: Cambiar actualizacion de ubicaciones

### Objetivo

Evitar que las nuevas ubicaciones sobrescriban la ubicacion antigua original.

- [ ] Cambiar `actualizarUbicacionArticulo` para agregar la nueva ubicacion a `historialUbicaciones`.
- [ ] Evitar duplicar la misma ubicacion consecutiva para el mismo articulo.
- [ ] Mantener `ubicacionAntigua` sin cambios al guardar desde Consulta De Ubicacion.
- [ ] Actualizar tambien `historialUbicaciones` en el objeto local `articuloConsultado` despues de guardar desde Consulta De Ubicacion.
- [ ] Ajustar `reconstruirUbicacionesDesdeLista` para reconstruir el historial desde la lista actual de Ubicaciones.
- [ ] Detectar codigos duplicados en la lista de Ubicaciones antes de reconstruir historial.
- [ ] Si existe un codigo duplicado, cancelar la reconstruccion y devolver un error claro.
- [ ] Confirmar que al borrar una ubicacion pendiente se elimina solo esa entrada y luego se reconstruye el historial valido restante.

## FASE 3: Mostrar historial en Consulta De Ubicacion

### Objetivo

Reemplazar la vista de ubicacion actual por una vista de historial clara.

- [ ] Cambiar el texto visual `Ubicacion actual` por `Historial de ubicaciones`.
- [ ] Mostrar primero la ubicacion mas nueva del historial.
- [ ] Mostrar debajo la ubicacion antigua original tomada de `ubicacionAntigua`.
- [ ] Si no hay historial, mostrar solo la ubicacion antigua original.
- [ ] Al guardar una nueva ubicacion, actualizar inmediatamente la tarjeta visual.
- [ ] Actualizar el historial local de `articuloConsultado` despues de guardar para no depender de recargar la pantalla.
- [ ] Mantener el flujo que agrega la ubicacion a la lista de Ubicaciones para enviar.

## FASE 4: Mostrar historial en Ubicaciones

### Objetivo

Hacer que la mini tarjeta del articulo refleje el historial disponible.

- [ ] Revisar `FormularioUbicacion.vue`, `TablaUbicaciones.vue` y `CodigoMasNombre.vue`.
- [ ] Mostrar historial en la mini tarjeta del articulo seleccionado en Ubicaciones.
- [ ] Mostrar la ubicacion mas nueva arriba y la ubicacion antigua original debajo.
- [ ] Asegurar que los cambios agregados manualmente desde Ubicaciones tambien actualicen el historial.
- [ ] Si el codigo ingresado ya existe en Ubicaciones, avisar que es duplicado y no actualizar el historial hasta que el usuario resuelva la lista.
- [ ] Mantener las validaciones de articulos inexistentes y codigos repetidos.

## FASE 5: Ajustar exportacion Excel

### Objetivo

Exportar ubicacion antigua original e historial en columnas separadas.

- [ ] Revisar `src/components/Logica/Ubicaciones/ExportarUbicacionesExcel.js`.
- [ ] Mantener columna G como `Ubic Antigua` usando siempre `ubicacionAntigua`.
- [ ] Agregar encabezados `Historial 1`, `Historial 2`, `Historial 3` desde la columna J.
- [ ] Escribir el historial desde J, K, L y sucesivas.
- [ ] No usar la columna I.
- [ ] Ajustar el rango de la hoja para incluir todas las columnas de historial necesarias.
- [ ] Ajustar anchos de columnas para que las columnas nuevas sean legibles.
- [ ] Mantener la columna H `Info` en su posicion actual sin moverla.
- [ ] Bloquear la exportacion si existe cualquier codigo duplicado en Ubicaciones.

## FASE 6: Agregar efecto neon para ubicaciones SL

### Objetivo

Resaltar visualmente los articulos cuya ubicacion antigua original sea `SL`, tanto en Consulta De Ubicacion como en Ubicaciones.

- [ ] Revisar `src/css/Variables.css` y agregar variables CSS para el brillo neon sin inventar colores fuera del sistema.
- [ ] Definir variables para borde neon, sombra neon y texto neon aplicables a ubicaciones `SL`.
- [ ] Aplicar el efecto de borde brillante a la tarjeta de historial o tarjeta de articulo cuando la ubicacion antigua original sea `SL`.
- [ ] Aplicar el efecto neon al texto `SL` cuando aparezca como ubicacion antigua original.
- [ ] Agregar el mismo tratamiento visual en la mini tarjeta del articulo seleccionado en Ubicaciones.
- [ ] Asegurar que el efecto solo se active cuando `ubicacionAntigua` original de la columna C del Excel importado sea exactamente `SL`.
- [ ] Derivar los colores neon desde variables existentes como `var(--color-primario)` o `var(--color-exito)`, sin hardcodear hexadecimales.
- [ ] Verificar que el brillo no dificulte la lectura en modo oscuro ni rompa el diseno responsive.

## FASE 7: Agregar descarga web del Excel de Ubicaciones

### Objetivo

Permitir descargar directamente el Excel de Ubicaciones cuando la app se usa desde navegador, manteniendo en telefono el menu nativo de compartir actual.

- [ ] Revisar como la barra inferior recibe `configuracionBarra` desde `AjustarUbicaciones.vue`.
- [ ] Identificar el helper o patron existente para detectar navegador frente a entorno movil con Capacitor.
- [ ] Agregar un boton personalizado de descarga solo cuando la app corre en navegador.
- [ ] Mantener el orden visual de la barra en navegador: atras, inicio, enviar, descargar.
- [ ] No mostrar el boton de descarga en Android/iOS.
- [ ] Reutilizar la generacion actual de Excel de Ubicaciones para no duplicar logica de armado.
- [ ] Implementar la descarga directa del archivo generado en navegador.
- [ ] Mantener el boton de enviar con el comportamiento actual de compartir nativo en telefono.
- [ ] Bloquear tambien la descarga web si existen codigos duplicados en Ubicaciones.

## FASE TESTING

### Objetivo

Validar que el historial sea consistente para usuario, persistencia y exportacion.

- [ ] Cargar un Excel con un articulo que tenga ubicacion antigua `SL`.
- [ ] Desde Consulta De Ubicacion, guardar una nueva ubicacion `4B5`.
- [ ] Verificar que `ubicacionAntigua` sigue siendo `SL`.
- [ ] Verificar que `historialUbicaciones` contiene `4B5`.
- [ ] Verificar que Consulta De Ubicacion muestra `4B5` arriba y `SL` debajo.
- [ ] Volver a editar el mismo articulo con otra ubicacion y verificar que el historial muestra la mas nueva arriba.
- [ ] Agregar una ubicacion desde Ubicaciones y verificar que tambien se suma al historial.
- [ ] Eliminar una ubicacion desde Ubicaciones y verificar que desaparece del historial.
- [ ] Crear dos ubicaciones con el mismo codigo y verificar que se marca como error de duplicado.
- [ ] Verificar que con codigos duplicados no se reconstruye historial ni se permite exportar.
- [ ] Eliminar uno de los codigos duplicados y verificar que la entrada restante vuelve a ser valida.
- [ ] Exportar el Excel y verificar que G contiene la ubicacion antigua original.
- [ ] Verificar que J, K, L y sucesivas contienen `Historial 1`, `Historial 2`, `Historial 3` segun corresponda.
- [ ] Verificar que la columna H `Info` sigue en la misma posicion.
- [ ] Verificar que la columna I queda libre.
- [ ] Verificar que las tarjetas con ubicacion antigua original `SL` muestran borde neon.
- [ ] Verificar que el texto `SL` muestra efecto neon.
- [ ] Abrir Ubicaciones en navegador y verificar que aparece el cuarto boton de descarga.
- [ ] Verificar que el orden de botones en navegador es atras, inicio, enviar, descargar.
- [ ] Descargar el Excel desde navegador y confirmar que el archivo se genera correctamente.
- [ ] Verificar que en telefono no aparece el boton de descarga y sigue funcionando el compartir nativo.
- [ ] Recargar la app y verificar que la base persistida conserva historial y ubicacion antigua original.
- [ ] Ejecutar lint o el comando de validacion disponible del proyecto.

## Progreso del plan

- [ ] Fase 1: Ajustar modelo de datos Excel
- [ ] Fase 2: Cambiar actualizacion de ubicaciones
- [ ] Fase 3: Mostrar historial en Consulta De Ubicacion
- [ ] Fase 4: Mostrar historial en Ubicaciones
- [ ] Fase 5: Ajustar exportacion Excel
- [ ] Fase 6: Agregar efecto neon para ubicaciones SL
- [ ] Fase 7: Agregar descarga web del Excel de Ubicaciones
- [ ] Fase Testing

Fecha de creacion: 25 de Mayo 2026
Fecha de ultima actualizacion: 25 de Mayo 2026
Estado: BORRADOR
