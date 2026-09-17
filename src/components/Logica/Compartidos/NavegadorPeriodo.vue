<template>
  <div class="navegador-periodo">
    <button
      type="button"
      class="boton-navegador-periodo"
      :disabled="!puedeAnterior"
      :title="textoAnterior"
      :aria-label="textoAnterior"
      @click="emit('anterior')"
    >
      <IconChevronLeft :size="26" :stroke="2" />
    </button>
    <h2 class="titulo-tabla titulo-periodo">{{ etiqueta }}</h2>
    <button
      type="button"
      class="boton-navegador-periodo"
      :disabled="!puedeSiguiente"
      :title="textoSiguiente"
      :aria-label="textoSiguiente"
      @click="emit('siguiente')"
    >
      <IconChevronRight :size="26" :stroke="2" />
    </button>
  </div>
</template>

<script setup>
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'

defineProps({
  etiqueta: {
    type: String,
    required: true,
  },
  puedeAnterior: {
    type: Boolean,
    default: false,
  },
  puedeSiguiente: {
    type: Boolean,
    default: false,
  },
  textoAnterior: {
    type: String,
    default: 'No hay períodos anteriores',
  },
  textoSiguiente: {
    type: String,
    default: 'No hay períodos siguientes',
  },
})

const emit = defineEmits(['anterior', 'siguiente'])
</script>

<style scoped>
.navegador-periodo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.titulo-periodo {
  margin: 0;
  text-align: center;
}
.boton-navegador-periodo {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: 1px solid var(--color-borde);
  border-radius: 50%;
  background: var(--color-superficie);
  color: var(--color-acento);
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;
}
.boton-navegador-periodo:hover:not(:disabled) {
  transform: scale(1.08);
  background: var(--color-fondo);
}
.boton-navegador-periodo:active:not(:disabled) {
  transform: scale(0.95);
}
.boton-navegador-periodo:disabled {
  color: var(--color-desactivado);
  cursor: not-allowed;
  opacity: 0.45;
}
.boton-navegador-periodo:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}
@media (max-width: 480px) {
  .navegador-periodo {
    gap: 0.5rem;
  }
  .titulo-periodo {
    font-size: 1.2rem;
  }
  .boton-navegador-periodo {
    width: 38px;
    height: 38px;
  }
}
</style>
