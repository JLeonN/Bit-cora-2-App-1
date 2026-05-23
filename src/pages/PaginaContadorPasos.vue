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
        <p class="etiqueta">Sesion actual</p>
        <p class="valor">{{ estadoActual.sesionActiva ? estadoActual.pasosSesion : 0 }}</p>
      </div>
      <div class="tarjeta-resumen">
        <p class="etiqueta">Ultimos 7 dias</p>
        <p class="valor">{{ resumenSieteDias }}</p>
      </div>
      <div class="tarjeta-resumen">
        <p class="etiqueta">Ultimos 30 dias</p>
        <p class="valor">{{ resumenTreintaDias }}</p>
      </div>
    </div>
    <div class="acciones-sesion">
      <q-btn
        v-if="!estadoActual.sesionActiva"
        class="boton-sesion iniciar"
        label="Iniciar sesion"
        @click="iniciarSesion"
      />
      <q-btn
        v-else
        class="boton-sesion detener"
        label="Detener sesion"
        @click="detenerSesion"
      />
      <span class="estado-pill" :class="{ activo: estadoMonitoreo }">
        {{ textoEstadoMonitoreo }}
      </span>
    </div>
    <div class="filtros-historial">
      <div class="filtros-fila">
        <q-select
          v-model="filtros.mes"
          dense
          outlined
          emit-value
          map-options
          :options="opcionesMeses"
          options-dark
          popup-content-class="menu-filtro-pasos"
          label="Mes"
          class="campo-filtro"
        />
        <q-select
          v-model="filtros.anio"
          dense
          outlined
          emit-value
          map-options
          :options="opcionesAnios"
          options-dark
          popup-content-class="menu-filtro-pasos"
          label="Ano"
          class="campo-filtro"
        />
        <q-input
          v-model="filtros.diaExacto"
          dense
          outlined
          type="date"
          label="Dia puntual"
          class="campo-filtro"
        />
      </div>
      <div class="filtros-fila">
        <q-input
          v-model="filtros.fechaDesde"
          dense
          outlined
          type="date"
          label="Desde"
          class="campo-filtro"
        />
        <q-input
          v-model="filtros.fechaHasta"
          dense
          outlined
          type="date"
          label="Hasta"
          class="campo-filtro"
        />
        <q-btn
          dense
          outline
          color="primary"
          label="Limpiar filtros"
          class="boton-limpiar"
          @click="limpiarFiltros"
        />
      </div>
      <p v-if="rangoInvalido" class="mensaje-filtro-error">
        El rango Desde/Hasta no es valido.
      </p>
    </div>
    <div class="tabs-historial">
      <q-tabs
        v-model="pestanaActiva"
        dense
        inline-label
        active-color="primary"
        indicator-color="primary"
        class="tabs-pasos"
      >
        <q-tab name="diario" label="Diario" />
        <q-tab name="sesiones" label="Sesiones" />
        <q-tab name="mensual" label="Mensual" />
      </q-tabs>
      <q-tab-panels v-model="pestanaActiva" animated class="paneles-pasos">
        <q-tab-panel name="diario" class="panel-pasos">
          <div class="cabecera-lista">Historial diario</div>
          <div v-if="diarioPaginado.length === 0" class="vacio">Sin registros diarios</div>
          <div v-for="dia in diarioPaginado" :key="dia.fecha" class="fila-historial">
            <span>{{ formatearFechaISO(dia.fecha) }}</span>
            <strong>{{ dia.totalPasos }}</strong>
          </div>
          <div class="paginacion" v-if="totalPaginasDiario > 1">
            <q-pagination
              v-model="paginacionDiario.pagina"
              color="primary"
              :max="totalPaginasDiario"
              direction-links
              boundary-links
            />
          </div>
        </q-tab-panel>
        <q-tab-panel name="sesiones" class="panel-pasos">
          <div class="cabecera-lista">Historial de sesiones</div>
          <div v-if="sesionesPaginadas.length === 0" class="vacio">Sin sesiones registradas</div>
          <div
            v-for="sesion in sesionesPaginadas"
            :key="sesion.id"
            class="fila-historial fila-sesion"
          >
            <div class="detalle-sesion">
              <span class="linea-fecha">{{ formatearFechaSesion(sesion) }}</span>
              <span class="linea-hora">{{ formatearHorarioSesion(sesion) }} ({{ sesion.estado }})</span>
            </div>
            <strong class="valor-sesion">{{ sesion.pasosSesion }}</strong>
          </div>
          <div class="paginacion" v-if="totalPaginasSesiones > 1">
            <q-pagination
              v-model="paginacionSesiones.pagina"
              color="primary"
              :max="totalPaginasSesiones"
              direction-links
              boundary-links
            />
          </div>
        </q-tab-panel>
        <q-tab-panel name="mensual" class="panel-pasos">
          <div class="cabecera-lista">Resumen mensual</div>
          <div v-if="mensualFiltrado.length === 0" class="vacio">Sin datos mensuales</div>
          <div v-for="mes in mensualFiltrado" :key="mes.mes" class="bloque-mes">
            <button class="boton-mes" @click="alternarMes(mes.mes)">
              <span>{{ mes.mes }}</span>
              <strong>{{ mes.totalPasos }}</strong>
            </button>
            <div v-if="mesesExpandidos.has(mes.mes)" class="detalle-mes">
              <div v-if="mes.dias.length === 0" class="vacio">Sin dias para este mes</div>
              <div v-for="dia in mes.dias" :key="dia.fecha" class="fila-historial">
                <span>{{ formatearFechaISO(dia.fecha) }}</span>
                <strong>{{ dia.totalPasos }}</strong>
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { servicioPasos } from 'src/components/Logica/Pasos/ServicioPasos.js'
import {
  obtenerPasosDiarios,
  obtenerSesionesPasos,
  obtenerEstadoMonitoreoPasos,
  registrarEventoPasos,
} from 'src/components/BaseDeDatos/usoAlmacenamientoPasos.js'

const TAMANO_PAGINA = 10
const estadoActual = reactive({
  pasosDia: 0,
  pasosSesion: 0,
  sesionActiva: false,
})
const historialDiario = ref([])
const historialSesiones = ref([])
const estadoMonitoreo = ref(false)
const esAndroidNativo = servicioPasos.esAndroidNativo()
const hoy = new Date()
const filtros = reactive({
  mes: hoy.getMonth() + 1,
  anio: hoy.getFullYear(),
  fechaDesde: '',
  fechaHasta: '',
  diaExacto: '',
})
const pestanaActiva = ref('diario')
const paginacionDiario = reactive({ pagina: 1, tamanio: TAMANO_PAGINA })
const paginacionSesiones = reactive({ pagina: 1, tamanio: TAMANO_PAGINA })
const mesesExpandidos = ref(new Set())
let desuscribir = null

const opcionesMeses = [
  { label: 'Enero', value: 1 },
  { label: 'Febrero', value: 2 },
  { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 },
  { label: 'Mayo', value: 5 },
  { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 },
  { label: 'Agosto', value: 8 },
  { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 },
  { label: 'Noviembre', value: 11 },
  { label: 'Diciembre', value: 12 },
]

const opcionesAnios = computed(() => {
  const anios = new Set([hoy.getFullYear()])
  historialDiario.value.forEach((item) => anios.add(new Date(`${item.fecha}T00:00:00`).getFullYear()))
  historialSesiones.value.forEach((sesion) => {
    if (sesion.inicio) {
      anios.add(new Date(sesion.inicio).getFullYear())
    }
  })
  return [...anios].sort((a, b) => b - a).map((anio) => ({ label: String(anio), value: anio }))
})

const rangoInvalido = computed(() => {
  if (!filtros.fechaDesde || !filtros.fechaHasta) {
    return false
  }
  return new Date(filtros.fechaDesde) > new Date(filtros.fechaHasta)
})

const textoEstadoMonitoreo = computed(() => {
  if (!esAndroidNativo) {
    return 'Modo navegador'
  }
  return estadoMonitoreo.value ? 'Monitoreo activo' : 'Monitoreo inactivo'
})

const resumenSieteDias = computed(() => sumarUltimosDias(7))
const resumenTreintaDias = computed(() => sumarUltimosDias(30))

const diarioFiltrado = computed(() => {
  const base = [...historialDiario.value].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
  return base.filter((item) => fechaCumpleFiltros(item.fecha))
})

const sesionesFiltradas = computed(() => {
  const base = [...historialSesiones.value].sort((a, b) => (a.inicio < b.inicio ? 1 : -1))
  return base.filter((sesion) => {
    if (!sesion.inicio) {
      return false
    }
    return fechaCumpleFiltros(new Date(sesion.inicio).toISOString().slice(0, 10))
  })
})

const totalPaginasDiario = computed(() =>
  Math.max(1, Math.ceil(diarioFiltrado.value.length / paginacionDiario.tamanio)),
)
const totalPaginasSesiones = computed(() =>
  Math.max(1, Math.ceil(sesionesFiltradas.value.length / paginacionSesiones.tamanio)),
)

const diarioPaginado = computed(() => {
  const inicio = (paginacionDiario.pagina - 1) * paginacionDiario.tamanio
  const fin = inicio + paginacionDiario.tamanio
  return diarioFiltrado.value.slice(inicio, fin)
})

const sesionesPaginadas = computed(() => {
  const inicio = (paginacionSesiones.pagina - 1) * paginacionSesiones.tamanio
  const fin = inicio + paginacionSesiones.tamanio
  return sesionesFiltradas.value.slice(inicio, fin)
})

const mensualFiltrado = computed(() => {
  const mapa = new Map()
  diarioFiltrado.value.forEach((dia) => {
    const mesClave = dia.fecha.slice(0, 7)
    if (!mapa.has(mesClave)) {
      mapa.set(mesClave, { mes: mesClave, totalPasos: 0, dias: [] })
    }
    const acumulado = mapa.get(mesClave)
    acumulado.totalPasos += Number(dia.totalPasos || 0)
    acumulado.dias.push(dia)
  })
  return [...mapa.values()]
    .map((mes) => ({ ...mes, dias: mes.dias.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)) }))
    .sort((a, b) => (a.mes < b.mes ? 1 : -1))
})

watch([diarioFiltrado, sesionesFiltradas], () => {
  paginacionDiario.pagina = Math.min(paginacionDiario.pagina, totalPaginasDiario.value)
  paginacionSesiones.pagina = Math.min(paginacionSesiones.pagina, totalPaginasSesiones.value)
})

watch(
  () => ({ ...filtros }),
  () => {
    paginacionDiario.pagina = 1
    paginacionSesiones.pagina = 1
    mesesExpandidos.value = new Set()
  },
  { deep: true },
)

function sumarUltimosDias(cantidad) {
  const limite = new Date()
  limite.setDate(limite.getDate() - cantidad)
  return historialDiario.value
    .filter((item) => new Date(`${item.fecha}T00:00:00`) >= limite)
    .reduce((acc, item) => acc + (item.totalPasos || 0), 0)
}

function fechaCumpleFiltros(fechaISO) {
  if (!fechaISO || rangoInvalido.value) {
    return false
  }
  const [anio, mes] = fechaISO.split('-').map(Number)
  if (filtros.anio && anio !== Number(filtros.anio)) {
    return false
  }
  if (filtros.mes && mes !== Number(filtros.mes)) {
    return false
  }
  if (filtros.diaExacto && fechaISO !== filtros.diaExacto) {
    return false
  }
  if (filtros.fechaDesde && fechaISO < filtros.fechaDesde) {
    return false
  }
  if (filtros.fechaHasta && fechaISO > filtros.fechaHasta) {
    return false
  }
  return true
}

function limpiarFiltros() {
  filtros.mes = hoy.getMonth() + 1
  filtros.anio = hoy.getFullYear()
  filtros.fechaDesde = ''
  filtros.fechaHasta = ''
  filtros.diaExacto = ''
}

function alternarMes(mesClave) {
  const nuevoSet = new Set(mesesExpandidos.value)
  if (nuevoSet.has(mesClave)) {
    nuevoSet.delete(mesClave)
  } else {
    nuevoSet.add(mesClave)
  }
  mesesExpandidos.value = nuevoSet
}

function formatearFechaISO(fechaISO) {
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString()
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
  return `${inicio} -> ${fin}`
}

async function refrescarHistorial() {
  const [pasos, sesiones, estado] = await Promise.all([
    obtenerPasosDiarios(),
    obtenerSesionesPasos(),
    obtenerEstadoMonitoreoPasos(),
  ])
  historialDiario.value = [...pasos]
  historialSesiones.value = [...sesiones]
  estadoMonitoreo.value = Boolean(estado?.activo)
}

async function iniciarSesion() {
  const resultado = await servicioPasos.iniciarSesionManual()
  if (!resultado.ok) {
    Notify.create({ type: 'warning', message: 'Ya existe una sesion activa' })
    return
  }
  await registrarEventoPasos('ui_sesion_iniciada', 'Sesion iniciada desde el modulo de pasos')
  await refrescarHistorial()
}

async function detenerSesion() {
  await servicioPasos.detenerSesionManual()
  await registrarEventoPasos('ui_sesion_detenida', 'Sesion detenida desde el modulo de pasos')
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
.filtros-historial {
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-fondo);
  padding: 10px;
  margin-bottom: 12px;
}
.filtros-fila {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.filtros-fila + .filtros-fila {
  margin-top: 8px;
}
.campo-filtro {
  width: 100%;
}
.boton-limpiar {
  width: 100%;
}
.mensaje-filtro-error {
  margin: 8px 0 0 0;
  color: var(--color-error);
  font-size: 0.8rem;
}
.tabs-historial {
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-fondo);
}
.tabs-pasos {
  border-bottom: 1px solid var(--color-borde);
}
.tabs-pasos :deep(.q-tab) {
  color: var(--color-texto-secundario);
}
.tabs-pasos :deep(.q-tab--active) {
  color: var(--color-acento);
}
.paneles-pasos {
  background: var(--color-fondo);
}
.panel-pasos {
  padding: 12px;
  background: var(--color-fondo);
}
.paneles-pasos :deep(.q-tab-panel) {
  background: var(--color-fondo);
  color: var(--color-texto-principal);
}
.filtros-historial :deep(.q-field .q-field__control) {
  background: var(--color-fondo);
  color: var(--color-texto-principal);
}
.filtros-historial :deep(.q-field .q-field__native),
.filtros-historial :deep(.q-field .q-field__input),
.filtros-historial :deep(.q-field .q-field__marginal),
.filtros-historial :deep(.q-select__dropdown-icon) {
  color: var(--color-texto-principal);
}
.filtros-historial :deep(.q-field .q-field__label) {
  color: var(--color-texto-secundario);
}
.filtros-historial :deep(.q-field.q-field--focused .q-field__label) {
  color: var(--color-acento);
}
.filtros-historial :deep(.q-field .q-field__control:before) {
  border-color: var(--color-borde);
}
.filtros-historial :deep(.q-field .q-field__control:hover:before) {
  border-color: var(--color-primario);
}
.filtros-historial :deep(.q-field.q-field--focused .q-field__control:after) {
  border-color: var(--color-acento);
}
.filtros-historial :deep(.q-field .q-placeholder) {
  color: var(--color-texto-secundario);
}
.filtros-historial :deep(.q-menu),
.filtros-historial :deep(.q-list) {
  background: var(--color-superficie);
  color: var(--color-texto-principal);
}
.cabecera-lista {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-weight: 700;
  padding: 0 0 8px 0;
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
.fila-historial strong {
  color: var(--color-acento);
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
.bloque-mes {
  border-top: 1px solid var(--color-borde);
}
.boton-mes {
  width: 100%;
  background: transparent;
  border: 0;
  color: var(--color-texto-principal);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
}
.detalle-mes {
  padding: 0 0 6px 0;
}
.paginacion {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}
.vacio {
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
  padding: 8px 0;
}
@media (max-width: 800px) {
  .filtros-fila {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 560px) {
  .filtros-fila {
    grid-template-columns: 1fr;
  }
  .acciones-sesion {
    gap: 8px;
  }
}
</style>

<style>
.menu-filtro-pasos {
  background: var(--color-superficie) !important;
  color: var(--color-texto-principal) !important;
}
.menu-filtro-pasos .q-item {
  color: var(--color-texto-principal) !important;
}
.menu-filtro-pasos .q-item--active,
.menu-filtro-pasos .q-item--active .q-item__label {
  color: var(--color-acento) !important;
}
.menu-filtro-pasos .q-item.q-manual-focusable--focused,
.menu-filtro-pasos .q-item:hover {
  background: color-mix(in oklab, var(--color-primario) 18%, var(--color-superficie)) !important;
}
</style>
