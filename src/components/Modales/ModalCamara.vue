<template>
  <!-- Modal de la cámara -->
  <div class="modal-fondo" @click.self="$emit('cancelar')">
    <div class="modal-camara">
      <!-- Caja de la cámara -->
      <div id="vista-camara" class="caja-camara"></div>

      <!-- Parte inferior en negro -->
      <div class="caja-inferior">
        <!-- Botón usar código detectado -->
        <button class="boton-usar-codigo" :disabled="!codigoDetectado" @click="usarCodigo">
          Usar código detectado: {{ codigoDetectado || '' }}
        </button>

        <!-- Botón cancelar -->
        <button class="boton-cancelar" @click="$emit('cancelar')">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { BarcodeFormat, BrowserMultiFormatReader } from '@zxing/library'
import { CameraPreview } from '@capacitor-community/camera-preview'

const emit = defineEmits(['cancelar', 'codigo-detectado'])
const codigoDetectado = ref('')

let lector = null
let escaneando = false

const iniciarCamara = async () => {
  try {
    await CameraPreview.start({
      parent: 'vista-camara',
      position: 'rear', // Cámara trasera
      width: window.innerWidth,
      height: window.innerHeight / 2,
      x: 0,
      y: 0,
      toBack: false,
    })
    iniciarEscaneo()
  } catch (error) {
    console.error('Error al iniciar la cámara:', error)
  }
}

const detenerCamara = async () => {
  try {
    escaneando = false
    await CameraPreview.stop()
    if (lector) lector.reset()
  } catch (error) {
    console.error('Error al detener la cámara:', error)
  }
}

// Escaneo en vivo SOLO de códigos de barra (no QR)
const iniciarEscaneo = () => {
  lector = new BrowserMultiFormatReader()
  escaneando = true
  escanearFrame()
}

const escanearFrame = async () => {
  if (!escaneando) return
  try {
    const result = await CameraPreview.capture({ quality: 60 })
    const img = new window.Image()
    img.src = 'data:image/jpeg;base64,' + result.value
    img.onload = async () => {
      try {
        // Solo formatos de barra comunes (no QR)
        const codeResult = await lector.decodeFromImageElement(img, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.ITF,
          BarcodeFormat.CODABAR,
        ])
        if (codeResult && codeResult.text) {
          codigoDetectado.value = codeResult.text
        } else {
          codigoDetectado.value = ''
        }
      } catch {
        codigoDetectado.value = ''
      }
      setTimeout(escanearFrame, 800)
    }
  } catch {
    setTimeout(escanearFrame, 1200)
  }
}

// Usar código detectado y enviarlo al modal principal
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
  height: 60vh;
  background: black;
  overflow: hidden;
  border-radius: 0;
}

.caja-inferior {
  width: 100%;
  height: 40vh;
  background: black;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.boton-cancelar {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background: #e53935;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.boton-cancelar:hover {
  background: #c62828;
}

.boton-usar-codigo {
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  background: #43a047;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.boton-usar-codigo:disabled {
  background: #666;
  cursor: not-allowed;
}

.boton-usar-codigo:hover:enabled {
  background: #2e7d32;
}
</style>
