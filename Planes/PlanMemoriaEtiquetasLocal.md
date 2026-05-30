# PLAN MEMORIA LOCAL DE ETIQUETAS

## Descripcion del plan

Implementar una memoria local en el telefono para que, cuando un usuario edite una etiqueta y la guarde, esa configuracion quede asociada al codigo del articulo. La proxima vez que se genere una etiqueta del mismo codigo, la app debe aplicar automaticamente esa version guardada y evitar rehacer ajustes manuales.

## Objetivo principal

- Recordar ajustes de etiquetas por codigo de articulo.
- Reaplicar automaticamente esos ajustes en futuras etiquetas del mismo codigo.
- Guardar todo en almacenamiento local con Capacitor Preferences en una primera etapa.

## Reglas del plan

- No aplicar reglas semanticas globales complejas en esta fase.
- Priorizar memoria exacta por codigo antes de cualquier similitud.
- Mantener compatibilidad con el flujo actual de agregar, editar, previsualizar y generar PDF.
- Si no hay memoria para un codigo, usar el comportamiento actual sin cambios.
- Registrar fecha de actualizacion por cada memoria para poder evolucionar luego.
- Clave unica de memoria por etiqueta: `codigo` del articulo.
- Politica de persistencia: siempre sobrescribir memoria existente del mismo codigo (sin duplicados).
- Momento principal de guardado: al confirmar edicion de la etiqueta (tic verde o confirmacion equivalente).
- Momento secundario de respaldo: al enviar o generar PDF, persistir el ultimo estado editado.

## FASE 1: Definir modelo de memoria

### Objetivo

Dejar cerrada la estructura de datos que se guardara por cada codigo.

- [ ] Definir la clave principal de almacenamiento para memoria de etiquetas.
- [ ] Definir estructura por codigo con campos minimos:
- [ ] `codigo`
- [ ] `descripcionFormateada`
- [ ] `ubicacionOpcional` (si aplica)
- [ ] `actualizadoEn`
- [ ] Definir version de esquema para migraciones futuras.
- [ ] Definir limite inicial de entradas y estrategia simple de recorte si supera limite.

## FASE 2: Persistencia local

### Objetivo

Implementar lectura y escritura de memorias usando Capacitor Preferences.

- [ ] Crear modulo de almacenamiento dedicado a memoria de etiquetas.
- [ ] Implementar `upsert` por codigo (crear si no existe, actualizar si existe).
- [ ] Implementar obtener memoria por codigo.
- [ ] Implementar obtener todas las memorias para debug y futuro export.
- [ ] Implementar eliminar memoria por codigo.
- [ ] Implementar limpiar todas las memorias (solo utilidad interna controlada).

## FASE 3: Integracion en flujo de etiquetas

### Objetivo

Conectar la memoria al flujo actual para que se use sin friccion para el usuario.

- [ ] Al agregar etiqueta por codigo, buscar memoria y aplicar descripcion guardada si existe.
- [ ] Al editar descripcion de etiqueta y confirmar (tic verde o confirmacion equivalente), ejecutar guardado inmediato de memoria.
- [ ] Si se vuelve a editar la misma etiqueta, sobrescribir memoria del mismo codigo con la ultima version.
- [ ] Al enviar o generar PDF, ejecutar persistencia de respaldo del estado actual por codigo.
- [ ] Mantener edicion manual actual sin cambios visuales bruscos.
- [ ] Evitar que una memoria de un codigo afecte a otro codigo diferente.

## FASE 4: UI minima de control

### Objetivo

Permitir que el usuario entienda y controle la memoria sin complejidad.

- [ ] Mostrar indicador simple cuando una etiqueta se cargue desde memoria.
- [ ] Agregar accion para restablecer una etiqueta al valor original del maestro.
- [ ] Agregar accion para olvidar memoria de ese codigo desde la tarjeta o tabla.
- [ ] Confirmar mensajes claros en español para guardar, usar y borrar memoria.

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que la memoria funciona y evita retrabajo.

- [ ] Crear etiqueta de un codigo sin memoria y verificar flujo normal.
- [ ] Editar descripcion, guardar y verificar que se persiste memoria local.
- [ ] Confirmar que el guardado ocurre al confirmar edicion y no crea entradas duplicadas del mismo codigo.
- [ ] Editar dos veces el mismo codigo y verificar que solo queda la ultima version (sobrescritura correcta).
- [ ] Volver a cargar el mismo codigo y verificar que aplica descripcion guardada.
- [ ] Cerrar y abrir app, recargar mismo codigo y verificar persistencia.
- [ ] Borrar memoria de un codigo y verificar que deja de aplicarse.
- [ ] Enviar o generar PDF y verificar guardado de respaldo sin duplicados.
- [ ] Ejecutar `npm run lint` y corregir errores.
- [ ] Ejecutar `npm run build` y corregir errores.

## Progreso del plan

- [ ] Fase 1: Definir modelo de memoria
- [ ] Fase 2: Persistencia local
- [ ] Fase 3: Integracion en flujo de etiquetas
- [ ] Fase 4: UI minima de control
- [ ] Fase Testing

Fecha de creacion: 30 de Mayo 2026
Fecha de ultima actualizacion: 30 de Mayo 2026
Estado: BORRADOR
