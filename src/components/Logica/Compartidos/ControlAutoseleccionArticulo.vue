<template>
  <div class="control-autoseleccion-articulo">
    <q-toggle
      :model-value="modelValue"
      color="primary"
      dense
      label="Autoselección al encontrar un único artículo"
      @update:model-value="emit('update:modelValue', Boolean($event))"
    />
    <button
      type="button"
      class="boton-info-autoseleccion"
      :title="mostrarAyuda ? 'Ocultar explicación' : 'Ver cómo funciona la autoselección'"
      :aria-label="mostrarAyuda ? 'Ocultar explicación' : 'Ver cómo funciona la autoselección'"
      :aria-expanded="mostrarAyuda"
      @click="mostrarAyuda = !mostrarAyuda"
    >
      <IconInfoCircle :size="18" :stroke="2" />
    </button>
  </div>
  <div v-if="mostrarAyuda" class="ayuda-autoseleccion" role="note">
    <p class="texto-ayuda-autoseleccion">{{ textoAyuda }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconInfoCircle } from '@tabler/icons-vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  textoAyuda: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])
const mostrarAyuda = ref(false)
</script>
