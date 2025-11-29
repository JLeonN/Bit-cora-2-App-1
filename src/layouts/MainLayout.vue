<template>
  <div class="fondo-app texto-principal">
    <q-layout view="lHh Lpr lff">
      <!-- HEADER CON NOMBRE DE USUARIO DINÁMICO -->
      <q-header elevated class="bg-primario-oscuro texto-principal">
        <q-toolbar class="barra-superior">
          <q-toolbar-title>{{ nombreUsuario }}</q-toolbar-title>
          <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
        </q-toolbar>
      </q-header>

      <!-- DRAWER CON NAVEGACIÓN Y CONFIGURACIÓN -->
      <q-drawer v-model="drawer" :width="200" class="bg-superficie texto-principal">
        <!-- ÁREA DE NAVEGACIÓN PRINCIPAL -->
        <q-scroll-area
          style="
            height: calc(100% - 200px);
            margin-top: 150px;
            border-right: 1px solid var(--color-borde);
          "
        >
          <q-list padding>
            <!-- PEDIDOS -->
            <q-item clickable v-ripple to="/TablaPedidos">
              <q-item-section avatar>
                <IconTableRow :stroke="2" />
              </q-item-section>
              <q-item-section>Pedidos</q-item-section>
            </q-item>

            <!-- UBICACIONES -->
            <q-item clickable v-ripple to="/AjustarUbicaciones">
              <q-item-section avatar>
                <IconMapRoute :stroke="2" />
              </q-item-section>
              <q-item-section>Ubicaciones</q-item-section>
            </q-item>

            <!-- ETIQUETAS -->
            <q-item clickable v-ripple to="/etiquetas">
              <q-item-section avatar>
                <IconTag :stroke="2" />
              </q-item-section>
              <q-item-section>Etiquetas</q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <!-- HEADER DEL DRAWER CON AVATAR Y INFO -->
        <q-img
          class="absolute-top"
          src="https://cdn.quasar.dev/img/material.png"
          style="height: 150px"
        >
          <div class="absolute-bottom bg-transparent texto-secundario">
            <q-avatar size="56px" class="q-mb-sm">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png" />
            </q-avatar>
            <div class="text-weight-bold">Bitácora II</div>
            <div>@{{ nombreUsuario }}</div>
          </div>
        </q-img>

        <!-- FOOTER DEL DRAWER CON CONFIGURACIÓN -->
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

      <!-- CONTENIDO PRINCIPAL -->
      <q-page-container class="fondo-app texto-principal contenedor-con-barra-inferior">
        <router-view @configurar-barra="manejarConfiguracionBarra" />
      </q-page-container>

      <!-- BARRA DE BOTONES INFERIOR -->
      <BarraBotonesInferior
        :mostrar-agregar="configuracionBarra.mostrarAgregar"
        :mostrar-enviar="configuracionBarra.mostrarEnviar"
        :puede-enviar="configuracionBarra.puedeEnviar"
        :botones-personalizados="configuracionBarra.botonesPersonalizados"
        :hay-banner-visible="hayBannerVisible"
        @agregar="manejarAgregar"
        @enviar="manejarEnviar"
        @accion-personalizada="manejarAccionPersonalizada"
      />

      <!-- BANNER DE ADMOB -->
      <BannerAdMob @banner-visible="actualizarEstadoBanner" />
    </q-layout>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { IconTableRow, IconMapRoute, IconTag, IconSettings } from '@tabler/icons-vue'
import BarraBotonesInferior from 'components/Botones/BarraBotonesInferior.vue'
import BannerAdMob from 'components/AdMob/BannerAdMob.vue'
import { obtenerNombreUsuario } from 'components/BaseDeDatos/usoAlmacenamientoConfiguracion.js'

const drawer = ref(false)

// NOMBRE DE USUARIO REACTIVO
const nombreUsuario = ref('Usua desconocido')

// Estado del banner
const hayBannerVisible = ref(false)

// Estado centralizado de la barra inferior
const configuracionBarra = reactive({
  mostrarAgregar: false,
  mostrarEnviar: false,
  puedeEnviar: true,
  botonesPersonalizados: [],
})

// Referencia para emitir eventos a la página activa
let paginaActivaRef = null

// CARGAR NOMBRE DE USUARIO AL MONTAR
onMounted(async () => {
  await cargarNombreUsuario()

  // Actualizar nombre cada 5 segundos por si cambió en configuración
  setInterval(cargarNombreUsuario, 5000)
})

// MÉTODOS PARA NOMBRE DE USUARIO
const cargarNombreUsuario = async () => {
  try {
    const nombre = await obtenerNombreUsuario()
    nombreUsuario.value = nombre
  } catch (error) {
    console.error('Error al cargar nombre de usuario:', error)
    nombreUsuario.value = 'Usua desconocido'
  }
}

// Método para actualizar estado del banner
const actualizarEstadoBanner = (estaVisible) => {
  hayBannerVisible.value = estaVisible
}

// Método para que las páginas configuren la barra
const manejarConfiguracionBarra = (configuracion, refPagina) => {
  Object.assign(configuracionBarra, configuracion)
  paginaActivaRef = refPagina
}

// Métodos que se ejecutan cuando se presionan los botones
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
/* Contenedor con padding para barra inferior Y banner */
.contenedor-con-barra-inferior {
  padding-bottom: 140px; /* 80px botones + 60px banner */
}

/* FOOTER DEL DRAWER */
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
/* RESPONSIVE PARA DRAWER */
@media (max-width: 400px) {
  .drawer-footer {
    padding: 8px;
  }
  .item-configuracion {
    padding: 12px;
  }
}
</style>
