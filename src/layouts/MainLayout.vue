<template>
  <div class="fondo-app texto-principal">
    <q-layout view="lHh Lpr lff">
      <q-header elevated :class="claseHeader">
        <q-toolbar class="barra-superior">
          <q-toolbar-title class="titulo-usuario">
            <span
              class="titulo-usuario-clickable"
              :title="nombreUsuario"
              role="button"
              tabindex="0"
              @click="irAConfiguracionParaEditarNombre"
              @keyup.enter="irAConfiguracionParaEditarNombre"
            >
              {{ nombreUsuario }}
            </span>
          </q-toolbar-title>
          <div class="pasos-header" :class="{ 'sesion-activa': sesionActivaHeader }" :title="textoPasosHeader">
            <IconPaw :size="16" :stroke="2" />
            <span>{{ valorPasosHeader }}</span>
          </div>
          <div class="contenedor-boton-menu">
            <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
            <span v-if="hayActualizacionDisponible" class="indicador-actualizacion-menu"></span>
          </div>
        </q-toolbar>
      </q-header>
      <q-drawer v-model="drawer" :width="200" class="bg-superficie texto-principal">
        <q-scroll-area
          style="
            height: calc(100% - 200px);
            margin-top: 150px;
            border-right: 1px solid var(--color-borde);
          "
        >
          <q-list padding>
            <q-item clickable v-ripple to="/TablaPedidos">
              <q-item-section avatar>
                <IconTableRow :stroke="2" />
              </q-item-section>
              <q-item-section>Pedidos</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/AjustarUbicaciones">
              <q-item-section avatar>
                <IconMapRoute :stroke="2" />
              </q-item-section>
              <q-item-section>Ubicaciones</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/ConsultaDeUbicacion">
              <q-item-section avatar>
                <IconSearch :stroke="2" />
              </q-item-section>
              <q-item-section>Consulta de Ubicación</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/stock">
              <q-item-section avatar>
                <IconPackages :stroke="2" />
              </q-item-section>
              <q-item-section>Stock</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/etiquetas">
              <q-item-section avatar>
                <IconTag :stroke="2" />
              </q-item-section>
              <q-item-section>Etiquetas</q-item-section>
            </q-item>
            <q-item clickable v-ripple to="/ContadorPasos">
              <q-item-section avatar>
                <IconPaw :stroke="2" />
              </q-item-section>
              <q-item-section>Contador de pasos</q-item-section>
            </q-item>
            <q-item
              v-if="hayActualizacionDisponible"
              clickable
              v-ripple
              class="item-actualizacion"
              @click="irAPlayStore"
            >
              <q-item-section avatar>
                <IconDownload :stroke="2" class="icono-actualizacion" />
              </q-item-section>
              <q-item-section>Actualización disponible</q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
        <q-img
          class="absolute-top"
          src="https://cdn.quasar.dev/img/material.png"
          style="height: 150px"
        >
          <div class="absolute-bottom bg-transparent texto-secundario cabecera-drawer-usuario">
            <div class="datos-usuario-drawer">
              <q-avatar size="56px" class="q-mb-sm">
                <img src="https://cdn.quasar.dev/img/boy-avatar.png" />
              </q-avatar>
              <div class="text-weight-bold">Bitácora II</div>
              <div
                class="titulo-usuario-clickable"
                role="button"
                tabindex="0"
                @click="irAConfiguracionParaEditarNombre"
                @keyup.enter="irAConfiguracionParaEditarNombre"
              >
                @{{ nombreUsuario }}
              </div>
            </div>
            <div class="resumen-pasos-drawer">
              <div class="linea-pasos-drawer">
                <IconPaw :size="14" :stroke="2" />
                <span>{{ pasosDiaHeader }}</span>
              </div>
              <div v-if="sesionActivaHeader" class="linea-pasos-drawer sesion-activa">
                <IconPaw :size="14" :stroke="2" />
                <span>{{ pasosSesionHeader }}</span>
              </div>
            </div>
          </div>
        </q-img>
        <div class="drawer-footer">
          <q-item clickable v-ripple to="/configuracion" class="item-configuracion">
            <q-item-section avatar>
              <IconSettings :stroke="2" class="icono-config" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="texto-config">Configuración</q-item-label>
            </q-item-section>
          </q-item>
        </div>
      </q-drawer>
      <q-page-container
        class="fondo-app texto-principal contenedor-con-barra-inferior"
        :style="estiloContenedorConBarra"
      >
        <router-view @configurar-barra="manejarConfiguracionBarra" />
      </q-page-container>
      <BarraBotonesInferior
        :mostrar-agregar="configuracionBarra.mostrarAgregar"
        :mostrar-enviar="configuracionBarra.mostrarEnviar"
        :puede-enviar="configuracionBarra.puedeEnviar"
        :botones-personalizados="configuracionBarra.botonesPersonalizados"
        :hay-banner-visible="hayBannerVisible"
        :modal-activo="modalActivo"
        :style="estiloBarraInferior"
        @agregar="manejarAgregar"
        @enviar="manejarEnviar"
        @accion-personalizada="manejarAccionPersonalizada"
      />
      <BannerAdMob @banner-visible="actualizarEstadoBanner" @banner-altura="actualizarAlturaBanner" />
      <q-dialog v-model="mostrarModalActualizacion">
        <q-card class="tarjeta-actualizacion">
          <q-card-section>
            <div class="titulo-actualizacion">Hay una actualización disponible</div>
            <div class="detalle-actualizacion">
              Tu versión: {{ versionInstalada }} | Nueva versión: {{ versionDisponible }}
            </div>
            <div class="aviso-tiempo-actualizacion">
              <q-icon name="schedule" size="16px" />
              <span>La actualización puede demorar hasta 20 minutos en aparecer en Play Store.</span>
            </div>
            <!-- Notas de parche: cargar desde version.json como grupos con apartado y novedades. -->
            <!-- La IA debe agrupar las novedades con subtítulos según los apartados afectados de la app. -->
            <!-- Si una mejora es compartida, nombrar todos los apartados afectados antes de describirla. -->
            <!-- Usar texto corto y claro; Leo decide qué líneas conservar antes de publicar. -->
            <div v-if="cambiosActualizacion.length" class="seccion-cambios-actualizacion">
              <div class="titulo-cambios-actualizacion">Novedades de esta versión</div>
              <div
                v-for="(grupoCambios, indice) in cambiosActualizacion"
                :key="`grupo-cambios-${indice}`"
                class="grupo-cambios-actualizacion"
              >
                <div v-if="grupoCambios.apartado" class="subtitulo-cambios-actualizacion">
                  {{ grupoCambios.apartado }}
                </div>
                <ul class="lista-cambios-actualizacion">
                  <li
                    v-for="(novedad, indiceNovedad) in grupoCambios.novedades"
                    :key="`novedad-${indice}-${indiceNovedad}`"
                  >
                    {{ novedad }}
                  </li>
                </ul>
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancelar" @click="mostrarModalActualizacion = false" />
            <q-btn
              unelevated
              class="boton-actualizar"
              label="Actualizar"
              @click="irAPlayStore"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-layout>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  IconTableRow,
  IconMapRoute,
  IconSearch,
  IconPackages,
  IconTag,
  IconSettings,
  IconDownload,
  IconPaw,
} from '@tabler/icons-vue'
import BarraBotonesInferior from 'components/Botones/BarraBotonesInferior.vue'
import BannerAdMob from 'components/AdMob/BannerAdMob.vue'
import { esModoPruebaPublicidad } from 'components/Configuracion/ConfiguracionPublicidad.js'
import { obtenerNombreUsuario } from 'components/BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import {
  obtenerEstadoActualizacion,
  abrirActualizacionEnTienda,
} from 'components/Actualizacion/ServicioActualizacionApp.js'
import { servicioPasos } from 'src/components/Logica/Pasos/ServicioPasos.js'
import {
  configurarEstadoBotonAtrasNativo,
  limpiarEstadoBotonAtrasNativo,
} from 'src/components/Logica/Navegacion/ServicioBotonAtrasNativo.js'

const drawer = ref(false)
const router = useRouter()
const nombreUsuario = ref('Usuario desconocido')
const hayBannerVisible = ref(false)
const modalActivo = ref(false)
const hayActualizacionDisponible = ref(false)
const mostrarModalActualizacion = ref(false)
const versionDisponible = ref('')
const versionInstalada = ref('')
const urlPlayStoreActualizacion = ref('')
const cambiosActualizacion = ref([])
const pasosDiaHeader = ref(0)
const pasosSesionHeader = ref(0)
const sesionActivaHeader = ref(false)
const anchoPantalla = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
const alturaBannerReportada = ref(0)
const ESPACIO_BASE_BARRA = 8
const SEPARACION_BARRA_BANNER = 4
const ESPACIO_EXTRA_CONTENIDO = 16
const configuracionBarra = reactive({
  mostrarAgregar: false,
  mostrarEnviar: false,
  puedeEnviar: true,
  botonesPersonalizados: [],
})
let paginaActivaRef = null
let desuscribirPasos = null
const claseHeader = esModoPruebaPublicidad
  ? 'header-modo-prueba texto-principal'
  : 'bg-primario-oscuro texto-principal'

onMounted(async () => {
  configurarEstadoBotonAtrasNativo({
    estaDrawerAbierto: () => drawer.value,
    cerrarDrawer: () => {
      drawer.value = false
    },
    obtenerRutaActual: () => router.currentRoute.value.path,
    obtenerManejadorPagina: () => paginaActivaRef?.onAtrasNativo,
  })
  await Promise.all([cargarNombreUsuario(), verificarActualizacion()])
  setInterval(cargarNombreUsuario, 5000)
  const monitoreoHabilitado = await servicioPasos.obtenerPreferenciaMonitoreo()
  if (monitoreoHabilitado) {
    await servicioPasos.iniciarMonitoreo()
  } else if (servicioPasos.esAndroidNativo()) {
    // Refuerzo: si la preferencia está apagada, cortamos cualquier reactivación residual.
    await servicioPasos.detenerMonitoreo()
  }
  await servicioPasos.refrescarEstadoDesdeNativo()
  desuscribirPasos = servicioPasos.suscribir((estado) => {
    pasosDiaHeader.value = estado.pasosDia
    pasosSesionHeader.value = estado.pasosSesion
    sesionActivaHeader.value = estado.sesionActiva
  })
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', actualizarDimensionesPantalla)
  }
})

onUnmounted(() => {
  limpiarEstadoBotonAtrasNativo()
  if (desuscribirPasos) {
    desuscribirPasos()
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', actualizarDimensionesPantalla)
  }
})

const textoPasosHeader = computed(() => {
  if (sesionActivaHeader.value) {
    return `Sesión: ${pasosSesionHeader.value}`
  }
  return `Pasos hoy: ${pasosDiaHeader.value}`
})
const valorPasosHeader = computed(() =>
  sesionActivaHeader.value ? pasosSesionHeader.value : pasosDiaHeader.value,
)
const alturaBannerActiva = computed(() => (hayBannerVisible.value ? alturaBannerReportada.value : 0))
const posicionInferiorBarra = computed(() => {
  if (!hayBannerVisible.value) {
    return `calc(${ESPACIO_BASE_BARRA}px + env(safe-area-inset-bottom, 0px))`
  }
  return `${alturaBannerActiva.value + SEPARACION_BARRA_BANNER}px`
})
const estiloBarraInferior = computed(() => ({
  '--posicion-inferior-barra': posicionInferiorBarra.value,
}))
const estiloContenedorConBarra = computed(() => {
  const altoBarra = anchoPantalla.value <= 480 ? 56 : 60
  const espacioInferior = hayBannerVisible.value
    ? alturaBannerActiva.value + SEPARACION_BARRA_BANNER
    : ESPACIO_BASE_BARRA
  const paddingCalculado = altoBarra + espacioInferior + ESPACIO_EXTRA_CONTENIDO
  const safeAreaInferior = hayBannerVisible.value ? '0px' : 'env(safe-area-inset-bottom, 0px)'
  return { paddingBottom: `calc(${paddingCalculado}px + ${safeAreaInferior})` }
})

const cargarNombreUsuario = async () => {
  try {
    const nombre = await obtenerNombreUsuario()
    nombreUsuario.value = nombre
  } catch (error) {
    console.error('Error al cargar nombre de usuario:', error)
    nombreUsuario.value = 'Usuario desconocido'
  }
}

const verificarActualizacion = async () => {
  const estadoActualizacion = await obtenerEstadoActualizacion()
  hayActualizacionDisponible.value = estadoActualizacion.hayActualizacion
  mostrarModalActualizacion.value = estadoActualizacion.debeMostrarModal
  versionDisponible.value = estadoActualizacion.versionDisponible
  versionInstalada.value = estadoActualizacion.versionInstalada
  urlPlayStoreActualizacion.value = estadoActualizacion.urlPlayStore
  cambiosActualizacion.value = Array.isArray(estadoActualizacion.cambios)
    ? estadoActualizacion.cambios
    : []
}

const irAPlayStore = () => {
  abrirActualizacionEnTienda(urlPlayStoreActualizacion.value)
}

const irAConfiguracionParaEditarNombre = async () => {
  drawer.value = false
  await router.push({ name: 'Configuracion', query: { editarNombre: '1' } })
}

const actualizarEstadoBanner = (estaVisible) => {
  hayBannerVisible.value = estaVisible
  if (!estaVisible) {
    alturaBannerReportada.value = 0
  }
}

const actualizarAlturaBanner = (altura) => {
  const alturaNumerica = Number(altura)
  if (Number.isFinite(alturaNumerica) && alturaNumerica >= 0) {
    alturaBannerReportada.value = alturaNumerica
    hayBannerVisible.value = alturaNumerica > 0
  }
}

const actualizarDimensionesPantalla = () => {
  if (typeof window === 'undefined') {
    return
  }
  anchoPantalla.value = window.innerWidth
}

const manejarConfiguracionBarra = (configuracion, refPagina) => {
  Object.assign(configuracionBarra, configuracion)
  paginaActivaRef = refPagina
  if (configuracion.modalActivo !== undefined) {
    modalActivo.value = configuracion.modalActivo
  }
}

const manejarAgregar = () => {
  if (paginaActivaRef?.onAgregar) {
    paginaActivaRef.onAgregar()
  }
}

const manejarEnviar = () => {
  if (paginaActivaRef?.onEnviar) {
    paginaActivaRef.onEnviar()
  }
}

const manejarAccionPersonalizada = (accion) => {
  if (paginaActivaRef?.onAccionPersonalizada) {
    paginaActivaRef.onAccionPersonalizada(accion)
  }
}
</script>

<style scoped>
.contenedor-con-barra-inferior {
  padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
}
.barra-superior {
  position: relative;
  min-height: 56px;
}
.header-modo-prueba {
  background: linear-gradient(135deg, var(--color-carga) 0%, var(--color-carga-claro) 100%);
  box-shadow: 0 2px 14px color-mix(in oklab, var(--color-carga) 35%, transparent);
}
.titulo-usuario {
  max-width: calc(100% - 120px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
}
.titulo-usuario-clickable {
  display: inline-block;
  width: fit-content;
  cursor: pointer;
  border-radius: 6px;
  padding: 2px 6px;
  transition: background-color 0.2s ease, transform 0.12s ease, box-shadow 0.2s ease;
}
.titulo-usuario-clickable:hover {
  background: color-mix(in oklab, var(--color-texto-principal) 16%, transparent);
  box-shadow: 0 2px 8px color-mix(in oklab, var(--color-fondo) 40%, transparent);
}
.titulo-usuario-clickable:active {
  transform: scale(0.97);
  background: color-mix(in oklab, var(--color-texto-principal) 24%, transparent);
}
.titulo-usuario-clickable:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}
.pasos-header {
  position: absolute;
  left: clamp(46%, 52%, 58%);
  transform: translateX(-50%);
  max-width: 96px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-texto-principal);
  pointer-events: none;
  z-index: 1;
}
.pasos-header.sesion-activa {
  color: var(--color-exito);
}
.contenedor-boton-menu {
  position: relative;
  margin-left: auto;
  z-index: 2;
}
.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-superficie);
  border-top: 1px solid var(--color-borde);
  padding-top: 10px;
}
.item-configuracion {
  padding: 16px;
  margin-bottom: 30px;
  transition: all 0.3s ease;
}
.item-configuracion:hover {
  background: var(--color-fondo);
}
.icono-config {
  color: var(--color-primario);
  transition: transform 0.3s ease;
}
.item-configuracion:hover .icono-config {
  transform: rotate(90deg);
}
.texto-config {
  color: var(--color-texto-principal);
  font-weight: 500;
}
.indicador-actualizacion-menu {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--color-error);
  box-shadow: 0 0 8px var(--color-error);
}
.item-actualizacion {
  background: color-mix(in oklab, var(--color-error) 16%, var(--color-superficie));
  border: 1px solid color-mix(in oklab, var(--color-error) 45%, var(--color-borde));
  border-radius: 10px;
  margin: 8px;
}
.icono-actualizacion {
  color: var(--color-error);
}
.tarjeta-actualizacion {
  width: min(90vw, 430px);
  border: 1px solid var(--color-borde);
  background: var(--color-superficie);
  color: var(--color-texto-principal);
}
.titulo-actualizacion {
  font-size: 1.05rem;
  font-weight: 700;
}
.detalle-actualizacion {
  margin-top: 8px;
  color: var(--color-texto-secundario);
}
.aviso-tiempo-actualizacion {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.87rem;
  color: var(--color-texto-secundario);
}
.seccion-cambios-actualizacion {
  margin-top: 12px;
}
.titulo-cambios-actualizacion {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-texto-principal);
}
.grupo-cambios-actualizacion {
  margin-top: 8px;
}
.subtitulo-cambios-actualizacion {
  font-size: 0.87rem;
  font-weight: 600;
  color: var(--color-texto-principal);
}
.lista-cambios-actualizacion {
  margin: 4px 0 0 0;
  padding-left: 18px;
  color: var(--color-texto-secundario);
}
.lista-cambios-actualizacion li + li {
  margin-top: 4px;
}
.boton-actualizar {
  background: var(--color-error);
  color: var(--color-texto-principal);
}
.cabecera-drawer-usuario {
  position: relative;
  min-height: 98px;
  padding: 8px 12px 10px 12px;
}
.datos-usuario-drawer {
  max-width: 118px;
  padding-right: 6px;
}
.resumen-pasos-drawer {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 2;
}
.linea-pasos-drawer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-texto-principal);
  background: color-mix(in oklab, var(--color-fondo) 72%, transparent);
  border: 1px solid color-mix(in oklab, var(--color-borde) 65%, transparent);
  border-radius: 999px;
  padding: 2px 7px;
  box-shadow: 0 2px 8px color-mix(in oklab, var(--color-fondo) 45%, transparent);
  backdrop-filter: blur(1px);
}
.linea-pasos-drawer.sesion-activa {
  color: var(--color-exito);
  border-color: color-mix(in oklab, var(--color-exito) 55%, var(--color-borde));
}
@media (max-width: 400px) {
  .pasos-header {
    max-width: 86px;
    font-size: 0.78rem;
    left: clamp(44%, 50%, 56%);
  }
  .titulo-usuario {
    max-width: calc(100% - 104px);
  }
  .drawer-footer {
    padding: 8px;
  }
  .item-configuracion {
    padding: 12px;
  }
  .linea-pasos-drawer {
    font-size: 0.72rem;
  }
  .cabecera-drawer-usuario {
    min-height: 94px;
    padding: 8px 10px 8px 10px;
  }
  .resumen-pasos-drawer {
    top: 8px;
    right: 8px;
  }
}
</style>
