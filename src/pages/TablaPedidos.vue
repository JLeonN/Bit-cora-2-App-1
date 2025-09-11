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

    <!-- Modal: Nuevo Pedido -->
    <ModalNuevoPedido
      v-if="mostrarModalAgregar"
      @agregar-pedido="agregarPedido"
      @cerrar="mostrarModalAgregar = false"
      @abrir-camara="abrirCamaraPedidos"
    />

    <!-- Modal: Editar Pedido -->
    <ModalEditarPedido
      v-if="mostrarModalEditar"
      :pedido="pedidoEditar.numero"
      @guardar="guardarEdicion"
      @cerrar="mostrarModalEditar = false"
    />

    <!-- Modal: Eliminar Pedido -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="pedidoEliminar.numero"
      @confirmar="confirmarEliminacion"
      @cerrar="mostrarModalEliminar = false"
    />

    <!-- Modal: Cámara -->
    <CamaraPedidos
      v-if="mostrarCamaraPedidos"
      @cancelar="cerrarCamaraPedidos"
      @guardar="abrirModalConfirmarEscaneados"
    />

    <HistorialPedidos />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'

import ModalNuevoPedido from '../components/Modales/ModalNuevoPedido.vue'
import ModalEditarPedido from '../components/Modales/ModalEditarPedido.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import CamaraPedidos from '../components/Logica/Pedidos/CamaraPedidos.vue'
import HistorialPedidos from 'src/components/Pedidos/HistorialPedidos.vue'
import { guardarPedidos, obtenerPedidos } from '../components/BaseDeDatos/almacenamiento'

// Emit para configurar la barra inferior
const emit = defineEmits(['configurar-barra'])

// Estado principal
const pedidos = ref([])

// Estados de modales
const mostrarModalAgregar = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const mostrarCamaraPedidos = ref(false)
const mostrarModalConfirmarEscaneados = ref(false)

// Datos para editar/eliminar
const pedidoEditar = ref(null)
const pedidoEliminar = ref(null)
const pedidosEscaneados = ref([])

// Computed
const ultimosTresPedidos = computed(() => {
  return [...pedidos.value].slice(-3).reverse()
})

// Configuración dinámica de la barra inferior
const configuracionBarra = computed(() => ({
  mostrarAgregar: true,
  mostrarEnviar: false, // TablaPedidos no necesita enviar
  puedeEnviar: false,
  botonesPersonalizados: [],
}))

// Métodos que la barra inferior va a llamar
const metodosParaBarra = {
  onAgregar: () => {
    abrirModalAgregar()
  },
  onEnviar: () => {
    // No necesario en TablaPedidos
    console.log('Enviar no implementado en TablaPedidos')
  },
  onAccionPersonalizada: (accion) => {
    console.log('Acción personalizada:', accion)
  },
}

// Función para actualizar la configuración de la barra
const actualizarConfiguracionBarra = () => {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

// Watchers para actualizar la barra cuando cambien los datos
watch(
  () => pedidos.value.length,
  () => {
    actualizarConfiguracionBarra()
  },
  { deep: true },
)

// Funciones utilitarias
function formatearFecha(fecha) {
  const dia = fecha.getDate().toString().padStart(2, '0')
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
  const anio = fecha.getFullYear()
  return `${dia}/${mes}/${anio}`
}

// Métodos de modales
function abrirModalAgregar() {
  mostrarModalAgregar.value = true
}

function agregarPedido(nuevosPedidos) {
  const fecha = formatearFecha(new Date())

  // Si viene un solo pedido como objeto
  if (!Array.isArray(nuevosPedidos)) {
    nuevosPedidos = [nuevosPedidos]
  }

  // Guardar todos con la fecha
  nuevosPedidos.forEach((pedido) => {
    pedidos.value.push({
      numero: pedido.numero,
      fecha,
    })
  })

  guardarPedidos(pedidos.value)
  mostrarModalAgregar.value = false

  // Actualizar barra después de agregar
  actualizarConfiguracionBarra()
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

  // Actualizar barra después de eliminar
  actualizarConfiguracionBarra()
}

// Métodos de cámara
function abrirCamaraPedidos() {
  mostrarModalAgregar.value = false
  mostrarCamaraPedidos.value = true
}

function cerrarCamaraPedidos() {
  mostrarCamaraPedidos.value = false
  pedidosEscaneados.value = []
}

function abrirModalConfirmarEscaneados(arrayPedidos) {
  pedidosEscaneados.value = arrayPedidos
  mostrarModalConfirmarEscaneados.value = true
}

// Ciclo de vida
onMounted(async () => {
  // Cargar datos existentes
  const datos = await obtenerPedidos()
  pedidos.value = datos

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
