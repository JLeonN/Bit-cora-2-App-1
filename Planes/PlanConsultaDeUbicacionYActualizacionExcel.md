# PLAN CONSULTA DE UBICACIÓN Y ACTUALIZACIÓN DE EXCEL

## Descripcion del plan

Agregar un nuevo apartado llamado `Consulta De Ubicación` en la app, visible tanto en el inicio como en el drawer, para consultar rápidamente la ubicación de un artículo usando escaneo, código o nombre. Además, reforzar el módulo `Ubicaciones` para que los cambios de ubicación actualicen el Excel original del usuario, impacten en la base cargada de forma inmediata y queden listos en la tabla de ubicaciones para enviar/exportar. También se debe ajustar la ayuda visible cuando no hay Excel cargado, actualizar tutoriales y crear el resumen del nuevo módulo.

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
- Cada cambio hecho desde `Consulta De Ubicación` debe agregarse también a `Ubicaciones` como listo para enviar/exportar
- Si no hay Excel cargado, reutilizar el flujo de carga existente en vez de crear uno distinto
- No tocar por ahora la columna `D` de stock ni ampliar el comportamiento del buscador inteligente

## FASE 1: Integrar acceso y navegación del nuevo módulo

### Objetivo

Incorporar `Consulta De Ubicación` como sección principal consistente con la navegación actual.

- [ ] Agregar la nueva tarjeta en el inicio con el orden definido entre `Ubicaciones` y `Etiquetas`
- [ ] Agregar la opción `Consulta De Ubicación` en el drawer respetando el mismo orden
- [ ] Crear la nueva ruta y página base del módulo siguiendo la estructura actual del proyecto
- [ ] Mantener el estilo visual de tarjetas, navegación inferior y transiciones consistente con los módulos existentes

## FASE 2: Construir la consulta de ubicación

### Objetivo

Permitir buscar un artículo y mostrar su ubicación de forma clara, rápida y enfocada en móvil.

- [ ] Reutilizar el sistema de carga de Excel existente cuando el usuario entre sin base cargada
- [ ] Reutilizar el buscador inteligente actual para búsquedas por escaneo, código o nombre
- [ ] Mostrar resultado exacto con `Ubicación` en mayor jerarquía visual, `Nombre` debajo y `Código` visible
- [ ] Mantener el input de búsqueda centrado al inicio y desplazarlo suavemente hacia arriba al mostrar resultados
- [ ] Dejar el input listo para nuevas consultas sin romper el flujo de lectura del resultado actual
- [ ] Mantener botón de cámara y comportamiento alineado con otros módulos

## FASE 3: Permitir actualización de ubicación y sincronización total

### Objetivo

Hacer que la consulta también permita corregir una ubicación y propagar ese cambio a todos los puntos necesarios.

- [ ] Mostrar un botón para habilitar la edición de ubicación del artículo consultado
- [ ] Desplegar suavemente un bloque de edición con input reutilizado desde `Ubicaciones` y acción de guardado
- [ ] Validar que la nueva ubicación no esté vacía ni repita exactamente la ubicación actual
- [ ] Actualizar inmediatamente la ubicación mostrada en `Consulta De Ubicación` después del guardado
- [ ] Sobrescribir la columna `C` del Excel original del usuario con la nueva ubicación
- [ ] Actualizar la base persistida y el autocompletado para que reflejen el nuevo valor al instante
- [ ] Agregar o actualizar el registro correspondiente en la tabla de `Ubicaciones` como listo para enviar/exportar
- [ ] Mostrar una notificación clara indicando que la ubicación fue actualizada y agregada a `Ubicaciones`

## FASE 4: Ajustar mensajes, tutoriales y resumenes

### Objetivo

Dejar la app más clara para el usuario cuando falta la base Excel y documentar el nuevo módulo.

- [ ] Mejorar el mensaje visible en `Ubicaciones` cuando no hay Excel cargado indicando con precisión las columnas requeridas
- [ ] Aclarar en el mensaje la estructura esperada del Excel: columna `A` código, `B` descripción, `C` ubicación y `D` stock
- [ ] Actualizar el tutorial de `Ubicaciones` para reflejar la estructura exacta del Excel
- [ ] Crear el tutorial de `Consulta De Ubicación` siguiendo el estilo de tutoriales ya existentes
- [ ] Crear el resumen de `Consulta De Ubicación` para `Planes/Resumenes`
- [ ] Verificar que los textos queden en español natural, con acentos correctos y consistentes con la app

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que la consulta, la edición y la sincronización funcionan sin romper flujos existentes.

- [ ] Verificar que inicio y drawer muestren `Consulta De Ubicación` en el orden definido
- [ ] Entrar al nuevo módulo sin Excel cargado y comprobar que aparece el flujo reutilizado de carga
- [ ] Buscar un artículo por código y confirmar que se muestra la ubicación, nombre y código correctos
- [ ] Buscar un artículo por nombre y confirmar que la selección carga el resultado exacto
- [ ] Probar el escaneo desde `Consulta De Ubicación` y verificar que completa la búsqueda como en otros módulos
- [ ] Confirmar que el input de búsqueda se reacomoda con transición suave al mostrar resultados
- [ ] Cambiar una ubicación desde `Consulta De Ubicación` y verificar actualización inmediata en pantalla
- [ ] Confirmar que el Excel original queda actualizado en la columna `C`
- [ ] Confirmar que la base cargada y el buscador usan la nueva ubicación sin recargar manualmente
- [ ] Confirmar que el artículo actualizado aparece en `Ubicaciones` listo para enviar/exportar
- [ ] Verificar que la notificación del guardado informe actualización de base y agregado a `Ubicaciones`
- [ ] Revisar el mensaje sin Excel en `Ubicaciones` y confirmar que explica correctamente las columnas requeridas
- [ ] Revisar tutoriales y resumen del nuevo módulo para asegurar coherencia con el comportamiento final

## Progreso del plan

- [ ] Fase 1: Integrar acceso y navegación del nuevo módulo
- [ ] Fase 2: Construir la consulta de ubicación
- [ ] Fase 3: Permitir actualización de ubicación y sincronización total
- [ ] Fase 4: Ajustar mensajes, tutoriales y resumenes
- [ ] Fase Testing

Fecha de creacion: 06 de Abril 2026
Fecha de ultima actualizacion: 06 de Abril 2026
Estado: BORRADOR
