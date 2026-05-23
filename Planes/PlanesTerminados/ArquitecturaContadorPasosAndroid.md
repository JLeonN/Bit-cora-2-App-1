# ARQUITECTURA CONTADOR DE PASOS ANDROID

## Objetivo

Definir la arquitectura oficial para soportar conteo de pasos 24/7 en Android, con app abierta, cerrada o en segundo plano.

## Decisión técnica oficial

- Sensor nativo Android: `TYPE_STEP_COUNTER`.
- Servicio persistente Android: `Foreground Service`.
- Persistencia local: `@capacitor/preferences`.
- Sin SQLite en esta fase.

## Flujo operativo

- El servicio nativo escucha cambios del sensor de pasos.
- En cada cambio de pasos se envía evento a la capa web y se guarda checkpoint local.
- Además del guardado por evento, se ejecuta respaldo temporal cada 15 segundos.
- La capa web actualiza:
  - Registro diario (fecha, totalPasos, ultimaActualizacion).
  - Sesión activa (si existe).
  - Estado de monitoreo.
  - Eventos de interrupción/reinicio.

## Estructura de datos en Preferences

- `pasos_diarios_v1`: arreglo de registros `{ fecha, totalPasos, ultimaActualizacion }`.
- `sesiones_pasos_v1`: arreglo de sesiones `{ id, inicio, fin, pasosSesion, estado, motivoCierre }`.
- `eventos_pasos_v1`: arreglo de eventos `{ fechaHora, tipoEvento, detalle }`.
- `estado_monitoreo_pasos_v1`: objeto `{ activo, ultimaActualizacion, origen }`.
- `checkpoint_pasos_v1`: objeto `{ fecha, fechaHora, pasosTotalesSensor, pasosDiaActual }`.

## Reglas de sesión

- Solo se permite una sesión activa.
- Cierre manual: `estado=finalizada`, `motivoCierre=manual`.
- Cierre automático 00:00: `estado=finalizada`, `motivoCierre=finalizadaPorReinicioDiario`.
- Interrupción del sistema/reinicio: `estado=interrumpida`, `motivoCierre=interrumpida`.

## Integración prevista en Android

- Plugin Capacitor personalizado en `src-capacitor/android` para exponer:
  - `iniciarMonitoreoPasos()`
  - `detenerMonitoreoPasos()`
  - `obtenerEstadoMonitoreo()`
  - `obtenerUltimoValorSensor()`
- BroadcastReceiver para `BOOT_COMPLETED` y restauración de monitoreo.
- Notificación persistente obligatoria del Foreground Service.

## Riesgos controlados

- Fabricantes con política agresiva de batería pueden pausar servicios.
- Se mitigará con:
  - Foreground Service activo.
  - Guardado frecuente en checkpoints.
  - Señalización de estado para usuario.

