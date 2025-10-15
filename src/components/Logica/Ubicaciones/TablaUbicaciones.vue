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
    </div>

    <!-- Botón borrar toda la tabla -->
    <div class="contenedor-boton-borrar-todo" v-if="ubicacionesArray.length > 0">
      <IconTag
        class="icono-accion icono-etiqueta"
        @click="enviarTodasEtiquetas"
        title="Enviar todas a etiquetas"
        :stroke="2"
        style="margin-right: 16px"
      />
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
          <td class="celda-acciones">
            <div class="acciones-ubicacion">
              <IconTag
                class="icono-ubicacion icono-etiqueta"
                @click="$emit('enviar-a-etiquetas', item)"
                title="Enviar a etiquetas"
                :stroke="2"
              />
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
import { IconPencil, IconTrash, IconTag } from '@tabler/icons-vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'

const props = defineProps({
  ubicaciones: {
    type: Array,
    required: true,
    default: () => [],
  },
})

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

// --- Conteo de artículos inexistentes ---
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

// --- Función para enviar todas las ubicaciones a etiquetas ---
function enviarTodasEtiquetas() {
  // Envía todas las ubicaciones con cantidad 1 y tamaño 10x15cm
  const etiquetas = ubicacionesArray.value.map((item) => ({
    codigo: item.codigo,
    descripcion: obtenerNombreArticulo(item.codigo),
    ubicacion: item.ubicacion,
    cantidad: 1,
    tamano: '10x15cm',
    id: Date.now() + Math.random(), // id único
  }))
  // Emitir evento interno
  // Puedes cambiar el nombre del evento si lo necesitas
  // El padre debe escuchar 'enviar-todas-a-etiquetas'
  // Si prefieres otro nombre, avísame
  if (etiquetas.length > 0) {
    // Emitir todas las etiquetas
    // El padre debe manejar la recepción y la notificación
    // Aquí solo se emite
    // Puedes agregar lógica de notificación aquí si lo deseas
    // (lo agrego en el siguiente paso)
    //
    // Emitir evento:
    // $emit('enviar-todas-a-etiquetas', etiquetas)
    //
    // Como estamos en <script setup>, usamos defineEmits:
    emit('enviar-todas-a-etiquetas', etiquetas)
  }
}

const emit = defineEmits([
  'abrirModalEliminarTodas',
  'enviar-a-etiquetas',
  'abrirModalEditar',
  'abrirModalEliminar',
  'enviar-todas-a-etiquetas', // nuevo evento
])
</script>
