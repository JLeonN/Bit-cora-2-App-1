<template>
  <section class="gestor-listados">
    <div class="encabezado-gestor-listados">
      <label for="selector-listado">Listado activo</label>
      <button type="button" class="boton-nuevo-listado" :disabled="ocupado" @click="abrirCreacion">
        <IconPlus :size="18" :stroke="2" />
        Nuevo
      </button>
    </div>
    <div class="fila-selector-listado">
      <q-select
        id="selector-listado"
        ref="selectorListadoRef"
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
        class="selector-listado"
        :disable="ocupado"
        @update:model-value="abrirListado"
      >
        <template #option="alcance">
          <q-item v-bind="alcance.itemProps" class="opcion-listado">
            <q-item-section>
              <q-item-label>{{ alcance.opt.nombre }}</q-item-label>
            </q-item-section>
            <q-item-section side class="acciones-opcion-listado">
              <button
                type="button"
                class="boton-opcion-listado"
                :aria-label="`Duplicar ${alcance.opt.nombre}`"
                :title="`Duplicar ${alcance.opt.nombre}`"
                @click.stop.prevent="duplicarListado(alcance.opt)"
                @keydown.stop
                @keyup.stop
              >
                <IconCopy :size="19" :stroke="2" />
              </button>
              <button
                type="button"
                class="boton-opcion-listado boton-eliminar-listado"
                :aria-label="`Eliminar ${alcance.opt.nombre}`"
                :title="`Eliminar ${alcance.opt.nombre}`"
                @click.stop.prevent="solicitarEliminarListado(alcance.opt)"
                @keydown.stop
                @keyup.stop
              >
                <IconTrash :size="19" :stroke="2" />
              </button>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <button
        type="button"
        class="boton-renombrar-listado"
        :disabled="ocupado || !listadoActivo"
        :aria-label="`Cambiar nombre de ${listadoActivo?.nombre || 'listado'}`"
        title="Cambiar nombre"
        @click="abrirCambioNombre"
      >
        <IconPencil :size="19" :stroke="2" />
      </button>
    </div>
    <q-dialog v-model="mostrarDialogoNombre">
      <q-card class="dialogo-nombre-listado">
        <q-card-section>
          <h3>{{ modoNombre === 'crear' ? 'Nuevo listado' : 'Cambiar nombre' }}</h3>
          <label for="nombre-listado">Nombre de la lista</label>
          <input
            id="nombre-listado"
            v-model="nombreBorrador"
            type="text"
            maxlength="80"
            placeholder="Nombre opcional"
            autofocus
            @keyup.enter="confirmarNombre"
          />
        </q-card-section>
        <q-card-actions align="right">
          <button type="button" class="boton-cancelar-nombre" @click="mostrarDialogoNombre = false">
            Cancelar
          </button>
          <button type="button" class="boton-confirmar-nombre" @click="confirmarNombre">
            {{ modoNombre === 'crear' ? 'Crear listado' : 'Guardar' }}
          </button>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { IconCopy, IconPencil, IconPlus, IconTrash } from '@tabler/icons-vue'

const props = defineProps({
  listados: { type: Array, default: () => [] },
  listadoActivo: { type: Object, default: null },
  ocupado: { type: Boolean, default: false },
})
const emit = defineEmits(['crear', 'abrir', 'renombrar', 'duplicar', 'solicitar-eliminar'])
const selectorListadoRef = ref(null)
const mostrarDialogoNombre = ref(false)
const modoNombre = ref('crear')
const nombreBorrador = ref('')

function abrirCreacion() {
  modoNombre.value = 'crear'
  nombreBorrador.value = ''
  mostrarDialogoNombre.value = true
}

function abrirCambioNombre() {
  if (!props.listadoActivo) return
  modoNombre.value = 'renombrar'
  nombreBorrador.value = props.listadoActivo.nombrePersonalizado || ''
  mostrarDialogoNombre.value = true
}

function confirmarNombre() {
  const nombre = nombreBorrador.value.trim()
  mostrarDialogoNombre.value = false
  if (modoNombre.value === 'crear') {
    emit('crear', nombre)
    return
  }
  if (!props.listadoActivo || nombre === props.listadoActivo.nombrePersonalizado) return
  emit('renombrar', { id: props.listadoActivo.id, nombrePersonalizado: nombre })
}

function abrirListado(id) {
  if (!id || id === props.listadoActivo?.id) return
  emit('abrir', id)
}

function duplicarListado(listado) {
  if (props.ocupado) return
  selectorListadoRef.value?.hidePopup()
  emit('duplicar', listado.id)
}

function solicitarEliminarListado(listado) {
  if (props.ocupado) return
  selectorListadoRef.value?.hidePopup()
  emit('solicitar-eliminar', listado)
}
</script>

<style scoped>
.gestor-listados {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.encabezado-gestor-listados,
.fila-selector-listado {
  display: flex;
  align-items: center;
  gap: 8px;
}
.encabezado-gestor-listados {
  justify-content: space-between;
}
label {
  color: var(--color-texto-secundario);
  font-size: 0.82rem;
  font-weight: 600;
}
.boton-nuevo-listado,
.boton-renombrar-listado {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 42px;
  padding: 8px 12px;
  color: var(--color-texto-principal);
  background: var(--color-primario);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  cursor: pointer;
}
.boton-renombrar-listado {
  width: 42px;
  padding: 8px;
  background: var(--color-superficie);
}
.boton-nuevo-listado:disabled,
.boton-renombrar-listado:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.selector-listado {
  flex: 1;
  min-width: 0;
}
.selector-listado :deep(.q-field__control) {
  min-height: 42px;
  height: 42px;
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  border-radius: 8px;
}
.selector-listado :deep(.q-field__native),
.selector-listado :deep(.q-field__input),
.selector-listado :deep(.q-field__marginal),
.selector-listado :deep(.q-select__dropdown-icon) {
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
.dialogo-nombre-listado {
  width: min(90vw, 400px);
  color: var(--color-texto-principal);
  background: var(--color-superficie);
}
.dialogo-nombre-listado h3 {
  margin: 0 0 16px;
  font-size: 1.1rem;
}
.dialogo-nombre-listado label {
  display: block;
  margin-bottom: 6px;
}
.dialogo-nombre-listado input {
  width: 100%;
  min-height: 42px;
  padding: 8px 10px;
  color: var(--color-texto-principal);
  background: var(--color-fondo);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
}
.dialogo-nombre-listado .q-card__actions {
  gap: 8px;
  padding: 0 16px 16px;
}
.boton-cancelar-nombre,
.boton-confirmar-nombre {
  min-height: 42px;
  padding: 8px 12px;
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  cursor: pointer;
}
.boton-confirmar-nombre {
  background: var(--color-primario);
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
  min-height: 52px;
  color: var(--color-texto-principal) !important;
  border-bottom: 1px solid var(--color-borde);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}
.menu-selector-listados .q-item:last-child {
  border-bottom: none;
}
.menu-selector-listados .q-item--active,
.menu-selector-listados .q-item--active .q-item__label {
  color: var(--color-acento) !important;
  font-weight: 700;
}
.menu-selector-listados .q-item.q-manual-focusable--focused,
.menu-selector-listados .q-item:hover {
  background: color-mix(in oklab, var(--color-primario) 18%, var(--color-superficie)) !important;
}
.menu-selector-listados .acciones-opcion-listado {
  flex-direction: row;
  gap: 2px;
  padding-left: 4px;
}
.menu-selector-listados .boton-opcion-listado {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  color: var(--color-texto-principal);
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
.menu-selector-listados .boton-opcion-listado:hover,
.menu-selector-listados .boton-opcion-listado:focus-visible {
  background: var(--color-borde);
}
.menu-selector-listados .boton-eliminar-listado {
  color: var(--color-error);
}
</style>
