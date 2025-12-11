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
        <button class="boton-cancelar" @click="$emit('cancelar')">Cancelar</button>
        <button
          class="boton-finalizar"
          :disabled="codigosEscaneados.length === 0"
          @click="emitirFinalizar"
        >
          {{ `Finalizar (${codigosEscaneados.length})` }}
        </button>
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

const emit = defineEmits(['cancelar', 'finalizar', 'modal-abierto', 'modal-cerrado'])

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

onMounted(() => {
  iniciarCamara()
  emit('modal-abierto')
})

onBeforeUnmount(() => {
  lector?.reset()
  emit('modal-cerrado')
})
</script>

<style scoped>
.modal-fondo {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-camara {
  background: var(--color-superficie);
  border-radius: 16px;
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
.caja-camara {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
}
#video-camara {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.overlay-miniatura {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 100px;
  height: 70px;
  border: 2px solid #fff;
  overflow: hidden;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.mini-captura {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mensaje-temporal {
  background: var(--color-primario);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.caja-inferior {
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}
.boton-cancelar,
.boton-finalizar {
  flex: 1;
  padding: 0.85rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.boton-cancelar {
  background: transparent;
  color: var(--color-texto-secundario);
  border: 1px solid var(--color-borde);
}
.boton-cancelar:hover {
  background: var(--color-fondo);
  border-color: var(--color-texto-secundario);
}
.boton-finalizar {
  background: var(--color-exito);
  color: white;
}
.boton-finalizar:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-2px);
}
.boton-finalizar:disabled {
  background: var(--color-desactivado);
  cursor: not-allowed;
  opacity: 0.6;
}
@media (max-width: 600px) {
  .modal-camara {
    padding: 1rem;
    width: 95%;
  }
  .caja-inferior {
    gap: 0.5rem;
  }
  .boton-cancelar,
  .boton-finalizar {
    padding: 0.75rem;
    font-size: 0.95rem;
  }
}
</style>
