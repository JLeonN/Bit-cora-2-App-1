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

<style scoped>
/* Modal fondo */
.modal-fondo {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
/* Modal cámara */
.modal-camara {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-fondo);
}
/* Caja de la cámara */
.caja-camara {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #000;
}
#video-camara {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Overlay miniatura */
.overlay-miniatura {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid var(--color-acento);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}
.mini-captura {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* Mensaje temporal */
.mensaje-temporal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  z-index: 10;
  animation: fadeInOut 5s ease;
}
@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0;
  }
  10%,
  90% {
    opacity: 1;
  }
}
/* Contenedor de lista de pedidos escaneados */
.contenedor-lista-pedidos {
  background: var(--color-superficie);
  border-top: 1px solid var(--color-borde);
  max-height: 200px;
  overflow-y: auto;
  padding: 0.75rem;
}
.lista-pedidos-escaneados {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.item-pedido-escaneado {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-fondo);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  animation: slideIn 0.3s ease;
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.numero-pedido-escaneado {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-texto-principal);
}
.input-items-escaneado {
  width: 70px;
  padding: 0.5rem;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  background: var(--color-superficie);
  color: var(--color-texto-principal);
  font-size: 0.9rem;
  text-align: center;
}
.input-items-escaneado:focus {
  outline: none;
  border-color: var(--color-acento);
}
/* Quitar flechas del input number */
.input-items-escaneado::-webkit-inner-spin-button,
.input-items-escaneado::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.input-items-escaneado {
  appearance: textfield;
  -moz-appearance: textfield;
}
.boton-eliminar-escaneado {
  background: transparent;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}
.boton-eliminar-escaneado:hover {
  background: rgba(244, 67, 54, 0.1);
  transform: scale(1.1);
}
.boton-eliminar-escaneado:active {
  transform: scale(0.9);
}
/* Scroll personalizado */
.contenedor-lista-pedidos::-webkit-scrollbar {
  width: 6px;
}
.contenedor-lista-pedidos::-webkit-scrollbar-track {
  background: var(--color-fondo);
}
.contenedor-lista-pedidos::-webkit-scrollbar-thumb {
  background: var(--color-borde);
  border-radius: 3px;
}
.contenedor-lista-pedidos::-webkit-scrollbar-thumb:hover {
  background: var(--color-texto-secundario);
}
/* Caja inferior */
.caja-inferior {
  display: flex !important;
  flex-direction: row !important;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-superficie);
  border-top: 3px solid var(--color-acento);
  width: 100%;
  box-sizing: border-box;
}
.boton-finalizar,
.boton-cancelar {
  flex: 1;
  height: 56px;
  border: none;
  border-radius: 12px;
  padding: 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}
.boton-finalizar {
  background: var(--color-acento);
  color: white;
}
.boton-finalizar:hover:not(:disabled) {
  background: var(--color-primario);
  transform: scale(1.02);
}
.boton-finalizar:active:not(:disabled) {
  transform: scale(0.98);
}
.boton-finalizar:disabled {
  background: var(--color-desactivado);
  cursor: not-allowed;
  opacity: 0.5;
}
.boton-cancelar {
  background: var(--color-superficie);
  color: var(--color-texto-principal);
  border: 1px solid var(--color-borde);
}
.boton-cancelar:hover {
  background: var(--color-fondo);
  transform: scale(1.02);
}
.boton-cancelar:active {
  transform: scale(0.98);
}
/* Responsive */
@media (max-width: 600px) {
  .caja-inferior {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  .boton-finalizar,
  .boton-cancelar {
    height: 52px;
    font-size: 0.95rem;
  }
}
/* Responsive */
@media (max-width: 600px) {
  .overlay-miniatura {
    width: 60px;
    height: 60px;
    top: 0.75rem;
    right: 0.75rem;
  }
  .contenedor-lista-pedidos {
    max-height: 150px;
    padding: 0.5rem;
  }
  .input-items-escaneado {
    width: 60px;
    font-size: 0.85rem;
  }
}
</style>
