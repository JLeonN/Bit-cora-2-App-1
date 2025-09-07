<template>
  <div class="contenedor-buscar-excel">
    <!-- Botón principal -->
    <button
      type="button"
      class="boton-cargar-excel"
      :class="{
        'boton-cargando': estaCargando,
        'boton-exito': estadoCarga === 'cargado',
        'boton-error': estadoCarga === 'error',
      }"
      :disabled="estaCargando"
      @click="cargarBaseDatos"
    >
      <!-- Icono según estado -->
      <IconDatabaseImport v-if="estadoCarga === 'no-cargado' && !estaCargando" :size="20" />
      <IconLoader2 v-if="estaCargando" :size="20" class="icono-girando" />
      <!-- <IconDatabaseCheck v-if="estadoCarga === 'cargado'" :size="20" /> -->
      <IconDatabaseX v-if="estadoCarga === 'error'" :size="20" />

      <!-- Texto del botón -->
      <span>{{ textoBoton }}</span>
    </button>

    <!-- Información de estado -->
    <div class="info-estado" v-if="mostrarInfo">
      <p class="texto-info" :class="claseTextoInfo">
        {{ mensajeInfo }}
      </p>
    </div>

    <!-- Mensaje de error detallado -->
    <div class="mensaje-error-detallado" v-if="estadoCarga === 'error' && mensajeError">
      <p class="texto-error">{{ mensajeError }}</p>
      <button type="button" class="boton-reintentar" @click="cargarBaseDatos">
        <IconRefresh :size="16" />
        Reintentar
      </button>
      <button type="button" class="boton-debug" @click="abrirConsola">
        <IconBug :size="16" />
        Ver Debug
      </button>
    </div>

    <!-- Panel de ayuda expandible -->
    <div class="panel-ayuda" v-if="mostrarAyuda">
      <div class="titulo-ayuda" @click="alternarAyuda">
        <IconHelp :size="20" />
        <span>¿Dónde colocar el archivo?</span>
        <IconChevronDown :size="16" :class="{ rotado: ayudaExpandida }" />
      </div>

      <div class="contenido-ayuda" v-if="ayudaExpandida">
        <div class="paso-ayuda">
          <h4>Ubicaciones recomendadas:</h4>
          <ul>
            <li><code>/storage/emulated/0/Downloads/articulos.xlsx</code></li>
            <li><code>/storage/emulated/0/Documents/articulos.xlsx</code></li>
            <li><code>/storage/emulated/0/Download/articulos.xlsx</code></li>
          </ul>
        </div>

        <div class="paso-ayuda">
          <h4>Pasos recomendados:</h4>
          <ol>
            <li>Descargar el archivo desde WhatsApp/Telegram/Email</li>
            <li>Asegurar que se llama exactamente <code>articulos.xlsx</code></li>
            <li>Verificar que esté en la carpeta Downloads</li>
            <li>Dar permisos de almacenamiento a la app</li>
          </ol>
        </div>

        <div class="paso-ayuda">
          <h4>🔧 Debug:</h4>
          <p>
            Revisa la consola del navegador (F12) para ver exactamente dónde está buscando la app.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IconDatabaseImport,
  // IconDatabaseCheck,
  IconDatabaseX,
  IconLoader2,
  IconRefresh,
  IconHelp,
  IconChevronDown,
  IconBug,
} from '@tabler/icons-vue'
import { cargarArticulosDesdeExcel, obtenerEstadoCarga } from '../../BaseDeDatos/LectorExcel.js'

// --- ESTADO REACTIVO ---
const estaCargando = ref(false)
const estadoCarga = ref('no-cargado')
const mensajeError = ref('')
const cantidadArticulos = ref(0)
const ayudaExpandida = ref(false)

// --- EMITS ---
const emit = defineEmits(['base-datos-cargada', 'error-carga'])

// --- COMPUTED ---
const textoBoton = computed(() => {
  switch (estadoCarga.value) {
    case 'no-cargado':
      return 'Cargar Base de Datos'
    case 'cargando':
      return 'Buscando archivo...'
    case 'cargado':
      return `${cantidadArticulos.value} artículos cargados`
    case 'error':
      return 'Error al cargar'
    default:
      return 'Cargar Base de Datos'
  }
})

const mensajeInfo = computed(() => {
  switch (estadoCarga.value) {
    case 'cargado':
      return `Base de datos lista: ${cantidadArticulos.value} artículos disponibles para búsqueda`
    case 'no-cargado':
      return 'Coloca el archivo "articulos.xlsx" en Downloads o Documentos'
    case 'cargando':
      return 'Buscando en múltiples ubicaciones... Revisa la consola para más detalles'
    default:
      return ''
  }
})

const mostrarInfo = computed(() => {
  return estadoCarga.value !== 'error'
})

const mostrarAyuda = computed(() => {
  return estadoCarga.value === 'no-cargado' || estadoCarga.value === 'error'
})

const claseTextoInfo = computed(() => {
  return {
    'texto-exito': estadoCarga.value === 'cargado',
    'texto-neutral': estadoCarga.value === 'no-cargado',
    'texto-cargando': estadoCarga.value === 'cargando',
  }
})

// --- FUNCIONES ---
async function cargarBaseDatos() {
  try {
    estaCargando.value = true
    estadoCarga.value = 'cargando'
    mensajeError.value = ''

    console.log('[BuscarExcel] Iniciando carga de base de datos...')

    const resultado = await cargarArticulosDesdeExcel()

    if (resultado.exito) {
      estadoCarga.value = 'cargado'
      cantidadArticulos.value = resultado.cantidad || 0
      console.log(`[BuscarExcel] Carga exitosa: ${cantidadArticulos.value} artículos`)

      emit('base-datos-cargada', {
        cantidad: cantidadArticulos.value,
        mensaje: resultado.mensaje,
      })
    } else {
      estadoCarga.value = 'error'
      mensajeError.value = resultado.mensaje || 'Error desconocido'
      console.error(`[BuscarExcel] Error en carga:`, resultado.mensaje)

      emit('error-carga', resultado.mensaje)
    }
  } catch (error) {
    console.error('[BuscarExcel] Error inesperado:', error)
    estadoCarga.value = 'error'
    mensajeError.value = `Error inesperado: ${error.message}`
    emit('error-carga', 'Error inesperado')
  } finally {
    estaCargando.value = false
  }
}

function actualizarEstado() {
  const estado = obtenerEstadoCarga()
  estadoCarga.value = estado.estado
  cantidadArticulos.value = estado.cantidad

  console.log(`[BuscarExcel] Estado actualizado:`, {
    estado: estado.estado,
    cantidad: estado.cantidad,
    cargado: estado.cargado,
  })
}

function alternarAyuda() {
  ayudaExpandida.value = !ayudaExpandida.value
}

function abrirConsola() {
  alert(
    'Abre las herramientas de desarrollo del navegador (F12) y ve a la pestaña "Console" para ver los detalles del debug.',
  )
  console.log('Para ver el debug completo, busca los logs que empiecen con')
}

// --- LIFECYCLE ---
onMounted(() => {
  console.log('[BuscarExcel] Componente montado')
  actualizarEstado()
})
</script>
