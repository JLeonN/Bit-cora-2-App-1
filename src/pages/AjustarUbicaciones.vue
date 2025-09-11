<template>
  <div class="contenedor-tabla">
    <h2 class="titulo-tabla">Ubicaciones</h2>

    <!-- Selector de Excel para cargar base de datos -->
    <SelectorExcel @base-datos-cargada="manejarBaseDatosCargada" @error-carga="manejarErrorCarga" />

    <!-- Formulario de ubicación -->
    <FormularioUbicacion @ubicacion-agregada="agregarUbicacion" />

    <!-- Tabla -->
    <TablaUbicaciones
      :ubicaciones="ubicaciones"
      @abrirModalEditar="abrirModalEditar"
      @abrirModalEliminar="abrirModalEliminar"
      @abrirModalEliminarTodas="abrirModalEliminarTodas"
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

// Emit para configurar la barra inferior
const emit = defineEmits(['configurar-barra'])

// --- ESTADO PRINCIPAL ---
const ubicaciones = ref([])

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
  mostrarAgregar: false, // Se agrega desde el formulario integrado
  mostrarEnviar: ubicaciones.value.length > 0,
  puedeEnviar: ubicaciones.value.length > 0,
  botonesPersonalizados: [
    // Botón de limpiar todas las ubicaciones
    {
      icono: 'IconTrash',
      accion: 'eliminar-todas',
      titulo: 'Eliminar todas las ubicaciones',
      claseCSS: 'boton-eliminar',
      desactivado: ubicaciones.value.length === 0,
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
  () => ubicaciones.value.length,
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

// --- FUNCIÓN AGREGAR UBICACIÓN ---
async function agregarUbicacion(datosNuevos) {
  ubicaciones.value.unshift({
    codigo: datosNuevos.codigo,
    ubicacion: datosNuevos.ubicacion,
  })

  await guardarUbicaciones(ubicaciones.value)
  actualizarConfiguracionBarra()
}

// Abrir modal editar
function abrirModalEditar(indice) {
  ubicacionEditar.value = { ...ubicaciones.value[indice] }
  indiceEditar = indice
  mostrarModalEditar.value = true
}

// Guardar edición
async function guardarEdicion(datos) {
  if (indiceEditar !== null) {
    ubicaciones.value[indiceEditar] = {
      codigo: datos.codigo.trim().toUpperCase(),
      ubicacion: datos.ubicacion.trim().toUpperCase(),
    }
    await guardarUbicaciones(ubicaciones.value)
    actualizarConfiguracionBarra()
  }
  mostrarModalEditar.value = false
  indiceEditar = null
}

// Cerrar modal editar
function cerrarModalEditar() {
  mostrarModalEditar.value = false
  indiceEditar = null
}

// Abrir modal eliminar
function abrirModalEliminar(indice) {
  ubicacionEliminar.value = ubicaciones.value[indice]
  mostrarModalEliminar.value = true
}

// Confirmar eliminación
async function confirmarEliminacion() {
  const indice = ubicaciones.value.indexOf(ubicacionEliminar.value)
  if (indice !== -1) {
    ubicaciones.value.splice(indice, 1)
    await guardarUbicaciones(ubicaciones.value)
    actualizarConfiguracionBarra()
  }
  mostrarModalEliminar.value = false
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
  ubicaciones.value = []
  await guardarUbicaciones(ubicaciones.value)
  mostrarModalEliminarTodas.value = false
  actualizarConfiguracionBarra()

  mensajeExito.value = 'Todas las ubicaciones eliminadas'
  setTimeout(() => (mensajeExito.value = ''), 3000)
}

// Cerrar modal eliminar todas
function cerrarModalEliminarTodas() {
  mostrarModalEliminarTodas.value = false
}

// --- FUNCIÓN ENVIAR UBICACIONES COMO EXCEL ---
async function enviarUbicacionesExcel() {
  if (!ubicaciones.value.length) {
    mensajeError.value = 'No hay ubicaciones para exportar'
    setTimeout(() => (mensajeError.value = ''), 3000)
    return
  }

  try {
    const { uri, nombreArchivo } = await generarYGuardarExcelUbicaciones(ubicaciones.value)
    if (!uri) {
      throw new Error('No se pudo generar el archivo Excel')
    }

    await compartirArchivo(uri, nombreArchivo)
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
  ubicaciones.value = await obtenerUbicaciones()

  // Configurar la barra inferior
  actualizarConfiguracionBarra()
})

onUnmounted(() => {
  // Limpiar configuración de la barra al salir de la página
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
