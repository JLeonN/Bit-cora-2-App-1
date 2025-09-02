<template>
  <div class="modal-fondo" @click.self="cancelarGeneral">
    <div class="modal-camara">
      <div class="caja-camara">
        <!-- Video de cámara cuando está escaneando -->
        <video
          v-if="estado === 'escaneando'"
          id="video-camara-ubicaciones"
          autoplay
          playsinline
        ></video>

        <!-- Recuadro gris cuando está ingresando ubicación -->
        <div v-if="estado === 'ingresandoUbicacion'" class="feedback-codigo-escaneado">
          <span class="texto-feedback">Artículo Escaneado:</span>

          <!-- Vista normal del código -->
          <div v-if="!editandoCodigo" class="contenedor-codigo-feedback">
            <span class="codigo-feedback">{{ codigoEscaneadoTemporal }}</span>
            <button class="boton-editar-codigo" @click="activarEdicionCodigo">
              <IconPencil stroke="2" />
            </button>
          </div>

          <!-- Modo edición del código -->
          <div v-else class="contenedor-edicion-codigo">
            <input
              v-model="codigoEditado"
              type="text"
              class="input-codigo-editable"
              ref="inputCodigoRef"
              @keydown.enter="confirmarEdicionCodigo"
            />
            <button class="boton-cancelar-codigo" @click="cancelarEdicionCodigo">
              <IconSquareRoundedMinus stroke="2" />
            </button>
            <button class="boton-confirmar-codigo" @click="confirmarEdicionCodigo">
              <IconCheck stroke="2" />
            </button>
          </div>
        </div>

        <!-- Miniatura de feedback visual -->
        <div v-if="ultimaCaptura && estado === 'ingresandoUbicacion'" class="overlay-miniatura">
          <img :src="ultimaCaptura" alt="Última captura" class="mini-captura" />
        </div>
      </div>

      <!-- Mensaje temporal -->
      <div v-if="mensajeTemporal" class="mensaje-temporal">
        {{ mensajeTemporal }}
      </div>

      <div class="caja-inferior">
        <div v-if="estado === 'escaneando'" class="controles-principales">
          <button
            class="boton-finalizar"
            :disabled="ubicacionesGuardadas.length === 0"
            @click="finalizar"
          >
            {{ `Finalizar (${ubicacionesGuardadas.length})` }}
          </button>
          <button class="boton-cancelar" @click="cancelarGeneral">Cancelar</button>
        </div>

        <div v-if="estado === 'ingresandoUbicacion'" class="controles-ingreso">
          <!-- input ubicación -->
          <div class="ubicacion-campo">
            <input
              v-model="nuevaUbicacion"
              type="text"
              :placeholder="placeholderUbicacion"
              :class="{ 'input-error': errorUbicacion, 'animar-error': animarErrorUbicacion }"
              ref="inputUbicacionRef"
              @animationend="animarErrorUbicacion = false"
              @input="restablercerPlaceholderUbicacion"
              @blur="formatearUbicacion"
              :disabled="editandoCodigo"
            />
          </div>

          <!-- contenedor botones -->
          <div class="contenedor-botones-accion">
            <button class="boton-descartar" @click="descartarEscaneo">
              <IconSquareRoundedMinus stroke="2" />
            </button>
            <button class="boton-siguiente" @click="confirmarUbicacionYSiguiente">
              <IconArrowRight stroke="2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { IconArrowRight, IconSquareRoundedMinus, IconPencil, IconCheck } from '@tabler/icons-vue'
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
} from '@zxing/library'

const emit = defineEmits(['cancelar', 'finalizar'])

// --- Estados de la UI ---
const estado = ref('escaneando')
const editandoCodigo = ref(false)

// --- Variables de cámara ---
let lector = null
const ultimaCaptura = ref(null)
const mensajeTemporal = ref('')

// --- Datos del componente ---
const ubicacionesGuardadas = ref([])
const codigoEscaneadoTemporal = ref(null)
const codigoEditado = ref('')
const nuevaUbicacion = ref('')
const inputUbicacionRef = ref(null)
const inputCodigoRef = ref(null)

// --- Placeholders y errores ---
const placeholderUbicacion = ref('Ingrese la ubicación del artículo')
const errorUbicacion = ref(false)
const animarErrorUbicacion = ref(false)
const errorCodigo = ref(false)
const animarErrorCodigo = ref(false)

// --- Función de feedback temporal ---
const mostrarMensaje = (texto) => {
  mensajeTemporal.value = texto
  setTimeout(() => (mensajeTemporal.value = ''), 3000)
}

// --- Procesar código detectado ---
const procesarCodigoDetectado = (codigo) => {
  if (!codigo) return

  // Detener el escaneo temporalmente
  if (lector) {
    lector.reset()
  }

  codigoEscaneadoTemporal.value = codigo
  estado.value = 'ingresandoUbicacion'

  mostrarMensaje(`Código detectado: ${codigo}`)

  nextTick(() => {
    inputUbicacionRef.value?.focus()
  })
}

// --- Iniciar cámara y escaneo ---
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

    const videoElem = document.getElementById('video-camara-ubicaciones')
    if (!videoElem) return

    lector.decodeFromVideoDevice(idDispositivo, videoElem, (resultado, error) => {
      if (resultado?.text && estado.value === 'escaneando') {
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
    mostrarMensaje('Error al acceder a la cámara')
  }
}

// --- Reanudar escaneo ---
const reanudarEscaneo = () => {
  estado.value = 'escaneando'
  ultimaCaptura.value = null
  nextTick(() => {
    iniciarCamara()
  })
}

// --- Funciones edición de código ---
function activarEdicionCodigo() {
  editandoCodigo.value = true
  codigoEditado.value = codigoEscaneadoTemporal.value
  nextTick(() => {
    inputCodigoRef.value?.focus()
    inputCodigoRef.value?.select()
  })
}

function confirmarEdicionCodigo() {
  const nuevoCodigo = codigoEditado.value.trim()
  if (!nuevoCodigo) {
    errorCodigo.value = true
    animarErrorCodigo.value = true
    mostrarMensaje('El código no puede estar vacío')
    return false
  }
  codigoEscaneadoTemporal.value = nuevoCodigo.toUpperCase()
  editandoCodigo.value = false
  mostrarMensaje('Código actualizado')
  return true
}

function cancelarEdicionCodigo() {
  editandoCodigo.value = false
  codigoEditado.value = ''
}

// --- Funciones de placeholders ---
function restablercerPlaceholderUbicacion() {
  errorUbicacion.value = false
  placeholderUbicacion.value = 'Ingrese la ubicación del artículo'
}

// --- Función para formatear ubicación ---
function formatearUbicacion() {
  if (!nuevaUbicacion.value) return
  let texto = nuevaUbicacion.value.trim()
  texto = texto.replace(/\s+/g, '-') // Reemplaza espacios intermedios por guiones
  nuevaUbicacion.value = texto
}

// --- Guardar ubicación ---
function guardarUbicacion() {
  if (!nuevaUbicacion.value.trim()) {
    errorUbicacion.value = true
    animarErrorUbicacion.value = true
    placeholderUbicacion.value = 'Ingresar una ubicación'
    return false
  }

  formatearUbicacion()

  ubicacionesGuardadas.value.push({
    codigo: codigoEscaneadoTemporal.value,
    ubicacion: nuevaUbicacion.value.trim().toUpperCase(),
  })

  // Reset de inputs
  nuevaUbicacion.value = ''
  codigoEscaneadoTemporal.value = null

  mostrarMensaje('Ubicación guardada correctamente')
  console.log('Ubicaciones guardadas:', ubicacionesGuardadas.value)
  return true
}

// --- Confirmar ubicación y pasar al siguiente escaneo ---
function confirmarUbicacionYSiguiente() {
  if (!codigoEscaneadoTemporal.value) {
    errorCodigo.value = true
    animarErrorCodigo.value = true
    mostrarMensaje('Código requerido')
    return
  }

  const exito = guardarUbicacion()
  if (exito) {
    // Reanudar escaneo para el siguiente artículo
    nextTick(() => reanudarEscaneo())
  }
}

// --- Otros controles ---
function descartarEscaneo() {
  nuevaUbicacion.value = ''
  codigoEscaneadoTemporal.value = null
  reanudarEscaneo()
}

function finalizar() {
  if (ubicacionesGuardadas.value.length > 0) {
    emit('finalizar', ubicacionesGuardadas.value)
  }
}

function cancelarGeneral() {
  if (lector) {
    lector.reset()
  }
  emit('cancelar')
}

// --- Lifecycle hooks ---
onMounted(() => {
  iniciarCamara()
})

onBeforeUnmount(() => {
  if (lector) {
    lector.reset()
  }
})
</script>
