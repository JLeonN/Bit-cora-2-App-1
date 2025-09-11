<template>
  <div class="barra-botones-inferior">
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
  bottom: 26px; /* Levantamos la barra del fondo */
  left: 50%; /* La centramos horizontalmente */
  transform: translateX(-50%);
  width: 90%; /* Hacemos que ocupe el 90% del ancho */
  max-width: 500px; /* Un ancho máximo para pantallas grandes */
  border-radius: 30px; /* Redondeamos las esquinas */
  height: 60px;
  background-color: var(--color-superficie);
  border: 1px solid var(--color-borde); /* Cambiado de border-top a border para que se vea completo */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25); /* Sombra un poco más pronunciada */
  padding: 0 16px;
  box-sizing: border-box; /* Asegura que el padding no afecte el ancho total */
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
/* Botón de agregar con estilo especial */
.boton-agregar {
  background-color: var(--color-acento);
  transform: scale(1.1);
}
.boton-agregar:hover:not(:disabled) {
  background-color: var(--color-acento);
  filter: brightness(1.1);
  transform: scale(1.15) translateY(-2px);
}
/* Estado desactivado */
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
/* Responsive: Ajustar para pantallas pequeñas */
@media (max-width: 480px) {
  .barra-botones-inferior {
    gap: 16px;
    height: 56px;
    padding: 0 12px;
    width: 92%; /* Ajuste de ancho para pantallas pequeñas */
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
/* Ajuste para muchos botones */
@media (max-width: 360px) {
  .barra-botones-inferior {
    gap: 12px;
    padding: 0 8px;
  }
  .boton-barra {
    width: 40px;
    height: 40px;
  }
}
/* Clases CSS extra para botones personalizados del futuro */
.boton-camara {
  background-color: #9c27b0;
}
.boton-camara:hover:not(:disabled) {
  background-color: #7b1fa2;
}
.boton-descarga {
  background-color: #ff9800;
}
.boton-descarga:hover:not(:disabled) {
  background-color: #f57c00;
}
.boton-configuracion {
  background-color: #607d8b;
}
.boton-configuracion:hover:not(:disabled) {
  background-color: #455a64;
}
</style>
