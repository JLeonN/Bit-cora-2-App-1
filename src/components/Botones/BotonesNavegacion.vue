<template>
  <div class="navegacion-flotante-horizontal">
    <button class="boton-circular" @click="volverAtras">
      <IconChevronLeft size="24" stroke="2" />
    </button>

    <button class="boton-circular" @click="irAlInicio">
      <IconHome size="24" stroke="2" />
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { IconHome, IconChevronLeft } from '@tabler/icons-vue'

const router = useRouter()

const volverAtras = () => {
  router.back()
}

const irAlInicio = () => {
  router.push('/')
}
</script>

<style scoped>
.navegacion-flotante-horizontal {
  position: fixed;
  bottom: 2.5rem; /* separa del borde inferior */
  left: 50%; /* centro horizontal */
  transform: translateX(-50%); /* ajusta para que quede centrado */
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: calc(48px * 2 + 1rem);
  justify-content: center;
  z-index: 999;
}

.boton-circular {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-primario);
  color: var(--color-texto-principal);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: background-color 0.2s ease;
}

.boton-circular:hover {
  background-color: var(--color-primario-oscuro);
}
</style>
