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

      <!-- Mensaje temporal -->
      <div v-if="mensajeTemporal" class="mensaje-temporal">
        {{ mensajeTemporal }}
      </div>

      <!-- Lista de pedidos escaneados con inputs de items -->
      <div v-if="pedidosEscaneados.length > 0" class="contenedor-lista-pedidos">
        <div class="lista-pedidos-escaneados">
          <div
            v-for="(pedido, index) in pedidosEscaneados"
            :key="index"
            class="item-pedido-escaneado"
          >
            <span class="numero-pedido-escaneado">{{ pedido.codigo }}</span>
            <input
              type="number"
              inputmode="numeric"
              min="1"
              v-model.number="pedido.items"
              class="input-items-escaneado"
              placeholder="Items"
            />
            <button class="boton-eliminar-escaneado" @click="eliminarPedidoEscaneado(index)">
              <IconX :size="18" :stroke="2" />
            </button>
          </div>
        </div>
      </div>

      <!-- Parte inferior -->
      <div class="caja-inferior">
        <!-- Botón finalizar -->
        <button
          class="boton-finalizar"
          :disabled="pedidosEscaneados.length === 0"
          @click="emitirFinalizar"
        >
          {{ `Finalizar (${pedidosEscaneados.length})` }}
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
import { IconX } from '@tabler/icons-vue'

const emit = defineEmits(['cancelar', 'codigo-detectado', 'modal-abierto', 'modal-cerrado'])

const codigoDetectado = ref('')
const ultimaCaptura = ref(null)
const pedidosEscaneados = ref([])
const mensajeTemporal = ref('')

let lector = null

// Función para mostrar mensaje temporal
const mostrarMensaje = (texto) => {
  mensajeTemporal.value = texto
  setTimeout(() => {
    mensajeTemporal.value = ''
  }, 5000)
}

// Agrega automáticamente el código detectado con items default en 1
const procesarCodigoDetectado = (codigo) => {
  if (!codigo) return
  if (pedidosEscaneados.value.some((p) => p.codigo === codigo)) {
    mostrarMensaje(`El pedido ${codigo} ya está en la lista`)
  } else {
    pedidosEscaneados.value.push({
      codigo: codigo,
      items: 1,
    })
    mostrarMensaje(`Agregado: ${codigo}`)
  }
  codigoDetectado.value = ''
  ultimaCaptura.value = null
}

// Eliminar pedido escaneado de la lista
const eliminarPedidoEscaneado = (index) => {
  const pedidoEliminado = pedidosEscaneados.value[index]
  pedidosEscaneados.value.splice(index, 1)
  mostrarMensaje(`Eliminado: ${pedidoEliminado.codigo}`)
}

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
        procesarCodigoDetectado(codigoDetectado.value)

        // Miniatura para feedback visual
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
  }
}

// Emitir lista completa al finalizar (solo los códigos con sus items)
const emitirFinalizar = () => {
  if (pedidosEscaneados.value.length > 0) {
    // Emitir array de objetos con { codigo, items }
    emit(
      'codigo-detectado',
      pedidosEscaneados.value.map((p) => ({
        numero: p.codigo,
        items: p.items || 1,
      })),
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
  if (lector) {
    lector.reset()
  }
  emit('modal-cerrado')
})
</script>
