<template>
  <div class="selector-periodo">
    <div class="filtros-fila">
      <q-select
        :model-value="modeloInterno.mes"
        dense
        outlined
        emit-value
        map-options
        :options="opcionesMeses"
        options-dark
        :popup-content-class="clasePopup"
        :label="labels.mes"
        class="campo-filtro"
        @update:model-value="actualizarCampo('mes', $event)"
      />
      <q-select
        :model-value="modeloInterno.anio"
        dense
        outlined
        emit-value
        map-options
        :options="opcionesAnios"
        options-dark
        :popup-content-class="clasePopup"
        :label="labels.anio"
        class="campo-filtro"
        @update:model-value="actualizarCampo('anio', $event)"
      />
      <q-input
        v-if="mostrarDiaPuntual"
        :model-value="modeloInterno.diaExacto"
        dense
        outlined
        type="date"
        :label="labels.diaExacto"
        class="campo-filtro"
        @update:model-value="actualizarCampo('diaExacto', $event)"
      />
    </div>
    <div v-if="mostrarRango" class="filtros-fila">
      <q-input
        :model-value="modeloInterno.fechaDesde"
        dense
        outlined
        type="date"
        :label="labels.fechaDesde"
        class="campo-filtro"
        @update:model-value="actualizarCampo('fechaDesde', $event)"
      />
      <q-input
        :model-value="modeloInterno.fechaHasta"
        dense
        outlined
        type="date"
        :label="labels.fechaHasta"
        class="campo-filtro"
        @update:model-value="actualizarCampo('fechaHasta', $event)"
      />
      <q-btn
        dense
        outline
        color="primary"
        :label="labels.limpiar"
        class="boton-limpiar"
        @click="limpiar"
      />
    </div>
    <p v-if="rangoInvalido" class="mensaje-filtro-error">
      {{ labels.rangoInvalido }}
    </p>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  anios: {
    type: Array,
    default: () => [],
  },
  etiquetas: {
    type: Object,
    default: () => ({}),
  },
  mostrarDiaPuntual: {
    type: Boolean,
    default: true,
  },
  mostrarRango: {
    type: Boolean,
    default: true,
  },
  popupClass: {
    type: String,
    default: 'menu-selector-periodo',
  },
})

const emit = defineEmits(['update:modelValue', 'limpiar', 'rangoInvalido'])

const labels = computed(() => ({
  mes: props.etiquetas.mes || 'Mes',
  anio: props.etiquetas.anio || 'Ano',
  diaExacto: props.etiquetas.diaExacto || 'Dia puntual',
  fechaDesde: props.etiquetas.fechaDesde || 'Desde',
  fechaHasta: props.etiquetas.fechaHasta || 'Hasta',
  limpiar: props.etiquetas.limpiar || 'Limpiar filtros',
  rangoInvalido: props.etiquetas.rangoInvalido || 'El rango Desde/Hasta no es valido.',
}))

const clasePopup = computed(() => props.popupClass)

const modeloInterno = computed(() => ({
  mes: props.modelValue?.mes ?? null,
  anio: props.modelValue?.anio ?? null,
  fechaDesde: props.modelValue?.fechaDesde ?? '',
  fechaHasta: props.modelValue?.fechaHasta ?? '',
  diaExacto: props.modelValue?.diaExacto ?? '',
}))

const opcionesMeses = [
  { label: 'Enero', value: 1 },
  { label: 'Febrero', value: 2 },
  { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 },
  { label: 'Mayo', value: 5 },
  { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 },
  { label: 'Agosto', value: 8 },
  { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 },
  { label: 'Noviembre', value: 11 },
  { label: 'Diciembre', value: 12 },
]

const opcionesAnios = computed(() =>
  props.anios.map((anio) => ({
    label: String(anio),
    value: anio,
  })),
)

const rangoInvalido = computed(() => {
  if (!props.mostrarRango) {
    return false
  }
  if (!modeloInterno.value.fechaDesde || !modeloInterno.value.fechaHasta) {
    return false
  }
  return new Date(modeloInterno.value.fechaDesde) > new Date(modeloInterno.value.fechaHasta)
})

watch(
  rangoInvalido,
  (valor) => {
    emit('rangoInvalido', valor)
  },
  { immediate: true },
)

function actualizarCampo(campo, valor) {
  emit('update:modelValue', {
    ...modeloInterno.value,
    [campo]: valor,
  })
}

function limpiar() {
  emit('limpiar')
}
</script>

<style scoped>
.selector-periodo {
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-fondo);
  padding: 10px;
  margin-bottom: 12px;
}
.filtros-fila {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.filtros-fila + .filtros-fila {
  margin-top: 8px;
}
.campo-filtro {
  width: 100%;
}
.boton-limpiar {
  width: 100%;
}
.mensaje-filtro-error {
  margin: 8px 0 0 0;
  color: var(--color-error);
  font-size: 0.8rem;
}
.selector-periodo :deep(.q-field .q-field__control) {
  background: var(--color-fondo);
  color: var(--color-texto-principal);
}
.selector-periodo :deep(.q-field .q-field__native),
.selector-periodo :deep(.q-field .q-field__input),
.selector-periodo :deep(.q-field .q-field__marginal),
.selector-periodo :deep(.q-select__dropdown-icon) {
  color: var(--color-texto-principal);
}
.selector-periodo :deep(.q-field .q-field__label) {
  color: var(--color-texto-secundario);
}
.selector-periodo :deep(.q-field.q-field--focused .q-field__label) {
  color: var(--color-acento);
}
.selector-periodo :deep(.q-field .q-field__control:before) {
  border-color: var(--color-borde);
}
.selector-periodo :deep(.q-field .q-field__control:hover:before) {
  border-color: var(--color-primario);
}
.selector-periodo :deep(.q-field.q-field--focused .q-field__control:after) {
  border-color: var(--color-acento);
}
.selector-periodo :deep(.q-field .q-placeholder) {
  color: var(--color-texto-secundario);
}
@media (max-width: 800px) {
  .filtros-fila {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 560px) {
  .filtros-fila {
    grid-template-columns: 1fr;
  }
}
</style>

<style>
.menu-selector-periodo {
  background: var(--color-superficie) !important;
  color: var(--color-texto-principal) !important;
}
.menu-selector-periodo .q-item {
  color: var(--color-texto-principal) !important;
}
.menu-selector-periodo .q-item--active,
.menu-selector-periodo .q-item--active .q-item__label {
  color: var(--color-acento) !important;
}
.menu-selector-periodo .q-item.q-manual-focusable--focused,
.menu-selector-periodo .q-item:hover {
  background: color-mix(in oklab, var(--color-primario) 18%, var(--color-superficie)) !important;
}
</style>
