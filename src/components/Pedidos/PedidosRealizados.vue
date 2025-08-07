<template>
  <div class="contenedor-tabla">
    <h2 class="titulo-tabla">Pedidos realizados</h2>

    <table class="tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Número de Pedido</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(pedido, indice) in pedidosRealizados" :key="indice">
          <td>{{ pedido.fecha }}</td>
          <td>
            <span class="globito" :title="pedido.numero">
              {{ pedido.numero.slice(0, 15) }}<span v-if="pedido.numero.length > 15">...</span>
            </span>
          </td>
          <td class="acciones">
            <IconPencil class="icono-accion icono-editar" @click="abrirModalEditar(indice)" />
            <IconTrash class="icono-accion icono-borrar" @click="abrirModalEliminar(indice)" />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal editar -->
    <ModalEditarPedido
      v-if="mostrarModalEditar"
      :pedido="pedidoEditar.numero"
      @guardar="guardarEdicion"
      @cerrar="mostrarModalEditar = false"
    />

    <!-- Modal eliminar -->
    <ModalEliminarPedido
      v-if="mostrarModalEliminar"
      :pedido="pedidoEliminar.numero"
      @confirmar="confirmarEliminacion"
      @cerrar="mostrarModalEliminar = false"
    />

    <!-- Botones descargar y enviar -->
    <BotonesDescargarEnviar @descargar="descargarPedidos" @enviar="enviarPedidos" />

    <!-- Mensajes de notificación -->
    <div v-if="mensajeExito" class="mensaje-exito">Archivo descargado correctamente</div>
    <div v-if="mensajeError" class="mensaje-error">Ocurrió un error al descargar</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import { guardarPedidos, obtenerPedidos } from '../BaseDeDatos/almacenamiento.js'
import { generarYGuardarExcelParaDescarga } from './ExportarPedidosExcel'
import { generarYGuardarExcelTemporal } from './GeneraExcel/GeneraExcel.js'
import ModalEditarPedido from '../Modales/ModalEditarPedido.vue'
import ModalEliminarPedido from '../Modales/ModalEliminarPedido.vue'
import BotonesDescargarEnviar from '../Botones/BotonesDescargarEnviar.vue'

const pedidosRealizados = ref([])
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const pedidoEditar = ref({ numero: '', fecha: '' })
const pedidoEliminar = ref({ numero: '', fecha: '' })
const indiceEditar = ref(null)
const indiceEliminar = ref(null)
const mensajeExito = ref(false)
const mensajeError = ref(false)

onMounted(async () => {
  const datos = await obtenerPedidos()
  pedidosRealizados.value = datos.slice().reverse()
})

function abrirModalEditar(indice) {
  indiceEditar.value = indice
  pedidoEditar.value = { ...pedidosRealizados.value[indice] }
  mostrarModalEditar.value = true
}

function guardarEdicion(nuevoNumero) {
  if (indiceEditar.value !== null) {
    pedidosRealizados.value[indiceEditar.value].numero = nuevoNumero
    const pedidosParaGuardar = [...pedidosRealizados.value].reverse()
    guardarPedidos(pedidosParaGuardar)
  }
  mostrarModalEditar.value = false
}

function abrirModalEliminar(indice) {
  indiceEliminar.value = indice
  pedidoEliminar.value = { ...pedidosRealizados.value[indice] }
  mostrarModalEliminar.value = true
}

function confirmarEliminacion() {
  if (indiceEliminar.value !== null) {
    pedidosRealizados.value.splice(indiceEliminar.value, 1)
    const pedidosParaGuardar = [...pedidosRealizados.value].reverse()
    guardarPedidos(pedidosParaGuardar)
  }
  mostrarModalEliminar.value = false
}

async function descargarPedidos() {
  try {
    await generarYGuardarExcelParaDescarga(pedidosRealizados.value)
    mensajeExito.value = true
    setTimeout(() => (mensajeExito.value = false), 3000)
  } catch {
    mensajeError.value = true
    setTimeout(() => (mensajeError.value = false), 3000)
  }
}

// Esta es la función para el botón "Enviar"
async function enviarPedidos() {
  try {
    // 1. Llama a la función que genera el archivo en la caché del celular
    const rutaDelArchivo = await generarYGuardarExcelTemporal(pedidosRealizados.value)

    // 2. Si la ruta existe, significa que el archivo se creó correctamente
    if (rutaDelArchivo) {
      // Usamos tus mensajes existentes para dar feedback visual en el celular
      mensajeExito.value = 'Archivo generado para enviar'
      setTimeout(() => (mensajeExito.value = false), 3000)
    } else {
      // Si la función devuelve null, es que hubo un error
      throw new Error('No se pudo generar el archivo para enviar.')
    }
  } catch (error) {
    // <--- La dejas como estaba
    // Variable para ver el detalle en la consola de depuración
    console.error('Detalle del error al generar archivo:', error)

    // Mensaje de error si algo falla
    mensajeError.value = 'Error al preparar el archivo'
    setTimeout(() => (mensajeError.value = false), 3000)
  }
}
</script>
