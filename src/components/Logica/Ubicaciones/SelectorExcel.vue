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
      <!-- <IconDatabaseCheck v-if="estadoCarga === 'cargado'" :size="20" /> -->
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
    <div class="mensaje-error" v-if="estadoCarga === 'error' && mensajeError">
      <div class="contenido-error">
        <IconAlertTriangle :size="20" />
        <div class="texto-error">
          <h4>Error al cargar archivo</h4>
          <p>{{ mensajeError }}</p>
        </div>
      </div>
      <div class="botones-error">
        <button type="button" class="boton-reintentar" @click="abrirSelectorArchivo">
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
            <li>Primera fila para encabezados (opcional)</li>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  IconFolderOpen,
  IconLoader2,
  // IconDatabaseCheck,
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
} from '../../BaseDeDatos/LectorExcel.js'

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
  if (confirm('¿Estás seguro de que quieres limpiar la base de datos cargada?')) {
    reiniciarBaseDatos()
    actualizarEstado()
    emit('base-datos-limpia')
    console.log('[SelectorExcel] Base de datos limpiada')
  }
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
onMounted(() => {
  console.log('[SelectorExcel] Componente montado')
  actualizarEstado()
})
</script>

<style scoped>
.contenedor-selector-excel {
  margin: 16px 0;
}

/* Botón principal */
.boton-selector-principal {
  width: 100%;
  padding: 16px 20px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  background: #fafafa;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  min-height: 60px;
}

.boton-selector-principal:hover:not(:disabled) {
  border-color: #1976d2;
  background: #f0f7ff;
  color: #1976d2;
}

.boton-selector-principal:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.boton-cargando {
  border-color: #ff9800 !important;
  background: #fff3e0 !important;
  color: #e65100 !important;
}

.boton-exito {
  border-color: #4caf50 !important;
  background: #e8f5e8 !important;
  color: #2e7d32 !important;
  border-style: solid !important;
}

.boton-error {
  border-color: #f44336 !important;
  background: #ffebee !important;
  color: #c62828 !important;
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

/* Info archivo cargado */
.info-archivo-cargado {
  margin-top: 16px;
}

.tarjeta-archivo {
  padding: 16px;
  border: 1px solid #e8f5e8;
  border-radius: 8px;
  background: #f9fdf9;
  display: flex;
  align-items: center;
  gap: 12px;
}

.icono-archivo {
  color: #4caf50;
  flex-shrink: 0;
}

.detalles-archivo {
  flex-grow: 1;
}

.nombre-archivo {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
}

.estadisticas-archivo {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #666;
}

.estado-archivo {
  margin: 0;
  font-size: 12px;
  color: #4caf50;
  font-weight: 500;
}

.acciones-archivo {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.boton-cambiar-archivo,
.boton-limpiar-archivo {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.boton-cambiar-archivo:hover {
  background: #f0f7ff;
  border-color: #1976d2;
  color: #1976d2;
}

.boton-limpiar-archivo:hover {
  background: #ffebee;
  border-color: #f44336;
  color: #f44336;
}

/* Estado de carga */
.estado-carga {
  margin-top: 16px;
  text-align: center;
}

.barra-progreso {
  width: 100%;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progreso-animado {
  height: 100%;
  background: linear-gradient(45deg, #ff9800, #ffb74d);
  animation: progreso 2s infinite;
}

@keyframes progreso {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

.texto-carga {
  margin: 0;
  font-size: 14px;
  color: #ff9800;
}

/* Mensaje de error */
.mensaje-error {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  background: #ffebee;
}

.contenido-error {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.contenido-error svg {
  color: #f44336;
  flex-shrink: 0;
  margin-top: 2px;
}

.texto-error h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #c62828;
}

.texto-error p {
  margin: 0;
  font-size: 13px;
  color: #d32f2f;
}

.botones-error {
  display: flex;
  gap: 8px;
}

.boton-reintentar {
  padding: 8px 12px;
  border: 1px solid #f44336;
  border-radius: 4px;
  background: white;
  color: #f44336;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}

.boton-reintentar:hover {
  background: #f44336;
  color: white;
}

/* Ayuda inicial */
.ayuda-inicial {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e3f2fd;
  border-radius: 8px;
  background: #f3f9ff;
}

.contenido-ayuda {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.contenido-ayuda svg {
  color: #1976d2;
  flex-shrink: 0;
  margin-top: 2px;
}

.texto-ayuda h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #1565c0;
}

.texto-ayuda p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #1976d2;
}

.lista-formatos {
  margin: 0;
  padding-left: 16px;
  list-style: none;
}

.lista-formatos li {
  font-size: 12px;
  color: #1976d2;
  margin-bottom: 4px;
}

/* Preview de datos */
.preview-datos {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.preview-datos details summary {
  cursor: pointer;
  font-weight: 500;
  color: #333;
}

.tabla-preview {
  margin-top: 12px;
}

.tabla-preview table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.tabla-preview th,
.tabla-preview td {
  padding: 8px;
  border: 1px solid #ddd;
  text-align: left;
}

.tabla-preview th {
  background: #f5f5f5;
  font-weight: 600;
}

.nota-preview {
  margin: 8px 0 0 0;
  font-size: 11px;
  color: #666;
  font-style: italic;
}

/* Responsive */
@media (max-width: 600px) {
  .boton-selector-principal {
    padding: 14px 16px;
    font-size: 14px;
  }

  .tarjeta-archivo {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .acciones-archivo {
    align-self: flex-end;
  }
}
</style>
