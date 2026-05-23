<template>
  <div class="contenedor-contador-pasos">
    <div class="tarjeta-contador-pasos" @click="irAContador">
      <div class="encabezado-tarjeta">
        <IconActivity :stroke="2" class="icono-pasos" />
        <h3>Contador de pasos</h3>
      </div>
      <p class="resumen-linea"><span>Pasos hoy:</span> <strong>{{ pasosDia }}</strong></p>
      <p v-if="sesionActiva" class="resumen-linea sesion-activa">
        <span>Sesión activa:</span> <strong>{{ pasosSesion }}</strong>
      </p>
      <p v-else class="resumen-linea">
        <span>Sesión activa:</span> <strong>No</strong>
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconActivity } from '@tabler/icons-vue'
import { servicioPasos } from './ServicioPasos.js'

const router = useRouter()
const pasosDia = ref(0)
const pasosSesion = ref(0)
const sesionActiva = ref(false)
let desuscribir = null

const irAContador = () => {
  router.push('/ContadorPasos')
}

onMounted(async () => {
  await servicioPasos.refrescarEstadoDesdeNativo()
  desuscribir = servicioPasos.suscribir((estado) => {
    pasosDia.value = estado.pasosDia
    pasosSesion.value = estado.pasosSesion
    sesionActiva.value = estado.sesionActiva
  })
})

onUnmounted(() => {
  if (desuscribir) {
    desuscribir()
  }
})
</script>

<style scoped>
.contenedor-contador-pasos {
  width: 100%;
}
.tarjeta-contador-pasos {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 1.4rem;
  box-shadow: 0 2px 8px var(--sombra-boton);
  cursor: pointer;
  transition: all 0.3s ease;
}
.tarjeta-contador-pasos:hover {
  border-color: var(--color-primario);
  transform: translateY(-3px);
}
.encabezado-tarjeta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.icono-pasos {
  color: var(--color-primario);
}
.encabezado-tarjeta h3 {
  margin: 0;
  color: var(--color-texto-principal);
  font-size: 1.2rem;
}
.resumen-linea {
  margin: 6px 0;
  color: var(--color-texto-secundario);
  font-size: 0.95rem;
}
.resumen-linea strong {
  color: var(--color-acento);
}
.sesion-activa strong {
  color: var(--color-exito);
}
</style>

