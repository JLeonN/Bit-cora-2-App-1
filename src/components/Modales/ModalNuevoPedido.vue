<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h2 class="modal-titulo">Nuevo pedido</h2>
      <form @submit.prevent="enviarPedido">
        <div class="modal-campo">
          <label for="numeroPedido">Número de pedido</label>
          <input
            id="numeroPedido"
            v-model="numeroPedido"
            type="text"
            required
            @focus="modalActivo = true"
            @blur="modalActivo = false"
          />
        </div>
        <DosBotones
          textoAceptar="Agregar"
          textoCancelar="Cancelar"
          @aceptar="enviarPedido"
          @cancelar="$emit('cerrar')"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'

const emit = defineEmits(['agregar-pedido', 'cerrar'])

const numeroPedido = ref('')
const modalActivo = ref(false)

const enviarPedido = () => {
  const pedido = {
    numero: numeroPedido.value,
    fecha: new Date().toISOString().split('T')[0],
  }
  numeroPedido.value = ''
  emit('agregar-pedido', pedido)
}
</script>
