# PLAN MEJORA ESCANEO DE PEDIDOS

## Descripción del plan

Mejorar el modo escaneo dentro de Nuevo pedido para que la lista de códigos escaneados sea más clara, la cantidad se pueda ajustar sin editar inputs, la vista previa de imagen no aparezca cortada y la cámara tenga una referencia visual tipo lector.

## Objetivo principal

- Mostrar primero el código escaneado más reciente.
- Reemplazar el input de cantidad por botones de menos y más.
- Rediseñar la fila de códigos para que soporte códigos largos en pantallas chicas.
- Corregir la vista previa superior derecha para que no se vea cortada.
- Agregar una guía central de lectura sobre la cámara, con rectángulo y línea horizontal animada, inspirada en la referencia visual pero adaptada a los colores del proyecto.

## Reglas del plan

- No cambiar el flujo principal de Nuevo pedido fuera del modo escaneo.
- Mantener textos visibles cortos, claros y en español natural.
- Usar nombres descriptivos en español para variables, funciones, clases y componentes nuevos.
- Mantener estilos consistentes con el módulo y usar variables de color existentes en `src/css/app.css`.
- Reutilizar clases CSS existentes para botones y controles cuando ya cubran el caso, especialmente los botones de menos y más.
- No duplicar CSS si una clase existente resuelve el mismo comportamiento visual.
- Cuidar los estilos globales de cámara para no romper otros apartados reutilizables; si algo es exclusivo de pedidos, crear clases específicas para pedidos.
- Mantener el comportamiento actual de duplicados: si un código ya está en la lista, mostrar el mensaje existente y no incrementar cantidad automáticamente.
- Mantener `Finalizar (N)` como cantidad de pedidos escaneados, es decir cantidad de códigos o filas, no suma de items.
- Mantener la X de eliminar junto a los controles de cantidad.
- Bloquear el botón menos cuando la cantidad sea 1 para evitar borrados accidentales.
- No permitir cantidades menores a 1 en ningún punto del flujo.
- Insertar cada código nuevo al inicio de la lista para que el más reciente quede siempre arriba y los anteriores bajen.
- Corregir la miniatura compartida para que se vea bien en todos los apartados que la usen.
- Implementar la guía de cámara como un rectángulo central de lectura con una línea horizontal animada que se desplaza verticalmente dentro del visor.
- Usar la imagen de referencia solo como inspiración, sin copiar la composición exacta ni textos de otra app.

## FASE 1: Relevar el modo escaneo actual

### Objetivo

Identificar los archivos, estado y estilos que controlan el escaneo de pedidos.

- [ ] Revisar `src/components/Modales/ModalNuevoPedido.vue`, que abre `CamaraPedidos.vue` desde Nuevo pedido.
- [ ] Revisar `src/components/Logica/Pedidos/CamaraPedidos.vue`, donde se guardan `pedidosEscaneados` con `{ codigo, items }`.
- [ ] Revisar `src/pages/TablaPedidos.vue`, donde `agregarPedido()` recibe los pedidos confirmados desde el modal.
- [ ] Revisar `src/css/app.css`, donde están consolidados los estilos globales de cámaras, lista escaneada y responsive.
- [ ] Revisar `src/components/Logica/Etiquetas/ControlesFilaEtiqueta.vue` y `ModalNuevoPedido.vue` como referencia de botones menos y más.
- [ ] Identificar qué clases CSS de botones y controles se pueden reutilizar sin duplicar estilos.
- [ ] Identificar qué estilos de cámara son compartidos con ubicaciones o etiquetas antes de modificarlos.

## FASE 2: Ajustar comportamiento de la lista

### Objetivo

Mostrar primero el último código agregado sin romper duplicados, cantidades ni el guardado final.

- [ ] Insertar nuevos códigos al inicio de `pedidosEscaneados` para que el estado coincida con el orden visual.
- [ ] Verificar que los códigos anteriores bajan en la lista cuando entra un código nuevo.
- [ ] Cambiar el `key` del `v-for` para usar una clave estable, preferentemente `pedido.codigo`, y no `index`.
- [ ] Mantener el mensaje actual cuando el código escaneado ya existe en la lista.
- [ ] Verificar que un código duplicado no cambie cantidad ni cree otra fila.
- [ ] Verificar que finalizar el pedido conserve todos los códigos y cantidades correctas.
- [ ] Verificar que eliminar un código no cambie cantidades de otros códigos.

## FASE 3: Reemplazar input de cantidad por controles

### Objetivo

Hacer que la cantidad no sea editable por teclado y se cambie solo con botones de menos y más.

- [ ] Quitar el input editable de cantidad en la lista de escaneo.
- [ ] Importar y usar `IconMinus` e `IconPlus` desde `@tabler/icons-vue`.
- [ ] Reutilizar clases existentes para botones de menos y más si son compatibles con el layout de pedidos.
- [ ] Agregar botón menos con estilo consistente y estado deshabilitado cuando `pedido.items <= 1`.
- [ ] Agregar número de cantidad como texto no editable.
- [ ] Agregar botón más con estilo consistente.
- [ ] Crear funciones descriptivas para incrementar y decrementar cantidad por índice.
- [ ] Normalizar la cantidad para que nunca sea menor a 1 antes de emitir los pedidos finalizados.
- [ ] Mantener la X para eliminar el código escaneado.

## FASE 4: Rediseñar la fila responsive

### Objetivo

Evitar que códigos largos rompan el layout o dejen sin espacio a los controles.

- [ ] Diseñar cada fila con el código arriba ocupando todo el ancho disponible.
- [ ] Ubicar debajo una fila estable con controles `- cantidad +` y la X de eliminar.
- [ ] Usar `overflow-wrap: anywhere` o una solución equivalente para códigos largos.
- [ ] Probar con un código largo como `97884663718031234567890`.
- [ ] Ajustar el layout para pantallas chicas, especialmente el ancho mostrado en la captura.
- [ ] Verificar que los botones Finalizar y Cancelar no se solapen con la lista ni con la publicidad inferior.

## FASE 5: Corregir la vista previa superior derecha

### Objetivo

Mantener el tamaño actual de la vista previa, pero mostrar la imagen completa sin recorte incorrecto.

- [ ] Revisar `.overlay-miniatura` y `.mini-captura` en `src/css/app.css`.
- [ ] Cambiar la miniatura compartida para que use una visualización completa, preferentemente `object-fit: contain`.
- [ ] Mantener el tamaño del recuadro actual y usar fondo oscuro o neutro para las bandas libres.
- [ ] Mantener bordes, separación y posición consistentes con el diseño actual.
- [ ] Verificar que la vista previa no tape información importante de la cámara.
- [ ] Verificar que el ajuste mejora la miniatura en pedidos y no empeora la miniatura de otros apartados de cámara.

## FASE 6: Agregar guía visual de escaneo

### Objetivo

Agregar una referencia visual sobre la cámara que simule un lector sin dificultar ver el código.

- [ ] Agregar un rectángulo central de lectura dentro de `.caja-camara`, con esquinas marcadas y buen contraste.
- [ ] Agregar una línea horizontal dentro del rectángulo de lectura.
- [ ] Animar la línea para que se desplace verticalmente de arriba a abajo y vuelva de forma continua.
- [ ] Usar `pointer-events: none` para que la guía no interfiera con clicks ni eventos del visor.
- [ ] Controlar el `z-index` para que la guía no tape la miniatura ni el mensaje temporal.
- [ ] Mantener colores del proyecto y evitar copiar colores o textos de la app usada como inspiración.
- [ ] Evitar animaciones pesadas o elementos que tapen demasiado la imagen.
- [ ] Respetar colores existentes del proyecto y buen contraste sobre video.
- [ ] Verificar que la animación no afecte el escaneo ni el rendimiento en móvil.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano.

- [ ] Ejecutar lint o el comando de validación disponible para detectar errores de Vue, JavaScript y CSS.
- [ ] Abrir Nuevo pedido y activar el modo escaneo.
- [ ] Escanear o simular al menos tres códigos y verificar que el más nuevo queda arriba.
- [ ] Escanear o simular un código duplicado y verificar que aparece el mensaje existente sin crear otra fila.
- [ ] Probar botones más y menos y verificar que la cantidad cambia correctamente.
- [ ] Verificar que el botón menos queda deshabilitado o sin efecto cuando la cantidad es 1.
- [ ] Verificar que ninguna cantidad emitida queda en 0, negativa, vacía o inválida.
- [ ] Verificar que `Finalizar (N)` cuenta códigos escaneados y no suma de items.
- [ ] Probar el código largo `97884663718031234567890` y verificar que la fila sigue siendo usable en pantalla chica.
- [ ] Verificar que la X elimina el código correcto.
- [ ] Verificar que la vista previa superior derecha se ve completa y sin recorte incorrecto.
- [ ] Verificar que la miniatura se ve completa en todos los apartados de cámara que usen las mismas clases.
- [ ] Verificar que el rectángulo central y la línea animada se ven bien y no tapan el código.
- [ ] Verificar en un viewport móvil similar a la captura que la lista, Finalizar, Cancelar y la publicidad inferior no se solapan.
- [ ] Probar en Android o con `npm run cel` si el entorno está disponible para validar cámara, publicidad y layout nativo.
- [ ] Finalizar el pedido y confirmar que los códigos y cantidades llegan correctos al flujo final.

## Progreso del plan

- [ ] Fase 1: Relevar el modo escaneo actual
- [ ] Fase 2: Ajustar comportamiento de la lista
- [ ] Fase 3: Reemplazar input de cantidad por controles
- [ ] Fase 4: Rediseñar la fila responsive
- [ ] Fase 5: Corregir la vista previa superior derecha
- [ ] Fase 6: Agregar guía visual de escaneo
- [ ] Fase Testing

Fecha de creación: 5 de Junio 2026
Fecha de última actualización: 5 de Junio 2026
Estado: BORRADOR
