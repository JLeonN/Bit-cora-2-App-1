<template>
  <div :class="['tarjeta-seccion', { 'resaltado-atencion': estaResaltada }]">
    <div class="tarjeta-header" @click="alternarExpansion">
      <div class="header-contenido">
        <component v-if="icono" :is="icono" :stroke="2" class="icono-seccion" />
        <div class="bloque-titulos">
          <h3 class="titulo-seccion">{{ titulo }}</h3>
          <p
            v-if="descripcionResumen"
            class="descripcion-resumen"
            :class="{
              'descripcion-resumen-oculta': ocultarResumenAlExpandir && estaExpandida,
              'descripcion-resumen-expandida': !ocultarResumenAlExpandir && estaExpandida,
            }"
          >
            {{ descripcionResumen }}
          </p>
        </div>
      </div>
      <IconChevronDown
        :stroke="2"
        class="icono-chevron"
        :class="{ 'chevron-rotado': estaExpandida }"
      />
    </div>

    <transition name="expandir">
      <div v-show="estaExpandida" class="tarjeta-contenido">
        <slot></slot>
      </div>
    </transition>

    <div v-if="$slots.accionFija" class="contenedor-accion-fija">
      <slot name="accionFija"></slot>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { IconChevronDown } from '@tabler/icons-vue'
import { usarResaltadoAtencion } from '../../Logica/Compartidos/UsoResaltadoAtencion.js'

const emit = defineEmits(['cambio-expansion'])

const props = defineProps({
  titulo: {
    type: String,
    required: true,
  },
  icono: {
    type: Object,
    default: null,
  },
  expandidaPorDefecto: {
    type: Boolean,
    default: false,
  },
  descripcionResumen: {
    type: String,
    default: '',
  },
  ocultarResumenAlExpandir: {
    type: Boolean,
    default: false,
  },
  solicitudResaltado: {
    type: String,
    default: '',
  },
})

const estaExpandida = ref(props.expandidaPorDefecto)
const { estaResaltado: estaResaltada, activarResaltado } = usarResaltadoAtencion()

const alternarExpansion = () => {
  estaExpandida.value = !estaExpandida.value
  emit('cambio-expansion', estaExpandida.value)
}

// Watch por si se cambia desde fuera
watch(
  () => props.expandidaPorDefecto,
  (nuevoValor) => {
    estaExpandida.value = nuevoValor
    emit('cambio-expansion', estaExpandida.value)
  },
)

onMounted(() => {
  if (props.solicitudResaltado) activarResaltado()
})

watch(
  () => props.solicitudResaltado,
  (solicitudResaltado) => {
    if (solicitudResaltado) activarResaltado()
  },
)
</script>

<style scoped>
.tarjeta-seccion {
  background: var(--color-superficie);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid var(--color-borde);
  transition: all 0.3s ease;
}
.tarjeta-seccion:hover {
  border-color: var(--color-primario);
}
.tarjeta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}
.tarjeta-header:hover {
  background: rgba(30, 136, 229, 0.05);
}
.header-contenido {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.bloque-titulos {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.icono-seccion {
  color: var(--color-primario);
  flex-shrink: 0;
}
.titulo-seccion {
  margin: 0;
  color: var(--color-texto-principal);
  font-size: 18px;
  font-weight: 600;
}
.descripcion-resumen {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.88rem;
  max-width: min(70vw, 520px);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.descripcion-resumen-oculta {
  display: none;
}
.descripcion-resumen-expandida {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}
.icono-chevron {
  color: var(--color-texto-secundario);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}
.chevron-rotado {
  transform: rotate(180deg);
}
.tarjeta-contenido {
  padding: 0 20px 20px 20px;
}
.contenedor-accion-fija {
  padding: 0 20px 20px 20px;
}
/* Animación de expansión */
.expandir-enter-active,
.expandir-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expandir-enter-from,
.expandir-leave-to {
  opacity: 0;
  max-height: 0;
}
.expandir-enter-to,
.expandir-leave-from {
  opacity: 1;
  max-height: 2000px;
}
/* Responsive */
@media (max-width: 600px) {
  .tarjeta-header {
    padding: 16px;
  }
  .titulo-seccion {
    font-size: 16px;
  }
  .tarjeta-contenido {
    padding: 0 16px 16px 16px;
  }
  .contenedor-accion-fija {
    padding: 0 16px 16px 16px;
  }
}
</style>
