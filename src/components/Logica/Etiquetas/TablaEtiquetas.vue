<template>
  <div class="contenedor-tabla">
    <div class="header-tabla">
      <h2 class="titulo-tabla">Etiqueta para imprimir</h2>
      <span class="contador-etiquetas" v-if="etiquetas.length > 0">
        {{ totalCopias }} etiqueta{{ totalCopias !== 1 ? 's' : '' }} en total
      </span>
    </div>

    <div v-if="etiquetas.length === 0" class="sin-etiquetas">
      <IconTag :size="48" :stroke="1.5" class="icono-vacio" />
      <p>No hay etiqueta agregadas</p>
      <span class="texto-ayuda">Agregá etiqueta usando el formulario de arriba</span>
    </div>

    <table v-else class="tabla-etiquetas">
      <thead>
        <tr>
          <th class="columna-codigo">Código</th>
          <th class="columna-descripcion">Descripción</th>
          <th class="columna-ubicacion">Ubicación</th>
          <th class="columna-cantidad">Cantidad</th>
          <th class="columna-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(etiqueta, indice) in etiquetas" :key="etiqueta.id" class="fila-etiqueta">
          <!-- Código -->
          <td class="celda-codigo">
            <span class="texto-codigo">{{ etiqueta.codigo }}</span>
          </td>

          <!-- Descripción -->
          <td class="celda-descripcion">
            <span class="texto-descripcion" :title="etiqueta.descripcion">
              {{ etiqueta.descripcion }}
            </span>
          </td>

          <!-- Ubicación -->
          <td class="celda-ubicacion">
            <span class="texto-ubicacion">{{ etiqueta.ubicacion }}</span>
          </td>

          <!-- Cantidad -->
          <td class="celda-cantidad">
            <div class="control-cantidad">
              <button
                type="button"
                class="boton-cantidad boton-menos"
                @click="decrementarCantidad(indice)"
                :disabled="etiqueta.cantidad <= 1"
              >
                <IconMinus :size="16" :stroke="2" />
              </button>

              <input
                type="number"
                min="1"
                v-model.number="etiqueta.cantidad"
                @change="actualizarCantidad(indice)"
                class="input-cantidad"
              />

              <button
                type="button"
                class="boton-cantidad boton-mas"
                @click="incrementarCantidad(indice)"
              >
                <IconPlus :size="16" :stroke="2" />
              </button>
            </div>
          </td>

          <!-- Acciones -->
          <td class="celda-acciones">
            <div class="acciones-etiqueta">
              <IconPencil
                class="icono-accion icono-editar"
                :size="20"
                :stroke="2"
                @click="editarEtiqueta(indice)"
                title="Editar"
              />
              <IconTrash
                class="icono-accion icono-borrar"
                :size="20"
                :stroke="2"
                @click="eliminarEtiqueta(indice)"
                title="Eliminar"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal Editar Etiqueta -->
    <ModalEditarEtiqueta
      v-if="mostrarModalEditar"
      :etiqueta="etiquetaEditando"
      @guardar="guardarEdicion"
      @cerrar="cerrarModalEditar"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconTag, IconPencil, IconTrash, IconPlus, IconMinus } from '@tabler/icons-vue'
import ModalEditarEtiqueta from '../../Modales/ModalEditarEtiqueta.vue'

const props = defineProps({
  etiquetas: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['editar-etiqueta', 'eliminar-etiqueta'])

// --- ESTADO REACTIVO ---
const mostrarModalEditar = ref(false)
const etiquetaEditando = ref(null)
const indiceEditando = ref(null)

// --- COMPUTED ---
const totalCopias = computed(() => {
  return props.etiquetas.reduce((total, etiqueta) => total + etiqueta.cantidad, 0)
})

// --- FUNCIONES ---
function incrementarCantidad(indice) {
  const etiquetaActualizada = { ...props.etiquetas[indice] }
  etiquetaActualizada.cantidad++
  emit('editar-etiqueta', etiquetaActualizada)
}

function decrementarCantidad(indice) {
  if (props.etiquetas[indice].cantidad > 1) {
    const etiquetaActualizada = { ...props.etiquetas[indice] }
    etiquetaActualizada.cantidad--
    emit('editar-etiqueta', etiquetaActualizada)
  }
}

function actualizarCantidad(indice) {
  const etiquetaActualizada = { ...props.etiquetas[indice] }
  if (etiquetaActualizada.cantidad < 1) {
    etiquetaActualizada.cantidad = 1
  }
  emit('editar-etiqueta', etiquetaActualizada)
}

function editarEtiqueta(indice) {
  etiquetaEditando.value = { ...props.etiquetas[indice] }
  indiceEditando.value = indice
  mostrarModalEditar.value = true
}

function guardarEdicion(etiquetaEditada) {
  emit('editar-etiqueta', etiquetaEditada)
  cerrarModalEditar()
}

function cerrarModalEditar() {
  mostrarModalEditar.value = false
  etiquetaEditando.value = null
  indiceEditando.value = null
}

function eliminarEtiqueta(indice) {
  emit('eliminar-etiqueta', indice)
}
</script>

<style scoped>
.contenedor-tabla {
  background-color: var(--color-superficie);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  margin-bottom: 1.5rem;
}
.header-tabla {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.titulo-tabla {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--color-texto-principal);
  margin: 0;
}
.contador-etiquetas {
  font-size: 0.9rem;
  color: var(--color-texto-secundario);
  background: var(--color-fondo);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-weight: 500;
}
/* Sin etiquetas */
.sin-etiquetas {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-texto-secundario);
}
.icono-vacio {
  color: var(--color-texto-secundario);
  opacity: 0.5;
  margin-bottom: 1rem;
}
.sin-etiquetas p {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--color-texto-principal);
}
.texto-ayuda {
  font-size: 0.9rem;
  font-style: italic;
}
/* Tabla */
.tabla-etiquetas {
  width: 100%;
  border-collapse: collapse;
}
.tabla-etiquetas th,
.tabla-etiquetas td {
  padding: 12px;
  border-bottom: 1px solid var(--color-borde);
  text-align: left;
  color: var(--color-texto-principal);
  vertical-align: middle;
}
.tabla-etiquetas th {
  color: var(--color-primario-claro);
  font-weight: 600;
  font-size: 0.9rem;
}
.tabla-etiquetas tbody tr:last-child td {
  border-bottom: none;
}
/* Columnas */
.columna-codigo {
  width: 15%;
}
.columna-descripcion {
  width: 35%;
}
.columna-ubicacion {
  width: 20%;
}
.columna-cantidad {
  width: 15%;
}
.columna-acciones {
  width: 15%;
  text-align: center;
}
/* Celdas */
.celda-codigo .texto-codigo {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: var(--color-primario-claro);
  font-size: 0.9rem;
}
.celda-descripcion .texto-descripcion {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-texto-principal);
}
.celda-ubicacion .texto-ubicacion {
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}
/* Control de cantidad */
.control-cantidad {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}
.boton-cantidad {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}
.boton-cantidad:hover:not(:disabled) {
  background: var(--color-superficie);
  border-color: var(--color-primario);
  color: var(--color-primario);
}
.boton-cantidad:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.input-cantidad {
  width: 50px;
  padding: 0.3rem;
  text-align: center;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 4px;
  font-size: 0.9rem;
}
.input-cantidad:focus {
  outline: none;
  border-color: var(--color-primario);
}
/* Acciones */
.acciones-etiqueta {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
}
.icono-accion {
  cursor: pointer;
  transition: transform 0.2s ease;
}
.icono-accion:hover {
  transform: scale(1.2);
}
.icono-editar {
  color: var(--color-acento);
}
.icono-borrar {
  color: var(--color-error);
}
/* Responsive */
@media (max-width: 900px) {
  .tabla-etiquetas {
    font-size: 0.85rem;
  }
  .tabla-etiquetas th,
  .tabla-etiquetas td {
    padding: 8px;
  }
  .control-cantidad {
    flex-direction: column;
    gap: 0.3rem;
  }
  .boton-cantidad {
    width: 100%;
  }
  .input-cantidad {
    width: 100%;
  }
}
@media (max-width: 600px) {
  .contenedor-tabla {
    padding: 1rem;
    overflow-x: auto;
  }
  .header-tabla {
    flex-direction: column;
    align-items: flex-start;
  }
  .tabla-etiquetas {
    display: block;
    overflow-x: auto;
  }
  .tabla-etiquetas thead {
    display: none;
  }
  .tabla-etiquetas tbody,
  .tabla-etiquetas tr,
  .tabla-etiquetas td {
    display: block;
    width: 100%;
  }
  .tabla-etiquetas tr {
    margin-bottom: 1rem;
    border: 1px solid var(--color-borde);
    border-radius: 8px;
    padding: 1rem;
    background: var(--color-fondo);
  }
  .tabla-etiquetas td {
    padding: 0.5rem 0;
    border: none;
    text-align: left;
  }
  .tabla-etiquetas td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-primario-claro);
    display: block;
    margin-bottom: 0.3rem;
    font-size: 0.85rem;
  }
  .celda-codigo::before {
    content: 'Código:';
  }
  .celda-descripcion::before {
    content: 'Descripción:';
  }
  .celda-ubicacion::before {
    content: 'Ubicación:';
  }
  .celda-cantidad::before {
    content: 'Cantidad:';
  }
  .celda-acciones::before {
    content: 'Acciones:';
  }
  .control-cantidad {
    flex-direction: row;
    justify-content: flex-start;
  }
  .acciones-etiqueta {
    justify-content: flex-start;
  }
}
</style>
