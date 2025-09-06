<template>
  <div class="contenedor-buscar-excel">
    <!-- Botón principal -->
    <button
      type="button"
      class="boton-cargar-excel"
      :class="{ 'boton-cargando': estaCargando, 'boton-exito': estadoCarga === 'cargado' }"
      :disabled="estaCargando"
      @click="cargarBaseDatos"
    >
      <!-- Icono según estado -->
      <IconDatabaseImport v-if="estadoCarga === 'no-cargado' && !estaCargando" :size="20" />
      <IconLoader2 v-if="estaCargando" :size="20" class="icono-girando" />
      <IconDatabaseCheck v-if="estadoCarga === 'cargado'" :size="20" />
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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IconDatabaseImport,
  IconDatabaseCheck,
  IconDatabaseX,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-vue'
import { cargarArticulosDesdeExcel, obtenerEstadoCarga } from '../../BaseDeDatos/LectorExcel.js'

// --- ESTADO REACTIVO ---
const estaCargando = ref(false)
const estadoCarga = ref('no-cargado') // 'no-cargado', 'cargando', 'cargado', 'error'
const mensajeError = ref('')
const cantidadArticulos = ref(0)

// --- EMITS ---
const emit = defineEmits(['base-datos-cargada', 'error-carga'])

// --- COMPUTED ---
const textoBoton = computed(() => {
  switch (estadoCarga.value) {
    case 'no-cargado':
      return 'Cargar Base de Datos'
    case 'cargando':
      return 'Cargando...'
    case 'cargado':
      return `✓ Base Cargada (${cantidadArticulos.value})`
    case 'error':
      return 'Error al Cargar'
    default:
      return 'Cargar Base de Datos'
  }
})

const mensajeInfo = computed(() => {
  switch (estadoCarga.value) {
    case 'cargado':
      return `Base de datos cargada exitosamente: ${cantidadArticulos.value} artículos`
    case 'no-cargado':
      return 'Coloca el archivo "articulos.xlsx" en la carpeta Descargas' // TODO: Cambiar nombre del archivo
    default:
      return ''
  }
})

const mostrarInfo = computed(() => {
  return estadoCarga.value === 'cargado' || estadoCarga.value === 'no-cargado'
})

const claseTextoInfo = computed(() => {
  return {
    'texto-exito': estadoCarga.value === 'cargado',
    'texto-neutral': estadoCarga.value === 'no-cargado',
  }
})

// --- FUNCIONES ---
async function cargarBaseDatos() {
  try {
    estaCargando.value = true
    estadoCarga.value = 'cargando'
    mensajeError.value = ''

    const resultado = await cargarArticulosDesdeExcel()

    if (resultado.exito) {
      estadoCarga.value = 'cargado'
      cantidadArticulos.value = resultado.cantidad || 0
      emit('base-datos-cargada', {
        cantidad: cantidadArticulos.value,
        mensaje: resultado.mensaje,
      })
    } else {
      estadoCarga.value = 'error'
      mensajeError.value = resultado.mensaje || 'Error desconocido'
      emit('error-carga', resultado.mensaje)
    }
  } catch (error) {
    console.error('Error inesperado:', error)
    estadoCarga.value = 'error'
    mensajeError.value = 'Error inesperado al cargar la base de datos'
    emit('error-carga', 'Error inesperado')
  } finally {
    estaCargando.value = false
  }
}

function actualizarEstado() {
  const estado = obtenerEstadoCarga()
  estadoCarga.value = estado.estado
  cantidadArticulos.value = estado.cantidad
}

// --- LIFECYCLE ---
onMounted(() => {
  // Verificar si ya hay datos cargados
  actualizarEstado()
})
</script>
