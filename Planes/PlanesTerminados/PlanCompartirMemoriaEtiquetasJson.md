# PLAN COMPARTIR MEMORIA ETIQUETAS JSON

## Descripcion del plan

Agregar un flujo simple para compartir la memoria local de etiquetas mediante archivos JSON. La app debe permitir exportar las memorias guardadas del telefono, compartir ese archivo con otros usuarios e importar memorias recibidas aplicando una fusion segura por codigo.

## Objetivo principal

- Exportar la memoria local de etiquetas a un archivo JSON.
- Importar memorias desde un archivo JSON compartido.
- Fusionar memorias por codigo sin duplicados y conservando la version mas reciente.
- Integrar acciones de importar y exportar dentro de la tarjeta de resumen de etiquetas.

## Reglas del plan

- No usar Firebase, Drive, servidor ni sincronizacion automatica en esta fase.
- Mantener el flujo actual de memoria local sin cambios de comportamiento.
- El campo `codigo` es la clave unica de cada memoria.
- Si un codigo existe en memoria local y en el JSON importado, gana la entrada con `actualizadoEn` mas nuevo.
- Si un codigo existe en ambos lados con la misma descripcion y la misma fecha, se ignora como duplicado exacto.
- Si un codigo existe en ambos lados con la misma fecha pero distinta descripcion, gana la memoria local para evitar pisar cambios sin evidencia de que el importado sea mas nuevo.
- El export debe incluir como maximo las ultimas 1000 memorias, ordenadas por `actualizadoEn` descendente.
- La importacion debe aceptar como maximo 1000 entradas validas por archivo.
- El JSON exportado debe incluir metadatos de version, fecha de exportacion y cantidad de entradas.
- El JSON exportado debe incluir `exportadoPor` usando `obtenerNombreUsuario()` desde configuracion.
- El nombre del usuario exportador debe mostrarse durante la importacion y en el resultado final.
- La importacion debe validar estructura antes de modificar la memoria local.
- Antes de importar, crear una copia interna de respaldo de la memoria local actual.
- Si el archivo importado es invalido, mostrar error claro y no modificar memorias existentes.

## FASE 1: Definir formato JSON

### Objetivo

Establecer un contrato de archivo simple y estable para exportar e importar memorias.

- [ ] Definir estructura raiz del JSON con `version`, `exportadoEn`, `exportadoPor`, `cantidad` y `entradas`.
- [ ] Obtener `exportadoPor` desde `obtenerNombreUsuario()` al momento de exportar.
- [ ] Definir `entradas` como array de objetos para simplificar importacion y exportacion.
- [ ] Definir `cantidad` como la cantidad real de entradas incluidas en el archivo exportado.
- [ ] Definir cada entrada con `codigo`, `descripcionFormateada` y `actualizadoEn`.
- [ ] Validar que no se exporte ubicacion ni datos innecesarios.
- [ ] Definir nombre de archivo con fecha y hora para evitar confusiones.
- [ ] Documentar version inicial del formato como `1.0`.
- [ ] Usar este formato base:

```json
{
  "version": "1.0",
  "exportadoEn": 1780200000000,
  "exportadoPor": "Leo",
  "cantidad": 2,
  "entradas": [
    {
      "codigo": "1180300-083000",
      "descripcionFormateada": "KIT\nRACER 200/2023",
      "actualizadoEn": 1780199900000
    },
    {
      "codigo": "N80CBT00EJ",
      "descripcionFormateada": "DESCRIPCION EDITADA",
      "actualizadoEn": 1780199800000
    }
  ]
}
```

## FASE 2: Exportar memorias

### Objetivo

Permitir que el usuario genere y comparta un archivo JSON con las memorias locales.

- [ ] Reutilizar el modulo de almacenamiento de memoria de etiquetas para obtener todas las memorias.
- [ ] Importar `obtenerNombreUsuario()` para incluir el usuario configurado en el JSON.
- [ ] Crear funcion de exportacion que arme el JSON con metadatos.
- [ ] Ordenar memorias por `actualizadoEn` descendente antes de exportar.
- [ ] Exportar solo las ultimas 1000 memorias.
- [ ] Calcular `cantidad` segun las memorias realmente incluidas en el archivo.
- [ ] En web, descargar el archivo JSON.
- [ ] En movil, guardar archivo temporal y compartirlo con Capacitor Share.
- [ ] Incluir el nombre de usuario en el nombre del archivo exportado.
- [ ] Mostrar mensaje claro cuando no existan memorias para exportar.
- [ ] Mostrar confirmacion cuando la exportacion se complete.

## FASE 3: Importar y fusionar memorias

### Objetivo

Permitir que el usuario importe un archivo JSON y fusione memorias sin duplicados.

- [ ] Crear selector de archivo JSON para importar.
- [ ] Activar estado de carga `importandoMemorias` mientras se lee y fusiona el archivo.
- [ ] Leer y parsear el archivo de forma segura.
- [ ] Validar version y estructura del archivo.
- [ ] Leer `exportadoPor` del archivo y usar fallback `usuario desconocido` si no existe.
- [ ] Mostrar estado de carga con texto tipo `Importando memorias de {exportadoPor}`.
- [ ] Rechazar archivos con mas de 1000 entradas validas.
- [ ] Crear respaldo interno antes de modificar la memoria local.
- [ ] Fusionar entradas por `codigo` usando `actualizadoEn` mas nuevo.
- [ ] Ignorar duplicados exactos con mismo codigo, misma descripcion y mismo `actualizadoEn`.
- [ ] Ignorar entradas importadas mas viejas que la memoria local.
- [ ] Mantener memoria local cuando exista empate de fecha con descripcion distinta.
- [ ] Guardar la memoria fusionada en Capacitor Preferences.
- [ ] Devolver resumen de importacion: nuevas, actualizadas, ignoradas e invalidas.
- [ ] Mostrar mensaje con el resultado de la importacion incluyendo el nombre de `exportadoPor`.
- [ ] Reaplicar memoria importada sobre las etiquetas ya cargadas en pantalla y reportar cuantas cambiaron.

## FASE 4: Integrar botones en resumen de etiquetas

### Objetivo

Agregar controles visibles y simples dentro del bloque de informacion de etiquetas.

- [ ] Ubicar acciones dentro de la tarjeta de resumen actual de etiquetas.
- [ ] Crear una subzona visual para acciones de memoria dentro de esa tarjeta.
- [ ] Colocar la subzona debajo de las metricas y antes de la grilla de etiquetas.
- [ ] Agregar boton `Exportar memorias`.
- [ ] Agregar boton `Importar memorias`.
- [ ] Desactivar botones mientras `importandoMemorias` o `exportandoMemorias` esten activos.
- [ ] Mostrar estado visual de carga durante importacion y exportacion.
- [ ] Durante importacion, mostrar el nombre del usuario exportador cuando ya se haya leido el JSON.
- [ ] Mantener el boton de borrar todas las etiquetas separado de las acciones de memoria.
- [ ] Asegurar que el layout funcione en movil y escritorio.
- [ ] Usar colores existentes definidos en `src/css/app.css`.

## FASE TESTING

### Objetivo

Validar que el intercambio por JSON funcione sin perder memoria local ni crear duplicados.

- [ ] Exportar con memoria vacia y verificar mensaje esperado.
- [ ] Exportar con memorias existentes y verificar que el JSON contiene `version`, `exportadoEn`, `exportadoPor`, `cantidad` y `entradas`.
- [ ] Verificar que `exportadoPor` coincide con el nombre de usuario de Configuracion.
- [ ] Verificar que el nombre del archivo exportado incluye el usuario.
- [ ] Exportar mas de 1000 memorias simuladas y verificar que solo salen las 1000 mas recientes.
- [ ] Importar archivo invalido y verificar que la memoria local no cambia.
- [ ] Importar archivo con mas de 1000 entradas y verificar rechazo controlado.
- [ ] Importar memorias nuevas y verificar que se agregan.
- [ ] Importar archivo con `exportadoPor` y verificar mensaje `Importando memorias de...`.
- [ ] Importar archivo sin `exportadoPor` y verificar fallback `usuario desconocido`.
- [ ] Importar memorias con codigos existentes y `actualizadoEn` mas nuevo para verificar actualizacion.
- [ ] Importar memorias con codigos existentes y `actualizadoEn` mas viejo para verificar que se ignoran.
- [ ] Importar duplicados exactos y verificar que se ignoran sin duplicar datos.
- [ ] Importar empate de fecha con descripcion distinta y verificar que gana local.
- [ ] Verificar que se crea respaldo interno antes de fusionar.
- [ ] Verificar que las etiquetas visibles se refrescan cuando la importacion cambia memorias usadas en pantalla.
- [ ] Verificar que no se guarde ubicacion dentro del JSON.
- [ ] Verificar estado de carga en importacion y exportacion.
- [ ] Probar visualmente los botones en la tarjeta de resumen en movil.
- [x] Ejecutar `npm run lint` y corregir errores.
- [x] Ejecutar `npm run build` y corregir errores.

## Progreso del plan

- [x] Fase 1: Definir formato JSON
- [x] Fase 2: Exportar memorias
- [x] Fase 3: Importar y fusionar memorias
- [x] Fase 4: Integrar botones en resumen de etiquetas
- [ ] Fase Testing

Fecha de creacion: 31 de Mayo 2026
Fecha de ultima actualizacion: 31 de Mayo 2026
Estado: IMPLEMENTADO (pendiente testing manual funcional)
