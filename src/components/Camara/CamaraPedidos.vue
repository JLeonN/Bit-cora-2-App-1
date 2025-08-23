<template>
  <!-- Modal de la cámara -->
  <div class="modal-fondo" @click.self="$emit('cancelar')">
    <div class="modal-camara">
      <!-- Caja de la cámara -->
      <div id="vista-camara" class="caja-camara">
        <!-- Video embebido -->
        <video id="video-camara" autoplay playsinline></video>
        <!-- Miniatura como overlay -->
        <div v-if="ultimaCaptura" class="overlay-miniatura">
          <img :src="ultimaCaptura" alt="Última captura" class="mini-captura" />
        </div>
      </div>

      <!-- Parte inferior -->
      <div class="caja-inferior">
        <!-- Botón usar código detectado -->
        <button class="boton-usar-codigo" :disabled="!codigoDetectado" @click="agregarPedidoALista">
          {{ `Agregar: ${codigoDetectado || '...'}` }}
        </button>

        <!-- Botón finalizar -->
        <button
          class="boton-finalizar"
          :disabled="pedidosEscaneados.length === 0"
          @click="emitirFinalizar"
        >
          {{ `Finalizar (${pedidosEscaneados.length} pedidos)` }}
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

const codigoDetectado = ref('') // Guarda el último código detectado
const ultimaCaptura = ref(null) // Para la miniatura
const pedidosEscaneados = ref([]) // Array interno para acumular códigos

let lector = null

// Iniciar cámara + escaneo
const iniciarCamara = async () => {
  try {
    const sugerencias = new Map()
    sugerencias.set(DecodeHintType.POSSIBLE_FORMATS, Object.values(BarcodeFormat))
    lector = new BrowserMultiFormatReader(sugerencias)

    const dispositivos = await lector.listVideoInputDevices()
    let idDispositivo = null
    if (dispositivos.length > 0) {
      // Prioriza la cámara trasera en móviles
      const camaraTrasera = dispositivos.find((d) => /back|rear/i.test(d.label))
      idDispositivo = camaraTrasera ? camaraTrasera.deviceId : dispositivos[0].deviceId
    }

    const elementoVideo = document.getElementById('video-camara')

    lector.decodeFromVideoDevice(idDispositivo, elementoVideo, (resultado, error) => {
      if (resultado && resultado.text) {
        codigoDetectado.value = resultado.text

        // Opcional: Crear miniatura para feedback visual
        try {
          const canvas = document.createElement('canvas')
          canvas.width = elementoVideo.videoWidth
          canvas.height = elementoVideo.videoHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(elementoVideo, 0, 0, canvas.width, canvas.height)
          ultimaCaptura.value = canvas.toDataURL('image/jpeg')
        } catch (e) {
          console.warn('Error al crear la miniatura:', e)
        }
      }

      if (error && !(error instanceof NotFoundException)) {
        console.warn('Error durante el escaneo:', error)
      }
    })
  } catch (error) {
    console.error('Error al iniciar la cámara:', error)
    // Podrías emitir un evento de error para notificar al usuario
  }
}

// Agrega el código detectado actualmente a la lista interna `pedidosEscaneados`
const agregarPedidoALista = () => {
  if (codigoDetectado.value && !pedidosEscaneados.value.includes(codigoDetectado.value)) {
    pedidosEscaneados.value.push(codigoDetectado.value)
    codigoDetectado.value = '' // Limpia para el siguiente escaneo
    ultimaCaptura.value = null // Limpia la miniatura
  }
}

// Emite la lista completa de códigos escaneados al componente padre
const emitirFinalizar = () => {
  // Asegúrate de agregar el último código detectado si no se ha agregado aún
  if (codigoDetectado.value && !pedidosEscaneados.value.includes(codigoDetectado.value)) {
    pedidosEscaneados.value.push(codigoDetectado.value)
  }

  if (pedidosEscaneados.value.length > 0) {
    emit('codigo-detectado', pedidosEscaneados.value)
  } else {
    // Si no hay nada, simplemente cancela para no emitir un array vacío
    emit('cancelar')
  }
}

onMounted(() => {
  iniciarCamara()
})

onBeforeUnmount(() => {
  if (lector) {
    lector.reset() // Detiene la cámara y libera recursos
  }
})
</script>
