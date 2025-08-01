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

    <!-- Componente que exporta a Excel cuando se actualiza el array -->
    <ExportarPedidosExcel :pedidos="pedidosParaExportar" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconSend } from '@tabler/icons-vue'
import { obtenerPedidos, guardarFechaUltimoEnvio } from '../BaseDeDatos/almacenamiento.js'
import ExportarPedidosExcel from './ExportarPedidosExcel.vue'

const router = useRouter()
const IconoEnviar = IconSend
const historialDeRangos = ref([])

// Agregar esta variable para almacenar pedidos que queremos exportar
const pedidosParaExportar = ref([])

/**
 * Parsea una fecha en formato 'dd/mm/yyyy' a un objeto Date.
 * Es crucial para que Javascript entienda correctamente las fechas de los pedidos.
 * @param {string} fechaStr - La fecha como string, ej: "27/07/2025".
 * @returns {Date|null} - El objeto Date correspondiente o null si el formato es inválido.
 */
function parsearFechaDDMMYYYY(fechaStr) {
  if (!fechaStr || typeof fechaStr !== 'string') return null
  const partes = fechaStr.split('/')
  if (partes.length !== 3) return null

  // Usamos new Date(año, mes - 1, día) porque los meses en Javascript van de 0 a 11.
  const [dia, mes, anio] = partes.map(Number)
  const fecha = new Date(anio, mes - 1, dia)

  // Se valida que la fecha creada sea correcta (ej. no era "32/07/2025")
  if (fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia) {
    return fecha
  }
  return null
}

/**
 * Formatea un objeto Date o un string de fecha compatible a 'dd/mm/yyyy'.
 * @param {Date|string} fechaInput - El objeto Date o string a formatear.
 * @returns {string} - El string de la fecha formateada o "Fecha inválida".
 */
function formatearFecha(fechaInput) {
  const fecha = fechaInput instanceof Date ? fechaInput : new Date(fechaInput)
  if (isNaN(fecha.getTime())) return 'Fecha inválida'

  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const año = fecha.getFullYear()
  return `${dia}/${mes}/${año}`
}

/**
 * Carga los pedidos, calcula el rango de fechas dinámicamente y actualiza la UI.
 */
async function cargarHistorial() {
  const pedidos = await obtenerPedidos()

  // Si no hay pedidos, simplemente dejamos el historial vacío.
  if (!pedidos || pedidos.length === 0) {
    historialDeRangos.value = []
    return
  }

  // Ordenamos los pedidos por fecha para encontrar el más antiguo y el más nuevo.
  pedidos.sort((a, b) => {
    const fechaA = parsearFechaDDMMYYYY(a.fecha)
    const fechaB = parsearFechaDDMMYYYY(b.fecha)
    // Si alguna fecha es inválida, no se altera el orden.
    if (!fechaA || !fechaB) return 0
    return fechaA.getTime() - fechaB.getTime()
  })

  // Una vez ordenados, la primera fecha es la más antigua y la última es la más nueva.
  const fechaInicio = parsearFechaDDMMYYYY(pedidos[0].fecha)
  const fechaFin = parsearFechaDDMMYYYY(pedidos[pedidos.length - 1].fecha)

  // Si las fechas son válidas, actualizamos el historial.
  if (fechaInicio && fechaFin) {
    historialDeRangos.value = [
      {
        inicio: fechaInicio,
        fin: fechaFin,
        enviado: false, // Se mantiene por la estructura del botón "Enviar"
      },
    ]
  } else {
    // Si por alguna razón las fechas no se pudieron procesar, se limpia el historial.
    historialDeRangos.value = []
  }
}

/**
 * Maneja el evento de clic en el botón "Enviar".
 * @param {object} rango - El objeto de rango que se va a enviar.
 */
async function enviarRango(rango) {
  rango.enviado = true
  // Se guarda la fecha en un formato estándar (ISO) para mayor compatibilidad.
  await guardarFechaUltimoEnvio(rango.fin.toISOString())
  await cargarHistorial()

  // Cargar pedidos y asignar para exportar (disparará exportación en el componente)
  const pedidos = await obtenerPedidos()
  pedidosParaExportar.value = pedidos
}

/**
 * Redirige a la vista de detalle para el rango de fechas seleccionado.
 * @param {object} rango - El objeto de rango seleccionado.
 */
function verDetalleRango(rango) {
  // Se pasan las fechas como YYYY-MM-DD a la siguiente ruta, que es más robusto.
  router.push({
    name: 'PedidosRealizados',
    query: {
      inicio: rango.inicio.toISOString().split('T')[0],
      fin: rango.fin.toISOString().split('T')[0],
    },
  })
}

// Carga el historial de pedidos cuando el componente se monta.
onMounted(() => {
  cargarHistorial()
})
</script>
