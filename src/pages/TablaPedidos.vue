<template>
  <div class="contenedor-tabla">
    <h2 class="titulo-tabla">Pedidos</h2>

    <table class="tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Número de Pedido</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(pedido, indice) in pedidos" :key="indice">
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

    <!-- Botón flotante para abrir modal agregar -->
    <BotonFlotante @abrir-modal="abrirModalAgregar" />

    <!-- Modal agregar -->
    <VentanaModal
      v-if="mostrarModalAgregar"
      @agregar-pedido="agregarPedido"
      @cerrar="mostrarModalAgregar = false"
    />

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
    <HistorialPedidos />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'

import BotonFlotante from '../components/Botones/BotonFlotante.vue'
import VentanaModal from '../components/Modales/VentanaModal.vue'
import ModalEditarPedido from '../components/Modales/ModalEditarPedido.vue'
import ModalEliminarPedido from '../components/Modales/ModalEliminarPedido.vue'
import HistorialPedidos from 'src/pages/HistorialPedidos.vue'

//  FUNCIONES DE BASE DE DATOS
import {
  guardarPedidos,
  obtenerPedidos,
} from '../components/BaseDeDatos/usoAlmacenamientoPedidos.js'

const pedidos = ref([])

// Al iniciar el componente, cargo los pedidos guardados
onMounted(async () => {
  const datos = await obtenerPedidos()
  pedidos.value = datos
})

// Estados para mostrar/ocultar modales
const mostrarModalAgregar = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)

const pedidoEditar = ref({ numero: '', fecha: '' })
const indiceEditar = ref(null)

const pedidoEliminar = ref({ numero: '', fecha: '' })
const indiceEliminar = ref(null)

function formatearFecha(fecha) {
  const dia = fecha.getDate().toString().padStart(2, '0')
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
  const anio = fecha.getFullYear()
  return `${dia}/${mes}/${anio}`
}

// Abrir modal agregar
function abrirModalAgregar() {
  mostrarModalAgregar.value = true
}

// Agregar pedido nuevo desde modal
function agregarPedido(nuevoPedido) {
  nuevoPedido.fecha = formatearFecha(new Date())
  pedidos.value.push(nuevoPedido)
  guardarPedidos(pedidos.value) // GUARDAR
  mostrarModalAgregar.value = false
}

// Abrir modal editar con pedido seleccionado
function abrirModalEditar(indice) {
  indiceEditar.value = indice
  pedidoEditar.value = { ...pedidos.value[indice] }
  mostrarModalEditar.value = true
}

// Guardar edición
function guardarEdicion(nuevoNumero) {
  if (indiceEditar.value !== null) {
    pedidos.value[indiceEditar.value].numero = nuevoNumero
    guardarPedidos(pedidos.value) // GUARDAR
  }
  mostrarModalEditar.value = false
}

// Abrir modal eliminar con pedido seleccionado
function abrirModalEliminar(indice) {
  indiceEliminar.value = indice
  pedidoEliminar.value = { ...pedidos.value[indice] }
  mostrarModalEliminar.value = true
}

// Confirmar eliminación
function confirmarEliminacion() {
  if (indiceEliminar.value !== null) {
    pedidos.value.splice(indiceEliminar.value, 1)
    guardarPedidos(pedidos.value) // GUARDAR
  }
  mostrarModalEliminar.value = false
}
</script>
