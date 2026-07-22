<template>
  <div class="contenedor-tabla">
    <h2 class="titulo-tabla">Ubicaciones</h2>

    <TarjetaSeccion
      titulo="Base de datos para búsqueda"
      :expandida-por-defecto="baseDatosExpandida"
      descripcion-resumen="Cargá o recargá el Excel con artículos para habilitar búsqueda, validaciones y alertas."
      :ocultar-resumen-al-expandir="true"
    >
      <p class="texto-secundario texto-explicacion-base">
        Cargá el archivo Excel de artículos para actualizar la base de búsqueda y validar códigos en tiempo real.
      </p>
      <SelectorExcel
        @base-datos-cargada="manejarBaseDatosCargada"
        @base-datos-limpia="manejarBaseDatosLimpia"
        @error-carga="manejarErrorCarga"
      />
    </TarjetaSeccion>

    <InformacionUbicaciones :ubicaciones="ubicacionesArray" />

    <!-- Formulario de ubicación -->
    <FormularioUbicacion
      ref="formularioUbicacionRef"
      @ubicacion-agregada="agregarUbicacion"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- Tabla -->
    <TablaUbicaciones
      :ubicaciones="ubicacionesArray"
      @abrirModalEditar="abrirModalEditar"
      @abrirModalEliminar="abrirModalEliminar"
      @abrirModalEliminarTodas="abrirModalEliminarTodas"
      @enviar-a-etiquetas="enviarAEtiquetas"
      @enviar-todas-a-etiquetas="enviarTodasAEtiquetas"
    />

    <!-- Modal: Editar Ubicación -->
    <ModalEditarUbicacion
      v-if="mostrarModalEditar"
      :codigo="ubicacionEditar?.codigo"
      :ubicacion="ubicacionEditar?.ubicacion"
      @guardar="guardarEdicion"
      @cerrar="cerrarModalEditar"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- Modal: Eliminar Ubicación -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="ubicacionEliminar?.codigo"
      @confirmar="confirmarEliminacion"
      @cerrar="cerrarModalEliminar"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- Modal: Eliminar Todas Ubicaciones -->
    <ModalEliminar
      v-if="mostrarModalEliminarTodas"
      texto="todas las ubicaciones"
      @confirmar="confirmarEliminacionTodas"
      @cerrar="cerrarModalEliminarTodas"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- Mensajes de notificación -->
    <div v-if="mensajeExito" class="mensaje-exito">{{ mensajeExito }}</div>
    <div v-if="mensajeError" class="mensaje-error">{{ mensajeError }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Notify } from 'quasar'
import { Capacitor } from '@capacitor/core'
import { IconClock, IconDownload, IconLink, IconLoader2, IconSend } from '@tabler/icons-vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import ModalEditarUbicacion from '../components/Modales/ModalEditarUbicacion.vue'
import FormularioUbicacion from '../components/Logica/Ubicaciones/FormularioUbicacion.vue'
import InformacionUbicaciones from '../components/Logica/Ubicaciones/InformacionUbicaciones.vue'
import TablaUbicaciones from '../components/Logica/Ubicaciones/TablaUbicaciones.vue'
import SelectorExcel from '../components/Logica/Ubicaciones/SelectorExcel.vue'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import { generarYGuardarExcelUbicaciones } from '../components/Logica/Ubicaciones/ExportarUbicacionesExcel'
import {
  descargarArchivoExcelEnNavegador,
  invalidarExcelCompartible,
  obtenerArchivoExcelListo,
  obtenerDatosExcelListo,
  obtenerExcelCompartible,
} from '../components/Logica/Ubicaciones/CacheExcelUbicacionesWeb.js'
import {
  abrirWhatsAppConMensaje,
  prepararVentanaWhatsApp,
  compartirArchivo,
} from '../components/Logica/Pedidos/CompartirExcel.js'
import {
  guardarUbicaciones,
  obtenerUbicaciones,
} from '../components/BaseDeDatos/usoAlmacenamientoUbicaciones'
import { agregarEtiquetasDesdeArticulos } from '../components/Logica/Etiquetas/ServicioEnvioEtiquetas.js'
import {
  obtenerArticuloPorCodigo,
  inicializarBaseDatos,
  obtenerEstadoCarga,
  reconstruirUbicacionesDesdeLista,
  validarCodigosDuplicadosEnUbicaciones,
} from '../components/BaseDeDatos/LectorExcel.js'
import {
  MAXIMO_UBICACIONES_COMPARTIDAS,
  publicarUbicacionesCompartidas,
} from '../components/Logica/Ubicaciones/ServicioCompartirUbicacionesFirestore.js'
import { obtenerNombreUsuario } from '../components/BaseDeDatos/usoAlmacenamientoConfiguracion.js'

// Emit para configurar la barra inferior
const emit = defineEmits(['configurar-barra'])

// --- ESTADO PRINCIPAL ---
const ubicaciones = ref([])
const formularioUbicacionRef = ref(null)
const baseDatosExpandida = ref(false)
const estadoPreparacionExcel = ref('pendiente')
const compartiendoEnlace = ref(false)
let temporizadorPreparacionExcel = null
let versionPreparacionExcel = 0
let componenteUbicacionesActivo = true

// Estado para controlar si algún modal está activo
const modalActivo = ref(false)

// Computed para garantizar que siempre sea array
const ubicacionesArray = computed(() => {
  if (!Array.isArray(ubicaciones.value)) {
    console.warn(
      '[AjustarUbicaciones] ubicaciones no es array:',
      typeof ubicaciones.value,
      ubicaciones.value,
    )
    return []
  }
  return ubicaciones.value
})

// Modal eliminar
const mostrarModalEliminar = ref(false)
const ubicacionEliminar = ref(null)

// Modal eliminar todas
const mostrarModalEliminarTodas = ref(false)

// Modal editar
const mostrarModalEditar = ref(false)
const ubicacionEditar = ref(null)
let indiceEditar = null

// Estados de notificaciones
const mensajeExito = ref('')
const mensajeError = ref('')
const esNavegadorWeb = computed(() => Capacitor.getPlatform() === 'web')
const hayCodigosDuplicados = computed(
  () => !validarCodigosDuplicadosEnUbicaciones(ubicacionesArray.value).exito,
)
const puedeExportarUbicaciones = computed(
  () => ubicacionesArray.value.length > 0 && !hayCodigosDuplicados.value,
)
const puedeCompartirEnlace = computed(
  () =>
    puedeExportarUbicaciones.value &&
    ubicacionesArray.value.length <= MAXIMO_UBICACIONES_COMPARTIDAS,
)
const excelCompartibleListo = computed(
  () => !esNavegadorWeb.value || estadoPreparacionExcel.value === 'listo',
)

// Configuración dinámica de la barra inferior
const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: ubicacionesArray.value.length > 0,
  puedeEnviar: puedeExportarUbicaciones.value && excelCompartibleListo.value,
  iconoEnviar:
    esNavegadorWeb.value && !excelCompartibleListo.value ? IconClock : IconSend,
  tituloEnviar:
    esNavegadorWeb.value && !excelCompartibleListo.value
      ? 'Preparando Excel...'
      : 'Enviar Excel',
  botonesPersonalizados: esNavegadorWeb.value
    ? [
        {
          accion: 'descargar-excel-ubicaciones',
          icono: IconDownload,
          titulo: 'Descargar Excel',
          desactivado: !puedeExportarUbicaciones.value || !excelCompartibleListo.value,
          claseCSS: '',
        },
        {
          accion: 'compartir-enlace-ubicaciones',
          icono: compartiendoEnlace.value ? IconLoader2 : IconLink,
          titulo: compartiendoEnlace.value ? 'Creando enlace...' : 'Compartir por enlace',
          desactivado: !puedeCompartirEnlace.value || compartiendoEnlace.value,
          claseCSS: compartiendoEnlace.value ? 'boton-compartiendo-enlace' : '',
        },
      ]
    : [],
  modalActivo: modalActivo.value,
}))

// Métodos que la barra inferior va a llamar
const metodosParaBarra = {
  onAgregar: () => {},
  onEnviar: () => {
    enviarUbicacionesExcel()
  },
  onAccionPersonalizada: (accion) => {
    if (accion === 'descargar-excel-ubicaciones') {
      descargarUbicacionesExcelWeb()
    }
    if (accion === 'compartir-enlace-ubicaciones') {
      compartirUbicacionesPorEnlace()
    }
  },
  onAtrasNativo: () => cerrarPasoAtrasNativo(),
}

// Función para actualizar la configuración de la barra
const actualizarConfiguracionBarra = () => {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

// Watchers para actualizar la barra cuando cambien los datos
watch(
  () => ubicacionesArray.value.length,
  () => {
    actualizarConfiguracionBarra()
  },
  { deep: true },
)

// Watcher para actualizar cuando cambia el estado del modal
watch(
  () => modalActivo.value,
  () => {
    actualizarConfiguracionBarra()
  },
)

watch(estadoPreparacionExcel, () => {
  actualizarConfiguracionBarra()
})

watch(compartiendoEnlace, () => {
  actualizarConfiguracionBarra()
})

// Métodos para manejar el estado del modal
const manejarModalAbierto = () => {
  modalActivo.value = true
}

const manejarModalCerrado = () => {
  modalActivo.value = false
}

// --- MANEJO DE EVENTOS DEL SELECTOR DE EXCEL ---
function manejarBaseDatosCargada(evento) {
  console.log('Base de datos cargada:', evento)
  baseDatosExpandida.value = false
  mensajeExito.value = 'Base de datos cargada correctamente'
  setTimeout(() => (mensajeExito.value = ''), 3000)
  programarPreparacionExcelCompartible({ debeInvalidar: false })
}

function manejarBaseDatosLimpia() {
  baseDatosExpandida.value = true
  programarPreparacionExcelCompartible()
}

function manejarErrorCarga(mensaje) {
  console.error('Error cargando base de datos:', mensaje)
  baseDatosExpandida.value = !obtenerEstadoCarga().cargado
  mensajeError.value = `Error al cargar archivo: ${mensaje}`
  setTimeout(() => (mensajeError.value = ''), 3000)
}

function programarPreparacionExcelCompartible({ debeInvalidar = true, esperar = true } = {}) {
  if (!esNavegadorWeb.value) return

  if (debeInvalidar) {
    invalidarExcelCompartible()
  }

  if (temporizadorPreparacionExcel) {
    clearTimeout(temporizadorPreparacionExcel)
    temporizadorPreparacionExcel = null
  }

  if (!puedeExportarUbicaciones.value) {
    estadoPreparacionExcel.value = 'pendiente'
    return
  }

  estadoPreparacionExcel.value = 'preparando'
  const versionActual = ++versionPreparacionExcel
  const prepararExcel = async () => {
    try {
      const archivoExcel = await obtenerExcelCompartible(ubicacionesArray.value)
      if (!componenteUbicacionesActivo || versionActual !== versionPreparacionExcel) return

      estadoPreparacionExcel.value = archivoExcel ? 'listo' : 'preparando'
    } catch (error) {
      if (!componenteUbicacionesActivo || versionActual !== versionPreparacionExcel) return

      console.error('Error al preparar Excel de ubicaciones:', error)
      estadoPreparacionExcel.value = 'error'
      mensajeError.value = 'No se pudo preparar el Excel para compartir'
      setTimeout(() => (mensajeError.value = ''), 3500)
    }
  }

  if (esperar) {
    temporizadorPreparacionExcel = setTimeout(() => {
      temporizadorPreparacionExcel = null
      prepararExcel()
    }, 400)
    return
  }

  prepararExcel()
}

async function sincronizarBaseConListaActual() {
  const validacionDuplicados = validarCodigosDuplicadosEnUbicaciones(ubicaciones.value)
  if (!validacionDuplicados.exito) {
    return {
      exito: false,
      mensaje: `Hay codigos duplicados: ${validacionDuplicados.codigosDuplicados.join(
        ', ',
      )}. Se guardo la tabla para que puedas revisarlos.`,
    }
  }

  const resultadoSincronizacion = await reconstruirUbicacionesDesdeLista(ubicaciones.value)

  if (!resultadoSincronizacion.exito) {
    return {
      exito: false,
      mensaje: resultadoSincronizacion.mensaje || 'No se pudo reconstruir la base',
    }
  }

  return { exito: true }
}

// --- FUNCIÓN AGREGAR UBICACIÓN
async function agregarUbicacion(datosNuevos) {
  try {
    if (!Array.isArray(ubicaciones.value)) {
      console.warn('[agregarUbicacion] Reinicializando ubicaciones como array')
      ubicaciones.value = []
    }

    if (!datosNuevos || !datosNuevos.codigo || !datosNuevos.ubicacion) {
      console.error('[agregarUbicacion] Datos inválidos:', datosNuevos)
      mensajeError.value = 'Datos de ubicación inválidos'
      setTimeout(() => (mensajeError.value = ''), 3000)
      return
    }

    const nuevaUbicacion = {
      codigo: String(datosNuevos.codigo).trim().toUpperCase(),
      ubicacion: String(datosNuevos.ubicacion).trim().toUpperCase(),
    }

    ubicaciones.value.unshift(nuevaUbicacion)
    await guardarUbicaciones(ubicaciones.value)
    const resultadoSincronizacion = await sincronizarBaseConListaActual()
    if (!resultadoSincronizacion.exito) {
      mensajeError.value = resultadoSincronizacion.mensaje
      setTimeout(() => (mensajeError.value = ''), 3500)
    }
    actualizarConfiguracionBarra()
    programarPreparacionExcelCompartible()

    console.log('[agregarUbicacion] Ubicación agregada:', nuevaUbicacion)
  } catch (error) {
    console.error('[agregarUbicacion] Error:', error)
    mensajeError.value = 'Error al agregar ubicación: ' + error.message
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Mensaje específico para envío individual
async function enviarAEtiquetas(ubicacion) {
  try {
    const articulo = obtenerArticuloPorCodigo(ubicacion.codigo)
    const nombreArticulo = articulo ? articulo.nombre : 'Artículo desconocido'
    await agregarEtiquetasDesdeArticulos([
      {
        codigo: ubicacion.codigo,
        nombre: nombreArticulo,
        ubicacion: ubicacion.ubicacion,
      },
    ])

    Notify.create({
      type: 'positive',
      message: '✅ Etiqueta enviada correctamente',
      position: 'top',
      timeout: 2000,
    })
  } catch (error) {
    console.error('[AjustarUbicaciones] Error enviando a etiquetas:', error)
    Notify.create({
      type: 'negative',
      message: '❌ Error al enviar etiqueta',
      position: 'top',
      timeout: 2000,
    })
  }
}

// Mensaje específico para envío masivo
async function enviarTodasAEtiquetas(etiquetas) {
  try {
    const articulos = etiquetas.map((etiqueta) => ({
      codigo: etiqueta.codigo,
      nombre: etiqueta.descripcion,
      ubicacion: etiqueta.ubicacion,
    }))
    await agregarEtiquetasDesdeArticulos(articulos)

    Notify.create({
      type: 'positive',
      message: `✅ ${etiquetas.length} etiquetas enviadas correctamente`,
      position: 'top',
      timeout: 2500,
    })
  } catch (error) {
    console.error('[AjustarUbicaciones] Error enviando todas a etiquetas:', error)
    Notify.create({
      type: 'negative',
      message: '❌ Error al enviar etiquetas',
      position: 'top',
      timeout: 2000,
    })
  }
}

// Abrir modal editar
function abrirModalEditar(indice) {
  try {
    if (
      !Array.isArray(ubicacionesArray.value) ||
      indice < 0 ||
      indice >= ubicacionesArray.value.length
    ) {
      console.error('[abrirModalEditar] Índice inválido:', indice)
      mensajeError.value = 'Error: ubicación no encontrada'
      setTimeout(() => (mensajeError.value = ''), 3000)
      return
    }

    ubicacionEditar.value = { ...ubicacionesArray.value[indice] }
    indiceEditar = indice
    mostrarModalEditar.value = true
  } catch (error) {
    console.error('[abrirModalEditar] Error:', error)
    mensajeError.value = 'Error al abrir editor'
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Guardar edición
async function guardarEdicion(datos) {
  try {
    if (indiceEditar === null || !Array.isArray(ubicaciones.value)) {
      console.error('[guardarEdicion] Estado inválido')
      return
    }

    if (indiceEditar < 0 || indiceEditar >= ubicaciones.value.length) {
      console.error('[guardarEdicion] Índice fuera de rango:', indiceEditar)
      return
    }

    const ubicacionEditada = {
      codigo: String(datos.codigo || '')
        .trim()
        .toUpperCase(),
      ubicacion: String(datos.ubicacion || '')
        .trim()
        .toUpperCase(),
    }
    ubicaciones.value[indiceEditar] = ubicacionEditada
    await guardarUbicaciones(ubicaciones.value)
    const resultadoSincronizacion = await sincronizarBaseConListaActual()
    if (!resultadoSincronizacion.exito) {
      mensajeError.value = resultadoSincronizacion.mensaje
      setTimeout(() => (mensajeError.value = ''), 3500)
    }
    actualizarConfiguracionBarra()
    programarPreparacionExcelCompartible()

    mostrarModalEditar.value = false
    indiceEditar = null

    console.log('[guardarEdicion] Ubicación editada exitosamente')
  } catch (error) {
    console.error('[guardarEdicion] Error:', error)
    mensajeError.value = 'Error al guardar cambios: ' + error.message
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Cerrar modal editar
function cerrarModalEditar() {
  mostrarModalEditar.value = false
  indiceEditar = null
}

// Abrir modal eliminar
function abrirModalEliminar(indice) {
  try {
    if (
      !Array.isArray(ubicacionesArray.value) ||
      indice < 0 ||
      indice >= ubicacionesArray.value.length
    ) {
      console.error('[abrirModalEliminar] Índice inválido:', indice)
      return
    }

    ubicacionEliminar.value = ubicacionesArray.value[indice]
    mostrarModalEliminar.value = true
  } catch (error) {
    console.error('[abrirModalEliminar] Error:', error)
  }
}

// Confirmar eliminación
async function confirmarEliminacion() {
  try {
    if (!Array.isArray(ubicaciones.value) || !ubicacionEliminar.value) {
      console.error('[confirmarEliminacion] Estado inválido')
      return
    }

    const indice = ubicaciones.value.indexOf(ubicacionEliminar.value)
    if (indice !== -1) {
      ubicaciones.value.splice(indice, 1)
      await guardarUbicaciones(ubicaciones.value)
      const resultadoSincronizacion = await sincronizarBaseConListaActual()
      if (!resultadoSincronizacion.exito) {
        mensajeError.value = resultadoSincronizacion.mensaje
        setTimeout(() => (mensajeError.value = ''), 3500)
      }
      actualizarConfiguracionBarra()
      programarPreparacionExcelCompartible()
    }

    mostrarModalEliminar.value = false
  } catch (error) {
    console.error('[confirmarEliminacion] Error:', error)
    mensajeError.value = 'Error al eliminar ubicación'
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Cerrar modal eliminar
function cerrarModalEliminar() {
  mostrarModalEliminar.value = false
}

// Abrir modal eliminar todas
function abrirModalEliminarTodas() {
  mostrarModalEliminarTodas.value = true
}

// Confirmar eliminación de todas
async function confirmarEliminacionTodas() {
  try {
    ubicaciones.value = []
    await guardarUbicaciones(ubicaciones.value)
    const resultadoSincronizacion = await sincronizarBaseConListaActual()
    if (!resultadoSincronizacion.exito) {
      mensajeError.value = resultadoSincronizacion.mensaje
      setTimeout(() => (mensajeError.value = ''), 3500)
    }
    mostrarModalEliminarTodas.value = false
    actualizarConfiguracionBarra()
    programarPreparacionExcelCompartible()

    mensajeExito.value = 'Todas las ubicaciones eliminadas'
    setTimeout(() => (mensajeExito.value = ''), 3000)
  } catch (error) {
    console.error('[confirmarEliminacionTodas] Error:', error)
    mensajeError.value = 'Error al eliminar ubicaciones'
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

// Cerrar modal eliminar todas
function cerrarModalEliminarTodas() {
  mostrarModalEliminarTodas.value = false
}

function cerrarPasoAtrasNativo() {
  if (formularioUbicacionRef.value?.cerrarPasoAtrasNativo?.()) {
    modalActivo.value = false
    return true
  }
  if (mostrarModalEditar.value) {
    cerrarModalEditar()
    modalActivo.value = false
    return true
  }
  if (mostrarModalEliminar.value) {
    cerrarModalEliminar()
    modalActivo.value = false
    return true
  }
  if (mostrarModalEliminarTodas.value) {
    cerrarModalEliminarTodas()
    modalActivo.value = false
    return true
  }
  return false
}

// --- FUNCIÓN ENVIAR UBICACIONES COMO EXCEL
async function enviarUbicacionesExcel() {
  try {
    if (!Array.isArray(ubicacionesArray.value) || ubicacionesArray.value.length === 0) {
      mensajeError.value = 'No hay ubicaciones para exportar'
      setTimeout(() => (mensajeError.value = ''), 3000)
      return
    }

    const validacionDuplicados = validarCodigosDuplicadosEnUbicaciones(ubicacionesArray.value)
    if (!validacionDuplicados.exito) {
      throw new Error(
        `Hay codigos duplicados en Ubicaciones: ${validacionDuplicados.codigosDuplicados.join(', ')}`,
      )
    }

    if (esNavegadorWeb.value) {
      const { archivoExcel: archivo, nombreUsuario } = obtenerDatosExcelListo()
      if (!archivo) {
        mensajeError.value = 'El Excel todavía se está preparando'
        setTimeout(() => (mensajeError.value = ''), 3000)
        return
      }
      abrirWhatsAppConMensaje(
        construirMensajeWhatsAppUbicaciones(
          nombreUsuario,
          ubicacionesArray.value.length,
          archivo.name,
        ),
      )
      descargarArchivoExcelEnNavegador(archivo)
      mensajeExito.value = 'Excel descargado y WhatsApp abierto'
      setTimeout(() => (mensajeExito.value = ''), 3000)
      return
    }

    const resultado = await generarYGuardarExcelUbicaciones(ubicacionesArray.value)

    if (!resultado) {
      throw new Error('No se pudo generar el archivo Excel')
    }

    if (!resultado.uri) {
      throw new Error('No se pudo obtener la ruta del archivo')
    }

    await compartirArchivo(resultado.uri, resultado.nombreArchivo)
    mensajeExito.value = 'Archivo de ubicaciones enviado correctamente'
    setTimeout(() => (mensajeExito.value = ''), 3000)
  } catch (error) {
    console.error('Error al enviar ubicaciones:', error)
    mensajeError.value = 'Error al enviar el archivo: ' + error.message
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
}

function construirMensajeWhatsAppUbicaciones(nombreUsuario, cantidadUbicaciones, nombreArchivo) {
  const usuario = nombreUsuario || 'Sin usuario'
  const cantidad = cantidadUbicaciones === 1 ? '1 ubicación' : `${cantidadUbicaciones} ubicaciones`
  const nombreArchivoSeguro = String(nombreArchivo || '').replaceAll('`', "'")

  return [
    '*Excel de ubicaciones listo*',
    '',
    `*Usuario:* ${usuario}`,
    `*Ubicaciones incluidas:* ${cantidad}`,
    '',
    'El archivo se descargó automáticamente con este nombre:',
    `\`\`\`${nombreArchivoSeguro}\`\`\``,
    '',
    'Adjuntalo desde *Descargas* para enviarlo.',
  ].join('\n')
}

async function descargarUbicacionesExcelWeb() {
  try {
    if (!esNavegadorWeb.value) return
    if (!Array.isArray(ubicacionesArray.value) || ubicacionesArray.value.length === 0) {
      mensajeError.value = 'No hay ubicaciones para descargar'
      setTimeout(() => (mensajeError.value = ''), 3000)
      return
    }
    const validacionDuplicados = validarCodigosDuplicadosEnUbicaciones(ubicacionesArray.value)
    if (!validacionDuplicados.exito) {
      mensajeError.value = `Hay codigos duplicados: ${validacionDuplicados.codigosDuplicados.join(', ')}`
      setTimeout(() => (mensajeError.value = ''), 3500)
      return
    }

    const archivoExcel = obtenerArchivoExcelListo()
    if (!archivoExcel) {
      mensajeError.value = 'El Excel todavía se está preparando'
      setTimeout(() => (mensajeError.value = ''), 3000)
      return
    }
    descargarArchivoExcelEnNavegador(archivoExcel)
    mensajeExito.value = 'Excel descargado correctamente'
    setTimeout(() => (mensajeExito.value = ''), 2500)
  } catch (error) {
    mensajeError.value = 'Error al descargar el archivo: ' + error.message
    setTimeout(() => (mensajeError.value = ''), 3500)
  }
}

function construirEnlaceUbicacionesCompartidas(idDocumento) {
  const urlPublicaApp = String(process.env.URL_PUBLICA_APP || window.location.origin).replace(/\/$/, '')
  return `${urlPublicaApp}/?ubicacionesCompartidas=${encodeURIComponent(idDocumento)}`
}

function construirMensajeWhatsAppEnlaceUbicaciones(nombreUsuario, cantidadUbicaciones, enlace) {
  const usuario = nombreUsuario || 'Sin usuario'
  const cantidad = cantidadUbicaciones === 1 ? '1 ubicación' : `${cantidadUbicaciones} ubicaciones`
  return [
    '*Ubicaciones compartidas*',
    '',
    `*Usuario:* ${usuario}`,
    `*Ubicaciones incluidas:* ${cantidad}`,
    '',
    'Abrí este enlace en Bitácora II y cargá tu Excel base para descargar el archivo final:',
    enlace,
  ].join('\n')
}

async function compartirUbicacionesPorEnlace() {
  if (!esNavegadorWeb.value || compartiendoEnlace.value) return

  const ventanaWhatsApp = prepararVentanaWhatsApp()
  try {
    const validacionDuplicados = validarCodigosDuplicadosEnUbicaciones(ubicacionesArray.value)
    if (!validacionDuplicados.exito) {
      throw new Error(`Hay códigos duplicados: ${validacionDuplicados.codigosDuplicados.join(', ')}`)
    }
    if (ubicacionesArray.value.length > MAXIMO_UBICACIONES_COMPARTIDAS) {
      throw new Error(
        `Podés compartir hasta ${MAXIMO_UBICACIONES_COMPARTIDAS} ubicaciones por enlace.`,
      )
    }

    compartiendoEnlace.value = true
    const nombreUsuario = await obtenerNombreUsuario()
    const resultado = await publicarUbicacionesCompartidas(ubicacionesArray.value, nombreUsuario)
    const enlace = construirEnlaceUbicacionesCompartidas(resultado.id)
    abrirWhatsAppConMensaje(
      construirMensajeWhatsAppEnlaceUbicaciones(nombreUsuario, resultado.cantidadUbicaciones, enlace),
      ventanaWhatsApp,
    )
    mensajeExito.value = 'Enlace creado y WhatsApp abierto'
    setTimeout(() => (mensajeExito.value = ''), 3000)
  } catch (error) {
    if (ventanaWhatsApp && !ventanaWhatsApp.closed) {
      ventanaWhatsApp.close()
    }
    mensajeError.value = `No se pudo crear el enlace: ${error.message}`
    setTimeout(() => (mensajeError.value = ''), 4000)
  } finally {
    compartiendoEnlace.value = false
  }
}

// Cargar ubicaciones al montar
onMounted(async () => {
  try {
    console.log('[AjustarUbicaciones] Montando componente...')

    await inicializarBaseDatos()
    baseDatosExpandida.value = !obtenerEstadoCarga().cargado

    const ubicacionesCargadas = await obtenerUbicaciones()

    if (Array.isArray(ubicacionesCargadas)) {
      ubicaciones.value = ubicacionesCargadas
      console.log(`[AjustarUbicaciones] ${ubicacionesCargadas.length} ubicaciones cargadas`)
    } else {
      console.warn(
        '[AjustarUbicaciones] obtenerUbicaciones() no devolvió array:',
        ubicacionesCargadas,
      )
      ubicaciones.value = []
    }

    actualizarConfiguracionBarra()
    programarPreparacionExcelCompartible({ debeInvalidar: false, esperar: false })
  } catch (error) {
    console.error('[AjustarUbicaciones] Error en onMounted:', error)
    ubicaciones.value = []
    mensajeError.value = 'Error al cargar ubicaciones: ' + error.message
    setTimeout(() => (mensajeError.value = ''), 3000)
  }
})

onUnmounted(() => {
  componenteUbicacionesActivo = false
  if (temporizadorPreparacionExcel) {
    clearTimeout(temporizadorPreparacionExcel)
  }
  emit(
    'configurar-barra',
    {
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
      modalActivo: false,
    },
    null,
  )
})
</script>

<style scoped>
.texto-explicacion-base {
  margin: 0 0 0.8rem 0;
}
</style>
