<template>
  <div class="contenedor-buscador" v-if="mostrarLista">
    <!-- Título con estado de base de datos -->
    <div class="titulo-tarjeta">
      <span v-if="baseDatosCargada">Artículos encontrados</span>
      <span v-else class="titulo-sin-base">
        <IconDatabaseX :size="16" />
        Base de datos no cargada
      </span>
    </div>

    <!-- Resultados de búsqueda -->
    <div class="lista-resultados" v-if="resultadosBusqueda.length > 0 && baseDatosCargada">
      <div
        v-for="(articulo, indice) in resultadosBusqueda"
        :key="indice"
        class="item-resultado"
        @click="seleccionarArticulo(articulo)"
      >
        <!-- Nombre primero -->
        <div
          class="nombre-resultado"
          v-html="resaltarCoincidencia(articulo.nombre, busqueda)"
        ></div>
        <!-- Código después -->
        <div
          class="codigo-resultado"
          v-html="resaltarCoincidencia(articulo.codigo, busqueda)"
        ></div>
      </div>
    </div>

    <!-- Sin resultados pero con base de datos cargada -->
    <div
      v-else-if="busqueda.length >= caracteresMinimos && baseDatosCargada"
      class="sin-resultados"
    >
      <div class="texto-sin-resultados">
        <IconSearch :size="16" />
        Artículo inexistente
      </div>
    </div>

    <!-- Base de datos no cargada -->
    <div v-else-if="!baseDatosCargada" class="sin-base-datos">
      <div class="texto-sin-base">
        <IconDatabaseX :size="20" />
        <span>Selecciona un archivo Excel primero</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { IconDatabaseX, IconSearch } from '@tabler/icons-vue'
import { obtenerArticulosCargados, obtenerEstadoCarga } from '../../BaseDeDatos/LectorExcel.js'

// --- PROPS ---
const props = defineProps({
  busqueda: {
    type: String,
    default: '',
  },
})

// --- EMITS ---
const emit = defineEmits(['articulo-seleccionado'])

// --- ESTADO REACTIVO ---
const articulosDisponibles = ref([])
const baseDatosCargada = ref(false)
const cantidadArticulos = ref(0)

// --- CONFIGURACIÓN DEL BUSCADOR ---
const caracteresMinimos = 3
const maximosResultados = 3

// --- COMPUTED PARA MOSTRAR/OCULTAR LISTA ---
const mostrarLista = computed(() => {
  return props.busqueda.length >= caracteresMinimos
})

// --- COMPUTED PARA RESULTADOS DE BÚSQUEDA ---
const resultadosBusqueda = computed(() => {
  if (props.busqueda.length < caracteresMinimos || !baseDatosCargada.value) {
    return []
  }

  const terminoBusqueda = props.busqueda.toLowerCase().trim()
  const palabras = terminoBusqueda.split(/\s+/).filter(Boolean)
  const resultados = []

  // Códigos que empiecen exactamente con la búsqueda
  const codigosEmpiezan = articulosDisponibles.value.filter((articulo) =>
    articulo.codigo.toLowerCase().startsWith(terminoBusqueda),
  )

  // Nombres que contengan todas las palabras en cualquier orden
  const nombresCoinciden = articulosDisponibles.value.filter((articulo) => {
    const nombre = articulo.nombre.toLowerCase()
    return (
      palabras.every((palabra) => nombre.includes(palabra)) && !codigosEmpiezan.includes(articulo)
    ) // Evitar duplicados
  })

  // Códigos que contengan la búsqueda (pero no empiecen)
  const codigosContienen = articulosDisponibles.value.filter(
    (articulo) =>
      articulo.codigo.toLowerCase().includes(terminoBusqueda) &&
      !codigosEmpiezan.includes(articulo) &&
      !nombresCoinciden.includes(articulo), // Evitar duplicados
  )

  // Nombres que contengan al menos una palabra
  const nombresParcialesCoinciden = articulosDisponibles.value.filter((articulo) => {
    const nombre = articulo.nombre.toLowerCase()
    return (
      palabras.some((palabra) => nombre.includes(palabra)) &&
      !codigosEmpiezan.includes(articulo) &&
      !nombresCoinciden.includes(articulo) &&
      !codigosContienen.includes(articulo)
    ) // Evitar duplicados
  })

  // Combinar resultados por prioridad
  resultados.push(...codigosEmpiezan)
  resultados.push(...nombresCoinciden)
  resultados.push(...codigosContienen)
  resultados.push(...nombresParcialesCoinciden)

  return resultados.slice(0, maximosResultados)
})

// --- FUNCIONES ---
function seleccionarArticulo(articulo) {
  console.log('[CodigoMasNombre] Artículo seleccionado:', articulo)
  emit('articulo-seleccionado', articulo)
}

function resaltarCoincidencia(texto, busqueda) {
  if (!busqueda || busqueda.length < caracteresMinimos) {
    return texto
  }

  const palabras = busqueda.trim().split(/\s+/).filter(Boolean)
  let textoResaltado = texto

  // Resaltar cada palabra por separado
  palabras.forEach((palabra) => {
    const regex = new RegExp(`(${escaparRegex(palabra)})`, 'gi')
    textoResaltado = textoResaltado.replace(regex, '<span class="texto-resaltado">$1</span>')
  })

  return textoResaltado
}

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function actualizarArticulos() {
  const estado = obtenerEstadoCarga()
  const estadoAnterior = baseDatosCargada.value

  baseDatosCargada.value = estado.cargado
  cantidadArticulos.value = estado.cantidad

  if (estado.cargado) {
    articulosDisponibles.value = obtenerArticulosCargados()
    console.log(
      `[CodigoMasNombre] Base actualizada: ${articulosDisponibles.value.length} artículos`,
    )

    // Log solo si cambió el estado
    if (!estadoAnterior) {
      console.log('[CodigoMasNombre] Base de datos ahora disponible para búsqueda')
    }
  } else {
    articulosDisponibles.value = []

    // Log solo si cambió el estado
    if (estadoAnterior) {
      console.log('[CodigoMasNombre] Base de datos ya no está disponible')
    }
  }
}

// --- WATCHER PARA DETECTAR CAMBIOS EN LA BASE DE DATOS ---
// Usamos un polling ligero para detectar cambios
let intervalId = null

function iniciarMonitoreo() {
  intervalId = setInterval(() => {
    const estadoActual = obtenerEstadoCarga()

    // Solo actualizar si hay cambios reales
    if (
      estadoActual.cargado !== baseDatosCargada.value ||
      estadoActual.cantidad !== cantidadArticulos.value
    ) {
      actualizarArticulos()
    }
  }, 1000) // Revisar cada segundo
}

function detenerMonitoreo() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// --- FUNCIÓN PÚBLICA PARA REFRESCAR MANUALMENTE ---
function refrescarBaseDatos() {
  console.log('[CodigoMasNombre] Refrescando base de datos manualmente...')
  actualizarArticulos()
}

// --- LIFECYCLE ---
onMounted(() => {
  console.log('[CodigoMasNombre] Componente montado')
  actualizarArticulos()
  iniciarMonitoreo()
})

onUnmounted(() => {
  console.log('[CodigoMasNombre] Componente desmontado')
  detenerMonitoreo()
})

// --- WATCH PARA LOG DE BÚSQUEDAS (solo en desarrollo) ---
if (import.meta.env.DEV) {
  watch(
    () => props.busqueda,
    (nuevaBusqueda, busquedaAnterior) => {
      if (nuevaBusqueda.length >= caracteresMinimos && nuevaBusqueda !== busquedaAnterior) {
        console.log(
          `[CodigoMasNombre] Búsqueda: "${nuevaBusqueda}" → ${resultadosBusqueda.value.length} resultados`,
        )
      }
    },
  )
}

// --- EXPONER FUNCIONES PARA EL COMPONENTE PADRE ---
defineExpose({
  refrescarBaseDatos,
  obtenerEstadoBase: () => ({
    cargada: baseDatosCargada.value,
    cantidad: cantidadArticulos.value,
    articulos: articulosDisponibles.value.length,
  }),
})
</script>
