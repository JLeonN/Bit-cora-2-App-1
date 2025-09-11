<template>
  <div class="barra-navegacion-inferior">
    <!-- Botón Atrás -->
    <button v-if="mostrarAtras" class="boton-barra" @click="volverAtras" title="Volver atrás">
      <IconChevronLeft size="20" stroke="2" />
    </button>

    <!-- Botón Inicio -->
    <button v-if="mostrarInicio" class="boton-barra" @click="irAlInicio" title="Ir al inicio">
      <IconHome size="20" stroke="2" />
    </button>

    <!-- Botón Enviar -->
    <button
      v-if="mostrarEnviar"
      class="boton-barra"
      :class="{ 'boton-desactivado': !puedeEnviar }"
      :disabled="!puedeEnviar"
      @click="enviarDatos"
      title="Enviar datos"
    >
      <IconSend size="20" stroke="2" />
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { IconHome, IconChevronLeft, IconSend } from '@tabler/icons-vue'

const router = useRouter()

// Props
const props = defineProps({
  mostrarAtras: {
    type: Boolean,
    default: true,
  },
  mostrarInicio: {
    type: Boolean,
    default: true,
  },
  mostrarEnviar: {
    type: Boolean,
    default: false,
  },
  puedeEnviar: {
    type: Boolean,
    default: true,
  },
})

// Emits
const emit = defineEmits(['enviar'])

// Métodos de navegación
const volverAtras = () => {
  router.back()
}

const irAlInicio = () => {
  router.push('/')
}

const enviarDatos = () => {
  if (props.puedeEnviar) {
    emit('enviar')
  }
}
</script>

<style scoped>
.barra-navegacion-inferior {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: var(--color-superficie);
  border-top: 1px solid var(--color-borde);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.2);
}
.boton-barra {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background-color: var(--color-primario);
  color: var(--color-texto-principal);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}
.boton-barra:hover:not(:disabled) {
  background-color: var(--color-primario-oscuro);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
.boton-barra:active:not(:disabled) {
  transform: translateY(0);
}
.boton-desactivado {
  background-color: var(--color-desactivado) !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}
.boton-desactivado:hover {
  transform: none !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
}
/* Responsive: Ajustar para pantallas pequeñas */
@media (max-width: 400px) {
  .barra-navegacion-inferior {
    gap: 16px;
    height: 56px;
  }
  .boton-barra {
    width: 44px;
    height: 44px;
  }
}
</style>
