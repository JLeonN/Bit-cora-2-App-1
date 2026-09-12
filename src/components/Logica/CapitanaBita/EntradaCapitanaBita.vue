<template>
  <section class="entrada-capitana-bita" aria-label="Capitana Bita">
    <label for="entrada-capitana-bita">Capitana Bita</label>
    <div class="fila-entrada-capitana-bita">
      <input
        id="entrada-capitana-bita"
        v-model="texto"
        class="campo-entrada-formulario campo-capitana-bita"
        type="text"
        placeholder="Escribí o dictá una lista de artículos"
        :disabled="procesando || deshabilitado"
        @keyup.enter="enviar"
      />
      <button
        type="button"
        class="boton-capitana-bita"
        :class="{ 'boton-grabando': grabando }"
        :disabled="deshabilitado || (!disponible && !grabando)"
        :title="grabando ? 'Finalizar grabación' : 'Dictar pedido'"
        @click="alternar"
      >
        <IconMicrophone v-if="!grabando" :size="21" />
        <IconPlayerStop v-else :size="21" />
      </button>
      <button
        type="button"
        class="boton-capitana-bita"
        title="Enviar a Capitana Bita"
        :disabled="deshabilitado || !disponible || !texto.trim()"
        @click="enviar"
      >
        <IconSend :size="21" />
      </button>
    </div>
    <p v-if="grabando" class="estado-capitana-bita estado-grabando">
      Grabando… Tocá nuevamente para finalizar · {{ duracionFormateada }}
    </p>
    <p v-else-if="procesando" class="estado-capitana-bita">
      Capitana Bita está procesando el pedido…
    </p>
    <p v-else-if="error" class="estado-capitana-bita estado-error" role="alert">{{ error }}</p>
    <p v-else-if="motivoNoDisponible" class="estado-capitana-bita">
      {{ motivoNoDisponible }}
    </p>
  </section>
</template>

<script setup>
import { computed, watch } from 'vue'
import { IconMicrophone, IconPlayerStop, IconSend } from '@tabler/icons-vue'
import { usarCapitanaBita } from './UsoCapitanaBita.js'

const props = defineProps({
  contextoBusqueda: { type: String, default: '' },
  deshabilitado: { type: Boolean, default: false },
  identificadorDestino: { type: String, default: '' },
})
const emit = defineEmits(['resultado-procesado', 'estado-interaccion'])
const {
  texto,
  grabando,
  duracionGrabacion,
  procesando,
  disponible,
  motivoNoDisponible,
  error,
  enviarTexto,
  alternarGrabacion,
  cancelarGrabacion,
} = usarCapitanaBita({
  obtenerContextoBusqueda: () => props.contextoBusqueda,
  obtenerIdentificadorDestino: () => props.identificadorDestino,
})

const duracionFormateada = computed(() => {
  const minutos = Math.floor(duracionGrabacion.value / 60)
  const segundos = duracionGrabacion.value % 60
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
})

async function enviar() {
  const procesado = await enviarTexto()
  if (procesado) emit('resultado-procesado', procesado)
}

async function alternar() {
  const procesado = await alternarGrabacion()
  if (procesado) emit('resultado-procesado', procesado)
}

async function cerrarInteraccion() {
  return cancelarGrabacion()
}

watch([grabando, procesando], ([estaGrabando, estaProcesando]) => {
  emit('estado-interaccion', { grabando: estaGrabando, procesando: estaProcesando })
})
defineExpose({ cerrarInteraccion })
</script>

<style scoped>
.entrada-capitana-bita {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin: 0.75rem 0;
  padding: 0.85rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-superficie);
  color: var(--color-texto-principal);
}
.entrada-capitana-bita label {
  font-weight: 700;
}
.fila-entrada-capitana-bita {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.45rem;
}
.campo-capitana-bita {
  min-width: 0;
}
.boton-capitana-bita {
  width: 44px;
  min-height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-primario);
  color: var(--color-texto-principal);
  cursor: pointer;
}
.boton-capitana-bita:disabled {
  background: var(--color-desactivado);
  cursor: not-allowed;
}
.boton-grabando {
  background: var(--color-error);
}
.estado-capitana-bita {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.82rem;
}
.estado-grabando,
.estado-error {
  color: var(--color-error);
}
</style>
