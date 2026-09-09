# PLAN DE ORDENAMIENTO REUTILIZABLE

## Descripción del plan

Reemplazar el bloque desplegable “Ordenar etiquetas” por un control compacto, siempre visible y reutilizable. El control presentará dos superficies principales —fecha de ingreso y orden alfabético— y mostrará dentro de cada una las direcciones ascendente y descendente. La flecha activa se iluminará para comunicar el orden actual sin necesitar título, descripción ni acordeón.

El mismo componente se integrará en Etiquetas y Listados. Etiquetas conservará su regla actual: el orden solo modifica la presentación visual y no el PDF. Listados mantendrá su regla propia: la pantalla y el Excel usan exactamente la misma colección ordenada.

Este plan presupone que `Planes/PlanModuloListados.md` ya fue ejecutado y que Listados persiste `orden` como `{ criterio, direccion }`.

## Objetivo principal

- Crear un control de orden pequeño y comprensible para fecha y texto.
- Permitir fecha reciente/antigua y alfabético A–Z/Z–A.
- Reutilizar el mismo contrato, componente y función pura en Etiquetas y Listados.
- Migrar la preferencia histórica de Etiquetas sin perder la elección existente.
- Mantener la diferencia intencional entre el PDF de Etiquetas y el Excel de Listados.

## Contexto técnico verificado

- `src/components/Logica/Etiquetas/TablaEtiquetas.vue` contiene actualmente un `TarjetaSeccion` titulado “Ordenar etiquetas”, una explicación y tres pastillas: `recientes`, `antiguas` y `alfabetico`.
- `etiquetasOrdenadas` invierte el arreglo para recientes, conserva el orden interno para antiguas y usa `localeCompare()` para A–Z.
- `src/components/BaseDeDatos/usoAlmacenamientoEtiquetas.js` persiste la preferencia como texto bajo `preferencia_orden_etiquetas`.
- El PDF se genera desde el arreglo guardado en `PaginaEtiquetas.vue`, no desde `etiquetasOrdenadas`; este comportamiento debe conservarse.
- El plan de Listados define desde el inicio `orden: { criterio: 'fechaIngreso' | 'alfabetico', direccion: 'ascendente' | 'descendente' }` y exporta su colección visual.
- `@tabler/icons-vue` ya es la librería de iconos del proyecto.
- Los colores deben provenir exclusivamente de `src/css/app.css`.
- No hay pruebas automatizadas reales; `npm run lint` y `npm run build` son los controles ejecutables principales.

## Alcance

### Incluye

- Componente compartido de ordenamiento siempre visible.
- Función pura compartida para ordenar colecciones sin mutarlas.
- Fecha descendente/ascendente y texto ascendente/descendente.
- Migración compatible de la preferencia de Etiquetas.
- Integración en Etiquetas y Listados.
- Persistencia de la última elección.
- Interacción por teclado, lectores de pantalla y diseño responsive.

### No incluye

- Cambiar el orden de impresión del PDF de Etiquetas.
- Agregar filtros, búsquedas o agrupaciones.
- Permitir arrastrar elementos para un orden manual.
- Modificar los datos persistidos solo para reflejar un orden visual.
- Rediseñar otras secciones desplegables de Etiquetas.
- Implementar Listados si su plan previo aún no fue ejecutado.

## Contrato compartido

Usar este objeto en ambos consumidores:

```text
{
  criterio: 'fechaIngreso' | 'alfabetico',
  direccion: 'ascendente' | 'descendente'
}
```

Reglas de interacción:

- Estado inicial recomendado: `{ criterio: 'fechaIngreso', direccion: 'descendente' }`.
- Al pulsar Fecha cuando otro criterio está activo, activar Fecha con dirección descendente.
- Al volver a pulsar Fecha mientras está activa, alternar descendente/ascendente.
- Al pulsar Alfabético cuando otro criterio está activo, activar Alfabético con dirección ascendente.
- Al volver a pulsar Alfabético mientras está activo, alternar ascendente/descendente.
- Mostrar ambas flechas dentro de cada superficie; iluminar únicamente la correspondiente al estado activo.
- No anidar elementos `<button>`: cada criterio debe ser un único botón accesible que cambia su dirección al repetirse.

Correspondencias visibles:

| Criterio | Dirección | Resultado |
| --- | --- | --- |
| `fechaIngreso` | `descendente` | Más recientes primero |
| `fechaIngreso` | `ascendente` | Más antiguas primero |
| `alfabetico` | `ascendente` | A–Z |
| `alfabetico` | `descendente` | Z–A |

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Logica/Compartidos/SelectorOrdenamiento.vue` | Crear | props, `update:modelValue`, alternancia | Control compacto reutilizable |
| `src/components/Logica/Compartidos/OrdenarColeccion.js` | Crear | `ordenarColeccion` | Orden puro por fecha o texto |
| `src/components/Logica/Etiquetas/TablaEtiquetas.vue` | Modificar | bloque de orden y `etiquetasOrdenadas` | Retirar acordeón e integrar control compartido |
| `src/components/BaseDeDatos/usoAlmacenamientoEtiquetas.js` | Modificar | guardar/obtener preferencia | Persistir objeto y migrar valores históricos |
| `src/pages/PaginaListados.vue` | Modificar | estado `orden` | Integrar el selector compacto |
| `src/components/Logica/Listados/OrdenarArticulosListado.js` | Modificar o eliminar | `ordenarArticulosListado` | Delegar en la utilidad compartida sin duplicar lógica |

## FASE 1: Utilidad y contrato compartidos

### Objetivo

Centralizar la semántica de orden sin acoplarla a Etiquetas, Listados ni a una estructura concreta de datos.

### Archivos y símbolos involucrados

- Nuevo `src/components/Logica/Compartidos/OrdenarColeccion.js`: `normalizarOrden`, `ordenarColeccion`.
- Existente `src/components/Logica/Listados/OrdenarArticulosListado.js` después del primer plan.

### Pasos de ejecución

- [ ] Crear constantes o validadores para criterios y direcciones admitidos.
  - Ante valores inválidos, usar fecha descendente.
  - Mantener nombres camelCase en español y constantes en mayúsculas con guiones bajos.
- [ ] Implementar `ordenarColeccion(elementos, orden, selectores)`.
  - `selectores.obtenerFecha(elemento, indice)` proporciona el número de orden temporal.
  - `selectores.obtenerTexto(elemento, indice)` proporciona el texto alfabético.
  - Clonar antes de ordenar para no mutar props ni persistencia.
  - Usar comparación española sin distinguir acentos o mayúsculas como criterio principal.
  - Aplicar desempate estable con el índice original y, cuando el consumidor lo proporcione, código.
  - Soportar las cuatro combinaciones del contrato.
- [ ] Modificar `OrdenarArticulosListado.js` para delegar en `ordenarColeccion()` o eliminarlo actualizando todos sus imports.
  - Elegir una sola fuente de verdad.
  - Mantener el resultado de Listados idéntico antes de cambiar su interfaz.

## FASE 2: Control compacto accesible

### Objetivo

Crear el selector visual con dos botones, dos direcciones por criterio y una señal luminosa inequívoca.

### Archivos y símbolos involucrados

- Nuevo `src/components/Logica/Compartidos/SelectorOrdenamiento.vue`.
- `src/css/app.css` únicamente como fuente de tokens; preferir estilos scoped en el componente.

### Pasos de ejecución

- [ ] Crear `SelectorOrdenamiento.vue` con `v-model`.
  - Prop `modelValue`: objeto de orden requerido y normalizado defensivamente.
  - Prop opcional `deshabilitado`: booleano con valor inicial `false`.
  - Emit `update:modelValue` con un objeto nuevo.
  - No incorporar conocimiento sobre etiquetas, listados, PDF o Excel.
- [ ] Construir dos botones visibles: Fecha y Alfabético.
  - Fecha puede usar un icono temporal de `@tabler/icons-vue` y Alfabético una referencia A/Z.
  - Cada botón contiene indicadores ascendente y descendente.
  - La flecha correspondiente se ilumina únicamente cuando su criterio y dirección están activos.
  - Al cambiar de criterio se usa su dirección natural; al repetirlo se alterna.
  - Añadir `aria-pressed`, título y etiqueta dinámica, por ejemplo `Ordenar por fecha: recientes primero`.
- [ ] Evitar el acordeón, encabezado “Ordenar etiquetas” y texto descriptivo.
  - El selector debe aparecer directamente encima de la colección cuando haya elementos.
  - Usar texto mínimo visible —Fecha y A/Z— más iconos, sin depender solo del color.
- [ ] Aplicar estilos scoped y compactos.
  - Usar `--color-fondo`, `--color-superficie`, `--color-borde`, `--color-texto-*`, `--color-primario`, `--color-acento` y sombras existentes.
  - Representar el estado activo mediante color, borde o resplandor moderado.
  - Respetar `prefers-reduced-motion`.
  - Mantener objetivos táctiles suficientes y foco visible.

## FASE 3: Migración de Etiquetas

### Objetivo

Adoptar el control compartido sin perder preferencias, edición de filas ni el orden original del PDF.

### Archivos y símbolos involucrados

- `src/components/BaseDeDatos/usoAlmacenamientoEtiquetas.js`: `guardarPreferenciaOrdenEtiquetas`, `obtenerPreferenciaOrdenEtiquetas`.
- `src/components/Logica/Etiquetas/TablaEtiquetas.vue`: `ordenSeleccionado`, `seleccionarOrden`, `etiquetasOrdenadas` y bloque de plantilla.
- `src/pages/PaginaEtiquetas.vue` y `GeneradorEtiquetasPDF.js` como consumidores que deben permanecer funcionalmente intactos.

### Pasos de ejecución

- [ ] Actualizar la persistencia para guardar el objeto `{ criterio, direccion }` serializado.
  - Mantener la clave existente para no crear preferencias divergentes.
  - Leer tanto JSON nuevo como los textos históricos.
  - Migrar `recientes` a fecha descendente.
  - Migrar `antiguas` a fecha ascendente.
  - Migrar `alfabetico` a alfabético ascendente.
  - Si el dato está corrupto, retornar fecha descendente sin lanzar errores a la UI.
- [ ] Sustituir en `TablaEtiquetas.vue` el `TarjetaSeccion` completo de orden por `SelectorOrdenamiento`.
  - Eliminar título, descripción, explicación, pastillas y CSS que ya no tenga consumidores.
  - Cambiar `ordenSeleccionado` de texto a objeto.
  - Persistir cada cambio emitido por el selector.
- [ ] Rehacer `etiquetasOrdenadas` mediante `ordenarColeccion()`.
  - Para fecha usar el índice original porque la colección actual no guarda fecha por etiqueta: índice mayor equivale a incorporación más reciente.
  - Para texto usar `obtenerNombreArticulo(etiqueta)`.
  - Conservar `indiceOriginal` para que editar, confirmar, restablecer y eliminar sigan afectando el elemento persistido correcto.
- [ ] Verificar explícitamente que `PaginaEtiquetas.vue` continúe enviando el arreglo guardado original a `generarDocumentoEtiquetas()`.
  - No exponer `etiquetasOrdenadas` al generador.
  - El nuevo orden debe ser solamente visual para Etiquetas.

## FASE 4: Integración con Listados

### Objetivo

Reemplazar el selector temporal de Listados y mantener pantalla, persistencia y Excel bajo el mismo orden.

### Archivos y símbolos involucrados

- `src/pages/PaginaListados.vue`.
- `src/components/Logica/Listados/OrdenarArticulosListado.js` o sus consumidores después de consolidar la utilidad.
- `src/components/Logica/Listados/ExportarListadosExcel.js` como consumidor indirecto del arreglo visual.

### Pasos de ejecución

- [ ] Sustituir las tres opciones temporales por `SelectorOrdenamiento v-model="listadoActivo.orden"`.
- [ ] Guardar automáticamente el listado al cambiar criterio o dirección.
- [ ] Exponer las cuatro combinaciones, incluida descripción Z–A.
- [ ] Mantener `articulosOrdenados` como única colección de presentación.
  - La posición mostrada en avisos de duplicado debe provenir de esta colección.
  - La tabla/tarjetas deben recibir esta colección.
  - El exportador debe recibir esta misma colección ya ordenada y no reordenarla.
- [ ] Comprobar que duplicar, cerrar y volver a abrir un listado conserve exactamente su selección.

## FASE 5: Responsive, accesibilidad y limpieza

### Objetivo

Garantizar que el control sea claro en todos los consumidores y retirar código legado sin afectar otras secciones.

### Pasos de ejecución

- [ ] Ajustar el componente compartido a teléfonos angostos, tabletas y escritorio.
  - Evitar desbordamiento horizontal.
  - Mantener ambos criterios visibles en una fila cuando exista espacio y permitir una distribución compacta en anchos mínimos.
  - No reducir objetivos táctiles ni ocultar la dirección activa.
- [ ] Validar navegación completa por teclado.
  - Tab enfoca cada criterio.
  - Enter y Espacio ejecutan la misma alternancia que un toque.
  - El foco no salta al reordenar la colección.
- [ ] Validar lectores de pantalla mediante etiquetas dinámicas completas.
- [ ] Eliminar imports, funciones y estilos sin uso del acordeón y las pastillas antiguas.
- [ ] Mantener CSS sin líneas vacías entre reglas y utilizar solo los tokens existentes.

## FASE TESTING

### Objetivo

Validar los cuatro órdenes, la migración, las reglas distintas de salida y la experiencia responsive.

### Pruebas automatizadas

- [ ] Ejecutar `npm run lint` y corregir todos los errores o imports sin uso.
- [ ] Ejecutar `npm run build` y comprobar que ambos consumidores compilen.
- [ ] Ejecutar `npm test` documentando que actualmente no contiene pruebas reales.

### Pruebas manuales

- [ ] En Etiquetas, comprobar fecha descendente, fecha ascendente, A–Z y Z–A con artículos distinguibles.
- [ ] Confirmar que al repetir el botón activo alterna su flecha y que al cambiar de criterio aplica su dirección natural.
- [ ] Cerrar y reabrir la app verificando que se conserve la preferencia.
- [ ] Preparar manualmente cada valor histórico (`recientes`, `antiguas`, `alfabetico`) y comprobar su migración.
- [ ] Editar y eliminar una etiqueta bajo cada orden y verificar que se modifique el elemento correcto.
- [ ] Generar un PDF después de cambiar el orden visual y confirmar que conserva el orden persistido original.
- [ ] En Listados, comprobar los cuatro órdenes y la posición informada para un duplicado.
- [ ] Exportar cada orden de Listados y confirmar que las filas del Excel coincidan exactamente con la pantalla.
- [ ] Duplicar y reabrir listados verificando la persistencia independiente del orden.

### Casos responsivos y accesibles

- [ ] Revisar visualmente anchos cercanos a 320 px, 360 px, 480 px, 640 px, tableta y escritorio en Etiquetas y Listados.
- [ ] Verificar contraste de flecha activa, foco visible y modo de movimiento reducido.
- [ ] Operar todo el selector mediante teclado y comprobar los nombres accesibles anunciados.

## Progreso del plan

- [ ] Fase 1: Utilidad y contrato compartidos
- [ ] Fase 2: Control compacto accesible
- [ ] Fase 3: Migración de Etiquetas
- [ ] Fase 4: Integración con Listados
- [ ] Fase 5: Responsive, accesibilidad y limpieza
- [ ] Fase Testing

Fecha de creación: 8 de Septiembre 2026
Fecha de última actualización: 8 de Septiembre 2026
Estado: BORRADOR
