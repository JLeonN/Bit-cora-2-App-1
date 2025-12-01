<template>
  <div class="contenedor-tabla">
    <!-- Título -->
    <div class="encabezado-pedidos">
      <h2 class="titulo-tabla">Pedidos de{{ etiquetaMes }}</h2>
    </div>

    <!-- Componente de estadísticas -->
    <ResumenMensual
      v-if="mostrarEstadisticas"
      :total-pedidos="estadisticas.totalPedidos"
      :dias-trabajados="estadisticas.diasTrabajados"
      :promedio-por-dia="estadisticas.promedioPorDia"
      :mejor-dia-fecha="estadisticas.mejorDiaFecha"
      :mejor-dia-cantidad="estadisticas.mejorDiaCantidad"
    />

    <!-- Pedidos repetidos -->
    <div v-if="cantidadPedidosRepetidos > 0" class="contenedor-repetidos">
      <p class="texto-secundario texto-repetidos">
        Pedidos repetidos: {{ cantidadPedidosRepetidos }}
      </p>
    </div>

    <!-- Tabla -->
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
          v-for="(pedido, indice) in pedidosRealizados"
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

    <!-- Mensajes de notificación -->
    <div v-if="mensajeExito" class="mensaje-exito">{{ mensajeExito }}</div>
    <div v-if="mensajeError" class="mensaje-error">{{ mensajeError }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import { guardarPedidos, obtenerPedidos } from '../../BaseDeDatos/almacenamiento.js'
import { generarYGuardarExcelParaDescarga } from './ExportarPedidosExcel.js'
import { generarYGuardarExcelTemporal } from './GeneraExcel.js'
import { compartirArchivo } from 'src/components/Logica/Pedidos/CompartirExcel.js'
import ModalEditarPedido from 'src/components/Modales/ModalEditarPedido.vue'
import ModalEliminar from 'src/components/Modales/ModalEliminar.vue'
import ResumenMensual from './Estadisticas/ResumenMensual.vue'

// Emit para configurar la barra inferior
const emit = defineEmits(['configurar-barra'])

const route = useRoute()

// Estado principal
const pedidosRealizados = ref([])
const mostrarEstadisticas = ref(false)

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

// Funciones utilitarias
function normalizarNumero(numero) {
  return String(numero ?? '').trim()
}

function esPedidoDuplicado(numero) {
  return numerosDuplicados.value.has(normalizarNumero(numero))
}

// Función para parsear fechas
function parsearFechaDDMMYYYY(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return null
  const partes = fechaStr.split('/')
  if (partes.length !== 3) return null

  const [dia, mes, anio] = partes.map(Number)
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

// Computed: Calcular estadísticas
const estadisticas = computed(() => {
  const pedidos = pedidosRealizados.value

  // Total de pedidos
  const totalPedidos = pedidos.length

  // Días trabajados (días únicos con al menos 1 pedido)
  const diasUnicos = new Set()
  pedidos.forEach((pedido) => {
    const fecha = parsearFechaDDMMYYYY(pedido.fecha)
    if (fecha) {
      const claveDia = `${fecha.getUTCDate()}-${fecha.getUTCMonth()}-${fecha.getUTCFullYear()}`
      diasUnicos.add(claveDia)
    }
  })

  const diasTrabajados = diasUnicos.size

  // Promedio por día trabajado
  let promedioPorDia = '0'
  if (diasTrabajados > 0) {
    const promedio = totalPedidos / diasTrabajados
    promedioPorDia = Math.ceil(promedio).toString()
  }

  // Mejor día del mes (toma el primero si hay empate)
  const conteoPorDia = {}
  pedidos.forEach((pedido) => {
    const fecha = pedido.fecha
    conteoPorDia[fecha] = (conteoPorDia[fecha] || 0) + 1
  })

  let mejorDiaFecha = '-'
  let mejorDiaCantidad = 0

  for (const [fecha, cantidad] of Object.entries(conteoPorDia)) {
    if (cantidad > mejorDiaCantidad) {
      // Solo cambia si es MAYOR (no igual)
      mejorDiaCantidad = cantidad
      mejorDiaFecha = fecha
    }
  }

  return {
    totalPedidos,
    diasTrabajados,
    promedioPorDia,
    mejorDiaFecha,
    mejorDiaCantidad,
  }
})

// Computed properties
const numerosDuplicados = computed(() => {
  const conteoPorNumero = new Map()
  for (const p of pedidosRealizados.value) {
    const n = normalizarNumero(p.numero)
    conteoPorNumero.set(n, (conteoPorNumero.get(n) || 0) + 1)
  }
  const duplicados = new Set()
  for (const [n, c] of conteoPorNumero.entries()) {
    if (n !== '' && c > 1) duplicados.add(n)
  }
  return duplicados
})

const cantidadPedidosRepetidos = computed(
  () => pedidosRealizados.value.filter((p) => esPedidoDuplicado(p.numero)).length,
)

const etiquetaMes = computed(() => {
  const { inicio, fin } = route.query
  if (inicio && fin) {
    const partes = String(inicio).split('-')
    if (partes.length >= 2) {
      const anio = partes[0]
      const mes = parseInt(partes[1], 10)
      const nombresMes = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ]
      if (mes >= 1 && mes <= 12) {
        return ` ${nombresMes[mes - 1]} ${anio}`
      }
    }
  }
  return ''
})

// Configuración dinámica de la barra inferior
const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: pedidosRealizados.value.length > 0,
  puedeEnviar: pedidosRealizados.value.length > 0,
  botonesPersonalizados: [],
}))

// Métodos que la barra inferior va a llamar
const metodosParaBarra = {
  onAgregar: () => {},
  onEnviar: () => {
    enviarPedidos()
  },
  onAccionPersonalizada: (accion) => {
    if (accion === 'descargar') {
      descargarPedidos()
    }
  },
}

// Función para actualizar la configuración de la barra
const actualizarConfiguracionBarra = () => {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

// Watchers para actualizar la barra cuando cambien los datos
watch(
  () => pedidosRealizados.value.length,
  () => {
    actualizarConfiguracionBarra()
  },
  { deep: true },
)

// Métodos de modales
function abrirModalEditar(indice) {
  indiceEditar.value = indice
  pedidoEditar.value = { ...pedidosRealizados.value[indice] }
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
      pedidosRealizados.value[indiceEditar.value].numero = nuevoNumero
    }
  }
  mostrarModalEditar.value = false
  actualizarConfiguracionBarra()
}

function abrirModalEliminar(indice) {
  indiceEliminar.value = indice
  pedidoEliminar.value = { ...pedidosRealizados.value[indice] }
  mostrarModalEliminar.value = true
}

async function confirmarEliminacion() {
  if (indiceEliminar.value !== null) {
    const pedidoAEliminar = pedidosRealizados.value[indiceEliminar.value]
    let todosLosPedidos = await obtenerPedidos()

    const indiceEnListaCompleta = todosLosPedidos.findIndex(
      (p) => p.numero === pedidoAEliminar.numero && p.fecha === pedidoAEliminar.fecha,
    )

    if (indiceEnListaCompleta !== -1) {
      todosLosPedidos.splice(indiceEnListaCompleta, 1)
      await guardarPedidos(todosLosPedidos)
    }

    pedidosRealizados.value.splice(indiceEliminar.value, 1)
  }
  mostrarModalEliminar.value = false
  actualizarConfiguracionBarra()
}

// Métodos para descargar y enviar
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

async function enviarPedidos() {
  try {
    const { uri, nombreArchivo } = await generarYGuardarExcelTemporal(pedidosRealizados.value)
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
  let datos = await obtenerPedidos()

  const { inicio, fin } = route.query

  if (inicio && fin) {
    const fechaInicio = new Date(inicio)
    const fechaFin = new Date(fin)

    mostrarEstadisticas.value = true

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
