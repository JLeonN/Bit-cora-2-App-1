<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div class="modal-contenido">
      <h2 class="modal-titulo">Nuevo pedido</h2>
      <form @submit.prevent="enviarPedido">
        <div class="modal-campo">
          <label for="numeroPedido">Número de pedido</label>
          <input id="numeroPedido" v-model="numeroPedido" type="text" required />
        </div>
        <div class="modal-botones">
          <button type="submit">Agregar</button>
          <button type="button" @click="$emit('cerrar')">Cancelar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Declaramos los eventos que este componente puede emitir
const emit = defineEmits(['agregar-pedido', 'cerrar'])

const numeroPedido = ref('')

const enviarPedido = () => {
  const pedido = {
    numero: numeroPedido.value,
    fecha: new Date().toISOString().split('T')[0],
  }
  numeroPedido.value = ''
  emit('agregar-pedido', pedido)
}
</script>
