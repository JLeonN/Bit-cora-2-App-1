<template>
  <section class="gestor-listados">
    <div class="selector-listado">
      <label for="selector-listado">Listado activo</label>
      <q-select
        id="selector-listado"
        :model-value="listadoActivo?.id || ''"
        :options="listados"
        option-label="nombre"
        option-value="id"
        emit-value
        map-options
        dense
        outlined
        options-dense
        options-dark
        popup-content-class="menu-selector-listados"
        :disable="ocupado"
        @update:model-value="abrirListado"
      />
    </div>
    <div class="edicion-nombre-listado">
      <label for="nombre-listado">Nombre de la lista</label>
      <input
        id="nombre-listado"
        v-model="nombreBorrador"
        type="text"
        maxlength="80"
        placeholder="Nombre opcional"
        :disabled="ocupado || !listadoActivo"
        @blur="confirmarNombre"
        @keyup.enter="$event.target.blur()"
      />
    </div>
    <div class="acciones-gestor-listados">
      <TresBotones
        texto-aceptar="Nuevo"
        texto-cancelar="Duplicar"
        texto-eliminar="Eliminar"
        tipo-aceptar="button"
        :aceptar-deshabilitado="ocupado"
        :cancelar-deshabilitado="ocupado || !listadoActivo"
        :eliminar-deshabilitado="ocupado || !listadoActivo"
        @aceptar="emit('crear')"
        @cancelar="emit('duplicar', listadoActivo.id)"
        @eliminar="emit('solicitar-eliminar', listadoActivo)"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import TresBotones from '../../Botones/TresBotones.vue'

const props = defineProps({
  listados: { type: Array, default: () => [] },
  listadoActivo: { type: Object, default: null },
  ocupado: { type: Boolean, default: false },
})
const emit = defineEmits(['crear', 'abrir', 'renombrar', 'duplicar', 'solicitar-eliminar'])
const nombreBorrador = ref('')

watch(
  () => props.listadoActivo,
  (listado) => {
    nombreBorrador.value = listado?.nombrePersonalizado || ''
  },
  { immediate: true },
)

function confirmarNombre() {
  const nombre = nombreBorrador.value.trim()
  if (!props.listadoActivo || nombre === props.listadoActivo.nombrePersonalizado) return
  nombreBorrador.value = nombre
  emit('renombrar', { id: props.listadoActivo.id, nombrePersonalizado: nombre })
}

function abrirListado(id) {
  if (!id || id === props.listadoActivo?.id) return
  emit('abrir', id)
}
</script>

<style scoped>
.gestor-listados {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 1.4fr) auto;
  gap: 12px;
  align-items: end;
}
.selector-listado,.edicion-nombre-listado {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
label {
  color: var(--color-texto-secundario);
  font-size: 0.82rem;
  font-weight: 600;
}
.edicion-nombre-listado input {
  width: 100%;
  min-height: 42px;
  padding: 8px 10px;
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
}
.selector-listado :deep(.q-field__control) {
  min-height: 42px;
  height: 42px;
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  border-radius: 8px;
}
.selector-listado :deep(.q-field__native),.selector-listado :deep(.q-field__input),.selector-listado :deep(.q-field__marginal),.selector-listado :deep(.q-select__dropdown-icon) {
  color: var(--color-texto-principal);
}
.selector-listado :deep(.q-field__control:before) {
  border-color: var(--color-borde);
}
.selector-listado :deep(.q-field__control:hover:before) {
  border-color: var(--color-primario);
}
.selector-listado :deep(.q-field--focused .q-field__control:after) {
  border-color: var(--color-acento);
}
.selector-listado :deep(.q-field--disabled) {
  opacity: 0.55;
}
.acciones-gestor-listados {
  min-width: 280px;
}
.acciones-gestor-listados :deep(.contenedor-botones) {
  gap: 0.5rem;
}
@media (max-width: 850px) {
  .gestor-listados {
    grid-template-columns: 1fr 1fr;
  }
  .acciones-gestor-listados {
    grid-column: 1 / -1;
  }
}
@media (max-width: 560px) {
  .gestor-listados {
    grid-template-columns: 1fr;
  }
  .acciones-gestor-listados {
    grid-column: auto;
    min-width: 0;
  }
  .acciones-gestor-listados :deep(.contenedor-botones) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .acciones-gestor-listados :deep(.boton) {
    padding: 0.5rem;
  }
}
</style>

<style>
.menu-selector-listados {
  max-height: min(60vh, 360px);
  overflow: hidden auto;
  color: var(--color-texto-principal) !important;
  background: var(--color-superficie) !important;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  box-shadow: 0 12px 28px var(--sombra-boton);
}
.menu-selector-listados .q-item {
  min-height: 44px;
  color: var(--color-texto-principal) !important;
  border-bottom: 1px solid var(--color-borde);
  transition: background-color 0.15s ease,color 0.15s ease;
}
.menu-selector-listados .q-item:last-child {
  border-bottom: none;
}
.menu-selector-listados .q-item--active,.menu-selector-listados .q-item--active .q-item__label {
  color: var(--color-acento) !important;
  font-weight: 700;
}
.menu-selector-listados .q-item.q-manual-focusable--focused,.menu-selector-listados .q-item:hover {
  background: color-mix(in oklab, var(--color-primario) 18%, var(--color-superficie)) !important;
}
</style>
