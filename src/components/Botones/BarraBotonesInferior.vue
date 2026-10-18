<template>
  <div
    v-if="!modalActivo"
    class="barra-botones-inferior"
    :class="{ 'con-banner': hayBannerVisible, 'barra-con-pruebas-impresion': botonesPersonalizados.some((boton) => boton.claseCSS === 'boton-prueba-impresion') }"
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

    <!-- Botón Ir al final -->
    <button
      v-if="mostrarIrAlFinal"
      type="button"
      class="boton-barra"
      :title="tituloSalto"
      :aria-label="tituloSalto"
      @click="manejarSalto"
    >
      <span class="icono-salto" :class="{ 'apunta-arriba': estaAlFinal }">
        <IconChevronsDown size="20" stroke="2" />
      </span>
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
      :title="tituloEnviar"
    >
      <component :is="iconoEnviarCalculado" size="20" stroke="2" />
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
      :aria-label="botonPersonalizado.titulo"
    >
      <span v-if="botonPersonalizado.texto" class="texto-boton-barra">{{ botonPersonalizado.texto }}</span>
      <component v-else :is="botonPersonalizado.icono" size="20" stroke="2" />
    </button>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { IconChevronsDown, IconHome, IconChevronLeft, IconSend, IconPlus } from '@tabler/icons-vue'
import { desplazarAlInicioDePagina } from './ConfiguracionBarraInferior.js'

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
  mostrarIrAlFinal: {
    type: Boolean,
    default: false,
  },
  tituloIrAlFinal: {
    type: String,
    default: 'Ir al final',
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
  iconoEnviar: {
    type: [Object, Function],
    default: () => IconSend,
  },
  tituloEnviar: {
    type: String,
    default: 'Enviar datos',
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
const emit = defineEmits(['enviar', 'agregar', 'ir-al-final', 'accion-personalizada'])

// Lógica para ocultar "Atrás" en el inicio
const esPaginaInicio = computed(() => {
  return route.path === '/'
})

const mostrarAtrasCalculado = computed(() => {
  return props.mostrarAtras && !esPaginaInicio.value
})

const iconoEnviarCalculado = computed(() => props.iconoEnviar || IconSend)
const estaAlFinal = ref(false)
const tituloSalto = computed(() =>
  estaAlFinal.value ? 'Volver arriba de esta página' : props.tituloIrAlFinal,
)

function actualizarPosicion() {
  const altoPagina = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
  estaAlFinal.value =
    altoPagina > window.innerHeight &&
    altoPagina - window.innerHeight - window.scrollY <= 24
}

function manejarSalto() {
  if (estaAlFinal.value) {
    desplazarAlInicioDePagina()
    return
  }
  emit('ir-al-final')
}

watch(() => route.fullPath, () => {
  estaAlFinal.value = false
  void nextTick(actualizarPosicion)
})
watch(() => props.mostrarIrAlFinal, () => void nextTick(actualizarPosicion))

onMounted(() => {
  window.addEventListener('scroll', actualizarPosicion, { passive: true })
  window.addEventListener('resize', actualizarPosicion)
  void nextTick(actualizarPosicion)
})
onUnmounted(() => {
  window.removeEventListener('scroll', actualizarPosicion)
  window.removeEventListener('resize', actualizarPosicion)
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
  --posicion-inferior-barra: calc(8px + env(safe-area-inset-bottom, 0px));
  position: fixed;
  bottom: var(--posicion-inferior-barra);
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
.barra-con-pruebas-impresion {
  gap: 12px;
  padding: 0 8px;
}
.barra-con-pruebas-impresion .boton-barra {
  width: 44px;
  height: 44px;
}
.texto-boton-barra {
  font-size: 1.15rem;
  font-weight: 700;
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
.icono-salto {
  display: inline-flex;
  transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.icono-salto.apunta-arriba {
  transform: rotate(180deg);
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
.boton-compartiendo-enlace svg {
  animation: girar-icono-compartir 1s linear infinite;
}
@keyframes girar-icono-compartir {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .icono-salto {
    transition: none;
  }
}
@media (max-width: 480px) {
  .barra-botones-inferior {
    gap: 16px;
    height: 56px;
    padding: 0 12px;
    width: 92%;
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
  .barra-con-pruebas-impresion {
    gap: 7px;
  }
  .barra-con-pruebas-impresion .boton-barra {
    width: 40px;
    height: 40px;
  }
}
@media (max-width: 360px) {
  .barra-botones-inferior {
    gap: 12px;
    padding: 0 8px;
  }
  .boton-barra {
    width: 40px;
    height: 40px;
  }
  .barra-con-pruebas-impresion {
    gap: 5px;
    padding: 0 6px;
  }
  .barra-con-pruebas-impresion .boton-barra {
    width: 38px;
    height: 38px;
  }
}
</style>
