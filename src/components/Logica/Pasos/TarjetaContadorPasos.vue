<template>
  <div class="contenedor-contador-pasos">
    <div class="tarjeta-inicio-modulo" @click="irAContador">
      <div class="tarjeta-inicio-icono">
        <IconPaw :size="48" :stroke="1.5" />
      </div>
      <h3 class="tarjeta-inicio-titulo">Contador de pasos</h3>
      <p class="tarjeta-inicio-descripcion">Monitorea pasos diarios</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { IconPaw } from '@tabler/icons-vue'

const router = useRouter()

const irAContador = () => {
  router.push('/ContadorPasos')
}
</script>

<style scoped>
.contenedor-contador-pasos {
  width: 100%;
}
</style>
