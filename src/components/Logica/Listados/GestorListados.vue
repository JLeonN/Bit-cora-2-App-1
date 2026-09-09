<template>
  <section class="gestor-listados">
    <div class="selector-listado">
      <label for="selector-listado">Listado activo</label>
      <select
        id="selector-listado"
        :value="listadoActivo?.id || ''"
        :disabled="ocupado"
        @change="emit('abrir', $event.target.value)"
      >
        <option v-for="listado in listados" :key="listado.id" :value="listado.id">
          {{ listado.nombre }}
        </option>
      </select>
    </div>
    <div class="edicion-nombre-listado">
      <label for="nombre-listado">Nombre</label>
      <input
        id="nombre-listado"
        v-model="nombreBorrador"
        type="text"
        :disabled="ocupado || !listadoActivo"
        @blur="confirmarNombre"
        @keyup.enter="$event.target.blur()"
      />
    </div>
    <div class="acciones-gestor-listados">
      <button type="button" :disabled="ocupado" @click="emit('crear')">
        <IconPlus :size="18" /> Nuevo
      </button>
      <button type="button" :disabled="ocupado || !listadoActivo" @click="emit('duplicar', listadoActivo.id)">
        <IconCopy :size="18" /> Duplicar
      </button>
      <button
        type="button"
        class="accion-peligrosa"
        :disabled="ocupado || !listadoActivo"
        @click="emit('solicitar-eliminar', listadoActivo)"
      >
        <IconTrash :size="18" /> Eliminar
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { IconCopy, IconPlus, IconTrash } from '@tabler/icons-vue'

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
    nombreBorrador.value = listado?.nombre || ''
  },
  { immediate: true },
)

function confirmarNombre() {
  const nombre = nombreBorrador.value.trim()
  if (!props.listadoActivo || nombre === props.listadoActivo.nombre) return
  if (!nombre) {
    nombreBorrador.value = props.listadoActivo.nombre
    return
  }
  emit('renombrar', { id: props.listadoActivo.id, nombre })
}
</script>

<style scoped>
.gestor-listados {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 1.4fr) auto;
  gap: 12px;
  align-items: end;
  padding: 16px;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
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
select,input {
  width: 100%;
  min-height: 42px;
  padding: 8px 10px;
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
}
.acciones-gestor-listados {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 8px 12px;
  color: var(--color-primario);
  background: var(--color-superficie);
  border: 1px solid var(--color-primario);
  border-radius: 8px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.55;
  cursor: default;
}
.accion-peligrosa {
  color: var(--color-texto-principal);
  border-color: var(--color-borde);
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
  }
  .acciones-gestor-listados button {
    flex: 1;
  }
}
</style>
