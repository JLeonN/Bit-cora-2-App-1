<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h3 class="modal-titulo">Editar Pedido</h3>
      <div class="modal-campo">
        <label for="pedido">Nuevo número de pedido</label>
        <input
          id="pedido"
          type="text"
          v-model="pedidoEditado"
          @focus="modalActivo = true"
          @blur="modalActivo = false"
        />
      </div>
      <DosBotones
        textoAceptar="Guardar"
        textoCancelar="Cancelar"
        @aceptar="guardarCambios"
        @cancelar="$emit('cerrar')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'

const props = defineProps({
  pedido: String,
})
const emit = defineEmits(['guardar', 'cerrar'])

const pedidoEditado = ref(props.pedido)
const modalActivo = ref(false)

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
