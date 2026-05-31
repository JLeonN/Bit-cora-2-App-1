<template>
  <div class="contenedor-tabla">
    <!-- HEADER CON TÍTULO Y SELECTOR DE TAMAÑO -->
    <div class="header-etiquetas">
      <h2 class="titulo-tabla">Etiquetas</h2>

      <p class="texto-info-tamano">Las etiquetas se generan en formato <strong>10x15 cm</strong></p>
    </div>

    <div class="tarjeta-acciones-memoria">
      <h3 class="titulo-acciones-memoria">Memoria compartida</h3>
      <div class="acciones-memoria">
        <button
          type="button"
          class="boton-accion-memoria"
          :disabled="importandoMemorias || exportandoMemorias"
          @click="exportarMemorias"
        >
          {{ exportandoMemorias ? 'Exportando...' : 'Exportar memorias' }}
        </button>
        <button
          type="button"
          class="boton-accion-memoria"
          :disabled="importandoMemorias || exportandoMemorias"
          @click="importarMemorias"
        >
          {{ importandoMemorias ? 'Importando...' : 'Importar memorias' }}
        </button>
      </div>
    </div>

    <TarjetaSeccion titulo="Agregar etiquetas" :expandida-por-defecto="false">
      <FormularioEtiqueta
        @agregar-etiqueta="agregarEtiqueta"
        @modal-abierto="manejarModalAbierto"
        @modal-cerrado="manejarModalCerrado"
      />
    </TarjetaSeccion>

    <!-- TABLA DE ARTÍCULOS -->
    <TablaEtiquetas
      :etiquetas="listaEtiquetas"
      @editar-etiqueta="editarEtiqueta"
      @guardar-memoria-etiqueta="guardarMemoriaEtiquetaDesdeTabla"
      @eliminar-etiqueta="eliminarEtiqueta"
      @limpiar-todo="limpiarTodo"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- MODAL ELIMINAR ETIQUETA INDIVIDUAL -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="`la etiqueta del artículo ${etiquetaAEliminar?.codigo}`"
      @confirmar="confirmarEliminar"
      @cerrar="cerrarModalEliminar"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- MODAL ELIMINAR TODO -->
    <ModalEliminar
      v-if="mostrarModalLimpiarTodo"
      texto="todas las etiquetas"
      @confirmar="confirmarLimpiarTodo"
      @cerrar="cerrarModalLimpiarTodo"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Loading, Notify } from 'quasar'
import { IconDownload } from '@tabler/icons-vue'
import { Filesystem, Directory } from '@capacitor/filesystem'
import FormularioEtiqueta from '../components/Logica/Etiquetas/FormularioEtiqueta.vue'
import TablaEtiquetas from '../components/Logica/Etiquetas/TablaEtiquetas.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import {
  generarDocumentoEtiquetas,
  esPlataformaWeb,
} from '../components/Logica/Etiquetas/GeneradorEtiquetasPDF.js'
// Nota técnica: existen configuraciones 5x10 y 2.5x6.7 internas, no expuestas en UI por ahora.
import { configuracionEtiqueta10x15 } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta10x15.js'
import { configuracionEtiqueta5x10 } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta5x10.js'
import { configuracionEtiqueta2_5x6_7 } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta2.5x6.7.js'
import { compartirArchivo } from '../components/Logica/Pedidos/CompartirExcel.js'
import {
  obtenerArchivoCompartidoPendiente,
  limpiarArchivoCompartidoPendiente,
  leerTextoArchivoCompartido,
} from '../components/Logica/Etiquetas/ServicioArchivoCompartido.js'
import {
  guardarEtiquetas,
  obtenerEtiquetas,
  eliminarEtiquetas,
} from '../components/BaseDeDatos/usoAlmacenamientoEtiquetas.js'
import { obtenerNombreUsuario } from '../components/BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import {
  upsertMemoriaEtiqueta,
  obtenerMemoriaEtiquetaPorCodigo,
  obtenerTodasLasMemoriasEtiquetas,
  construirJsonCompartirMemorias,
  parsearJsonCompartirMemorias,
  fusionarMemoriasDesdeJsonPayload,
  crearRespaldoMemoriaEtiquetas,
} from '../components/BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js'

// --- ESTADO REACTIVO ---
const tamanoSeleccionado = ref('10x15cm')
const listaEtiquetas = ref([])
const mostrarModalEliminar = ref(false)
const mostrarModalLimpiarTodo = ref(false)
const etiquetaAEliminar = ref(null)
const indiceAEliminar = ref(null)
const generandoDocumento = ref(false)
const importandoMemorias = ref(false)
const exportandoMemorias = ref(false)

// Estado para controlar si algún modal está activo
const modalActivo = ref(false)

let intervaloPolling = null

const emit = defineEmits(['configurar-barra'])

// --- FUNCIÓN PARA OBTENER CONFIGURACIÓN SEGÚN TAMAÑO ---
function obtenerConfiguracionPorTamano(tamano) {
  const configuraciones = {
    '10x15cm': configuracionEtiqueta10x15,
    '5x10cm': configuracionEtiqueta5x10,
    '2.5x6.7cm': configuracionEtiqueta2_5x6_7,
  }

  return configuraciones[tamano] || configuracionEtiqueta10x15
}

// --- FUNCIONES DE PERSISTENCIA ---
async function cargarEtiquetasGuardadas() {
  try {
    const etiquetasGuardadas = await obtenerEtiquetas()
    if (etiquetasGuardadas && etiquetasGuardadas.length > 0) {
      listaEtiquetas.value = etiquetasGuardadas
      console.log('[PaginaEtiquetas] Etiquetas cargadas:', etiquetasGuardadas.length)
    }
  } catch (error) {
    console.error('[PaginaEtiquetas] Error cargando etiquetas:', error)
  }
}

async function persistirEtiquetas() {
  try {
    await guardarEtiquetas(listaEtiquetas.value)
    console.log('[PaginaEtiquetas] Etiquetas persistidas:', listaEtiquetas.value.length)
  } catch (error) {
    console.error('[PaginaEtiquetas] Error persistiendo etiquetas:', error)
  }
}

// --- POLLING PARA DETECTAR ETIQUETAS AGREGADAS DESDE UBICACIONES ---
async function verificarNuevasEtiquetas() {
  try {
    const etiquetasActuales = await obtenerEtiquetas()

    if (!etiquetasActuales) return

    // Solo actualizar si la cantidad cambió
    if (etiquetasActuales.length !== listaEtiquetas.value.length) {
      listaEtiquetas.value = await Promise.all(
        etiquetasActuales.map((etiqueta) => aplicarMemoriaEtiqueta(etiqueta)),
      )
      console.log(
        '[PaginaEtiquetas] Etiquetas actualizadas desde almacenamiento:',
        etiquetasActuales.length,
      )
    }
  } catch (error) {
    console.error('[PaginaEtiquetas] Error en polling:', error)
  }
}

// --- FUNCIONES ---
async function aplicarMemoriaEtiqueta(etiquetaBase) {
  const etiqueta = {
    ...etiquetaBase,
    codigo: String(etiquetaBase?.codigo || '')
      .trim()
      .toUpperCase(),
  }
  if (!etiqueta.descripcionOriginal) {
    etiqueta.descripcionOriginal = String(etiqueta.descripcion || '')
  }
  const memoria = await obtenerMemoriaEtiquetaPorCodigo(etiqueta.codigo)
  if (!memoria) {
    return {
      ...etiqueta,
      memoriaActiva: false,
    }
  }
  return {
    ...etiqueta,
    descripcion: String(memoria.descripcionFormateada || etiqueta.descripcion || ''),
    memoriaActiva: true,
    memoriaActualizadaEn: memoria.actualizadoEn || null,
  }
}

async function guardarMemoriaDesdeEtiqueta(etiqueta) {
  if (!etiqueta?.codigo) return
  const codigo = String(etiqueta.codigo || '').trim().toUpperCase()
  const descripcionFormateada = String(etiqueta.descripcion || '')
  await upsertMemoriaEtiqueta({ codigo, descripcionFormateada })
}

async function agregarEtiqueta(etiqueta) {
  const etiquetaConIdBase = {
    ...etiqueta,
    id: Date.now(),
    descripcionOriginal: String(etiqueta?.descripcion || ''),
  }
  const etiquetaConId = await aplicarMemoriaEtiqueta(etiquetaConIdBase)

  listaEtiquetas.value.push(etiquetaConId)
  console.log('[PaginaEtiquetas] Etiqueta agregada:', etiquetaConId)
  if (etiquetaConId.memoriaActiva) {
    Notify.create({
      type: 'info',
      message: `Memoria aplicada para ${etiquetaConId.codigo}`,
      position: 'top',
      timeout: 1300,
    })
  }

  await persistirEtiquetas()
}

async function editarEtiqueta(etiquetaEditada) {
  const indice = listaEtiquetas.value.findIndex((e) => e.id === etiquetaEditada.id)
  if (indice !== -1) {
    listaEtiquetas.value[indice] = etiquetaEditada
    console.log('[PaginaEtiquetas] Etiqueta editada:', etiquetaEditada)

    await persistirEtiquetas()
  }
}

async function guardarMemoriaEtiquetaDesdeTabla(etiquetaEditada) {
  if (!etiquetaEditada?.codigo) return
  await guardarMemoriaDesdeEtiqueta(etiquetaEditada)
  const indice = listaEtiquetas.value.findIndex((e) => e.id === etiquetaEditada.id)
  if (indice !== -1) {
    listaEtiquetas.value[indice] = {
      ...listaEtiquetas.value[indice],
      memoriaActiva: true,
      memoriaActualizadaEn: Date.now(),
    }
  }
  Notify.create({
    type: 'positive',
    message: `Memoria guardada para ${etiquetaEditada.codigo}`,
    position: 'top',
    timeout: 1300,
  })
}

function eliminarEtiqueta(indice) {
  etiquetaAEliminar.value = listaEtiquetas.value[indice]
  indiceAEliminar.value = indice
  mostrarModalEliminar.value = true
}

function confirmarEliminar() {
  listaEtiquetas.value.splice(indiceAEliminar.value, 1)
  console.log('[PaginaEtiquetas] Etiqueta eliminada')

  persistirEtiquetas()

  cerrarModalEliminar()
}

function cerrarModalEliminar() {
  mostrarModalEliminar.value = false
  etiquetaAEliminar.value = null
  indiceAEliminar.value = null
}

function limpiarTodo() {
  if (listaEtiquetas.value.length === 0) return
  mostrarModalLimpiarTodo.value = true
}

async function confirmarLimpiarTodo() {
  listaEtiquetas.value = []
  console.log('[PaginaEtiquetas] Lista de etiquetas limpiada')

  await eliminarEtiquetas()

  cerrarModalLimpiarTodo()
}

function cerrarModalLimpiarTodo() {
  mostrarModalLimpiarTodo.value = false
}

function sanitizarTextoParaNombreArchivo(texto = '') {
  const base = String(texto || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
  return base || 'Usua-des'
}

function crearNombreArchivoMemorias(nombreUsuario = '') {
  const nombreSanitizado = sanitizarTextoParaNombreArchivo(nombreUsuario)
  const ahora = new Date()
  const fecha = ahora.toISOString().split('T')[0]
  const hora = ahora.toTimeString().slice(0, 5).replace(':', '-')
  return `Memorias ${nombreSanitizado} ${fecha} # ${hora}.json`
}

function descargarJsonEnWeb(nombreArchivo, contenidoJson) {
  const blob = new Blob([contenidoJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

async function leerArchivoJsonDesdeSelector() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async (evento) => {
      try {
        const archivo = evento?.target?.files?.[0]
        if (!archivo) {
          resolve(null)
          return
        }
        const texto = await archivo.text()
        resolve({ nombre: archivo.name, texto })
      } catch (error) {
        reject(error)
      }
    }
    input.click()
  })
}

async function importarMemoriasDesdeTexto(textoJson, origenImportacion = '') {
  const parseado = parsearJsonCompartirMemorias(textoJson)
  if (!parseado.exito) {
    Notify.create({
      type: 'negative',
      message: parseado.mensaje || 'Archivo JSON inválido.',
      position: 'top',
      timeout: 2500,
    })
    return false
  }

  const payload = parseado.payload
  const textoOrigen = origenImportacion ? ` (${origenImportacion})` : ''
  Loading.show({
    message: `Importando memorias de ${payload.exportadoPor}${textoOrigen}...`,
    spinnerColor: 'primary',
  })

  await crearRespaldoMemoriaEtiquetas()
  const resultado = await fusionarMemoriasDesdeJsonPayload(payload)
  const cantidadCambiosPantalla = await reaplicarMemoriasEnPantalla()
  Loading.hide()

  Notify.create({
    type: 'positive',
    message: `Importación lista (${payload.exportadoPor}): +${resultado.resumen.nuevas} nuevas, ${resultado.resumen.actualizadas} actualizadas, ${resultado.resumen.ignoradas} ignoradas, ${parseado.entradasInvalidas} inválidas, ${cantidadCambiosPantalla} aplicadas en pantalla.`,
    position: 'top',
    timeout: 3600,
  })
  return true
}

async function procesarArchivoCompartidoPendiente() {
  if (importandoMemorias.value || exportandoMemorias.value) return

  const pendiente = await obtenerArchivoCompartidoPendiente()
  if (!pendiente?.uri) return

  importandoMemorias.value = true
  try {
    const textoJson = await leerTextoArchivoCompartido(pendiente.uri)
    if (!textoJson) {
      Notify.create({
        type: 'negative',
        message: 'No se pudo leer el archivo compartido para importar memorias.',
        position: 'top',
        timeout: 2600,
      })
      return
    }
    await importarMemoriasDesdeTexto(textoJson, pendiente.nombre || 'archivo compartido')
  } catch (error) {
    console.error('[PaginaEtiquetas] Error importando archivo compartido pendiente:', error)
    Loading.hide()
    Notify.create({
      type: 'negative',
      message: 'Falló la importación automática del archivo compartido.',
      position: 'top',
      timeout: 2600,
    })
  } finally {
    await limpiarArchivoCompartidoPendiente()
    importandoMemorias.value = false
  }
}

async function exportarMemorias() {
  if (exportandoMemorias.value || importandoMemorias.value) return
  exportandoMemorias.value = true
  try {
    const entradas = await obtenerTodasLasMemoriasEtiquetas()
    if (!Array.isArray(entradas) || entradas.length === 0) {
      Notify.create({
        type: 'warning',
        message: 'No hay memorias para exportar.',
        position: 'top',
        timeout: 1800,
      })
      return
    }

    const nombreUsuario = await obtenerNombreUsuario()
    const payload = construirJsonCompartirMemorias({
      entradas,
      exportadoPor: nombreUsuario,
      exportadoEn: Date.now(),
    })
    const contenidoJson = JSON.stringify(payload, null, 2)
    const nombreArchivo = crearNombreArchivoMemorias(nombreUsuario)

    if (esPlataformaWeb()) {
      descargarJsonEnWeb(nombreArchivo, contenidoJson)
    } else {
      const resultado = await Filesystem.writeFile({
        path: nombreArchivo,
        directory: Directory.Cache,
        data: contenidoJson,
        encoding: 'utf8',
        recursive: true,
      })
      const compartido = await compartirArchivo(resultado.uri, nombreArchivo, {
        titulo: 'Memorias de etiquetas',
        texto: `Memorias exportadas por ${payload.exportadoPor}`,
      })
      if (!compartido) {
        Notify.create({
          type: 'warning',
          message: 'No se pudo abrir el menú de compartir.',
          position: 'top',
          timeout: 2200,
        })
        return
      }
    }

    Notify.create({
      type: 'positive',
      message: `Memorias exportadas: ${payload.cantidad}`,
      position: 'top',
      timeout: 1800,
    })
  } catch (error) {
    console.error('[PaginaEtiquetas] Error exportando memorias:', error)
    Notify.create({
      type: 'negative',
      message: 'No se pudo exportar las memorias.',
      position: 'top',
      timeout: 2200,
    })
  } finally {
    exportandoMemorias.value = false
  }
}

async function reaplicarMemoriasEnPantalla() {
  let cambios = 0
  const listaActualizada = await Promise.all(
    listaEtiquetas.value.map(async (etiqueta) => {
      const descripcionPrev = String(etiqueta?.descripcion || '')
      const etiquetaActualizada = await aplicarMemoriaEtiqueta(etiqueta)
      if (String(etiquetaActualizada?.descripcion || '') !== descripcionPrev) {
        cambios += 1
      }
      return etiquetaActualizada
    }),
  )
  listaEtiquetas.value = listaActualizada
  if (cambios > 0) {
    await persistirEtiquetas()
  }
  return cambios
}

async function importarMemorias() {
  if (importandoMemorias.value || exportandoMemorias.value) return
  importandoMemorias.value = true
  try {
    const archivo = await leerArchivoJsonDesdeSelector()
    if (!archivo) return
    await importarMemoriasDesdeTexto(archivo.texto, archivo.nombre || 'archivo manual')
  } catch (error) {
    console.error('[PaginaEtiquetas] Error importando memorias:', error)
    Loading.hide()
    Notify.create({
      type: 'negative',
      message: 'No se pudo importar las memorias.',
      position: 'top',
      timeout: 2500,
    })
  } finally {
    importandoMemorias.value = false
  }
}
async function generarPDF() {
  if (listaEtiquetas.value.length === 0) return

  try {
    generandoDocumento.value = true

    Loading.show({
      message: 'Generando documento PDF...',
      spinnerColor: 'primary',
    })

    console.log('[PaginaEtiquetas] Tamaño seleccionado:', tamanoSeleccionado.value)
    console.log('[PaginaEtiquetas] Generando PDF con', listaEtiquetas.value.length, 'etiquetas')

    const configuracion = obtenerConfiguracionPorTamano(tamanoSeleccionado.value)

    await Promise.all(listaEtiquetas.value.map((etiqueta) => guardarMemoriaDesdeEtiqueta(etiqueta)))

    console.log('[PaginaEtiquetas] Configuración usada:', configuracion.nombre)
    console.log('[PaginaEtiquetas] Dimensiones:', configuracion.pagina)

    const resultado = await generarDocumentoEtiquetas(listaEtiquetas.value, configuracion)

    Loading.hide()

    if (!resultado.exito) {
      throw new Error(resultado.mensaje)
    }

    console.log('[PaginaEtiquetas] Documento generado:', resultado.rutaArchivo)

    if (esPlataformaWeb()) {
      Notify.create({
        type: 'positive',
        message: 'Documento PDF descargado correctamente',
        position: 'top',
        timeout: 2000,
      })
      return
    }

    const compartido = await compartirArchivo(resultado.rutaArchivo, resultado.nombreArchivo, {
      titulo: 'Etiquetas PDF',
      texto: `Etiquetas generadas: ${resultado.nombreArchivo}`,
    })

    if (compartido) {
      Notify.create({
        type: 'positive',
        message: 'Documento generado y compartido correctamente',
        position: 'top',
        timeout: 2000,
      })
    }
  } catch (error) {
    console.error('[PaginaEtiquetas] Error generando PDF:', error)
    Loading.hide()
    Notify.create({
      type: 'negative',
      message: `Error: ${error.message}`,
      position: 'top',
      timeout: 3000,
    })
  } finally {
    generandoDocumento.value = false
  }
}

const configuracionBarra = computed(() => ({
  mostrarAtras: true,
  mostrarInicio: true,
  mostrarAgregar: false,
  mostrarEnviar: !esPlataformaWeb() && listaEtiquetas.value.length > 0,
  puedeEnviar: listaEtiquetas.value.length > 0,
  botonesPersonalizados: esPlataformaWeb()
    ? [
        {
          accion: 'descargar-pdf-etiquetas',
          icono: IconDownload,
          titulo: 'Descargar PDF',
          desactivado: listaEtiquetas.value.length === 0,
          claseCSS: '',
        },
      ]
    : [],
  modalActivo: modalActivo.value,
}))

const metodosParaBarra = {
  onEnviar: () => generarPDF(),
  onAgregar: () => {},
  onAccionPersonalizada: (accion) => {
    if (accion === 'descargar-pdf-etiquetas') {
      generarPDF()
    }
  },
}

// Métodos para manejar el estado del modal
const manejarModalAbierto = () => {
  modalActivo.value = true
}

const manejarModalCerrado = () => {
  modalActivo.value = false
}

// --- LIFECYCLE ---
onMounted(async () => {
  await cargarEtiquetasGuardadas()
  listaEtiquetas.value = await Promise.all(listaEtiquetas.value.map((etiqueta) => aplicarMemoriaEtiqueta(etiqueta)))
  await procesarArchivoCompartidoPendiente()

  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)

  // Iniciar polling cada 2 segundos
  intervaloPolling = setInterval(() => {
    verificarNuevasEtiquetas()
  }, 2000)

  console.log('[PaginaEtiquetas] Polling iniciado')
})

onUnmounted(() => {
  // Limpiar polling
  if (intervaloPolling) {
    clearInterval(intervaloPolling)
    console.log('[PaginaEtiquetas] Polling detenido')
  }

  emit(
    'configurar-barra',
    {
      mostrarAtras: false,
      mostrarInicio: false,
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
      modalActivo: false,
    },
    null,
  )
})

watch(
  () => listaEtiquetas.value.length,
  () => {
    emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
  },
  { deep: true },
)

// Watcher para actualizar cuando cambia el estado del modal
watch(
  () => modalActivo.value,
  () => {
    emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
  },
)
</script>

<style scoped>
.contenedor-tabla {
  padding: 1rem;
  padding-bottom: 120px;
}
.header-etiquetas {
  background-color: var(--color-superficie);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.titulo-tabla {
  text-align: center;
  color: var(--color-primario);
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
}
.selector-tamano {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.75rem;
  background: var(--color-fondo);
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  flex-wrap: wrap;
}
.label-tamano {
  font-weight: 600;
  color: var(--color-texto-secundario);
  font-size: 0.95rem;
}
.opcion-tamano {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  transition: background 0.2s ease;
}
.opcion-tamano:hover {
  background: var(--color-superficie);
}
.opcion-tamano input[type='radio'] {
  cursor: pointer;
  accent-color: var(--color-primario);
  width: 18px;
  height: 18px;
}
.opcion-tamano span {
  font-size: 0.95rem;
  color: var(--color-texto-principal);
  font-weight: 500;
}
@media (max-width: 600px) {
  .contenedor-tabla {
    padding: 0.75rem;
  }
  .header-etiquetas {
    padding: 1rem;
  }
  .titulo-tabla {
    font-size: 1.5rem;
  }
  .selector-tamano {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }
  .label-tamano {
    font-size: 0.9rem;
  }
  .opcion-tamano {
    width: 100%;
    justify-content: center;
    padding: 0.6rem 1rem;
  }
}
@media (max-width: 900px) and (min-width: 601px) {
  .titulo-tabla {
    font-size: 1.8rem;
  }
}
.texto-info-tamano {
  text-align: center;
  color: var(--color-texto-secundario);
  font-size: 0.95rem;
  margin: 0;
  padding: 0.5rem;
  background: var(--color-fondo);
  border-radius: 6px;
}
.texto-info-tamano strong {
  color: var(--color-primario);
  font-weight: 600;
}
.tarjeta-acciones-memoria {
  background-color: var(--color-superficie);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  margin-bottom: 1rem;
}
.titulo-acciones-memoria {
  margin: 0 0 0.55rem 0;
  color: var(--color-texto-principal);
  font-size: 0.95rem;
}
.acciones-memoria {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}
.boton-accion-memoria {
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 8px;
  padding: 0.5rem 0.72rem;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s ease;
}
.boton-accion-memoria:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.boton-accion-memoria:hover:not(:disabled) {
  filter: brightness(1.1);
}
</style>



