# Memoria del proyecto

Este archivo conserva decisiones y aprendizajes útiles para trabajos futuros en Bitácora 2. No es un registro de cada cambio: Git guarda el historial y `Planes/` conserva los planes y resúmenes.

## Cómo mantener esta memoria

- Anotar solo información que ayude a tomar decisiones futuras y que sea difícil de recuperar rápidamente del código.
- Indicar fecha y archivos relacionados cuando aporte contexto.
- Revisar cada entrada antes de usarla; si dejó de ser cierta, corregirla o quitarla.
- Sustituir información antigua por una síntesis vigente. Mantener el archivo idealmente por debajo de 100 líneas.
- No guardar secretos, credenciales, datos personales ni copias extensas de otros documentos.

## Puntos de referencia

- Las reglas obligatorias del repositorio están en `AGENTS.md` y tienen prioridad sobre esta memoria.
- La descripción general y el proceso de publicación web están en `README.md`.
- Los trabajos pendientes sin plan propio están en `Planes/PlanesFuturos/TareasPendientes.md`; los planes y resúmenes de módulos están en `Planes/`.
- La versión actual se consulta en `package.json`, no se mantiene una copia aquí.

## Decisiones y aprendizajes

- 2026-10-09: Se adopta una memoria curada para conservar contexto reutilizable entre trabajos. Las tareas terminadas se reflejan en sus archivos, planes y Git; aquí se registra solo lo que resulte útil para decisiones posteriores.
- 2026-10-09: Etiquetas: la lista de `historial_etiquetas` es canónica y compartida; las descripciones visibles se proyectan por tamaño sin persistir préstamos. Las memorias grandes conservan `memoria_etiquetas_v1` y las chicas usan `memoria_etiquetas_2_5x6_7_v1`. El layout 10 × 15 permanece en `UsoLayoutEtiquetaPreview.js` y el de 67 × 25 mm vive en `UsoLayoutEtiquetaChica.js`. La chica muestra como máximo cuatro renglones; cambiar de pestaña o abrir y cerrar la edición sin cambios no trunca el dato original. Los tres tamaños admiten letra automática o tamaño manual de la descripción, guardado por formato en la memoria y exportado en JSON; 10 × 15 permite hasta 80 pt y las chicas hasta 40 pt. Ver `Planes/PlanEtiquetasDosTamanos.md`.
- 2026-10-24: Leo confirmó en papel que la variante vectorial imprime nítida en 50 × 25 mm, aunque su código de barras no se leyó en una prueba posterior. Las etiquetas de 50 × 25 y 67 × 25 mm comparten el generador vectorial de PDF y ahora usan los mismos tramos de barras en la vista previa, con un límite de 3 mm libres a cada lado. Cada código se prepara una vez por artículo y se reutiliza en sus copias. Faltan pruebas físicas de lectura con los nuevos anchos y alturas; la de 67 × 25 mm aún requiere comprobar la calidad física. El 10 × 15 conserva su generador JPEG. Ver `Planes/PlanesTerminados/PlanEtiqueta5x2p5.md`.
- 2026-10-24: En Android, el contexto de Ubicaciones ocultaba descripciones exactas y prefijos de código, mientras que el código completo sí aparecía. La búsqueda ahora reconoce esos identificadores directos aunque haya un contexto distinto; el resto de sugerencias conserva el filtro. La medición compartida de texto de las etiquetas chicas considera tanto la fuente de vista previa como Helvetica del PDF para evitar saltos de línea exclusivos del PDF. La lectura física de los códigos de barras sigue pendiente de prueba con impresora y escáner.
- 2026-10-28: El enfoque de inputs en Ubicaciones, Consulta, Listados, Stock y Etiquetas se ajusta en `ServicioEnfoqueInput.js` según `visualViewport`. Cada enfoque admite un ajuste inicial; un gesto táctil o de rueda cancela los desplazamientos pendientes para permitir scroll manual. El campo Ubicación del formulario de Ubicaciones se excluye con `data-sin-ajuste-enfoque`. En Etiquetas, el límite superior contempla la barra fija de medidas. Se verificó por WebView USB que el campo de Etiquetas queda 6 px debajo de la barra, el scroll manual persiste y solo el campo de código en Ubicaciones provoca el ajuste. Preparadores conserva su comportamiento.
- 2026-10-28: En Etiquetas, las columnas de una estantería física forman una estructura continua y comparten postes, sin huecos entre ellas. La columna A fija inicialmente los niveles de todas; luego cada columna puede ajustarse por separado. Las columnas nuevas heredan los niveles actuales de A. La cantidad de estanterías produce copias del mismo juego de códigos (A1, B1, etc.), no códigos distintos por estantería. Ver `FormularioEstantes.vue`.
