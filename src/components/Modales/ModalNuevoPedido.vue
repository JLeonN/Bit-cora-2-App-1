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
              required
              @focus="modalActivo = true"
              @blur="modalActivo = false"
            />
            <!-- Botón de cámara -->
            <button type="button" class="boton-camara" @click="abrirCamara">
              <IconCamera :size="18" :stroke="1.5" />
            </button>
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
import { Camera, CameraResultType } from '@capacitor/camera'
import { IconCamera } from '@tabler/icons-vue'

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

const abrirCamara = async () => {
  try {
    const foto = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.Base64,
    })
    console.log('Foto tomada:', foto)
    alert('Foto tomada con éxito')
  } catch (error) {
    console.error('Error al abrir la cámara', error)
  }
}
</script>
