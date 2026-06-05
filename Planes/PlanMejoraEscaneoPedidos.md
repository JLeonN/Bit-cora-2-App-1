# PLAN MEJORA ESCANEO DE PEDIDOS

## Descripción del plan

Mejorar el modo escaneo dentro de Nuevo pedido para que la lista de códigos escaneados sea más clara, la cantidad se pueda ajustar sin editar inputs, la vista previa de imagen no aparezca cortada y la cámara tenga una referencia visual tipo lector.

## Objetivo principal

- Mostrar primero el código escaneado más reciente.
- Reemplazar el input de cantidad por botones de menos y más.
- Rediseñar la fila de códigos para que soporte códigos largos en pantallas chicas.
- Corregir la vista previa superior derecha para que no se vea cortada.
- Agregar una línea horizontal animada sobre la cámara para mejorar la experiencia de escaneo.

## Reglas del plan

- No cambiar el flujo principal de Nuevo pedido fuera del modo escaneo.
- Mantener textos visibles cortos, claros y en español natural.
- Usar nombres descriptivos en español para variables, funciones, clases y componentes nuevos.
- Mantener estilos consistentes con el módulo y usar variables de color existentes en `src/css/app.css`.
- Mantener el comportamiento actual de duplicados: si un código ya está en la lista, mostrar el mensaje existente y no incrementar cantidad automáticamente.
- Mantener la X de eliminar junto a los controles de cantidad.
- Bloquear el botón menos cuando la cantidad sea 1 para evitar borrados accidentales.
- Implementar la guía de cámara como una línea horizontal animada que se desplaza verticalmente dentro del visor.

## FASE 1: Relevar el modo escaneo actual

### Objetivo

Identificar los archivos, estado y estilos que controlan el escaneo de pedidos.

- [ ] Revisar `src/components/Modales/ModalNuevoPedido.vue`, que abre `CamaraPedidos.vue` desde Nuevo pedido.
- [ ] Revisar `src/components/Logica/Pedidos/CamaraPedidos.vue`, donde se guardan `pedidosEscaneados` con `{ codigo, items }`.
- [ ] Revisar `src/pages/TablaPedidos.vue`, donde `agregarPedido()` recibe los pedidos confirmados desde el modal.
- [ ] Revisar `src/css/app.css`, donde están consolidados los estilos globales de cámaras, lista escaneada y responsive.
- [ ] Revisar `src/components/Logica/Etiquetas/ControlesFilaEtiqueta.vue` y `ModalNuevoPedido.vue` como referencia de botones menos y más.

## FASE 2: Ajustar comportamiento de la lista

### Objetivo

Mostrar primero el último código agregado sin romper duplicados, cantidades ni el guardado final.

- [ ] Revisar si conviene insertar nuevos códigos al inicio del array o invertir solo el orden visual.
- [ ] Implementar el orden con el código más nuevo arriba.
- [ ] Mantener el mensaje actual cuando el código escaneado ya existe en la lista.
- [ ] Verificar que un código duplicado no cambie cantidad ni cree otra fila.
- [ ] Verificar que finalizar el pedido conserve todos los códigos y cantidades correctas.
- [ ] Verificar que eliminar un código no cambie cantidades de otros códigos.

## FASE 3: Reemplazar input de cantidad por controles

### Objetivo

Hacer que la cantidad no sea editable por teclado y se cambie solo con botones de menos y más.

- [ ] Quitar el input editable de cantidad en la lista de escaneo.
- [ ] Importar y usar `IconMinus` e `IconPlus` desde `@tabler/icons-vue`.
- [ ] Agregar botón menos con estilo consistente y estado deshabilitado cuando `pedido.items <= 1`.
- [ ] Agregar número de cantidad como texto no editable.
- [ ] Agregar botón más con estilo consistente.
- [ ] Crear funciones descriptivas para incrementar y decrementar cantidad por índice.
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
- [ ] Cambiar la miniatura para que use una visualización completa, preferentemente `object-fit: contain`.
- [ ] Mantener el tamaño del recuadro actual y usar fondo oscuro o neutro para las bandas libres.
- [ ] Mantener bordes, separación y posición consistentes con el diseño actual.
- [ ] Verificar que la vista previa no tape información importante de la cámara.

## FASE 6: Agregar guía visual de escaneo

### Objetivo

Agregar una referencia visual sobre la cámara que simule un lector sin dificultar ver el código.

- [ ] Agregar una línea horizontal dentro de `.caja-camara`.
- [ ] Animar la línea para que se desplace verticalmente de arriba a abajo y vuelva de forma continua.
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
- [ ] Probar el código largo `97884663718031234567890` y verificar que la fila sigue siendo usable en pantalla chica.
- [ ] Verificar que la X elimina el código correcto.
- [ ] Verificar que la vista previa superior derecha se ve completa y sin recorte incorrecto.
- [ ] Verificar que la guía visual de cámara se ve bien y no tapa el código.
- [ ] Verificar en un viewport móvil similar a la captura que la lista, Finalizar, Cancelar y la publicidad inferior no se solapan.
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
