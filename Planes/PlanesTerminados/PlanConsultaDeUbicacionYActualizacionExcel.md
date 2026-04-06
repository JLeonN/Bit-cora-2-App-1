# PLAN CONSULTA DE UBICACIÓN Y ACTUALIZACIÓN DE EXCEL

## Descripción del plan

Agregar un nuevo apartado llamado `Consulta De Ubicación` en la app, visible tanto en el inicio como en el drawer, para consultar rápidamente la ubicación de un artículo usando escaneo, código o nombre. Además, reforzar el módulo `Ubicaciones` para que los cambios de ubicación actualicen el Excel original del usuario, impacten en la base cargada de forma inmediata y queden listos en la tabla de ubicaciones para enviar o exportar. También se debe ajustar la ayuda visible cuando no hay Excel cargado, actualizar tutoriales y crear el resumen del nuevo módulo.

## Objetivo principal

- Incorporar `Consulta De Ubicación` como nuevo flujo principal de la app
- Permitir consultar y actualizar ubicaciones usando la base Excel ya cargada
- Sincronizar los cambios con el Excel original, la base persistida y la tabla de `Ubicaciones`
- Mejorar la guía al usuario con mensajes, tutoriales y resumen del nuevo módulo

## Reglas del plan

- Mantener el orden de acceso en inicio y drawer como `Pedidos`, `Ubicaciones`, `Consulta De Ubicación` y `Etiquetas`
- Reutilizar componentes, lógica y estilos existentes antes de crear variantes nuevas
- Usar el buscador inteligente y el sistema de escaneo ya presentes en otros módulos
- Mantener transiciones suaves en apariciones, desplazamientos y cambios de estado
- Reutilizar la lógica del input de ubicación de `Ubicaciones`, incluyendo formato, mayúsculas y validaciones
- Al guardar una nueva ubicación, actualizar sin confirmación extra el Excel original, la base cargada y la UI visible
- Cada cambio hecho desde `Consulta De Ubicación` debe agregarse también a `Ubicaciones` como listo para enviar o exportar
- Si no hay Excel cargado, reutilizar el flujo de carga existente en vez de crear uno distinto
- No tocar por ahora la columna `D` de stock ni ampliar el comportamiento del buscador inteligente

## FASE 1: Integrar acceso y navegación del nuevo módulo

### Objetivo

Incorporar `Consulta De Ubicación` como sección principal consistente con la navegación actual.

- [x] Agregar la nueva tarjeta en el inicio con el orden definido entre `Ubicaciones` y `Etiquetas`
- [x] Agregar la opción `Consulta De Ubicación` en el drawer respetando el mismo orden
- [x] Crear la nueva ruta y página base del módulo siguiendo la estructura actual del proyecto
- [x] Mantener el estilo visual de tarjetas, navegación inferior y transiciones consistente con los módulos existentes

## FASE 2: Construir la consulta de ubicación

### Objetivo

Permitir buscar un artículo y mostrar su ubicación de forma clara, rápida y enfocada en móvil.

- [x] Reutilizar el sistema de carga de Excel existente cuando el usuario entre sin base cargada
- [x] Reutilizar el buscador inteligente actual para búsquedas por escaneo, código o nombre
- [x] Mostrar resultado exacto con `Ubicación` en mayor jerarquía visual, `Nombre` debajo y `Código` visible
- [x] Mantener el input de búsqueda centrado al inicio y desplazarlo suavemente hacia arriba al mostrar resultados
- [x] Dejar el input listo para nuevas consultas sin romper el flujo de lectura del resultado actual
- [x] Mantener botón de cámara y comportamiento alineado con otros módulos

## FASE 3: Permitir actualización de ubicación y sincronización total

### Objetivo

Hacer que la consulta también permita corregir una ubicación y propagar ese cambio a todos los puntos necesarios.

- [x] Mostrar un botón para habilitar la edición de ubicación del artículo consultado
- [x] Desplegar suavemente un bloque de edición con input reutilizado desde `Ubicaciones` y acción de guardado
- [x] Validar que la nueva ubicación no esté vacía ni repita exactamente la ubicación actual
- [x] Actualizar inmediatamente la ubicación mostrada en `Consulta De Ubicación` después del guardado
- [x] Sobrescribir la columna `C` del Excel original del usuario con la nueva ubicación
- [x] Actualizar la base persistida y el autocompletado para que reflejen el nuevo valor al instante
- [x] Agregar o actualizar el registro correspondiente en la tabla de `Ubicaciones` como listo para enviar o exportar
- [x] Mostrar una notificación clara indicando que la ubicación fue actualizada y agregada a `Ubicaciones`

## FASE 4: Ajustar mensajes, tutoriales y resúmenes

### Objetivo

Dejar la app más clara para el usuario cuando falta la base Excel y documentar el nuevo módulo.

- [x] Mejorar el mensaje visible en `Ubicaciones` cuando no hay Excel cargado indicando con precisión las columnas requeridas
- [x] Aclarar en el mensaje la estructura esperada del Excel: columna `A` código, `B` descripción, `C` ubicación y `D` stock
- [x] Actualizar el tutorial de `Ubicaciones` para reflejar la estructura exacta del Excel
- [x] Crear el tutorial de `Consulta De Ubicación` siguiendo el estilo de tutoriales ya existentes
- [x] Crear el resumen de `Consulta De Ubicación` para `Planes/Resumenes`
- [x] Verificar que los textos queden en español natural, con acentos correctos y consistentes con la app

## FASE 5: Sincronizar Ubicaciones con Excel original

### Objetivo

Reconstruir el estado completo del Excel cargado desde la lista actual de `Ubicaciones` cuando se guardan cambios importantes.

- [x] Definir que la lista de `Ubicaciones` escribe sobre la base en cada alta, edición, eliminación y limpieza total
- [x] Decidir que la sincronización se haga por reconstrucción completa de la base desde la lista actual de `Ubicaciones`
- [ ] Establecer si el flujo debe guardar una copia temporal antes de sobrescribir el Excel original
- [x] Alinear el comportamiento entre cambios hechos desde `Ubicaciones` y cambios hechos desde `Consulta De Ubicación`
- [x] Validar cómo se aplica la reconstrucción respetando columnas `A`, `B`, `C` y `D` en el modelo de datos

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que la consulta, la edición y la sincronización funcionan sin romper flujos existentes.

- [x] Verificar que inicio y drawer muestren `Consulta De Ubicación` en el orden definido
- [x] Entrar al nuevo módulo sin Excel cargado y comprobar que aparece el flujo reutilizado de carga
- [x] Buscar un artículo por código y confirmar que se muestra la ubicación, nombre y código correctos
- [x] Buscar un artículo por nombre y confirmar que la selección carga el resultado exacto
- [x] Probar el escaneo desde `Consulta De Ubicación` y verificar que completa la búsqueda como en otros módulos
- [x] Confirmar que el input de búsqueda se reacomoda con transición suave al mostrar resultados
- [x] Cambiar una ubicación desde `Consulta De Ubicación` y verificar actualización inmediata en pantalla
- [x] Confirmar que el Excel original queda actualizado en la columna `C`
- [x] Confirmar que la base cargada y el buscador usan la nueva ubicación sin recargar manualmente
- [x] Confirmar que el artículo actualizado aparece en `Ubicaciones` listo para enviar o exportar
- [x] Verificar que la notificación del guardado informe actualización de base y agregado a `Ubicaciones`
- [x] Revisar el mensaje sin Excel en `Ubicaciones` y confirmar que explica correctamente las columnas requeridas
- [x] Revisar tutoriales y resumen del nuevo módulo para asegurar coherencia con el comportamiento final

## Progreso del plan

- [x] Fase 1: Integrar acceso y navegación del nuevo módulo
- [x] Fase 2: Construir la consulta de ubicación
- [x] Fase 3: Permitir actualización de ubicación y sincronización total
- [x] Fase 4: Ajustar mensajes, tutoriales y resúmenes
- [ ] Fase 5: Sincronizar Ubicaciones con Excel original
- [x] Fase Testing

Fecha de creación: 06 de Abril 2026
Fecha de última actualización: 06 de Abril 2026
Estado: EN PROCESO
