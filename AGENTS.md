## Prioridad e Inicio

- Este archivo es la fuente principal de instrucciones del repositorio.
- Antes de responder, planear o editar código, leer completo este archivo y obedecerlo.
- No omitir ninguna regla por resumen, memoria parcial o límite de contexto sin avisar explícitamente.
- Si en otro archivo aparecen instrucciones adicionales, este archivo tiene prioridad en caso de conflicto.

# Reglas del Proyecto

## Script Móvil (Android)

Script estándar para compilar y abrir en Android Studio:

```json
"cel": "npm run androidReleaseConSimbolos && npx cap open android"
```

Pasos que ejecuta:

1. `npm run androidReleaseConSimbolos` - compila la web, sincroniza Android, genera el AAB release, empaqueta los símbolos nativos y valida el zip
2. `npx cap open android` - abre Android Studio

Uso: `npm run cel`

---

## Codificación y Acentos

- Guardar siempre archivos de texto en **UTF-8** para evitar caracteres corruptos.
- No reemplazar acentos ni eñes por ASCII cuando el proyecto ya usa español.
- Si aparece texto dañado (ej.: `Ã¡`, `Ã±`, `â†’`), corregirlo antes de cerrar la tarea.
- Mantener redacción natural en español en UI, documentación, comentarios y mensajes.
- En este proyecto, usar español también en variables, funciones, clases, comentarios y documentación, salvo que una API externa obligue otro nombre.

## Flujo Antes de Codificar

- Antes de crear o editar código, revisar archivos cercanos y otros archivos del mismo módulo para mantener la misma línea del proyecto.
- Si el proyecto ya usa español, seguir en español y no mezclar inglés innecesario.
- Si una capa ya usa un patrón concreto, respetarlo en vez de introducir uno nuevo sin motivo.
- Si una capa usa un separador concreto, mantenerlo de forma consistente; no mezclar `_` con `-` dentro del mismo tipo de nombre.
- Si ya existe una convención para nombres o estructura, adaptarse a ella antes de proponer una nueva.
- Si el proyecto ya usa acentos, eñes o un estilo de redacción particular, conservarlo en vez de simplificarlo a ASCII.

## Convención de Nomenclatura

**Regla de oro:** nunca usar guiones bajos (`_`) ni guiones medios (`-`) en nombres de archivos o carpetas.

- Carpetas y archivos: siempre usar PascalCase, sin separadores.
  - Correcto: `GestionUsuarios/`, `ListaProductos.vue`, `PlanMejorasComercios.md`
  - Incorrecto: `gestion_usuarios/`, `lista-productos.vue`, `PLAN_MEJORAS_COMERCIOS.md`
- Variables y funciones: camelCase en español.
  - Correcto: `nombreProducto`, `calcularPrecioPromedio()`
  - Incorrecto: `nombre_producto`, `calcular_precio_promedio()`
- Constantes: MAYÚSCULAS con guiones bajos, única excepción permitida.
  - Correcto: `const API_URL = '...'`, `const MAX_ITEMS = 100`
- Clases CSS globales: kebab-case.
  - Correcto: `.contenedor-pagina`, `.buscador-centrado`
  - Incorrecto: `.contenedor_pagina`, `.BuscadorCentrado`

Antes de crear cualquier archivo, verifica que cumpla con PascalCase.

## Calidad de Código

- Prioridad absoluta a evitar errores de ESLint. Código ordenado y tipado.
- Si algo puede romperse o requiere atención especial, agrega una advertencia breve.

## Estilo de Comentarios

- Preferir comentarios de una sola línea siempre que sea posible.
- Usar `//` en lugar de `/* */` cuando el comentario cabe en una línea.
- Los comentarios multilínea `/** */` solo para documentación de funciones complejas.

## Estilo CSS

- No dejar líneas en blanco entre reglas CSS.
- Mantener el CSS compacto y sin espacios innecesarios entre selectores.
- Cuando haya que asignar colores a la app, no inventarlos: usar siempre las variables definidas en `src/css/Variables.css`.
  **Ejemplos:**

❌ **NO hacer:**

```css
.dialogo-duplicado-exacto {
  min-width: 350px;
}

.direccion-info {
  display: flex;
}

.q-item {
  transition: background-color 0.2s ease;
}
```

✅ **SÍ hacer:**

```css
.dialogo-duplicado-exacto {
  min-width: 350px;
}
.direccion-info {
  display: flex;
}
.q-item {
  transition: background-color 0.2s ease;
}
```

Planear con Leo → GPT-5.4
Ejecutar fases → GPT-5.3-Codex
Dudas rápidas → GPT-5.4-Mini
