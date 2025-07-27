<template>
  <div class="contenedor-historial">
    <h2 class="titulo-historial">Historial de pedidos</h2>

    <div
      v-for="(rango, indice) in historialDeRangos"
      :key="indice"
      class="tarjeta-rango"
      @click="verDetalleRango(rango)"
    >
      <div class="info-rango">
        <p class="texto-rango">
          Pedidos del {{ formatearFecha(rango.inicio) }} al {{ formatearFecha(rango.fin) }}
        </p>
        <span v-if="!rango.enviado" @click.stop="enviarRango(rango)" class="boton-enviar">
          <IconoEnviar size="20" /> Enviar
        </span>
      </div>
    </div>

    <p v-if="historialDeRangos.length === 0" class="texto-secundario" style="text-align: center">
      No hay pedidos aún.
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { IconSend } from '@tabler/icons-vue'
import {
  obtenerFechaUltimoEnvio,
  guardarFechaUltimoEnvio,
  obtenerPedidos,
} from 'components/BaseDeDatos/usoAlmacenamientoPedidos.js'

const router = useRouter()
const IconoEnviar = IconSend
const historialDeRangos = ref([])

function formatearFecha(fechaTexto) {
  const fecha = new Date(fechaTexto)
  if (isNaN(fecha)) return 'Fecha inválida'
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const año = fecha.getFullYear()
  return `${dia}/${mes}/${año}`
}

function obtenerFechaHoyISO() {
  const hoy = new Date()
  return hoy.toISOString().split('T')[0]
}

async function cargarHistorial() {
  const pedidos = await obtenerPedidos()
  const hoyISO = obtenerFechaHoyISO()

  if (!pedidos || pedidos.length === 0) {
    const ultimaFecha = await obtenerFechaUltimoEnvio()
    historialDeRangos.value = ultimaFecha
      ? [{ inicio: ultimaFecha, fin: hoyISO, enviado: false }]
      : []
    return
  }

  pedidos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  const fechaUltimoEnvio = await obtenerFechaUltimoEnvio()
  const fechaInicio = fechaUltimoEnvio || pedidos[0].fecha
  const fechaFin = pedidos[pedidos.length - 1].fecha || hoyISO

  historialDeRangos.value = [
    {
      inicio: fechaInicio,
      fin: fechaFin,
      enviado: false,
    },
  ]
}

async function enviarRango(rango) {
  rango.enviado = true
  await guardarFechaUltimoEnvio(rango.fin)
  await cargarHistorial()
}

function verDetalleRango(rango) {
  router.push({ name: 'PedidosRealizados', query: { inicio: rango.inicio, fin: rango.fin } })
}

onMounted(() => {
  cargarHistorial()
})
</script>

<!------------------------ CSS ------------------------>
<style scoped>
.contenedor-historial {
  padding: 1rem;
}

.titulo-historial {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.tarjeta-rango {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: background 0.2s;
}

.tarjeta-rango:hover {
  background: #f9f9f9;
}

.info-rango {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.texto-rango {
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.boton-enviar {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #007bff;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.boton-enviar:hover {
  color: #0056b3;
}
</style>
