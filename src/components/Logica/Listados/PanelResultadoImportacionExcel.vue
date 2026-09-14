<template>
  <section class="panel-resultado-importacion" aria-live="polite">
    <header class="encabezado-resultado-importacion">
      <div>
        <h3>Importación terminada</h3>
        <p class="nombre-archivo-importado">{{ resultado.nombreArchivo }}</p>
        <p>Se agregaron {{ resultado.cantidadAgregada }} artículos de {{ resultado.totalFilasUtiles }} filas útiles.</p>
      </div>
      <button type="button" class="boton-cerrar-resultado" title="Cerrar resumen" @click="emit('cerrar')">
        <IconX :size="20" />
      </button>
    </header>
    <div v-if="resultado.repetidos.length" class="seccion-resultado-importacion">
      <h4><IconRepeat :size="19" /> Repetidos agregados</h4>
      <article v-for="repetido in resultado.repetidos" :key="repetido.codigo" class="detalle-resultado-importacion">
        <strong>{{ repetido.codigo }} · {{ repetido.descripcion }}</strong>
        <span>{{ repetido.cantidadImportada }} filas del Excel · {{ repetido.cantidadPrevia }} previas en el listado</span>
      </article>
    </div>
    <div v-if="resultado.ambiguas.length" class="seccion-resultado-importacion">
      <h4><IconAlertTriangle :size="19" /> Filas ambiguas</h4>
      <article v-for="fila in resultado.ambiguas" :key="fila.idFilaImportada" class="detalle-resultado-importacion">
        <strong>{{ fila.hoja }}, fila {{ fila.numeroFila }}</strong>
        <span>{{ fila.textoOriginal }}</span>
        <span>{{ fila.motivo }}</span>
        <span v-if="fila.candidatos.length">Candidatos: {{ describirCandidatos(fila.candidatos) }}</span>
      </article>
    </div>
    <div v-if="resultado.noEncontradas.length" class="seccion-resultado-importacion">
      <h4>No encontrados</h4>
      <article v-for="fila in resultado.noEncontradas" :key="fila.idFilaImportada" class="detalle-resultado-importacion">
        <strong>Fila: {{ fila.numeroFila }} {{ fila.textoOriginal }}</strong>
        <span>En la hoja: {{ fila.hoja }}</span>
      </article>
    </div>
    <div v-if="resultado.inconsistencias.length" class="seccion-resultado-importacion">
      <h4><IconAlertCircle :size="19" /> Inconsistencias</h4>
      <article v-for="fila in resultado.inconsistencias" :key="fila.idFilaImportada" class="detalle-resultado-importacion">
        <strong>{{ fila.hoja }}, fila {{ fila.numeroFila }}</strong>
        <span>{{ fila.textoOriginal }}</span>
        <span>{{ fila.motivo }}</span>
      </article>
    </div>
    <p v-if="hayFilasOmitidas" class="aviso-filas-omitidas">
      Las filas ambiguas, no encontradas e inconsistentes no fueron agregadas.
    </p>
  </section>
</template>

<script setup>
import { IconAlertCircle, IconAlertTriangle, IconRepeat, IconX } from '@tabler/icons-vue'
import { computed } from 'vue'

const props = defineProps({
  resultado: { type: Object, required: true },
})
const emit = defineEmits(['cerrar'])
const hayFilasOmitidas = computed(
  () =>
    props.resultado.ambiguas.length ||
    props.resultado.noEncontradas.length ||
    props.resultado.inconsistencias.length,
)

function describirCandidatos(candidatos) {
  return candidatos.map((articulo) => `${articulo.codigo} · ${articulo.nombre}`).join('; ')
}
</script>

<style scoped>
.panel-resultado-importacion {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  background: var(--color-superficie);
  color: var(--color-texto-principal);
}
.encabezado-resultado-importacion {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}
.encabezado-resultado-importacion h3 {
  margin: 0;
  font-size: 1.05rem;
}
.encabezado-resultado-importacion p {
  margin: 0.3rem 0 0;
}
.nombre-archivo-importado {
  overflow-wrap: anywhere;
  color: var(--color-texto-secundario);
}
.boton-cerrar-resultado {
  min-width: 44px;
  min-height: 44px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 1px solid var(--color-borde);
  border-radius: 9px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  cursor: pointer;
}
.boton-cerrar-resultado:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}
.seccion-resultado-importacion {
  margin-top: 1rem;
}
.seccion-resultado-importacion h4 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.55rem;
  color: var(--color-primario-claro);
}
.detalle-resultado-importacion {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.65rem 0;
  overflow-wrap: anywhere;
  border-top: 1px solid var(--color-borde);
}
.detalle-resultado-importacion span {
  color: var(--color-texto-secundario);
}
.aviso-filas-omitidas {
  margin: 1rem 0 0;
  color: var(--color-carga-claro);
  font-weight: 600;
}
</style>
