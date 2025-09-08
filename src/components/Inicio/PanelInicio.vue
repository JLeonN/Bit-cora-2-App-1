<template>
  <q-page class="pagina-inicio">
    <div class="contenedor-botones">
      <!-- Botón: Ir a pedidos. -->
      <button class="boton-inicio" @click="irAPedidos">
        <IconTableRow class="icono-boton" />
        Mis pedidos
      </button>

      <!-- Botón Ubicaciones -->
      <button class="boton-inicio" @click="IrAjustarUbicaciones">
        <IconMapRoute class="icono-boton" />
        Ubicaciones
      </button>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { IconTableRow, IconMapRoute } from '@tabler/icons-vue'

const router = useRouter()

const irAPedidos = () => {
  router.push('/TablaPedidos')
}
const IrAjustarUbicaciones = () => {
  router.push('/AjustarUbicaciones')
}
</script>
