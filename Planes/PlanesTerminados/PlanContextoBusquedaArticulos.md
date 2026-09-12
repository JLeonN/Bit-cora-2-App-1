# PLAN DE CONTEXTO REUTILIZABLE PARA BÚSQUEDA DE ARTÍCULOS

## Descripción del plan

Incorporar un campo persistente de contexto que restrinja las búsquedas manuales de artículos dentro del Excel maestro. El contexto será reutilizable visual y técnicamente, pero su valor permanecerá aislado entre Listados, Stock, Ubicaciones, Consulta de ubicación y Etiquetas.

El cambio debe convertir la búsqueda actual, hoy concentrada dentro de `CodigoMasNombre.vue`, en un servicio puro que también pueda consumir en el futuro la Capitana Bita. Esta fase no integra Gemini, micrófono, conversaciones ni memorias de interpretación.

Ejemplo esperado:

```text
Contexto de búsqueda: RK 125
Código o descripción: LLANTA
Consulta efectiva: artículos cuyo nombre coincida con RK + 125 + LLANTA
```

Después de seleccionar el artículo, el campo de código o descripción puede limpiarse o recuperar el texto temporal del botón Copiar según su funcionamiento actual, pero `RK 125` debe permanecer visible y activo.

## Objetivo principal

- Crear un campo de contexto reutilizable, accesible, editable y persistente.
- Aplicar el contexto a las búsquedas por descripción sin impedir búsquedas exactas por código ni escaneos.
- Mantener contextos independientes entre módulos y por cada listado.
- Centralizar la búsqueda de artículos en un servicio sin dependencias de Vue ni de la interfaz.
- Preparar una API de búsqueda que pueda reutilizar posteriormente la integración con Gemini.
- Conservar los flujos actuales de selección, autoselección, cámara, doble espacio y copia temporal.

## Contexto técnico verificado

- El proyecto utiliza Vue 3 con Quasar 2, Capacitor 7 y JavaScript.
- El Excel maestro se procesa en `src/components/BaseDeDatos/LectorExcel.js` y expone artículos con `codigo`, `nombre`, `ubicacionAntigua`, `stock` e `historialUbicaciones`.
- `src/components/Logica/Ubicaciones/CodigoMasNombre.vue` contiene actualmente normalización para relevancia, filtrado, ordenamiento y presentación de resultados.
- `CodigoMasNombre.vue` tiene cinco consumidores verificados:
  - `src/components/Logica/Listados/FormularioListado.vue`
  - `src/pages/PaginaStock.vue`
  - `src/components/Logica/Ubicaciones/FormularioUbicacion.vue`
  - `src/pages/ConsultaDeUbicacion.vue`
  - `src/components/Logica/Etiquetas/FormularioEtiqueta.vue`
- La coincidencia exacta de códigos y el tratamiento del prefijo de escáner están centralizados en `src/components/Logica/Compartidos/CodigoEscaner.js`.
- `src/components/Logica/Compartidos/InputArticuloInteligente.js` normaliza entradas y conserva el comportamiento de doble espacio para insertar guiones.
- `src/components/Logica/Compartidos/UsoTextoCopiadoInput.js` conserva el texto copiado solamente en memoria del componente y, cuando es posible, también lo envía al portapapeles. No es persistencia y no debe reutilizarse para guardar el contexto.
- Listados se guarda como colección versionada en `src/components/BaseDeDatos/UsoAlmacenamientoListados.js`; la versión actual verificada es `1.4`.
- Stock usa una sesión versionada en `src/components/BaseDeDatos/UsoAlmacenamientoStock.js`, pero el contexto no debe formar parte de esa sesión porque borrar o reiniciar la sesión no está autorizado a borrar el contexto.
- Ubicaciones y Etiquetas guardan sus datos de trabajo en claves propias de Capacitor Preferences. El contexto debe usar claves independientes para sobrevivir a la eliminación de esos datos.
- No existe infraestructura de pruebas automatizadas funcionales; `npm test` no ejecuta pruebas reales. La validación disponible es ESLint, build y pruebas manuales dirigidas.
- Los archivos y carpetas nuevos deben usar PascalCase sin guiones ni guiones bajos.
- Variables y funciones nuevas deben usar camelCase en español.
- El CSS debe permanecer compacto, sin líneas vacías entre reglas, y utilizar las variables de `src/css/app.css`. La papelera debe usar `var(--color-error)`.

## Decisiones funcionales cerradas

- El campo se llamará `Contexto de búsqueda`.
- El contexto será texto libre; no se dividirá la interfaz en marca, modelo, año o versión.
- Cada espacio separará términos que deberán participar en el filtrado. Por ejemplo, `RK 2023` representa los términos `RK` y `2023`.
- El contexto será opcional. Vacío debe reproducir el comportamiento actual.
- Los contextos serán independientes:
  - Cada listado tendrá su propio contexto.
  - Stock tendrá un contexto propio.
  - Ubicaciones tendrá un contexto propio.
  - Consulta de ubicación tendrá un contexto propio.
  - Etiquetas tendrá un contexto propio.
- Un contexto no debe copiarse automáticamente al cambiar de módulo.
- El contexto debe sobrevivir al cierre y reapertura de la aplicación.
- El contexto solo podrá quedar vacío cuando el usuario borre el texto con el teclado o pulse la papelera del propio campo.
- Agregar, seleccionar, editar o eliminar artículos no debe limpiar el contexto.
- Eliminar todos los registros de Stock, Ubicaciones o Etiquetas no debe limpiar sus contextos.
- Iniciar una sesión nueva de Stock no debe limpiar el contexto de Stock.
- En Listados, eliminar un listado elimina naturalmente su contexto porque forma parte de ese listado. Duplicar un listado debe copiar su contexto.
- La búsqueda exacta por código y el escaneo deben ignorar el contexto. El contexto no puede bloquear un código válido.
- Las búsquedas textuales por descripción deben respetar estrictamente todos los términos del contexto.
- Las búsquedas exactas por nombre realizadas con Enter deben respetar el contexto.
- El botón Copiar existente debe conservar su comportamiento y no debe convertirse en almacenamiento del contexto.
- No se integrará IA en este plan, pero el servicio de búsqueda no podrá depender de componentes Vue para que la futura IA lo invoque directamente.

## Alcance

### Incluye

- Refactorización de la lógica de búsqueda a un servicio puro.
- Reubicación del buscador visual en la carpeta compartida.
- Nuevo componente reutilizable para el campo de contexto.
- Nuevo almacenamiento independiente para los contextos de Stock, Ubicaciones, Consulta de ubicación y Etiquetas.
- Persistencia del contexto dentro de cada listado.
- Integración del contexto en los cinco flujos que buscan artículos.
- Actualización de búsquedas exactas ejecutadas con Enter para respetar la nueva regla.
- Preservación explícita de escáneres y códigos exactos fuera del filtro contextual.
- Estados vacíos y metadatos de búsqueda necesarios para una integración futura con IA.
- Pruebas manuales en web y Android, ESLint y compilación.

### No incluye

- Gemini ni otra API de inteligencia artificial.
- Captura o transcripción de audio.
- La identidad o instrucciones de la Capitana Bita.
- Conversaciones de seguimiento.
- Memorias aprendidas, edición de memorias o equivalencias como `rueda` y `llanta`.
- Manuales técnicos de motos, embeddings o búsqueda documental.
- Modificación del Excel maestro.
- Sincronización de contextos entre dispositivos o usuarios.
- Contexto en filtros de tablas ya cargadas; solamente afecta la búsqueda usada para seleccionar nuevos artículos.
- Cambios en `RecibirUbicaciones.vue`, porque su buscador filtra una lista recibida y no selecciona artículos del Excel maestro.

## Mapa de cambios

| Archivo | Acción | Símbolos principales | Propósito |
| --- | --- | --- | --- |
| `src/components/Logica/Compartidos/ServicioBusquedaArticulos.js` | Crear | `normalizarEntradaBusquedaArticulo`, `normalizarTextoComparacionArticulo`, `coincideContextoArticulo`, `buscarArticulos`, `obtenerArticuloExacto` | Centralizar la búsqueda sin Vue y exponerla a interfaces actuales y futura IA. |
| `src/components/Logica/Compartidos/CampoContextoArticulo.vue` | Crear | props `modelValue`, `idCampo`, `deshabilitado`; emit `update:modelValue` | Mostrar y editar el contexto con papelera roja. |
| `src/components/BaseDeDatos/UsoAlmacenamientoContextosArticulo.js` | Crear | `AMBITOS_CONTEXTO_ARTICULO`, `obtenerContextoArticulo`, `guardarContextoArticulo` | Persistir contextos independientes de módulos mediante Capacitor Preferences. |
| `src/components/Logica/Compartidos/BuscadorArticulos.vue` | Crear desde el componente actual | prop `contextoBusqueda`; estado y eventos existentes | Presentar resultados usando el servicio compartido. |
| `src/components/Logica/Ubicaciones/CodigoMasNombre.vue` | Eliminar después de migrar consumidores | Componente anterior | Quitar la ubicación incorrecta del buscador compartido y evitar dos implementaciones. |
| `src/components/Logica/Compartidos/InputArticuloInteligente.js` | Modificar | `normalizarInputArticulo` | Delegar la normalización pura al nuevo servicio sin cambiar su API actual. |
| `src/components/BaseDeDatos/UsoAlmacenamientoListados.js` | Modificar | `VERSION_LISTADOS`, `normalizarListado`, `crearListado`, `duplicarListado` | Persistir `contextoBusqueda` por listado y migrar registros anteriores. |
| `src/pages/PaginaListados.vue` | Modificar | `guardarContextoBusqueda`, props/eventos de `FormularioListado` | Mantener el contexto del listado activo y persistir cambios. |
| `src/components/Logica/Listados/FormularioListado.vue` | Modificar | prop `contextoBusqueda`, emit `actualizar-contexto`, uso de `CampoContextoArticulo` | Mostrar el contexto y pasarlo al buscador. |
| `src/pages/PaginaStock.vue` | Modificar | `contextoBusqueda`, `actualizarContextoBusqueda`, `buscarArticuloExacto` | Integrar contexto persistente y búsqueda compartida en Stock. |
| `src/components/Logica/Ubicaciones/FormularioUbicacion.vue` | Modificar | `contextoBusqueda`, `actualizarContextoBusqueda` | Integrar contexto persistente en Ubicaciones. |
| `src/pages/ConsultaDeUbicacion.vue` | Modificar | `contextoBusqueda`, `actualizarContextoBusqueda`, `buscarEnBase` | Integrar contexto persistente en Consulta de ubicación. |
| `src/components/Logica/Etiquetas/FormularioEtiqueta.vue` | Modificar | `contextoBusqueda`, `actualizarContextoBusqueda` | Integrar contexto persistente en Etiquetas. |

## FASE 1: extraer y estabilizar el motor de búsqueda

- [ ] Crear `src/components/Logica/Compartidos/ServicioBusquedaArticulos.js` como archivo nuevo sin imports de Vue, Quasar, Capacitor ni componentes.
  - [ ] Exportar `normalizarEntradaBusquedaArticulo(valor)`.
    - Convertir a mayúsculas.
    - Conservar letras, números, `Ñ`, espacios y guiones.
    - Reemplazar caracteres no permitidos por guion, compactar guiones repetidos y compactar espacios repetidos.
    - Mantener la misma salida observable que hoy produce `normalizarInputArticulo`.
  - [ ] Exportar `normalizarTextoComparacionArticulo(valor)`.
    - Convertir a texto.
    - Aplicar normalización Unicode NFD.
    - Eliminar diacríticos para que la comparación no dependa de acentos.
    - Convertir a mayúsculas.
    - Reemplazar grupos no alfanuméricos por espacios y compactarlos.
  - [ ] Implementar internamente `tokenizarConsulta(valor)` para devolver solamente términos no vacíos normalizados.
  - [ ] Exportar `coincideContextoArticulo(articulo, contextoBusqueda)`.
    - Devolver `true` si el contexto está vacío.
    - Comparar el contexto contra `articulo.nombre`, no contra stock ni ubicación.
    - Exigir que todos los términos del contexto aparezcan en el nombre normalizado.
    - Permitir coincidencia parcial dentro de un término del nombre, de modo que `RK 125` coincida con `RK125`.
  - [ ] Mover desde `CodigoMasNombre.vue` la lógica de `calcularPuntajeRelevancia`, `ordenarPorRelevancia` y clasificación de coincidencias.
  - [ ] Exportar `buscarArticulos({ articulos, busqueda, contextoBusqueda = '', limiteResultados = 50 })`.
    - Validar que `articulos` sea un arreglo y devolver `[]` si no lo es o si `busqueda` está vacía.
    - Intentar primero `obtenerArticuloPorCodigoEscaneado(articulos, busqueda)` sobre la colección completa, sin aplicar contexto.
    - Si existe una coincidencia de escáner válida, devolverla como único resultado con `tipoCoincidencia: 'codigo-escaneado'`.
    - Para búsquedas no exactas, filtrar primero con `coincideContextoArticulo`.
    - Conservar las categorías actuales y su prioridad: código que empieza, nombre con todas las palabras, código que contiene y nombre parcial para búsquedas de una palabra.
    - Evitar artículos duplicados entre categorías.
    - Ordenar nombres con el algoritmo de relevancia extraído.
    - Aplicar `limiteResultados` al resultado final.
    - Devolver objetos `{ articulo, tipoCoincidencia }` para conservar el contrato actual del componente.
  - [ ] Exportar `obtenerArticuloExacto({ articulos, busqueda, contextoBusqueda = '' })`.
    - Buscar primero mediante `obtenerArticuloPorCodigoEscaneado` sin contexto.
    - Si no hay código exacto, limitar la colección mediante `coincideContextoArticulo`.
    - Dentro de la colección contextual, aceptar un único código exacto o un único nombre exacto normalizado.
    - Devolver `null` ante ausencia o ambigüedad.
    - Este contrato será el punto de entrada para Enter y para una futura solicitud estructurada de la IA.
- [ ] Modificar `src/components/Logica/Compartidos/InputArticuloInteligente.js`.
  - [ ] Importar `normalizarEntradaBusquedaArticulo` desde `ServicioBusquedaArticulos.js`.
  - [ ] Mantener exportada `normalizarInputArticulo(valor)` para no romper consumidores actuales, pero hacer que delegue en `normalizarEntradaBusquedaArticulo`.
  - [ ] No modificar `manejarDobleEspacioInput` ni su firma.
- [ ] Crear `src/components/Logica/Compartidos/BuscadorArticulos.vue` a partir de `src/components/Logica/Ubicaciones/CodigoMasNombre.vue`.
  - [ ] Mantener la prop `busqueda` con valor predeterminado `''`.
  - [ ] Agregar la prop `contextoBusqueda` de tipo `String` y valor predeterminado `''`.
  - [ ] Mantener los eventos `articulo-seleccionado` y `estado-busqueda`.
  - [ ] Reemplazar la lógica interna de filtrado y relevancia por una llamada a `buscarArticulos`.
  - [ ] Mantener `caracteresMinimos = 3`, `maximosResultados = 50`, el resaltado visual y el monitoreo de carga del Excel.
  - [ ] Hacer que `resultadosBusqueda` dependa reactivamente de `busqueda`, `contextoBusqueda`, artículos disponibles y estado de carga.
  - [ ] Ampliar el objeto emitido por `estado-busqueda` con `contextoBusqueda`, conservando `busqueda`, `busquedaValida`, `baseDatosCargada`, `cantidadResultados`, `articuloUnico` y `tipoCoincidenciaUnica`.
  - [ ] Mantener el tipo exacto `'codigo-escaneado'`, porque Etiquetas y Consulta de ubicación lo utilizan para su autoselección.
  - [ ] Actualizar los prefijos de logs de desarrollo de `[CodigoMasNombre]` a `[BuscadorArticulos]`.
  - [ ] Conservar `refrescarBaseDatos` y `obtenerEstadoBase` en `defineExpose`.
- [ ] Actualizar los cinco imports consumidores para usar `../Compartidos/BuscadorArticulos.vue` o la ruta relativa correcta desde cada archivo.
- [ ] Eliminar `src/components/Logica/Ubicaciones/CodigoMasNombre.vue` solamente después de confirmar mediante `rg` que ningún consumidor continúa importándolo.

## FASE 2: crear el campo reutilizable de contexto

- [ ] Crear `src/components/Logica/Compartidos/CampoContextoArticulo.vue`.
  - [ ] Definir la prop `modelValue` como `String` con valor predeterminado `''`.
  - [ ] Definir la prop `idCampo` como `String` obligatoria para enlazar `label` e `input` sin depender de APIs no disponibles en Vue 3.4.
  - [ ] Definir la prop `deshabilitado` como `Boolean` con valor predeterminado `false`.
  - [ ] Emitir `update:modelValue` con el valor normalizado en cada edición.
  - [ ] Renderizar la etiqueta visible `Contexto de búsqueda`.
  - [ ] Usar el placeholder `Ej.: CITY, MAX 125S o RK 2023`.
  - [ ] Normalizar el texto con `normalizarInputPreservandoCursor` y `normalizarInputArticulo` para conservar mayúsculas, guiones, espacios y posición del cursor.
  - [ ] No implementar el comportamiento de doble espacio en este campo; cada espacio representa separación normal entre términos del contexto.
  - [ ] Renderizar dentro del campo un botón con `IconTrash` solamente cuando `modelValue` no esté vacío.
  - [ ] Asignar al botón `type="button"`, `title="Borrar contexto de búsqueda"` y `aria-label="Borrar contexto de búsqueda"`.
  - [ ] Al pulsar la papelera, emitir `update:modelValue` con `''` y devolver el foco al campo.
  - [ ] Permitir borrar y reemplazar normalmente mediante teclado; no pedir confirmación.
  - [ ] No limpiar el valor al perder foco, seleccionar artículos, cerrar resultados ni desmontar el componente.
  - [ ] Usar `var(--color-error)` para icono, borde o estado interactivo rojo de la papelera.
  - [ ] Usar solamente variables ya existentes en `src/css/app.css` para fondo, texto, borde, foco y estado deshabilitado.
  - [ ] Mantener el CSS scoped compacto y sin líneas vacías entre reglas.
  - [ ] Garantizar que input y botón no desborden en teléfonos angostos y que el botón mantenga un área táctil suficiente.

## FASE 3: persistir contextos independientes

- [ ] Crear `src/components/BaseDeDatos/UsoAlmacenamientoContextosArticulo.js`.
  - [ ] Importar `Preferences` desde `@capacitor/preferences`.
  - [ ] Importar `normalizarEntradaBusquedaArticulo` desde `ServicioBusquedaArticulos.js` para guardar valores consistentes.
  - [ ] Exportar `AMBITOS_CONTEXTO_ARTICULO` como objeto congelado con valores exactos:

    ```js
    {
      STOCK: 'stock',
      UBICACIONES: 'ubicaciones',
      CONSULTA_UBICACION: 'consultaUbicacion',
      ETIQUETAS: 'etiquetas'
    }
    ```

  - [ ] Usar una clave de Preferences distinta por ámbito con prefijo privado `contexto_busqueda_articulo_` para evitar escrituras cruzadas.
  - [ ] Validar que el ámbito recibido pertenezca a `AMBITOS_CONTEXTO_ARTICULO`; lanzar un error descriptivo para ámbitos desconocidos.
  - [ ] Exportar `obtenerContextoArticulo(ambito)`.
    - Leer la clave del ámbito.
    - Devolver el texto normalizado o `''`.
    - Capturar errores de lectura, registrarlos con prefijo `[UsoAlmacenamientoContextosArticulo]` y devolver `''`.
  - [ ] Exportar `guardarContextoArticulo(ambito, contextoBusqueda)`.
    - Normalizar antes de guardar.
    - Si el resultado está vacío, eliminar la clave con `Preferences.remove`.
    - Si contiene texto, persistirlo con `Preferences.set`.
    - Devolver el contexto normalizado guardado.
    - Registrar y propagar errores de escritura para que el consumidor pueda notificarlos sin fingir persistencia.
  - [ ] No exportar una función que borre todos los contextos simultáneamente.
  - [ ] No enlazar estas claves con `eliminarSesionStock`, `eliminarUbicaciones` ni `eliminarEtiquetas`.
- [ ] Modificar `src/components/BaseDeDatos/UsoAlmacenamientoListados.js`.
  - [ ] Cambiar `VERSION_LISTADOS` de `'1.4'` a `'1.5'`.
  - [ ] Agregar `contextoBusqueda: ''` a la creación de un listado nuevo.
  - [ ] Agregar `contextoBusqueda` al objeto devuelto por `normalizarListado`.
  - [ ] Normalizar el valor con `normalizarEntradaBusquedaArticulo` y convertir campos ausentes de colecciones anteriores en `''`.
  - [ ] Mantener el contexto fuera de `configuracion`, porque es dato funcional del listado y no una columna visible.
  - [ ] Confirmar que `duplicarListado` copie `contextoBusqueda` mediante la expansión del listado original.
  - [ ] No modificar la lógica de IDs, fechas, orden ni normalización de artículos.

## FASE 4: integrar el contexto en Listados

- [ ] Modificar `src/pages/PaginaListados.vue` para que `listadoActivo.contextoBusqueda` sea la única fuente de verdad del contexto del listado.
  - [ ] Pasar a `FormularioListado` la prop `:contexto-busqueda="listadoActivo.contextoBusqueda"`.
  - [ ] Escuchar `@actualizar-contexto="guardarContextoBusqueda"`.
  - [ ] Crear `async function guardarContextoBusqueda(contextoBusqueda)`.
    - Salir si no existe `listadoActivo`.
    - Actualizar `listadoActivo.value.contextoBusqueda` inmediatamente para que la interfaz y los resultados reaccionen.
    - Persistir mediante `persistirActivo()`.
    - Capturar errores y notificar `No se pudo guardar el contexto de búsqueda`.
  - [ ] No limpiar el contexto desde `agregarArticulo`, `insertarArticulo`, `confirmarArticuloRepetido`, `cancelarArticuloRepetido`, `confirmarEliminarTodos` ni cambios de orden o columnas.
  - [ ] Al abrir otro listado, mostrar automáticamente el contexto de ese listado.
- [ ] Modificar `src/components/Logica/Listados/FormularioListado.vue`.
  - [ ] Importar `CampoContextoArticulo` y `BuscadorArticulos` desde `../Compartidos/`.
  - [ ] Reemplazar el import y uso de `CodigoMasNombre` por `BuscadorArticulos`.
  - [ ] Agregar la prop `contextoBusqueda` como `String` con valor predeterminado `''`.
  - [ ] Agregar el evento `actualizar-contexto` a `defineEmits`.
  - [ ] Renderizar `CampoContextoArticulo` antes de `ControlAutoseleccionArticulo`, con `id-campo="contexto-listado"` y el mismo estado `deshabilitado` del formulario.
  - [ ] Implementar el enlace explícito `:model-value="contextoBusqueda"` y emitir `actualizar-contexto` desde `@update:model-value`.
  - [ ] Pasar `:contexto-busqueda="contextoBusqueda"` a `BuscadorArticulos`.
  - [ ] Modificar `resolverBusqueda` para utilizar `obtenerArticuloExacto`.
    - Los códigos exactos deben continuar resolviéndose aunque no coincidan con el contexto.
    - Los nombres exactos deben respetar el contexto.
    - Conservar la selección de `estadoBusqueda.articuloUnico` como alternativa.
  - [ ] Mantener intactos el botón Copiar, `usarTextoCopiadoInput`, cámara, autoselección, repetidos y métodos expuestos.

## FASE 5: integrar el contexto en Stock

- [ ] Modificar `src/pages/PaginaStock.vue`.
  - [ ] Importar `CampoContextoArticulo`, `BuscadorArticulos`, `obtenerArticuloExacto`, `AMBITOS_CONTEXTO_ARTICULO`, `obtenerContextoArticulo` y `guardarContextoArticulo`.
  - [ ] Reemplazar `CodigoMasNombre` por `BuscadorArticulos`.
  - [ ] Crear `const contextoBusqueda = ref('')`.
  - [ ] Renderizar `CampoContextoArticulo` inmediatamente antes de `.bloque-buscador-stock`, con `id-campo="contexto-stock"` y `:deshabilitado="hayConflictoFuente"`.
  - [ ] Pasar `:contexto-busqueda="contextoBusqueda"` a `BuscadorArticulos`.
  - [ ] Crear `async function actualizarContextoBusqueda(valor)`.
    - Actualizar el ref inmediatamente.
    - Persistir en el ámbito `AMBITOS_CONTEXTO_ARTICULO.STOCK`.
    - Notificar un error si falla el guardado y conservar el valor visible para que el usuario pueda reintentar editándolo.
  - [ ] Cargar el contexto de Stock dentro de `onMounted`, en paralelo con `recargarDatos`, antes de considerar lista la pantalla.
  - [ ] Modificar `buscarArticuloExacto` para delegar en `obtenerArticuloExacto` con el contexto actual.
  - [ ] Mantener la búsqueda exacta por código sin contexto para escáner y Enter.
  - [ ] No limpiar `contextoBusqueda` en `cancelarSeleccion`, `confirmarEliminarTodos`, `confirmarNuevaSesion`, importaciones ni desmontaje.
  - [ ] Mantener el botón Copiar actual limitado al contenido de `busquedaArticulo`.

## FASE 6: integrar el contexto en Ubicaciones

- [ ] Modificar `src/components/Logica/Ubicaciones/FormularioUbicacion.vue`.
  - [ ] Importar `CampoContextoArticulo` y `BuscadorArticulos` desde `../Compartidos/`.
  - [ ] Importar almacenamiento de contextos y el ámbito `UBICACIONES`.
  - [ ] Reemplazar `CodigoMasNombre` por `BuscadorArticulos`.
  - [ ] Crear `const contextoBusqueda = ref('')`.
  - [ ] Renderizar `CampoContextoArticulo` al inicio de `.ubicacion-campo-con-buscador`, antes de `ControlAutoseleccionArticulo`, con `id-campo="contexto-ubicaciones"`.
  - [ ] Pasar `:contexto-busqueda="contextoBusqueda"` al buscador.
  - [ ] Crear `actualizarContextoBusqueda(valor)` para actualizar y persistir el ámbito `UBICACIONES`.
  - [ ] Ampliar el `Promise.all` de `onMounted` para cargar última ubicación, autoselección y contexto en paralelo.
  - [ ] Mantener el contexto al agregar una ubicación, limpiar la ubicación recordada, cerrar la tarjeta, usar cámara o eliminar registros desde la página padre.
  - [ ] Mantener sin cambios la lógica de historial, información del artículo, ubicación y doble espacio del input de código.

## FASE 7: integrar el contexto en Consulta de ubicación

- [ ] Modificar `src/pages/ConsultaDeUbicacion.vue`.
  - [ ] Importar `CampoContextoArticulo`, `BuscadorArticulos`, `obtenerArticuloExacto` y almacenamiento del ámbito `CONSULTA_UBICACION`.
  - [ ] Reemplazar `CodigoMasNombre` por `BuscadorArticulos`.
  - [ ] Crear `const contextoBusqueda = ref('')`.
  - [ ] Renderizar `CampoContextoArticulo` inmediatamente antes de `.bloque-buscador`, con `id-campo="contexto-consulta-ubicacion"`.
  - [ ] Pasar `:contexto-busqueda="contextoBusqueda"` al buscador.
  - [ ] Crear `actualizarContextoBusqueda(valor)` con persistencia en `CONSULTA_UBICACION`.
  - [ ] Cargar el contexto en `onMounted` junto con la inicialización existente de base de datos y estado de pantalla.
  - [ ] Reemplazar la implementación local de `buscarEnBase` por una delegación a `obtenerArticuloExacto`.
  - [ ] Mantener la regla de que escaneo y código exacto ignoran el contexto.
  - [ ] Mantener el contexto al seleccionar, cerrar un resultado, actualizar una ubicación, copiar texto o utilizar la cámara.
  - [ ] No aplicar el contexto al historial mostrado después de seleccionar un artículo.

## FASE 8: integrar el contexto en Etiquetas

- [ ] Modificar `src/components/Logica/Etiquetas/FormularioEtiqueta.vue`.
  - [ ] Importar `onMounted` además de `ref` y `watch`.
  - [ ] Importar `CampoContextoArticulo`, `BuscadorArticulos` y almacenamiento del ámbito `ETIQUETAS`.
  - [ ] Reemplazar `CodigoMasNombre` por `BuscadorArticulos`.
  - [ ] Crear `const contextoBusqueda = ref('')`.
  - [ ] Renderizar `CampoContextoArticulo` como primer control del formulario, antes del campo `Código del artículo`, con `id-campo="contexto-etiquetas"`.
  - [ ] Pasar `:contexto-busqueda="contextoBusqueda"` al buscador.
  - [ ] Crear `actualizarContextoBusqueda(valor)` con persistencia en `ETIQUETAS`.
  - [ ] Cargar el contexto en `onMounted`.
  - [ ] Mantener el contexto al agregar una etiqueta, procesar cámara, limpiar ubicación, reiniciar cantidad o limpiar todas las etiquetas desde `PaginaEtiquetas.vue`.
  - [ ] Mantener la autoselección exclusiva de coincidencias `codigo-escaneado` y no ampliarla a coincidencias textuales únicas como parte de este plan.
  - [ ] No modificar memorias de etiquetas, composición de descripción ni generación de PDF.

## FASE 9: preparar el contrato para la futura Capitana Bita

- [ ] Documentar con comentarios breves en `ServicioBusquedaArticulos.js` solamente las reglas que no sean evidentes:
  - El código exacto ignora el contexto por seguridad operativa.
  - El contexto se aplica a nombres y exige todos sus términos.
  - `buscarArticulos` es el punto de entrada para resultados múltiples.
  - `obtenerArticuloExacto` es el punto de entrada para resoluciones deterministas.
- [ ] Evitar que componentes de IA futuros necesiten importar `BuscadorArticulos.vue`.
- [ ] Garantizar que una futura integración pueda llamar al servicio con datos como:

  ```js
  buscarArticulos({
    articulos: obtenerArticulosCargados(),
    busqueda: pedidoInterpretado,
    contextoBusqueda,
  })
  ```

- [ ] No agregar todavía parámetros, modelos de memoria ni estructuras específicas de Gemini que no tengan consumidores en esta fase.
- [ ] No usar el nombre Capitana Bita en la interfaz durante este plan; pertenece al segundo plan.

## FASE TESTING

- [ ] Ejecutar `rg -n "CodigoMasNombre" src` y verificar que no queden imports ni usos del componente eliminado.
- [ ] Ejecutar `rg -n "BuscadorArticulos|CampoContextoArticulo|contextoBusqueda" src` y revisar que los cinco consumidores estén conectados.
- [ ] Ejecutar `npm run lint` y corregir todos los errores introducidos.
- [ ] Ejecutar `npm run build` y confirmar que Quasar compile sin errores.
- [ ] Ejecutar `npm test` dejando documentado que actualmente el script no contiene pruebas automatizadas reales.
- [ ] Probar con contexto vacío en los cinco módulos.
  - Confirmar que los resultados, selección, autoselección y cámara mantienen el comportamiento anterior.
  - Confirmar que una búsqueda por descripción continúa mostrando hasta 50 resultados ordenados por relevancia.
- [ ] Probar en Listados con el Excel maestro:
  - Usar contexto `RK 2023` y búsqueda `FILTRO AIRE`; comprobar que aparezcan los artículos relacionados con RK125 2023 y no filtros de otros modelos.
  - Usar contexto `CK 110` y búsqueda `LLANTA`; comprobar que aparezcan `LLANTA DEL. CK 110` y `LLANTA TRAS. CK 110`.
  - Usar contexto `CLASSIC RETRO` y búsqueda `RUEDA`; comprobar que aparezcan las ruedas de Classic Retro y no las llantas de CK 110.
  - Usar contexto `MAX` y búsqueda `JUNTA`; comprobar que permanezcan múltiples variantes Max porque el contexto es deliberadamente amplio.
- [ ] Probar que `RK 125` coincida con nombres que contienen `RK125`, validando coincidencia parcial de términos contextuales.
- [ ] Probar un contexto que no coincida con ningún artículo y verificar el estado `Artículo inexistente` sin errores de consola.
- [ ] Con un contexto deliberadamente incompatible, escanear o escribir un código exacto válido y pulsar Enter.
  - Confirmar que el artículo se resuelva y seleccione igualmente.
  - Confirmar que el contexto permanezca sin cambios después de la selección.
- [ ] Probar un nombre exacto incompatible con el contexto y confirmar que no se seleccione mediante Enter.
- [ ] Probar la persistencia independiente:
  - Guardar valores diferentes en Listados, Stock, Ubicaciones, Consulta de ubicación y Etiquetas.
  - Cerrar completamente la aplicación y volver a abrirla.
  - Confirmar que cada módulo recupere únicamente su propio valor.
- [ ] Probar Listados:
  - Crear dos listados con contextos diferentes y alternar entre ambos.
  - Confirmar que cada listado recupere su propio contexto.
  - Duplicar un listado y comprobar que la copia conserve el contexto.
  - Eliminar todos los artículos y comprobar que el contexto permanezca.
  - Eliminar un listado y comprobar que su contexto desaparezca junto con el listado sin afectar a los demás.
- [ ] Probar Stock:
  - Confirmar un conteo y verificar que el contexto permanezca.
  - Eliminar la sesión y verificar que el contexto permanezca.
  - Crear una sesión nueva y verificar que el contexto permanezca.
- [ ] Probar Ubicaciones y Etiquetas:
  - Agregar y eliminar registros individuales.
  - Eliminar todos los registros.
  - Confirmar que sus contextos permanezcan.
- [ ] Probar ambos mecanismos autorizados para vaciar cada contexto:
  - Borrar todo el texto mediante teclado y comprobar que permanezca vacío después de reiniciar.
  - Escribir un valor, pulsar la papelera roja y comprobar que permanezca vacío después de reiniciar.
- [ ] Confirmar que editar parcialmente o reemplazar el texto persista el último valor visible.
- [ ] Confirmar que el botón Copiar de los buscadores siga copiando y reponiendo solamente el texto del artículo, sin copiar ni modificar el contexto.
- [ ] Probar la interfaz en Android y navegador web:
  - Revisar anchos angostos, teclado abierto, foco, cursor, desplazamiento y listas desplegables.
  - Confirmar que la papelera permanezca dentro del campo, sea fácil de tocar y no provoque submit accidental.
  - Confirmar que los resultados no queden ocultos ni desbordados por el nuevo campo.
  - Confirmar legibilidad con los colores definidos en `src/css/app.css`.
- [ ] Revisar la consola durante edición, persistencia, selección, cambio de módulo y reinicio; no deben aparecer errores nuevos ni promesas rechazadas.
- [ ] Ejecutar una búsqueda final de texto dañado en todos los archivos creados o modificados y corregir cualquier secuencia como `Ã`, `Â` o `â` antes de cerrar la implementación.
