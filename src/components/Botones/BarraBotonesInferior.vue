<template>
  <div
    v-if="!modalActivo"
    class="barra-botones-inferior"
    :class="{ 'con-banner': hayBannerVisible }"
  >
    <!-- Botón Atrás -->
    <button
      v-if="mostrarAtrasCalculado"
      class="boton-barra"
      @click="volverAtras"
      title="Volver atrás"
    >
      <IconChevronLeft size="20" stroke="2" />
    </button>

    <!-- Botón Inicio -->
    <button v-if="mostrarInicio" class="boton-barra" @click="irAlInicio" title="Ir al inicio">
      <IconHome size="20" stroke="2" />
    </button>

    <!-- Botón Agregar (Plus) -->
    <button
      v-if="mostrarAgregar"
      class="boton-barra"
      @click="agregarElemento"
      title="Agregar nuevo"
    >
      <IconPlus size="20" stroke="2" />
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

    <!-- Botones personalizados dinámicos -->
    <button
      v-for="(botonPersonalizado, indice) in botonesPersonalizados"
      :key="`personalizado-${indice}`"
      class="boton-barra"
      :class="botonPersonalizado.claseCSS"
      :disabled="botonPersonalizado.desactivado"
      @click="ejecutarAccionPersonalizada(botonPersonalizado.accion)"
      :title="botonPersonalizado.titulo"
    >
      <component :is="botonPersonalizado.icono" size="20" stroke="2" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconHome, IconChevronLeft, IconSend, IconPlus } from '@tabler/icons-vue'

const router = useRouter()
const route = useRoute()

// Props
const props = defineProps({
  // Botones básicos
  mostrarAtras: {
    type: Boolean,
    default: true,
  },
  mostrarInicio: {
    type: Boolean,
    default: true,
  },
  mostrarAgregar: {
    type: Boolean,
    default: false,
  },
  mostrarEnviar: {
    type: Boolean,
    default: false,
  },
  puedeEnviar: {
    type: Boolean,
    default: true,
  },
  botonesPersonalizados: {
    type: Array,
    default: () => [],
  },
  // Prop para saber si hay banner
  hayBannerVisible: {
    type: Boolean,
    default: false,
  },
  // Prop para saber si hay algún modal activo (más genérico)
  modalActivo: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['enviar', 'agregar', 'accion-personalizada'])

// Lógica para ocultar "Atrás" en el inicio
const esPaginaInicio = computed(() => {
  return route.path === '/'
})

const mostrarAtrasCalculado = computed(() => {
  return props.mostrarAtras && !esPaginaInicio.value
})

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
const agregarElemento = () => {
  emit('agregar')
}
const ejecutarAccionPersonalizada = (nombreAccion) => {
  emit('accion-personalizada', nombreAccion)
}
</script>

<style scoped>
.barra-botones-inferior {
  position: fixed;
  bottom: 26px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 500px;
  border-radius: 30px;
  height: 60px;
  background-color: var(--color-superficie);
  border: 1px solid var(--color-borde);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  padding: 0 16px;
  box-sizing: border-box;
  transition: bottom 0.3s ease;
}
.barra-botones-inferior.con-banner {
  bottom: 55px;
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
  flex-shrink: 0;
}
.boton-barra:hover:not(:disabled) {
  background-color: var(--color-primario-oscuro);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}
.boton-barra:active:not(:disabled) {
  transform: translateY(0);
}
.boton-agregar {
  background-color: var(--color-acento);
  transform: scale(1.1);
}
.boton-agregar:hover:not(:disabled) {
  background-color: var(--color-acento);
  filter: brightness(1.1);
  transform: scale(1.15) translateY(-2px);
}
.boton-desactivado {
  background-color: var(--color-desactivado) !important;
  cursor: not-allowed !important;
  opacity: 0.6;
}
.boton-desactivado:hover {
  transform: none !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
  filter: none !important;
}
@media (max-width: 480px) {
  .barra-botones-inferior {
    gap: 16px;
    height: 56px;
    padding: 0 12px;
    width: 92%;
  }
  .barra-botones-inferior.con-banner {
    bottom: 82px;
  }
  .boton-barra {
    width: 44px;
    height: 44px;
  }
  .boton-agregar {
    transform: scale(1.05);
  }
  .boton-agregar:hover:not(:disabled) {
    transform: scale(1.1) translateY(-2px);
  }
}
@media (max-width: 360px) {
  .barra-botones-inferior {
    gap: 12px;
    padding: 0 8px;
  }
  .barra-botones-inferior.con-banner {
    bottom: 80px;
  }
  .boton-barra {
    width: 40px;
    height: 40px;
  }
}
</style>
