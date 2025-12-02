<template>
  <div class="contenedor-pedidos-dia">
    <!-- Título con fecha actual -->
    <h2 class="titulo-tabla">{{ fechaFormateada }}</h2>

    <!-- Tarjeta métrica con icono gamificado -->
    <div class="tarjeta-metrica-dia">
      <div class="icono-metrica">
        <component :is="obtenerIconoContador" :size="32" />
      </div>
      <div class="info-metrica">
        <p class="valor-metrica">{{ pedidosDelDia.length }}</p>
        <p class="label-metrica">{{ textoPedidos }}</p>
      </div>
    </div>

    <!-- Contador de duplicados -->
    <div v-if="cantidadPedidosRepetidos > 0" class="contenedor-repetidos">
      <p class="texto-secundario texto-repetidos">
        Pedidos repetidos: {{ cantidadPedidosRepetidos }}
      </p>
    </div>

    <!-- Tabla de pedidos del día -->
    <div v-if="pedidosDelDia.length > 0" class="contenedor-tabla">
      <table class="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Número de Pedido</th>
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
              <span
                class="globito"
                :class="{ 'texto-duplicado': esPedidoDuplicado(pedido.numero) }"
                :title="pedido.numero"
              >
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
    </div>

    <!-- Mensaje si no hay pedidos -->
    <div v-else class="mensaje-vacio">
      <p class="texto-secundario">No hay pedidos registrados hoy</p>
    </div>

    <!-- Modal editar -->
    <ModalEditarPedido
      v-if="mostrarModalEditar"
      :pedido="pedidoEditar.numero"
      @guardar="guardarEdicion"
      @cerrar="mostrarModalEditar = false"
    />

    <!-- Modal eliminar -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="pedidoEliminar.numero"
      @confirmar="confirmarEliminacion"
      @cerrar="mostrarModalEliminar = false"
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
} from '@tabler/icons-vue'
import { guardarPedidos, obtenerPedidos } from '../../../BaseDeDatos/almacenamiento.js'
import { generarYGuardarExcelTemporal } from '../GeneraExcel.js'
import { compartirArchivo } from '../CompartirExcel.js'
import ModalEditarPedido from 'src/components/Modales/ModalEditarPedido.vue'
import ModalEliminar from 'src/components/Modales/ModalEliminar.vue'

// Emit para configurar la barra inferior
const emit = defineEmits(['configurar-barra'])

// Estado principal
const pedidosDelDia = ref([])
const fechaActual = ref(new Date())

// Estados de modales
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)

// Datos para editar/eliminar
const pedidoEditar = ref({ numero: '', fecha: '' })
const pedidoEliminar = ref({ numero: '', fecha: '' })
const indiceEditar = ref(null)
const indiceEliminar = ref(null)

// Estados de notificaciones
const mensajeExito = ref('')
const mensajeError = ref('')

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

// Computed: Números duplicados
const numerosDuplicados = computed(() => {
  const conteoPorNumero = new Map()
  for (const p of pedidosDelDia.value) {
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
  () => pedidosDelDia.value.filter((p) => esPedidoDuplicado(p.numero)).length,
)

// Función para verificar si es duplicado
function esPedidoDuplicado(numero) {
  return numerosDuplicados.value.has(normalizarNumero(numero))
}

// Computed: Icono gamificado según cantidad
const obtenerIconoContador = computed(() => {
  const esFinde = esFinesDeSemana(fechaActual.value)
  const cantidad = pedidosDelDia.value.length

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

// Computed: Texto dinámico
const textoPedidos = computed(() => {
  const cantidad = pedidosDelDia.value.length
  return cantidad === 1 ? 'pedido registrado hoy' : 'pedidos registrados hoy'
})

// Configuración dinámica de la barra inferior
const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: pedidosDelDia.value.length > 0,
  puedeEnviar: pedidosDelDia.value.length > 0,
  botonesPersonalizados: [],
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

// Métodos de modales
function abrirModalEditar(indice) {
  indiceEditar.value = indice
  pedidoEditar.value = { ...pedidosDelDia.value[indice] }
  mostrarModalEditar.value = true
}

async function guardarEdicion(nuevoNumero) {
  if (indiceEditar.value !== null) {
    const pedidoModificado = pedidoEditar.value
    const todosLosPedidos = await obtenerPedidos()
    const indiceEnListaCompleta = todosLosPedidos.findIndex(
      (p) => p.numero === pedidoModificado.numero && p.fecha === pedidoModificado.fecha,
    )

    if (indiceEnListaCompleta !== -1) {
      todosLosPedidos[indiceEnListaCompleta].numero = nuevoNumero
      await guardarPedidos(todosLosPedidos)
      await cargarPedidosDelDia()
      mensajeExito.value = 'Pedido editado correctamente'
      setTimeout(() => (mensajeExito.value = ''), 3000)
    }
  }
  mostrarModalEditar.value = false
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

// Enviar pedidos del día
async function enviarPedidosDelDia() {
  try {
    const { uri, nombreArchivo } = await generarYGuardarExcelTemporal(pedidosDelDia.value)
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
/* Tarjeta métrica */
.tarjeta-metrica-dia {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.tarjeta-metrica-dia:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--sombra-boton);
}
.icono-metrica {
  background: var(--color-fondo);
  padding: 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--borde-boton);
  color: var(--color-acento);
}
.info-metrica {
  flex: 1;
}
.valor-metrica {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0;
  line-height: 1;
}
.label-metrica {
  font-size: 1rem;
  color: var(--color-texto-secundario);
  margin: 0.5rem 0 0 0;
}
/* Contador de repetidos */
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
/* Mensaje vacío */
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
/* Responsive */
@media (max-width: 768px) {
  .contenedor-pedidos-dia {
    padding: 1rem;
  }
  .tarjeta-metrica-dia {
    padding: 1.25rem;
  }
  .valor-metrica {
    font-size: 2rem;
  }
}
@media (max-width: 480px) {
  .tarjeta-metrica-dia {
    padding: 1rem;
    gap: 0.75rem;
  }
  .icono-metrica {
    padding: 0.75rem;
  }
  .valor-metrica {
    font-size: 1.75rem;
  }
  .label-metrica {
    font-size: 0.9rem;
  }
}
</style>
