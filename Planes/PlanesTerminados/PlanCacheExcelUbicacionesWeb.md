# PLAN CACHÉ EXCEL UBICACIONES WEB

## Descripción del plan

Preparar y conservar en memoria el Excel de Ubicaciones para compartir desde la versión web. El archivo se regenerará solo cuando cambien sus datos de origen, evitando trabajo repetido al navegar dentro de la SPA. Android y las demás secciones quedan fuera de este plan.

## Objetivo principal

- Permitir compartir el Excel de Ubicaciones desde web con un solo toque cuando el archivo ya está listo.
- Evitar generaciones duplicadas o innecesarias del Excel.
- Reutilizar el archivo preparado mientras sus datos sigan vigentes.

## Reglas del plan

- Aplicar los cambios únicamente en la versión web y en el apartado Ubicaciones.
- No modificar el flujo actual de generación, descarga ni compartir de Android.
- Mantener un único archivo Excel válido en memoria para Ubicaciones; no guardar archivos temporales ni persistirlos.
- Considerar inválida la caché al cambiar ubicaciones, Excel base o nombre de usuario.

## FASE 1: Servicio de caché web

### Objetivo

Crear un servicio reutilizable que controle la versión vigente, la generación en curso y el archivo Excel listo para Ubicaciones.

- [x] Crear un servicio con nombre PascalCase para almacenar en memoria el `File` de Excel, su firma de datos y la promesa de generación activa.
- [x] Construir una firma que incluya las ubicaciones exportadas, la identidad del Excel base cargado y el nombre de usuario usado en el archivo.
- [x] Reutilizar el archivo existente cuando la firma coincida, incluso al desmontar y volver a montar la página dentro de la misma sesión web.
- [x] Invalidar de inmediato el archivo anterior cuando la firma cambie y conservar solo la última versión válida.
- [x] Evitar generaciones simultáneas para la misma firma mediante una única promesa compartida.

## FASE 2: Preparación reactiva en Ubicaciones

### Objetivo

Mantener el Excel preparado en segundo plano solo cuando cambien los datos que lo componen.

- [x] Programar la regeneración web con una espera de 400 ms después de cada cambio para agrupar acciones consecutivas.
- [x] Disparar la invalidación y regeneración al agregar, editar, eliminar o eliminar todas las ubicaciones.
- [x] Disparar la invalidación y regeneración al cargar, reemplazar o limpiar el Excel base de búsqueda.
- [x] Iniciar la preparación al entrar a Ubicaciones y reutilizar la caché si la firma sigue vigente.
- [x] Cancelar o ignorar resultados obsoletos si los datos cambian durante una generación.

## FASE 3: Estado visual y acciones web

### Objetivo

Reflejar si el Excel está listo en la barra inferior y usar la versión en memoria para enviar o descargar.

- [x] Extender la barra inferior con un ícono y título de Enviar configurables, conservando el ícono actual como valor predeterminado para el resto de la app.
- [x] Mostrar reloj y desactivar Enviar en Ubicaciones web mientras el Excel se prepara o queda invalidado.
- [x] Restaurar el ícono Enviar y habilitarlo cuando exista una versión válida en caché.
- [x] En web, iniciar la descarga del `File` preparado y abrir WhatsApp en el mismo toque con un mensaje predefinido, usuario y cantidad de ubicaciones para adjuntarlo manualmente.
- [x] Usar el mismo archivo preparado para Descargar en web, manteniendo la descarga manual como alternativa.
- [x] Mantener el aviso de navegador no compatible y no descargar automáticamente en ese caso.

## FASE TESTING

### Objetivo

Validar la caché, el estado visual y los flujos web sin afectar Android.

- [ ] Entrar, salir y volver a Ubicaciones sin cambios; verificar que se reutiliza el Excel listo y no se vuelve a generar.
- [ ] Agregar, editar, eliminar y eliminar todas las ubicaciones; verificar reloj, regeneración única y archivo actualizado.
- [ ] Cargar o limpiar el Excel base; verificar invalidación y regeneración del archivo de Ubicaciones.
- [ ] Hacer cambios rápidos consecutivos y comprobar que se genera una sola versión luego de 400 ms.
- [ ] En navegador, verificar que Enviar descarga el Excel y abre WhatsApp con el mensaje predefinido en un toque.
- [ ] Verificar que Descargar baja el mismo Excel preparado.
- [ ] En navegador no compatible, verificar que el Excel se descarga y se informa que puede enviarse desde Descargas.
- [ ] Comprobar Android para asegurar que conserva su flujo nativo actual.
- [x] Ejecutar ESLint y compilación de producción.

## Progreso del plan

- [x] Fase 1: Servicio de caché web
- [x] Fase 2: Preparación reactiva en Ubicaciones
- [x] Fase 3: Estado visual y acciones web
- [ ] Fase Testing

Fecha de creación: 20 de Julio 2026
Fecha de última actualización: 20 de Julio 2026
Estado: EN PROCESO
