<template>
  <div class="contenedor-buscador" v-if="mostrarLista">
    <!-- Título con estado de base de datos -->
    <div class="tarjeta-resultados-mejorada">
      <div class="titulo-tarjeta-mejorado">
        <span v-if="baseDatosCargada">Artículos encontrados</span>
        <span v-else class="titulo-sin-base-mejorado">
          <IconDatabaseX :size="16" />
          Base de datos no cargada
        </span>
      </div>

      <!-- Resultados de búsqueda -->
      <div
        class="lista-resultados-mejorada"
        v-if="resultadosBusqueda.length > 0 && baseDatosCargada"
      >
        <!-- Mostrar tipo de coincidencia y ubicación antigua -->
        <div
          v-for="(resultado, indice) in resultadosBusqueda"
          :key="indice"
          class="item-resultado-mejorado"
          @click="seleccionarArticulo(resultado.articulo)"
        >
          <div class="nombre-resultado-mejorado">
            <span
              v-for="(parte, idx) in obtenerPartesTextoResaltado(
                resultado.articulo.nombre,
                busqueda,
              )"
              :key="idx"
              :class="{ 'texto-resaltado-mejorado': parte.resaltado }"
            >
              {{ parte.texto }}
            </span>
          </div>
          <div class="codigo-resultado-mejorado">
            <span
              v-for="(parte, idx) in obtenerPartesTextoResaltado(
                resultado.articulo.codigo,
                busqueda,
              )"
              :key="idx"
              :class="{ 'texto-resaltado-mejorado': parte.resaltado }"
            >
              {{ parte.texto }}
            </span>
          </div>
          <!-- Mostrar ubicación antigua si existe -->
          <div v-if="resultado.articulo.ubicacionAntigua" class="ubicacion-antigua-resultado">
            <span class="etiqueta-ubicacion-antigua">Ubic. Antigua:</span>
            <span
              v-for="(parte, idx) in obtenerPartesTextoResaltado(
                resultado.articulo.ubicacionAntigua,
                busqueda,
              )"
              :key="idx"
              :class="{ 'texto-resaltado-mejorado': parte.resaltado }"
            >
              {{ parte.texto }}
            </span>
          </div>
          <!-- Mostrar tipo de coincidencia -->
          <div class="tipo-coincidencia" :class="resultado.tipoCoincidencia">
            {{ obtenerTextoTipoCoincidencia(resultado.tipoCoincidencia) }}
          </div>
        </div>
      </div>

      <!-- Sin resultados pero con base de datos cargada -->
      <div
        v-else-if="busqueda.length >= caracteresMinimos && baseDatosCargada"
        class="sin-resultados-mejorado"
      >
        <div class="texto-sin-resultados-mejorado">
          <IconSearch :size="16" />
          Artículo inexistente
        </div>
      </div>

      <!-- Base de datos no cargada -->
      <div v-else-if="!baseDatosCargada" class="sin-base-datos-mejorada">
        <div class="texto-sin-base-mejorado">
          <IconDatabaseX :size="20" />
          <span>Selecciona un archivo Excel primero</span>
        </div>
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

// --- COMPUTED PARA RESULTADOS DE BÚSQUEDA CON UBICACIONES ANTIGUAS ---
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
  resultados.push(
    ...codigosEmpiezan.map((articulo) => ({
      articulo,
      tipoCoincidencia: 'codigo-exacto',
    })),
  )

  // Nombres que contengan todas las palabras en cualquier orden
  const nombresCoinciden = articulosDisponibles.value.filter((articulo) => {
    const nombre = articulo.nombre.toLowerCase()
    return (
      palabras.every((palabra) => nombre.includes(palabra)) && !codigosEmpiezan.includes(articulo)
    )
  })
  resultados.push(
    ...nombresCoinciden.map((articulo) => ({
      articulo,
      tipoCoincidencia: 'nombre-completo',
    })),
  )

  // Códigos que contengan la búsqueda (pero no empiecen)
  const codigosContienen = articulosDisponibles.value.filter(
    (articulo) =>
      articulo.codigo.toLowerCase().includes(terminoBusqueda) &&
      !codigosEmpiezan.includes(articulo) &&
      !nombresCoinciden.includes(articulo),
  )
  resultados.push(
    ...codigosContienen.map((articulo) => ({
      articulo,
      tipoCoincidencia: 'codigo-parcial',
    })),
  )

  // Ubicaciones antiguas que contengan la búsqueda
  const ubicacionesCoinciden = articulosDisponibles.value.filter((articulo) => {
    if (!articulo.ubicacionAntigua) return false

    const ubicacion = articulo.ubicacionAntigua.toLowerCase()
    return (
      ubicacion.includes(terminoBusqueda) &&
      !codigosEmpiezan.includes(articulo) &&
      !nombresCoinciden.includes(articulo) &&
      !codigosContienen.includes(articulo)
    )
  })
  resultados.push(
    ...ubicacionesCoinciden.map((articulo) => ({
      articulo,
      tipoCoincidencia: 'ubicacion-antigua',
    })),
  )

  // Nombres que contengan al menos una palabra
  const nombresParcialesCoinciden = articulosDisponibles.value.filter((articulo) => {
    const nombre = articulo.nombre.toLowerCase()
    return (
      palabras.some((palabra) => nombre.includes(palabra)) &&
      !codigosEmpiezan.includes(articulo) &&
      !nombresCoinciden.includes(articulo) &&
      !codigosContienen.includes(articulo) &&
      !ubicacionesCoinciden.includes(articulo)
    )
  })
  resultados.push(
    ...nombresParcialesCoinciden.map((articulo) => ({
      articulo,
      tipoCoincidencia: 'nombre-parcial',
    })),
  )

  return resultados.slice(0, maximosResultados)
})

// --- FUNCIONES ---
function seleccionarArticulo(articulo) {
  console.log('[CodigoMasNombre] Artículo seleccionado:', articulo)
  emit('articulo-seleccionado', articulo)
}

// Función para mostrar texto del tipo de coincidencia
function obtenerTextoTipoCoincidencia(tipo) {
  const tipos = {
    'codigo-exacto': 'Código exacto',
    'codigo-parcial': 'Código parcial',
    'nombre-completo': 'Nombre completo',
    'nombre-parcial': 'Nombre parcial',
    'ubicacion-antigua': 'Ubicación antigua',
  }
  return tipos[tipo] || ''
}

// Función corregida para manejar el resaltado sin v-html
function obtenerPartesTextoResaltado(texto, busqueda) {
  if (!busqueda || busqueda.length < caracteresMinimos || !texto) {
    return [{ texto: texto || '', resaltado: false }]
  }

  const palabras = busqueda.trim().split(/\s+/).filter(Boolean)
  const partes = []
  let posicionActual = 0

  // Encontrar todas las coincidencias
  const coincidencias = []

  palabras.forEach((palabra) => {
    const regex = new RegExp(escaparRegex(palabra), 'gi')
    let match

    while ((match = regex.exec(texto)) !== null) {
      coincidencias.push({
        inicio: match.index,
        fin: match.index + match[0].length,
        textoCoincidente: match[0],
      })
    }
  })

  // Ordenar coincidencias por posición
  coincidencias.sort((a, b) => a.inicio - b.inicio)

  // Crear partes del texto
  coincidencias.forEach((coincidencia) => {
    // Agregar texto antes de la coincidencia
    if (coincidencia.inicio > posicionActual) {
      partes.push({
        texto: texto.substring(posicionActual, coincidencia.inicio),
        resaltado: false,
      })
    }

    // Agregar la coincidencia resaltada (evitar duplicados)
    if (coincidencia.inicio >= posicionActual) {
      partes.push({
        texto: coincidencia.textoCoincidente,
        resaltado: true,
      })
      posicionActual = coincidencia.fin
    }
  })

  // Agregar texto restante
  if (posicionActual < texto.length) {
    partes.push({
      texto: texto.substring(posicionActual),
      resaltado: false,
    })
  }

  // Si no hay partes, devolver el texto completo
  return partes.length > 0 ? partes : [{ texto: texto || '', resaltado: false }]
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
    console.log(
      `[CodigoMasNombre] Con ubicaciones antiguas: ${articulosDisponibles.value.filter((a) => a.ubicacionAntigua).length}`,
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
        // Log de tipos de coincidencia
        const tiposEncontrados = resultadosBusqueda.value.map((r) => r.tipoCoincidencia)
        console.log(`[CodigoMasNombre] Tipos de coincidencia: ${tiposEncontrados.join(', ')}`)
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
.ubicacion-antigua-resultado {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 2px;
}
.etiqueta-ubicacion-antigua {
  font-weight: 600;
  margin-right: 4px;
}
.tipo-coincidencia {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 8px;
  margin-top: 4px;
  text-align: center;
  font-weight: 500;
}
.tipo-coincidencia.codigo-exacto {
  background-color: #dcfce7;
  color: #166534;
}
.tipo-coincidencia.codigo-parcial {
  background-color: #dbeafe;
  color: #1e40af;
}
.tipo-coincidencia.nombre-completo {
  background-color: #fef3c7;
  color: #92400e;
}
.tipo-coincidencia.nombre-parcial {
  background-color: #fde68a;
  color: #78350f;
}
.tipo-coincidencia.ubicacion-antigua {
  color: #3730a3;
}
</style>
