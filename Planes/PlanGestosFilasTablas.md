# PLAN GESTOS EN FILAS DE TABLAS

## Descripción del plan

Modificar las tablas y listas tipo tabla de la app para reemplazar las acciones individuales de Editar y Borrar por gestos horizontales sobre la fila. La auditoría encontró que no existe una tabla reutilizable única: hay tablas HTML repetidas en pedidos, ubicaciones y fotos, y etiquetas usa tarjetas con controles propios. Por eso el plan empieza creando una base reutilizable de fila deslizable antes de migrar cada módulo.

## Objetivo principal

- Reemplazar Editar por gesto de izquierda a derecha con acción visible Editar
- Reemplazar Borrar por gesto de derecha a izquierda con confirmación integrada en la fila
- Mantener la acción Etiqueta visible donde exista, sin mantener Editar ni Borrar como iconos normales
- Evitar duplicar lógica de gestos entre tablas

## Reglas del plan

- Usar Pointer Events para soportar dedo y mouse sin agregar una dependencia nueva
- Permitir solo una fila abierta a la vez por tabla o lista
- Cerrar la fila abierta cuando el usuario abre otra fila, cancela el gesto o ejecuta una acción
- Limitar el desplazamiento visual a aproximadamente 50% del ancho de la fila
- Usar el texto Borrar para la primera acción destructiva y Confirmar para ejecutar el borrado
- Mantener los modales de borrar todo, porque no son borrados individuales de fila
- Quitar los modales de confirmación solo en borrados individuales cubiertos por la confirmación dentro de la fila
- Usar colores existentes de `src/css/app.css`, especialmente `--color-error`, `--color-acento`, `--color-exito`, `--color-superficie`, `--color-fondo` y `--color-borde`

## FASE 1: Consolidar auditoría y alcance

### Objetivo

Dejar definido el mapa real de tablas y los casos especiales antes de tocar la interfaz.

- [ ] Confirmar que `src/pages/TablaPedidos.vue` entra en el cambio por tener Editar y Borrar individuales
- [ ] Confirmar que `src/components/Logica/Pedidos/PedidosRealizados.vue` entra en el cambio por tener Editar y Borrar individuales
- [ ] Confirmar que `src/components/Logica/Pedidos/Estadisticas/PedidosDelDia.vue` entra en el cambio por tener Editar y Borrar individuales
- [ ] Confirmar que `src/components/Logica/Ubicaciones/TablaUbicaciones.vue` entra en el cambio y debe mantener solo la acción Etiqueta visible
- [ ] Confirmar que `src/components/Logica/Fotos/TablaFotos.vue` entra en el cambio en tabla desktop y cards móviles
- [ ] Confirmar que `src/components/Logica/Etiquetas/TablaEtiquetas.vue` entra como caso especial por usar tarjetas y no una tabla HTML clásica
- [ ] Confirmar que `src/components/Logica/Ubicaciones/SelectorExcel.vue` no entra porque su tabla es informativa y sus acciones pertenecen al archivo cargado, no a filas de datos principales

## FASE 2: Crear base reutilizable de fila deslizable

### Objetivo

Crear una solución común para gestos, estados y confirmación que pueda usarse en tablas y tarjetas sin duplicar comportamiento.

- [ ] Revisar si conviene crear un componente en `src/components/Logica/Compartidos/` o un composable en una carpeta existente del proyecto
- [ ] Crear la pieza reutilizable con nombres en español y archivos en PascalCase
- [ ] Implementar detección de gesto con `pointerdown`, `pointermove`, `pointerup` y `pointercancel`
- [ ] Diferenciar gesto horizontal real de scroll vertical para no romper el desplazamiento en móvil
- [ ] Exponer eventos o callbacks para `editar`, `borrar` y `confirmarBorrado`
- [ ] Permitir configurar si una fila tiene acción visible extra, como Etiqueta
- [ ] Implementar estado de fila abierta para que solo una fila quede desplegada a la vez
- [ ] Implementar cierre al tocar fuera, abrir otra fila o completar una acción
- [ ] Aplicar clases CSS compactas respetando el estilo actual y sin lineas en blanco entre reglas

## FASE 3: Migrar tablas de pedidos

### Objetivo

Aplicar el gesto reutilizable a las tablas de pedidos manteniendo los modales de edición existentes y eliminando confirmaciones individuales por modal.

- [ ] Migrar `src/pages/TablaPedidos.vue` para quitar iconos de Editar y Borrar de la columna Acciones
- [ ] Conectar gesto Editar de `src/pages/TablaPedidos.vue` con `abrirModalEditar(pedido)`
- [ ] Conectar gesto Borrar de `src/pages/TablaPedidos.vue` con `confirmarEliminacion` sin mostrar `ModalEliminar`
- [ ] Migrar `src/components/Logica/Pedidos/PedidosRealizados.vue` para quitar iconos de Editar y Borrar de la columna Acciones
- [ ] Conectar gesto Editar de pedidos realizados con `abrirModalEditar(indice)`
- [ ] Conectar gesto Borrar de pedidos realizados con la eliminación actual sin mostrar `ModalEliminar`
- [ ] Migrar `src/components/Logica/Pedidos/Estadisticas/PedidosDelDia.vue` para quitar iconos de Editar y Borrar de la columna Acciones
- [ ] Conectar gesto Editar del dia con el modal correcto segun sea pedido normal o falta
- [ ] Conectar gesto Borrar del día con eliminación de pedido normal o falta respetando la lógica existente
- [ ] Eliminar imports y estados de `ModalEliminar` que queden sin uso en borrado individual de pedidos

## FASE 4: Migrar ubicaciones

### Objetivo

Aplicar gestos a ubicaciones manteniendo Etiqueta como única acción visible en la columna Acciones.

- [ ] Modificar `src/components/Logica/Ubicaciones/TablaUbicaciones.vue` para mantener visible solo `IconTag` en Acciones por fila
- [ ] Reemplazar el icono Editar por gesto de izquierda a derecha conectado con `abrirModalEditar`
- [ ] Reemplazar el icono Borrar por gesto de derecha a izquierda conectado con borrado confirmado en fila
- [ ] Mantener `enviarEtiquetaIndividual` y su animación actual
- [ ] Mantener `enviarTodasEtiquetas` y el botón superior de enviar todas a etiquetas
- [ ] Mantener el modal de borrar todas las ubicaciones
- [ ] Ajustar `src/pages/AjustarUbicaciones.vue` para eliminar el modal de borrado individual si queda sin uso
- [ ] Verificar que la sincronización con la base de ubicaciones siga ejecutándose después de borrar una fila

## FASE 5: Migrar fotos

### Objetivo

Aplicar el mismo patrón en fotos sin romper la experiencia desktop ni móvil.

- [ ] Modificar `src/components/Logica/Fotos/TablaFotos.vue` para usar gesto en la tabla desktop
- [ ] Reemplazar Editar por gesto de izquierda a derecha conectado con `editarFoto(foto)`
- [ ] Reemplazar Borrar por gesto de derecha a izquierda conectado con borrado confirmado en fila
- [ ] Aplicar el mismo comportamiento a las cards móviles o adaptar la tarjeta al componente reutilizable
- [ ] Mantener el modal o confirmación de limpiar todas las fotos
- [ ] Eliminar el modal de confirmación individual de foto si queda sin uso
- [ ] Verificar que las miniaturas y datos de foto no se desalineen al deslizar

## FASE 6: Migrar etiquetas como caso especial

### Objetivo

Adaptar la lista de etiquetas, que usa tarjetas y controles inline, al nuevo gesto de borrado individual.

- [ ] Modificar `src/components/Logica/Etiquetas/TablaEtiquetas.vue` para que cada tarjeta permita gesto de borrar
- [ ] Reemplazar el botón individual de eliminar de `ControlesFilaEtiqueta` por gesto o dejar el componente sin modo acciones si queda obsoleto
- [ ] Mantener los controles de cantidad, confirmación de edición inline y restablecer valores
- [ ] Conectar Borrar con `eliminarEtiqueta(indice)` usando confirmación integrada en la tarjeta
- [ ] Ajustar `src/pages/PaginaEtiquetas.vue` para eliminar el modal de borrado individual si queda sin uso
- [ ] Mantener el modal de limpiar todas las etiquetas
- [ ] Verificar que la edición inline de etiqueta no entre en conflicto con el gesto horizontal

## FASE 7: Limpieza y consistencia

### Objetivo

Eliminar código muerto y dejar el comportamiento uniforme en todos los módulos.

- [ ] Quitar imports de iconos `IconPencil`, `IconEdit` e `IconTrash` cuando ya no se usen en acciones individuales
- [ ] Quitar estados de modal individual de eliminación que hayan quedado obsoletos
- [ ] Quitar funciones `abrirModalEliminar` que ya no se usen o renombrarlas si ahora ejecutan borrado confirmado desde fila
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
- [ ] Probar en pedidos realizados que editar y borrar mantienen la persistencia en almacenamiento
- [ ] Probar en pedidos del día que una falta se edita y borra con la lógica correcta
- [ ] Probar en ubicaciones que la acción Etiqueta sigue visible y funcionando
- [ ] Probar en ubicaciones que Editar y Borrar ya no aparecen como iconos normales
- [ ] Probar en ubicaciones que borrar sincroniza correctamente la base y actualiza la barra inferior
- [ ] Probar en fotos desktop que la fila se desliza con mouse y ejecuta Editar y Borrar
- [ ] Probar en fotos móvil que la tarjeta se desliza con dedo y no rompe la visualización de miniaturas
- [ ] Probar en etiquetas que el gesto de borrar no interfiere con cantidad, edición inline ni restablecer
- [ ] Probar que al abrir una fila se cierra cualquier otra fila abierta
- [ ] Probar que tocar fuera o hacer scroll vertical cancela o cierra el gesto sin ejecutar acciones
- [ ] Probar que los modales de borrar todo siguen funcionando en ubicaciones, fotos y etiquetas

## Progreso del plan

- [ ] Fase 1: Consolidar auditoría y alcance
- [ ] Fase 2: Crear base reutilizable de fila deslizable
- [ ] Fase 3: Migrar tablas de pedidos
- [ ] Fase 4: Migrar ubicaciones
- [ ] Fase 5: Migrar fotos
- [ ] Fase 6: Migrar etiquetas como caso especial
- [ ] Fase 7: Limpieza y consistencia
- [ ] Fase Testing

Fecha de creación: 28 de Mayo 2026
Fecha de última actualización: 28 de Mayo 2026
Estado: BORRADOR
