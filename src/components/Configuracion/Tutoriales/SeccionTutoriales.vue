<template>
  <div class="seccion-tutoriales">
    <!-- Tutorial Pedidos -->
    <div class="acordeon-tutorial" @click="alternarTutorial('pedidos')">
      <div class="acordeon-header">
        <div class="header-izquierda">
          <IconTableRow :stroke="2" class="icono-tutorial" />
          <span class="titulo-tutorial">Cómo usar Pedidos</span>
        </div>
        <IconChevronDown
          :stroke="2"
          class="icono-chevron"
          :class="{ 'chevron-rotado': tutorialExpandido === 'pedidos' }"
        />
      </div>
      <transition name="expandir-contenido">
        <div v-show="tutorialExpandido === 'pedidos'" class="acordeon-contenido">
          <TutorialPedidos />
        </div>
      </transition>
    </div>

    <!-- Tutorial Ubicaciones -->
    <div class="acordeon-tutorial" @click="alternarTutorial('ubicaciones')">
      <div class="acordeon-header">
        <div class="header-izquierda">
          <IconMapRoute :stroke="2" class="icono-tutorial" />
          <span class="titulo-tutorial">Cómo usar Ubicaciones</span>
        </div>
        <IconChevronDown
          :stroke="2"
          class="icono-chevron"
          :class="{ 'chevron-rotado': tutorialExpandido === 'ubicaciones' }"
        />
      </div>
      <transition name="expandir-contenido">
        <div v-show="tutorialExpandido === 'ubicaciones'" class="acordeon-contenido">
          <TutorialUbicaciones />
        </div>
      </transition>
    </div>

    <!-- Tutorial Etiquetas -->
    <div class="acordeon-tutorial" @click="alternarTutorial('etiquetas')">
      <div class="acordeon-header">
        <div class="header-izquierda">
          <IconTag :stroke="2" class="icono-tutorial" />
          <span class="titulo-tutorial">Cómo usar Etiquetas</span>
        </div>
        <IconChevronDown
          :stroke="2"
          class="icono-chevron"
          :class="{ 'chevron-rotado': tutorialExpandido === 'etiquetas' }"
        />
      </div>
      <transition name="expandir-contenido">
        <div v-show="tutorialExpandido === 'etiquetas'" class="acordeon-contenido">
          <TutorialEtiquetas />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconTableRow, IconMapRoute, IconTag, IconChevronDown } from '@tabler/icons-vue'
import TutorialPedidos from './LosTutoriales/TutorialPedidos.vue'
import TutorialUbicaciones from './LosTutoriales/TutorialUbicaciones.vue'
import TutorialEtiquetas from './LosTutoriales/TutorialEtiquetas.vue'

const tutorialExpandido = ref(null)

const alternarTutorial = (tutorial) => {
  if (tutorialExpandido.value === tutorial) {
    tutorialExpandido.value = null
  } else {
    tutorialExpandido.value = tutorial
  }
}
</script>

<style scoped>
.seccion-tutoriales {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.acordeon-tutorial {
  background: var(--color-fondo);
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  overflow: hidden;
  transition: all 0.3s ease;
}
.acordeon-tutorial:hover {
  border-color: var(--color-primario);
}
.acordeon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}
.acordeon-header:hover {
  background: rgba(30, 136, 229, 0.05);
}
.header-izquierda {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icono-tutorial {
  color: var(--color-primario);
  flex-shrink: 0;
}
.titulo-tutorial {
  color: var(--color-texto-principal);
  font-size: 15px;
  font-weight: 500;
}
.icono-chevron {
  color: var(--color-texto-secundario);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}
.chevron-rotado {
  transform: rotate(180deg);
}
.acordeon-contenido {
  padding: 0 16px 16px 16px;
  border-top: 1px solid var(--color-borde);
}
/* Animación de expansión */
.expandir-contenido-enter-active,
.expandir-contenido-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.expandir-contenido-enter-from,
.expandir-contenido-leave-to {
  opacity: 0;
  max-height: 0;
}
.expandir-contenido-enter-to,
.expandir-contenido-leave-from {
  opacity: 1;
  max-height: 1500px;
}
/* Responsive */
@media (max-width: 600px) {
  .acordeon-header {
    padding: 14px;
  }
  .titulo-tutorial {
    font-size: 14px;
  }
  .acordeon-contenido {
    padding: 0 14px 14px 14px;
  }
}
</style>
