# PLAN COMPARTIR UBICACIONES CON FIRESTORE

**Estado:** BORRADOR  
**Fecha:** 21 de julio de 2026

## Descripción

Incorporar, solo en la versión web de Ubicaciones, un tercer botón para compartir un enlace por WhatsApp. El enlace llevará a otra persona a Bitácora II en GitHub Pages, recuperará desde Firestore los códigos y ubicaciones compartidos y permitirá descargar el Excel final usando el Excel base que esa persona tenga cargado localmente.

Los botones web actuales de Enviar y Descargar se mantienen sin cambios. Android conserva exactamente su interfaz y sus flujos actuales.

## Objetivos

- Usar Firestore como buzón temporal remoto de datos de ubicaciones, no como almacenamiento de archivos Excel.
- Permitir que dos navegadores distintos intercambien una lista de ubicaciones mediante un enlace.
- Reutilizar el exportador, la validación de duplicados, el selector del Excel base y la apertura de WhatsApp ya existentes.
- Mantener la implementación acotada a una prueba sin autenticación, Firebase Storage, pagos, tarjetas ni vencimiento automático.

## Reglas de alcance

- El proyecto de Firebase se llamará visualmente **Bitácora II Prueba 1**. Si el identificador global `bitacora-ii-prueba-1` no estuviera disponible, se conservará ese nombre visible y se aceptará el identificador único que proponga Firebase.
- Firestore se creará en modo nativo y región `southamerica-east1` (São Paulo).
- No se almacenará el Excel base ni el Excel generado. Solo se guardarán `codigo`, `ubicacion`, usuario, cantidad, fecha y versión del formato.
- No habrá autenticación, usuarios Firebase, Firebase Storage, limpieza automática ni fecha de vencimiento en esta prueba.
- El documento tendrá como máximo 200 ubicaciones. Es suficiente para el uso previsto y evita acercarse al límite de tamaño de Firestore.
- La configuración privada localizada fuera del repositorio se consultará solo para configurar el entorno. No se copiará, publicará ni confirmará en Git.
- Al no haber autenticación, los datos compartidos deben ser exclusivamente operativos y no sensibles. Las reglas permitirán crear y leer un documento conocido, pero impedirán listar, editar y borrar documentos.

## Flujo final esperado

1. La persona A carga su Excel base local, registra ubicaciones y pulsa **Compartir por enlace** desde la web.
2. La aplicación normaliza la lista, valida que no haya códigos duplicados y guarda un único documento en Firestore.
3. La aplicación abre WhatsApp con un mensaje que contiene el enlace de recepción. No descarga ni adjunta un Excel en este flujo nuevo.
4. La persona B abre el enlace en Bitácora II desde la web. La aplicación obtiene el documento, muestra quién lo compartió y cuántas ubicaciones contiene.
5. Si la persona B todavía no tiene su Excel base cargado, la pantalla se lo solicita con el selector existente.
6. Con el Excel base listo, la persona B descarga el Excel final. La generación usa los datos de Firestore más su base local, sin sobrescribir sus ubicaciones guardadas en el navegador.

## FASE 1: Crear y asegurar Firebase para la prueba

- Crear el proyecto Firebase con nombre visible **Bitácora II Prueba 1**.
- Registrar únicamente la aplicación web y crear la base Firestore en modo nativo, región São Paulo.
- Instalar el SDK web `firebase` como dependencia de producción.
- Definir la configuración web mediante variables de entorno de compilación de Quasar y configurarlas también en el flujo de despliegue de GitHub Pages. No dejar valores privados en el repositorio.
- Crear reglas de Firestore específicas para la colección de enlaces compartidos:
  - permitir `create` solo con la estructura, tipos, límites de texto y máximo de 200 ubicaciones esperados;
  - permitir solamente `get` de un documento por su identificador;
  - negar `list`, `update` y `delete`;
  - no permitir campos del Excel ni datos fuera del formato acordado.
- Probar las reglas desde la consola de Firebase antes de conectarlas a la interfaz.

## FASE 2: Servicio reutilizable de ubicaciones compartidas

- Crear `ServicioCompartirUbicacionesFirestore.js` dentro de la lógica de Ubicaciones. El servicio centralizará la inicialización web de Firebase y no se ejecutará en Android.
- Exponer una función para publicar una lista y otra para recuperar un documento por identificador.
- Antes de publicar, convertir cada registro al formato mínimo `{ codigo, ubicacion }`, conservar el usuario, la cantidad y la fecha de creación, y validar el máximo de 200 elementos.
- Usar el identificador automático de Firestore como identificador opaco del enlace. No se diseñará ni mantendrá un sistema propio de IDs.
- Validar también la respuesta al leer: documento inexistente, estructura incorrecta o lista vacía deben mostrar un mensaje claro y no intentar generar ningún Excel.
- Mantener la lista recibida solo en memoria de la pantalla receptora; nunca guardarla en el almacenamiento local ni reemplazar las ubicaciones propias de quien recibe.

## FASE 3: Botón web de compartir por enlace

- Extender la configuración ya existente de `AjustarUbicaciones.vue` con un botón personalizado adicional, visible solo cuando `Capacitor.getPlatform()` sea `web`.
- Mantener sin modificación funcional el botón actual Enviar Excel, el botón Descargar Excel, el caché de Excel y el flujo nativo Android.
- Añadir la acción `compartir-enlace-ubicaciones` con icono y título accesible **Compartir por enlace**.
- Activarla solo cuando haya ubicaciones válidas, sin códigos duplicados y dentro del máximo de 200 registros. Este flujo no dependerá de que el caché del Excel esté listo porque envía datos, no un archivo.
- Mientras se publica, desactivar el botón y mostrar un estado de espera para impedir dobles pulsaciones y documentos duplicados.
- Al obtener el identificador, construir la URL con el router hash existente: `https://jleonn.github.io/Bit-cora-2-App-1/#/recibir-ubicaciones?id=<id>`.
- Reutilizar `abrirWhatsAppConMensaje` para abrir WhatsApp con un texto breve, nombre de quien comparte, cantidad de ubicaciones y el enlace.
- Ajustar la barra inferior solo si es necesario para que sus cinco controles entren sin desborde en pantallas angostas, conservando botones táctiles y títulos accesibles.

## FASE 4: Pantalla receptora y descarga del Excel

- Agregar la ruta `/recibir-ubicaciones` al router actual, dentro de `MainLayout`, y crear una página dedicada con nombre PascalCase.
- Leer el parámetro `id`, recuperar un único documento con el servicio y presentar un estado de carga, error o contenido recibido.
- Mostrar como mínimo usuario, fecha y cantidad de ubicaciones; no exponer ni buscar una colección completa de enlaces.
- Detectar si el Excel base local está disponible mediante la lógica actual de Ubicaciones. Si falta, integrar el selector existente y explicar que es necesario cargarlo antes de descargar.
- Reutilizar `generarYGuardarExcelUbicaciones` para descargar el resultado en web, manteniendo las columnas y el enriquecimiento con la base ya implementados.
- No incorporar los datos recibidos a `ubicacionesArray` persistente ni mostrar acciones de edición o eliminación sobre la lista recibida.

## FASE 5: Tutorial y documentación interna

- Actualizar el tutorial de Ubicaciones para explicar el tercer botón web y el requisito de que quien recibe tenga cargado su Excel base.
- Aclarar que el enlace comparte datos de ubicaciones, no el archivo Excel, y que Android no cambia en esta prueba.
- Documentar junto a la configuración de Firebase el nombre del proyecto, región, variables de entorno necesarias y las reglas de Firestore, sin incluir credenciales privadas.

## FASE TESTING

- Ejecutar ESLint y la compilación de producción.
- Probar desde dos perfiles o navegadores web diferentes:
  - persona A comparte 1, 50 y 200 ubicaciones válidas;
  - WhatsApp recibe una URL correcta;
  - persona B abre el enlace, carga su Excel base si falta y descarga el Excel esperado;
  - la descarga no modifica las ubicaciones locales de la persona B.
- Verificar que una lista con duplicados, vacía o mayor a 200 no se publique.
- Verificar mensajes claros para enlace sin `id`, documento inexistente, documento inválido y error de red.
- Comprobar en las reglas de Firestore que no se pueda listar, actualizar ni borrar documentos desde un cliente web.
- Probar ancho amplio y móvil: los tres botones de Ubicaciones visibles en web no deben desbordar.
- Confirmar en Android que no aparece el botón nuevo y que Enviar/Descargar continúan con el comportamiento actual.

## Progreso

- [ ] FASE 1: Firebase configurado y reglas verificadas.
- [ ] FASE 2: Servicio Firestore creado y validado.
- [ ] FASE 3: Botón web de compartir por enlace implementado.
- [ ] FASE 4: Pantalla receptora y descarga implementadas.
- [ ] FASE 5: Tutorial y documentación actualizados.
- [ ] FASE TESTING: Validaciones completadas.
