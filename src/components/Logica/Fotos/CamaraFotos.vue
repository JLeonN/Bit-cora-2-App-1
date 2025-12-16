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

// Inicializar cámara
async function iniciarCamara() {
  try {
    // Detectar si está en desarrollo en navegador
    const esNavegadorPC = !window.Capacitor || window.Capacitor.getPlatform() === 'web'

    if (esNavegadorPC) {
      console.log('[CamaraFotos] Modo simulación PC activado')
      // No iniciar cámara real en PC
      return
    }

    streamCamara = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        aspectRatio: 4 / 3, // Relación 4:3
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

// Capturar foto
function capturarFoto() {
  try {
    // Detectar si está en PC
    const esNavegadorPC = !window.Capacitor || window.Capacitor.getPlatform() === 'web'

    if (esNavegadorPC) {
      // Generar imagen simulada (rectángulo gris 800x600)
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')

      // Fondo gris con texto
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

    // Código original para móvil
    const canvas = document.createElement('canvas')
    const video = videoCamara.value

    canvas.width = 800
    canvas.height = 600

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, 800, 600)

    const imagenBase64 = canvas.toDataURL('image/jpeg', 0.85)
    fotoCapturadaBase64.value = imagenBase64.split(',')[1]
    ultimaCaptura.value = imagenBase64

    mostrarBuscador.value = true

    nextTick(() => {
      if (inputBusqueda.value) {
        inputBusqueda.value.focus()
      }
    })

    console.log('[CamaraFotos] Foto capturada, esperando código...')
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

  // Enfocar el input para que el teclado no tape
  nextTick(() => {
    if (inputBusqueda.value) {
      inputBusqueda.value.blur() // Quitar foco para cerrar teclado
    }
  })
}

// Confirmar y continuar
async function confirmarYContinuar() {
  if (!codigoSeleccionado.value || !fotoCapturadaBase64.value) {
    return
  }

  try {
    // Guardar foto en filesystem temporal
    const nombreArchivo = `temp_${Date.now()}.jpg`
    await Filesystem.writeFile({
      path: nombreArchivo,
      data: fotoCapturadaBase64.value,
      directory: Directory.Cache,
    })

    const rutaFoto = nombreArchivo

    // Agregar a lista temporal
    fotosTemporales.value.push({
      codigo: codigoSeleccionado.value,
      nombreArticulo: nombreArticuloSeleccionado.value,
      rutaFoto: rutaFoto,
    })

    fotosTomadas.value++

    // Mostrar mensaje temporal
    mensajeTemporal.value = `Foto guardada: ${codigoSeleccionado.value}`
    setTimeout(() => {
      mensajeTemporal.value = ''
    }, 2000)

    // Resetear para siguiente foto
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
/* Estilos específicos adicionales */
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
  top: 8rem;
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
  margin-bottom: 4rem;
}
</style>
