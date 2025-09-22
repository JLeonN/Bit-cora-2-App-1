<template>
  <div class="contenedor-historial">
    <h2 class="titulo-historial">Historial de pedidos</h2>

    <!-- Itera sobre los meses/años agrupados y los muestra -->
    <div
      v-for="(rango, indice) in historialDeRangos"
      :key="indice"
      class="tarjeta-rango"
      @click="verDetalleRango(rango)"
    >
      <div class="info-rango">
        <p class="texto-rango">
          <!-- Solo el mes y año -->
          {{ obtenerNombreMes(rango.mes) }} {{ rango.anio }}
        </p>
        <!-- Botón de enviar -->
        <span v-if="!rango.enviado" @click.stop="enviarRango(rango)" class="boton-enviar">
          <IconoEnviar size="20" /> Enviar
        </span>
      </div>
    </div>

    <!-- Mensaje que se muestra si no hay pedidos -->
    <p v-if="historialDeRangos.length === 0" class="texto-secundario" style="text-align: center">
      No hay pedidos aún.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconSend } from '@tabler/icons-vue'
import { obtenerPedidos, guardarFechaUltimoEnvio } from '../../BaseDeDatos/almacenamiento.js'
import { generarYGuardarExcelTemporal } from './GeneraExcel.js'
import { compartirArchivo } from 'src/components/Logica/Pedidos/CompartirExcel.js'

const router = useRouter()
const IconoEnviar = IconSend
const historialDeRangos = ref([])

/* Convierte "DD/MM/YYYY" en un objeto Date válido */
function parsearFechaDDMMYYYY(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return null
  const partes = fechaStr.split('/')
  if (partes.length !== 3) return null

  const [dia, mes, anio] = partes.map(Number)
  // CAMBIO: Se ajusta la creación de la fecha para asegurar que sea en UTC y evitar problemas de zona horaria.
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

/* Devuelve el nombre del mes */
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

/* Historial agrupando por MES y AÑO */
async function cargarHistorial() {
  const pedidos = await obtenerPedidos()

  if (!pedidos || pedidos.length === 0) {
    historialDeRangos.value = []
    return
  }

  // Ordena por fecha
  pedidos.sort((a, b) => {
    const fechaA = parsearFechaDDMMYYYY(a.fecha)
    const fechaB = parsearFechaDDMMYYYY(b.fecha)
    if (!fechaA || !fechaB) return 0
    return fechaA.getTime() - fechaB.getTime()
  })

  // Objeto temporal para agrupar por mes/año
  const agrupado = {}

  pedidos.forEach((pedido) => {
    const fecha = parsearFechaDDMMYYYY(pedido.fecha)
    if (!fecha) return

    const mes = fecha.getUTCMonth() // Usamos getUTCMonth para consistencia
    const anio = fecha.getUTCFullYear() // Usamos getUTCFullYear para consistencia
    const clave = `${mes}-${anio}`

    if (!agrupado[clave]) {
      agrupado[clave] = {
        mes,
        anio,
        pedidos: [],
        enviado: false,
      }
    }
    agrupado[clave].pedidos.push(pedido)
  })

  // Convertimos el objeto en array
  historialDeRangos.value = Object.values(agrupado).sort((a, b) => {
    if (a.anio === b.anio) {
      return a.mes - b.mes
    }
    return a.anio - b.anio
  })
}

/* Enviar pedidos del mes/año seleccionado */
async function enviarRango(rango) {
  try {
    rango.enviado = true
    // Guardamos la fecha del último envío (último pedido de ese mes)
    const fechaUltima = parsearFechaDDMMYYYY(rango.pedidos[rango.pedidos.length - 1].fecha)
    if (fechaUltima) {
      await guardarFechaUltimoEnvio(fechaUltima.toISOString())
    }
    // Generar Excel solo con pedidos de este mes
    const { uri, nombreArchivo } = await generarYGuardarExcelTemporal(rango.pedidos)

    if (!uri) {
      throw new Error('No se generó el archivo correctamente.')
    }

    // Compartir archivo
    await compartirArchivo(uri, nombreArchivo)
    // Recargar historial
    await cargarHistorial()
  } catch (error) {
    console.error('Error al enviar el archivo:', error)
  }
}

/* Ver detalle de pedidos de ese mes/año */
function verDetalleRango(rango) {
  // CAMBIO: Se calcula el primer y último día del mes del rango para asegurar que se incluye todo el mes.
  const fechaInicio = new Date(Date.UTC(rango.anio, rango.mes, 1))
  const fechaFin = new Date(Date.UTC(rango.anio, rango.mes + 1, 0)) // El día 0 del siguiente mes es el último día del mes actual.

  router.push({
    name: 'PedidosRealizados',
    query: {
      // Se convierte a formato YYYY-MM-DD
      inicio: fechaInicio.toISOString().split('T')[0],
      fin: fechaFin.toISOString().split('T')[0],
    },
  })
}

onMounted(() => {
  cargarHistorial()
})
</script>
