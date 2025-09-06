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

<style scoped>
.contenedor-buscador {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  margin-top: 2px;
}

/* Título de la tarjeta */
.titulo-tarjeta {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-size: 13px;
  font-weight: 600;
  color: #495057;
}

.titulo-sin-base {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #dc3545;
}

/* Lista de resultados */
.lista-resultados {
  max-height: 200px;
  overflow-y: auto;
}

.item-resultado {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f4;
  transition: background-color 0.2s ease;
}

.item-resultado:hover {
  background: #f8f9ff;
}

.item-resultado:last-child {
  border-bottom: none;
}

.nombre-resultado {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
  line-height: 1.3;
}

.codigo-resultado {
  font-size: 12px;
  color: #666;
  font-family: 'Courier New', monospace;
  line-height: 1.2;
}

/* Texto resaltado */
:deep(.texto-resaltado) {
  background: #fff3cd;
  color: #856404;
  font-weight: 600;
  padding: 1px 2px;
  border-radius: 2px;
}

/* Sin resultados */
.sin-resultados {
  padding: 16px;
  text-align: center;
}

.texto-sin-resultados {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6c757d;
  font-size: 13px;
  font-style: italic;
}

/* Sin base de datos */
.sin-base-datos {
  padding: 16px;
  text-align: center;
}

.texto-sin-base {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #dc3545;
  font-size: 13px;
  font-weight: 500;
}

/* Scrollbar personalizada */
.contenedor-buscador::-webkit-scrollbar {
  width: 6px;
}

.contenedor-buscador::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.contenedor-buscador::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.contenedor-buscador::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Animación de entrada */
.contenedor-buscador {
  animation: deslizarAbajo 0.2s ease-out;
}

@keyframes deslizarAbajo {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 600px) {
  .contenedor-buscador {
    max-height: 250px;
  }

  .item-resultado {
    padding: 10px 12px;
  }

  .nombre-resultado {
    font-size: 13px;
  }

  .codigo-resultado {
    font-size: 11px;
  }
}
</style>
