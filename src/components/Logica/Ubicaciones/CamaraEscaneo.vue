<template>
  <div class="modal-fondo" @click.self="$emit('cancelar')">
    <div class="modal-camara">
      <div class="caja-camara">
        <video id="video-camara" autoplay playsinline></video>

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
          v-if="!escaneoUnico"
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

const props = defineProps({
  escaneoUnico: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['cancelar', 'finalizar', 'modal-abierto', 'modal-cerrado'])

const codigosEscaneados = ref([])
const ultimaCaptura = ref(null)
const mensajeTemporal = ref('')
const codigoEmitido = ref(false)

let lector = null

const mostrarMensaje = (texto) => {
  mensajeTemporal.value = texto
  setTimeout(() => (mensajeTemporal.value = ''), 5000)
}

const procesarCodigoDetectado = (codigo) => {
  if (!codigo) return
  const codigoNormalizado = codigo.toUpperCase()

  if (props.escaneoUnico) {
    if (codigoEmitido.value) return
    codigoEmitido.value = true
    mostrarMensaje(`Detectado: ${codigoNormalizado}`)
    emit('finalizar', [codigoNormalizado])
    return
  }

  if (codigosEscaneados.value.includes(codigo)) {
    mostrarMensaje(`El código ${codigo} ya está en la lista`)
  } else {
    codigosEscaneados.value.push(codigo)
    mostrarMensaje(`Agregado: ${codigo}`)
  }

  ultimaCaptura.value = null
}

const iniciarCamara = async () => {
  try {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, Object.values(BarcodeFormat))
    lector = new BrowserMultiFormatReader(hints)

    const dispositivos = await lector.listVideoInputDevices()
    let idDispositivo = null
    if (dispositivos.length > 0) {
      const camaraTrasera = dispositivos.find((dispositivo) => /back|rear/i.test(dispositivo.label))
      idDispositivo = camaraTrasera ? camaraTrasera.deviceId : dispositivos[0].deviceId
    }

    const videoElem = document.getElementById('video-camara')

    lector.decodeFromVideoDevice(idDispositivo, videoElem, (resultado, error) => {
      if (resultado?.text) {
        procesarCodigoDetectado(resultado.text)

        try {
          const canvas = document.createElement('canvas')
          canvas.width = videoElem.videoWidth
          canvas.height = videoElem.videoHeight
          const contexto = canvas.getContext('2d')
          contexto.drawImage(videoElem, 0, 0, canvas.width, canvas.height)
          ultimaCaptura.value = canvas.toDataURL('image/jpeg')
        } catch (errorMiniatura) {
          console.warn('Error miniatura:', errorMiniatura)
        }
      }

      if (error && !(error instanceof NotFoundException)) {
        console.warn('Error escaneo:', error)
      }
    })
    } catch (errorCamara) {
    console.error('Error iniciar cámara:', errorCamara)
  }
}

const emitirFinalizar = () => {
  if (codigosEscaneados.value.length > 0) {
    emit(
      'finalizar',
      codigosEscaneados.value.map((codigo) => codigo.toUpperCase()),
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
