<template>
  <div class="contenedor-tabla">
    <h2 class="titulo-tabla">Ubicaciones</h2>

    <!-- Selector de Excel para cargar base de datos -->
    <SelectorExcel @base-datos-cargada="manejarBaseDatosCargada" @error-carga="manejarErrorCarga" />

    <!-- Formulario de ubicación -->
    <FormularioUbicacion @ubicacion-agregada="agregarUbicacion" />

    <!-- Tabla -->
    <TablaUbicaciones
      :ubicaciones="ubicacionesArray"
      @abrirModalEditar="abrirModalEditar"
      @abrirModalEliminar="abrirModalEliminar"
      @abrirModalEliminarTodas="abrirModalEliminarTodas"
      @enviar-a-etiquetas="enviarAEtiquetas"
    />

    <!-- Modal: Editar Ubicación -->
    <ModalEditarUbicacion
      v-if="mostrarModalEditar"
      :codigo="ubicacionEditar?.codigo"
      :ubicacion="ubicacionEditar?.ubicacion"
      @guardar="guardarEdicion"
      @cerrar="cerrarModalEditar"
    />

    <!-- Modal: Eliminar Ubicación -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="ubicacionEliminar?.codigo"
      @confirmar="confirmarEliminacion"
      @cerrar="cerrarModalEliminar"
    />

    <!-- Modal: Eliminar Todas Ubicaciones -->
    <ModalEliminar
      v-if="mostrarModalEliminarTodas"
      texto="todas las ubicaciones"
      @confirmar="confirmarEliminacionTodas"
      @cerrar="cerrarModalEliminarTodas"
    />

    <!-- Mensajes de notificación -->
    <div v-if="mensajeExito" class="mensaje-exito">{{ mensajeExito }}</div>
    <div v-if="mensajeError" class="mensaje-error">{{ mensajeError }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Notify } from 'quasar'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import ModalEditarUbicacion from '../components/Modales/ModalEditarUbicacion.vue'
import FormularioUbicacion from '../components/Logica/Ubicaciones/FormularioUbicacion.vue'
import TablaUbicaciones from '../components/Logica/Ubicaciones/TablaUbicaciones.vue'
import SelectorExcel from '../components/Logica/Ubicaciones/SelectorExcel.vue'
import { generarYGuardarExcelUbicaciones } from '../components/Logica/Ubicaciones/ExportarUbicacionesExcel'
import { compartirArchivo } from '../components/Logica/Pedidos/CompartirExcel.js'
import {
  guardarUbicaciones,
  obtenerUbicaciones,
} from '../components/BaseDeDatos/usoAlmacenamientoUbicaciones'
import {
  guardarEtiquetas,
  obtenerEtiquetas,
} from '../components/BaseDeDatos/usoAlmacenamientoEtiquetas.js'
import { obtenerArticuloPorCodigo } from '../components/BaseDeDatos/LectorExcel.js'

// Emit para configurar la barra inferior
const emit = defineEmits(['configurar-barra'])

// --- ESTADO PRINCIPAL ---
const ubicaciones = ref([])

// Computed para garantizar que siempre sea array
const ubicacionesArray = computed(() => {
  if (!Array.isArray(ubicaciones.value)) {
    console.warn(
      '[AjustarUbicaciones] ubicaciones no es array:',
      typeof ubicaciones.value,
      ubicaciones.value,
    )
    return []
  }
  return ubicaciones.value
})

// Modal eliminar
const mostrarModalEliminar = ref(false)
const ubicacionEliminar = ref(null)

// Modal eliminar todas
const mostrarModalEliminarTodas = ref(false)

// Modal editar
const mostrarModalEditar = ref(false)
const ubicacionEditar = ref(null)
let indiceEditar = null

// Estados de notificaciones
const mensajeExito = ref('')
const mensajeError = ref('')

// Configuración dinámica de la barra inferior
const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: ubicacionesArray.value.length > 0,
  puedeEnviar: ubicacionesArray.value.length > 0,
  botonesPersonalizados: [
    {
      icono: 'IconTrash',
      accion: 'eliminar-todas',
      titulo: 'Eliminar todas las ubicaciones',
      claseCSS: 'boton-eliminar',
      desactivado: ubicacionesArray.value.length === 0,
    },
  ],
}))

// Métodos que la barra inferior va a llamar
const metodosParaBarra = {
  onAgregar: () => {
    // No se usa porque el formulario ya está integrado
  },
  onEnviar: () => {
    enviarUbicacionesExcel()
  },
  onAccionPersonalizada: (accion) => {
    if (accion === 'eliminar-todas') {
      abrirModalEliminarTodas()
    }
  },
}

// Función para actualizar la configuración de la barra
const actualizarConfiguracionBarra = () => {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

// Watchers para actualizar la barra cuando cambien los datos
watch(
  () => ubicacionesArray.value.length,
  () => {
    actualizarConfiguracionBarra()
  },
  { deep: true },
)

// --- MANEJO DE EVENTOS DEL SELECTOR DE EXCEL ---
function manejarBaseDatosCargada(evento) {
  console.log('Base de datos cargada:', evento)
  mensajeExito.value = 'Base de datos cargada correctamente'
  setTimeout(() => (mensajeExito.value = ''), 3000)
}

function manejarErrorCarga(mensaje) {
  console.error('Error cargando base de datos:', mensaje)
  mensajeError.value = `Error al cargar archivo: ${mensaje}`
  setTimeout(() => (mensajeError.value = ''), 3000)
}

// --- FUNCIÓN AGREGAR UBICACIÓN
async function agregarUbicacion(datosNuevos) {
  try {
    if (!Array.isArray(ubicaciones.value)) {
      console.warn('[agregarUbicacion] Reinicializando ubicaciones como array')
      ubicaciones.value = []
    }

    if (!datosNuevos || !datosNuevos.codigo || !datosNuevos.ubicacion) {
      console.error('[agregarUbicacion] Datos inválidos:', datosNuevos)
      mensajeError.value = 'Datos de ubicación inválidos'
      setTimeout(() => (mensajeError.value = ''), 3000)
      return
    }

    const nuevaUbicacion = {
      codigo: String(datosNuevos.codigo).trim().toUpperCase(),
      ubicacion: String(datosNuevos.ubicacion).trim().toUpperCase(),
    }

    ubicaciones.value.unshift(nuevaUbicacion)
    await guardarUbicaciones(ubicaciones.value)
    actualizarConfiguracionBarra()

    console.log('[agregarUbicacion] Ubicación agregada:', nuevaUbicacion)
  } catch (error) {
    console.error('[agregarUbicacion] Error:', error)
    mensajeError.value = 'Error al agregar ubicación: ' + error.message
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// --- ENVIAR A ETIQUETAS ---
async function enviarAEtiquetas(ubicacion) {
  try {
    const articulo = obtenerArticuloPorCodigo(ubicacion.codigo)
    const nombreArticulo = articulo ? articulo.nombre : 'Artículo desconocido'

    const nuevaEtiqueta = {
      id: Date.now(),
      codigo: ubicacion.codigo,
      descripcion: nombreArticulo,
      ubicacion: ubicacion.ubicacion,
      cantidad: 1,
      tamano: '10x15cm',
    }

    const etiquetasActuales = await obtenerEtiquetas()
    const listaActualizada = etiquetasActuales
      ? [...etiquetasActuales, nuevaEtiqueta]
      : [nuevaEtiqueta]

    await guardarEtiquetas(listaActualizada)

    console.log('[AjustarUbicaciones] Etiqueta enviada:', nuevaEtiqueta)

    Notify.create({
      type: 'positive',
      message: '✅ Etiqueta agregada correctamente',
      position: 'top',
      timeout: 2000,
    })
  } catch (error) {
    console.error('[AjustarUbicaciones] Error enviando a etiquetas:', error)
    Notify.create({
      type: 'negative',
      message: '❌ Error al agregar etiqueta',
      position: 'top',
      timeout: 2000,
    })
  }
}

// Abrir modal editar
function abrirModalEditar(indice) {
  try {
    if (
      !Array.isArray(ubicacionesArray.value) ||
      indice < 0 ||
      indice >= ubicacionesArray.value.length
    ) {
      console.error('[abrirModalEditar] Índice inválido:', indice)
      mensajeError.value = 'Error: ubicación no encontrada'
      setTimeout(() => (mensajeError.value = ''), 3000)
      return
    }

    ubicacionEditar.value = { ...ubicacionesArray.value[indice] }
    indiceEditar = indice
    mostrarModalEditar.value = true
  } catch (error) {
    console.error('[abrirModalEditar] Error:', error)
    mensajeError.value = 'Error al abrir editor'
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Guardar edición
async function guardarEdicion(datos) {
  try {
    if (indiceEditar === null || !Array.isArray(ubicaciones.value)) {
      console.error('[guardarEdicion] Estado inválido')
      return
    }

    if (indiceEditar < 0 || indiceEditar >= ubicaciones.value.length) {
      console.error('[guardarEdicion] Índice fuera de rango:', indiceEditar)
      return
    }

    ubicaciones.value[indiceEditar] = {
      codigo: String(datos.codigo || '')
        .trim()
        .toUpperCase(),
      ubicacion: String(datos.ubicacion || '')
        .trim()
        .toUpperCase(),
    }
    await guardarUbicaciones(ubicaciones.value)
    actualizarConfiguracionBarra()

    mostrarModalEditar.value = false
    indiceEditar = null

    console.log('[guardarEdicion] Ubicación editada exitosamente')
  } catch (error) {
    console.error('[guardarEdicion] Error:', error)
    mensajeError.value = 'Error al guardar cambios: ' + error.message
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Cerrar modal editar
function cerrarModalEditar() {
  mostrarModalEditar.value = false
  indiceEditar = null
}

// Abrir modal eliminar
function abrirModalEliminar(indice) {
  try {
    if (
      !Array.isArray(ubicacionesArray.value) ||
      indice < 0 ||
      indice >= ubicacionesArray.value.length
    ) {
      console.error('[abrirModalEliminar] Índice inválido:', indice)
      return
    }

    ubicacionEliminar.value = ubicacionesArray.value[indice]
    mostrarModalEliminar.value = true
  } catch (error) {
    console.error('[abrirModalEliminar] Error:', error)
  }
}

// Confirmar eliminación
async function confirmarEliminacion() {
  try {
    if (!Array.isArray(ubicaciones.value) || !ubicacionEliminar.value) {
      console.error('[confirmarEliminacion] Estado inválido')
      return
    }

    const indice = ubicaciones.value.indexOf(ubicacionEliminar.value)
    if (indice !== -1) {
      ubicaciones.value.splice(indice, 1)
      await guardarUbicaciones(ubicaciones.value)
      actualizarConfiguracionBarra()
    }

    mostrarModalEliminar.value = false
  } catch (error) {
    console.error('[confirmarEliminacion] Error:', error)
    mensajeError.value = 'Error al eliminar ubicación'
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Cerrar modal eliminar
function cerrarModalEliminar() {
  mostrarModalEliminar.value = false
}

// Abrir modal eliminar todas
function abrirModalEliminarTodas() {
  mostrarModalEliminarTodas.value = true
}

// Confirmar eliminación de todas
async function confirmarEliminacionTodas() {
  try {
    ubicaciones.value = []
    await guardarUbicaciones(ubicaciones.value)
    mostrarModalEliminarTodas.value = false
    actualizarConfiguracionBarra()

    mensajeExito.value = 'Todas las ubicaciones eliminadas'
    setTimeout(() => (mensajeExito.value = ''), 3000)
  } catch (error) {
    console.error('[confirmarEliminacionTodas] Error:', error)
    mensajeError.value = 'Error al eliminar ubicaciones'
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Cerrar modal eliminar todas
function cerrarModalEliminarTodas() {
  mostrarModalEliminarTodas.value = false
}

// --- FUNCIÓN ENVIAR UBICACIONES COMO EXCEL
async function enviarUbicacionesExcel() {
  try {
    if (!Array.isArray(ubicacionesArray.value) || ubicacionesArray.value.length === 0) {
      mensajeError.value = 'No hay ubicaciones para exportar'
      setTimeout(() => (mensajeError.value = ''), 3000)
      return
    }

    const resultado = await generarYGuardarExcelUbicaciones(ubicacionesArray.value)

    if (!resultado || !resultado.uri) {
      throw new Error('No se pudo generar el archivo Excel')
    }

    await compartirArchivo(resultado.uri, resultado.nombreArchivo)
    mensajeExito.value = 'Archivo de ubicaciones enviado correctamente'
    setTimeout(() => (mensajeExito.value = ''), 3000)
  } catch (error) {
    console.error('Error al enviar ubicaciones:', error)
    mensajeError.value = 'Error al enviar el archivo: ' + error.message
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Cargar ubicaciones al montar
onMounted(async () => {
  try {
    console.log('[AjustarUbicaciones] Montando componente...')

    const ubicacionesCargadas = await obtenerUbicaciones()

    if (Array.isArray(ubicacionesCargadas)) {
      ubicaciones.value = ubicacionesCargadas
      console.log(`[AjustarUbicaciones] ${ubicacionesCargadas.length} ubicaciones cargadas`)
    } else {
      console.warn(
        '[AjustarUbicaciones] obtenerUbicaciones() no devolvió array:',
        ubicacionesCargadas,
      )
      ubicaciones.value = []
    }

    actualizarConfiguracionBarra()
  } catch (error) {
    console.error('[AjustarUbicaciones] Error en onMounted:', error)
    ubicaciones.value = []
    mensajeError.value = 'Error al cargar ubicaciones: ' + error.message
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
})

onUnmounted(() => {
  emit(
    'configurar-barra',
    {
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
    },
    null,
  )
})
</script>
