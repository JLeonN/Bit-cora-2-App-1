<template>
  <div class="contenedor-selector-excel">
    <!-- Botón principal de selección -->
    <button
      type="button"
      class="boton-selector-principal"
      :class="{
        'boton-cargando': estaCargando,
        'boton-exito': estadoCarga === 'cargado',
        'boton-error': estadoCarga === 'error',
      }"
      :disabled="estaCargando"
      @click="abrirSelectorArchivo"
    >
      <!-- Icono según estado -->
      <IconFolderOpen v-if="estadoCarga === 'no-cargado' && !estaCargando" :size="20" />
      <IconLoader2 v-if="estaCargando" :size="20" class="icono-girando" />
      <IconDatabaseX v-if="estadoCarga === 'error'" :size="20" />
      <!-- Texto del botón -->
      <span>{{ textoBoton }}</span>
    </button>

    <!-- Información del archivo cargado -->
    <div class="info-archivo-cargado" v-if="estadoCarga === 'cargado' && informacionArchivo">
      <div class="tarjeta-archivo">
        <div class="icono-archivo">
          <IconFileSpreadsheet :size="24" />
        </div>
        <div class="detalles-archivo">
          <h4 class="nombre-archivo">{{ informacionArchivo.nombre }}</h4>
          <p class="estadisticas-archivo">
            {{ cantidadArticulos }} artículos • {{ tamanoArchivo }} KB
          </p>
          <p class="estado-archivo">Base de datos lista para búsqueda</p>
        </div>
        <div class="acciones-archivo">
          <button
            type="button"
            class="boton-cambiar-archivo"
            @click="abrirSelectorArchivo"
            title="Cambiar archivo"
          >
            <IconRefresh :size="16" />
          </button>
          <button
            type="button"
            class="boton-limpiar-archivo"
            @click="limpiarBaseDatos"
            title="Limpiar base de datos"
          >
            <IconTrash :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Estado de carga -->
    <div class="estado-carga" v-if="estaCargando">
      <div class="barra-progreso">
        <div class="progreso-animado"></div>
      </div>
      <p class="texto-carga">{{ mensajeCarga }}</p>
    </div>

    <!-- Mensaje de error -->
    <div class="mensaje-error-selector" v-if="estadoCarga === 'error' && mensajeError">
      <div class="contenido-error">
        <IconAlertTriangle :size="20" />
        <div class="texto-error-selector">
          <h4>Error al cargar archivo</h4>
          <p>{{ mensajeError }}</p>
        </div>
      </div>
      <div class="botones-error">
        <button type="button" class="boton-reintentar-selector" @click="abrirSelectorArchivo">
          <IconRefresh :size="16" />
          Seleccionar otro archivo
        </button>
      </div>
    </div>

    <!-- Ayuda inicial -->
    <div class="ayuda-inicial" v-if="estadoCarga === 'no-cargado' && !estaCargando">
      <div class="contenido-ayuda">
        <IconInfoCircle :size="20" />
        <div class="texto-ayuda">
          <h4>Selecciona tu archivo Excel</h4>
          <p>Busca y selecciona el archivo que contenga los artículos (códigos y nombres)</p>
          <ul class="lista-formatos">
            <li>Formatos soportados: .xlsx, .xls</li>
            <li>Debe tener 2 columnas: código y nombre</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Preview de datos (solo en desarrollo) -->
    <div class="preview-datos" v-if="mostrarPreview && estadoCarga === 'cargado'">
      <details>
        <summary>Preview de datos cargados</summary>
        <div class="tabla-preview">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(articulo, index) in previewArticulos" :key="index">
                <td>{{ articulo.codigo }}</td>
                <td>{{ articulo.nombre }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="cantidadArticulos > 5" class="nota-preview">
            Mostrando 5 de {{ cantidadArticulos }} artículos
          </p>
        </div>
      </details>
    </div>

    <!-- Modal confirmar limpieza -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      texto="la base de datos cargada"
      @confirmar="confirmarLimpieza"
      @cerrar="cerrarModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IconFolderOpen,
  IconLoader2,
  IconDatabaseX,
  IconFileSpreadsheet,
  IconRefresh,
  IconTrash,
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-vue'
import {
  cargarArticulosDesdeExcel,
  obtenerEstadoCarga,
  obtenerInformacionArchivo,
  obtenerArticulosCargados,
  reiniciarBaseDatos,
  inicializarBaseDatos,
} from '../../BaseDeDatos/LectorExcel.js'
import ModalEliminar from '../../Modales/ModalEliminar.vue'

// --- PROPS ---
defineProps({
  mostrarPreview: {
    type: Boolean,
    default: false, // Solo para desarrollo
  },
})

// --- ESTADO REACTIVO ---
const estaCargando = ref(false)
const estadoCarga = ref('no-cargado')
const mensajeError = ref('')
const cantidadArticulos = ref(0)
const informacionArchivo = ref(null)
const mensajeCarga = ref('')
const mostrarModalEliminar = ref(false)

// --- EMITS ---
const emit = defineEmits(['base-datos-cargada', 'error-carga', 'base-datos-limpia'])

// --- COMPUTED ---
const textoBoton = computed(() => {
  switch (estadoCarga.value) {
    case 'no-cargado':
      return 'Seleccionar archivo Excel'
    case 'cargando':
      return 'Procesando archivo...'
    case 'cargado':
      return `✓ ${cantidadArticulos.value} artículos cargados`
    case 'error':
      return 'Seleccionar archivo Excel'
    default:
      return 'Seleccionar archivo Excel'
  }
})

const tamanoArchivo = computed(() => {
  if (!informacionArchivo.value?.tamano) return '0'
  return (informacionArchivo.value.tamano / 1024).toFixed(1)
})

const previewArticulos = computed(() => {
  const articulos = obtenerArticulosCargados()
  return articulos.slice(0, 5) // Solo primeros 5
})

// --- FUNCIONES ---
async function abrirSelectorArchivo() {
  try {
    estaCargando.value = true
    estadoCarga.value = 'cargando'
    mensajeError.value = ''

    // Actualizar mensajes de carga progresivamente
    mensajeCarga.value = 'Abriendo selector de archivos...'
    await new Promise((resolve) => setTimeout(resolve, 100))

    console.log('[SelectorExcel] Iniciando selección de archivo...')

    const resultado = await cargarArticulosDesdeExcel()

    if (resultado.exito) {
      mensajeCarga.value = 'Procesando datos...'
      await new Promise((resolve) => setTimeout(resolve, 200))

      estadoCarga.value = 'cargado'
      cantidadArticulos.value = resultado.cantidad || 0
      informacionArchivo.value = resultado.archivo || null

      console.log(`[SelectorExcel] Carga exitosa:`, {
        cantidad: cantidadArticulos.value,
        archivo: informacionArchivo.value?.nombre,
      })

      emit('base-datos-cargada', {
        cantidad: cantidadArticulos.value,
        mensaje: resultado.mensaje,
        archivo: informacionArchivo.value,
      })
    } else {
      estadoCarga.value = 'error'
      mensajeError.value = resultado.mensaje || 'Error desconocido'

      console.error(`[SelectorExcel] Error en carga:`, resultado.mensaje)

      emit('error-carga', resultado.mensaje)
    }
  } catch (error) {
    console.error('[SelectorExcel] Error inesperado:', error)
    estadoCarga.value = 'error'
    mensajeError.value = `Error inesperado: ${error.message}`
    emit('error-carga', 'Error inesperado')
  } finally {
    estaCargando.value = false
    mensajeCarga.value = ''
  }
}

function limpiarBaseDatos() {
  mostrarModalEliminar.value = true
}

async function confirmarLimpieza() {
  await reiniciarBaseDatos() // ** AHORA ES ASYNC **
  actualizarEstado()
  emit('base-datos-limpia')
  console.log('[SelectorExcel] Base de datos limpiada')
  mostrarModalEliminar.value = false
}

function cerrarModal() {
  mostrarModalEliminar.value = false
}

function actualizarEstado() {
  const estado = obtenerEstadoCarga()
  estadoCarga.value = estado.estado
  cantidadArticulos.value = estado.cantidad
  informacionArchivo.value = estado.archivo || obtenerInformacionArchivo()

  console.log(`[SelectorExcel] Estado actualizado:`, {
    estado: estado.estado,
    cantidad: estado.cantidad,
    archivo: informacionArchivo.value?.nombre,
  })
}

// --- LIFECYCLE ---
onMounted(async () => {
  console.log('[SelectorExcel] Componente montado')

  // ** INICIALIZAR BASE DE DATOS AL MONTAR **
  await inicializarBaseDatos()

  // Actualizar estado después de la inicialización
  actualizarEstado()

  // Si se cargó automáticamente, emitir evento
  if (estadoCarga.value === 'cargado') {
    emit('base-datos-cargada', {
      cantidad: cantidadArticulos.value,
      mensaje: `Base de datos cargada automáticamente: ${cantidadArticulos.value} artículos`,
      archivo: informacionArchivo.value,
    })
  }
})
</script>
