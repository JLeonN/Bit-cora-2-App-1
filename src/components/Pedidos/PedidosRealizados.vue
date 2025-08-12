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
    <div v-if="mensajeExito" class="mensaje-exito">{{ mensajeExito }}</div>
    <div v-if="mensajeError" class="mensaje-error">{{ mensajeError }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import { guardarPedidos, obtenerPedidos } from '../BaseDeDatos/almacenamiento.js'
import { generarYGuardarExcelParaDescarga } from './ExportarPedidosExcel'
import { generarYGuardarExcelTemporal } from './GeneraExcel/GeneraExcel.js'
import { compartirArchivo } from 'src/components/Logica/Envios/CompartirExcel.js'
import ModalEditarPedido from '../Modales/ModalEditarPedido.vue'
import ModalEliminarPedido from '../Modales/ModalEliminarPedido.vue'
import BotonesDescargarEnviar from '../Botones/BotonesDescargarEnviar.vue'

const route = useRoute()
const pedidosRealizados = ref([])
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const pedidoEditar = ref({ numero: '', fecha: '' })
const pedidoEliminar = ref({ numero: '', fecha: '' })
const indiceEditar = ref(null)
const indiceEliminar = ref(null)
const mensajeExito = ref('')
const mensajeError = ref('')

function parsearFechaDDMMYYYY(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return null
  const partes = fechaStr.split('/')
  if (partes.length !== 3) return null

  const [dia, mes, anio] = partes.map(Number)
  // Se crea la fecha en UTC para consistencia.
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))

  if (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  ) {
    return fecha
  }
  return null
}

onMounted(async () => {
  let datos = await obtenerPedidos()

  // Lógica de filtrado.
  const { inicio, fin } = route.query

  if (inicio && fin) {
    const fechaInicio = new Date(inicio)
    const fechaFin = new Date(fin)

    datos = datos.filter((pedido) => {
      const fechaPedido = parsearFechaDDMMYYYY(pedido.fecha)
      if (!fechaPedido) return false
      return (
        fechaPedido.getTime() >= fechaInicio.getTime() &&
        fechaPedido.getTime() <= fechaFin.getTime()
      )
    })
  }

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
    mensajeExito.value = 'Archivo descargado correctamente'
    setTimeout(() => (mensajeExito.value = ''), 3000)
  } catch {
    mensajeError.value = 'Ocurrió un error al descargar'
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Botón "Enviar"
async function enviarPedidos() {
  try {
    // Generar el archivo temporal en el dispositivo
    const { uri, nombreArchivo } = await generarYGuardarExcelTemporal(pedidosRealizados.value)

    if (!uri) {
      throw new Error('No se generó el archivo correctamente.')
    }
    // Compartir el archivo usando la lógica centralizada
    await compartirArchivo(uri, nombreArchivo)

    mensajeExito.value = 'Archivo generado y enviado correctamente'
    setTimeout(() => (mensajeExito.value = ''), 3000)
  } catch (error) {
    console.error('Error al enviar el archivo:', error)
    mensajeError.value = 'Error al preparar o enviar el archivo'
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}
</script>
