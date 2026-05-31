<template>
  <div class="contenedor-tabla">
    <div class="header-etiquetas">
      <h2 class="titulo-tabla">Etiquetas</h2>
      <p class="texto-info-tamano">Las etiquetas se generan en formato <strong>10x15 cm</strong></p>
    </div>

    <TarjetaSeccion
      titulo="Memoria compartida"
      :expandida-por-defecto="false"
      descripcion-resumen="Accedé al apartado de memorias para importar, exportar y ver estado de sincronización."
      :ocultar-resumen-al-expandir="true"
    >
      <p class="texto-memoria-completa">
        Accedé al apartado de memorias para importar, exportar y ver estado de sincronización.
      </p>
      <template #accionFija>
        <button type="button" class="boton-abrir-memorias" @click.stop="abrirApartadoMemorias">
          Abrir memorias
        </button>
      </template>
    </TarjetaSeccion>

    <TarjetaSeccion
      titulo="Agregar etiquetas"
      :expandida-por-defecto="false"
      descripcion-resumen="Ingresá código, descripción, ubicación y cantidad para crear etiquetas."
      :ocultar-resumen-al-expandir="true"
    >
      <p class="texto-agregar-etiquetas-completo">
        Ingresá código, descripción, ubicación y cantidad para crear etiquetas. También podés escanear el
        código para cargar más rápido y luego ajustar la descripción antes de guardar.
      </p>
      <FormularioEtiqueta
        @agregar-etiqueta="agregarEtiqueta"
        @modal-abierto="manejarModalAbierto"
        @modal-cerrado="manejarModalCerrado"
      />
    </TarjetaSeccion>

    <TablaEtiquetas
      :etiquetas="listaEtiquetas"
      @editar-etiqueta="editarEtiqueta"
      @guardar-memoria-etiqueta="guardarMemoriaEtiquetaDesdeTabla"
      @eliminar-etiqueta="eliminarEtiqueta"
      @limpiar-todo="limpiarTodo"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="`la etiqueta del artículo ${etiquetaAEliminar?.codigo}`"
      @confirmar="confirmarEliminar"
      @cerrar="cerrarModalEliminar"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

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
import { useRouter } from 'vue-router'
import { Loading, Notify } from 'quasar'
import { IconDownload } from '@tabler/icons-vue'
import FormularioEtiqueta from '../components/Logica/Etiquetas/FormularioEtiqueta.vue'
import TablaEtiquetas from '../components/Logica/Etiquetas/TablaEtiquetas.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import {
  generarDocumentoEtiquetas,
  esPlataformaWeb,
} from '../components/Logica/Etiquetas/GeneradorEtiquetasPDF.js'
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
  importarMemoriasDesdeTexto as importarMemoriasDesdeTextoServicio,
} from '../components/Logica/Etiquetas/ServicioMemoriasEtiquetas.js'
import {
  guardarEtiquetas,
  obtenerEtiquetas,
  eliminarEtiquetas,
} from '../components/BaseDeDatos/usoAlmacenamientoEtiquetas.js'
import {
  upsertMemoriaEtiqueta,
  obtenerMemoriaEtiquetaPorCodigo,
} from '../components/BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js'

const router = useRouter()

const tamanoSeleccionado = ref('10x15cm')
const listaEtiquetas = ref([])
const mostrarModalEliminar = ref(false)
const mostrarModalLimpiarTodo = ref(false)
const etiquetaAEliminar = ref(null)
const indiceAEliminar = ref(null)
const generandoDocumento = ref(false)
const importandoMemorias = ref(false)
const modalActivo = ref(false)

let intervaloPolling = null

const emit = defineEmits(['configurar-barra'])

function obtenerConfiguracionPorTamano(tamano) {
  const configuraciones = {
    '10x15cm': configuracionEtiqueta10x15,
    '5x10cm': configuracionEtiqueta5x10,
    '2.5x6.7cm': configuracionEtiqueta2_5x6_7,
  }
  return configuraciones[tamano] || configuracionEtiqueta10x15
}

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

async function verificarNuevasEtiquetas() {
  try {
    const etiquetasActuales = await obtenerEtiquetas()
    if (!etiquetasActuales) return

    if (etiquetasActuales.length !== listaEtiquetas.value.length) {
      listaEtiquetas.value = await Promise.all(
        etiquetasActuales.map((etiqueta) => aplicarMemoriaEtiqueta(etiqueta)),
      )
      console.log('[PaginaEtiquetas] Etiquetas actualizadas desde almacenamiento:', etiquetasActuales.length)
    }
  } catch (error) {
    console.error('[PaginaEtiquetas] Error en polling:', error)
  }
}

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
  await eliminarEtiquetas()
  cerrarModalLimpiarTodo()
}

function cerrarModalLimpiarTodo() {
  mostrarModalLimpiarTodo.value = false
}

function abrirApartadoMemorias() {
  router.push({ name: 'MemoriasEtiquetas' })
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

async function importarMemoriasDesdeTexto(textoJson, origenImportacion = '') {
  Loading.show({
    message: `Importando memorias (${origenImportacion || 'archivo compartido'})...`,
    spinnerColor: 'primary',
  })
  const resultado = await importarMemoriasDesdeTextoServicio({
    textoJson,
    alAplicarCambios: reaplicarMemoriasEnPantalla,
  })
  Loading.hide()

  if (!resultado.exito) {
    Notify.create({
      type: 'negative',
      message: resultado.mensaje || 'No se pudo importar las memorias.',
      position: 'top',
      timeout: 2500,
    })
    return
  }

  Notify.create({
    type: 'positive',
    message: `Importación lista (${resultado.payload.exportadoPor}): +${resultado.resumen.nuevas} nuevas, ${resultado.resumen.actualizadas} actualizadas, ${resultado.resumen.ignoradas} ignoradas, ${resultado.entradasInvalidas} inválidas, ${resultado.cantidadCambiosPantalla} aplicadas en pantalla.`,
    position: 'top',
    timeout: 3600,
  })
}

async function procesarArchivoCompartidoPendiente() {
  if (importandoMemorias.value) return
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

async function generarPDF() {
  if (listaEtiquetas.value.length === 0) return

  try {
    generandoDocumento.value = true
    Loading.show({
      message: 'Generando documento PDF...',
      spinnerColor: 'primary',
    })

    const configuracion = obtenerConfiguracionPorTamano(tamanoSeleccionado.value)
    await Promise.all(listaEtiquetas.value.map((etiqueta) => guardarMemoriaDesdeEtiqueta(etiqueta)))
    const resultado = await generarDocumentoEtiquetas(listaEtiquetas.value, configuracion)

    Loading.hide()
    if (!resultado.exito) {
      throw new Error(resultado.mensaje)
    }

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

const manejarModalAbierto = () => {
  modalActivo.value = true
}

const manejarModalCerrado = () => {
  modalActivo.value = false
}

onMounted(async () => {
  await cargarEtiquetasGuardadas()
  listaEtiquetas.value = await Promise.all(listaEtiquetas.value.map((etiqueta) => aplicarMemoriaEtiqueta(etiqueta)))
  await procesarArchivoCompartidoPendiente()

  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)

  intervaloPolling = setInterval(() => {
    verificarNuevasEtiquetas()
  }, 2000)
})

onUnmounted(() => {
  if (intervaloPolling) {
    clearInterval(intervaloPolling)
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
.boton-abrir-memorias {
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 8px;
  padding: 0.5rem 0.8rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s ease;
}
.texto-memoria-completa {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.92rem;
  line-height: 1.4;
}
.texto-agregar-etiquetas-completo {
  margin: 0 0 0.8rem 0;
  color: var(--color-texto-secundario);
  font-size: 0.92rem;
  line-height: 1.4;
}
.boton-abrir-memorias:hover {
  filter: brightness(1.1);
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
}
</style>
