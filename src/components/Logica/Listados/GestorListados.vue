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
