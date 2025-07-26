<template>
  <div class="contenedor-historial">
    <h2 class="titulo-historial">Historial de pedidos enviados</h2>

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
      No hay rangos enviados aún.
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
} from 'components/BaseDeDatos/usoAlmacenamientoPedidos.js'

const router = useRouter()
const IconoEnviar = IconSend
const historialDeRangos = ref([])

function formatearFecha(fechaTexto) {
  const fecha = new Date(fechaTexto)
  const dia = String(fecha.getDate()).padStart(2, '0')
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const año = fecha.getFullYear()
  return `${dia}/${mes}/${año}`
}

async function cargarHistorial() {
  const hoy = new Date()
  const hoyFormateado = hoy.toISOString().split('T')[0]

  let fechaInicio = await obtenerFechaUltimoEnvio()
  if (!fechaInicio) {
    fechaInicio = '2025-07-01'
  }

  historialDeRangos.value = [
    {
      inicio: fechaInicio,
      fin: hoyFormateado,
      enviado: false,
    },
  ]
}

async function enviarRango(rango) {
  rango.enviado = true
  await guardarFechaUltimoEnvio(rango.fin)
  cargarHistorial()
  console.log('Rango enviado y guardado:', rango)
}

function verDetalleRango(rango) {
  console.log('Ver detalle del rango:', rango)
  router.push({ name: 'PedidosRealizados', query: rango })
}

onMounted(() => {
  cargarHistorial()
})
</script>

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
