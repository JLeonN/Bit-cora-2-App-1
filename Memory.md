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
- 2026-10-09: Etiquetas: la lista de `historial_etiquetas` es canónica y compartida; las descripciones visibles se proyectan por tamaño sin persistir préstamos. Las memorias grandes conservan `memoria_etiquetas_v1` y las chicas usan `memoria_etiquetas_2_5x6_7_v1`. El layout 10 × 15 permanece en `UsoLayoutEtiquetaPreview.js` y el de 67 × 25 mm vive en `UsoLayoutEtiquetaChica.js`. La chica muestra como máximo cuatro renglones; cambiar de pestaña o abrir y cerrar la edición sin cambios no trunca el dato original. Desde el 10-10, su letra se ajusta automáticamente al espacio o usa un tamaño manual guardado con la memoria chica y exportado en JSON. Ver `Planes/PlanEtiquetasDosTamanos.md`.
- 2026-10-18: El formato horizontal de 50 × 25 mm, con margen inicial de 3 mm y memoria propia `memoria_etiquetas_5x2_5_v1`, quedó calibrado en papel por Leo. La impresión actual se ve granulada frente a Word: `GeneradorEtiquetas5x2p5PDF.js` ofrece temporalmente tres variantes para comparar en la impresora (PNG, PNG con barras dibujadas directamente y PDF vectorial). Mantener intacto el 10 × 15 y decidir la variante definitiva después de la prueba física. Ver `Planes/PlanesTerminados/PlanEtiqueta5x2p5.md`.
