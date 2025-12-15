<template>
  <q-page class="fondo-app">
    <div class="contenedor-tabla">
      <h2 class="titulo-tabla">Fotos de Productos</h2>

      <!-- Tabla de fotos -->
      <TablaFotos
        :fotos="fotos"
        @editar-codigo="editarCodigoFoto"
        @eliminar-foto="eliminarFoto"
        @limpiar-todo="limpiarTodasFotos"
      />

      <!-- Modal de cámara -->
      <CamaraFotos
        v-if="mostrarCamara"
        @cerrar="mostrarCamara = false"
        @fotos-guardadas="guardarFotosEnLista"
      />

      <!-- Loading -->
      <div v-if="cargando" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <p>{{ mensajeCarga }}</p>
        </div>
      </div>
    </div>

    <!-- Barra de botones inferior -->
    <BarraBotonesInferior
      :mostrarAtras="true"
      :mostrarInicio="true"
      :mostrarAgregar="true"
      :mostrarEnviar="fotos.length > 0"
      :puedeEnviar="fotos.length > 0"
      @agregar="abrirCamara"
      @enviar="enviarFotos"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import TablaFotos from '../components/Logica/Fotos/TablaFotos.vue'
import CamaraFotos from '../components/Logica/Fotos/CamaraFotos.vue'
import BarraBotonesInferior from '../components/Botones/BarraBotonesInferior.vue'
import {
  obtenerFotos,
  agregarFoto,
  eliminarFoto as eliminarFotoStorage,
  editarCodigoFoto as editarCodigoStorage,
  limpiarFotos,
} from '../components/BaseDeDatos/usoAlmacenamientoFotos.js'
import { generarZipFotos } from '../components/Logica/Fotos/GeneradorZipFotos.js'
import { compartirArchivo } from '../components/Logica/Fotos/CompartirArchivo.js'

const $q = useQuasar()

// Estado
const fotos = ref([])
const mostrarCamara = ref(false)
const cargando = ref(false)
const mensajeCarga = ref('')

// Cargar fotos al montar
onMounted(async () => {
  await cargarFotos()
})

// Cargar fotos desde storage
async function cargarFotos() {
  try {
    fotos.value = await obtenerFotos()
    console.log('[PaginaFotos] Fotos cargadas:', fotos.value.length)
  } catch (error) {
    console.error('[PaginaFotos] Error al cargar fotos:', error)
  }
}

// Abrir cámara
function abrirCamara() {
  mostrarCamara.value = true
}

// Guardar fotos en lista (callback de cámara)
async function guardarFotosEnLista(fotosNuevas) {
  try {
    for (const foto of fotosNuevas) {
      await agregarFoto(foto.codigo, foto.nombreArticulo, foto.rutaFoto)
    }

    await cargarFotos()

    $q.notify({
      message: `${fotosNuevas.length} foto${fotosNuevas.length > 1 ? 's' : ''} guardada${fotosNuevas.length > 1 ? 's' : ''}`,
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
      timeout: 2000,
    })

    console.log('[PaginaFotos] Fotos guardadas exitosamente')
  } catch (error) {
    console.error('[PaginaFotos] Error al guardar fotos:', error)
    $q.notify({
      message: 'Error al guardar las fotos',
      color: 'negative',
      icon: 'error',
      position: 'top',
    })
  }
}

// Editar código de foto
async function editarCodigoFoto(id, nuevoCodigo) {
  try {
    const exito = await editarCodigoStorage(id, nuevoCodigo)
    if (exito) {
      await cargarFotos()
      $q.notify({
        message: 'Código actualizado',
        color: 'positive',
        icon: 'check_circle',
        position: 'top',
        timeout: 1500,
      })
    }
  } catch (error) {
    console.error('[PaginaFotos] Error al editar código:', error)
    $q.notify({
      message: 'Error al actualizar código',
      color: 'negative',
      icon: 'error',
      position: 'top',
    })
  }
}

// Eliminar foto individual
async function eliminarFoto(id) {
  try {
    const exito = await eliminarFotoStorage(id)
    if (exito) {
      await cargarFotos()
      $q.notify({
        message: 'Foto eliminada',
        color: 'positive',
        icon: 'check_circle',
        position: 'top',
        timeout: 1500,
      })
    }
  } catch (error) {
    console.error('[PaginaFotos] Error al eliminar foto:', error)
  }
}

// Limpiar todas las fotos
async function limpiarTodasFotos() {
  try {
    const exito = await limpiarFotos()
    if (exito) {
      await cargarFotos()
      $q.notify({
        message: 'Todas las fotos eliminadas',
        color: 'positive',
        icon: 'check_circle',
        position: 'top',
        timeout: 1500,
      })
    }
  } catch (error) {
    console.error('[PaginaFotos] Error al limpiar fotos:', error)
  }
}

// Enviar fotos (generar ZIP y compartir)
async function enviarFotos() {
  if (fotos.value.length === 0) {
    return
  }

  try {
    cargando.value = true
    mensajeCarga.value = 'Comprimiendo fotos...'

    // Generar ZIP
    const { uri, nombre } = await generarZipFotos(fotos.value)

    mensajeCarga.value = 'Preparando para compartir...'

    // Compartir
    await compartirArchivo(uri, nombre, 'zip')

    cargando.value = false

    $q.notify({
      message: 'Fotos compartidas exitosamente',
      color: 'positive',
      icon: 'check_circle',
      position: 'top',
      timeout: 2000,
    })

    console.log('[PaginaFotos] ZIP compartido exitosamente')
  } catch (error) {
    cargando.value = false
    console.error('[PaginaFotos] Error al enviar fotos:', error)
    $q.notify({
      message: 'Error al compartir las fotos',
      color: 'negative',
      icon: 'error',
      position: 'top',
    })
  }
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.loading-content {
  text-align: center;
  color: white;
}
.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
