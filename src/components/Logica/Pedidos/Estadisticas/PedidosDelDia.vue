<template>
  <div class="contenedor-pedidos-dia">
    <!-- Título con fecha actual -->
    <h2 class="titulo-tabla">{{ fechaFormateada }}</h2>

    <!-- Tarjeta métrica con icono gamificado -->
    <TarjetaEstadistica
      :icono="obtenerIconoContador"
      :valor-principal="cantidadPedidosDelDia"
      texto-principal="Pedidos"
      label-principal="Pedidos y items registrados hoy"
      :valores-secundarios="[
        {
          numero: totalItemsDelDia,
          texto: 'Items',
        },
      ]"
    />

    <!-- Botón para marcar día no trabajado (solo visible si no hay pedidos ni faltas) -->
    <div v-if="pedidosDelDia.length === 0 && !hayFaltaRegistrada" class="contenedor-boton-falta">
      <button class="boton-falta" @click="registrarFalta">
        <IconCalendarMinus :size="20" />
        Día no trabajado
      </button>
    </div>

    <!-- Contador de duplicados -->
    <div v-if="cantidadPedidosRepetidos > 0" class="contenedor-repetidos">
      <p class="texto-secundario texto-repetidos">
        Pedidos repetidos: {{ cantidadPedidosRepetidos }}
      </p>
    </div>

    <!-- Tabla de pedidos del día -->
    <table v-if="pedidosDelDia.length > 0" class="tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Número de Pedido</th>
          <th>Items</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(pedido, indice) in pedidosDelDia"
          :key="indice"
          :class="{
            'fila-duplicada': esPedidoDuplicado(pedido.numero),
          }"
        >
          <td>{{ pedido.fecha }}</td>
          <td>
            <span v-if="pedido.tipo === 'falta'" class="globito" title="Día no trabajado">
              <IconCalendarMinus :size="16" style="margin-right: 0.25rem" />
              {{ pedido.numero === 'FALTA' ? 'Día no trabajado' : pedido.numero }}
            </span>
            <span
              v-else
              class="globito"
              :class="{ 'texto-duplicado': esPedidoDuplicado(pedido.numero) }"
              :title="pedido.numero"
            >
              {{ pedido.numero.slice(0, 15) }}<span v-if="pedido.numero.length > 15">...</span>
            </span>
          </td>
          <td>{{ pedido.tipo === 'falta' ? '-' : pedido.items || '-' }}</td>
          <td class="acciones">
            <IconPencil class="icono-accion icono-editar" @click="abrirModalEditar(indice)" />
            <IconTrash
              class="icono-accion icono-borrar"
              @click="pedido.tipo === 'falta' ? eliminarFalta(indice) : abrirModalEliminar(indice)"
            />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal editar pedido -->
    <ModalEditarPedido
      v-if="mostrarModalEditarPedido"
      :pedido="pedidoEditar.numero"
      :items="pedidoEditar.items"
      @guardar="guardarEdicionPedido"
      @cerrar="mostrarModalEditarPedido = false"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- Modal editar falta -->
    <ModalEditarFalta
      v-if="mostrarModalEditarFalta"
      :observacion="pedidoEditar.numero"
      :fecha="pedidoEditar.fecha"
      @guardar="guardarEdicionFalta"
      @cerrar="mostrarModalEditarFalta = false"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- Modal eliminar pedido -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="pedidoEliminar.numero"
      @confirmar="confirmarEliminacion"
      @cerrar="mostrarModalEliminar = false"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import {
  IconPencil,
  IconTrash,
  IconCalendarEvent,
  IconThumbUp,
  IconFlame,
  IconBolt,
  IconTornado,
  IconDiamond,
  IconCalendarMinus,
} from '@tabler/icons-vue'
import { guardarPedidos, obtenerPedidos } from '../../../BaseDeDatos/almacenamiento.js'
import { generarYGuardarExcelTemporal } from '../GeneraExcel.js'
import { compartirArchivo } from '../CompartirExcel.js'
import ModalEditarPedido from 'src/components/Modales/ModalEditarPedido.vue'
import ModalEditarFalta from 'src/components/Modales/ModalEditarFalta.vue'
import ModalEliminar from 'src/components/Modales/ModalEliminar.vue'
import TarjetaEstadistica from './TarjetaEstadistica.vue'

// Emit para configurar la barra inferior
const emit = defineEmits(['configurar-barra', 'modal-abierto', 'modal-cerrado'])

// Estado principal
const pedidosDelDia = ref([])
const fechaActual = ref(new Date())

// Estados de modales
const mostrarModalEditarPedido = ref(false)
const mostrarModalEditarFalta = ref(false)
const mostrarModalEliminar = ref(false)

// Estado para controlar si algún modal está activo
const modalActivo = ref(false)

// Datos para editar/eliminar
const pedidoEditar = ref({ numero: '', fecha: '', tipo: '' })
const pedidoEliminar = ref({ numero: '', fecha: '' })
const indiceEditar = ref(null)
const indiceEliminar = ref(null)

// Estados de notificaciones
const mensajeExito = ref('')
const mensajeError = ref('')

// Métodos para manejar el estado del modal
const manejarModalAbierto = () => {
  modalActivo.value = true
  emit('modal-abierto')
}

const manejarModalCerrado = () => {
  modalActivo.value = false
  emit('modal-cerrado')
}

// Función para verificar si es fin de semana
function esFinesDeSemana(fecha) {
  const dia = fecha.getDay()
  return dia === 0 || dia === 6
}

// Función para formatear fecha del día actual
const fechaFormateada = computed(() => {
  const opciones = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return fechaActual.value.toLocaleDateString('es-ES', opciones)
})

// Función para formatear fecha a DD/MM/YYYY
function formatearFechaHoy(fecha) {
  const dia = fecha.getDate().toString().padStart(2, '0')
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
  const anio = fecha.getFullYear()
  return `${dia}/${mes}/${anio}`
}

// Función para normalizar números
function normalizarNumero(numero) {
  return String(numero ?? '').trim()
}

// Computed: Cantidad de pedidos del día (sin faltas)
const cantidadPedidosDelDia = computed(() => {
  return pedidosDelDia.value.filter((p) => p.tipo !== 'falta').length
})

// Computed: Total de items del día (sin faltas)
const totalItemsDelDia = computed(() => {
  return pedidosDelDia.value
    .filter((p) => p.tipo !== 'falta')
    .reduce((suma, pedido) => suma + (pedido.items || 1), 0)
})

// Computed: Números duplicados (excluyendo faltas)
const numerosDuplicados = computed(() => {
  const pedidosNormales = pedidosDelDia.value.filter((p) => p.tipo !== 'falta')
  const conteoPorNumero = new Map()
  for (const p of pedidosNormales) {
    const n = normalizarNumero(p.numero)
    conteoPorNumero.set(n, (conteoPorNumero.get(n) || 0) + 1)
  }
  const duplicados = new Set()
  for (const [n, c] of conteoPorNumero.entries()) {
    if (n !== '' && c > 1) duplicados.add(n)
  }
  return duplicados
})

// Computed: Cantidad de pedidos repetidos
const cantidadPedidosRepetidos = computed(
  () => pedidosDelDia.value.filter((p) => p.tipo !== 'falta' && esPedidoDuplicado(p.numero)).length,
)

// Función para verificar si es duplicado
function esPedidoDuplicado(numero) {
  return numerosDuplicados.value.has(normalizarNumero(numero))
}

// Computed: Icono gamificado según cantidad (sin contar faltas)
const obtenerIconoContador = computed(() => {
  const esFinde = esFinesDeSemana(fechaActual.value)
  const cantidad = cantidadPedidosDelDia.value

  if (cantidad === 0) return IconCalendarEvent

  if (esFinde) {
    if (cantidad >= 50) return IconDiamond
    if (cantidad >= 40) return IconTornado
    if (cantidad >= 30) return IconBolt
    if (cantidad >= 20) return IconFlame
    return IconThumbUp
  }

  if (cantidad >= 50) return IconDiamond
  if (cantidad >= 40) return IconTornado
  if (cantidad >= 30) return IconBolt
  if (cantidad >= 20) return IconFlame
  if (cantidad >= 10) return IconThumbUp

  return IconCalendarEvent
})

// Computed: Verificar si hay falta registrada
const hayFaltaRegistrada = computed(() => {
  return pedidosDelDia.value.some((p) => p.tipo === 'falta')
})

// Configuración dinámica de la barra inferior
const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: pedidosDelDia.value.some((p) => p.tipo !== 'falta'),
  puedeEnviar: pedidosDelDia.value.some((p) => p.tipo !== 'falta'),
  botonesPersonalizados: [],
  modalActivo: modalActivo.value,
}))

// Métodos que la barra inferior va a llamar
const metodosParaBarra = {
  onAgregar: () => {},
  onEnviar: () => {
    enviarPedidosDelDia()
  },
  onAccionPersonalizada: () => {},
}

// Función para actualizar la configuración de la barra
const actualizarConfiguracionBarra = () => {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

// Watchers para actualizar la barra cuando cambien los datos
watch(
  () => pedidosDelDia.value.length,
  () => {
    actualizarConfiguracionBarra()
  },
  { deep: true },
)

watch(
  () => modalActivo.value,
  () => {
    actualizarConfiguracionBarra()
  },
)

// Cargar pedidos del día
async function cargarPedidosDelDia() {
  try {
    const todosLosPedidos = await obtenerPedidos()
    const fechaHoyFormateada = formatearFechaHoy(fechaActual.value)

    pedidosDelDia.value = todosLosPedidos
      .filter((pedido) => pedido.fecha === fechaHoyFormateada)
      .reverse()
  } catch (error) {
    console.error('Error al cargar pedidos del día:', error)
    pedidosDelDia.value = []
  }
}

// Registrar día no trabajado
async function registrarFalta() {
  try {
    const fechaHoyFormateada = formatearFechaHoy(fechaActual.value)
    const todosLosPedidos = await obtenerPedidos()

    todosLosPedidos.push({
      numero: 'FALTA',
      fecha: fechaHoyFormateada,
      tipo: 'falta',
    })

    await guardarPedidos(todosLosPedidos)
    await cargarPedidosDelDia()
    actualizarConfiguracionBarra()
  } catch (error) {
    console.error('Error al registrar falta:', error)
  }
}

// Eliminar falta
async function eliminarFalta(indice) {
  try {
    const faltaAEliminar = pedidosDelDia.value[indice]
    let todosLosPedidos = await obtenerPedidos()

    const indiceEnListaCompleta = todosLosPedidos.findIndex(
      (p) => p.tipo === 'falta' && p.fecha === faltaAEliminar.fecha,
    )

    if (indiceEnListaCompleta !== -1) {
      todosLosPedidos.splice(indiceEnListaCompleta, 1)
      await guardarPedidos(todosLosPedidos)
      await cargarPedidosDelDia()
      actualizarConfiguracionBarra()
    }
  } catch (error) {
    console.error('Error al eliminar falta:', error)
  }
}

// Métodos de modales
function abrirModalEditar(indice) {
  const pedido = pedidosDelDia.value[indice]
  indiceEditar.value = indice
  pedidoEditar.value = { ...pedido }

  if (pedido.tipo === 'falta') {
    mostrarModalEditarFalta.value = true
  } else {
    mostrarModalEditarPedido.value = true
  }
}

async function guardarEdicionPedido(datosEditados) {
  if (indiceEditar.value !== null) {
    const pedidoModificado = pedidoEditar.value
    const todosLosPedidos = await obtenerPedidos()
    const indiceEnListaCompleta = todosLosPedidos.findIndex(
      (p) => p.numero === pedidoModificado.numero && p.fecha === pedidoModificado.fecha,
    )

    if (indiceEnListaCompleta !== -1) {
      todosLosPedidos[indiceEnListaCompleta].numero = datosEditados.numero
      todosLosPedidos[indiceEnListaCompleta].items = datosEditados.items
      await guardarPedidos(todosLosPedidos)
      await cargarPedidosDelDia()
      mensajeExito.value = 'Pedido editado correctamente'
      setTimeout(() => (mensajeExito.value = ''), 3000)
    }
  }
  mostrarModalEditarPedido.value = false
  actualizarConfiguracionBarra()
}

async function guardarEdicionFalta(datos) {
  if (indiceEditar.value !== null) {
    const todosLosPedidos = await obtenerPedidos()
    const indiceEnListaCompleta = todosLosPedidos.findIndex(
      (p) => p.fecha === datos.fechaOriginal && p.tipo === 'falta',
    )

    if (indiceEnListaCompleta !== -1) {
      todosLosPedidos[indiceEnListaCompleta].numero = datos.observacion
      todosLosPedidos[indiceEnListaCompleta].fecha = datos.fecha
      await guardarPedidos(todosLosPedidos)
      await cargarPedidosDelDia()
      mensajeExito.value = 'Observación editada correctamente'
      setTimeout(() => (mensajeExito.value = ''), 3000)
    }
  }
  mostrarModalEditarFalta.value = false
  actualizarConfiguracionBarra()
}

function abrirModalEliminar(indice) {
  indiceEliminar.value = indice
  pedidoEliminar.value = { ...pedidosDelDia.value[indice] }
  mostrarModalEliminar.value = true
}

async function confirmarEliminacion() {
  if (indiceEliminar.value !== null) {
    const pedidoAEliminar = pedidosDelDia.value[indiceEliminar.value]
    let todosLosPedidos = await obtenerPedidos()

    const indiceEnListaCompleta = todosLosPedidos.findIndex(
      (p) => p.numero === pedidoAEliminar.numero && p.fecha === pedidoAEliminar.fecha,
    )

    if (indiceEnListaCompleta !== -1) {
      todosLosPedidos.splice(indiceEnListaCompleta, 1)
      await guardarPedidos(todosLosPedidos)
      await cargarPedidosDelDia()
      mensajeExito.value = 'Pedido eliminado correctamente'
      setTimeout(() => (mensajeExito.value = ''), 3000)
    }
  }
  mostrarModalEliminar.value = false
  actualizarConfiguracionBarra()
}

// Enviar pedidos del día (solo pedidos normales, no faltas)
async function enviarPedidosDelDia() {
  try {
    const pedidosNormales = pedidosDelDia.value.filter((p) => p.tipo !== 'falta')
    const { uri, nombreArchivo } = await generarYGuardarExcelTemporal(pedidosNormales)
    if (!uri) throw new Error('No se generó el archivo correctamente.')
    await compartirArchivo(uri, nombreArchivo)
    mensajeExito.value = 'Archivo generado y enviado correctamente'
    setTimeout(() => (mensajeExito.value = ''), 3000)
  } catch (error) {
    console.error('Error al enviar el archivo:', error)
    mensajeError.value = 'Error al preparar o enviar el archivo'
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Ciclo de vida
onMounted(async () => {
  await cargarPedidosDelDia()
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
.contenedor-pedidos-dia {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
.titulo-tabla {
  &::first-letter {
    text-transform: uppercase;
  }
}
.contenedor-pedidos-dia :deep(.tarjeta-metrica) {
  margin-bottom: 1.5rem;
}
.contenedor-boton-falta {
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}
.boton-falta {
  background: var(--color-falta);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}
.boton-falta:hover {
  background: var(--color-falta-claro);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
}
.boton-falta:active {
  transform: translateY(0);
}
.contenedor-repetidos {
  background: var(--color-superficie);
  border: 1px solid var(--color-error);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
}
.texto-repetidos {
  color: var(--color-error);
  font-weight: 600;
  margin: 0;
  text-align: center;
}
.mensaje-vacio {
  text-align: center;
  padding: 3rem 1rem;
}
.texto-secundario {
  color: var(--color-texto-secundario);
  font-size: 1rem;
}
.mensaje-error {
  background: var(--color-error);
  color: white;
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
@media (max-width: 768px) {
  .contenedor-pedidos-dia {
    padding: 1rem;
  }
  .boton-falta {
    padding: 0.875rem 1.25rem;
    font-size: 0.95rem;
  }
}
@media (max-width: 480px) {
  .boton-falta {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
