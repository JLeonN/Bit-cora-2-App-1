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
            <div class="campo-responsive">
              <span class="label-responsive">Nombre y Código:</span>
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
            </div>
          </td>

          <td class="celda-ubicacion">
            <div class="campo-responsive">
              <span class="label-responsive">Ubicación:</span>
              <span class="globito-ubicacion" :title="etiqueta.ubicacion || 'Sin ubicación'">
                {{ etiqueta.ubicacion || 'Sin ubicación' }}
              </span>
            </div>
          </td>

          <td class="celda-cantidad">
            <div class="campo-responsive">
              <span class="label-responsive">Cantidad:</span>
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
            </div>
          </td>

          <td class="celda-acciones">
            <div class="campo-responsive">
              <span class="label-responsive">Acciones:</span>
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
/* Ocultar labels en desktop */
.label-responsive {
  display: none;
}
/* ===== COLUMNAS ===== */
.columna-nombre-codigo {
  width: 35%;
}
.columna-ubicacion {
  width: 10%;
}
.columna-cantidad {
  width: 20%;
  padding-left: 5rem !important;
}
.columna-acciones {
  width: 10%;
  text-align: center;
}
.celda-cantidad {
  padding-left: 1rem;
}
/* RESPONSIVE */
@media (max-width: 900px) {
  .tabla-ubicaciones {
    font-size: 0.85rem;
  }
  .tabla-ubicaciones th,
  .tabla-ubicaciones td {
    padding: 0.7rem 0.8rem;
  }
  .globito-ubicacion {
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
  }
}
@media (max-width: 600px) {
  .encabezado-tabla {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  .texto-secundario {
    width: 100%;
    padding: 0.3rem 0.6rem;
    font-size: 0.85rem;
  }
  .contenedor-boton-borrar-todo {
    margin-bottom: 0.5rem;
  }
  /* Tabla responsive - Modo cards */
  .tabla-ubicaciones {
    display: block;
    border: none;
    background: transparent;
  }
  .tabla-ubicaciones thead {
    display: none;
  }
  .tabla-ubicaciones tbody,
  .tabla-ubicaciones tr,
  .tabla-ubicaciones td {
    display: block;
    width: 100%;
  }
  .tabla-ubicaciones tbody tr {
    margin-bottom: 0.75rem;
    border: 1px solid var(--color-borde);
    border-radius: 8px;
    padding: 0.75rem;
    background: var(--color-superficie);
  }
  /* Colores en responsive */
  .tabla-ubicaciones tbody tr.fila-ubicacion-duplicada {
    background-color: rgba(255, 152, 0, 0.1);
  }
  .tabla-ubicaciones tbody tr.fila-articulo-inexistente {
    background-color: rgba(244, 67, 54, 0.1);
  }
  .tabla-ubicaciones td {
    padding: 0.4rem 0;
    border: none;
    text-align: left;
  }
  .campo-responsive {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  /* Mostrar labels en mobile */
  .label-responsive {
    display: block;
    font-weight: 600;
    color: var(--color-primario-claro);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 100px;
  }
  .globito-ubicacion {
    display: block;
    flex: 1;
    white-space: normal;
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
  }
  .contenedor-nombre-codigo {
    gap: 0.15rem;
  }
  .nombre-articulo {
    font-size: 0.9rem;
  }
  .codigo-articulo {
    font-size: 0.75rem;
  }
  .control-cantidad {
    justify-content: flex-start;
    gap: 0.4rem;
    flex: 1;
  }
  .boton-cantidad {
    width: 32px;
    height: 32px;
  }
  .input-cantidad {
    width: 45px;
    padding: 0.25rem;
    font-size: 0.85rem;
  }
  .acciones-ubicacion {
    justify-content: flex-start;
    gap: 10px;
    flex: 1;
  }
  .icono-ubicacion {
    width: 20px;
    height: 20px;
  }
  .sin-etiquetas {
    padding: 2rem 1rem;
  }
  .sin-etiquetas p {
    font-size: 1rem;
  }
  .texto-ayuda {
    font-size: 0.85rem;
  }
}
</style>
