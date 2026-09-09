<template>
  <div class="selector-ordenamiento" role="group" aria-label="Ordenar elementos">
    <button
      type="button"
      class="boton-criterio"
      :class="{ 'boton-criterio-activo': ordenNormalizado.criterio === 'fechaIngreso' }"
      :disabled="deshabilitado"
      :aria-pressed="ordenNormalizado.criterio === 'fechaIngreso'"
      :aria-label="etiquetaFecha"
      @click="seleccionarCriterio('fechaIngreso')"
    >
      <IconCalendarTime class="icono-criterio" :size="21" :stroke="2" aria-hidden="true" />
      <span class="texto-criterio">Fecha</span>
      <span class="direcciones-orden" aria-hidden="true">
        <IconArrowDown
          class="icono-direccion"
          :class="{ 'icono-direccion-activo': esDireccionActiva('fechaIngreso', 'descendente') }"
          :size="18"
          :stroke="2.4"
        />
        <IconArrowUp
          class="icono-direccion"
          :class="{ 'icono-direccion-activo': esDireccionActiva('fechaIngreso', 'ascendente') }"
          :size="18"
          :stroke="2.4"
        />
      </span>
    </button>
    <button
      type="button"
      class="boton-criterio"
      :class="{ 'boton-criterio-activo': ordenNormalizado.criterio === 'alfabetico' }"
      :disabled="deshabilitado"
      :aria-pressed="ordenNormalizado.criterio === 'alfabetico'"
      :aria-label="etiquetaAlfabetica"
      @click="seleccionarCriterio('alfabetico')"
    >
      <IconSortAZ class="icono-criterio" :size="21" :stroke="2" aria-hidden="true" />
      <span class="texto-criterio">A/Z</span>
      <span class="direcciones-orden" aria-hidden="true">
        <IconArrowUp
          class="icono-direccion"
          :class="{ 'icono-direccion-activo': esDireccionActiva('alfabetico', 'ascendente') }"
          :size="18"
          :stroke="2.4"
        />
        <IconArrowDown
          class="icono-direccion"
          :class="{ 'icono-direccion-activo': esDireccionActiva('alfabetico', 'descendente') }"
          :size="18"
          :stroke="2.4"
        />
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  IconArrowDown,
  IconArrowUp,
  IconCalendarTime,
  IconSortAZ,
} from '@tabler/icons-vue'
import { normalizarOrden } from './OrdenarColeccion.js'

const props = defineProps({
  modelValue: { type: Object, required: true },
  deshabilitado: { type: Boolean, default: false },
})
const emit = defineEmits(['update:model-value'])

const ordenNormalizado = computed(() => normalizarOrden(props.modelValue))
const etiquetaFecha = computed(() =>
  ordenNormalizado.value.criterio === 'fechaIngreso' &&
  ordenNormalizado.value.direccion === 'ascendente'
    ? 'Ordenar por fecha: antiguas primero'
    : 'Ordenar por fecha: recientes primero',
)
const etiquetaAlfabetica = computed(() =>
  ordenNormalizado.value.criterio === 'alfabetico' &&
  ordenNormalizado.value.direccion === 'descendente'
    ? 'Ordenar alfabéticamente: Z a A'
    : 'Ordenar alfabéticamente: A a Z',
)

function esDireccionActiva(criterio, direccion) {
  return (
    ordenNormalizado.value.criterio === criterio &&
    ordenNormalizado.value.direccion === direccion
  )
}

function seleccionarCriterio(criterio) {
  if (props.deshabilitado) return
  if (ordenNormalizado.value.criterio !== criterio) {
    emit('update:model-value', {
      criterio,
      direccion: criterio === 'fechaIngreso' ? 'descendente' : 'ascendente',
    })
    return
  }
  emit('update:model-value', {
    criterio,
    direccion:
      ordenNormalizado.value.direccion === 'ascendente' ? 'descendente' : 'ascendente',
  })
}
</script>

<style scoped>
.selector-ordenamiento {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 1rem;
}
.boton-criterio {
  min-width: 0;
  min-height: 44px;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  padding: 0.55rem 0.7rem;
  background: var(--color-superficie);
  color: var(--color-texto-principal);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}
.boton-criterio:hover:not(:disabled) {
  border-color: var(--color-primario);
  background: var(--color-fondo);
}
.boton-criterio:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}
.boton-criterio:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.boton-criterio-activo {
  border-color: var(--color-acento);
  box-shadow: 0 2px 8px var(--sombra-boton);
}
.icono-criterio {
  color: var(--color-primario);
  flex-shrink: 0;
}
.texto-criterio {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
}
.direcciones-orden {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}
.icono-direccion {
  color: var(--color-texto-secundario);
  filter: none;
  transition: color 0.2s ease, filter 0.2s ease, transform 0.2s ease;
}
.icono-direccion-activo {
  color: var(--color-acento);
  filter: drop-shadow(0 0 4px var(--color-acento));
  transform: scale(1.12);
}
@media (max-width: 360px) {
  .boton-criterio {
    padding-inline: 0.5rem;
    gap: 0.3rem;
  }
  .icono-direccion {
    width: 16px;
    height: 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .boton-criterio,
  .icono-direccion {
    transition: none;
  }
}
</style>
