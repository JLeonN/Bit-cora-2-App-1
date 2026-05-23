<template>
  <div class="contenedor-pasos">
    <div class="cabecera-pasos">
      <h2 class="titulo-tabla">Contador de pasos</h2>
    </div>
    <div class="tarjetas-resumen">
      <div class="tarjeta-resumen">
        <p class="etiqueta">Pasos hoy</p>
        <p class="valor">{{ estadoActual.pasosDia }}</p>
      </div>
      <div class="tarjeta-resumen">
        <p class="etiqueta">Sesión actual</p>
        <p class="valor">{{ estadoActual.sesionActiva ? estadoActual.pasosSesion : 0 }}</p>
      </div>
      <div class="tarjeta-resumen">
        <p class="etiqueta">Últimos 7 días</p>
        <p class="valor">{{ resumenSieteDias }}</p>
      </div>
      <div class="tarjeta-resumen">
        <p class="etiqueta">Últimos 30 días</p>
        <p class="valor">{{ resumenTreintaDias }}</p>
      </div>
    </div>
    <div class="acciones-sesion">
      <q-btn
        v-if="!estadoActual.sesionActiva"
        class="boton-sesion iniciar"
        label="Iniciar sesión"
        @click="iniciarSesion"
      />
      <q-btn
        v-else
        class="boton-sesion detener"
        label="Detener sesión"
        @click="detenerSesion"
      />
      <span class="estado-pill" :class="{ activo: estadoMonitoreo }">
        {{ textoEstadoMonitoreo }}
      </span>
    </div>
    <div class="bloques-historial">
      <div class="bloque">
        <h3>Historial diario</h3>
        <div v-if="historialDiario.length === 0" class="vacio">Sin registros diarios</div>
        <div v-for="dia in historialDiario" :key="dia.fecha" class="fila-historial">
          <span>{{ dia.fecha }}</span>
          <strong>{{ dia.totalPasos }}</strong>
        </div>
      </div>
      <div class="bloque">
        <h3>Historial de sesiones</h3>
        <div v-if="historialSesiones.length === 0" class="vacio">Sin sesiones registradas</div>
        <div v-for="sesion in historialSesiones" :key="sesion.id" class="fila-historial fila-sesion">
          <div class="detalle-sesion">
            <span class="linea-fecha">{{ formatearFechaSesion(sesion) }}</span>
            <span class="linea-hora">{{ formatearHorarioSesion(sesion) }} ({{ sesion.estado }})</span>
          </div>
          <strong class="valor-sesion">{{ sesion.pasosSesion }}</strong>
        </div>
      </div>
      <div class="bloque">
        <h3>Resumen mensual</h3>
        <div v-if="resumenMensual.length === 0" class="vacio">Sin datos mensuales</div>
        <div v-for="mes in resumenMensual" :key="mes.mes" class="fila-historial">
          <span>{{ mes.mes }}</span>
          <strong>{{ mes.totalPasos }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Notify } from 'quasar'
import { servicioPasos } from 'src/components/Logica/Pasos/ServicioPasos.js'
import {
  obtenerPasosDiarios,
  obtenerSesionesPasos,
  obtenerEstadoMonitoreoPasos,
  registrarEventoPasos,
} from 'src/components/BaseDeDatos/usoAlmacenamientoPasos.js'

const estadoActual = reactive({
  pasosDia: 0,
  pasosSesion: 0,
  sesionActiva: false,
})
const historialDiario = ref([])
const historialSesiones = ref([])
const estadoMonitoreo = ref(false)
let desuscribir = null
const esAndroidNativo = servicioPasos.esAndroidNativo()

const resumenSieteDias = computed(() => sumarUltimosDias(7))
const resumenTreintaDias = computed(() => sumarUltimosDias(30))
const resumenMensual = computed(() => {
  const mapa = new Map()
  historialDiario.value.forEach((item) => {
    const mes = item.fecha.slice(0, 7)
    mapa.set(mes, (mapa.get(mes) || 0) + (item.totalPasos || 0))
  })
  return [...mapa.entries()]
    .map(([mes, totalPasos]) => ({ mes, totalPasos }))
    .sort((a, b) => (a.mes < b.mes ? 1 : -1))
})
const textoEstadoMonitoreo = computed(() => {
  if (!esAndroidNativo) {
    return 'Modo navegador'
  }
  return estadoMonitoreo.value ? 'Monitoreo activo' : 'Monitoreo inactivo'
})

function sumarUltimosDias(cantidad) {
  const limite = new Date()
  limite.setDate(limite.getDate() - cantidad)
  return historialDiario.value
    .filter((item) => new Date(`${item.fecha}T00:00:00`) >= limite)
    .reduce((acc, item) => acc + (item.totalPasos || 0), 0)
}

function formatearFechaSesion(sesion) {
  if (!sesion.inicio) {
    return 'Sin fecha'
  }
  return new Date(sesion.inicio).toLocaleDateString()
}

function formatearHorarioSesion(sesion) {
  const inicio = sesion.inicio ? new Date(sesion.inicio).toLocaleTimeString() : '--:--'
  const fin = sesion.fin ? new Date(sesion.fin).toLocaleTimeString() : 'Activa'
  return `${inicio} → ${fin}`
}

async function refrescarHistorial() {
  const [pasos, sesiones, estado] = await Promise.all([
    obtenerPasosDiarios(),
    obtenerSesionesPasos(),
    obtenerEstadoMonitoreoPasos(),
  ])
  historialDiario.value = [...pasos].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
  historialSesiones.value = [...sesiones].sort((a, b) => (a.inicio < b.inicio ? 1 : -1))
  estadoMonitoreo.value = Boolean(estado?.activo)
}

async function iniciarSesion() {
  const resultado = await servicioPasos.iniciarSesionManual()
  if (!resultado.ok) {
    Notify.create({ type: 'warning', message: 'Ya existe una sesión activa' })
    return
  }
  await registrarEventoPasos('ui_sesion_iniciada', 'Sesión iniciada desde el módulo de pasos')
  await refrescarHistorial()
}

async function detenerSesion() {
  await servicioPasos.detenerSesionManual()
  await registrarEventoPasos('ui_sesion_detenida', 'Sesión detenida desde el módulo de pasos')
  await refrescarHistorial()
}

onMounted(async () => {
  await servicioPasos.iniciarMonitoreo()
  await servicioPasos.refrescarEstadoDesdeNativo()
  desuscribir = servicioPasos.suscribir((estado) => {
    estadoActual.pasosDia = estado.pasosDia
    estadoActual.pasosSesion = estado.pasosSesion
    estadoActual.sesionActiva = estado.sesionActiva
  })
  await refrescarHistorial()
})

onUnmounted(() => {
  if (desuscribir) {
    desuscribir()
  }
})
</script>

<style scoped>
.contenedor-pasos {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 16px;
  max-width: 950px;
  margin: 20px auto;
}
.cabecera-pasos {
  margin-bottom: 16px;
}
.cabecera-pasos :deep(.titulo-tabla) {
  margin-bottom: 0.4rem;
}
.estado-pill {
  border: 1px solid var(--color-borde);
  color: var(--color-texto-secundario);
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
}
.estado-pill.activo {
  border-color: var(--color-exito);
  color: var(--color-exito);
}
.tarjetas-resumen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}
.tarjeta-resumen {
  background: var(--color-fondo);
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  padding: 12px;
}
.etiqueta {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
.valor {
  margin: 4px 0 0 0;
  color: var(--color-acento);
  font-size: 1.35rem;
  font-weight: 700;
}
.acciones-sesion {
  margin: 16px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.boton-sesion {
  color: var(--color-texto-principal);
}
.boton-sesion.iniciar {
  background: var(--color-exito);
}
.boton-sesion.detener {
  background: var(--color-error);
}
.bloques-historial {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}
.bloque {
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-fondo);
  padding: 12px;
}
.bloque h3 {
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: var(--color-texto-principal);
}
.fila-historial {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px solid var(--color-borde);
  padding: 8px 0;
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
}
.fila-sesion {
  align-items: flex-start;
  gap: 12px;
}
.detalle-sesion {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.linea-fecha {
  color: var(--color-texto-principal);
  font-weight: 600;
}
.linea-hora {
  color: var(--color-texto-secundario);
}
.valor-sesion {
  min-width: 18px;
  text-align: right;
  align-self: center;
}
.fila-historial strong {
  color: var(--color-acento);
}
.vacio {
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
@media (max-width: 700px) {
  .cabecera-pasos {
    margin-bottom: 20px;
  }
  .acciones-sesion {
    gap: 8px;
  }
}
</style>
