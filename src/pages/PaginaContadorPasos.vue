<template>
  <div class="contenedor-pasos">
    <div class="cabecera-pasos">
      <h2 class="titulo-tabla">Contador de pasos</h2>
      <div class="bloque-monitoreo">
        <q-toggle
          v-model="monitoreoHabilitado"
          color="primary"
          label="Monitoreo 24/7"
          @update:model-value="cambiarMonitoreo"
        />
        <span class="estado-pill" :class="{ activo: estadoMonitoreo }">
          {{ textoEstadoMonitoreo }}
        </span>
      </div>
    </div>
    <div class="tarjeta-resumen-general">
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
          <p class="etiqueta">Última semana</p>
          <p class="subetiqueta">Lun a Dom</p>
          <p class="valor">{{ resumenSemanaActual }}</p>
        </div>
        <div class="tarjeta-resumen">
          <p class="etiqueta">Mes actual</p>
          <p class="subetiqueta">{{ etiquetaMesActual }}</p>
          <p class="valor">{{ resumenMesActual }}</p>
        </div>
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
        label="Detener sesión"
        @click="detenerSesion"
      />
    </div>
    <SelectorPeriodo
      v-model="filtros"
      :anios="opcionesAniosValores"
      @limpiar="limpiarFiltros"
      @rangoInvalido="manejarRangoInvalido"
    />
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
          <div v-if="mensualPaginado.length === 0" class="vacio">Sin datos mensuales</div>
          <div v-for="mes in mensualPaginado" :key="mes.mes" class="bloque-mes">
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
          <div class="paginacion" v-if="totalPaginasMensual > 1">
            <q-pagination
              v-model="paginacionMensual.pagina"
              color="primary"
              :max="totalPaginasMensual"
              direction-links
              boundary-links
            />
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { servicioPasos } from 'src/components/Logica/Pasos/ServicioPasos.js'
import SelectorPeriodo from 'src/components/Logica/Compartidos/SelectorPeriodo.vue'
import {
  obtenerPasosDiarios,
  obtenerSesionesPasos,
  obtenerEstadoMonitoreoPasos,
  registrarEventoPasos,
} from 'src/components/BaseDeDatos/usoAlmacenamientoPasos.js'

const TAMANO_PAGINA = 10
const TAMANO_PAGINA_MENSUAL = 12
const estadoActual = reactive({
  pasosDia: 0,
  pasosSesion: 0,
  sesionActiva: false,
})
const historialDiario = ref([])
const historialSesiones = ref([])
const estadoMonitoreo = ref(false)
const monitoreoHabilitado = ref(false)
const esAndroidNativo = servicioPasos.esAndroidNativo()
const hoy = new Date()
const fechaHoyISO = obtenerFechaHoyISO()
const filtros = ref({
  mes: hoy.getMonth() + 1,
  anio: hoy.getFullYear(),
  fechaDesde: '',
  fechaHasta: '',
  diaExacto: fechaHoyISO,
})
const rangoInvalido = ref(false)
const diaExactoManual = ref(false)
const pestanaActiva = ref('diario')
const paginacionDiario = reactive({ pagina: 1, tamanio: TAMANO_PAGINA })
const paginacionSesiones = reactive({ pagina: 1, tamanio: TAMANO_PAGINA })
const paginacionMensual = reactive({ pagina: 1, tamanio: TAMANO_PAGINA_MENSUAL })
const mesesExpandidos = ref(new Set())
let desuscribir = null
const $q = useQuasar()

const opcionesAniosValores = computed(() => {
  const anios = new Set([hoy.getFullYear()])
  historialDiario.value.forEach((item) => anios.add(new Date(`${item.fecha}T00:00:00`).getFullYear()))
  historialSesiones.value.forEach((sesion) => {
    if (sesion.inicio) {
      anios.add(new Date(sesion.inicio).getFullYear())
    }
  })
  return [...anios].sort((a, b) => b - a)
})

const textoEstadoMonitoreo = computed(() => {
  if (!esAndroidNativo) {
    return 'Modo navegador'
  }
  return estadoMonitoreo.value ? 'Monitoreo activo' : 'Monitoreo inactivo'
})

const NOMBRES_MESES = [
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

const etiquetaMesActual = computed(() => {
  const ahora = new Date()
  return `${NOMBRES_MESES[ahora.getMonth()]} ${ahora.getFullYear()}`
})

const resumenSemanaActual = computed(() => {
  const ahora = new Date()
  const inicioSemana = obtenerInicioSemanaLocal(ahora)
  const finSemana = obtenerFinSemanaLocal(ahora)
  return historialDiario.value
    .filter((item) => {
      const fechaItem = convertirFechaISOAFechaLocal(item.fecha)
      return fechaItem >= inicioSemana && fechaItem <= finSemana
    })
    .reduce((acumulado, item) => acumulado + Number(item.totalPasos || 0), 0)
})

const resumenMesActual = computed(() => {
  const ahora = new Date()
  const anioActual = ahora.getFullYear()
  const mesActual = ahora.getMonth()
  return historialDiario.value
    .filter((item) => {
      const fechaItem = convertirFechaISOAFechaLocal(item.fecha)
      return fechaItem.getFullYear() === anioActual && fechaItem.getMonth() === mesActual
    })
    .reduce((acumulado, item) => acumulado + Number(item.totalPasos || 0), 0)
})

const diarioFiltrado = computed(() => {
  const base = [...historialDiario.value].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
  return base.filter((item) => fechaCumpleFiltros(item.fecha, true))
})

const sesionesFiltradas = computed(() => {
  const base = [...historialSesiones.value].sort((a, b) => (a.inicio < b.inicio ? 1 : -1))
  return base.filter((sesion) => {
    if (!sesion.inicio) {
      return false
    }
    return fechaCumpleFiltros(obtenerFechaLocalISODesdeFecha(new Date(sesion.inicio)), true)
  })
})

const totalPaginasDiario = computed(() =>
  Math.max(1, Math.ceil(diarioFiltrado.value.length / paginacionDiario.tamanio)),
)
const totalPaginasSesiones = computed(() =>
  Math.max(1, Math.ceil(sesionesFiltradas.value.length / paginacionSesiones.tamanio)),
)
const totalPaginasMensual = computed(() =>
  Math.max(1, Math.ceil(mensualFiltrado.value.length / paginacionMensual.tamanio)),
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
const mensualPaginado = computed(() => {
  const inicio = (paginacionMensual.pagina - 1) * paginacionMensual.tamanio
  const fin = inicio + paginacionMensual.tamanio
  return mensualFiltrado.value.slice(inicio, fin)
})

const mensualFiltrado = computed(() => {
  const mapa = new Map()
  const baseMensual = [...historialDiario.value]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .filter((dia) => fechaCumpleFiltros(dia.fecha, true))
  baseMensual.forEach((dia) => {
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

watch([diarioFiltrado, sesionesFiltradas, mensualFiltrado], () => {
  paginacionDiario.pagina = Math.min(paginacionDiario.pagina, totalPaginasDiario.value)
  paginacionSesiones.pagina = Math.min(paginacionSesiones.pagina, totalPaginasSesiones.value)
  paginacionMensual.pagina = Math.min(paginacionMensual.pagina, totalPaginasMensual.value)
})

watch(
  () => ({ ...filtros.value }),
  () => {
    paginacionDiario.pagina = 1
    paginacionSesiones.pagina = 1
    paginacionMensual.pagina = 1
    mesesExpandidos.value = new Set()
  },
  { deep: true },
)

watch(
  () => filtros.value.diaExacto,
  (nuevoDia) => {
    diaExactoManual.value = Boolean(nuevoDia) && nuevoDia !== fechaHoyISO
  },
)

function convertirFechaISOAFechaLocal(fechaISO) {
  const [anio, mes, dia] = fechaISO.split('-').map(Number)
  return new Date(anio, mes - 1, dia, 0, 0, 0, 0)
}

function obtenerInicioSemanaLocal(fechaBase) {
  const fecha = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(), 0, 0, 0, 0)
  const diaSemana = fecha.getDay()
  const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1
  fecha.setDate(fecha.getDate() - diasDesdeLunes)
  return fecha
}

function obtenerFinSemanaLocal(fechaBase) {
  const inicioSemana = obtenerInicioSemanaLocal(fechaBase)
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(finSemana.getDate() + 6)
  finSemana.setHours(23, 59, 59, 999)
  return finSemana
}

function fechaCumpleFiltros(fechaISO, aplicarDiaExacto = true) {
  if (!fechaISO || rangoInvalido.value) {
    return false
  }
  const [anio, mes] = fechaISO.split('-').map(Number)
  if (filtros.value.anio && anio !== Number(filtros.value.anio)) {
    return false
  }
  if (filtros.value.mes && mes !== Number(filtros.value.mes)) {
    return false
  }
  if (aplicarDiaExacto && filtros.value.diaExacto && fechaISO !== filtros.value.diaExacto) {
    return false
  }
  if (filtros.value.fechaDesde && fechaISO < filtros.value.fechaDesde) {
    return false
  }
  if (filtros.value.fechaHasta && fechaISO > filtros.value.fechaHasta) {
    return false
  }
  return true
}

function limpiarFiltros() {
  filtros.value = {
    mes: hoy.getMonth() + 1,
    anio: hoy.getFullYear(),
    fechaDesde: '',
    fechaHasta: '',
    diaExacto: fechaHoyISO,
  }
  diaExactoManual.value = false
}

function manejarRangoInvalido(esInvalido) {
  rangoInvalido.value = esInvalido
}

function obtenerFechaHoyISO() {
  const anio = hoy.getFullYear()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function obtenerFechaLocalISODesdeFecha(fecha) {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
    return ''
  }
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
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
  if (!monitoreoHabilitado.value) {
    monitoreoHabilitado.value = true
    await cambiarMonitoreo(true)
  }
  const resultado = await servicioPasos.iniciarSesionManual()
  if (!resultado.ok) {
    $q.notify({ type: 'warning', message: 'Ya existe una sesión activa' })
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

async function cambiarMonitoreo(habilitado) {
  if (!esAndroidNativo) {
    monitoreoHabilitado.value = false
    estadoMonitoreo.value = false
    return
  }
  if (habilitado) {
    const resultado = await servicioPasos.iniciarMonitoreo()
    if (!resultado.ok) {
      monitoreoHabilitado.value = false
      estadoMonitoreo.value = false
      return
    }
  } else {
    await servicioPasos.detenerMonitoreo()
    if (estadoActual.sesionActiva) {
      await servicioPasos.detenerSesionManual()
    }
  }
  await servicioPasos.guardarPreferenciaMonitoreo(habilitado)
  await servicioPasos.refrescarEstadoDesdeNativo()
  await refrescarHistorial()
}

onMounted(async () => {
  monitoreoHabilitado.value = await servicioPasos.obtenerPreferenciaMonitoreo()
  if (monitoreoHabilitado.value) {
    await servicioPasos.iniciarMonitoreo()
  } else if (esAndroidNativo) {
    await servicioPasos.detenerMonitoreo()
  }
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
  margin-bottom: 0.8rem;
}
.bloque-monitoreo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.tarjeta-resumen-general {
  background: var(--color-fondo);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 14px;
}
.tarjetas-resumen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}
.tarjeta-resumen {
  background: color-mix(in oklab, var(--color-superficie) 80%, var(--color-fondo));
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  padding: 12px;
}
.etiqueta {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
.subetiqueta {
  margin: 2px 0 0 0;
  color: var(--color-texto-secundario);
  font-size: 0.75rem;
}
.valor {
  margin: 4px 0 0 0;
  color: var(--color-acento);
  font-size: 1.35rem;
  font-weight: 700;
}
.acciones-sesion {
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
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
@media (max-width: 560px) {
  .bloque-monitoreo {
    align-items: flex-start;
    flex-direction: column;
  }
  .acciones-sesion {
    gap: 8px;
  }
}
</style>
