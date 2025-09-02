<template>
  <div class="modal-fondo" @click.self="$emit('cancelar')">
    <div class="modal-camara">
      <div class="caja-camara">
        <video id="video-camara" autoplay playsinline></video>

        <!-- Miniatura de feedback visual -->
        <div v-if="ultimaCaptura" class="overlay-miniatura">
          <img :src="ultimaCaptura" alt="Última captura" class="mini-captura" />
        </div>
      </div>

      <div v-if="mensajeTemporal" class="mensaje-temporal">
        {{ mensajeTemporal }}
      </div>

      <div class="caja-inferior">
        <button
          class="boton-finalizar"
          :disabled="codigosEscaneados.length === 0"
          @click="emitirFinalizar"
        >
          {{ `Finalizar (${codigosEscaneados.length})` }}
        </button>
        <button class="boton-cancelar" @click="$emit('cancelar')">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from '@zxing/library'

const emit = defineEmits(['cancelar', 'finalizar'])

const codigosEscaneados = ref([])
const ultimaCaptura = ref(null)
const mensajeTemporal = ref('')

let lector = null

// Función de feedback temporal
const mostrarMensaje = (texto) => {
  mensajeTemporal.value = texto
  setTimeout(() => (mensajeTemporal.value = ''), 5000)
}

// Procesar código detectado
const procesarCodigoDetectado = (codigo) => {
  if (!codigo) return
  if (codigosEscaneados.value.includes(codigo)) {
    mostrarMensaje(`El código ${codigo} ya está en la lista`)
  } else {
    codigosEscaneados.value.push(codigo)
    mostrarMensaje(`Agregado: ${codigo}`)
  }
  ultimaCaptura.value = null
}

// Iniciar cámara y escaneo
const iniciarCamara = async () => {
  try {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, Object.values(BarcodeFormat))
    lector = new BrowserMultiFormatReader(hints)

    const dispositivos = await lector.listVideoInputDevices()
    let idDispositivo = null
    if (dispositivos.length > 0) {
      const camaraTrasera = dispositivos.find((d) => /back|rear/i.test(d.label))
      idDispositivo = camaraTrasera ? camaraTrasera.deviceId : dispositivos[0].deviceId
    }

    const videoElem = document.getElementById('video-camara')

    lector.decodeFromVideoDevice(idDispositivo, videoElem, (resultado, error) => {
      if (resultado?.text) {
        procesarCodigoDetectado(resultado.text)

        // Crear miniatura
        try {
          const canvas = document.createElement('canvas')
          canvas.width = videoElem.videoWidth
          canvas.height = videoElem.videoHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height)
          ultimaCaptura.value = canvas.toDataURL('image/jpeg')
        } catch (e) {
          console.warn('Error miniatura:', e)
        }
      }

      if (error && !(error instanceof NotFoundException)) {
        console.warn('Error escaneo:', error)
      }
    })
  } catch (e) {
    console.error('Error iniciar cámara:', e)
  }
}

// Emitir lista final al cerrar
const emitirFinalizar = () => {
  if (codigosEscaneados.value.length > 0) {
    emit(
      'finalizar',
      codigosEscaneados.value.map((c) => c.toUpperCase()),
    )
  } else {
    emit('cancelar')
  }
}

onMounted(() => iniciarCamara())
onBeforeUnmount(() => lector?.reset())
</script>

<style scoped>
.overlay-miniatura {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 100px;
  height: 70px;
  border: 2px solid #fff;
  overflow: hidden;
  border-radius: 6px;
}
.mini-captura {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
