<template>
  <div class="modal-fondo" @click.self="cancelar">
    <div class="modal-camara">
      <!-- Mensaje temporal después de guardar -->
      <div v-if="mensajeTemporal" class="mensaje-temporal">
        {{ mensajeTemporal }}
      </div>

      <!-- Caja de la cámara -->
      <div class="caja-camara">
        <video ref="videoCamara" id="video-camara-fotos" autoplay playsinline></video>

        <!-- Overlay de área de captura 4:3 -->
        <div class="overlay-area-captura">
          <div class="zona-oscura zona-arriba"></div>
          <div class="zona-captura">
            <div class="marco-captura"></div>
          </div>
          <div class="zona-oscura zona-abajo"></div>
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
        <CodigoMasNombre
          v-if="mostrarResultadosBuscador"
          :busqueda="busquedaCodigo"
          @articulo-seleccionado="seleccionarArticulo"
        />

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
import { ScreenOrientation } from '@capacitor/screen-orientation'
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
const mostrarResultadosBuscador = ref(true)

// Lista temporal de fotos
const fotosTemporales = ref([])

// Bloquear orientación
async function bloquearOrientacion() {
  try {
    const esNavegadorPC = !window.Capacitor || window.Capacitor.getPlatform() === 'web'

    if (!esNavegadorPC) {
      await ScreenOrientation.lock({ orientation: 'portrait' })
      console.log('[CamaraFotos] Orientación bloqueada en vertical')
    }
  } catch (error) {
    console.error('[CamaraFotos] Error al bloquear orientación:', error)
  }
}

// Desbloquear orientación
async function desbloquearOrientacion() {
  try {
    const esNavegadorPC = !window.Capacitor || window.Capacitor.getPlatform() === 'web'

    if (!esNavegadorPC) {
      await ScreenOrientation.unlock()
      console.log('[CamaraFotos] Orientación desbloqueada')
    }
  } catch (error) {
    console.error('[CamaraFotos] Error al desbloquear orientación:', error)
  }
}

// Inicializar cámara
async function iniciarCamara() {
  try {
    // Bloquear orientación en vertical
    await bloquearOrientacion()

    // Detectar si está en desarrollo en navegador
    const esNavegadorPC = !window.Capacitor || window.Capacitor.getPlatform() === 'web'

    if (esNavegadorPC) {
      console.log('[CamaraFotos] Modo simulación PC activado')
      return
    }

    // Solicitar cámara con aspect ratio 4:3
    streamCamara = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 800 },
        height: { ideal: 600 },
        aspectRatio: { ideal: 4 / 3 },
      },
    })

    if (videoCamara.value) {
      videoCamara.value.srcObject = streamCamara
    }

    console.log('[CamaraFotos] Cámara iniciada correctamente con 4:3')
  } catch (error) {
    console.error('[CamaraFotos] Error al iniciar cámara:', error)
    alert('No se pudo acceder a la cámara. Verificá los permisos.')
    await desbloquearOrientacion()
    emit('cerrar')
  }
}

// Capturar foto
function capturarFoto() {
  try {
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
      ctx.fillText('FOTO SIMULADA', 400, 280)
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

    // Captura real en móvil
    const canvas = document.createElement('canvas')
    const video = videoCamara.value

    // Obtener dimensiones reales del video
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    // Calcular dimensiones para recortar en 4:3
    let sourceWidth, sourceHeight, sourceX, sourceY

    const videoAspectRatio = videoWidth / videoHeight
    const targetAspectRatio = 4 / 3

    if (videoAspectRatio > targetAspectRatio) {
      // Video es más ancho que 4:3, recortar los lados
      sourceHeight = videoHeight
      sourceWidth = videoHeight * targetAspectRatio
      sourceX = (videoWidth - sourceWidth) / 2
      sourceY = 0
    } else {
      // Video es más alto que 4:3, recortar arriba/abajo
      sourceWidth = videoWidth
      sourceHeight = videoWidth / targetAspectRatio
      sourceX = 0
      sourceY = (videoHeight - sourceHeight) / 2
    }

    // Establecer canvas a 800x600
    canvas.width = 800
    canvas.height = 600

    const ctx = canvas.getContext('2d')

    // Dibujar la porción recortada del video en el canvas
    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 800, 600)

    const imagenBase64 = canvas.toDataURL('image/jpeg', 0.85)
    fotoCapturadaBase64.value = imagenBase64.split(',')[1]
    ultimaCaptura.value = imagenBase64

    mostrarBuscador.value = true

    nextTick(() => {
      if (inputBusqueda.value) {
        inputBusqueda.value.focus()
      }
    })

    console.log('[CamaraFotos] Foto capturada correctamente en 4:3')
  } catch (error) {
    console.error('[CamaraFotos] Error al capturar foto:', error)
  }
}

// Seleccionar artículo del buscador
function seleccionarArticulo(articulo) {
  codigoSeleccionado.value = articulo.codigo
  nombreArticuloSeleccionado.value = articulo.nombre
  busquedaCodigo.value = articulo.codigo

  // Ocultar dropdown
  mostrarResultadosBuscador.value = false

  // Quitar foco del input
  nextTick(() => {
    if (inputBusqueda.value) {
      inputBusqueda.value.blur()
    }
  })

  console.log('[CamaraFotos] Artículo seleccionado:', articulo)
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
  mostrarResultadosBuscador.value = true
}

// Finalizar y enviar todas las fotos
async function finalizar() {
  if (fotosTemporales.value.length === 0) {
    return
  }

  emit('fotos-guardadas', fotosTemporales.value)
  detenerCamara()
  await desbloquearOrientacion()
  emit('cerrar')
}

// Cancelar
async function cancelar() {
  detenerCamara()
  await desbloquearOrientacion()
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
  desbloquearOrientacion()
})
</script>

<style scoped>
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

.contenedor-buscador-foto {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  position: absolute;
  top: 1rem;
  left: 1.5rem;
  right: 1.5rem;
  z-index: 10;
}

.contenedor-buscador-foto .modal-campo {
  margin-bottom: 0;
}

.caja-inferior {
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  margin-bottom: 2rem;
}

/* VIDEO MÁS CHICO */
.caja-camara {
  position: relative;
  width: 100%;
  max-height: 40vh; /* Solo ocupa 40% de la altura de la pantalla */
  aspect-ratio: 4 / 3;
  background: #000;
  overflow: hidden;
  margin: 2rem auto 1rem auto;
}

#video-camara-fotos {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* OCULTAR OVERLAY */
.overlay-area-captura {
  display: none;
}
</style>
