<template>
  <div class="contenedor-historial">
    <h2 class="titulo-historial">Historial de pedidos</h2>

    <!-- Itera sobre los rangos de fechas y los muestra -->
    <div
      v-for="(rango, indice) in historialDeRangos"
      :key="indice"
      class="tarjeta-rango"
      @click="verDetalleRango(rango)"
    >
      <div class="info-rango">
        <p class="texto-rango">
          <!-- Formatea las fechas de inicio y fin para mostrarlas -->
          {{ formatearFecha(rango.inicio) }} al {{ formatearFecha(rango.fin) }}
        </p>
        <!-- Muestra el botón de enviar si el rango no ha sido enviado -->
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
import { obtenerPedidos, guardarFechaUltimoEnvio } from '../BaseDeDatos/almacenamiento.js'
import { generarYGuardarExcelTemporal } from './GeneraExcel/GeneraExcel.js'
import { compartirArchivo } from 'src/components/Logica/Envios/CompartirExcel.js'

const router = useRouter()
const IconoEnviar = IconSend
const historialDeRangos = ref([])

function parsearFechaDDMMYYYY(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return null
  const partes = fechaStr.split('/')
  if (partes.length !== 3) return null

  const [dia, mes, anio] = partes.map(Number)
  const fecha = new Date(anio, mes - 1, dia)

  if (fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia) {
    return fecha
  }
  return null
}

function formatearFecha(fechaInput) {
  const fecha = fechaInput instanceof Date ? fechaInput : new Date(fechaInput)
  if (isNaN(fecha.getTime())) return 'Fecha inválida'

  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const año = fecha.getFullYear()
  return `${dia}/${mes}/${año}`
}

async function cargarHistorial() {
  const pedidos = await obtenerPedidos()

  if (!pedidos || pedidos.length === 0) {
    historialDeRangos.value = []
    return
  }

  pedidos.sort((a, b) => {
    const fechaA = parsearFechaDDMMYYYY(a.fecha)
    const fechaB = parsearFechaDDMMYYYY(b.fecha)
    if (!fechaA || !fechaB) return 0
    return fechaA.getTime() - fechaB.getTime()
  })

  const fechaInicio = parsearFechaDDMMYYYY(pedidos[0].fecha)
  const fechaFin = parsearFechaDDMMYYYY(pedidos[pedidos.length - 1].fecha)

  if (fechaInicio && fechaFin) {
    historialDeRangos.value = [
      {
        inicio: fechaInicio,
        fin: fechaFin,
        enviado: false,
      },
    ]
  } else {
    historialDeRangos.value = []
  }
}

// Función de envío adaptada de PedidosRealizados
async function enviarRango(rango) {
  try {
    rango.enviado = true
    await guardarFechaUltimoEnvio(rango.fin.toISOString())
    await cargarHistorial()

    const pedidos = await obtenerPedidos()

    if (!pedidos || pedidos.length === 0) {
      throw new Error('No hay pedidos para enviar.')
    }

    const { uri, nombreArchivo } = await generarYGuardarExcelTemporal(pedidos)

    if (!uri) {
      throw new Error('No se generó el archivo correctamente.')
    }

    // Compartir archivo
    await compartirArchivo(uri, nombreArchivo)
  } catch (error) {
    console.error('Error al enviar el archivo:', error)
  }
}

function verDetalleRango(rango) {
  router.push({
    name: 'PedidosRealizados',
    query: {
      inicio: rango.inicio.toISOString().split('T')[0],
      fin: rango.fin.toISOString().split('T')[0],
    },
  })
}

onMounted(() => {
  cargarHistorial()
})
</script>
