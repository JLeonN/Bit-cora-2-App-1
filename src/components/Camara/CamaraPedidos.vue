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
        <button class="boton-usar-codigo" :disabled="!codigoDetectado" @click="usarCodigo">
          Nuevo pedido: {{ codigoDetectado || '' }}
        </button>

        <!-- Botón cancelar -->
        <button class="boton-cancelar" @click="$emit('cancelar')">Cancelar</button>
      </div>
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

const emit = defineEmits(['cancelar', 'codigo-detectado'])

const codigoDetectado = ref('')
const ultimaCaptura = ref(null)

let lector = null
let controlesLectura = null

// Inicializar cámara + escaneo
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
          } catch {
            // Ignoramos errores de canvas
          }
        }

        if (error && !(error instanceof NotFoundException)) {
          console.warn('Error en escaneo: ' + (error?.message || String(error)))
        }
      },
    )
  } catch (error) {
    console.error('Error al iniciar la cámara: ' + error)
  }
}

// Detener cámara
const detenerCamara = async () => {
  try {
    if (controlesLectura) {
      controlesLectura.stop()
      controlesLectura = null
    }
    if (lector) {
      lector.reset()
      lector = null
    }
    const elementoVideo = document.getElementById('video-camara')
    if (elementoVideo && elementoVideo.srcObject) {
      elementoVideo.srcObject.getTracks().forEach((t) => t.stop())
      elementoVideo.srcObject = null
    }
  } catch (error) {
    console.error('Error al detener la cámara: ' + error)
  }
}

// Usar código detectado
const usarCodigo = () => {
  if (codigoDetectado.value) {
    emit('codigo-detectado', codigoDetectado.value)
    codigoDetectado.value = ''
  }
}

onMounted(() => {
  iniciarCamara()
})

onBeforeUnmount(() => {
  detenerCamara()
})
</script>
