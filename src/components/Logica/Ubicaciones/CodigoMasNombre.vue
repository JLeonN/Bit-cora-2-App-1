<template>
  <div class="contenedor-buscador" v-if="mostrarLista">
    <!-- Título con estado de base de datos -->
    <div class="titulo-tarjeta">
      <span v-if="baseDatosCargada">Artículos encontrados</span>
      <span v-else class="titulo-sin-base">Base de datos no cargada</span>
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
      <div class="texto-sin-resultados">Artículo inexistente</div>
    </div>

    <!-- Base de datos no cargada -->
    <div v-else-if="!baseDatosCargada" class="sin-base-datos">
      <div class="texto-sin-base">
        <IconDatabaseX :size="24" />
        <span>Cargar base de datos primero</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { IconDatabaseX } from '@tabler/icons-vue'
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
  const palabras = terminoBusqueda.split(/\s+/) // dividir en palabras
  const resultados = []

  // Códigos que empiecen con la búsqueda (PRIORIDAD MÁXIMA)
  const codigosEmpiezan = articulosDisponibles.value.filter((articulo) =>
    articulo.codigo.toLowerCase().startsWith(terminoBusqueda),
  )

  // Nombres que contengan todas las palabras en cualquier orden
  const nombresCoinciden = articulosDisponibles.value.filter((articulo) => {
    const nombre = articulo.nombre.toLowerCase()
    return palabras.every((palabra) => nombre.includes(palabra))
  })

  // Códigos que contengan la búsqueda (pero no empiecen)
  const codigosContienen = articulosDisponibles.value.filter(
    (articulo) =>
      articulo.codigo.toLowerCase().includes(terminoBusqueda) &&
      !codigosEmpiezan.includes(articulo),
  )

  // Combinar resultados
  resultados.push(...codigosEmpiezan)
  resultados.push(...nombresCoinciden)
  resultados.push(...codigosContienen)

  return resultados.slice(0, maximosResultados)
})

// --- FUNCIONES ---
function seleccionarArticulo(articulo) {
  emit('articulo-seleccionado', articulo)
}

function resaltarCoincidencia(texto, busqueda) {
  if (!busqueda || busqueda.length < caracteresMinimos) {
    return texto
  }

  const palabras = busqueda.trim().split(/\s+/).filter(Boolean)
  let textoResaltado = texto

  // resaltar cada palabra por separado
  palabras.forEach((palabra) => {
    const regex = new RegExp(`(${palabra})`, 'gi')
    textoResaltado = textoResaltado.replace(regex, '<span class="texto-resaltado">$1</span>')
  })

  return textoResaltado
}

function actualizarArticulos() {
  const estado = obtenerEstadoCarga()
  baseDatosCargada.value = estado.cargado

  if (estado.cargado) {
    articulosDisponibles.value = obtenerArticulosCargados()
    console.log(`Buscador actualizado: ${articulosDisponibles.value.length} artículos disponibles`)
  } else {
    articulosDisponibles.value = []
  }
}

// --- EXPONER FUNCIÓN PARA ACTUALIZAR DESDE PADRE ---
function refrescarBaseDatos() {
  actualizarArticulos()
}

// --- LIFECYCLE ---
onMounted(() => {
  actualizarArticulos()
})

// --- WATCH PARA REACTIVIDAD ---
// Escuchar cambios cada cierto tiempo (alternativa a eventos)
let intervalId = null
onMounted(() => {
  intervalId = setInterval(() => {
    const estadoActual = obtenerEstadoCarga()
    if (estadoActual.cargado !== baseDatosCargada.value) {
      actualizarArticulos()
    }
  }, 1000) // Revisar cada segundo
})

// Cleanup del interval
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})

// Exponer función para el componente padre
defineExpose({
  refrescarBaseDatos,
})
</script>
