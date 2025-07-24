<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div class="modal-contenido">
      <h3 class="modal-titulo">Editar Pedido</h3>
      <div class="modal-campo">
        <label for="pedido">Nuevo número de pedido</label>
        <input id="pedido" type="text" v-model="pedidoEditado" />
      </div>
      <div class="modal-botones">
        <button @click="$emit('cerrar')">Cancelar</button>
        <button @click="guardarCambios">Guardar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  pedido: String,
})
const emit = defineEmits(['guardar', 'cerrar'])

const pedidoEditado = ref(props.pedido)

watch(
  () => props.pedido,
  (nuevo) => {
    pedidoEditado.value = nuevo
  },
)

function guardarCambios() {
  emit('guardar', pedidoEditado.value)
}
</script>
