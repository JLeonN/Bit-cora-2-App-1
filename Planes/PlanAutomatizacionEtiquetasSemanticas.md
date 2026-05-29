# PLAN AUTOMATIZACION ETIQUETAS SEMANTICAS 10X15

## Descripcion del plan

Implementar una capa semantica para transformar descripciones de repuestos en etiquetas legibles y consistentes en formato 10x15, reutilizando el motor actual de layout y tamano. El plan prioriza evitar regresiones, aplicar modo estricto para casos ambiguos y alcanzar una efectividad inicial de 90% sin edicion manual.

## Objetivo principal

- Separar automaticamente nucleo tecnico, compatibilidades y bloques secundarios en etiquetas 10x15
- Mantener el render visual actual (saltos por ancho, tamano de fuente y PDF) sin romper flujos existentes
- Lograr una calidad minima de 90% de etiquetas correctas en una muestra real

## Reglas del plan

- Aplicar solo al flujo de etiquetas 10x15 en esta fase
- Mantener modo estricto activo con umbral numerico:
- Si `confianzaSemantica >= 0.75`, aplicar composicion semantica completa
- Si `confianzaSemantica < 0.75`, aplicar fallback conservador (sin reordenamiento agresivo)
- No modificar el motor de escala y layout como estrategia principal, salvo ajustes menores necesarios para integracion
- Medir calidad con muestra real y criterio repetible

## FASE 1: Definir contrato semantico y casos de validacion

### Objetivo

Dejar documentadas las reglas operativas de clasificacion y composicion para que la implementacion sea determinista.

- [ ] Crear matriz de reglas con prioridades: limpieza, tokenizacion, clasificacion y composicion por lineas
- [ ] Definir patrones de compatibilidad por separadores (`/`) y bloques secundarios por parentesis
- [ ] Definir regla contextual para codigos alfanumericos (ejemplo tipo `T1002VX`) evitando regla fija de "modelo siempre al final"
- [ ] Definir correcciones de texto frecuentes (espacios, pegados y errores tipicos detectados en base real)
- [ ] Establecer criterio de confianza para modo estricto (alto, medio, bajo) y accion por nivel
- [ ] Reemplazar niveles alto/medio/bajo por escala numerica de `0.00` a `1.00` y documentar calculo de `confianzaSemantica`
- [ ] Definir criterio objetivo de "etiqueta correcta" para la metrica del 90%:
- [ ] Orden logico de lectura
- [ ] Legibilidad sin corte de tokens tecnicos relevantes
- [ ] Sin perdida de informacion relevante del texto original
- [ ] Compatibilidades separadas cuando correspondan por patron y contexto

## FASE 2: Implementar normalizacion y clasificacion semantica

### Objetivo

Construir la capa de interpretacion de descripcion previa al layout, desacoplada del render.

- [ ] Implementar funcion de normalizacion de descripcion con limpieza, unificacion y correcciones frecuentes
- [ ] Implementar tokenizacion robusta conservando codigos tecnicos y grupos de compatibilidad
- [ ] Implementar clasificador semantico para: nucleo tecnico, compatibilidad, bloque secundario y resto
- [ ] Implementar salida estructurada estandar para consumo de preview/PDF
- [ ] Integrar modo estricto para fallback seguro cuando la clasificacion sea ambigua

## FASE 3: Integrar composicion semantica al flujo de etiquetas 10x15

### Objetivo

Conectar la salida semantica al sistema actual sin romper el comportamiento visual y operativo existente.

- [ ] Integrar la composicion semantica en el punto de entrada de descripcion del flujo de etiquetas
- [ ] Mantener compatibilidad con edicion manual inline existente
- [ ] Garantizar que preview y PDF usen la misma descripcion compuesta
- [ ] Verificar que ubicacion, codigo de barras y cantidad de copias no cambien su comportamiento actual
- [ ] Confirmar que el rendimiento siga estable con lotes grandes de etiquetas

## FASE 4: Afinar reglas con muestra real y metricas

### Objetivo

Ajustar precision con datos reales antes del cierre de implementacion.

- [ ] Ejecutar muestra de 100 etiquetas reales tomadas del listado principal
- [ ] Congelar muestra reproducible de 100 etiquetas con semilla fija (`SEMILLA_MUESTREO = 260525`) y persistir lista de codigos evaluados
- [ ] Etiquetar resultados por categoria: correcto, aceptable con detalle menor, incorrecto
- [ ] Ajustar reglas con foco en errores de contexto y compatibilidad
- [ ] Repetir prueba hasta alcanzar 90% o mas de correctas sin edicion manual
- [ ] Preparar muestra de 10 ejemplos aleatorios para revision de Leo:
- [ ] Incluir exactamente 3 casos claramente problematicos (salida "mal")
- [ ] Incluir 5 casos intermedios o mejorables
- [ ] Incluir 2 casos que ya salgan bien
- [ ] Entregar la muestra mezclada, sin marcar visualmente cual grupo es cual

## FASE TESTING

### Objetivo

Validar de forma ejecutable por IA y revisable por humano que la automatizacion funciona y no introduce regresiones.

- [ ] Verificar con pruebas de unidad que la normalizacion y clasificacion mantienen resultados esperados en casos conocidos
- [ ] Verificar en integration flow que una misma descripcion produce igual composicion en preview y PDF
- [ ] Verificar fallback de modo estricto en descripciones ambiguas sin reordenamiento agresivo
- [ ] Verificar que casos con compatibilidades por `/` queden separados de forma legible
- [ ] Verificar que bloques entre parentesis se preserven como bloque secundario sin mezclar nucleo tecnico
- [ ] Verificar que no se rompa el flujo de carga, edicion y generacion de etiquetas en lote
- [ ] Validar metrica final: 90% o mas correctas sin edicion manual sobre la misma muestra congelada

## Progreso del plan

- [ ] Fase 1: Definir contrato semantico y casos de validacion
- [ ] Fase 2: Implementar normalizacion y clasificacion semantica
- [ ] Fase 3: Integrar composicion semantica al flujo de etiquetas 10x15
- [ ] Fase 4: Afinar reglas con muestra real y metricas
- [ ] Fase Testing

Fecha de creacion: 29 de Mayo 2026
Fecha de ultima actualizacion: 29 de Mayo 2026
Estado: BORRADOR
