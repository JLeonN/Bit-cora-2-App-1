<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h2 class="modal-titulo">Nuevo pedido</h2>
      <form @submit.prevent="enviarPedido">
        <!-- Campo número de pedido -->
        <div class="modal-campo">
          <label for="numeroPedido">Número de pedido</label>
          <div class="campo-con-boton">
            <input
              id="numeroPedido"
              v-model="numeroPedido"
              type="text"
              :placeholder="textoPlaceholder"
              @focus="modalActivo = true"
              @blur="modalActivo = false"
              @input="restablecerPlaceholder"
              :class="{ 'input-error': mostrarError, 'animar-error': animarError }"
            />
            <!-- Botón de cámara -->
            <BotonCamara />
          </div>
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
import BotonCamara from '../Botones/BotonCamara.vue'

const emit = defineEmits(['agregar-pedido', 'cerrar'])

const numeroPedido = ref('')
const modalActivo = ref(false)
const mostrarError = ref(false)
const animarError = ref(false)
const textoPlaceholder = ref('Número de pedido')

const enviarPedido = () => {
  if (!numeroPedido.value.trim()) {
    mostrarError.value = true
    textoPlaceholder.value = 'Escribí hermano'
    animarError.value = true
    setTimeout(() => (animarError.value = false), 500)
    return
  }

  const pedido = {
    numero: numeroPedido.value.trim(),
    fecha: new Date().toISOString().split('T')[0],
  }

  numeroPedido.value = ''
  mostrarError.value = false
  textoPlaceholder.value = 'Número de pedido'
  emit('agregar-pedido', pedido)
}

const restablecerPlaceholder = () => {
  mostrarError.value = false
  textoPlaceholder.value = 'Número de pedido'
}
</script>
