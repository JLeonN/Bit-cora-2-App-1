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
        <tr v-for="pedido in ultimosTresPedidos" :key="pedido.numero">
          <td>{{ pedido.fecha }}</td>
          <td>
            <span class="globito" :title="pedido.numero">
              {{ pedido.numero.slice(0, 15) }}<span v-if="pedido.numero.length > 15">...</span>
            </span>
          </td>
          <td class="acciones">
            <IconPencil class="icono-accion icono-editar" @click="abrirModalEditar(pedido)" />
            <IconTrash class="icono-accion icono-borrar" @click="abrirModalEliminar(pedido)" />
          </td>
        </tr>
      </tbody>
    </table>

    <BotonFlotante @abrir-modal="abrirModalAgregar" />

    <VentanaModal
      v-if="mostrarModalAgregar"
      @agregar-pedido="agregarPedido"
      @cerrar="mostrarModalAgregar = false"
    />

    <ModalEditarPedido
      v-if="mostrarModalEditar"
      :pedido="pedidoEditar.numero"
      @guardar="guardarEdicion"
      @cerrar="mostrarModalEditar = false"
    />

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
import { ref, computed, onMounted } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'

import BotonFlotante from '../components/Botones/BotonFlotante.vue'
import VentanaModal from '../components/Modales/ModalNuevoPedido.vue'
import ModalEditarPedido from '../components/Modales/ModalEditarPedido.vue'
import ModalEliminarPedido from '../components/Modales/ModalEliminarPedido.vue'
import HistorialPedidos from 'src/components/Pedidos/HistorialPedidos.vue'
import { guardarPedidos, obtenerPedidos } from '../components/BaseDeDatos/almacenamiento'

const pedidos = ref([])

const ultimosTresPedidos = computed(() => {
  return [...pedidos.value].slice(-3).reverse()
})

onMounted(async () => {
  const datos = await obtenerPedidos()
  pedidos.value = datos
})

const mostrarModalAgregar = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)

const pedidoEditar = ref(null)
const pedidoEliminar = ref(null)

function formatearFecha(fecha) {
  const dia = fecha.getDate().toString().padStart(2, '0')
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
  const anio = fecha.getFullYear()
  return `${dia}/${mes}/${anio}`
}

function abrirModalAgregar() {
  mostrarModalAgregar.value = true
}

function agregarPedido(nuevoPedido) {
  nuevoPedido.fecha = formatearFecha(new Date())
  pedidos.value.push(nuevoPedido)
  guardarPedidos(pedidos.value)
  mostrarModalAgregar.value = false
}

function abrirModalEditar(pedido) {
  pedidoEditar.value = { ...pedido }
  mostrarModalEditar.value = true
}

function guardarEdicion(nuevoNumero) {
  const indice = pedidos.value.findIndex((p) => p.numero === pedidoEditar.value.numero)
  if (indice !== -1) {
    pedidos.value[indice].numero = nuevoNumero
    guardarPedidos(pedidos.value)
  }
  mostrarModalEditar.value = false
}

function abrirModalEliminar(pedido) {
  pedidoEliminar.value = { ...pedido }
  mostrarModalEliminar.value = true
}

function confirmarEliminacion() {
  const indice = pedidos.value.findIndex((p) => p.numero === pedidoEliminar.value.numero)
  if (indice !== -1) {
    pedidos.value.splice(indice, 1)
    guardarPedidos(pedidos.value)
  }
  mostrarModalEliminar.value = false
}
</script>
