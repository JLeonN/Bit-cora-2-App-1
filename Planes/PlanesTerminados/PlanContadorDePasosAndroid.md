# PLAN CONTADOR DE PASOS ANDROID

## Descripción del plan

Implementar un apartado nuevo de contador de pasos en la app Android con monitoreo continuo, registro diario con reinicio a las 00:00, sesiones manuales tipo cronómetro y visualización en dashboard, inicio y header.

## Objetivo principal

- Contar pasos de forma local en Android y mantener registro diario persistente
- Permitir sesiones manuales desde cero con inicio, detención y cierre automático a medianoche
- Mostrar pasos en tarjetas de inicio/dashboard y en el header según estado de sesión activa

## Reglas del plan

- Implementar solo para Android
- Guardar todo en almacenamiento local con Preferences (sin SQLite en esta fase)
- Usar implementación nativa Android con sensor de pasos y Foreground Service para monitoreo 24/7
- Permitir una sola sesión manual activa a la vez
- Reiniciar contador diario a las 00:00 hora local del teléfono
- Cerrar automáticamente la sesión manual activa a las 00:00
- Si el sistema interrumpe el servicio o reinicia el teléfono, cerrar sesión como interrumpida y registrar evento
- Mantener visible el contador de pasos en el header con prioridad visual sobre el nombre
- Guardar checkpoints de pasos en Preferences en cada cambio de pasos y también cada 15 segundos como respaldo

## FASE 1: Definir arquitectura técnica y persistencia local

### Objetivo

Dejar definida y cerrada la integración Android nativa para pasos en segundo plano y la estructura de datos local en Preferences para pasos diarios, sesiones manuales y eventos de interrupción.

- [x] Revisar la estructura actual del proyecto para ubicar módulo, rutas y patrón de persistencia existente
- [x] Definir y documentar implementación nativa Android con sensor de pasos y Foreground Service como arquitectura oficial
- [x] Definir esquema de datos en Preferences para pasos diarios (fecha, totalPasos, ultimaActualizacion)
- [x] Definir esquema de datos en Preferences para sesiones (id, inicio, fin, pasosSesion, estado, motivoCierre)
- [x] Definir esquema de datos en Preferences para eventos del sistema (fechaHora, tipoEvento, detalle)
- [x] Crear capa de acceso a datos con funciones en español y tipado consistente del proyecto

## FASE 2: Implementar captura de pasos en segundo plano Android

### Objetivo

Capturar pasos de forma continua en Android mediante sensor y servicio en segundo plano con persistencia local.

- [x] Integrar la opción técnica definida en Fase 1 para lectura de sensor de pasos en Android
- [x] Implementar servicio de monitoreo continuo compatible con app cerrada
- [x] Configurar permisos y manifiesto Android requeridos por sensor y servicio
- [x] Persistir incrementos de pasos del día en Preferences sin depender de conexión
- [x] Implementar guardado de checkpoints en cada cambio de pasos y respaldo temporal cada 15 segundos
- [x] Registrar estado de monitoreo para recuperar continuidad al reabrir la app

## FASE 3: Implementar reglas de negocio diario y sesiones manuales

### Objetivo

Aplicar reglas de reinicio diario, sesiones tipo cronómetro y cierres automáticos/interrumpidos.

- [x] Implementar reinicio automático del contador diario a las 00:00 local
- [x] Implementar inicio de sesión manual desde cero con una sola sesión activa
- [x] Implementar detención manual de sesión y guardado final de métricas
- [x] Implementar cierre automático de sesión activa a las 00:00 con estado finalizadaPorReinicioDiario
- [x] Implementar cierre por interrupción del sistema/reinicio de teléfono con estado interrumpida
- [x] Implementar cálculo y actualización de resumen de 7 días, 30 días y agrupación mensual

## FASE 4: Integrar UI en dashboard, inicio y apartado dedicado

### Objetivo

Mostrar datos de pasos y sesiones en la interfaz con la ubicación acordada y comportamiento del header.

- [x] Agregar tarjeta de contador de pasos debajo de Etiquetas en dashboard
- [x] Agregar tarjeta de contador de pasos debajo de Etiquetas en inicio
- [x] Crear y registrar la nueva ruta `/ContadorPasos` del apartado en el router
- [x] Crear apartado dedicado de contador de pasos con resumen diario e historial
- [x] Mantener el nombre de usuario visible en header y mostrar pasos en el centro sin reemplazarlo
- [x] Priorizar visualmente los pasos en header cuando el espacio horizontal sea limitado
- [x] Implementar ajuste automático: mover pasos hacia la derecha hasta un límite coherente y luego truncar nombre con puntos suspensivos
- [x] Mostrar en header pasos diarios cuando no haya sesión activa
- [x] Mostrar en header pasos de sesión cuando exista sesión activa
- [x] Agregar controles iniciar/detener sesión con estados claros y bloqueo de sesiones simultáneas
- [x] Mostrar historial diario por fecha y vistas rápidas de 7 días, 30 días y mensual
- [x] Mostrar historial de sesiones con inicio, fin, pasos y estado (finalizada o interrumpida)
- [x] Agregar acceso al nuevo apartado desde la sección de Tutoriales y Ayuda en Configuración

## FASE 5: Integrar tutorial del contador de pasos

### Objetivo

Incorporar en Configuración un tutorial breve del contador de pasos siguiendo el patrón de tutoriales existente en la app.

- [x] Revisar estructura y estilo de los tutoriales actuales para mantener consistencia
- [x] Crear el nuevo tutorial del contador de pasos con contenido breve y claro
- [x] Integrar el tutorial en la sección Tutoriales y Ayuda de Configuración
- [x] Verificar navegación correcta hacia el tutorial nuevo y visualización en móvil

## FASE 6: Manejo de permisos, estados de sistema y mensajes al usuario

### Objetivo

Reducir fallos operativos y hacer explícitos los estados del monitoreo en Android.

- [x] Implementar flujo de solicitud y validación de permisos en tiempo de ejecución
- [x] Detectar si el sistema pausó el monitoreo y reflejar estado en UI
- [x] Mostrar aviso claro cuando una sesión termine por interrupción del sistema
- [x] Mostrar estado de monitoreo activo/inactivo en el apartado y tarjeta resumen
- [x] Documentar recomendaciones para optimización de batería del dispositivo cuando aplique

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano la precisión funcional del contador diario, sesiones y continuidad en Android.

- [x] Verificar que el contador diario incremente pasos con app abierta y cerrada
- [x] Verificar persistencia local de pasos tras cerrar y reabrir la app
- [x] Verificar reinicio diario a las 00:00 y creación correcta del nuevo registro de día
- [x] Verificar que una sesión manual inicie en cero y acumule pasos correctamente
- [x] Verificar que la sesión manual se detenga al pulsar detener y guarde inicio/fin/pasos
- [x] Verificar cierre automático de sesión a las 00:00 cuando esté activa
- [x] Simular reinicio/interrupción del sistema y verificar sesión marcada como interrumpida
- [x] Verificar visualización correcta en dashboard e inicio debajo de Etiquetas
- [x] Verificar cambio dinámico del header entre pasos diarios y pasos de sesión activa
- [x] Verificar visibilidad simultánea de nombre y pasos en header en distintos tamaños de pantalla
- [x] Verificar truncado del nombre con puntos suspensivos cuando el ancho no alcance
- [x] Verificar resumen de 7 días, 30 días y agrupación mensual con datos consistentes
- [x] Verificar presencia y acceso correcto del tutorial nuevo en Configuración > Tutoriales y Ayuda

## Progreso del plan

- [x] Fase 1: Definir arquitectura técnica y persistencia local
- [x] Fase 2: Implementar captura de pasos en segundo plano Android
- [x] Fase 3: Implementar reglas de negocio diario y sesiones manuales
- [x] Fase 4: Integrar UI en dashboard, inicio y apartado dedicado
- [x] Fase 5: Integrar tutorial del contador de pasos
- [x] Fase 6: Manejo de permisos, estados de sistema y mensajes al usuario
- [x] Fase Testing

Fecha de creación: 23 de Mayo 2026
Fecha de última actualización: 23 de Mayo 2026
Estado: COMPLETADO
