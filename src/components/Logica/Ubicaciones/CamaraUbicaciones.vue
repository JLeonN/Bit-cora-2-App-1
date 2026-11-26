<template>
  <CamaraEscaneo modo-ubicaciones @cancelar="emit('cancelar')" @finalizar="emit('finalizar', $event)" @modal-abierto="emit('modal-abierto')" @modal-cerrado="emit('modal-cerrado')" />
</template>

<script setup>
import CamaraEscaneo from './CamaraEscaneo.vue'

const emit = defineEmits(['cancelar', 'finalizar', 'modal-abierto', 'modal-cerrado'])
</script>
