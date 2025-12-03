<template>
  <div class="contenedor-resumen-anual">
    <!-- Título con año actual -->
    <h2 class="titulo-tabla">Resumen del año {{ anioActual }}</h2>

    <!-- Grid de métricas -->
    <div class="contenedor-metricas">
      <!-- Tarjeta 1: Total de pedidos del año -->
      <div class="tarjeta-metrica">
        <div class="icono-metrica">
          <IconPackage :size="24" />
        </div>
        <div class="info-metrica">
          <p class="valor-metrica">{{ estadisticasAnuales.totalPedidos }}</p>
          <p class="label-metrica">Total de pedidos del año</p>
        </div>
      </div>

      <!-- Tarjeta 2: Meses y días trabajados -->
      <div class="tarjeta-metrica">
        <div class="icono-metrica">
          <IconCalendarCheck :size="24" />
        </div>
        <div class="info-metrica">
          <p class="valor-metrica">{{ estadisticasAnuales.mesesTrabajados }}</p>
          <p class="label-metrica">Meses trabajados</p>
          <p class="valor-secundario">{{ estadisticasAnuales.diasTrabajados }} días</p>
        </div>
      </div>

      <!-- Tarjeta 3: Promedio por mes -->
      <div class="tarjeta-metrica">
        <div class="icono-metrica">
          <IconChartLine :size="24" />
        </div>
        <div class="info-metrica">
          <p class="valor-metrica">{{ estadisticasAnuales.promedioPorMes }}</p>
          <p class="label-metrica">Promedio por mes</p>
        </div>
      </div>

      <!-- Tarjeta 4: Mejor mes del año -->
      <div class="tarjeta-metrica">
        <div class="icono-metrica">
          <IconTrophy :size="24" />
        </div>
        <div class="info-metrica">
          <p class="valor-metrica">{{ estadisticasAnuales.mejorMesCantidad }}</p>
          <p class="label-metrica">Mejor mes: {{ estadisticasAnuales.mejorMesNombre }}</p>
          <p class="valor-secundario">Mejor día: {{ estadisticasAnuales.mejorDiaDelMejorMes }}</p>
        </div>
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
import { IconPackage, IconCalendarCheck, IconChartLine, IconTrophy } from '@tabler/icons-vue'
import { obtenerPedidos } from '../../../BaseDeDatos/almacenamiento.js'

// Estado principal
const anioActual = ref(new Date().getFullYear())
const estadisticasAnuales = ref({
  totalPedidos: 0,
  mesesTrabajados: 0,
  diasTrabajados: 0,
  promedioPorMes: '0',
  mejorMesNombre: '-',
  mejorMesCantidad: 0,
  mejorDiaDelMejorMes: '-',
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

    // Filtrar pedidos del año actual
    const pedidosDelAnio = todosLosPedidos.filter((pedido) => {
      const fecha = parsearFechaDDMMYYYY(pedido.fecha)
      return fecha && fecha.getUTCFullYear() === anioActual.value
    })

    // Total de pedidos
    const totalPedidos = pedidosDelAnio.length

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

    // Promedio por mes
    let promedioPorMes = '0'
    if (mesesTrabajados > 0) {
      const promedio = totalPedidos / mesesTrabajados
      promedioPorMes = Math.ceil(promedio).toString()
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
            cantidad: 0,
            pedidos: [],
          }
        }
        conteoPorMes[claveMes].cantidad++
        conteoPorMes[claveMes].pedidos.push(pedido)
      }
    })

    // Encontrar mejor mes
    let mejorMesNombre = '-'
    let mejorMesCantidad = 0
    let mejorDiaDelMejorMes = '-'

    for (const clave in conteoPorMes) {
      const datos = conteoPorMes[clave]
      if (datos.cantidad > mejorMesCantidad) {
        mejorMesCantidad = datos.cantidad
        mejorMesNombre = obtenerNombreMes(datos.mes)

        // Encontrar mejor día dentro de ese mes
        const conteoPorDia = {}
        datos.pedidos.forEach((pedido) => {
          const fecha = pedido.fecha
          conteoPorDia[fecha] = (conteoPorDia[fecha] || 0) + 1
        })

        let mejorDiaCantidad = 0
        for (const [fecha, cantidad] of Object.entries(conteoPorDia)) {
          if (cantidad > mejorDiaCantidad) {
            mejorDiaCantidad = cantidad
            mejorDiaDelMejorMes = fecha
          }
        }
      }
    }

    // Actualizar estado
    estadisticasAnuales.value = {
      totalPedidos,
      mesesTrabajados,
      diasTrabajados,
      promedioPorMes,
      mejorMesNombre,
      mejorMesCantidad,
      mejorDiaDelMejorMes,
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
.tarjeta-metrica {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.tarjeta-metrica:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--sombra-boton);
}
.icono-metrica {
  background: var(--color-fondo);
  padding: 0.75rem;
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
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0;
  line-height: 1;
}
.label-metrica {
  font-size: 0.875rem;
  color: var(--color-texto-secundario);
  margin: 0.25rem 0 0 0;
}
.valor-secundario {
  font-size: 0.875rem;
  color: var(--color-acento);
  margin: 0.5rem 0 0 0;
  font-weight: 600;
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
  .tarjeta-metrica {
    padding: 1.25rem;
  }
  .valor-metrica {
    font-size: 1.75rem;
  }
}
@media (max-width: 480px) {
  .tarjeta-metrica {
    padding: 1rem;
    gap: 0.875rem;
  }
  .icono-metrica {
    padding: 0.625rem;
  }
  .valor-metrica {
    font-size: 1.5rem;
  }
  .label-metrica {
    font-size: 0.8rem;
  }
  .valor-secundario {
    font-size: 0.8rem;
  }
}
</style>
