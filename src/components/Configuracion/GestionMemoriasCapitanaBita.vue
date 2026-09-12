<template>
  <section class="gestion-memorias-capitana-bita">
    <p v-if="!memorias.length" class="estado-vacio-memorias">
      Las memorias se crean al confirmar “Recordar para…” después de elegir un artículo con Capitana
      Bita.
    </p>
    <article
      v-for="memoria in memoriasOrdenadas"
      :key="memoria.id"
      class="tarjeta-memoria-capitana-bita"
    >
      <template v-if="memoriaEnEdicion?.id === memoria.id">
        <label>
          Contexto
          <input v-model="memoriaEnEdicion.contexto" class="campo-entrada-formulario" />
        </label>
        <label>
          Expresión del usuario
          <input v-model="memoriaEnEdicion.expresionUsuario" class="campo-entrada-formulario" />
        </label>
        <label>
          Búsqueda confirmada
          <input v-model="memoriaEnEdicion.busquedaConfirmada" class="campo-entrada-formulario" />
        </label>
        <div class="acciones-memoria-capitana-bita">
          <button type="button" @click="guardarEdicion">Guardar</button>
          <button type="button" class="boton-secundario-memoria" @click="cancelarEdicion">
            Cancelar
          </button>
        </div>
      </template>
      <template v-else>
        <strong>{{ memoria.contexto }}</strong>
        <span>{{ memoria.expresionUsuario }} → {{ memoria.busquedaConfirmada }}</span>
        <small v-if="memoria.descripcionArticuloReferencia">
          {{ memoria.descripcionArticuloReferencia }} · {{ memoria.codigoArticuloReferencia }}
        </small>
        <div class="acciones-memoria-capitana-bita">
          <button type="button" @click="editar(memoria)"><IconEdit :size="18" /> Editar</button>
          <button type="button" class="boton-eliminar-memoria" @click="memoriaAEliminar = memoria">
            <IconTrash :size="18" /> Eliminar
          </button>
        </div>
      </template>
    </article>
    <ModalEliminar
      v-if="memoriaAEliminar"
      :texto="`la memoria ${memoriaAEliminar.expresionUsuario}`"
      @confirmar="confirmarEliminacion"
      @cerrar="memoriaAEliminar = null"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Notify } from 'quasar'
import { IconEdit, IconTrash } from '@tabler/icons-vue'
import ModalEliminar from '../Modales/ModalEliminar.vue'
import {
  actualizarMemoriaCapitanaBita,
  eliminarMemoriaCapitanaBita,
  obtenerMemoriasCapitanaBita,
} from '../BaseDeDatos/UsoAlmacenamientoMemoriasCapitanaBita.js'

const memorias = ref([])
const memoriaEnEdicion = ref(null)
const memoriaAEliminar = ref(null)
const memoriasOrdenadas = computed(() =>
  [...memorias.value].sort((a, b) =>
    `${a.contexto} ${a.expresionUsuario}`.localeCompare(
      `${b.contexto} ${b.expresionUsuario}`,
      'es',
    ),
  ),
)

async function cargarMemorias() {
  memorias.value = await obtenerMemoriasCapitanaBita()
}

function editar(memoria) {
  memoriaEnEdicion.value = { ...memoria }
}

function cancelarEdicion() {
  memoriaEnEdicion.value = null
}

async function guardarEdicion() {
  try {
    await actualizarMemoriaCapitanaBita(memoriaEnEdicion.value.id, memoriaEnEdicion.value)
    memoriaEnEdicion.value = null
    await cargarMemorias()
    Notify.create({ type: 'positive', message: 'Memoria actualizada', position: 'top' })
  } catch (error) {
    Notify.create({ type: 'negative', message: error.message, position: 'top' })
  }
}

async function confirmarEliminacion() {
  const id = memoriaAEliminar.value?.id
  memoriaAEliminar.value = null
  if (!id) return
  await eliminarMemoriaCapitanaBita(id)
  await cargarMemorias()
  Notify.create({ type: 'positive', message: 'Memoria eliminada', position: 'top' })
}

function cerrarPasoAtrasNativo() {
  if (memoriaAEliminar.value) {
    memoriaAEliminar.value = null
    return true
  }
  if (memoriaEnEdicion.value) {
    cancelarEdicion()
    return true
  }
  return false
}

onMounted(cargarMemorias)
defineExpose({ cerrarPasoAtrasNativo })
</script>

<style scoped>
.gestion-memorias-capitana-bita {
  display: grid;
  gap: 0.75rem;
}
.estado-vacio-memorias {
  margin: 0;
  color: var(--color-texto-secundario);
}
.tarjeta-memoria-capitana-bita {
  display: grid;
  gap: 0.5rem;
  padding: 0.85rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
}
.tarjeta-memoria-capitana-bita label {
  display: grid;
  gap: 0.25rem;
  color: var(--color-texto-secundario);
  font-size: 0.82rem;
}
.tarjeta-memoria-capitana-bita small {
  color: var(--color-texto-secundario);
}
.acciones-memoria-capitana-bita {
  display: flex;
  gap: 0.5rem;
}
.acciones-memoria-capitana-bita button {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.7rem;
  border: 1px solid var(--color-primario);
  border-radius: 8px;
  background: var(--color-primario);
  color: var(--color-texto-principal);
  cursor: pointer;
}
.acciones-memoria-capitana-bita .boton-secundario-memoria,
.acciones-memoria-capitana-bita .boton-eliminar-memoria {
  background: var(--color-superficie);
}
.acciones-memoria-capitana-bita .boton-eliminar-memoria {
  border-color: var(--color-error);
  color: var(--color-error);
}
</style>
