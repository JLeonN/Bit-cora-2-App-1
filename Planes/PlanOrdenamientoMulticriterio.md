# PLAN DE ORDENAMIENTO MULTICRITERIO

## Descripción del plan

Ampliar el ordenamiento reutilizable de Etiquetas y Listados e incorporarlo en Stock. Los tres módulos permitirán ordenar por llegada, nombre, ubicación y valor cuantitativo, manteniendo como valor predeterminado la llegada descendente: el último elemento agregado aparece primero.

Cada módulo conservará la preferencia del usuario. Etiquetas y Stock usarán una preferencia global propia; Listados mantendrá el orden independiente de cada listado. El orden solo modificará la presentación, no la posición física de los datos persistidos, pero todas las exportaciones deberán recibir exactamente la colección visual: PDF en Etiquetas y Excel en Listados y Stock.

Stock conservará su prioridad funcional actual: los confirmados aparecen antes que los pendientes. El criterio elegido se aplicará por separado dentro de ambos grupos para no alterar ese flujo de trabajo.

Este plan amplía y reemplaza únicamente las reglas de criterios y exportación definidas en `Planes/PlanesTerminados/PlanOrdenamientoReutilizable.md`. En particular, el PDF de Etiquetas dejará de usar el orden persistido original y pasará a respetar el orden visual.

## Objetivo principal

- Incorporar ubicación y cantidad o stock al contrato compartido de ordenamiento.
- Mantener llegada descendente como valor inicial cuando no exista una preferencia válida.
- Recordar la última elección según el alcance propio de cada módulo.
- Integrar el selector en Etiquetas, Listados y Stock sin modificar Ubicaciones.
- Mantener confirmados antes que pendientes en Stock.
- Hacer que PDF y Excel respeten exactamente el orden visible del usuario.

## Decisiones funcionales cerradas

- Módulos incluidos: Etiquetas, Listados y Stock.
- El módulo Ubicaciones queda expresamente fuera.
- Criterios disponibles en los tres módulos: llegada, alfabético, ubicación y valor cuantitativo.
- El criterio cuantitativo se llama `Cantidad` en Etiquetas y `Stock` en Listados y Stock.
- El valor cuantitativo es `etiqueta.cantidad`, `articulo.stockListado` y `registro.stockContado`, respectivamente.
- El orden inicial es `{ criterio: 'fechaIngreso', direccion: 'descendente' }`.
- En Stock, confirmados y pendientes no se mezclan: primero se agrupa por estado y luego se aplica el criterio elegido dentro de cada grupo.
- Listados conserva una preferencia distinta dentro de cada listado.
- Etiquetas y Stock conservan una preferencia global del módulo.
- El PDF de Etiquetas y los Excel de Listados y Stock respetan el orden visual.
- La posición física de los arreglos persistidos no se modifica para representar un orden visual.

## Contexto técnico verificado

- `src/components/Logica/Compartidos/OrdenarColeccion.js` centraliza actualmente llegada y orden alfabético mediante `normalizarOrden()` y `ordenarColeccion()`.
- `src/components/Logica/Compartidos/SelectorOrdenamiento.vue` presenta actualmente dos criterios y emite objetos `{ criterio, direccion }`.
- `@tabler/icons-vue` incluye `IconInbox`, `IconSortAscending2`, `IconMapPin` e `IconScale`, que serán los iconos del selector.
- `src/components/Logica/Etiquetas/TablaEtiquetas.vue` conserva `indiceOriginal` y usa el índice como fecha virtual de llegada.
- Las etiquetas guardan `cantidad` y `ubicacion`; la preferencia global existente usa `preferencia_orden_etiquetas`.
- `src/pages/PaginaEtiquetas.vue` genera actualmente el PDF desde `listaEtiquetas`, no desde `etiquetasOrdenadas`.
- Listados guarda `orden` dentro de cada listado y cada artículo posee `fechaIngreso`, `descripcion`, `ubicacionListado` y `stockListado`.
- `src/pages/PaginaListados.vue` ya entrega `articulosOrdenados` al exportador y usa esa misma colección para la tabla y los avisos de duplicado.
- Stock posee `fechaIngreso`, `nombre`, `ubicacionActual`, `stockContado` y `confirmado`.
- `ordenarRegistrosStock()` coloca hoy los confirmados primero y, dentro de cada estado, los elementos más recientes primero.
- `src/pages/PaginaStock.vue` entrega `registrosVisuales` al exportador; `ExportarStockExcel.js` filtra confirmados sin volver a ordenarlos.
- `npm run lint` y `npm run build` son los controles automatizados disponibles.
- Los archivos de texto deben permanecer en UTF-8, los nombres nuevos deben respetar PascalCase y el CSS debe mantenerse compacto y sin líneas vacías entre reglas.

## Contrato compartido ampliado

El objeto de orden mantiene su forma actual:

```text
{
  criterio: 'fechaIngreso' | 'alfabetico' | 'ubicacion' | 'cantidad',
  direccion: 'ascendente' | 'descendente'
}
```

Direcciones naturales al cambiar de criterio:

| Criterio | Dirección inicial | Resultado |
| --- | --- | --- |
| `fechaIngreso` | `descendente` | Últimos agregados primero |
| `alfabetico` | `ascendente` | A/Z |
| `ubicacion` | `ascendente` | Ubicaciones menores primero |
| `cantidad` | `descendente` | Mayor cantidad o stock primero |

Al pulsar nuevamente el criterio activo se alternará su dirección. Al cambiar de criterio se aplicará siempre la dirección natural de la tabla anterior.

Reglas de comparación:

- Llegada compara valores numéricos de `fechaIngreso`.
- Etiquetas usa `indiceOriginal` como fecha virtual porque no persiste `fechaIngreso`.
- Alfabético usa español, ignora diferencias de mayúsculas y acentos y admite orden inverso.
- Ubicación usa comparación natural en español con `numeric: true`, de modo que `A-2-9` aparezca antes que `A-2-10`.
- Una ubicación vacía o equivalente a `Sin ubicación` aparece siempre al final, tanto ascendente como descendente.
- Cantidad convierte el valor a número antes de comparar.
- Valores cuantitativos vacíos o no numéricos aparecen siempre al final.
- Los empates se resuelven por código normalizado y luego por índice original para mantener estabilidad.

## Alcance

### Incluye

- Extensión de la utilidad compartida a cuatro criterios.
- Selector reutilizable con cuatro botones configurables.
- Persistencia compatible en Etiquetas, Listados y Stock.
- Ordenamiento por ubicación natural.
- Ordenamiento por cantidad en Etiquetas y por stock en Listados y Stock.
- Conservación de grupos confirmado/pendiente en Stock.
- PDF y Excel en el mismo orden de la pantalla.
- Limpieza de lógica anterior que quede reemplazada.
- Accesibilidad, teclado y adaptación a teléfonos angostos.

### No incluye

- Agregar el selector al módulo Ubicaciones.
- Cambiar los campos persistidos de los artículos solo para ordenar la vista.
- Reordenar físicamente las colecciones guardadas.
- Cambiar el significado de `cantidad`, `stockListado` o `stockContado`.
- Eliminar la prioridad de confirmados sobre pendientes en Stock.
- Agregar filtros, agrupaciones nuevas o arrastre manual.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Logica/Compartidos/OrdenarColeccion.js` | Modificar | `CRITERIOS_ORDEN`, `normalizarOrden`, `ordenarColeccion` | Admitir ubicación y cantidad con comparación estable |
| `src/components/Logica/Compartidos/SelectorOrdenamiento.vue` | Modificar | props, botones, etiquetas accesibles, estilos | Mostrar criterios configurables en una cuadrícula compacta |
| `src/components/BaseDeDatos/usoAlmacenamientoEtiquetas.js` | Modificar | preferencia de orden | Aceptar el contrato ampliado sin perder valores históricos |
| `src/components/Logica/Etiquetas/TablaEtiquetas.vue` | Modificar | `etiquetasOrdenadas`, `defineExpose` | Ordenar por cuatro criterios y exponer la colección visual al PDF |
| `src/pages/PaginaEtiquetas.vue` | Modificar | `generarPDF()` | Generar el PDF con las etiquetas en el orden visible |
| `src/components/BaseDeDatos/UsoAlmacenamientoListados.js` | Modificar | `normalizarListado()` | Conservar los nuevos criterios dentro de cada listado |
| `src/pages/PaginaListados.vue` | Modificar | `SelectorOrdenamiento`, `articulosOrdenados` | Incorporar ubicación y stock al orden visual y al Excel |
| `src/components/BaseDeDatos/UsoAlmacenamientoStock.js` | Modificar | claves, preferencia, `ordenarRegistrosStock` | Persistir el orden global y preservar el agrupamiento por estado |
| `src/pages/PaginaStock.vue` | Modificar | `ordenSeleccionado`, `registrosVisuales`, `exportarStock()` | Integrar el selector y ordenar cada grupo con la utilidad compartida |
| `src/components/Logica/Stock/ExportarStockExcel.js` | Verificar | `generarYGuardarExcelStock()` | Confirmar que filtra sin reordenar la colección visual |

## FASE 1: Ampliar la utilidad compartida

### Objetivo

Convertir `OrdenarColeccion.js` en la única fuente de verdad para los cuatro criterios.

### Archivos y símbolos involucrados

- `src/components/Logica/Compartidos/OrdenarColeccion.js`: `CRITERIOS_ORDEN`, `DIRECCIONES_ORDEN`, `normalizarOrden`, `ordenarColeccion`.

### Pasos de ejecución

- [ ] Agregar `ubicacion` y `cantidad` a `CRITERIOS_ORDEN` sin cambiar la forma del objeto persistido.
  - Mantener `fechaIngreso` descendente como recuperación completa ante criterio o dirección inválidos.
  - Retornar siempre un objeto nuevo desde `normalizarOrden()`.
- [ ] Ampliar `ordenarColeccion(elementos, orden, selectores)` con `obtenerUbicacion` y `obtenerCantidad`.
  - Exigir `obtenerClave` y el selector correspondiente al criterio activo.
  - Mantener compatibilidad con los consumidores actuales que solo usaban fecha y texto.
  - No mutar el arreglo ni sus elementos.
- [ ] Implementar comparación natural de ubicación.
  - Normalizar espacios y mayúsculas únicamente para comparar, sin modificar el dato original.
  - Usar `localeCompare('es', { sensitivity: 'base', numeric: true })`.
  - Detectar vacío y `Sin ubicación` como valores ausentes y colocarlos al final en ambas direcciones.
- [ ] Implementar comparación numérica de cantidad.
  - Aceptar números y textos numéricos válidos.
  - Colocar vacío, `null`, `undefined` y valores no numéricos al final en ambas direcciones.
  - Aplicar código e índice original como desempates estables.
- [ ] Probar aisladamente las cuatro combinaciones de cada criterio, empates, valores ausentes, ubicaciones con números e inmutabilidad.

## FASE 2: Generalizar el selector visual

### Objetivo

Mostrar únicamente los criterios habilitados por cada consumidor sin duplicar componentes.

### Archivos y símbolos involucrados

- `src/components/Logica/Compartidos/SelectorOrdenamiento.vue`: props, estado normalizado, selección y plantilla.

### Pasos de ejecución

- [ ] Agregar la prop `criteriosDisponibles` como arreglo de criterios admitidos.
  - Su valor por defecto conserva llegada y alfabético para compatibilidad defensiva.
  - Filtrar valores desconocidos y evitar emitir criterios no disponibles.
- [ ] Agregar la prop `etiquetaCantidad` con valor inicial `Cantidad`.
  - Etiquetas usa el valor predeterminado.
  - Listados y Stock envían `Stock`.
- [ ] Incorporar botones para Ubicación y Cantidad o Stock.
  - Usar `IconMapPin` para ubicación e `IconScale` para cantidad o stock.
  - Mantener `IconInbox` para llegada e `IconSortAscending2` para alfabético.
  - Cada botón es un único `<button>` y contiene sus dos flechas, sin botones anidados.
- [ ] Mantener texto alfabético dinámico `A/Z` y `Z/A`.
  - Usar `Ubicación` y la prop `etiquetaCantidad` como textos visibles de los otros criterios.
  - Las etiquetas accesibles deben anunciar ubicación menor/mayor y cantidad mayor/menor según el estado.
- [ ] Aplicar la dirección natural cuando cambia el criterio y alternarla al repetirlo.
  - Llegada y cantidad comienzan descendentes.
  - Alfabético y ubicación comienzan ascendentes.
- [ ] Adaptar la cuadrícula a cuatro controles.
  - Usar dos columnas en teléfonos para producir una cuadrícula 2x2 sin desbordamiento.
  - En anchos suficientes permitir cuatro columnas si cada objetivo conserva al menos 44 px de altura y texto legible.
  - Mantener foco visible, `aria-pressed`, `prefers-reduced-motion` y los tokens de `src/css/app.css`.
  - No dejar líneas vacías entre reglas CSS.

## FASE 3: Extender Etiquetas y su PDF

### Objetivo

Permitir los cuatro criterios, conservar la preferencia global y generar el PDF en el mismo orden visual.

### Archivos y símbolos involucrados

- `src/components/BaseDeDatos/usoAlmacenamientoEtiquetas.js`: `guardarPreferenciaOrdenEtiquetas`, `obtenerPreferenciaOrdenEtiquetas`.
- `src/components/Logica/Etiquetas/TablaEtiquetas.vue`: selector, `ordenSeleccionado`, `etiquetasOrdenadas`, `defineExpose`.
- `src/pages/PaginaEtiquetas.vue`: `tablaEtiquetasRef`, `generarPDF()`.

### Pasos de ejecución

- [ ] Mantener la clave `preferencia_orden_etiquetas` y aceptar los cuatro criterios al normalizar.
  - Conservar la migración de `recientes`, `antiguas` y `alfabetico`.
  - Recuperar llegada descendente ante ausencia o corrupción.
- [ ] Configurar `SelectorOrdenamiento` con llegada, alfabético, ubicación y cantidad.
  - Mantener `Cantidad` como etiqueta visible.
  - Persistir cada cambio mediante `guardarPreferenciaOrdenEtiquetas()`.
- [ ] Ampliar `etiquetasOrdenadas` con los selectores del módulo.
  - Llegada: `registro.indiceOriginal`.
  - Texto: `obtenerNombreArticulo(registro.etiqueta)`.
  - Ubicación: `registro.etiqueta.ubicacion`.
  - Cantidad: `registro.etiqueta.cantidad`.
  - Clave: `normalizarCodigo(registro.etiqueta.codigo)`.
  - Mantener `indiceOriginal` para editar, restablecer y eliminar el elemento persistido correcto.
- [ ] Exponer desde `TablaEtiquetas.vue` un método `obtenerEtiquetasOrdenadas()`.
  - Devolver un arreglo nuevo de etiquetas sin los envoltorios internos de `indiceOriginal`.
  - No permitir que el padre modifique mediante esa referencia el orden persistido.
- [ ] Cambiar `generarPDF()` para usar `tablaEtiquetasRef.value.obtenerEtiquetasOrdenadas()`.
  - Usar la misma colección tanto al guardar memorias como al llamar `generarDocumentoEtiquetas()`.
  - Mantener una recuperación segura a `listaEtiquetas.value` si la referencia aún no estuviera disponible.
  - No persistir el arreglo ordenado.

## FASE 4: Extender Listados y su Excel

### Objetivo

Agregar ubicación y stock manteniendo una preferencia independiente por listado y una única colección para pantalla y Excel.

### Archivos y símbolos involucrados

- `src/components/BaseDeDatos/UsoAlmacenamientoListados.js`: `normalizarListado()`.
- `src/pages/PaginaListados.vue`: selector, `articulosOrdenados`, `actualizarOrden()`, `exportarListado()`.

### Pasos de ejecución

- [ ] Permitir que `normalizarListado()` conserve `ubicacion` y `cantidad` mediante `normalizarOrden()`.
  - No cambiar la forma de `orden` ni crear una preferencia global paralela.
  - No incrementar la versión de almacenamiento si no cambia la estructura persistida.
- [ ] Configurar el selector con los cuatro criterios y `etiqueta-cantidad="Stock"`.
  - Guardar automáticamente el listado activo después de cada cambio.
  - Al duplicar un listado, conservar su orden como sucede con el resto de sus propiedades.
- [ ] Ampliar `articulosOrdenados` con los selectores del módulo.
  - Llegada: `articulo.fechaIngreso`.
  - Texto: `articulo.descripcion`.
  - Ubicación: `articulo.ubicacionListado`.
  - Cantidad: `articulo.stockListado`.
  - Clave: `articulo.codigo`.
- [ ] Mantener `articulosOrdenados` como fuente de la tabla, numeración, posición de duplicados, envíos y Excel.
  - `generarYGuardarExcelListado()` debe seguir recibiendo la colección ya ordenada.
  - El exportador no debe aplicar un orden adicional.
  - Editar stock o ubicación no debe perder el foco ni modificar otro artículo después de reordenar.

## FASE 5: Integrar Stock conservando sus grupos

### Objetivo

Agregar el selector a Stock sin perder la prioridad de confirmados ni la persistencia de sesión existente.

### Archivos y símbolos involucrados

- `src/components/BaseDeDatos/UsoAlmacenamientoStock.js`: nuevas funciones de preferencia y `ordenarRegistrosStock`.
- `src/pages/PaginaStock.vue`: `ordenSeleccionado`, carga inicial, `registrosVisuales`, selector y exportación.
- `src/components/Logica/Stock/ExportarStockExcel.js`: `generarYGuardarExcelStock()`.

### Pasos de ejecución

- [ ] Crear en `UsoAlmacenamientoStock.js` la clave `preferencia_orden_stock`.
  - Exportar `guardarPreferenciaOrdenStock(orden)` y `obtenerPreferenciaOrdenStock()`.
  - Serializar el objeto normalizado con los cuatro criterios.
  - Usar llegada descendente cuando no haya preferencia o esté corrupta.
  - No eliminar la preferencia al ejecutar `eliminarSesionStock()` o iniciar una sesión nueva.
- [ ] Mantener `ordenarRegistrosStock()` como orden canónico de almacenamiento por estado y llegada.
  - No usar la preferencia visual para reordenar físicamente `sesion.registros`.
  - Conservar confirmado antes que pendiente y llegada descendente dentro de cada estado en la persistencia.
- [ ] Agregar `ordenSeleccionado` en `PaginaStock.vue` e inicializarlo desde la preferencia global.
  - Persistir cada cambio del selector sin modificar la sesión.
  - Configurar los cuatro criterios y `etiqueta-cantidad="Stock"`.
  - Mostrar el selector cuando existan registros visuales, inmediatamente antes de la tabla.
- [ ] Separar la preparación de datos de su orden visual.
  - Mantener el enriquecimiento actual de nombre, stock y ubicación.
  - Separar confirmados y pendientes.
  - Ordenar cada grupo con `ordenarColeccion()` y concatenar confirmados antes que pendientes.
  - Llegada: `registro.fechaIngreso`.
  - Texto: `registro.nombre`.
  - Ubicación: `registro.ubicacionActual`.
  - Cantidad: `registro.stockContado`.
  - Clave: `registro.codigo`.
- [ ] Mantener `registrosVisuales` como fuente de tabla, informes, envíos y Excel.
  - `generarYGuardarExcelStock()` continúa filtrando confirmados sin volver a ordenar.
  - El Excel conserva el orden relativo visible de los confirmados.
  - Confirmar o editar un registro puede moverlo dentro de la vista según la preferencia, pero debe conservar su identidad por código.

## FASE 6: Responsive, accesibilidad y limpieza

### Objetivo

Garantizar una experiencia coherente en los tres módulos y retirar lógica redundante.

### Pasos de ejecución

- [ ] Verificar la cuadrícula de cuatro botones en anchos cercanos a 320, 360, 480 y 640 px, tableta y escritorio.
  - Evitar desbordamiento y truncamientos que oculten el significado del criterio.
  - Mantener las flechas activas visibles y objetivos táctiles de al menos 44 px.
- [ ] Verificar teclado y lectores de pantalla.
  - Tab recorre cada criterio una sola vez.
  - Enter y Espacio seleccionan o alternan el criterio.
  - El foco permanece en el botón utilizado aunque la colección cambie.
  - Cada combinación anuncia criterio y dirección sin depender del color.
- [ ] Eliminar imports, funciones y estilos que queden sin consumidores.
- [ ] Revisar UTF-8 y corregir cualquier texto dañado antes de cerrar la ejecución.

## FASE TESTING

### Objetivo

Comprobar el contrato compartido, la persistencia por módulo, la prioridad de Stock y la igualdad entre pantalla y exportaciones.

### Pruebas automatizadas

- [ ] Ejecutar pruebas directas de `OrdenarColeccion.js`.
  - Probar llegada, alfabético, ubicación y cantidad en ambas direcciones.
  - Probar ubicación natural con `A-2-9`, `A-2-10`, vacíos y `Sin ubicación`.
  - Probar cantidades numéricas, textos numéricos, vacíos e inválidos.
  - Confirmar desempates estables e inmutabilidad.
- [ ] Ejecutar `npm run lint` y corregir todos los errores.
- [ ] Ejecutar `npm run build` y comprobar que los tres módulos y sus exportadores compilen.

### Pruebas manuales de Etiquetas

- [ ] Verificar los ocho órdenes posibles de los cuatro criterios.
- [ ] Cerrar y reabrir la app y confirmar que conserva la preferencia.
- [ ] Editar y eliminar bajo cada criterio y comprobar que actúa sobre la etiqueta correcta.
- [ ] Generar el PDF bajo cada criterio y comprobar que coincide exactamente con la pantalla.
- [ ] Confirmar que cambiar el orden visual no reordena `historial_etiquetas`.

### Pruebas manuales de Listados

- [ ] Verificar los ocho órdenes posibles y la persistencia independiente entre dos listados.
- [ ] Duplicar un listado y confirmar que la copia conserva el criterio y dirección.
- [ ] Editar ubicación y stock bajo sus respectivos órdenes y comprobar el reposicionamiento correcto.
- [ ] Verificar que numeración y posición de duplicados coincidan con la colección visible.
- [ ] Exportar Excel bajo cada criterio y comparar el orden de las filas con la pantalla.

### Pruebas manuales de Stock

- [ ] Verificar los ocho órdenes posibles sin mezclar confirmados y pendientes.
- [ ] Confirmar que llegada descendente muestra primero el último ingreso dentro de cada grupo.
- [ ] Cambiar de criterio, cerrar y reabrir la app y comprobar la preferencia.
- [ ] Iniciar una sesión nueva y confirmar que la preferencia global permanece.
- [ ] Confirmar un pendiente y verificar que pasa al grupo superior y se ubica según el criterio activo.
- [ ] Exportar Excel bajo cada criterio y comprobar que los confirmados mantienen el mismo orden relativo que en pantalla.

### Casos responsivos y accesibles

- [ ] Operar los cuatro criterios por teclado en Etiquetas, Listados y Stock.
- [ ] Revisar foco, contraste, dirección activa y movimiento reducido.
- [ ] Validar teléfonos angostos, tableta y escritorio sin desbordamientos.

## Progreso del plan

- [ ] Fase 1: Ampliar la utilidad compartida
- [ ] Fase 2: Generalizar el selector visual
- [ ] Fase 3: Extender Etiquetas y su PDF
- [ ] Fase 4: Extender Listados y su Excel
- [ ] Fase 5: Integrar Stock conservando sus grupos
- [ ] Fase 6: Responsive, accesibilidad y limpieza
- [ ] Fase Testing

Fecha de creación: 9 de Septiembre 2026
Fecha de última actualización: 9 de Septiembre 2026
Estado: BORRADOR
