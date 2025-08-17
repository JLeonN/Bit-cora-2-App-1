<template>
  <!-- Modal de la cámara -->
  <div class="modal-fondo" @click.self="$emit('cancelar')">
    <div class="modal-camara">
      <!-- Caja de la cámara -->
      <div id="vista-camara" class="caja-camara"></div>

      <!-- Parte inferior en negro -->
      <div v-if="ultimaCaptura" class="debug-captura">
        <p class="texto-debug">📸 Última captura (debug):</p>
        <img
          :src="'data:image/jpeg;base64,' + ultimaCaptura"
          alt="captura debug"
          class="mini-captura"
        />
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
import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType } from '@zxing/library'
import { CameraPreview } from '@capacitor-community/camera-preview'

const emit = defineEmits(['cancelar', 'codigo-detectado'])

const codigoDetectado = ref('')
const ultimaCaptura = ref(null)
const logLineas = ref([])

let lector = null
let escaneando = false

// Función de log en pantalla
function logDebug(mensaje) {
  logLineas.value.push(mensaje)
  if (logLineas.value.length > 12) {
    logLineas.value.shift() // mantener últimas 12
  }
}

// Inicializar cámara
const iniciarCamara = async () => {
  try {
    await CameraPreview.start({
      parent: 'vista-camara',
      position: 'rear',
      width: window.innerWidth,
      height: window.innerHeight / 2,
      x: 0,
      y: 0,
      toBack: false,
    })
    logDebug('✅ Cámara iniciada correctamente')
    iniciarEscaneo()
  } catch (error) {
    logDebug('❌ Error al iniciar la cámara: ' + error)
  }
}

// Detener cámara
const detenerCamara = async () => {
  try {
    escaneando = false
    await CameraPreview.stop()
    if (lector) lector.reset()
    logDebug('⏹ Cámara detenida')
  } catch (error) {
    logDebug('❌ Error al detener la cámara: ' + error)
  }
}

// Escaneo en vivo
const iniciarEscaneo = () => {
  const sugerencias = new Map()
  // 👉 Le pasamos TODOS los formatos soportados
  sugerencias.set(DecodeHintType.POSSIBLE_FORMATS, Object.values(BarcodeFormat))

  lector = new BrowserMultiFormatReader(sugerencias)
  escaneando = true
  logDebug('🔎 Escaneo iniciado con todos los formatos disponibles')
  escanearFrame()
}

const escanearFrame = async () => {
  if (!escaneando) return

  try {
    const captura = await CameraPreview.capture({ quality: 70 })
    ultimaCaptura.value = captura.value
    logDebug('📸 Captura obtenida, tamaño base64: ' + captura.value.length)

    // Crear imagen DOM a partir del base64
    const imagen = new Image()
    imagen.src = 'data:image/jpeg;base64,' + captura.value

    imagen.onload = async () => {
      try {
        logDebug('🔄 Intentando decodificar imagen...')
        const resultado = await lector.decodeFromImageElement(imagen)
        if (resultado && resultado.text) {
          codigoDetectado.value = resultado.text
          logDebug('✅ Código detectado: ' + resultado.text)
        } else {
          codigoDetectado.value = ''
          logDebug('⚠️ No se detectó código en este frame')
        }
      } catch (e) {
        logDebug('❌ Error en escaneo: ' + e.message)
        codigoDetectado.value = ''
      }
    }
  } catch (e) {
    logDebug('❌ Error al capturar frame: ' + e.message)
  }

  setTimeout(escanearFrame, 1000) // cada 1 segundo
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
