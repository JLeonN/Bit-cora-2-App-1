# PLAN GESTOS EN FILAS DE TABLAS

## Descripción del plan

Modificar las tablas y listas tipo tabla de la app para reemplazar las acciones individuales de Editar y Borrar por gestos horizontales sobre la fila. La auditoría encontró que no existe una tabla reutilizable única: hay tablas HTML repetidas en pedidos, ubicaciones y fotos. La sección Etiquetas queda fuera del alcance y no se debe tocar. Por eso el plan empieza creando una base reutilizable de fila deslizable y validándola en una tabla piloto antes de migrar cada módulo.

## Objetivo principal

- Reemplazar Editar por gesto de izquierda a derecha con acción visible Editar
- Reemplazar Borrar por gesto de derecha a izquierda con confirmación integrada en la fila
- Mantener la acción Etiqueta visible donde exista, sin mantener Editar ni Borrar como iconos normales
- Evitar duplicar lógica de gestos entre tablas
- Validar primero la experiencia en una tabla piloto antes de escalar el cambio

## Reglas del plan

- Usar Pointer Events para soportar dedo y mouse sin agregar una dependencia nueva
- Implementar la lógica principal como composable reutilizable; usar un componente visual solo donde la estructura del módulo lo permita
- Permitir solo una fila abierta a la vez por tabla o lista
- Cerrar la fila abierta cuando el usuario abre otra fila, cancela el gesto, toca fuera, hace scroll vertical o ejecuta una acción
- Limitar el desplazamiento visual a 50% del ancho de la fila
- Abrir la acción si el arrastre supera 25% del ancho de la fila o 72px
- Usar el texto Borrar para la primera acción destructiva y Confirmar para ejecutar el borrado
- Resetear Confirmar a Borrar al cerrar la fila, abrir otra fila, ejecutar una acción, cambiar la lista o pasar 4 segundos sin confirmar
- Usar transiciones suaves de 180ms a 220ms para apertura, cierre y cambio entre Borrar y Confirmar
- Mantener los modales de borrar todo, porque no son borrados individuales de fila
- Quitar los modales de confirmación solo en borrados individuales cubiertos por la confirmación dentro de la fila
- No reutilizar funciones de confirmación que dependan de estado previo de modal; crear handlers directos por fila cuando haga falta
- No iniciar gesto si el evento nace desde `input`, `button`, `textarea`, `select`, `a` o elementos editables
- No tocar la sección Etiquetas ni sus archivos relacionados durante este plan
- Usar colores existentes de `src/css/app.css`, especialmente `--color-error`, `--color-acento`, `--color-exito`, `--color-superficie`, `--color-fondo` y `--color-borde`

## FASE 1: Consolidar auditoría y alcance

### Objetivo

Dejar definido el mapa real de tablas y los casos especiales antes de tocar la interfaz.

- [ ] Confirmar que `src/pages/TablaPedidos.vue` entra en el cambio por tener Editar y Borrar individuales
- [ ] Confirmar que `src/components/Logica/Pedidos/PedidosRealizados.vue` entra en el cambio por tener Editar y Borrar individuales
- [ ] Confirmar que `src/components/Logica/Pedidos/Estadisticas/PedidosDelDia.vue` entra en el cambio por tener Editar y Borrar individuales
- [ ] Confirmar que `src/components/Logica/Ubicaciones/TablaUbicaciones.vue` entra en el cambio y debe mantener solo la acción Etiqueta visible
- [ ] Confirmar que `src/components/Logica/Fotos/TablaFotos.vue` entra en el cambio en tabla desktop y cards móviles
- [ ] Confirmar que `src/components/Logica/Etiquetas/TablaEtiquetas.vue` queda fuera del alcance y no debe tocarse
- [ ] Confirmar que `src/pages/PaginaEtiquetas.vue` queda fuera del alcance y no debe tocarse
- [ ] Confirmar que `src/components/Logica/Etiquetas/ControlesFilaEtiqueta.vue` queda fuera del alcance y no debe tocarse
- [ ] Confirmar que `src/components/Logica/Ubicaciones/SelectorExcel.vue` no entra porque su tabla es informativa y sus acciones pertenecen al archivo cargado, no a filas de datos principales

## FASE 2: Crear base reutilizable de fila deslizable

### Objetivo

Crear una solución común para gestos, estados y confirmación que pueda usarse en tablas y cards de fotos sin duplicar comportamiento.

- [ ] Crear un composable reutilizable en una carpeta compartida existente o en `src/components/Logica/Compartidos/`
- [ ] Usar nombres en español y archivos en PascalCase
- [ ] Implementar detección de gesto con `pointerdown`, `pointermove`, `pointerup` y `pointercancel`
- [ ] Diferenciar gesto horizontal real de scroll vertical para no romper el desplazamiento en móvil
- [ ] Exponer eventos o callbacks para editar, preparar borrado, confirmar borrado y cerrar fila
- [ ] Permitir configurar si una fila tiene acción visible extra, como Etiqueta
- [ ] Implementar estado de fila abierta para que solo una fila quede desplegada a la vez
- [ ] Implementar cierre al tocar fuera, abrir otra fila o completar una acción
- [ ] Implementar reset automático de Confirmar a Borrar después de 4 segundos sin confirmar
- [ ] Bloquear el inicio del gesto desde inputs, botones, enlaces, selects, textareas y zonas editables
- [ ] Validar si el gesto puede aplicarse directamente sobre `<tr>` o si cada fila necesita un contenedor interno deslizable
- [ ] Definir una señal visual discreta para descubrir el gesto en desktop y dejarla como ajuste evaluable luego del piloto
- [ ] Aplicar clases CSS compactas respetando el estilo actual y sin líneas en blanco entre reglas

## FASE 3: Piloto en TablaPedidos

### Objetivo

Validar el gesto completo en una tabla simple antes de migrar el resto de la app.

- [ ] Migrar solo `src/pages/TablaPedidos.vue` como primer piloto
- [ ] Quitar iconos de Editar y Borrar de la columna Acciones en `src/pages/TablaPedidos.vue`
- [ ] Conectar gesto Editar con `abrirModalEditar(pedido)`
- [ ] Crear un handler directo de borrado por pedido que no dependa de `mostrarModalEliminar`, `pedidoEliminar` ni `confirmarEliminacion`
- [ ] Conectar gesto Borrar con Borrar, luego Confirmar, y ejecutar el handler directo de borrado
- [ ] Mantener el modal de agregar pedido, editar pedido, cámara e historial sin cambios
- [ ] Evaluar visualmente la señal de descubrimiento del gesto y decidir si queda, se suaviza o se elimina
- [ ] Validar con mouse y dedo que la transición se sienta fluida antes de pasar a las demás tablas

## FASE 4: Migrar tablas de pedidos restantes

### Objetivo

Aplicar el gesto reutilizable a las tablas de pedidos manteniendo los modales de edición existentes y eliminando confirmaciones individuales por modal.

- [ ] Migrar `src/components/Logica/Pedidos/PedidosRealizados.vue` para quitar iconos de Editar y Borrar de la columna Acciones
- [ ] Conectar gesto Editar de pedidos realizados con `abrirModalEditar(indice)`
- [ ] Crear un handler directo de borrado para pedidos realizados que no dependa del estado de `ModalEliminar`
- [ ] Conectar gesto Borrar de pedidos realizados con el handler directo de borrado
- [ ] Migrar `src/components/Logica/Pedidos/Estadisticas/PedidosDelDia.vue` para quitar iconos de Editar y Borrar de la columna Acciones
- [ ] Conectar gesto Editar del día con el modal correcto según sea pedido normal o falta
- [ ] Crear handlers directos para borrar pedido normal y falta sin depender del estado de `ModalEliminar`
- [ ] Conectar gesto Borrar del día con el handler correcto respetando la lógica existente
- [ ] Eliminar imports y estados de `ModalEliminar` que queden sin uso en borrado individual de pedidos

## FASE 5: Migrar ubicaciones

### Objetivo

Aplicar gestos a ubicaciones manteniendo Etiqueta como única acción visible en la columna Acciones.

- [ ] Modificar `src/components/Logica/Ubicaciones/TablaUbicaciones.vue` para mantener visible solo `IconTag` en Acciones por fila
- [ ] Reemplazar el icono Editar por gesto de izquierda a derecha conectado con `abrirModalEditar`
- [ ] Reemplazar el icono Borrar por gesto de derecha a izquierda conectado con borrado confirmado en fila
- [ ] Mantener `enviarEtiquetaIndividual` y su animación actual
- [ ] Mantener `enviarTodasEtiquetas` y el botón superior de enviar todas a etiquetas
- [ ] Mantener el modal de borrar todas las ubicaciones
- [ ] Crear un handler directo de borrado individual en `src/pages/AjustarUbicaciones.vue` que no dependa de `ubicacionEliminar` ni `mostrarModalEliminar`
- [ ] Ajustar `src/pages/AjustarUbicaciones.vue` para eliminar el modal de borrado individual si queda sin uso
- [ ] Verificar que la sincronización con la base de ubicaciones siga ejecutándose después de borrar una fila

## FASE 6: Migrar fotos

### Objetivo

Aplicar el mismo patrón en fotos sin romper la experiencia desktop ni móvil. La vista desktop y las cards móviles pueden seguir siendo dos estructuras visuales distintas, pero deben compartir la misma lógica de gesto.

- [ ] Modificar `src/components/Logica/Fotos/TablaFotos.vue` para usar gesto en la tabla desktop
- [ ] Reemplazar Editar por gesto de izquierda a derecha conectado con `editarFoto(foto)`
- [ ] Reemplazar Borrar por gesto de derecha a izquierda conectado con borrado confirmado en fila
- [ ] Crear un handler directo de borrado individual de foto que no dependa de `fotoAEliminar`, `accionEliminar` ni `mostrarModalEliminar`
- [ ] Aplicar el mismo comportamiento a las cards móviles usando el mismo composable de gesto
- [ ] Mantener el modal o confirmación de limpiar todas las fotos
- [ ] Eliminar el modal de confirmación individual de foto si queda sin uso
- [ ] Verificar que las miniaturas y datos de foto no se desalineen al deslizar

## FASE 7: Limpieza y consistencia

### Objetivo

Eliminar código muerto y dejar el comportamiento uniforme en todos los módulos.

- [ ] Quitar imports de iconos `IconPencil`, `IconEdit` e `IconTrash` cuando ya no se usen en acciones individuales
- [ ] Quitar estados de modal individual de eliminación que hayan quedado obsoletos
- [ ] Quitar funciones `abrirModalEliminar` que ya no se usen o renombrarlas si ahora ejecutan borrado confirmado desde fila
- [ ] Verificar que no se haya modificado ningún archivo de la sección Etiquetas
- [ ] Revisar que no queden errores de ESLint por variables sin uso
- [ ] Revisar que todos los textos visibles usen Borrar, Confirmar y Editar de forma consistente
- [ ] Corregir cualquier texto dañado que aparezca en archivos tocados durante la implementación

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que los gestos funcionan sin romper los flujos actuales.

- [ ] Ejecutar `npm run lint` y corregir errores si aparecen
- [ ] Ejecutar `npm run build` y corregir errores si aparecen
- [ ] Probar en `TablaPedidos` que deslizar izquierda a derecha abre el modal de edición correcto
- [ ] Probar en `TablaPedidos` que deslizar derecha a izquierda muestra Borrar, luego Confirmar, y elimina la fila
- [ ] Probar en `TablaPedidos` que Confirmar vuelve a Borrar después de 4 segundos sin acción
- [ ] Probar en `TablaPedidos` que tocar fuera, abrir otra fila o hacer scroll vertical cierra la fila abierta
- [ ] Probar en pedidos realizados que editar y borrar mantienen la persistencia en almacenamiento
- [ ] Probar en pedidos del día que una falta se edita y borra con la lógica correcta
- [ ] Probar en ubicaciones que la acción Etiqueta sigue visible y funcionando
- [ ] Probar en ubicaciones que Editar y Borrar ya no aparecen como iconos normales
- [ ] Probar en ubicaciones que borrar sincroniza correctamente la base y actualiza la barra inferior
- [ ] Probar en fotos desktop que la fila se desliza con mouse y ejecuta Editar y Borrar
- [ ] Probar en fotos móvil que la tarjeta se desliza con dedo y no rompe la visualización de miniaturas
- [ ] Revisar con `git diff --name-only` que no haya cambios en archivos de `src/components/Logica/Etiquetas/` ni `src/pages/PaginaEtiquetas.vue`
- [ ] Probar que la sección Etiquetas sigue funcionando igual y no tuvo cambios de archivos
- [ ] Probar que al abrir una fila se cierra cualquier otra fila abierta
- [ ] Probar que tocar fuera o hacer scroll vertical cancela o cierra el gesto sin ejecutar acciones
- [ ] Probar que los modales de borrar todo siguen funcionando en ubicaciones y fotos

## Progreso del plan

- [ ] Fase 1: Consolidar auditoría y alcance
- [ ] Fase 2: Crear base reutilizable de fila deslizable
- [ ] Fase 3: Piloto en TablaPedidos
- [ ] Fase 4: Migrar tablas de pedidos restantes
- [ ] Fase 5: Migrar ubicaciones
- [ ] Fase 6: Migrar fotos
- [ ] Fase 7: Limpieza y consistencia
- [ ] Fase Testing

Fecha de creación: 28 de Mayo 2026
Fecha de última actualización: 29 de Mayo 2026
Estado: BORRADOR
