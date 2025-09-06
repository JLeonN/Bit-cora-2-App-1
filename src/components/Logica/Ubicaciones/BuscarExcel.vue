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

<style scoped>
.contenedor-buscar-excel {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.boton-cargar-excel {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  background: #1976d2;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.boton-cargar-excel:hover:not(:disabled) {
  background: #1565c0;
}

.boton-cargar-excel:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.boton-cargando {
  background: #ff9800 !important;
}

.boton-exito {
  background: #4caf50 !important;
}

.boton-error {
  background: #f44336 !important;
}

.icono-girando {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.info-estado {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  background: #f5f5f5;
}

.texto-info {
  margin: 0;
  font-size: 13px;
}

.texto-exito {
  color: #2e7d32;
  background: #e8f5e8;
  padding: 8px 12px;
  border-radius: 4px;
}

.texto-neutral {
  color: #555;
}

.texto-cargando {
  color: #f57c00;
  background: #fff3e0;
  padding: 8px 12px;
  border-radius: 4px;
}

.mensaje-error-detallado {
  margin-top: 12px;
  padding: 12px;
  border-radius: 4px;
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.texto-error {
  margin: 0 0 12px 0;
  color: #c62828;
  font-size: 13px;
}

.boton-reintentar,
.boton-debug {
  margin-right: 8px;
  padding: 6px 12px;
  border: 1px solid #f44336;
  border-radius: 4px;
  background: white;
  color: #f44336;
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.boton-reintentar:hover,
.boton-debug:hover {
  background: #f44336;
  color: white;
}

.panel-ayuda {
  margin-top: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.titulo-ayuda {
  padding: 12px 16px;
  background: #f8f9fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #495057;
}

.titulo-ayuda:hover {
  background: #e9ecef;
}

.rotado {
  transform: rotate(180deg);
}

.contenido-ayuda {
  padding: 16px;
  background: white;
}

.paso-ayuda {
  margin-bottom: 16px;
}

.paso-ayuda:last-child {
  margin-bottom: 0;
}

.paso-ayuda h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.paso-ayuda ul,
.paso-ayuda ol {
  margin: 8px 0 0 20px;
  padding: 0;
}

.paso-ayuda li {
  margin-bottom: 4px;
  font-size: 13px;
  color: #666;
}

.paso-ayuda code {
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

.paso-ayuda p {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: #666;
}
</style>
