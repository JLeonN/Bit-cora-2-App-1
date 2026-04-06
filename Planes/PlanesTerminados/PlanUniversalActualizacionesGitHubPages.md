# PLAN UNIVERSAL ACTUALIZACIONES GITHUB PAGES

## Descripcion del plan

Plan universal para implementar o mantener un sistema de aviso de actualización en proyectos Android que publiquen un `version.json` en GitHub Pages. Este plan está pensado para que una IA pueda ejecutarlo en proyectos nuevos o existentes, contemplando especialmente apps hechas con Vue, Quasar y Capacitor, sin cerrar la puerta a proyectos viejos en React o React Native.

## Objetivo principal

- Usar `version.json` como estándar para detectar versiones nuevas
- Mantener la app Android compatible con GitHub Pages sin romper rutas
- Mostrar al usuario un aviso claro cuando haya una actualización disponible
- Automatizar la generación de `version.json` desde la versión real del proyecto
- Dejar un flujo reutilizable para proyectos futuros o proyectos ya existentes

## Reglas del plan

- Antes de escribir o editar código, revisar la estructura y convenciones del proyecto actual
- Si el proyecto tiene `AGENTS.md`, leerlo completo y obedecerlo
- Mantener textos, variables y documentación en español si el proyecto ya trabaja en español
- No asumir que GitHub Pages ya existe; verificarlo explícitamente
- No asumir que todas las apps usan el mismo stack; detectar primero si el proyecto es Vue, Quasar, Capacitor, React web o React Native
- Para Android, tratar siempre la URL de `version.json` como absoluta y nunca relativa al frontend
- No usar scraping de Play Store
- No editar manualmente `version.json` si el proyecto ya lo genera de forma automática desde la versión del proyecto
- Si faltan datos críticos, preguntar antes de implementar

## Preguntas obligatorias antes de ejecutar

### Objetivo

Recolectar los datos mínimos para que la implementación no quede incompleta ni atada a supuestos falsos.

- [x] Preguntar si el proyecto ya tiene GitHub Pages funcionando
- [x] Preguntar cuál es la URL de la app en Play Store
- [x] Preguntar si el proyecto ya tiene alguna lógica previa de actualización o si se implementará desde cero
- [x] Preguntar si `version.json` debe generarse automáticamente desde la versión del proyecto
- [x] Preguntar si el proyecto es Android puro con web embebida, Vue con Capacitor, React con Capacitor o React Native
- [x] Preguntar si el usuario quiere modal al abrir la app, botón en menú o ambas cosas

## FASE 1: Detectar el estado del proyecto

### Objetivo

Entender si se está trabajando sobre un proyecto nuevo, uno parcialmente preparado o uno que ya tiene parte del flujo resuelto.

- [x] Verificar si existe configuración de GitHub Pages o workflow de publicación
- [x] Verificar si existe `public/version.json` o un archivo equivalente
- [x] Verificar si el proyecto ya usa Capacitor
- [x] Verificar cómo se define la versión actual del proyecto
- [x] Verificar si ya existe algún script que genere archivos antes del build
- [x] Detectar si el proyecto ya tiene una ruta de compilación para Android

## FASE 2: Resolver GitHub Pages

### Objetivo

Dejar claro si solo hay que consumir GitHub Pages o si también hay que crearlo.

- [x] Si GitHub Pages no existe, crear el flujo de publicación desde el propio proyecto
- [ ] Si GitHub Pages ya existe, reutilizar la publicación actual sin duplicar infraestructura
- [x] Definir la URL pública final donde vivirá `version.json`
- [x] Confirmar el nombre del repositorio para calcular correctamente la URL pública
- [x] Documentar si la publicación se hace por rama, carpeta `docs` o GitHub Actions

## FASE 3: Blindar rutas entre web y Android

### Objetivo

Evitar el problema clásico donde GitHub Pages funciona en navegador pero la app Android queda en blanco por rutas mal resueltas.

- [x] Revisar si el proyecto necesita `publicPath` condicional o una base equivalente
- [ ] Verificar que la app web publicada en GitHub Pages siga resolviendo sus assets correctamente
- [x] Verificar que la app Android no dependa de rutas relativas pensadas para GitHub Pages
- [x] Mantener `version.json` fuera de cualquier lógica de navegación interna
- [x] Usar siempre una URL absoluta para consultar `version.json`
- [x] Documentar explícitamente el criterio técnico para no mezclar rutas web y rutas Android

## FASE 4: Definir y generar version.json

### Objetivo

Unificar la fuente remota de versión y evitar mantenimiento manual innecesario.

- [x] Definir la estructura estándar de `version.json`
- [x] Incluir al menos `versionDisponible`, `urlPlayStore` y `mostrarActualizacion`
- [x] Generar `version.json` automáticamente desde la versión real del proyecto si el stack lo permite
- [x] Reutilizar el valor existente de `urlPlayStore` si el archivo ya existe
- [x] Evitar que el usuario tenga que editar manualmente la versión en más de un lugar
- [x] Verificar que `version.json` se publique junto con el build

## FASE 5: Crear la lógica de verificación

### Objetivo

Consultar la versión remota, compararla con la instalada y devolver un estado claro para la interfaz.

- [x] Obtener la versión instalada desde la fuente real del proyecto
- [x] Consultar `version.json` con `fetch` o la técnica equivalente del stack
- [x] Comparar versiones semánticas de forma segura
- [x] Devolver un estado claro con `hayActualizacion`, `versionDisponible`, `urlPlayStore` y `debeMostrarModal`
- [x] Tolerar errores de red, JSON inválido o falta de datos sin romper la app
- [x] Evitar mostrar avisos si la información remota es inconsistente

## FASE 6: Integrar aviso al usuario

### Objetivo

Mostrar la actualización disponible de una forma visible, simple y consistente con el proyecto.

- [x] Implementar modal de actualización al abrir la app si el usuario lo pidió
- [x] Implementar botón visible en menú o drawer si el usuario lo pidió
- [x] Hacer que ambos usen la misma URL de Play Store
- [x] Permitir cancelar el modal sin marcar la actualización como descartada permanente, salvo que el proyecto pida otra cosa
- [ ] Si el usuario cancela y vuelve a abrir la app, decidir si el modal reaparece según la regla del proyecto
- [x] Mantener el estilo visual alineado con el proyecto actual

## FASE 7: Adaptar según tecnología

### Objetivo

Aplicar la misma idea general sin asumir el mismo tipo de proyecto en todos los repositorios.

- [x] Si el proyecto es Vue o Quasar con Capacitor, integrar la lógica en el layout o punto de arranque principal
- [ ] Si el proyecto es React web con Capacitor, integrar la lógica en el layout raíz o en el contenedor principal
- [ ] Si el proyecto es React Native, detectar primero cómo obtiene la versión instalada y cómo abre Play Store
- [ ] Si React Native no tiene una librería estándar ya presente, no inventar; documentar la adaptación necesaria antes de implementar
- [x] Priorizar siempre el stack real del proyecto actual sobre cualquier receta genérica

## FASE 8: Documentar mantenimiento

### Objetivo

Dejar el sistema entendible para futuras IAs y para el usuario sin depender de memoria informal.

- [x] Documentar dónde vive `version.json`
- [x] Documentar cómo se genera
- [x] Documentar cómo se publica en GitHub Pages
- [x] Documentar qué archivo controla la versión oficial del proyecto
- [x] Documentar cómo cambiar la URL de Play Store si cambia el identificador de la app
- [x] Documentar el flujo mínimo para publicar una nueva versión sin romper el sistema de aviso

## FASE TESTING

### Objetivo

Validar que el flujo funcione tanto en web publicada como en Android real.

- [ ] Verificar que GitHub Pages publique correctamente `version.json`
- [ ] Verificar que la URL pública de `version.json` responda bien desde fuera del proyecto
- [ ] Probar la app web publicada y confirmar que no falle por rutas
- [ ] Probar la app Android y confirmar que no aparezca pantalla blanca
- [ ] Probar un escenario sin actualización disponible
- [ ] Probar un escenario con actualización disponible
- [ ] Verificar que el modal y el botón del menú abran la URL correcta de Play Store
- [ ] Verificar que si falla la descarga de `version.json` la app siga funcionando sin errores visibles graves
- [x] Ejecutar lint, build o el proceso equivalente según el stack

## Progreso del plan

- [x] Preguntas obligatorias antes de ejecutar
- [x] Fase 1: Detectar el estado del proyecto
- [x] Fase 2: Resolver GitHub Pages
- [ ] Fase 3: Blindar rutas entre web y Android
- [x] Fase 4: Definir y generar version.json
- [x] Fase 5: Crear la lógica de verificación
- [x] Fase 6: Integrar aviso al usuario
- [x] Fase 7: Adaptar según tecnología
- [x] Fase 8: Documentar mantenimiento
- [ ] Fase Testing

Fecha de creacion: 06 de Abril 2026
Fecha de ultima actualizacion: 06 de Abril 2026
Estado: EN PROCESO
