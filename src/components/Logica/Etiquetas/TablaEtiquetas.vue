<template>
  <div>
    <div class="encabezado-tabla">
      <p v-if="etiquetas.length > 0" class="texto-secundario">
        Etiquetas totales: {{ etiquetas.length }}
      </p>
      <p v-if="etiquetas.length > 0" class="texto-secundario">Copias totales: {{ totalCopias }}</p>
      <p v-if="cantidadCodigosRepetidos > 0" class="texto-secundario texto-repetidos">
        Códigos repetidos: {{ cantidadCodigosRepetidos }}
      </p>
      <p v-if="cantidadArticulosInexistentes > 0" class="texto-secundario texto-inexistente">
        Artículos inexistentes: {{ cantidadArticulosInexistentes }}
      </p>
    </div>

    <div class="contenedor-boton-borrar-todo" v-if="etiquetas.length > 0">
      <IconTrash
        class="icono-accion icono-borrar-todo"
        @click="confirmarLimpiar"
        title="Limpiar todas las etiquetas"
      />
    </div>

    <table class="tabla-ubicaciones" v-if="etiquetas.length > 0">
      <thead>
        <tr>
          <th class="columna-nombre-codigo">Nombre y Código</th>
          <th class="columna-ubicacion">Ubicación</th>
          <th class="columna-cantidad">Cantidad</th>
          <th class="columna-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(etiqueta, indice) in etiquetas"
          :key="etiqueta.id"
          class="fila-ubicacion"
          :class="{
            'fila-ubicacion-duplicada': codigosDuplicados.has(normalizarCodigo(etiqueta.codigo)),
            'fila-articulo-inexistente': esArticuloInexistente(etiqueta.codigo),
          }"
        >
          <td class="celda-nombre-codigo">
            <span
              class="globito-ubicacion"
              :class="{
                'texto-duplicado': codigosDuplicados.has(normalizarCodigo(etiqueta.codigo)),
                'texto-articulo-inexistente': esArticuloInexistente(etiqueta.codigo),
              }"
              :title="`${obtenerNombreArticulo(etiqueta.codigo)} - ${etiqueta.codigo}`"
            >
              <div class="contenedor-nombre-codigo">
                <div class="nombre-articulo">
                  {{ obtenerNombreArticulo(etiqueta.codigo) }}
                </div>
                <div class="codigo-articulo">{{ etiqueta.codigo }}</div>
              </div>
            </span>
          </td>

          <td class="celda-ubicacion">
            <span class="globito-ubicacion" :title="etiqueta.ubicacion || 'Sin ubicación'">
              {{ etiqueta.ubicacion || 'Sin ubicación' }}
            </span>
          </td>

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

          <td class="celda-acciones">
            <div class="acciones-ubicacion">
              <IconPencil
                class="icono-ubicacion icono-editar"
                @click="editarEtiqueta(indice)"
                title="Editar etiqueta"
              />
              <IconTrash
                class="icono-ubicacion icono-borrar"
                @click="eliminarEtiqueta(indice)"
                title="Eliminar etiqueta"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="etiquetas.length === 0" class="sin-etiquetas">
      <IconTag :size="48" :stroke="1.5" class="icono-vacio" />
      <p>No hay etiquetas agregadas</p>
      <span class="texto-ayuda">Agregá etiquetas usando el formulario de arriba</span>
    </div>

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
import { IconPencil, IconTrash, IconPlus, IconMinus, IconTag } from '@tabler/icons-vue'
import ModalEditarEtiqueta from '../../Modales/ModalEditarEtiqueta.vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'

const props = defineProps({
  etiquetas: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['editar-etiqueta', 'eliminar-etiqueta', 'limpiar-todo'])

// --- ESTADO REACTIVO ---
const mostrarModalEditar = ref(false)
const etiquetaEditando = ref(null)
const indiceEditando = ref(null)

// --- COMPUTED ---
const totalCopias = computed(() => {
  return props.etiquetas.reduce((total, etiqueta) => total + (etiqueta.cantidad || 1), 0)
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
  if (etiquetaActualizada.cantidad < 1 || !etiquetaActualizada.cantidad) {
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

function confirmarLimpiar() {
  if (confirm('¿Estás seguro de que querés limpiar todas las etiquetas?')) {
    emit('limpiar-todo')
  }
}

// --- Función para normalizar solo el código ---
function normalizarCodigo(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return ''
  }
  return codigo.trim().toUpperCase()
}

// --- Función para obtener el nombre del artículo ---
function obtenerNombreArticulo(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return 'Artículo inexistente'
  }

  try {
    const articulosCargados = obtenerArticulosCargados()
    if (!Array.isArray(articulosCargados)) {
      return 'Base de datos no cargada'
    }

    const articuloEncontrado = articulosCargados.find(
      (articulo) =>
        articulo &&
        articulo.codigo &&
        typeof articulo.codigo === 'string' &&
        articulo.codigo.toLowerCase() === codigo.toLowerCase(),
    )

    // Si no lo encuentra, usa la descripción de la etiqueta como fallback
    const etiquetaActual = props.etiquetas.find((e) => e.codigo === codigo)
    return articuloEncontrado?.nombre || etiquetaActual?.descripcion || 'Artículo inexistente'
  } catch (error) {
    console.error('[obtenerNombreArticulo] Error:', error)
    return 'Error al buscar artículo'
  }
}

// --- Función para verificar si un artículo existe ---
function esArticuloInexistente(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return true
  }

  try {
    const articulosCargados = obtenerArticulosCargados()
    if (!Array.isArray(articulosCargados)) {
      return true
    }

    return !articulosCargados.some(
      (articulo) =>
        articulo &&
        articulo.codigo &&
        typeof articulo.codigo === 'string' &&
        articulo.codigo.toLowerCase() === codigo.toLowerCase(),
    )
  } catch (error) {
    console.error('[esArticuloInexistente] Error:', error)
    return true
  }
}

// --- Lógica de duplicados ---
const codigosDuplicados = computed(() => {
  try {
    const conteo = new Map()
    for (const etiqueta of props.etiquetas) {
      if (!etiqueta || !etiqueta.codigo) continue
      const codigoNormalizado = normalizarCodigo(etiqueta.codigo)
      if (codigoNormalizado) {
        conteo.set(codigoNormalizado, (conteo.get(codigoNormalizado) || 0) + 1)
      }
    }
    const duplicados = new Set()
    for (const [codigo, cantidad] of conteo.entries()) {
      if (cantidad > 1) {
        duplicados.add(codigo)
      }
    }
    return duplicados
  } catch (error) {
    console.error('[codigosDuplicados] Error:', error)
    return new Set()
  }
})

// --- Conteo de etiquetas con códigos repetidos ---
const cantidadCodigosRepetidos = computed(() => {
  try {
    return props.etiquetas.filter(
      (etiqueta) =>
        etiqueta &&
        etiqueta.codigo &&
        codigosDuplicados.value.has(normalizarCodigo(etiqueta.codigo)),
    ).length
  } catch (error) {
    console.error('[cantidadCodigosRepetidos] Error:', error)
    return 0
  }
})

// --- Conteo de artículos inexistentes ---
const cantidadArticulosInexistentes = computed(() => {
  try {
    return props.etiquetas.filter((etiqueta) => etiqueta && esArticuloInexistente(etiqueta.codigo))
      .length
  } catch (error) {
    console.error('[cantidadArticulosInexistentes] Error:', error)
    return 0
  }
})
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
.acciones-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
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
.boton-limpiar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-error);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}
.boton-limpiar:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
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
  .acciones-header {
    width: 100%;
    justify-content: space-between;
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
