<template>
  <div class="contenedor-tabla">
    <h2 class="titulo-tabla">Ajustar ubicaciones</h2>

    <!-- Formulario de ubicación -->
    <FormularioUbicacion @ubicacion-agregada="agregarUbicacion" />

    <!-- Tabla -->
    <TablaUbicaciones
      :ubicaciones="ubicaciones"
      @abrirModalEditar="abrirModalEditar"
      @abrirModalEliminar="abrirModalEliminar"
      @abrirModalEliminarTodas="abrirModalEliminarTodas"
    />

    <!-- Botón flotante para enviar Excel de ubicaciones -->
    <BotonesDescargarEnviar @enviar="enviarUbicacionesExcel" />

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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import ModalEditarUbicacion from '../components/Modales/ModalEditarUbicacion.vue'
import FormularioUbicacion from '../components/Logica/Ubicaciones/FormularioUbicacion.vue'
import TablaUbicaciones from '../components/Logica/Ubicaciones/TablaUbicaciones.vue'
import BotonesDescargarEnviar from '../components/Botones/BotonesDescargarEnviar.vue'
import { generarYGuardarExcelUbicaciones } from '../components/Logica/Ubicaciones/ExportarUbicacionesExcel'
import { compartirArchivo } from '../components/Logica/Pedidos/CompartirExcel.js'
import {
  guardarUbicaciones,
  obtenerUbicaciones,
} from '../components/BaseDeDatos/usoAlmacenamientoUbicaciones'

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

// Cargar ubicaciones al montar
onMounted(async () => {
  ubicaciones.value = await obtenerUbicaciones()
})

// --- FUNCIÓN AGREGAR UBICACIÓN ---
async function agregarUbicacion(datosNuevos) {
  ubicaciones.value.unshift({
    codigo: datosNuevos.codigo,
    ubicacion: datosNuevos.ubicacion,
  })

  await guardarUbicaciones(ubicaciones.value)
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
}

// Cerrar modal eliminar todas
function cerrarModalEliminarTodas() {
  mostrarModalEliminarTodas.value = false
}

// --- FUNCIÓN ENVIAR UBICACIONES COMO EXCEL ---
async function enviarUbicacionesExcel() {
  if (!ubicaciones.value.length) {
    alert('No hay ubicaciones para exportar.')
    return
  }
  try {
    const { uri, nombreArchivo } = await generarYGuardarExcelUbicaciones(ubicaciones.value)
    if (!uri) {
      alert('No se pudo generar el archivo Excel.')
      return
    }
    await compartirArchivo(uri, nombreArchivo)
  } catch (error) {
    alert('Error al enviar el archivo: ' + error.message)
  }
}
</script>
