<template>
  <!-- Modal de la cámara -->
  <div class="modal-fondo" @click.self="$emit('cancelar')">
    <div class="modal-camara">
      <!-- Caja de la cámara -->
      <div id="vista-camara" class="caja-camara">
        <!-- NUEVO: video embebido -->
        <video id="video-camara" autoplay playsinline></video>

        <!-- Miniatura como overlay -->
        <div v-if="ultimaCaptura" class="overlay-miniatura">
          <img :src="ultimaCaptura" alt="captura debug" class="mini-captura" />
        </div>
      </div>

      <!-- Parte inferior -->
      <div class="caja-inferior">
        <!-- Botón usar código detectado -->
        <button class="boton-usar-codigo" :disabled="!codigoDetectado" @click="agregarPedido">
          {{ pedidosEscaneados.length === 0 ? 'Nuevo pedido' : 'Siguiente pedido' }}:
          {{ codigoDetectado || '' }}
        </button>

        <!-- Botón finalizar (abre modal encima sin apagar cámara) -->
        <button
          class="boton-usar-codigo"
          :disabled="pedidosEscaneados.length === 0"
          @click="emitirFinalizar"
        >
          Finalizar
        </button>

        <!-- Botón cancelar -->
        <button class="boton-cancelar" @click="$emit('cancelar')">Cancelar</button>
      </div>

      <!-- Modal de confirmación encima -->
      <ModalConfirmarEscaneados
        v-if="mostrarModalConfirmar"
        :pedidos="pedidosEscaneados"
        @guardar="guardarPedidos"
        @cancelar="cerrarModalConfirmar"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  DecodeHintType,
  NotFoundException,
} from '@zxing/library'
import ModalConfirmarEscaneados from '../Modales/ModalConfirmarEscaneados.vue'

const emit = defineEmits(['cancelar', 'guardar'])

const codigoDetectado = ref('')
const ultimaCaptura = ref(null)
const pedidosEscaneados = ref([])
const mostrarModalConfirmar = ref(false)

let lector = null
let controlesLectura = null

// Iniciar cámara + escaneo
const iniciarCamara = async () => {
  try {
    const sugerencias = new Map()
    sugerencias.set(DecodeHintType.POSSIBLE_FORMATS, Object.values(BarcodeFormat))

    lector = new BrowserMultiFormatReader(sugerencias)
    const dispositivos = await lector.listVideoInputDevices()
    let idDispositivo = dispositivos?.[0]?.deviceId || null
    for (const d of dispositivos) {
      const label = (d.label || '').toLowerCase()
      if (label.includes('back') || label.includes('rear')) {
        idDispositivo = d.deviceId
        break
      }
    }

    const elementoVideo = document.getElementById('video-camara')

    controlesLectura = await lector.decodeFromVideoDevice(
      idDispositivo,
      elementoVideo,
      (resultado, error, controles) => {
        if (!controlesLectura && controles) controlesLectura = controles

        if (resultado && resultado.text) {
          codigoDetectado.value = resultado.text
          try {
            const canvas = document.createElement('canvas')
            canvas.width = elementoVideo.videoWidth || 640
            canvas.height = elementoVideo.videoHeight || 480
            const ctx = canvas.getContext('2d')
            ctx.drawImage(elementoVideo, 0, 0, canvas.width, canvas.height)
            ultimaCaptura.value = canvas.toDataURL('image/jpeg')
          } catch (e) {
            console.warn('Error creando miniatura:', e)
          }
        }
        if (error && !(error instanceof NotFoundException)) {
          console.warn('Error en escaneo: ' + (error?.message || String(error)))
        }
      },
    )
  } catch (error) {
    console.error('Error al iniciar cámara: ' + error)
  }
}

// Agregar código escaneado
const agregarPedido = () => {
  if (codigoDetectado.value && !pedidosEscaneados.value.includes(codigoDetectado.value)) {
    pedidosEscaneados.value.push(codigoDetectado.value)
    codigoDetectado.value = ''
  }
}

// Finalizar → abre modal de confirmación
const emitirFinalizar = () => {
  if (codigoDetectado.value && !pedidosEscaneados.value.includes(codigoDetectado.value)) {
    pedidosEscaneados.value.push(codigoDetectado.value)
    codigoDetectado.value = ''
  }
  mostrarModalConfirmar.value = true
}

// Guardar pedidos confirmados
const guardarPedidos = (lista) => {
  emit('guardar', lista)
  pedidosEscaneados.value = []
  mostrarModalConfirmar.value = false
}

// Cerrar modal confirmación
const cerrarModalConfirmar = () => {
  mostrarModalConfirmar.value = false
}

onMounted(() => {
  iniciarCamara()
})

onBeforeUnmount(() => {
  if (lector) lector.reset()
})
</script>
