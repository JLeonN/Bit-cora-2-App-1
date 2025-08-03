<template>
  <q-page class="pagina-inicio">
    <div class="contenedor-botones">
      <!-- Botón: Ir a pedidos -->
      <button class="boton-inicio" @click="irAPedidos">
        <IconTableRow class="icono-boton" />
        Mis pedidos
      </button>

      <!-- Botón desactivado: ubicación -->
      <!-- <button class="boton-inicio boton-desactivado" disabled>
        <IconMapPin class="icono-boton" />
        Enviar ubicación
      </button> -->

      <!-- Botón desactivado: ajustar stock -->
      <!-- <button class="boton-inicio boton-desactivado" disabled>
        <IconAdjustmentsHorizontal class="icono-boton" />
        Ajustar stock
      </button> -->
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  IconTableRow,
  // IconMapPin,
  // IconAdjustmentsHorizontal
} from '@tabler/icons-vue'

const router = useRouter()

const irAPedidos = () => {
  router.push('/TablaPedidos')
}
</script>
