<template>
  <div class="fondo-app texto-principal">
    <q-layout view="lHh Lpr lff">
      <q-header elevated :class="claseHeader">
        <q-toolbar class="barra-superior">
          <q-toolbar-title class="titulo-usuario" :title="nombreUsuario">{{ nombreUsuario }}</q-toolbar-title>
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
              <div>@{{ nombreUsuario }}</div>
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
      <q-page-container class="fondo-app texto-principal contenedor-con-barra-inferior">
        <router-view @configurar-barra="manejarConfiguracionBarra" />
      </q-page-container>
      <BarraBotonesInferior
        :mostrar-agregar="configuracionBarra.mostrarAgregar"
        :mostrar-enviar="configuracionBarra.mostrarEnviar"
        :puede-enviar="configuracionBarra.puedeEnviar"
        :botones-personalizados="configuracionBarra.botonesPersonalizados"
        :hay-banner-visible="hayBannerVisible"
        :modal-activo="modalActivo"
        @agregar="manejarAgregar"
        @enviar="manejarEnviar"
        @accion-personalizada="manejarAccionPersonalizada"
      />
      <BannerAdMob @banner-visible="actualizarEstadoBanner" />
      <q-dialog v-model="mostrarModalActualizacion">
        <q-card class="tarjeta-actualizacion">
          <q-card-section>
            <div class="titulo-actualizacion">Hay una actualización disponible</div>
            <div class="detalle-actualizacion">
              Tu versión: {{ versionInstalada }} | Nueva versión: {{ versionDisponible }}
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
import {
  IconTableRow,
  IconMapRoute,
  IconSearch,
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

const drawer = ref(false)
const nombreUsuario = ref('Usuario desconocido')
const hayBannerVisible = ref(false)
const modalActivo = ref(false)
const hayActualizacionDisponible = ref(false)
const mostrarModalActualizacion = ref(false)
const versionDisponible = ref('')
const versionInstalada = ref('')
const urlPlayStoreActualizacion = ref('')
const pasosDiaHeader = ref(0)
const pasosSesionHeader = ref(0)
const sesionActivaHeader = ref(false)
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
})

onUnmounted(() => {
  if (desuscribirPasos) {
    desuscribirPasos()
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
}

const irAPlayStore = () => {
  abrirActualizacionEnTienda(urlPlayStoreActualizacion.value)
}

const actualizarEstadoBanner = (estaVisible) => {
  hayBannerVisible.value = estaVisible
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
  padding-bottom: 140px;
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
