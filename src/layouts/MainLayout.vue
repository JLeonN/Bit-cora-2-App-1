<template>
  <div class="fondo-app texto-principal">
    <q-layout view="lHh Lpr lff">
      <q-header elevated class="bg-primario-oscuro texto-principal">
        <q-toolbar class="barra-superior">
          <q-toolbar-title>Bitácora II</q-toolbar-title>
          <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
        </q-toolbar>
      </q-header>

      <q-drawer
        v-model="drawer"
        show-if-above
        :width="200"
        :breakpoint="400"
        class="bg-superficie texto-principal"
      >
        <q-scroll-area
          style="
            height: calc(100% - 150px);
            margin-top: 150px;
            border-right: 1px solid var(--color-borde);
          "
        >
          <q-list padding>
            <!-- Tabla pedidos -->
            <q-item clickable v-ripple to="/TablaPedidos">
              <q-item-section avatar>
                <IconTableRow stroke="{1}" />
              </q-item-section>
              <q-item-section>Pedidos</q-item-section>
            </q-item>

            <!-- Ubicaciones -->
            <q-item clickable v-ripple to="/AjustarUbicaciones">
              <q-item-section avatar>
                <IconMapRoute name="send" />
              </q-item-section>
              <q-item-section>Ubicaciones</q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
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
            <div>@Bitácora II</div>
          </div>
        </q-img>
      </q-drawer>

      <q-page-container class="fondo-app texto-principal contenedor-con-barra-inferior">
        <router-view @configurar-barra="manejarConfiguracionBarra" />
      </q-page-container>

      <!-- NUEVA: Barra de botones inferior siempre visible -->
      <BarraBotonesInferior
        :mostrar-agregar="configuracionBarra.mostrarAgregar"
        :mostrar-enviar="configuracionBarra.mostrarEnviar"
        :puede-enviar="configuracionBarra.puedeEnviar"
        :botones-personalizados="configuracionBarra.botonesPersonalizados"
        @agregar="manejarAgregar"
        @enviar="manejarEnviar"
        @accion-personalizada="manejarAccionPersonalizada"
      />
    </q-layout>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { IconTableRow, IconMapRoute } from '@tabler/icons-vue'
import BarraBotonesInferior from 'components/Botones/BarraBotonesInferior.vue'

const drawer = ref(false)

// Estado centralizado de la barra inferior
const configuracionBarra = reactive({
  mostrarAgregar: false,
  mostrarEnviar: false,
  puedeEnviar: true,
  botonesPersonalizados: [],
})

// Referencia para emitir eventos a la página activa
let paginaActivaRef = null

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
/* Agregamos padding-bottom para que el contenido no quede tapado por la barra */
.contenedor-con-barra-inferior {
  padding-bottom: 80px;
}
</style>
