<template>
  <section v-if="visible" class="panel-resultados-capitana-bita" aria-live="polite">
    <header class="encabezado-resultados-capitana-bita">
      <div>
        <strong>Capitana Bita</strong>
        <p v-if="resumen">{{ resumen }}</p>
        <p v-if="transcripcion">“{{ transcripcion }}”</p>
      </div>
      <button type="button" title="Cerrar resultados" @click="emit('cerrar')">
        <IconX :size="20" />
      </button>
    </header>
    <div
      v-for="grupo in ambiguedades"
      :key="grupo.idSolicitud"
      class="grupo-resultado-capitana-bita"
    >
      <p>
        <strong>{{ grupo.textoOriginal }}</strong
        >:
        {{
          grupo.candidatos.length === 1
            ? 'confirmá si este es el artículo correcto.'
            : 'elegí el artículo correcto.'
        }}
      </p>
      <small v-if="grupo.motivoConfirmacion">{{ grupo.motivoConfirmacion }}</small>
      <button
        v-for="(articulo, indice) in grupo.candidatos"
        :key="`${grupo.idSolicitud}-${indice}`"
        type="button"
        class="candidato-capitana-bita"
        @click="emit('seleccionar-candidato', { idSolicitud: grupo.idSolicitud, articulo })"
      >
        <span>{{ articulo.nombre }}</span
        ><small>{{ articulo.codigo }}</small>
      </button>
      <button
        type="button"
        class="omitir-capitana-bita"
        @click="emit('omitir-solicitud', grupo.idSolicitud)"
      >
        Omitir
      </button>
    </div>
    <div v-if="noEncontrados.length" class="grupo-resultado-capitana-bita">
      <strong>No encontrados</strong>
      <p v-for="grupo in noEncontrados" :key="grupo.idSolicitud">{{ grupo.textoOriginal }}</p>
    </div>
    <div v-if="inconsistencias.length" class="grupo-resultado-capitana-bita">
      <strong>Inconsistencias del Excel maestro</strong>
      <p v-for="grupo in inconsistencias" :key="grupo.idSolicitud">
        {{ grupo.textoOriginal }}: {{ grupo.motivoConfirmacion }}
      </p>
    </div>
    <div v-if="advertencias.length" class="grupo-resultado-capitana-bita">
      <strong>Advertencias de lectura</strong>
      <p v-for="(advertencia, indice) in advertencias" :key="indice">{{ advertencia }}</p>
    </div>
    <div
      v-for="propuesta in memoriasPropuestas"
      :key="propuesta.idSolicitud"
      class="memoria-propuesta"
    >
      <span>{{ propuesta.textoOriginal }} → {{ propuesta.articulo.nombre }}</span>
      <button type="button" @click="emit('recordar-seleccion', propuesta)">
        Recordar para {{ propuesta.contexto }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { IconX } from '@tabler/icons-vue'

const props = defineProps({
  transcripcion: { type: String, default: '' },
  ambiguedades: { type: Array, default: () => [] },
  noEncontrados: { type: Array, default: () => [] },
  inconsistencias: { type: Array, default: () => [] },
  advertencias: { type: Array, default: () => [] },
  resumen: { type: String, default: '' },
  tipoEntrada: { type: String, default: '' },
  memoriasPropuestas: { type: Array, default: () => [] },
})
const emit = defineEmits([
  'seleccionar-candidato',
  'omitir-solicitud',
  'recordar-seleccion',
  'cerrar',
])
const visible = computed(
  () =>
    Boolean(props.transcripcion) ||
    props.ambiguedades.length > 0 ||
    props.noEncontrados.length > 0 ||
    props.inconsistencias.length > 0 ||
    props.advertencias.length > 0 ||
    props.memoriasPropuestas.length > 0,
)
</script>

<style scoped>
.panel-resultados-capitana-bita {
  padding: 1rem;
  border: 1px solid var(--color-primario);
  border-radius: 12px;
  background: var(--color-superficie);
  color: var(--color-texto-principal);
}
.encabezado-resultados-capitana-bita {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.encabezado-resultados-capitana-bita p {
  margin: 0.35rem 0 0;
  color: var(--color-texto-secundario);
}
.encabezado-resultados-capitana-bita button {
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--color-texto-secundario);
  cursor: pointer;
}
.grupo-resultado-capitana-bita {
  display: grid;
  gap: 0.45rem;
  margin-top: 0.9rem;
}
.grupo-resultado-capitana-bita p {
  margin: 0;
}
.candidato-capitana-bita {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.7rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  cursor: pointer;
  text-align: left;
}
.candidato-capitana-bita small {
  color: var(--color-primario-claro);
}
.omitir-capitana-bita {
  min-height: 44px;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-superficie);
  color: var(--color-texto-secundario);
  cursor: pointer;
}
.memoria-propuesta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.9rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-borde);
}
.memoria-propuesta button {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-primario);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-primario-claro);
  cursor: pointer;
}
@media (max-width: 600px) {
  .memoria-propuesta {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
