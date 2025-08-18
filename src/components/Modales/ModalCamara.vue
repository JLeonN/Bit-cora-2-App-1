<template>
  <!-- Modal de la cámara -->
  <div class="modal-fondo" @click.self="$emit('cancelar')">
    <div class="modal-camara">
      <!-- Caja de la cámara -->
      <div id="vista-camara" class="caja-camara">
        <!-- NUEVO: video embebido -->
        <video id="video-camara" autoplay playsinline></video>
      </div>

      <!-- Parte inferior en negro -->
      <div v-if="ultimaCaptura" class="debug-captura">
        <p class="texto-debug">📸 Última captura (debug):</p>
        <img :src="ultimaCaptura" alt="captura debug" class="mini-captura" />
      </div>

      <!-- Log en pantalla -->
      <div class="debug-log">
        <p v-for="(linea, index) in logLineas" :key="index">{{ linea }}</p>
      </div>

      <!-- Parte inferior -->
      <div class="caja-inferior">
        <!-- Botón usar código detectado -->
        <button class="boton-usar-codigo" :disabled="!codigoDetectado" @click="usarCodigo">
          Usar código: {{ codigoDetectado || '' }}
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
const logLineas = ref([])

let lector = null
let controlesLectura = null

// Función de log en pantalla
function logDebug(mensaje) {
  logLineas.value.push(mensaje)
  if (logLineas.value.length > 12) {
    logLineas.value.shift()
  }
}

// Inicializar cámara + escaneo
const iniciarCamara = async () => {
  try {
    // Le pasamos TODOS los formatos soportados
    const sugerencias = new Map()
    sugerencias.set(DecodeHintType.POSSIBLE_FORMATS, Object.values(BarcodeFormat))

    lector = new BrowserMultiFormatReader(sugerencias)

    // Seleccionamos la cámara trasera
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

    // ZXing engancha el stream de cámara directo al <video> (embebido en tu div)
    controlesLectura = await lector.decodeFromVideoDevice(
      idDispositivo,
      elementoVideo,
      (resultado, error, controles) => {
        // Guardamos controles por si ZXing los entrega en el callback la primera vez
        if (!controlesLectura && controles) controlesLectura = controles

        if (resultado && resultado.text) {
          codigoDetectado.value = resultado.text
          logDebug('Código detectado: ' + resultado.text)

          // Guardamos un frame actual como "captura" (debug) SIN disparar foto real
          try {
            const canvas = document.createElement('canvas')
            canvas.width = elementoVideo.videoWidth || 640
            canvas.height = elementoVideo.videoHeight || 480
            const ctx = canvas.getContext('2d')
            ctx.drawImage(elementoVideo, 0, 0, canvas.width, canvas.height)
            ultimaCaptura.value = canvas.toDataURL('image/jpeg')
          } catch {
            // Si falla canvas por permisos/tamaño, ignoramos silenciosamente
          }
        }

        // Filtramos el error "NotFoundException" que es normal cuando no hay código en el frame
        if (error && !(error instanceof NotFoundException)) {
          logDebug('Error en escaneo: ' + (error?.message || String(error)))
        }
      },
    )

    logDebug('Cámara iniciada correctamente (video embebido, sin sonido)')
  } catch (error) {
    logDebug('Error al iniciar la cámara: ' + error)
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
    logDebug('⏹ Cámara detenida')
  } catch (error) {
    logDebug('Error al detener la cámara: ' + error)
  }
}

// Usar código detectado
const usarCodigo = () => {
  if (codigoDetectado.value) {
    emit('codigo-detectado', codigoDetectado.value)
    logDebug('📤 Código enviado: ' + codigoDetectado.value)
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

<style scoped>
.modal-fondo {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal-camara {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: black;
}
.caja-camara {
  width: 100%;
  height: 50vh;
  background: black;
  overflow: hidden;
  position: relative;
}
.caja-camara video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.caja-inferior {
  width: 100%;
  height: 20vh;
  background: black;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
}
.debug-captura {
  background: #111;
  padding: 6px;
  text-align: center;
}
.mini-captura {
  max-width: 80%;
  max-height: 150px;
  border: 1px solid #444;
}
.debug-log {
  background: #222;
  color: #0f0;
  font-size: 12px;
  padding: 6px;
  height: 10vh;
  overflow-y: auto;
}
.texto-debug {
  color: #ccc;
  font-size: 12px;
}
.boton-cancelar {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background: #e53935;
  color: white;
  cursor: pointer;
}
.boton-usar-codigo {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background: #43a047;
  color: white;
  cursor: pointer;
}
.boton-usar-codigo:disabled {
  background: #666;
  cursor: not-allowed;
}
</style>
