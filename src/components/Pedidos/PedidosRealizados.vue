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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import ModalEditarPedido from '../Modales/ModalEditarPedido.vue'
import ModalEliminarPedido from '../Modales/ModalEliminarPedido.vue'
import { guardarPedidos, obtenerPedidos } from '../BaseDeDatos/almacenamiento.js'

const pedidosRealizados = ref([])
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const pedidoEditar = ref({ numero: '', fecha: '' })
const pedidoEliminar = ref({ numero: '', fecha: '' })
const indiceEditar = ref(null)
const indiceEliminar = ref(null)

onMounted(async () => {
  const datos = await obtenerPedidos()
  // Se invierte la lista solo para la visualización, mostrando los más nuevos primero.
  pedidosRealizados.value = datos.slice().reverse()
})

function abrirModalEditar(indice) {
  indiceEditar.value = indice
  pedidoEditar.value = { ...pedidosRealizados.value[indice] }
  mostrarModalEditar.value = true
}

function guardarEdicion(nuevoNumero) {
  if (indiceEditar.value !== null) {
    // Se actualiza el pedido en la lista local (que está invertida para la vista).
    pedidosRealizados.value[indiceEditar.value].numero = nuevoNumero
    // Esto asegura que la base de datos mantenga un orden consistente.
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
</script>
