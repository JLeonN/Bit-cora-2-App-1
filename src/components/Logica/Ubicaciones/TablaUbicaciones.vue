<template>
  <div>
    <!-- Indicadores de cantidad -->
    <div class="encabezado-tabla">
      <p class="texto-secundario">Ubicaciones totales: {{ ubicacionesArray.length }}</p>
      <p v-if="cantidadCodigosRepetidos > 0" class="texto-secundario texto-repetidos">
        Códigos repetidos: {{ cantidadCodigosRepetidos }}
      </p>
      <p v-if="cantidadArticulosInexistentes > 0" class="texto-secundario texto-inexistente">
        Artículos inexistentes: {{ cantidadArticulosInexistentes }}
      </p>
      <!-- Estadística de ubicaciones antiguas -->
      <p v-if="cantidadConUbicacionAntigua > 0" class="texto-secundario texto-ubicacion-antigua">
        Con ubicación antigua: {{ cantidadConUbicacionAntigua }}
      </p>
    </div>

    <!-- Botón borrar toda la tabla -->
    <div class="contenedor-boton-borrar-todo" v-if="ubicacionesArray.length > 0">
      <IconTrash
        class="icono-accion icono-borrar-todo"
        @click="$emit('abrirModalEliminarTodas')"
        title="Borrar todas las ubicaciones"
      />
    </div>

    <!-- Tabla de ubicaciones -->
    <table class="tabla-ubicaciones" v-if="ubicacionesArray.length > 0">
      <thead>
        <tr>
          <th class="columna-nombre-codigo">Nombre y Código</th>
          <th class="columna-ubicacion">Ubicación</th>
          <th class="columna-ubicacion-antigua">Ubic. Antigua</th>
          <th class="columna-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in ubicacionesArray"
          :key="`ubicacion-${index}-${item.codigo || 'sin-codigo'}`"
          class="fila-ubicacion"
          :class="{
            'fila-ubicacion-duplicada': codigosDuplicados.has(normalizarCodigo(item.codigo)),
            'fila-articulo-inexistente': esArticuloInexistente(item.codigo),
            'fila-con-ubicacion-antigua': tieneUbicacionAntigua(item.codigo),
          }"
        >
          <td class="celda-nombre-codigo">
            <span
              class="globito-ubicacion"
              :class="{
                'texto-duplicado': codigosDuplicados.has(normalizarCodigo(item.codigo)),
                'texto-articulo-inexistente': esArticuloInexistente(item.codigo),
              }"
              :title="`${obtenerNombreArticulo(item.codigo)} - ${item.codigo || 'Sin código'}`"
            >
              <div class="contenedor-nombre-codigo">
                <div class="nombre-articulo">
                  {{ obtenerNombreArticulo(item.codigo) }}
                </div>
                <div class="codigo-articulo">
                  {{ mostrarCodigoTruncado(item.codigo) }}
                </div>
              </div>
            </span>
          </td>
          <td class="celda-ubicacion">
            <span class="globito-ubicacion" :title="item.ubicacion || 'Sin ubicación'">
              {{ item.ubicacion || 'Sin ubicación' }}
            </span>
          </td>
          <!-- Celda ubicación antigua -->
          <td class="celda-ubicacion-antigua">
            <span
              class="globito-ubicacion globito-ubicacion-antigua"
              :title="obtenerUbicacionAntigua(item.codigo) || 'Sin ubicación antigua'"
              :class="{
                'ubicacion-antigua-vacia': !obtenerUbicacionAntigua(item.codigo),
              }"
            >
              {{ obtenerUbicacionAntigua(item.codigo) || '-' }}
            </span>
          </td>
          <td class="celda-acciones">
            <div class="acciones-ubicacion">
              <IconPencil
                class="icono-ubicacion icono-editar"
                @click="$emit('abrirModalEditar', index)"
                title="Editar ubicación"
              />
              <IconTrash
                class="icono-ubicacion icono-borrar"
                @click="$emit('abrirModalEliminar', index)"
                title="Eliminar ubicación"
              />
            </div>
          </td>
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
import { computed } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import { obtenerArticulosCargados, obtenerUbicacionAntigua } from '../../BaseDeDatos/LectorExcel.js'

const props = defineProps({
  ubicaciones: {
    type: Array,
    required: true,
    default: () => [],
  },
})

// NUEVO: Computed para asegurar que siempre sea un array válido
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

// --- Función para normalizar solo el código ---
function normalizarCodigo(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return ''
  }
  return codigo.trim().toUpperCase()
}

// --- Función para mostrar código truncado ---
function mostrarCodigoTruncado(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return 'Sin código'
  }

  return codigo.length > 15 ? `${codigo.slice(0, 15)}...` : codigo
}

// --- Función para obtener el nombre del artículo ---
function obtenerNombreArticulo(codigo) {
  // Validar que el código recibido no esté vacío
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
        articulo && // NUEVO: Validar que el artículo existe
        articulo.codigo && // NUEVO: Validar que el código existe
        typeof articulo.codigo === 'string' && // NUEVO: Validar que es string
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
  // Validar que el código recibido no esté vacío
  if (!codigo || typeof codigo !== 'string') {
    return true // si no hay código, lo consideramos inexistente
  }

  try {
    const articulosCargados = obtenerArticulosCargados()

    if (!Array.isArray(articulosCargados)) {
      return true // Si no hay base de datos, consideramos inexistente
    }

    return !articulosCargados.some(
      (articulo) =>
        articulo && // NUEVO: Validar que el artículo existe
        articulo.codigo && // NUEVO: Validar que el código existe
        typeof articulo.codigo === 'string' && // NUEVO: Validar que es string
        articulo.codigo.toLowerCase() === codigo.toLowerCase(),
    )
  } catch (error) {
    console.error('[esArticuloInexistente] Error:', error)
    return true // En caso de error, consideramos inexistente
  }
}

// --- Función para verificar si tiene ubicación antigua ---
function tieneUbicacionAntigua(codigo) {
  try {
    const ubicacionAntigua = obtenerUbicacionAntigua(codigo)
    return ubicacionAntigua && ubicacionAntigua.trim() !== ''
  } catch (error) {
    console.error('[tieneUbicacionAntigua] Error:', error)
    return false
  }
}

// --- Lógica de duplicados ---
const codigosDuplicados = computed(() => {
  try {
    const conteo = new Map()

    // Contar ocurrencias de cada código
    for (const ubicacion of ubicacionesArray.value) {
      if (!ubicacion || !ubicacion.codigo) continue

      const codigoNormalizado = normalizarCodigo(ubicacion.codigo)
      if (codigoNormalizado) {
        conteo.set(codigoNormalizado, (conteo.get(codigoNormalizado) || 0) + 1)
      }
    }

    // Crear Set con códigos que aparecen más de una vez
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

// --- Conteo de ubicaciones con códigos repetidos ---
const cantidadCodigosRepetidos = computed(() => {
  try {
    return ubicacionesArray.value.filter(
      (ubicacion) =>
        ubicacion &&
        ubicacion.codigo &&
        codigosDuplicados.value.has(normalizarCodigo(ubicacion.codigo)),
    ).length
  } catch (error) {
    console.error('[cantidadCodigosRepetidos] Error:', error)
    return 0
  }
})

// --- Propiedad computada para contar artículos inexistentes ---
const cantidadArticulosInexistentes = computed(() => {
  try {
    return ubicacionesArray.value.filter(
      (ubicacion) => ubicacion && esArticuloInexistente(ubicacion.codigo),
    ).length
  } catch (error) {
    console.error('[cantidadArticulosInexistentes] Error:', error)
    return 0
  }
})

// --- Propiedad computada para contar ubicaciones con ubicación antigua ---
const cantidadConUbicacionAntigua = computed(() => {
  try {
    return ubicacionesArray.value.filter(
      (ubicacion) => ubicacion && tieneUbicacionAntigua(ubicacion.codigo),
    ).length
  } catch (error) {
    console.error('[cantidadConUbicacionAntigua] Error:', error)
    return 0
  }
})
</script>

<style scoped>
/* Estilos existentes */
.columna-ubicacion-antigua {
  width: 120px;
  text-align: center;
  background-color: #f8fafc;
  font-weight: 600;
  color: #475569;
  border: 1px solid #e2e8f0;
}
.celda-ubicacion-antigua {
  padding: 8px;
  text-align: center;
  vertical-align: middle;
  border: 1px solid #e2e8f0;
  background-color: #fafbfc;
}
.globito-ubicacion-antigua {
  background-color: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
  font-size: 0.85rem;
  font-weight: 500;
}
.ubicacion-antigua-vacia {
  background-color: #f1f5f9;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
  font-style: italic;
}
/* Destacar filas con ubicación antigua */
.fila-con-ubicacion-antigua {
  background-color: #fefbff;
}
/* Estadística de ubicaciones antiguas */
.texto-ubicacion-antigua {
  color: #3730a3;
  font-weight: 500;
}
/* Ajustar ancho de tabla para nueva columna */
.tabla-ubicaciones {
  min-width: 800px;
}
/* Mensaje cuando no hay ubicaciones */
.mensaje-vacio {
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-style: italic;
}
/* Responsive: Ocultar ubicación antigua en pantallas pequeñas */
@media (max-width: 768px) {
  .columna-ubicacion-antigua,
  .celda-ubicacion-antigua {
    display: none;
  }
  .tabla-ubicaciones {
    min-width: 600px;
  }
}
/* Hover effects mejorados */
.fila-ubicacion:hover .globito-ubicacion-antigua {
  background-color: #ddd6fe;
  transform: scale(1.02);
}
.globito-ubicacion-antigua:hover {
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}
</style>
