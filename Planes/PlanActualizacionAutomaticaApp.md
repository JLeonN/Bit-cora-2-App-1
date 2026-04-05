# PLAN ACTUALIZACIÓN AUTOMÁTICA DE LA APP

## Descripcion del plan

Implementar un flujo de detección de nueva versión para Android usando un archivo remoto publicado en GitHub Pages. Cuando exista una versión superior a la instalada, la app debe mostrar un modal al abrirse, permitir ir a Play Store o cancelar, mostrar un botón destacado dentro del drawer y señalar la novedad con un indicador rojo sobre el botón hamburguesa.

## Objetivo principal

- Detectar de forma confiable si existe una versión más nueva para Android
- Mostrar una actualización pendiente sin romper el flujo actual de la app
- Redirigir a Play Store desde el modal y desde el drawer
- Mantener una solución simple y controlada por configuración remota

## Reglas del plan

- Mantener los cambios acotados y evitar refactors grandes en una app que ya tiene partes mezcladas
- Usar español en variables, funciones, textos y comentarios nuevos
- Reutilizar los colores existentes de `src/css/app.css` y solo agregar uno nuevo si es realmente necesario
- No depender de scraping de Play Store ni de una librería externa innecesaria
- Tratar el archivo remoto de GitHub Pages como una URL fija y estable, separada de las rutas internas de la SPA
- Hacer que el modal reaparezca cada vez que el usuario abra la app mientras la actualización siga disponible
- Mostrar el botón del drawer y el indicador rojo del menú solo cuando haya actualización disponible

## FASE 1: Definir la fuente remota de actualización

### Objetivo

Dejar definido el contrato de datos remoto y la forma estable de consultarlo desde Android.

- [ ] Definir la estructura del archivo remoto `version.json` publicado en GitHub Pages
- [ ] Incluir en el contrato al menos `versionDisponible`, `urlPlayStore` y `mostrarActualizacion`
- [ ] Definir una URL fija para el JSON remoto evitando problemas de rutas relativos de GitHub Pages
- [ ] Documentar cómo se actualizará manualmente ese archivo cuando se publique una nueva versión
- [ ] Confirmar el `applicationId` o identificador usado para la URL final de Play Store

## FASE 2: Crear la lógica central de verificación

### Objetivo

Encapsular la lectura de versión instalada, la consulta remota y la comparación de versiones en una lógica simple y reutilizable.

- [ ] Revisar cómo obtener de forma confiable la versión instalada actual en la app Android con Capacitor o desde la configuración disponible del proyecto
- [ ] Crear un servicio, composable o módulo aislado para consultar el `version.json`
- [ ] Implementar la comparación semántica entre versión instalada y versión remota
- [ ] Devolver un estado claro con datos como `hayActualizacion`, `versionDisponible`, `urlPlayStore` y `debeMostrarModal`
- [ ] Contemplar fallos de red o JSON inválido sin romper el arranque de la app

## FASE 3: Mostrar el modal al abrir la app

### Objetivo

Integrar un modal claro y no intrusivo que aparezca al iniciar la app cuando exista una actualización pendiente.

- [ ] Identificar el punto de arranque más seguro para disparar la verificación inicial sin afectar el splash ni la carga principal
- [ ] Crear el modal de actualización con texto claro, versión disponible y botones `Actualizar` y `Cancelar`
- [ ] Hacer que el botón `Actualizar` abra la URL de Play Store
- [ ] Hacer que el botón `Cancelar` cierre el modal sin marcar la actualización como descartada permanente
- [ ] Verificar que al cerrar la app y volver a abrirla, el modal reaparezca si la actualización sigue disponible

## FASE 4: Integrar el estado visual en el drawer y en el menú

### Objetivo

Mostrar la actualización pendiente de forma visible pero consistente con el layout actual.

- [ ] Revisar el layout actual del drawer y del botón hamburguesa para insertar el nuevo estado visual con cambios mínimos
- [ ] Agregar en el drawer un botón destacado con texto similar a `Actualización disponible`
- [ ] Hacer que el botón del drawer abra la misma URL de Play Store
- [ ] Mostrar el botón del drawer solo cuando `hayActualizacion` sea verdadero
- [ ] Agregar un indicador rojo pequeño y llamativo sobre el botón hamburguesa cuando exista una actualización pendiente
- [ ] Ajustar estilos del botón destacado usando variables existentes de `src/css/app.css` y crear un color nuevo solo si el contraste lo exige

## FASE 5: Ajustar textos, estados y tolerancia a fallos

### Objetivo

Pulir la experiencia para que el flujo sea claro, estable y fácil de mantener.

- [ ] Redactar mensajes cortos y naturales en español para el modal y el botón del drawer
- [ ] Evitar que se muestren elementos de actualización si la consulta remota falla
- [ ] Verificar que el flujo no interfiera con el drawer, la navegación ni otros modales existentes
- [ ] Confirmar que el comportamiento sea consistente tanto al abrir la app por primera vez como en aperturas posteriores
- [ ] Dejar preparado un punto claro donde cambiar la URL remota o la URL de Play Store si más adelante cambia la publicación

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que la detección y visualización de actualización funcionen correctamente sin romper la app.

- [ ] Probar un escenario sin actualización disponible y verificar que no aparezcan modal, botón del drawer ni indicador rojo
- [ ] Probar un escenario con actualización disponible y verificar que el modal aparezca al abrir la app
- [ ] Presionar `Cancelar`, cerrar la app y volver a abrirla para confirmar que el modal reaparece
- [ ] Verificar que el botón `Actualizar` del modal abra la Play Store correcta
- [ ] Verificar que el botón `Actualización disponible` del drawer aparezca solo cuando corresponde y abra la misma URL
- [ ] Verificar visualmente que el indicador rojo del botón hamburguesa sea visible y no deforme el header
- [ ] Confirmar que si falla la descarga del `version.json` la app siga funcionando sin errores visibles graves
- [ ] Ejecutar lint o revisión equivalente sobre los archivos modificados y corregir cualquier error introducido

## Progreso del plan

- [ ] Fase 1: Definir la fuente remota de actualización
- [ ] Fase 2: Crear la lógica central de verificación
- [ ] Fase 3: Mostrar el modal al abrir la app
- [ ] Fase 4: Integrar el estado visual en el drawer y en el menú
- [ ] Fase 5: Ajustar textos, estados y tolerancia a fallos
- [ ] Fase Testing

Fecha de creacion: 05 de Abril 2026
Fecha de ultima actualizacion: 05 de Abril 2026
Estado: BORRADOR
