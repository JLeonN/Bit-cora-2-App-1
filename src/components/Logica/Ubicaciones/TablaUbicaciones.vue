<template>
  <div>
    <div
      v-if="ubicacionesArray.length > 0 && (mostrarEtiquetas || mostrarEliminarTodas)"
      class="acciones-generales-tabla"
    >
      <button
        v-if="mostrarEtiquetas"
        type="button"
        class="boton-accion-general boton-enviar-etiquetas"
        title="Enviar todos a Etiquetas"
        @click="enviarTodasEtiquetas"
      >
        <IconTag :size="20" />
        <span class="texto-boton-accion">Enviar todos a Etiquetas</span>
      </button>
      <button
        v-if="mostrarEliminarTodas"
        type="button"
        class="boton-accion-general boton-eliminar-todos"
        title="Eliminar todos"
        @click="$emit('abrirModalEliminarTodas')"
      >
        <IconTrash :size="20" />
        <span class="texto-boton-accion">Eliminar todos</span>
      </button>
    </div>

    <!-- Tabla de ubicaciones -->
    <table class="tabla-ubicaciones" v-if="ubicacionesArray.length > 0">
      <thead>
        <tr>
          <th class="columna-nombre-codigo">Nombre y Código</th>
          <th class="columna-ubicacion">Ubicación</th>
          <th class="columna-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="fila in ubicacionesFiltradas"
          :key="`ubicacion-${fila.indice}-${fila.ubicacion.codigo || 'sin-codigo'}`"
          class="fila-ubicacion"
          :class="{
            'fila-ubicacion-duplicada': codigosDuplicados.has(normalizarCodigo(fila.ubicacion.codigo)),
            'fila-articulo-inexistente': esArticuloInexistente(fila.ubicacion.codigo),
            'animacion-envio-individual': filaAnimandose === fila.indice,
            'animacion-envio-todas': todasAnimandose,
          }"
        >
          <td class="celda-nombre-codigo">
            <span
              class="globito-ubicacion"
              :class="{
                'texto-duplicado': codigosDuplicados.has(normalizarCodigo(fila.ubicacion.codigo)),
                'texto-articulo-inexistente': esArticuloInexistente(fila.ubicacion.codigo),
              }"
              :title="`${obtenerNombreArticulo(fila.ubicacion.codigo)} - ${fila.ubicacion.codigo || 'Sin código'}`"
            >
              <div class="contenedor-nombre-codigo">
                <div class="nombre-articulo">
                  {{ obtenerNombreArticulo(fila.ubicacion.codigo) }}
                </div>
                <div class="codigo-articulo">
                  {{ mostrarCodigoCompleto(fila.ubicacion.codigo) }}
                </div>
              </div>
            </span>
          </td>
          <td class="celda-ubicacion">
            <span class="globito-ubicacion" :title="fila.ubicacion.ubicacion || 'Sin ubicación'">
              {{ fila.ubicacion.ubicacion || 'Sin ubicación' }}
            </span>
          </td>
          <td class="celda-acciones">
            <div class="acciones-ubicacion">
              <IconTag
                v-if="mostrarEtiquetas"
                class="icono-ubicacion icono-etiqueta"
                @click="enviarEtiquetaIndividual(fila.ubicacion, fila.indice)"
                title="Enviar a etiquetas"
                :stroke="2"
              />
              <IconPencil
                class="icono-ubicacion icono-editar"
                @click="$emit('abrirModalEditar', fila.indice)"
                title="Editar ubicación"
              />
              <IconTrash
                class="icono-ubicacion icono-borrar"
                @click="$emit('abrirModalEliminar', fila.indice)"
                title="Eliminar ubicación"
              />
            </div>
          </td>
        </tr>
        <tr v-if="ubicacionesFiltradas.length === 0">
          <td colspan="3" class="texto-secundario">No se encontraron artículos.</td>
        </tr>
      </tbody>
    </table>

    <!-- Mensaje cuando no hay ubicaciones -->
    <div v-else class="mensaje-vacio">
      <p>No hay ubicaciones registradas</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { IconPencil, IconTrash, IconTag } from '@tabler/icons-vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'

const props = defineProps({
  ubicaciones: {
    type: Array,
    required: true,
    default: () => [],
  },
  textoBusqueda: {
    type: String,
    default: '',
  },
  mostrarEtiquetas: {
    type: Boolean,
    default: true,
  },
  mostrarEliminarTodas: {
    type: Boolean,
    default: true,
  },
})

// Refs para controlar animaciones
const filaAnimandose = ref(null)
const todasAnimandose = ref(false)

// Computed para asegurar que siempre sea un array válido
const ubicacionesArray = computed(() => {
  if (!Array.isArray(props.ubicaciones)) {
    console.warn(
      '[TablaUbicaciones] Props ubicaciones no es array:',
      typeof props.ubicaciones,
      props.ubicaciones,
    )
    return []
  }

  // Filtrar ubicaciones válidas
  return props.ubicaciones.filter(
    (ubicacion) =>
      ubicacion && typeof ubicacion === 'object' && (ubicacion.codigo || ubicacion.ubicacion),
  )
})

const ubicacionesFiltradas = computed(() => {
  const textoBusquedaNormalizado = String(props.textoBusqueda || '').trim().toLowerCase()
  return ubicacionesArray.value
    .map((ubicacion, indice) => ({ ubicacion, indice }))
    .filter(({ ubicacion }) => {
      if (!textoBusquedaNormalizado) return true
      const codigo = String(ubicacion.codigo || '').toLowerCase()
      const nombre = obtenerNombreArticulo(ubicacion.codigo).toLowerCase()
      return codigo.includes(textoBusquedaNormalizado) || nombre.includes(textoBusquedaNormalizado)
    })
})

// --- Función para normalizar solo el código ---
function normalizarCodigo(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return ''
  }
  return codigo.trim().toUpperCase()
}

// --- Función para mostrar código completo ---
function mostrarCodigoCompleto(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return 'Sin código'
  }

  return codigo
}

// --- Función para obtener el nombre del artículo ---
function obtenerNombreArticulo(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    console.warn('[obtenerNombreArticulo] Código inválido:', codigo)
    return 'Artículo inexistente'
  }

  try {
    const articulosCargados = obtenerArticulosCargados()

    if (!Array.isArray(articulosCargados)) {
      console.warn('[obtenerNombreArticulo] articulosCargados no es array')
      return 'Base de datos no cargada'
    }

    const articuloEncontrado = articulosCargados.find(
      (articulo) =>
        articulo &&
        articulo.codigo &&
        typeof articulo.codigo === 'string' &&
        articulo.codigo.toLowerCase() === codigo.toLowerCase(),
    )

    return articuloEncontrado?.nombre || 'Artículo inexistente'
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

    for (const ubicacion of ubicacionesArray.value) {
      if (!ubicacion || !ubicacion.codigo) continue

      const codigoNormalizado = normalizarCodigo(ubicacion.codigo)
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

// Función para enviar etiqueta individual con animación
function enviarEtiquetaIndividual(item, index) {
  // Activar animación
  filaAnimandose.value = index

  // Emitir evento
  emit('enviar-a-etiquetas', item)

  // Desactivar animación después de 500ms
  setTimeout(() => {
    filaAnimandose.value = null
  }, 500)
}

// Función para enviar todas las etiquetas con animación
function enviarTodasEtiquetas() {
  // Activar animación de toda la tabla
  todasAnimandose.value = true

  // Crear array de etiquetas
  const etiquetas = ubicacionesArray.value.map((item) => ({
    codigo: item.codigo,
    descripcion: obtenerNombreArticulo(item.codigo),
    ubicacion: item.ubicacion,
    cantidad: 1,
    tamano: '10x15cm',
    id: Date.now() + Math.random(),
  }))

  // Emitir evento
  if (etiquetas.length > 0) {
    emit('enviar-todas-a-etiquetas', etiquetas)
  }

  // Desactivar animación después de 600ms
  setTimeout(() => {
    todasAnimandose.value = false
  }, 600)
}

const emit = defineEmits([
  'abrirModalEliminarTodas',
  'enviar-a-etiquetas',
  'abrirModalEditar',
  'abrirModalEliminar',
  'enviar-todas-a-etiquetas',
])
</script>
