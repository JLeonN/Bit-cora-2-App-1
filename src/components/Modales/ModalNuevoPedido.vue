<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h2 class="modal-titulo">Nuevo pedido</h2>
      <!-- Campo número de pedido -->
      <form @submit.prevent="confirmarPedidoManual">
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
              @keyup.enter="confirmarPedidoManual"
              :class="{ 'input-error': mostrarError, 'animar-error': animarError }"
            />
            <!-- Botón de cámara -->
            <button type="button" class="boton-camara" @click="abrirCamara">
              <IconCamera :stroke="2" />
            </button>
          </div>
        </div>

        <!-- Botones Aceptar / Cancelar -->
        <DosBotones
          textoAceptar="Confirmar"
          textoCancelar="Cancelar"
          @aceptar="confirmarPedidoManual"
          @cancelar="$emit('cerrar')"
        />
      </form>

      <!-- Modal de la cámara -->
      <CamaraPedidos
        v-if="mostrarCamaraPedidos"
        @cancelar="cerrarCamaraYVolver"
        @codigo-detectado="onCodigoLeido"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'
import { IconCamera } from '@tabler/icons-vue'
import CamaraPedidos from '../Camara/CamaraPedidos.vue'

const emit = defineEmits(['agregar-pedido', 'cerrar'])
const numeroPedido = ref('')
const modalActivo = ref(false)
const mostrarError = ref(false)
const animarError = ref(false)
const textoPlaceholder = ref('Número de pedido')
const mostrarCamaraPedidos = ref(false)

// Confirmar pedido ingresado manualmente
const confirmarPedidoManual = () => {
  if (!numeroPedido.value.trim()) {
    mostrarError.value = true
    textoPlaceholder.value = '¡El campo no puede estar vacío!'
    animarError.value = true
    setTimeout(() => (animarError.value = false), 500)
    return
  }

  // Emitir el pedido al padre
  emit('agregar-pedido', [
    {
      numero: numeroPedido.value.trim(),
      fecha: new Date().toISOString().split('T')[0],
    },
  ])

  // Limpiar input y cerrar modal
  numeroPedido.value = ''
  mostrarError.value = false
  restablecerPlaceholder()
  emit('cerrar')
}

const restablecerPlaceholder = () => {
  mostrarError.value = false
  textoPlaceholder.value = 'Número de pedido'
}

// Abrir cámara
const abrirCamara = () => {
  mostrarCamaraPedidos.value = true
}
const cerrarCamaraYVolver = () => {
  mostrarCamaraPedidos.value = false
}

// Los pedidos de la cámara pueden ser varios
const onCodigoLeido = (codigos) => {
  emit(
    'agregar-pedido',
    codigos.map((codigo) => ({
      numero: codigo,
      fecha: new Date().toISOString().split('T')[0],
    })),
  )
  mostrarCamaraPedidos.value = false
  emit('cerrar')
}
</script>
