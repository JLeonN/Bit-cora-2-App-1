<template>
  <div class="contenedor-tabla">
    <div class="header-etiquetas">
      <h2 class="titulo-tabla">Etiquetas</h2>
      <div class="pestanas-etiquetas" role="tablist" aria-label="Tamaño de etiqueta" @keydown="manejarTeclaPestanas">
        <button
          v-for="opcion in OPCIONES_TAMANOS_ETIQUETA"
          :key="opcion.id"
          :ref="(elemento) => registrarPestana(opcion.id, elemento)"
          type="button"
          role="tab"
          class="pestana-etiqueta"
          :class="{ 'pestana-activa': tamanoSeleccionado === opcion.id }"
          :aria-selected="tamanoSeleccionado === opcion.id"
          :tabindex="tamanoSeleccionado === opcion.id ? 0 : -1"
          @click="tamanoSeleccionado = opcion.id"
        >{{ opcion.nombre }}</button>
      </div>
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
        ref="formularioEtiquetaRef"
        @agregar-etiqueta="agregarEtiqueta"
        @modal-abierto="manejarModalAbierto"
        @modal-cerrado="manejarModalCerrado"
      />
    </TarjetaSeccion>

    <TablaEtiquetas
      ref="tablaEtiquetasRef"
      :etiquetas="etiquetasVisibles"
      :configuracion="configuracionActiva"
      @editar-etiqueta="editarEtiqueta"
      @confirmar-etiqueta="confirmarEtiquetaEditada"
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
  UMBRAL_IR_AL_FINAL,
  desplazarAlFinalDePagina,
} from '../components/Botones/ConfiguracionBarraInferior.js'
import {
  generarDocumentoEtiquetas,
  esPlataformaWeb,
} from '../components/Logica/Etiquetas/GeneradorEtiquetasPDF.js'
import { configuracionEtiqueta10x15 } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta10x15.js'
import { configuracionEtiqueta5x10 } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta5x10.js'
import { configuracionEtiqueta2_5x6_7 } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta2.5x6.7.js'
import { TAMANO_ETIQUETA_GRANDE, TAMANO_ETIQUETA_CHICA, OPCIONES_TAMANOS_ETIQUETA } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/TamanosEtiqueta.js'
import { resolverDescripcionEtiqueta, guardarDescripcionDeTamano } from '../components/Logica/Etiquetas/ResolverDescripcionEtiqueta.js'
import { compartirArchivo } from '../components/Logica/Pedidos/CompartirExcel.js'
import {
  obtenerArchivoCompartidoPendiente,
  limpiarArchivoCompartidoPendiente,
  leerTextoArchivoCompartido,
} from '../components/Logica/Compartidos/ServicioArchivoCompartido.js'
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
  obtenerTodasLasMemoriasPorTamano,
} from '../components/BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js'

const router = useRouter()

const tamanoSeleccionado = ref(TAMANO_ETIQUETA_GRANDE)
const listaEtiquetas = ref([])
const memoriasPorTamano = ref({ [TAMANO_ETIQUETA_GRANDE]: {}, [TAMANO_ETIQUETA_CHICA]: {} })
const pestanas = {}
const formularioEtiquetaRef = ref(null)
const tablaEtiquetasRef = ref(null)
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

const configuracionActiva = computed(() => obtenerConfiguracionPorTamano(tamanoSeleccionado.value))
const etiquetasVisibles = computed(() => listaEtiquetas.value.map((etiqueta) => {
  const codigo = String(etiqueta.codigo || '').trim().toUpperCase()
  const alterno = tamanoSeleccionado.value === TAMANO_ETIQUETA_GRANDE ? TAMANO_ETIQUETA_CHICA : TAMANO_ETIQUETA_GRANDE
  return {
    ...etiqueta,
    ...resolverDescripcionEtiqueta({
      etiqueta,
      tamano: tamanoSeleccionado.value,
      memoriaPropia: memoriasPorTamano.value[tamanoSeleccionado.value]?.[codigo],
      memoriaAlterna: memoriasPorTamano.value[alterno]?.[codigo],
    }),
  }
}))

function registrarPestana(tamano, elemento) {
  if (elemento) pestanas[tamano] = elemento
}

function manejarTeclaPestanas(evento) {
  const indice = OPCIONES_TAMANOS_ETIQUETA.findIndex((opcion) => opcion.id === tamanoSeleccionado.value)
  let siguiente = indice
  if (evento.key === 'ArrowRight') siguiente = (indice + 1) % OPCIONES_TAMANOS_ETIQUETA.length
  else if (evento.key === 'ArrowLeft') siguiente = (indice - 1 + OPCIONES_TAMANOS_ETIQUETA.length) % OPCIONES_TAMANOS_ETIQUETA.length
  else if (evento.key === 'Home') siguiente = 0
  else if (evento.key === 'End') siguiente = OPCIONES_TAMANOS_ETIQUETA.length - 1
  else return
  evento.preventDefault()
  tamanoSeleccionado.value = OPCIONES_TAMANOS_ETIQUETA[siguiente].id
  pestanas[tamanoSeleccionado.value]?.focus()
}

async function cargarMemoriasPorTamano() {
  const memorias = await obtenerTodasLasMemoriasPorTamano()
  memoriasPorTamano.value = Object.fromEntries(
    Object.entries(memorias).map(([tamano, entradas]) => [
      tamano,
      Object.fromEntries(entradas.map((entrada) => [entrada.codigo, entrada])),
    ]),
  )
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
    throw error
  }
}

async function verificarNuevasEtiquetas() {
  try {
    const etiquetasActuales = await obtenerEtiquetas()
    if (!etiquetasActuales) return

    const idsActuales = new Set(listaEtiquetas.value.map((etiqueta) => etiqueta.id))
    const nuevas = etiquetasActuales.filter((etiqueta) => !idsActuales.has(etiqueta.id))
    if (nuevas.length) {
      listaEtiquetas.value.push(...nuevas)
      console.log('[PaginaEtiquetas] Etiquetas nuevas desde almacenamiento:', nuevas.length)
    }
  } catch (error) {
    console.error('[PaginaEtiquetas] Error en polling:', error)
  }
}

async function guardarMemoriaDesdeEtiqueta(etiqueta, tamano = tamanoSeleccionado.value) {
  if (!etiqueta?.codigo) return
  const codigo = String(etiqueta.codigo || '').trim().toUpperCase()
  const descripcionFormateada = String(etiqueta.descripcion || '')
  const resultado = await upsertMemoriaEtiqueta({ codigo, descripcionFormateada, tamano, tamanoDescripcionPt: etiqueta.tamanoDescripcionPt })
  if (!resultado.exito) throw new Error(resultado.mensaje)
  memoriasPorTamano.value[tamano] = { ...memoriasPorTamano.value[tamano], [codigo]: resultado.entrada }
}

async function agregarEtiqueta(etiqueta) {
  const etiquetaConIdBase = {
    ...etiqueta,
    id: Date.now(),
    tamano: tamanoSeleccionado.value,
    descripcionOriginal: String(etiqueta?.descripcion || ''),
    descripcionesPorTamano: { [tamanoSeleccionado.value]: String(etiqueta?.descripcion || '') },
  }
  listaEtiquetas.value.push(etiquetaConIdBase)
  const codigo = String(etiquetaConIdBase.codigo || '').trim().toUpperCase()
  if (memoriasPorTamano.value[tamanoSeleccionado.value]?.[codigo]) {
    Notify.create({
      type: 'info',
      message: `Memoria aplicada para ${etiquetaConIdBase.codigo}`,
      position: 'top',
      timeout: 1300,
    })
  }
  await persistirEtiquetas()
}

async function editarEtiqueta(etiquetaEditada) {
  const indice = listaEtiquetas.value.findIndex((e) => e.id === etiquetaEditada.id)
  if (indice !== -1) {
    const anterior = listaEtiquetas.value[indice]
    listaEtiquetas.value[indice] = {
      ...anterior,
      codigo: etiquetaEditada.codigo,
      cantidad: etiquetaEditada.cantidad,
      ubicacion: etiquetaEditada.ubicacion,
    }
    await persistirEtiquetas()
  }
}

async function confirmarEtiquetaEditada({ etiqueta, tamano, alTerminar }) {
  const etiquetaEditada = etiqueta
  const indice = listaEtiquetas.value.findIndex((e) => e.id === etiquetaEditada.id)
  if (indice < 0) {
    alTerminar(false)
    return
  }
  try {
    if (!String(etiquetaEditada.codigo || '').trim()) throw new Error('El código no puede estar vacío.')
    await guardarMemoriaDesdeEtiqueta(etiquetaEditada, tamano)
    const anterior = listaEtiquetas.value[indice]
    listaEtiquetas.value[indice] = guardarDescripcionDeTamano({
      etiqueta: {
        ...anterior,
        codigo: etiquetaEditada.codigo,
        ubicacion: etiquetaEditada.ubicacion,
      },
      tamano,
      descripcion: etiquetaEditada.descripcion,
      tamanoDescripcionPt: etiquetaEditada.tamanoDescripcionPt,
    })
    await persistirEtiquetas()
    Notify.create({ type: 'positive', message: `Memoria guardada para ${etiquetaEditada.codigo}`, position: 'top', timeout: 1300 })
    alTerminar(true)
  } catch (error) {
    Notify.create({ type: 'negative', message: `No se guardó la memoria: ${error.message}`, position: 'top', timeout: 3000 })
    alTerminar(false)
  }
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
  const anteriores = etiquetasVisibles.value.map((etiqueta) => etiqueta.descripcion)
  await cargarMemoriasPorTamano()
  return etiquetasVisibles.value.filter((etiqueta, indice) => etiqueta.descripcion !== anteriores[indice]).length
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

    const configuracion = configuracionActiva.value
    const etiquetasParaPDF =
      tablaEtiquetasRef.value?.obtenerEtiquetasOrdenadas?.() || [...etiquetasVisibles.value]
    for (const etiqueta of etiquetasParaPDF) {
      if (tamanoSeleccionado.value === TAMANO_ETIQUETA_GRANDE || etiqueta.memoriaActiva) {
        await guardarMemoriaDesdeEtiqueta(etiqueta)
      }
    }
    const resultado = await generarDocumentoEtiquetas(etiquetasParaPDF, configuracion)

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
  mostrarIrAlFinal: listaEtiquetas.value.length > UMBRAL_IR_AL_FINAL,
  tituloIrAlFinal: 'Ir al final de las etiquetas',
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
  onIrAlFinal: () => desplazarAlFinalDePagina(),
  onAccionPersonalizada: (accion) => {
    if (accion === 'descargar-pdf-etiquetas') {
      generarPDF()
    }
  },
  onAtrasNativo: () => cerrarPasoAtrasNativo(),
}

const manejarModalAbierto = () => {
  modalActivo.value = true
}

const manejarModalCerrado = () => {
  modalActivo.value = false
}

function cerrarPasoAtrasNativo() {
  if (formularioEtiquetaRef.value?.cerrarPasoAtrasNativo?.()) {
    modalActivo.value = false
    return true
  }
  if (tablaEtiquetasRef.value?.cerrarPasoAtrasNativo?.()) {
    modalActivo.value = false
    return true
  }
  if (mostrarModalEliminar.value) {
    cerrarModalEliminar()
    modalActivo.value = false
    return true
  }
  if (mostrarModalLimpiarTodo.value) {
    cerrarModalLimpiarTodo()
    modalActivo.value = false
    return true
  }
  return false
}

onMounted(async () => {
  await cargarEtiquetasGuardadas()
  await cargarMemoriasPorTamano()
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
.pestanas-etiquetas {
  display: flex;
  width: 100%;
  border-bottom: 2px solid var(--color-borde);
}
.pestana-etiqueta {
  flex: 1;
  min-width: 0;
  padding: 0.65rem 0.35rem;
  border: 1px solid var(--color-borde);
  border-bottom: 0;
  border-radius: 8px 8px 0 0;
  background: var(--color-fondo);
  color: var(--color-texto-secundario);
  cursor: pointer;
  font-weight: 600;
}
.pestana-activa {
  background: var(--color-superficie);
  color: var(--color-primario);
  border-color: var(--color-primario);
}
.pestana-etiqueta:focus-visible {
  outline: 2px solid var(--color-primario);
  outline-offset: 2px;
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
