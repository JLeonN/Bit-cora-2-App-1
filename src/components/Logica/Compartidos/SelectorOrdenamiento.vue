<template>
  <div class="selector-ordenamiento" role="group" aria-label="Ordenar elementos">
    <button
      v-for="criterio in criteriosVisibles"
      :key="criterio.valor"
      type="button"
      class="boton-criterio"
      :class="{ 'boton-criterio-activo': ordenNormalizado.criterio === criterio.valor }"
      :disabled="deshabilitado"
      :aria-pressed="ordenNormalizado.criterio === criterio.valor"
      :aria-label="obtenerEtiquetaAccesible(criterio.valor)"
      @click="seleccionarCriterio(criterio.valor)"
    >
      <component
        :is="criterio.icono"
        class="icono-criterio"
        :size="21"
        :stroke="2"
        aria-hidden="true"
      />
      <span class="texto-criterio">{{ obtenerTextoCriterio(criterio.valor) }}</span>
      <span class="direcciones-orden" aria-hidden="true">
        <component
          :is="direccion === 'ascendente' ? IconArrowUp : IconArrowDown"
          v-for="direccion in criterio.direcciones"
          :key="direccion"
          class="icono-direccion"
          :class="{ 'icono-direccion-activo': esDireccionActiva(criterio.valor, direccion) }"
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
  IconInbox,
  IconMapPin,
  IconScale,
  IconSortAscending2,
} from '@tabler/icons-vue'
import { CRITERIOS_ORDEN, normalizarOrden } from './OrdenarColeccion.js'

const DIRECCIONES_NATURALES = Object.freeze({
  fechaIngreso: 'descendente',
  alfabetico: 'ascendente',
  ubicacion: 'ascendente',
  cantidad: 'descendente',
})
const CONFIGURACION_CRITERIOS = Object.freeze({
  fechaIngreso: {
    valor: 'fechaIngreso',
    icono: IconInbox,
    direcciones: ['descendente', 'ascendente'],
  },
  alfabetico: {
    valor: 'alfabetico',
    icono: IconSortAscending2,
    direcciones: ['ascendente', 'descendente'],
  },
  ubicacion: {
    valor: 'ubicacion',
    icono: IconMapPin,
    direcciones: ['ascendente', 'descendente'],
  },
  cantidad: {
    valor: 'cantidad',
    icono: IconScale,
    direcciones: ['descendente', 'ascendente'],
  },
})

const props = defineProps({
  modelValue: { type: Object, required: true },
  deshabilitado: { type: Boolean, default: false },
  criteriosDisponibles: {
    type: Array,
    default: () => ['fechaIngreso', 'alfabetico'],
  },
  etiquetaCantidad: { type: String, default: 'Cantidad' },
})
const emit = defineEmits(['update:model-value'])

const ordenNormalizado = computed(() => normalizarOrden(props.modelValue))
const criteriosVisibles = computed(() =>
  props.criteriosDisponibles
    .filter((criterio, indice, criterios) =>
      CRITERIOS_ORDEN.includes(criterio) && criterios.indexOf(criterio) === indice,
    )
    .map((criterio) => CONFIGURACION_CRITERIOS[criterio]),
)

function obtenerDireccionMostrada(criterio) {
  return ordenNormalizado.value.criterio === criterio
    ? ordenNormalizado.value.direccion
    : DIRECCIONES_NATURALES[criterio]
}

function obtenerTextoCriterio(criterio) {
  if (criterio === 'fechaIngreso') return 'Llegada'
  if (criterio === 'alfabetico') {
    return obtenerDireccionMostrada(criterio) === 'descendente' ? 'Z/A' : 'A/Z'
  }
  if (criterio === 'ubicacion') return 'Ubicación'
  return props.etiquetaCantidad
}

function obtenerEtiquetaAccesible(criterio) {
  const direccion = obtenerDireccionMostrada(criterio)
  if (criterio === 'fechaIngreso') {
    return direccion === 'ascendente'
      ? 'Orden de llegada: antiguas primero'
      : 'Orden de llegada: recientes primero'
  }
  if (criterio === 'alfabetico') {
    return direccion === 'descendente'
      ? 'Ordenar alfabéticamente: Z a A'
      : 'Ordenar alfabéticamente: A a Z'
  }
  if (criterio === 'ubicacion') {
    return direccion === 'descendente'
      ? 'Ordenar por ubicación: mayores primero'
      : 'Ordenar por ubicación: menores primero'
  }
  return direccion === 'descendente'
    ? `Ordenar por ${props.etiquetaCantidad.toLowerCase()}: mayor a menor`
    : `Ordenar por ${props.etiquetaCantidad.toLowerCase()}: menor a mayor`
}

function esDireccionActiva(criterio, direccion) {
  return (
    ordenNormalizado.value.criterio === criterio &&
    ordenNormalizado.value.direccion === direccion
  )
}

function seleccionarCriterio(criterio) {
  if (props.deshabilitado || !criteriosVisibles.value.some((item) => item.valor === criterio)) {
    return
  }
  if (ordenNormalizado.value.criterio !== criterio) {
    emit('update:model-value', {
      criterio,
      direccion: DIRECCIONES_NATURALES[criterio],
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
@media (min-width: 760px) {
  .selector-ordenamiento {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .boton-criterio,
  .icono-direccion {
    transition: none;
  }
}
</style>
