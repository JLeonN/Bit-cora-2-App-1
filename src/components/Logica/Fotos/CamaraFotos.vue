<template>
  <div class="modal-fondo-fotos" @click.self="cancelar">
    <div class="modal-camara-fotos">
      <!-- Mensaje temporal después de guardar -->
      <div v-if="mensajeTemporal" class="mensaje-temporal">
        {{ mensajeTemporal }}
      </div>

      <!-- Caja de la cámara -->
      <div class="caja-camara">
        <div class="area-util-captura">
          <video ref="videoCamara" id="video-camara-fotos" autoplay playsinline></video>
        </div>

        <!-- Overlay con miniatura de última captura -->
        <div v-if="ultimaCaptura" class="overlay-miniatura">
          <img :src="ultimaCaptura" alt="Última captura" class="mini-captura" />
        </div>
      </div>

      <!-- Buscador de código (después de capturar) -->
      <div v-if="mostrarBuscador" class="contenedor-buscador-foto">
        <div class="modal-campo">
          <label>Código del producto</label>
          <input
            ref="inputBusqueda"
            v-model="busquedaCodigo"
            type="text"
            placeholder="Buscar por código o nombre..."
            @input="busquedaCodigo = busquedaCodigo.toUpperCase()"
          />
        </div>

        <!-- Componente de búsqueda -->
        <CodigoMasNombre :busqueda="busquedaCodigo" @articulo-seleccionado="seleccionarArticulo" />

        <!-- Botones de acción -->
        <div class="contenedor-botones-accion">
          <button class="boton-descartar" @click="descartarFoto">
            <IconTrash :size="20" />
            Descartar
          </button>
          <button
            class="boton-siguiente"
            :disabled="!codigoSeleccionado"
            @click="confirmarYContinuar"
          >
            <IconCheck :size="20" />
            Confirmar
          </button>
        </div>
      </div>

      <!-- Botones principales (modo captura) -->
      <div v-else class="caja-inferior">
        <button class="boton-cancelar" @click="cancelar">
          <IconX :size="20" />
          Cancelar
        </button>

        <button class="boton-capturar" @click="capturarFoto">
          <IconCamera :size="24" />
        </button>

        <button class="boton-finalizar" :disabled="fotosTomadas === 0" @click="finalizar">
          <IconCheck :size="20" />
          Finalizar ({{ fotosTomadas }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { IconCamera, IconX, IconCheck, IconTrash } from '@tabler/icons-vue'
import { Filesystem, Directory } from '@capacitor/filesystem'
import CodigoMasNombre from '../Ubicaciones/CodigoMasNombre.vue'

const emit = defineEmits(['cerrar', 'fotos-guardadas'])

// Referencias
const videoCamara = ref(null)
const inputBusqueda = ref(null)
let streamCamara = null

// Estado
const ultimaCaptura = ref(null)
const fotosTomadas = ref(0)
const mostrarBuscador = ref(false)
const busquedaCodigo = ref('')
const codigoSeleccionado = ref(null)
const nombreArticuloSeleccionado = ref('')
const fotoCapturadaBase64 = ref(null)
const mensajeTemporal = ref('')

// Lista temporal de fotos
const fotosTemporales = ref([])

// Detectar mejor resolución del dispositivo
async function detectarMejorResolucion() {
  try {
    // Stream temporal para obtener capabilities
    const streamTemp = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })

    const track = streamTemp.getVideoTracks()[0]
    const capabilities = track.getCapabilities()

    console.log('📱 Capacidades del dispositivo:')
    console.log('Ancho máximo:', capabilities.width?.max || 'no disponible')
    console.log('Alto máximo:', capabilities.height?.max || 'no disponible')

    // Detener stream temporal
    streamTemp.getTracks().forEach((t) => t.stop())

    // Calcular mejor resolución en aspect ratio 3:4
    const maxWidth = capabilities.width?.max || 1280
    const maxHeight = capabilities.height?.max || 1024

    // Intentar obtener la mayor resolución posible en 3:4
    let targetWidth, targetHeight

    if (maxWidth / maxHeight > 3 / 4) {
      // Dispositivo más ancho, limitamos por altura
      targetHeight = maxHeight
      targetWidth = Math.floor((maxHeight * 3) / 4)
    } else {
      // Dispositivo más alto, limitamos por ancho
      targetWidth = maxWidth
      targetHeight = Math.floor((maxWidth * 4) / 3)
    }

    console.log('🎯 Resolución objetivo:', targetWidth, 'x', targetHeight)

    return { width: targetWidth, height: targetHeight }
  } catch (error) {
    console.error('Error detectando resolución:', error)
    // Valores por defecto si falla
    return { width: 1200, height: 1600 }
  }
}

// Inicializar cámara con mejor resolución
async function iniciarCamara() {
  try {
    const mejorResolucion = await detectarMejorResolucion()

    streamCamara = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: mejorResolucion.width },
        height: { ideal: mejorResolucion.height },
      },
    })

    if (videoCamara.value) {
      videoCamara.value.srcObject = streamCamara
    }

    console.log('[CamaraFotos] Cámara iniciada correctamente')
  } catch (error) {
    console.error('[CamaraFotos] Error al iniciar cámara:', error)
    alert('No se pudo acceder a la cámara. Verificá los permisos.')
    emit('cerrar')
  }
}

// Capturar foto con escalado inteligente y rotación
function capturarFoto() {
  try {
    const video = videoCamara.value

    console.log('📹 Dimensiones del video:')
    console.log('Stream real:', video.videoWidth, 'x', video.videoHeight)
    console.log('Display:', video.clientWidth, 'x', video.clientHeight)

    // Detectar si está en PC (simulación)
    const esNavegadorPC = !window.Capacitor || window.Capacitor.getPlatform() === 'web'

    if (esNavegadorPC) {
      // Generar imagen simulada
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = '#333'
      ctx.fillRect(0, 0, 800, 600)
      ctx.fillStyle = '#fff'
      ctx.font = '40px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('FOTO SIMULADA 800x600', 400, 280)
      ctx.font = '20px Arial'
      ctx.fillText('(Modo desarrollo PC)', 400, 320)

      const imagenBase64 = canvas.toDataURL('image/jpeg', 0.85)
      fotoCapturadaBase64.value = imagenBase64.split(',')[1]
      ultimaCaptura.value = imagenBase64

      mostrarBuscador.value = true

      nextTick(() => {
        if (inputBusqueda.value) {
          inputBusqueda.value.focus()
        }
      })

      console.log('[CamaraFotos] Foto simulada capturada')
      return
    }

    // CAPTURA REAL EN MÓVIL
    // Paso 1: Crear canvas temporal en 600x800 (vertical)
    const canvasTemp = document.createElement('canvas')
    canvasTemp.width = 600
    canvasTemp.height = 800
    const ctxTemp = canvasTemp.getContext('2d')

    // Calcular área visible (lo que hace object-fit: cover)
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight
    const displayWidth = video.clientWidth
    const displayHeight = video.clientHeight

    const videoRatio = videoWidth / videoHeight
    const displayRatio = displayWidth / displayHeight

    let sourceX, sourceY, sourceWidth, sourceHeight

    if (videoRatio > displayRatio) {
      // Video más ancho: recortar lados
      sourceHeight = videoHeight
      sourceWidth = videoHeight * displayRatio
      sourceX = (videoWidth - sourceWidth) / 2
      sourceY = 0
    } else {
      // Video más alto: recortar arriba/abajo
      sourceWidth = videoWidth
      sourceHeight = videoWidth / displayRatio
      sourceX = 0
      sourceY = (videoHeight - sourceHeight) / 2
    }

    console.log('📐 Área capturada:', sourceX, sourceY, sourceWidth, sourceHeight)

    // Dibujar área visible en canvas temporal (600x800)
    ctxTemp.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 600, 800)

    // Paso 2: Rotar 90° a la derecha → queda 800x600 horizontal
    const canvasFinal = document.createElement('canvas')
    canvasFinal.width = 800
    canvasFinal.height = 600
    const ctxFinal = canvasFinal.getContext('2d')

    // Rotar y dibujar
    ctxFinal.translate(800, 0)
    ctxFinal.rotate(Math.PI / 2)
    ctxFinal.drawImage(canvasTemp, 0, 0)

    // Convertir a base64
    const imagenBase64 = canvasFinal.toDataURL('image/jpeg', 0.85)
    fotoCapturadaBase64.value = imagenBase64.split(',')[1]
    ultimaCaptura.value = imagenBase64

    mostrarBuscador.value = true

    nextTick(() => {
      if (inputBusqueda.value) {
        inputBusqueda.value.focus()
      }
    })

    console.log('✅ Foto capturada: 800x600 horizontal')
  } catch (error) {
    console.error('[CamaraFotos] Error al capturar foto:', error)
  }
}

// Seleccionar artículo del buscador
function seleccionarArticulo(articulo) {
  codigoSeleccionado.value = articulo.codigo
  nombreArticuloSeleccionado.value = articulo.nombre
  busquedaCodigo.value = articulo.codigo
  console.log('[CamaraFotos] Artículo seleccionado:', articulo)

  nextTick(() => {
    if (inputBusqueda.value) {
      inputBusqueda.value.blur()
      busquedaCodigo.value = '' // ← AGREGAR ESTA LÍNEA
    }
  })
}

// Confirmar y continuar
async function confirmarYContinuar() {
  if (!codigoSeleccionado.value || !fotoCapturadaBase64.value) {
    return
  }

  try {
    const nombreArchivo = `temp_${Date.now()}.jpg`
    await Filesystem.writeFile({
      path: nombreArchivo,
      data: fotoCapturadaBase64.value,
      directory: Directory.Cache,
    })

    const rutaFoto = nombreArchivo

    fotosTemporales.value.push({
      codigo: codigoSeleccionado.value,
      nombreArticulo: nombreArticuloSeleccionado.value,
      rutaFoto: rutaFoto,
    })

    fotosTomadas.value++

    mensajeTemporal.value = `Foto guardada: ${codigoSeleccionado.value}`
    setTimeout(() => {
      mensajeTemporal.value = ''
    }, 2000)

    resetearEstado()

    console.log('[CamaraFotos] Foto guardada temporalmente')
  } catch (error) {
    console.error('[CamaraFotos] Error al guardar foto temporal:', error)
    alert('Error al guardar la foto')
  }
}

// Descartar foto actual
function descartarFoto() {
  resetearEstado()
  console.log('[CamaraFotos] Foto descartada')
}

// Resetear estado para nueva captura
function resetearEstado() {
  mostrarBuscador.value = false
  busquedaCodigo.value = ''
  codigoSeleccionado.value = null
  nombreArticuloSeleccionado.value = ''
  fotoCapturadaBase64.value = null
  ultimaCaptura.value = null
}

// Finalizar y enviar todas las fotos
function finalizar() {
  if (fotosTemporales.value.length === 0) {
    return
  }

  emit('fotos-guardadas', fotosTemporales.value)
  detenerCamara()
  emit('cerrar')
}

// Cancelar
function cancelar() {
  detenerCamara()
  emit('cerrar')
}

// Detener cámara
function detenerCamara() {
  if (streamCamara) {
    streamCamara.getTracks().forEach((track) => track.stop())
    streamCamara = null
    console.log('[CamaraFotos] Cámara detenida')
  }
}

// Lifecycle
onMounted(() => {
  iniciarCamara()
})

onUnmounted(() => {
  detenerCamara()
})
</script>

<style scoped>
/* MODAL FONDO ESPECÍFICO PARA FOTOS */
.modal-fondo-fotos {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* CONTENEDOR PRINCIPAL - PANTALLA COMPLETA */
.modal-camara-fotos {
  background: #000;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* VIDEO PANTALLA COMPLETA */
.caja-camara {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}

/* ÁREA ÚTIL DE CAPTURA 600x800 */
.area-util-captura {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 800px;
  max-width: 100%;
  max-height: calc(100% - 10px);
  overflow: hidden;
  background: #000;
  border: 3px solid red;
}

.area-util-captura #video-camara-fotos {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* MENSAJE TEMPORAL */
.mensaje-temporal {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primario);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  z-index: 20;
}

/* MINIATURA */
.overlay-miniatura {
  position: absolute;
  bottom: 100px;
  right: 10px;
  width: 100px;
  height: 70px;
  border: 2px solid #fff;
  overflow: hidden;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  z-index: 15;
}

.mini-captura {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* BUSCADOR */
.contenedor-buscador-foto {
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 15;
}

.contenedor-buscador-foto .modal-campo {
  margin-bottom: 0;
}

/* BOTONES INFERIORES */
.caja-inferior {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.7);
  z-index: 15;
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
  gap: 0.5rem;
}

.boton-cancelar {
  background: transparent;
  color: var(--color-texto-secundario);
  border: 1px solid var(--color-borde);
}

.boton-finalizar {
  background: var(--color-exito);
  color: white;
}

.boton-finalizar:disabled {
  background: var(--color-desactivado);
  cursor: not-allowed;
  opacity: 0.6;
}

.boton-capturar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--color-exito);
  color: white;
  border: 4px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.boton-capturar:hover {
  transform: scale(1.1);
}

.boton-capturar:active {
  transform: scale(0.95);
}

/* BOTONES DE ACCIÓN (descartar/confirmar) */
.contenedor-botones-accion {
  display: flex;
  gap: 0.8rem;
  width: 100%;
}

.boton-siguiente,
.boton-descartar {
  flex: 1;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.boton-siguiente {
  background-color: var(--color-exito);
  color: var(--color-texto-principal);
}

.boton-siguiente:disabled {
  background-color: var(--color-desactivado);
  cursor: not-allowed;
  opacity: 0.6;
}

.boton-descartar {
  background-color: var(--color-error);
  color: var(--color-texto-principal);
}
</style>
