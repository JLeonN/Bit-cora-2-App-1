<template>
  <div class="contenedor-resumen-anual">
    <!-- Título con año actual -->
    <h2 class="titulo-tabla">Resumen del año {{ anioActual }}</h2>

    <!-- Grid de métricas -->
    <div class="contenedor-metricas">
      <!-- Tarjeta 1: Total de pedidos + items del año -->
      <TarjetaEstadistica
        :icono="IconPackage"
        :valor-principal="estadisticasAnuales.totalPedidos"
        label-principal="Total de pedidos del año"
        :valores-secundarios="[`${estadisticasAnuales.totalItems} Items`]"
      />

      <!-- Tarjeta 2: Meses y días trabajados -->
      <TarjetaEstadistica
        :icono="IconCalendarCheck"
        :valor-principal="estadisticasAnuales.mesesTrabajados"
        label-principal="Meses trabajados"
        :valores-secundarios="[`${estadisticasAnuales.diasTrabajados} Días`]"
      />

      <!-- Tarjeta 3: Mejores días -->
      <TarjetaEstadistica
        :icono="IconTrophy"
        :valor-principal="[
          `Pedidos: ${estadisticasAnuales.mejorDiaFechaPedidos} (${estadisticasAnuales.mejorDiaCantidadPedidos})`,
          `Items: ${estadisticasAnuales.mejorDiaFechaItems} (${estadisticasAnuales.mejorDiaCantidadItems})`,
        ]"
        label-principal="Mejores días del año"
      />

      <!-- Tarjeta 4: Promedios -->
      <TarjetaEstadistica
        :icono="IconChartLine"
        :valor-principal="[
          `${estadisticasAnuales.promedioPedidosPorMes} Pedidos por mes`,
          `${estadisticasAnuales.promedioItemsPorMes} Items por mes`,
          `${estadisticasAnuales.promedioItemsPorPedido} Items por pedido`,
        ]"
        label-principal="Promedios del año"
      />

      <!-- Tarjeta 5: Mejor mes del año (destacada) -->
      <div class="tarjeta-completa">
        <TarjetaEstadistica
          :icono="IconAward"
          :valor-principal="estadisticasAnuales.mejorMesCantidadPedidos"
          :label-principal="`Mejor mes: ${estadisticasAnuales.mejorMesNombre}`"
          :valores-secundarios="[`${estadisticasAnuales.mejorMesCantidadItems} Items totales`]"
          :destacada="true"
        />
      </div>
    </div>

    <!-- Mensaje si no hay pedidos -->
    <div v-if="estadisticasAnuales.totalPedidos === 0" class="mensaje-vacio">
      <p class="texto-secundario">No hay pedidos registrados en {{ anioActual }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  IconPackage,
  IconCalendarCheck,
  IconChartLine,
  IconTrophy,
  IconAward,
} from '@tabler/icons-vue'
import { obtenerPedidos } from '../../../BaseDeDatos/almacenamiento.js'
import TarjetaEstadistica from './TarjetaEstadistica.vue'

// Estado principal
const anioActual = ref(new Date().getFullYear())
const estadisticasAnuales = ref({
  totalPedidos: 0,
  totalItems: 0,
  mesesTrabajados: 0,
  diasTrabajados: 0,
  promedioPedidosPorMes: '0',
  promedioItemsPorMes: '0',
  promedioItemsPorPedido: '0',
  mejorDiaFechaPedidos: '-',
  mejorDiaCantidadPedidos: 0,
  mejorDiaFechaItems: '-',
  mejorDiaCantidadItems: 0,
  mejorMesNombre: '-',
  mejorMesCantidadPedidos: 0,
  mejorMesCantidadItems: 0,
})

// Función para parsear fechas DD/MM/YYYY
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

// Función para obtener nombre del mes
function obtenerNombreMes(numeroMes) {
  const nombresMeses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  return nombresMeses[numeroMes] || 'Mes inválido'
}

// Calcular estadísticas del año
async function calcularEstadisticasAnuales() {
  try {
    const todosLosPedidos = await obtenerPedidos()

    // Filtrar pedidos del año actual (sin faltas)
    const pedidosDelAnio = todosLosPedidos.filter((pedido) => {
      const fecha = parsearFechaDDMMYYYY(pedido.fecha)
      return fecha && fecha.getUTCFullYear() === anioActual.value && pedido.tipo !== 'falta'
    })

    // Total de pedidos
    const totalPedidos = pedidosDelAnio.length

    // Total de items
    const totalItems = pedidosDelAnio.reduce((suma, pedido) => suma + (pedido.items || 1), 0)

    // Días únicos trabajados
    const diasUnicos = new Set()
    pedidosDelAnio.forEach((pedido) => {
      const fecha = parsearFechaDDMMYYYY(pedido.fecha)
      if (fecha) {
        const claveDia = `${fecha.getUTCDate()}-${fecha.getUTCMonth()}-${fecha.getUTCFullYear()}`
        diasUnicos.add(claveDia)
      }
    })
    const diasTrabajados = diasUnicos.size

    // Meses únicos trabajados
    const mesesUnicos = new Set()
    pedidosDelAnio.forEach((pedido) => {
      const fecha = parsearFechaDDMMYYYY(pedido.fecha)
      if (fecha) {
        const claveMes = `${fecha.getUTCMonth()}-${fecha.getUTCFullYear()}`
        mesesUnicos.add(claveMes)
      }
    })
    const mesesTrabajados = mesesUnicos.size

    // Promedio de pedidos por mes
    let promedioPedidosPorMes = '0'
    if (mesesTrabajados > 0) {
      const promedio = totalPedidos / mesesTrabajados
      promedioPedidosPorMes = Math.ceil(promedio).toString()
    }

    // Promedio de items por mes
    let promedioItemsPorMes = '0'
    if (mesesTrabajados > 0) {
      const promedio = totalItems / mesesTrabajados
      promedioItemsPorMes = Math.ceil(promedio).toString()
    }

    // Promedio de items por pedido
    let promedioItemsPorPedido = '0'
    if (totalPedidos > 0) {
      const promedio = totalItems / totalPedidos
      promedioItemsPorPedido = promedio.toFixed(1)
    }

    // Mejor día por pedidos
    const conteoPorDiaPedidos = {}
    pedidosDelAnio.forEach((pedido) => {
      const fecha = pedido.fecha
      conteoPorDiaPedidos[fecha] = (conteoPorDiaPedidos[fecha] || 0) + 1
    })

    let mejorDiaFechaPedidos = '-'
    let mejorDiaCantidadPedidos = 0

    for (const [fecha, cantidad] of Object.entries(conteoPorDiaPedidos)) {
      if (cantidad > mejorDiaCantidadPedidos) {
        mejorDiaCantidadPedidos = cantidad
        mejorDiaFechaPedidos = fecha
      }
    }

    // Mejor día por items
    const conteoPorDiaItems = {}
    pedidosDelAnio.forEach((pedido) => {
      const fecha = pedido.fecha
      const items = pedido.items || 1
      conteoPorDiaItems[fecha] = (conteoPorDiaItems[fecha] || 0) + items
    })

    let mejorDiaFechaItems = '-'
    let mejorDiaCantidadItems = 0

    for (const [fecha, cantidad] of Object.entries(conteoPorDiaItems)) {
      if (cantidad > mejorDiaCantidadItems) {
        mejorDiaCantidadItems = cantidad
        mejorDiaFechaItems = fecha
      }
    }

    // Agrupar por mes para encontrar el mejor
    const conteoPorMes = {}
    pedidosDelAnio.forEach((pedido) => {
      const fecha = parsearFechaDDMMYYYY(pedido.fecha)
      if (fecha) {
        const mes = fecha.getUTCMonth()
        const anio = fecha.getUTCFullYear()
        const claveMes = `${mes}-${anio}`

        if (!conteoPorMes[claveMes]) {
          conteoPorMes[claveMes] = {
            mes,
            cantidadPedidos: 0,
            cantidadItems: 0,
          }
        }
        conteoPorMes[claveMes].cantidadPedidos++
        conteoPorMes[claveMes].cantidadItems += pedido.items || 1
      }
    })

    // Encontrar mejor mes por pedidos
    let mejorMesNombre = '-'
    let mejorMesCantidadPedidos = 0
    let mejorMesCantidadItems = 0

    for (const clave in conteoPorMes) {
      const datos = conteoPorMes[clave]
      if (datos.cantidadPedidos > mejorMesCantidadPedidos) {
        mejorMesCantidadPedidos = datos.cantidadPedidos
        mejorMesCantidadItems = datos.cantidadItems
        mejorMesNombre = obtenerNombreMes(datos.mes)
      }
    }

    // Actualizar estado
    estadisticasAnuales.value = {
      totalPedidos,
      totalItems,
      mesesTrabajados,
      diasTrabajados,
      promedioPedidosPorMes,
      promedioItemsPorMes,
      promedioItemsPorPedido,
      mejorDiaFechaPedidos,
      mejorDiaCantidadPedidos,
      mejorDiaFechaItems,
      mejorDiaCantidadItems,
      mejorMesNombre,
      mejorMesCantidadPedidos,
      mejorMesCantidadItems,
    }
  } catch (error) {
    console.error('Error al calcular estadísticas anuales:', error)
  }
}

// Ciclo de vida
onMounted(() => {
  calcularEstadisticasAnuales()
})
</script>

<style scoped>
.contenedor-resumen-anual {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
/* Grid de métricas */
.contenedor-metricas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
/* Tarjeta completa ancho */
.tarjeta-completa {
  grid-column: 1 / -1;
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
/* Responsive */
@media (max-width: 768px) {
  .contenedor-resumen-anual {
    padding: 1rem;
  }
  .contenedor-metricas {
    grid-template-columns: 1fr;
    gap: 0.875rem;
  }
}
</style>
