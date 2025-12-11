<template>
  <div class="contenedor-tabla">
    <!-- Header con título y botón de estadísticas -->
    <div class="encabezado-pedidos">
      <h2 class="titulo-tabla">Pedidos</h2>
      <button class="boton-estadisticas-anuales" @click="irAResumenAnual" title="Ver resumen anual">
        <IconCalendarStats :size="24" />
      </button>
    </div>

    <table class="tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Número de Pedido</th>
          <th>Items</th>
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
          <td>{{ pedido.items || '-' }}</td>
          <td class="acciones">
            <IconPencil class="icono-accion icono-editar" @click="abrirModalEditar(pedido)" />
            <IconTrash class="icono-accion icono-borrar" @click="abrirModalEliminar(pedido)" />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Contador de pedidos diarios -->
    <ContadorPedidosDiarios ref="contadorRef" />

    <!-- Modal: Nuevo Pedido -->
    <ModalNuevoPedido
      v-if="mostrarModalAgregar"
      @agregar-pedido="agregarPedido"
      @cerrar="mostrarModalAgregar = false"
      @abrir-camara="abrirCamaraPedidos"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- Modal: Editar Pedido -->
    <ModalEditarPedido
      v-if="mostrarModalEditar"
      :pedido="pedidoEditar.numero"
      :items="pedidoEditar.items"
      @guardar="guardarEdicion"
      @cerrar="mostrarModalEditar = false"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- Modal: Eliminar Pedido -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="pedidoEliminar.numero"
      @confirmar="confirmarEliminacion"
      @cerrar="mostrarModalEliminar = false"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- Modal: Cámara -->
    <CamaraPedidos
      v-if="mostrarCamaraPedidos"
      @cancelar="cerrarCamaraPedidos"
      @guardar="abrirModalConfirmarEscaneados"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <HistorialPedidos />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { IconPencil, IconTrash, IconCalendarStats } from '@tabler/icons-vue'
import { guardarPedidos, obtenerPedidos } from '../components/BaseDeDatos/almacenamiento'
import ModalNuevoPedido from '../components/Modales/ModalNuevoPedido.vue'
import ModalEditarPedido from '../components/Modales/ModalEditarPedido.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import CamaraPedidos from '../components/Logica/Pedidos/CamaraPedidos.vue'
import HistorialPedidos from '../components/Logica/Pedidos/HistorialPedidos.vue'
import ContadorPedidosDiarios from '../components/Logica/Pedidos/ContadorPedidosDiarios.vue'

const router = useRouter()

// Emit para configurar la barra inferior
const emit = defineEmits(['configurar-barra'])

// Estado principal
const pedidos = ref([])

// Referencias
const contadorRef = ref(null)

// Estados de modales
const mostrarModalAgregar = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const mostrarCamaraPedidos = ref(false)
const mostrarModalConfirmarEscaneados = ref(false)

// Estado para controlar si algún modal está activo
const modalActivo = ref(false)

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
  mostrarEnviar: false,
  puedeEnviar: false,
  botonesPersonalizados: [],
  modalActivo: modalActivo.value,
}))

// Métodos que la barra inferior va a llamar
const metodosParaBarra = {
  onAgregar: () => {
    abrirModalAgregar()
  },
  onEnviar: () => {
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

// Watcher para actualizar cuando cambia el estado del modal
watch(
  () => modalActivo.value,
  () => {
    actualizarConfiguracionBarra()
  },
)

// Métodos para manejar el estado del modal
const manejarModalAbierto = () => {
  modalActivo.value = true
}

const manejarModalCerrado = () => {
  modalActivo.value = false
}

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

  if (!Array.isArray(nuevosPedidos)) {
    nuevosPedidos = [nuevosPedidos]
  }

  nuevosPedidos.forEach((pedido) => {
    pedidos.value.push({
      numero: pedido.numero,
      fecha,
      items: pedido.items || 1,
    })
  })

  guardarPedidos(pedidos.value)
  mostrarModalAgregar.value = false

  actualizarConfiguracionBarra()

  if (contadorRef.value) {
    contadorRef.value.actualizarContador()
  }
}

function abrirModalEditar(pedido) {
  pedidoEditar.value = { ...pedido }
  mostrarModalEditar.value = true
}

function guardarEdicion(datosEditados) {
  const indice = pedidos.value.findIndex((p) => p.numero === pedidoEditar.value.numero)
  if (indice !== -1) {
    pedidos.value[indice].numero = datosEditados.numero
    pedidos.value[indice].items = datosEditados.items
    guardarPedidos(pedidos.value)
  }
  mostrarModalEditar.value = false

  if (contadorRef.value) {
    contadorRef.value.actualizarContador()
  }
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

  actualizarConfiguracionBarra()

  if (contadorRef.value) {
    contadorRef.value.actualizarContador()
  }
}

// Métodos de cámara
function abrirCamaraPedidos() {
  mostrarModalAgregar.value = false
  mostrarCamaraPedidos.value = true
  modalActivo.value = true
}

function cerrarCamaraPedidos() {
  mostrarCamaraPedidos.value = false
  modalActivo.value = false
  pedidosEscaneados.value = []
}

function abrirModalConfirmarEscaneados(arrayPedidos) {
  pedidosEscaneados.value = arrayPedidos
  mostrarModalConfirmarEscaneados.value = true
}

// Navegación a resumen anual
function irAResumenAnual() {
  router.push({ name: 'ResumenAnual' })
}

// Ciclo de vida
onMounted(async () => {
  const datos = await obtenerPedidos()
  pedidos.value = datos

  actualizarConfiguracionBarra()
})

onUnmounted(() => {
  emit(
    'configurar-barra',
    {
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
      modalActivo: false,
    },
    null,
  )
})
</script>

<style scoped>
.encabezado-pedidos {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}
.titulo-tabla {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-texto-principal);
}
.boton-estadisticas-anuales {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-acento);
  box-shadow: 0 2px 8px var(--sombra-boton);
}
.boton-estadisticas-anuales:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px var(--sombra-boton);
  background: var(--color-fondo);
}
.boton-estadisticas-anuales:active {
  transform: scale(0.95);
}
@media (max-width: 600px) {
  .encabezado-pedidos {
    padding: 0 0.25rem;
  }
  .titulo-tabla {
    font-size: 1.5rem;
  }
  .boton-estadisticas-anuales {
    width: 44px;
    height: 44px;
  }
}
</style>
