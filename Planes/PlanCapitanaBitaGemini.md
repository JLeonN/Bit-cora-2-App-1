# PLAN DE INTEGRACIÓN DE CAPITANA BITA CON GEMINI

## Descripción del plan

Integrar en Listados una asistente llamada **Capitana Bita** capaz de recibir texto libre o una grabación de voz, interpretar pedidos de repuestos de motos y resolver cada artículo exclusivamente contra el Excel maestro cargado en el dispositivo.

La inteligencia artificial se utilizará para comprender lenguaje natural, separar artículos, descartar conversación irrelevante y proponer términos alternativos. Gemini no podrá inventar códigos, stock, ubicaciones ni artículos. `ServicioBusquedaArticulos.js` y el Excel maestro continuarán siendo la fuente determinista de resultados.

La primera versión funcionará en navegador, localhost y Android. La integración utilizará Firebase AI Logic con Gemini Developer API en el nivel gratuito, Firebase App Check con reCAPTCHA Enterprise para web y Play Integrity para Android.

## Objetivo principal

- Incorporar texto y voz como entradas de Capitana Bita sin alterar la búsqueda manual existente.
- Procesar listas extensas de artículos en una única solicitud.
- Agregar inmediatamente coincidencias locales únicas.
- Mostrar ambigüedades y artículos no encontrados en un panel dentro de la página, sin modales.
- Guardar equivalencias contextuales solamente cuando el usuario lo solicite expresamente.
- Permitir editar y eliminar memorias desde Configuración.
- Mantener toda la aplicación manual operativa cuando no exista internet, Gemini falle o se agote la cuota.
- Dejar servicios y componentes reutilizables para incorporar Capitana Bita en otros módulos en planes posteriores.

## Arquitectura obligatoria

```text
Texto o grabación
        ↓
ServicioCapitanaBita
        ↓
Firebase AI Logic + App Check
        ↓
Gemini devuelve JSON estructurado
        ↓
ResolverSolicitudesCapitanaBita
        ↓
Memorias contextuales + ServicioBusquedaArticulos + Excel maestro
        ↓
Coincidencia única / ambigüedad / no encontrado
        ↓
PaginaListados
```

Firebase no reemplaza el Excel ni almacena el maestro. Firebase identifica la aplicación, valida App Check y autoriza la llamada a Gemini. No se debe crear una Cloud Function ni un servidor propio en esta fase.

## Contexto técnico verificado

- El proyecto usa Vue 3, Quasar 2, Capacitor 7 y JavaScript.
- `firebase` ya está instalado en versión `^12.16.0`.
- `src/components/Logica/Compartidos/ServicioBusquedaArticulos.js` expone `buscarArticulos`, `obtenerArticuloExacto` y `coincideContextoArticulo`.
- `src/components/BaseDeDatos/LectorExcel.js` mantiene el maestro cargado y expone `obtenerArticulosCargados()`.
- `src/components/Logica/Listados/FormularioListado.vue` contiene el contexto, buscador manual, cámara, botón Copiar y autoselección.
- `src/pages/PaginaListados.vue` es responsable de insertar y persistir artículos, resolver repetidos y mostrar la tabla.
- Cada listado persiste `contextoBusqueda` mediante `UsoAlmacenamientoListados.js` versión `1.5`.
- El nombre del usuario se obtiene mediante `obtenerNombreUsuario()`.
- La configuración Firebase está repetida dentro de `ServicioCompartirUbicacionesFirestore.js` y debe centralizarse.
- La publicación web se realiza mediante `.github/workflows/PublicarGitHubPages.yml`.
- La aplicación web publicada usa el dominio de GitHub Pages y localhost se ejecuta habitualmente en el puerto `9000`.
- El identificador Android es `bitacora.v2`.
- `android/app/google-services.json` no existe actualmente.
- `android/app/src/main/java/bitacora/v2/MainActivity.java` ya registra complementos Capacitor propios.
- El complemento `@capacitor-firebase/app-check` 7.x declara Firebase 11 y no es compatible formalmente con Firebase 12.16. No instalarlo ni forzar dependencias.
- `npm run lint` y `npm run build` terminan correctamente antes de comenzar este plan.
- No existen pruebas automatizadas funcionales; `npm test` solo informa que no hay pruebas.

## Decisiones funcionales cerradas

- El nombre visible será `Capitana Bita`.
- La primera integración estará solamente en Listados.
- Existirán tres entradas diferenciadas:
  - `Contexto de búsqueda`.
  - Entrada de texto y micrófono de `Capitana Bita`.
  - `Código o descripción del artículo` para búsqueda manual.
- No crear un switch para ocultar entradas en este plan.
- Enter en Capitana Bita envía el texto a Gemini.
- Enter en el buscador manual conserva su resolución local actual y nunca llama a Gemini.
- El dictado del teclado puede escribirse normalmente dentro de la entrada de Capitana Bita.
- El micrófono propio comienza al primer toque y finaliza solamente cuando el usuario vuelve a tocarlo.
- No imponer un límite funcional arbitrario de 45 segundos.
- Al detener la grabación se envía inmediatamente; no mostrar una confirmación previa de transcripción.
- Mostrar la transcripción devuelta junto con los resultados.
- No incluir fotografías, OCR, PDFs, manuales técnicos, embeddings ni búsqueda documental.
- Gemini nunca recibe el Excel completo.
- El contexto se envía a Gemini y se aplica nuevamente de forma determinista en la búsqueda local.
- Una coincidencia local única se agrega inmediatamente.
- Dos o más coincidencias se presentan como ambigüedad.
- Ninguna coincidencia se presenta como no encontrada.
- Cada ambigüedad se resuelve con un toque y el artículo se agrega inmediatamente.
- El panel desaparece automáticamente cuando no quedan ambigüedades ni resultados pendientes.
- La cruz cierra el panel y descarta solamente ambigüedades y no encontrados pendientes.
- La cruz no elimina artículos ya agregados, incluidos los seleccionados desde el panel.
- El panel pendiente no se persiste entre cierres o recargas; los artículos ya agregados sí permanecen.
- Seleccionar una ambigüedad no crea memoria automáticamente.
- Después de una selección compatible se puede ofrecer `Recordar para [contexto]`.
- Solo una acción expresa del usuario crea la memoria.
- Después de guardarla se informa que puede editarla o borrarla desde Configuración.
- Las memorias son locales por dispositivo y no se comparten entre usuarios.
- Cada memoria queda limitada al contexto normalizado exacto para el que fue confirmada.
- Sin contexto no se ofrecerá guardar una memoria contextual.
- La búsqueda manual, contexto, cámara y resto de Listados deben continuar funcionando sin internet.
- Ante un `429`, error de App Check o caída del servicio solo se deshabilita temporalmente Capitana Bita.

## Seguridad, gratuidad y claves

- Utilizar Firebase AI Logic con el proveedor `Gemini Developer API` y proyecto Firebase en plan Spark.
- No vincular una cuenta de facturación durante esta fase.
- No crear ni solicitar una `GEMINI_API_KEY`.
- No agregar `GEMINI_API_KEY` a `.env.local`, GitHub Actions, código JavaScript, Android, documentación ni commits.
- La autorización de Gemini queda administrada por Firebase AI Logic.
- La única variable nueva del entorno será `FIREBASE_APP_CHECK_SITE_KEY`; es la clave pública del sitio reCAPTCHA Enterprise para la aplicación web.
- Los tokens de depuración de App Check no deben guardarse en `.env.local`, código, GitHub Variables ni documentación.
- Registrar tokens de depuración únicamente en Firebase Console.
- Mantener App Check aplicado a Firebase AI Logic antes de publicar.
- La cuota se comparte entre todos los usuarios del proyecto. Los límites efectivos deben comprobarse en AI Studio después de habilitar el proyecto.
- Usar inicialmente `gemini-3.5-flash-lite`, verificando antes de implementarlo que siga disponible en Firebase AI Logic y en el nivel gratuito. Si no lo está, detener esa fase y elegir con Leo otro modelo Flash-Lite gratuito; no activar facturación.

## Contrato JSON de Gemini

Configurar `responseMimeType: 'application/json'` y un `responseSchema`. La respuesta válida tendrá esta forma lógica:

```json
{
  "transcripcion": "Necesito manillar y carburador",
  "respuesta": "Encontré dos solicitudes para revisar.",
  "esPedidoDeRepuestos": true,
  "solicitudes": [
    {
      "idSolicitud": "solicitud-1",
      "textoOriginal": "manillar",
      "busquedaPrincipal": "MANILLAR",
      "alternativas": ["MANUBRIO"],
      "cantidad": 1
    }
  ]
}
```

Reglas del contrato:

- `transcripcion`: texto hablado relevante, sin inventar contenido.
- `respuesta`: mensaje breve de Capitana Bita para la interfaz.
- `esPedidoDeRepuestos`: `false` cuando no existe una solicitud relacionada con repuestos.
- `solicitudes`: arreglo vacío si no existe un pedido válido.
- `idSolicitud`: identificador estable dentro de esa respuesta; la aplicación lo regenerará si falta o está repetido.
- `textoOriginal`: fragmento pedido por el usuario.
- `busquedaPrincipal`: descripción corta apta para el buscador local, sin marca/modelo duplicados cuando ya están en el contexto.
- `alternativas`: sinónimos de vocabulario de repuestos; no códigos ni artículos inventados.
- `cantidad`: valor entero positivo; usar `1` si no se especifica.
- Rechazar y tratar como respuesta inválida cualquier JSON que no cumpla el esquema después del parseo defensivo.

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
| --- | --- | --- |
| `.env.local` | Modificar localmente | Ordenar variables con comentarios y agregar `FIREBASE_APP_CHECK_SITE_KEY=` sin valores secretos. |
| `quasar.config.js` | Modificar | Exponer `FIREBASE_APP_CHECK_SITE_KEY` y robustecer la lectura de comentarios completos. |
| `.github/workflows/PublicarGitHubPages.yml` | Modificar | Inyectar la variable pública de App Check durante el build web. |
| `package.json` y `package-lock.json` | Modificar | Agregar `capacitor-voice-recorder@7.0.6`. |
| `android/app/google-services.json` | Agregar localmente desde Firebase | Configurar la aplicación Android; verificar política de seguimiento del archivo antes de stagear. |
| `android/app/build.gradle` | Modificar | Agregar Firebase BoM y dependencias App Check por variante. |
| `android/app/src/debug/java/bitacora/v2/ConfiguradorAppCheck.java` | Crear | Instalar Debug App Check en builds debug. |
| `android/app/src/release/java/bitacora/v2/ConfiguradorAppCheck.java` | Crear | Instalar Play Integrity en builds release. |
| `android/app/src/main/java/bitacora/v2/PluginAppCheckNativo.java` | Crear | Entregar tokens nativos de App Check a la capa web. |
| `android/app/src/main/java/bitacora/v2/MainActivity.java` | Modificar | Inicializar y registrar el complemento App Check antes de cargar la WebView. |
| `android/app/src/main/AndroidManifest.xml` | Modificar | Agregar `RECORD_AUDIO` y conservar los permisos actuales. |
| `src/components/Logica/Compartidos/ServicioFirebase.js` | Crear | Centralizar Firebase App, App Check y acceso reutilizable. |
| `src/components/Logica/Ubicaciones/ServicioCompartirUbicacionesFirestore.js` | Modificar | Consumir la instancia Firebase central sin alterar su alcance web actual. |
| `src/components/Logica/CapitanaBita/ConfiguracionCapitanaBita.js` | Crear | Modelo, límites defensivos, esquema e instrucciones del sistema. |
| `src/components/Logica/CapitanaBita/ServicioCapitanaBita.js` | Crear | Enviar texto/audio, validar JSON y clasificar errores. |
| `src/components/Logica/CapitanaBita/ServicioGrabacionCapitanaBita.js` | Crear | Encapsular permisos, inicio, detención, duración y Base64 en web/Android. |
| `src/components/Logica/CapitanaBita/ResolverSolicitudesCapitanaBita.js` | Crear | Aplicar memorias y resolver solicitudes contra el maestro local. |
| `src/components/Logica/CapitanaBita/UsoCapitanaBita.js` | Crear | Orquestar estado reactivo reutilizable sin acoplarlo a Listados. |
| `src/components/Logica/CapitanaBita/EntradaCapitanaBita.vue` | Crear | Entrada de texto, botón enviar, micrófono y estados de disponibilidad. |
| `src/components/Logica/CapitanaBita/PanelResultadosCapitanaBita.vue` | Crear | Mostrar transcripción, ambigüedades, no encontrados y acciones de memoria. |
| `src/components/BaseDeDatos/UsoAlmacenamientoMemoriasCapitanaBita.js` | Crear | CRUD local de memorias contextuales versionadas. |
| `src/components/Configuracion/GestionMemoriasCapitanaBita.vue` | Crear | Listar, editar y borrar memorias. |
| `src/pages/PaginaConfiguracion.vue` | Modificar | Agregar sección de memorias de Capitana Bita. |
| `src/components/Logica/Listados/FormularioListado.vue` | Modificar | Renderizar la entrada Bita separada del buscador manual. |
| `src/pages/PaginaListados.vue` | Modificar | Orquestar resolución, inserción inmediata y panel pendiente. |
| `src/components/BaseDeDatos/usoAlmacenamientoConfiguracion.js` | Modificar | Corregir el valor alternativo inconsistente `Usua des` antes de usarlo en el saludo. |

## FASE 1: preparar Firebase Console sin solicitar una API key

- [ ] Abrir el proyecto Firebase que corresponde a las seis variables actuales de `.env.local`.
- [ ] Confirmar que el proyecto esté en plan Spark y sin facturación vinculada.
- [ ] Ir a `AI Services > AI Logic` y ejecutar el asistente de configuración.
- [ ] Elegir exactamente `Gemini Developer API`; no elegir Agent Platform Gemini API.
- [ ] Confirmar que Firebase AI Logic quede habilitado.
- [ ] Confirmar en `Security > App Check > APIs` que Firebase AI Logic esté en modo enforced.
- [ ] Registrar o verificar la aplicación web utilizada por GitHub Pages.
- [ ] Crear una clave web score-based de reCAPTCHA Enterprise para el dominio publicado.
- [ ] Autorizar el dominio de GitHub Pages real; no agregar `localhost` como dominio de producción.
- [ ] Copiar solamente la clave pública de sitio para la fase de entorno.
- [ ] Registrar una aplicación Android con package `bitacora.v2` dentro del mismo proyecto Firebase.
- [ ] Descargar `google-services.json` y colocarlo exactamente en `android/app/google-services.json`.
- [ ] Obtener la huella SHA-256 del certificado de firma usado por el release publicado.
- [ ] Registrar Android en App Check con Play Integrity y esa SHA-256.
- [ ] Vincular en Google Play Console la Play Integrity API al mismo proyecto de Google Cloud/Firebase.
- [ ] Revisar en AI Studio la cuota efectiva de `gemini-3.5-flash-lite` para ese proyecto y documentar RPM, TPM y RPD durante la ejecución.
- [ ] Si el modelo no está disponible sin facturación, detener esta fase y consultar a Leo; no activar pagos.

## FASE 2: ordenar entorno y publicación web

- [ ] Modificar `.env.local` sin cambiar ni mostrar sus valores existentes.
- [ ] Agregar comentarios en líneas independientes y agrupar las seis variables Firebase actuales.
- [ ] Agregar el bloque:

  ```dotenv
  # Firebase App Check para navegador web
  # Clave pública de sitio reCAPTCHA Enterprise. No es una API key secreta de Gemini.
  FIREBASE_APP_CHECK_SITE_KEY=
  ```

- [ ] Indicar a Leo que pegue únicamente la clave pública de sitio después de `=`.
- [ ] No agregar comentarios al final de una línea con valor.
- [ ] Modificar el lector de `.env.local` en `quasar.config.js` para aplicar `trim()` a cada línea y omitir explícitamente líneas vacías o cuyo primer carácter sea `#` antes de buscar `=`.
- [ ] Agregar `FIREBASE_APP_CHECK_SITE_KEY: process.env.FIREBASE_APP_CHECK_SITE_KEY || ''` dentro de `build.env`.
- [ ] Modificar `.github/workflows/PublicarGitHubPages.yml` y agregar `FIREBASE_APP_CHECK_SITE_KEY: ${{ vars.FIREBASE_APP_CHECK_SITE_KEY }}` al paso `Compilar SPA`.
- [ ] Crear la Repository Variable `FIREBASE_APP_CHECK_SITE_KEY` en GitHub con la misma clave pública de sitio.
- [ ] No crear `.env.example` ni otro archivo de entorno nuevo en este plan.

## FASE 3: centralizar Firebase

- [ ] Crear `src/components/Logica/Compartidos/ServicioFirebase.js`.
- [ ] Mantener variables privadas `instanciaAplicacionFirebase`, `instanciaAppCheck` y `promesaInicializacionAppCheck` para evitar inicializaciones duplicadas.
- [ ] Crear `obtenerConfiguracionFirebase()` con las seis variables actuales y validación descriptiva de campos vacíos.
- [ ] Exportar `obtenerAplicacionFirebase()`.
  - Importar dinámicamente `firebase/app`.
  - Reutilizar `getApps()[0]` si existe.
  - Inicializar una sola vez si no existe.
- [ ] Exportar `inicializarAppCheckFirebase()` como promesa idempotente.
- [ ] En navegador de desarrollo, asignar `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` solamente cuando `process.env.DEV` sea verdadero y el hostname sea `localhost` o `127.0.0.1`.
- [ ] En navegador publicado, exigir `FIREBASE_APP_CHECK_SITE_KEY` e inicializar `ReCaptchaEnterpriseProvider` con refresco automático.
- [ ] En Android, obtener el token mediante `PluginAppCheckNativo` y construir un `CustomProvider` de `firebase/app-check` que devuelva `{ token, expireTimeMillis }`.
- [ ] No activar jamás el proveedor debug web en una compilación de producción.
- [ ] Exportar `obtenerAplicacionFirebaseProtegida()` para esperar App Check antes de devolver Firebase App.
- [ ] Modificar `ServicioCompartirUbicacionesFirestore.js` para eliminar su configuración e inicialización duplicadas y llamar a `obtenerAplicacionFirebase()`.
- [ ] Mantener `confirmarNavegadorWeb()` y todo el comportamiento existente de enlaces compartidos.

## FASE 4: implementar App Check nativo compatible con Capacitor 7

- [ ] No instalar `@capacitor-firebase/app-check`.
- [ ] Modificar `android/app/build.gradle`.
  - Agregar Firebase BoM usando la versión oficial vigente verificada al ejecutar; referencia investigada: `34.19.0`.
  - Agregar `implementation platform("com.google.firebase:firebase-bom:VERSION_VERIFICADA")`.
  - Agregar `implementation "com.google.firebase:firebase-appcheck"`.
  - Agregar `debugImplementation "com.google.firebase:firebase-appcheck-debug"`.
  - Agregar `releaseImplementation "com.google.firebase:firebase-appcheck-playintegrity"`.
- [ ] Crear dos clases con el mismo nombre y paquete, separadas por source set:
  - `android/app/src/debug/java/bitacora/v2/ConfiguradorAppCheck.java` usa `DebugAppCheckProviderFactory.getInstance()`.
  - `android/app/src/release/java/bitacora/v2/ConfiguradorAppCheck.java` usa `PlayIntegrityAppCheckProviderFactory.getInstance()`.
- [ ] En ambas clases crear `public static void inicializar(Context contexto)`.
- [ ] Inicializar `FirebaseApp` si todavía no existe, obtener `FirebaseAppCheck`, instalar el proveedor correspondiente y activar refresco automático.
- [ ] Crear `PluginAppCheckNativo.java` con `@CapacitorPlugin(name = "AppCheckNativo")`.
- [ ] Crear `@PluginMethod obtenerToken(PluginCall llamada)`.
  - Leer `forzarActualizacion` con valor predeterminado `false`.
  - Llamar a `FirebaseAppCheck.getInstance().getAppCheckToken(forzarActualizacion)`.
  - Resolver un `JSObject` con `token` y `expireTimeMillis`.
  - Rechazar con un mensaje en español y el error original cuando falle.
- [ ] Modificar `MainActivity.java`.
  - Registrar `PluginAppCheckNativo.class` junto a los complementos existentes.
  - Llamar a `ConfiguradorAppCheck.inicializar(this)` antes de que la WebView haga solicitudes Firebase.
  - No alterar recepción de archivos ni contador de pasos.
- [ ] Ejecutar una compilación debug, leer el token generado en Logcat y registrarlo en Firebase Console.
- [ ] No copiar ese token a archivos del repositorio.

## FASE 5: agregar grabación reutilizable

- [ ] Ejecutar `npm install capacitor-voice-recorder@7.0.6`.
- [ ] Ejecutar `npx cap sync android` después de instalar.
- [ ] Agregar `<uses-permission android:name="android.permission.RECORD_AUDIO" />` en `AndroidManifest.xml`.
- [ ] Crear `ServicioGrabacionCapitanaBita.js` sin imports de componentes Vue.
- [ ] Exportar `comprobarGrabacionDisponible()`, `solicitarPermisoGrabacion()`, `iniciarGrabacion()`, `detenerGrabacion()` y `cancelarGrabacion()`.
- [ ] Mantener internamente la hora de inicio para devolver `duracionSegundos`.
- [ ] `iniciarGrabacion()` debe rechazar una segunda grabación simultánea.
- [ ] `detenerGrabacion()` debe devolver `{ base64, mimeType, duracionSegundos }` con MIME real y Base64 sin prefijo Data URL.
- [ ] No cortar por duración fija.
- [ ] Detener y descartar de forma segura cuando el componente se desmonte o la app pierda la interacción activa antes de enviar.
- [ ] Mostrar errores diferenciados para dispositivo incompatible, permiso denegado, grabación vacía y fallo del complemento.

## FASE 6: configurar identidad y contrato de Capitana Bita

- [ ] Crear `ConfiguracionCapitanaBita.js`.
- [ ] Exportar `NOMBRE_CAPITANA_BITA = 'Capitana Bita'`.
- [ ] Exportar `MODELO_CAPITANA_BITA = 'gemini-3.5-flash-lite'`.
- [ ] Exportar límites defensivos para cantidad máxima de solicitudes parseadas, alternativas por solicitud, longitud de textos y salida máxima; estos límites protegen la app y no limitan la duración del micrófono.
- [ ] Crear y exportar `ESQUEMA_RESPUESTA_CAPITANA_BITA` mediante `Schema` de `firebase/ai` o JSON Schema compatible.
- [ ] Crear `crearInstruccionSistemaCapitanaBita(nombreUsuario)`.
- [ ] La instrucción debe establecer literalmente estas reglas conceptuales:
  - Trabaja exclusivamente con solicitudes de repuestos, componentes y accesorios de motos.
  - Extrae artículos incluso si el usuario saluda o agrega comentarios irrelevantes.
  - No responde preguntas generales ajenas al trabajo.
  - No inventa códigos, stock, ubicación, color ni compatibilidad.
  - No afirma que un artículo existe; solamente propone búsquedas.
  - Conserva restricciones expresas como delantero, trasero, completo, color, año o versión.
  - Usa el contexto como marca/modelo/año proporcionado, pero no lo transforma en un artículo.
  - Devuelve exclusivamente el JSON definido.
- [ ] Personalizar mensajes breves con el nombre obtenido desde Configuración cuando sea un nombre válido.
- [ ] Corregir en `usoAlmacenamientoConfiguracion.js` las devoluciones `Usua des` por `Usua desconocido` para unificar el estado sin nombre.

## FASE 7: crear el servicio Gemini

- [ ] Crear `ServicioCapitanaBita.js`.
- [ ] Exportar `procesarTextoCapitanaBita({ texto, contextoBusqueda, nombreUsuario, memorias })`.
- [ ] Exportar `procesarAudioCapitanaBita({ base64, mimeType, contextoBusqueda, nombreUsuario, memorias })`.
- [ ] Crear internamente `obtenerModeloCapitanaBita(nombreUsuario)`.
  - Esperar `obtenerAplicacionFirebaseProtegida()`.
  - Crear `getAI(aplicacion, { backend: new GoogleAIBackend() })`.
  - Crear el modelo con nombre, instrucciones, temperatura baja, salida JSON, esquema y máximo de salida.
- [ ] Construir un prompt compacto que incluya contexto normalizado, memorias aplicables y solicitud.
- [ ] No adjuntar el Excel, artículos, stock ni ubicaciones.
- [ ] Para audio, adjuntar `{ inlineData: { data: base64, mimeType } }` junto al prompt textual.
- [ ] Parsear `respuesta.text()` con `JSON.parse` dentro de `try/catch`.
- [ ] Normalizar y validar cada campo antes de devolverlo a la interfaz.
- [ ] Limitar arreglos y longitudes después de parsear aunque exista `responseSchema`.
- [ ] Clasificar errores con códigos propios: `sinConexion`, `permiso`, `appCheck`, `cuota`, `saturado`, `respuestaInvalida` y `desconocido`.
- [ ] Ante `429`, respetar cualquier tiempo de reintento recibido y aplicar un enfriamiento local; no asumir automáticamente que la cuota diaria se agotó.
- [ ] No reintentar automáticamente audio para evitar duplicar consumo o inserciones.

## FASE 8: implementar memorias contextuales

- [ ] Crear `UsoAlmacenamientoMemoriasCapitanaBita.js` con Capacitor Preferences.
- [ ] Usar clave `memorias_capitana_bita` y una colección versionada.
- [ ] Cada memoria debe contener: `id`, `contexto`, `expresionUsuario`, `busquedaConfirmada`, `codigoArticuloReferencia`, `descripcionArticuloReferencia`, `creadaEn` y `actualizadaEn`.
- [ ] Normalizar contexto y expresiones mediante utilidades de `ServicioBusquedaArticulos.js`.
- [ ] Impedir memorias con contexto, expresión o búsqueda vacíos.
- [ ] Impedir duplicados exactos por contexto + expresión; actualizar el existente si el usuario confirma un reemplazo.
- [ ] Exportar `obtenerMemoriasCapitanaBita()`, `obtenerMemoriasParaContexto(contexto)`, `guardarMemoriaCapitanaBita(memoria)`, `actualizarMemoriaCapitanaBita(id, cambios)` y `eliminarMemoriaCapitanaBita(id)`.
- [ ] Una memoria aplica solo cuando el contexto normalizado coincide exactamente.
- [ ] No aplicar una memoria de `CK 110` a `CK 125`, `MAX` ni contexto vacío.
- [ ] No sincronizar con Firestore ni exportar/importar memorias en este plan.

## FASE 9: resolver solicitudes contra el Excel

- [ ] Crear `ResolverSolicitudesCapitanaBita.js` como servicio puro.
- [ ] Exportar `resolverSolicitudesCapitanaBita({ solicitudes, articulos, contextoBusqueda, memorias })`.
- [ ] Para cada solicitud:
  - Aplicar primero una memoria exacta del contexto y expresión.
  - Construir consultas sin duplicados: búsqueda memorizada, búsqueda principal y alternativas.
  - Ejecutar `buscarArticulos()` por consulta con el contexto actual.
  - Unificar candidatos por código normalizado.
  - Conservar qué consulta originó cada candidato para explicar la equivalencia.
- [ ] Clasificar cada solicitud como `unica`, `ambigua` o `noEncontrada`.
- [ ] Considerar única solo cuando quede exactamente un código local distinto; no usar una confianza inventada por Gemini.
- [ ] Respetar `cantidad`: insertar la cantidad pedida como repeticiones solamente mediante el flujo de repetidos existente; no saltar confirmaciones actuales.
- [ ] Devolver objetos con `idSolicitud`, `textoOriginal`, `candidatos`, `articuloUnico`, `memoriaAplicada` y `puedeOfrecerMemoria`.
- [ ] `puedeOfrecerMemoria` requiere contexto no vacío, selección proveniente de una ambigüedad o alternativa y ausencia de una memoria idéntica.

## FASE 10: crear el orquestador y entrada reutilizable

- [ ] Crear `UsoCapitanaBita.js` como composable reutilizable.
- [ ] Exponer estados: `texto`, `grabando`, `duracionGrabacion`, `procesando`, `disponible`, `motivoNoDisponible`, `resultado`, `error` y `enfriamientoHasta`.
- [ ] Exponer acciones: `enviarTexto`, `alternarGrabacion`, `cancelarGrabacion`, `cerrarResultados`, `limpiarError` y `comprobarDisponibilidad`.
- [ ] Evitar llamadas simultáneas mientras `procesando` sea verdadero.
- [ ] Usar `navigator.onLine` y eventos `online`/`offline` para el estado básico en ambas plataformas.
- [ ] Una comprobación online no garantiza Gemini disponible; actualizar el estado final según la respuesta real.
- [ ] Crear `EntradaCapitanaBita.vue`.
- [ ] Recibir props `contextoBusqueda` y `deshabilitado`.
- [ ] Emitir `resultado-procesado` con el resultado validado y `estado-interaccion` si la página necesita cerrar la grabación al navegar.
- [ ] Renderizar etiqueta visible `Capitana Bita` y placeholder `Escribí o dictá una lista de artículos`.
- [ ] Mantener un botón de micrófono principal y un botón de envío para texto.
- [ ] Enter envía; `Shift+Enter` queda reservado solo si se usa `textarea`.
- [ ] Durante grabación, cambiar icono/estado visual, mostrar duración y texto `Grabando… Tocá nuevamente para finalizar`.
- [ ] Durante procesamiento, bloquear nueva entrada y mostrar `Capitana Bita está procesando el pedido…`.
- [ ] Deshabilitar solo controles de Bita cuando no haya conexión o exista enfriamiento.
- [ ] Usar únicamente variables de `src/css/app.css` y CSS scoped compacto.

## FASE 11: crear el panel de resultados

- [ ] Crear `PanelResultadosCapitanaBita.vue` sin `q-dialog` ni modal.
- [ ] Renderizarlo en el flujo normal del documento para desplazar la tabla hacia abajo.
- [ ] Recibir `transcripcion`, `ambiguedades`, `noEncontrados` y `memoriasPropuestas`.
- [ ] Emitir `seleccionar-candidato`, `recordar-seleccion` y `cerrar`.
- [ ] Agrupar candidatos por `textoOriginal`.
- [ ] Mostrar nombre y código real de cada candidato.
- [ ] Al tocar un candidato emitirlo inmediatamente y retirar solo ese grupo después de que la página confirme su inserción.
- [ ] No agregar botón global Confirmar ni check final.
- [ ] Cuando ya no queden ambigüedades ni no encontrados, cerrar automáticamente el panel.
- [ ] La cruz debe emitir `cerrar` y descartar únicamente el contenido pendiente del panel.
- [ ] No emitir eliminaciones ni intentar revertir artículos.
- [ ] Después de seleccionar un candidato elegible, mostrar una acción discreta `Recordar para CONTEXTO`.
- [ ] Al confirmar la memoria, mostrar `Memoria guardada. Podés editarla o borrarla desde Configuración.`.
- [ ] No mostrar acción de memoria con contexto vacío o cuando ya se aplicó la misma memoria.

## FASE 12: integrar Capitana Bita en Listados

- [ ] Modificar `FormularioListado.vue`.
  - Importar y renderizar `EntradaCapitanaBita` después de `CampoContextoArticulo` y antes de `ControlAutoseleccionArticulo`.
  - Mantener el buscador manual separado y sin cambios de significado.
  - Pasar el contexto actual a Bita.
  - Reemitir el resultado mediante `resultado-capitana-bita`.
  - Ampliar `cerrarInteraccion()` para cancelar una grabación activa antes de cerrar buscador o cámara.
- [ ] Modificar `PaginaListados.vue`.
  - Crear refs para resultado pendiente y selección pendiente de memoria.
  - Importar `obtenerArticulosCargados`, resolver solicitudes y almacenamiento de memorias.
  - Crear `procesarResultadoCapitanaBita(resultadoGemini)`.
  - Capturar una copia del contexto usado al iniciar la solicitud; no resolver con un contexto cambiado durante el procesamiento.
  - Resolver contra el maestro actualmente cargado.
  - Insertar resultados únicos llamando al flujo existente `agregarArticulo()` o una extracción reutilizable de este flujo; no duplicar persistencia ni resolución de stock/ubicación.
  - Procesar artículos secuencialmente para conservar orden y respetar el aviso de repetidos.
  - No continuar insertando silenciosamente mientras exista una confirmación de repetido pendiente; conservar una cola explícita.
  - Guardar en el panel ambigüedades y no encontrados.
  - Crear `seleccionarCandidatoCapitanaBita({ idSolicitud, articulo })` para insertar y quitar el grupo.
  - Crear `guardarMemoriaDesdeSeleccion(datos)` solamente después del toque explícito en `Recordar para…`.
  - Crear `cerrarResultadosCapitanaBita()` que limpie datos pendientes sin alterar `listadoActivo.articulos`.
  - Renderizar `PanelResultadosCapitanaBita` dentro de `.zona-agregar-listado`, debajo de `FormularioListado` y antes de columnas visibles/tabla.
  - Incluir el panel y grabación en `modalActivo` o en la lógica del botón Atrás únicamente para cerrar la interacción, sin tratarlos visualmente como modal.
- [ ] Confirmar que cambiar de listado descarte resultados pendientes de Bita y no mueva artículos entre listados.
- [ ] Confirmar que cambiar el contexto después de una carga no reinterprete artículos ya agregados.

## FASE 13: administrar memorias desde Configuración

- [ ] Crear `GestionMemoriasCapitanaBita.vue`.
- [ ] Cargar memorias al montar y ordenarlas por contexto y expresión.
- [ ] Mostrar por memoria: contexto, expresión del usuario, búsqueda confirmada y artículo de referencia.
- [ ] Permitir editar `contexto`, `expresionUsuario` y `busquedaConfirmada` con normalización.
- [ ] Guardar con botón explícito y notificación de éxito/error.
- [ ] Eliminar mediante confirmación usando el patrón `ModalEliminar.vue` existente.
- [ ] No permitir crear memorias nuevas manualmente en esta fase.
- [ ] Mostrar estado vacío explicando que las memorias se crean desde selecciones confirmadas de Capitana Bita.
- [ ] Modificar `PaginaConfiguracion.vue`.
  - Importar `IconBrain` o el icono equivalente disponible de Tabler.
  - Agregar una `TarjetaSeccion` llamada `Memorias de Capitana Bita` después de Información Personal.
  - Renderizar `GestionMemoriasCapitanaBita` dentro de esa tarjeta.
  - Ampliar `cerrarPasoAtrasNativo()` para cerrar ediciones o confirmaciones abiertas del nuevo componente.

## FASE 14: disponibilidad, errores y cuota

- [ ] No deshabilitar contexto ni búsqueda manual ante fallos de IA.
- [ ] Mensajes mínimos obligatorios:
  - Sin conexión: `Capitana Bita necesita conexión a internet.`
  - Permiso denegado: `Permití el acceso al micrófono para dictar.`
  - Cuota/saturación: `Capitana Bita alcanzó un límite temporal. Probá nuevamente más tarde.`
  - App Check: `No se pudo verificar esta instalación de Bitácora.`
  - Respuesta inválida: `No pude interpretar el pedido. Probá nuevamente.`
- [ ] Mantener el botón de micrófono gris mientras no haya conexión, permiso bloqueado, procesamiento o enfriamiento.
- [ ] Permitir escribir texto aunque esté offline, pero deshabilitar el envío hasta recuperar conexión.
- [ ] Aplicar un solo enfriamiento compartido por dispositivo y mostrar cuándo se puede reintentar si el dato está disponible.
- [ ] No afirmar `cuota diaria agotada` si Firebase no permite distinguirla de saturación.
- [ ] No registrar audio Base64, tokens App Check, configuración Firebase completa ni respuestas sensibles en consola.

## FASE 15: pruebas de contrato y motor local

- [ ] Crear pruebas puras solo si se incorpora un runner existente; este plan no autoriza agregar Vitest únicamente para esta fase.
- [ ] En ausencia de runner, preparar funciones con entradas/salidas puras y ejecutar validaciones manuales documentadas.
- [ ] Probar parser con JSON válido, campos faltantes, arreglo vacío, IDs repetidos, cantidades inválidas y texto no JSON.
- [ ] Probar resolución con contexto `CK 110`, expresión `rueda delantera` y alternativa `llanta delantera`.
- [ ] Confirmar que nunca se devuelve un artículo fuera del Excel.
- [ ] Probar contexto amplio `MAX` con varios manillares y confirmar estado ambiguo.
- [ ] Probar varias solicitudes mezclando únicas, ambiguas y no encontradas.
- [ ] Probar memoria `CK 110 + RUEDA DELANTERA → LLANTA DELANTERA`.
- [ ] Confirmar que esa memoria no se aplique a `CK 125` ni contexto vacío.
- [ ] Probar que una memoria editada se aplique inmediatamente y una eliminada deje de aplicarse.

## FASE 16: pruebas en localhost y GitHub Pages

- [ ] Ejecutar la app en el localhost existente y abrir consola.
- [ ] Generar el token debug web con `FIREBASE_APPCHECK_DEBUG_TOKEN = true` condicionado a desarrollo.
- [ ] Registrar el token en Firebase Console y comprobar una solicitud textual.
- [ ] Probar permiso y grabación desde navegador.
- [ ] Dictar una lista extensa y detener manualmente con el segundo toque.
- [ ] Confirmar que Enter en Bita llama a Gemini y Enter en el buscador manual no lo hace.
- [ ] Probar la cruz y verificar que artículos agregados permanezcan.
- [ ] Publicar una rama/prueba mediante el flujo de GitHub Pages con la Repository Variable configurada.
- [ ] Confirmar que producción usa reCAPTCHA Enterprise, no el proveedor debug.
- [ ] Confirmar que el dominio publicado está autorizado y App Check marca solicitudes verificadas.

## FASE 17: pruebas Android

- [ ] Ejecutar `npx cap sync android`.
- [ ] Compilar debug y verificar el token App Check en Logcat.
- [ ] Registrar el token debug y probar texto/audio en dispositivo real.
- [ ] Confirmar permiso `RECORD_AUDIO`, primer toque para iniciar y segundo para detener.
- [ ] Confirmar que Back detiene/cancela una grabación activa sin enviar audio incompleto.
- [ ] Generar release con `npm run androidReleaseConSimbolos`.
- [ ] Instalar una compilación release firmada por un canal adecuado para comprobar Play Integrity.
- [ ] Confirmar en Firebase Console que las solicitudes release aparecen verificadas.
- [ ] No considerar validada la fase Android solamente con el proveedor debug.

## FASE 18: validación final

- [ ] Ejecutar `rg -n "GEMINI_API_KEY|FIREBASE_APPCHECK_DEBUG_TOKEN" .` y verificar que no exista una clave fija ni un token debug comprometido; solo se admite la asignación booleana condicionada `= true` para localhost.
- [ ] Ejecutar `rg -n "@capacitor-firebase/app-check" package.json package-lock.json` y confirmar que no fue instalado.
- [ ] Ejecutar `npm run lint` y corregir todos los errores.
- [ ] Ejecutar `npm run build` y confirmar compilación web.
- [ ] Ejecutar `npm test` y documentar que actualmente no existen pruebas automatizadas reales.
- [ ] Ejecutar `npm run androidReleaseConSimbolos` cuando las credenciales Android estén listas.
- [ ] Revisar que todo archivo nuevo use PascalCase y símbolos nuevos usen español.
- [ ] Revisar UTF-8 y corregir cualquier `Ã`, `Â` o `â` en archivos creados o modificados.
- [ ] Revisar que CSS nuevo esté compacto, sin líneas vacías entre reglas y solo use colores de `src/css/app.css`.
- [ ] Confirmar que el maestro nunca se envía a Gemini mediante inspección de Network en navegador.
- [ ] Confirmar que no se registren Base64 de audio, tokens ni claves en consola.
- [ ] Confirmar manualmente el flujo completo con listas de 1, 10 y aproximadamente 50 artículos.
- [ ] Confirmar que sin internet toda la búsqueda manual y el contexto continúan operativos.
- [ ] Confirmar que cerrar resultados nunca elimina artículos agregados.
- [ ] Confirmar que la interfaz informa dónde editar o borrar una memoria recién guardada.

## Criterios de aceptación

- Capitana Bita funciona en localhost, GitHub Pages y Android.
- No existe una API key secreta de Gemini en el proyecto ni en el APK.
- App Check verifica web y Android con proveedores adecuados a cada plataforma.
- El usuario puede escribir, usar dictado del teclado o grabar hasta detener manualmente.
- Gemini devuelve solicitudes estructuradas y nunca controla directamente los artículos agregados.
- Todo artículo agregado fue resuelto contra el Excel maestro local.
- Coincidencias únicas se agregan automáticamente.
- Ambigüedades se resuelven con un toque dentro de un panel no modal.
- La cruz solo descarta pendientes y nunca revierte artículos.
- Las memorias requieren confirmación explícita, respetan contexto y pueden editarse o borrarse desde Configuración.
- Los controles manuales continúan funcionando ante cualquier fallo de IA.
- El proyecto mantiene lint, build web y build Android correctos.

## Fuera de alcance

- Fotografías, OCR o interpretación visual.
- Manuales de motos o RAG.
- Entrenamiento o fine-tuning de Gemini.
- Embeddings y búsqueda semántica externa.
- Sincronización o exportación de memorias entre dispositivos.
- Capitana Bita en Stock, Ubicaciones, Consulta de ubicación, Etiquetas, Pedidos o Fotos.
- Switch para ocultar campos de entrada.
- Respuestas habladas de Capitana Bita o Gemini Live API.
- Facturación, plan Blaze, Cloud Functions o servidor propio.
