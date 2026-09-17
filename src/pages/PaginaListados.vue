<template>
  <div class="contenedor-tabla pagina-listados">
    <h2 class="titulo-tabla">Listados</h2>

    <div class="tarjeta-administrar-listados">
      <div class="encabezado-administrar-listados">
        <h3>Administrar listados</h3>
      </div>
      <div class="contenido-administrar-listados">
        <GestorListados
          :listados="listados"
          :listado-activo="listadoActivo"
          :ocupado="ocupado"
          @crear="crearNuevoListado"
          @abrir="abrirListado"
          @renombrar="renombrarListadoActivo"
          @duplicar="duplicarListadoActivo"
          @solicitar-eliminar="solicitarEliminarListado"
        />
      </div>
    </div>

    <template v-if="listadoActivo">
      <section class="zona-agregar-listado" aria-label="Agregar artículos al listado">
        <FormularioListado
          ref="formularioListadoRef"
          :deshabilitado="ocupado"
          :articulo-repetido="articuloPendienteRepetido"
          :lineas-repetidas="lineasArticuloPendiente"
          :contexto-busqueda="listadoActivo.contextoBusqueda"
          :identificador-destino="listadoActivo.id"
          :importando-excel="importandoExcel"
          @articulo-seleccionado="agregarArticulo"
          @archivo-excel-seleccionado="importarExcelListado"
          @base-datos-cargada="manejarBaseCargada"
          @base-datos-limpia="baseDatosCargada = false"
          @error-carga="manejarErrorCarga"
          @modal-abierto="modalActivo = true"
          @modal-cerrado="modalActivo = false"
          @confirmar-repetido="confirmarArticuloRepetido"
          @cancelar-repetido="cancelarArticuloRepetido"
          @actualizar-contexto="guardarContextoBusqueda"
          @resultado-capitana-bita="procesarResultadoCapitanaBita"
        />
        <PanelResultadoImportacionExcel
          v-if="resultadoImportacionExcel"
          :resultado="resultadoImportacionExcel"
          @cerrar="cerrarResultadoImportacionExcel"
        />
        <!-- Los resultados de Capitana Bita se conservan, pero permanecen ocultos mientras la función no se utilice. -->
        <PanelResultadosCapitanaBita
          v-if="MOSTRAR_CAPITANA_BITA && resultadoPendienteCapitanaBita"
          :transcripcion="resultadoPendienteCapitanaBita.transcripcion"
          :ambiguedades="resultadoPendienteCapitanaBita.ambiguedades"
          :no-encontrados="resultadoPendienteCapitanaBita.noEncontrados"
          :inconsistencias="resultadoPendienteCapitanaBita.inconsistencias"
          :advertencias="resultadoPendienteCapitanaBita.advertencias"
          :resumen="resultadoPendienteCapitanaBita.resumen"
          :tipo-entrada="resultadoPendienteCapitanaBita.tipoEntrada"
          :memorias-propuestas="memoriasPropuestasCapitanaBita"
          @seleccionar-candidato="seleccionarCandidatoCapitanaBita"
          @omitir-solicitud="omitirSolicitudCapitanaBita"
          @recordar-seleccion="guardarMemoriaDesdeSeleccion"
          @cerrar="cerrarResultadosCapitanaBita"
        />
        <div class="columnas-visibles-listado">
          <span class="titulo-columnas-listado">Columnas visibles</span>
          <div class="interruptores-listado">
            <q-toggle
              :model-value="listadoActivo.configuracion.mostrarNumeracion"
              label="Numeración"
              color="primary"
              @update:model-value="actualizarConfiguracion('mostrarNumeracion', $event)"
            />
            <q-toggle
              :model-value="listadoActivo.configuracion.mostrarStock"
              label="Stock"
              color="primary"
              @update:model-value="actualizarConfiguracion('mostrarStock', $event)"
            />
            <q-toggle
              :model-value="listadoActivo.configuracion.mostrarUbicacion"
              label="Ubicación"
              color="primary"
              @update:model-value="actualizarConfiguracion('mostrarUbicacion', $event)"
            />
          </div>
        </div>
      </section>

      <SelectorOrdenamiento
        v-if="articulosOrdenados.length > 0"
        :model-value="listadoActivo.orden"
        :deshabilitado="ocupado"
        :criterios-disponibles="criteriosOrdenListado"
        etiqueta-cantidad="Stock"
        @update:model-value="actualizarOrden"
      />

      <div v-if="articulosOrdenados.length" class="acciones-generales-tabla">
        <button
          type="button"
          class="boton-accion-general boton-enviar-etiquetas"
          :disabled="!baseDatosCargada || ocupado"
          @click="enviarTodosAEtiquetas"
        >
          <IconTag :size="20" />
          <span class="texto-boton-accion">Enviar todos a Etiquetas</span>
        </button>
        <button
          type="button"
          class="boton-accion-general"
          :disabled="ocupado"
          title="Enviar todos a Ubicaciones"
          @click="enviarTodosAUbicaciones"
        >
          <IconMapRoute class="icono-accion-listado" :size="20" :stroke="2" />
          <span class="texto-boton-accion">
            {{ enviandoUbicaciones ? 'Enviando…' : 'Enviar a Ubicaciones' }}
          </span>
        </button>
        <button
          type="button"
          class="boton-accion-general"
          :disabled="!baseDatosCargada || ocupado"
          title="Enviar todos a Stock"
          @click="enviarTodosAStock"
        >
          <IconPackages class="icono-accion-listado" :size="20" :stroke="2" />
          <span class="texto-boton-accion">
            {{ enviandoStock ? 'Enviando…' : 'Enviar a Stock' }}
          </span>
        </button>
        <button
          type="button"
          class="boton-accion-general boton-eliminar-todos"
          :disabled="ocupado"
          @click="solicitarEliminarTodos"
        >
          <IconTrash :size="20" />
          <span class="texto-boton-accion">Eliminar todos</span>
        </button>
      </div>

      <TablaListados
        :articulos="articulosOrdenados"
        :mostrar-numeracion="listadoActivo.configuracion.mostrarNumeracion"
        :mostrar-stock="listadoActivo.configuracion.mostrarStock"
        :mostrar-ubicacion="listadoActivo.configuracion.mostrarUbicacion"
        :codigos-duplicados="codigosDuplicados"
        @editar-stock="guardarCambioStock"
        @editar-ubicacion="guardarCambioUbicacion"
        @eliminar="eliminarArticulo"
        @enviar-etiqueta="enviarArticuloAEtiquetas"
      />
      <section
        v-if="articulosOrdenados.length"
        class="exportacion-listado"
        aria-label="Formato y envío del listado"
      >
        <div class="selector-formato-listado">
          <span class="titulo-formato-listado">Enviar listado como</span>
          <q-btn-toggle
            v-model="formatoExportacion"
            no-caps
            unelevated
            spread
            toggle-color="primary"
            :disable="exportando"
            :options="OPCIONES_FORMATO_EXPORTACION"
            aria-label="Formato del archivo"
          />
          <span class="ayuda-formato-listado">
            {{
              formatoExportacion === 'excel'
                ? 'Excel está seleccionado por defecto.'
                : 'PDF A4 horizontal, listo para imprimir.'
            }}
          </span>
        </div>
      </section>
    </template>

    <ModalEliminar
      v-if="listadoAEliminar"
      :texto="`el listado ${listadoAEliminar.nombre}`"
      @confirmar="confirmarEliminarListado"
      @cerrar="cerrarModalEliminarListado"
      @modal-abierto="modalActivo = true"
      @modal-cerrado="modalActivo = false"
    />
    <ModalEliminar
      v-if="eliminarTodosSolicitado"
      texto="todos los artículos del listado"
      @confirmar="confirmarEliminarTodos"
      @cerrar="cerrarModalEliminarTodos"
      @modal-abierto="modalActivo = true"
      @modal-cerrado="modalActivo = false"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { Notify } from 'quasar'
import {
  IconDownload,
  IconMapRoute,
  IconPackages,
  IconTag,
  IconTrash,
} from '@tabler/icons-vue'
import GestorListados from '../components/Logica/Listados/GestorListados.vue'
import FormularioListado from '../components/Logica/Listados/FormularioListado.vue'
import TablaListados from '../components/Logica/Listados/TablaListados.vue'
import PanelResultadosCapitanaBita from '../components/Logica/CapitanaBita/PanelResultadosCapitanaBita.vue'
import PanelResultadoImportacionExcel from '../components/Logica/Listados/PanelResultadoImportacionExcel.vue'
import SelectorOrdenamiento from '../components/Logica/Compartidos/SelectorOrdenamiento.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import {
  crearListado,
  duplicarListado,
  eliminarListado,
  guardarListado,
  guardarListadoActivo,
  obtenerListado,
  obtenerListadoActivo,
  obtenerListados,
  renombrarListado,
} from '../components/BaseDeDatos/UsoAlmacenamientoListados.js'
import {
  inicializarBaseDatos,
  obtenerArticulosCargados,
  obtenerEstadoCarga,
} from '../components/BaseDeDatos/LectorExcel.js'
import {
  guardarMemoriaCapitanaBita,
  obtenerMemoriasParaContexto,
} from '../components/BaseDeDatos/UsoAlmacenamientoMemoriasCapitanaBita.js'
import { resolverSolicitudesCapitanaBita } from '../components/Logica/CapitanaBita/ResolverSolicitudesCapitanaBita.js'
import { resolverSolicitudesImagenCapitanaBita } from '../components/Logica/CapitanaBita/ResolverSolicitudesImagenCapitanaBita.js'
import { normalizarCodigoBusqueda } from '../components/Logica/Compartidos/CodigoEscaner.js'
import {
  cargarDatosLocalesArticulos,
  resolverDatosArticulo,
} from '../components/Logica/Compartidos/ServicioDatosLocalesArticulo.js'
import {
  normalizarOrden,
  ordenarColeccion,
} from '../components/Logica/Compartidos/OrdenarColeccion.js'
import {
  enviarArticuloAEtiquetas as enviarArticuloAEtiquetasServicio,
  enviarTodosAEtiquetas as enviarTodosAEtiquetasServicio,
  enviarTodosAStock as enviarTodosAStockServicio,
  enviarTodosAUbicaciones as enviarTodosAUbicacionesServicio,
} from '../components/Logica/Listados/ServicioIntegracionListados.js'
import { generarYGuardarExcelListado } from '../components/Logica/Listados/ExportarListadosExcel.js'
import { generarYGuardarPDFListado } from '../components/Logica/Listados/ExportarListadosPDF.js'
import { compartirArchivo } from '../components/Logica/Pedidos/CompartirExcel.js'
import {
  procesarArchivoExcelListado,
  procesarExcelCompartidoListado,
} from '../components/Logica/Listados/ServicioImportacionExcelListado.js'
import {
  esArchivoExcel,
  leerArchivoCompartidoComoBase64,
  limpiarArchivoCompartidoPendiente,
  obtenerArchivoCompartidoPendiente,
} from '../components/Logica/Compartidos/ServicioArchivoCompartido.js'

const OPCIONES_FORMATO_EXPORTACION = [
  { label: 'Excel', value: 'excel' },
  { label: 'PDF A4', value: 'pdf' },
]
// Cambiar a true cuando se decida volver a habilitar Capitana Bita en Listados.
const MOSTRAR_CAPITANA_BITA = false

const emit = defineEmits(['configurar-barra'])
const route = useRoute()
const router = useRouter()
const listados = ref([])
const listadoActivo = ref(null)
const baseDatosCargada = ref(false)
const modalActivo = ref(false)
const listadoAEliminar = ref(null)
const eliminarTodosSolicitado = ref(false)
const exportando = ref(false)
const formatoExportacion = ref('excel')
const enviandoStock = ref(false)
const enviandoUbicaciones = ref(false)
const administrando = ref(false)
const cargandoDatosLocales = ref(true)
const datosLocalesArticulos = ref({
  stockConfirmadoPorCodigo: new Map(),
  ubicacionPorCodigo: new Map(),
})
const articuloPendienteRepetido = ref(null)
const formularioListadoRef = ref(null)
const resultadoPendienteCapitanaBita = ref(null)
const memoriasPropuestasCapitanaBita = ref([])
const colaInsercionCapitanaBita = ref([])
const procesandoColaCapitanaBita = ref(false)
const importandoExcel = ref(false)
const resultadoImportacionExcel = ref(null)
const esperandoMaestroParaImportar = ref(false)
const identificadorExcelCompartidoEnProceso = ref('')
const paginaInicializada = ref(false)
const identificadorAvisoMaestro = ref('')
const ocupado = computed(
  () =>
    cargandoDatosLocales.value ||
    administrando.value ||
    exportando.value ||
    enviandoStock.value ||
    enviandoUbicaciones.value ||
    procesandoColaCapitanaBita.value ||
    importandoExcel.value,
)
const articulosOrdenados = computed(() =>
  ordenarColeccion(listadoActivo.value?.articulos || [], listadoActivo.value?.orden, {
    obtenerFecha: (articulo) => articulo.fechaIngreso,
    obtenerTexto: (articulo) => articulo.descripcion,
    obtenerUbicacion: (articulo) => articulo.ubicacionListado,
    obtenerCantidad: (articulo) => articulo.stockListado,
    obtenerClave: (articulo) => articulo.codigo,
  }),
)
const lineasArticuloPendiente = computed(() => {
  const codigoPendiente = normalizarCodigoBusqueda(articuloPendienteRepetido.value?.codigo)
  if (!codigoPendiente) return []
  return articulosOrdenados.value.reduce((lineas, articulo, indice) => {
    if (normalizarCodigoBusqueda(articulo.codigo) === codigoPendiente) lineas.push(indice + 1)
    return lineas
  }, [])
})
const codigosDuplicados = computed(() => {
  const conteoPorCodigo = new Map()
  listadoActivo.value?.articulos.forEach((articulo) => {
    const codigo = normalizarCodigoBusqueda(articulo.codigo)
    if (codigo) conteoPorCodigo.set(codigo, (conteoPorCodigo.get(codigo) || 0) + 1)
  })
  return new Set(
    [...conteoPorCodigo.entries()].filter(([, cantidad]) => cantidad > 1).map(([codigo]) => codigo),
  )
})
const criteriosOrdenListado = computed(() => {
  const criterios = ['fechaIngreso', 'alfabetico']
  if (listadoActivo.value?.configuracion.mostrarStock) criterios.push('cantidad')
  if (listadoActivo.value?.configuracion.mostrarUbicacion) criterios.push('ubicacion')
  return criterios
})
const esNavegadorWeb = computed(() => Capacitor.getPlatform() === 'web')
const nombreFormatoExportacion = computed(() =>
  formatoExportacion.value === 'pdf' ? 'PDF A4' : 'Excel',
)
const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: !esNavegadorWeb.value && articulosOrdenados.value.length > 0,
  puedeEnviar: articulosOrdenados.value.length > 0 && !exportando.value,
  tituloEnviar: `Compartir listado como ${nombreFormatoExportacion.value}`,
  botonesPersonalizados: esNavegadorWeb.value
    ? [
        {
          accion: 'descargar-listado',
          icono: IconDownload,
          titulo: `Descargar ${nombreFormatoExportacion.value} del listado`,
          desactivado: articulosOrdenados.value.length === 0 || exportando.value,
          claseCSS: '',
        },
      ]
    : [],
  modalActivo: modalActivo.value,
}))
const metodosParaBarra = {
  onAgregar: () => {},
  onEnviar: () => exportarListado(),
  onAccionPersonalizada: (accion) => {
    if (accion === 'descargar-listado') exportarListado()
  },
  onAtrasNativo: () => cerrarPasoAtrasNativo(),
}

function notificar(tipo, mensaje, timeout = 2400) {
  Notify.create({ type: tipo, message: mensaje, position: 'top', timeout })
}

function obtenerValorConsulta(valor) {
  return Array.isArray(valor) ? String(valor[0] || '') : String(valor || '')
}

function reemplazarListadoLocal(guardado) {
  listadoActivo.value = guardado
  const restantes = listados.value.filter((listado) => listado.id !== guardado.id)
  listados.value = [guardado, ...restantes].sort((a, b) => b.actualizadoEn - a.actualizadoEn)
}

async function cargarListados() {
  listados.value = await obtenerListados()
  let activo = await obtenerListadoActivo()
  if (!activo) activo = listados.value[0] || (await crearListado())
  reemplazarListadoLocal(activo)
  await guardarListadoActivo(activo.id)
}

async function cargarDatosLocales() {
  cargandoDatosLocales.value = true
  try {
    datosLocalesArticulos.value = await cargarDatosLocalesArticulos()
  } finally {
    cargandoDatosLocales.value = false
  }
}

async function ejecutarAdministracion(operacion) {
  if (administrando.value) return
  administrando.value = true
  try {
    await operacion()
  } catch (error) {
    notificar('negative', error.message || 'No se pudo actualizar el listado')
  } finally {
    administrando.value = false
  }
}

function crearNuevoListado() {
  formularioListadoRef.value?.cerrarInteraccion?.()
  articuloPendienteRepetido.value = null
  limpiarEstadoCapitanaBita()
  limpiarEstadoImportacionExcel()
  ejecutarAdministracion(async () => {
    const creado = await crearListado()
    reemplazarListadoLocal(creado)
    notificar('positive', 'Listado creado')
    await formularioListadoRef.value?.enfocarBusqueda?.()
  })
}

function abrirListado(id) {
  formularioListadoRef.value?.cerrarInteraccion?.()
  articuloPendienteRepetido.value = null
  limpiarEstadoCapitanaBita()
  limpiarEstadoImportacionExcel()
  ejecutarAdministracion(async () => {
    const listado = await obtenerListado(id)
    if (!listado) throw new Error('No se encontró el listado')
    await guardarListadoActivo(id)
    reemplazarListadoLocal(listado)
  })
}

function renombrarListadoActivo({ id, nombrePersonalizado }) {
  ejecutarAdministracion(async () => {
    reemplazarListadoLocal(await renombrarListado(id, nombrePersonalizado))
  })
}

function duplicarListadoActivo(id) {
  formularioListadoRef.value?.cerrarInteraccion?.()
  articuloPendienteRepetido.value = null
  limpiarEstadoCapitanaBita()
  limpiarEstadoImportacionExcel()
  ejecutarAdministracion(async () => {
    reemplazarListadoLocal(await duplicarListado(id))
    notificar('positive', 'Listado duplicado')
  })
}

function solicitarEliminarListado(listado) {
  listadoAEliminar.value = listado
}

function cerrarModalEliminarListado() {
  listadoAEliminar.value = null
  modalActivo.value = false
}

function confirmarEliminarListado() {
  const id = listadoAEliminar.value?.id
  if (!id) return
  formularioListadoRef.value?.cerrarInteraccion?.()
  articuloPendienteRepetido.value = null
  limpiarEstadoCapitanaBita()
  limpiarEstadoImportacionExcel()
  cerrarModalEliminarListado()
  ejecutarAdministracion(async () => {
    const resultado = await eliminarListado(id)
    listados.value = await obtenerListados()
    listadoActivo.value = resultado.listadoActivo
    notificar('positive', 'Listado eliminado')
  })
}

async function persistirActivo() {
  if (!listadoActivo.value) return null
  const guardado = await guardarListado(listadoActivo.value)
  reemplazarListadoLocal(guardado)
  return guardado
}

async function limpiarConsultaExcelCompartido() {
  const consulta = { ...route.query }
  delete consulta.destinoExcel
  delete consulta.archivoCompartido
  await router.replace({ path: route.path, query: consulta })
}

async function finalizarExcelCompartidoPendiente(
  identificador,
  { conservarConsulta = false } = {},
) {
  if (!identificador) return { exito: false }
  const resultado = await limpiarArchivoCompartidoPendiente(identificador)
  if (!conservarConsulta) await limpiarConsultaExcelCompartido()
  return resultado
}

function limpiarEstadoImportacionExcel() {
  resultadoImportacionExcel.value = null
  if (!importandoExcel.value) identificadorExcelCompartidoEnProceso.value = ''
}

async function cerrarResultadoImportacionExcel() {
  const identificador = resultadoImportacionExcel.value?.identificadorCompartido || ''
  resultadoImportacionExcel.value = null
  if (
    identificador &&
    obtenerValorConsulta(route.query.archivoCompartido) === identificador &&
    route.query.destinoExcel === 'listado'
  ) {
    await limpiarConsultaExcelCompartido()
  }
}

async function aplicarResultadoImportacionExcel(
  resultadoAnalisis,
  { identificadorCompartido = '' } = {},
) {
  if (!listadoActivo.value) throw new Error('No hay un listado activo para importar.')
  const resoluciones = Array.isArray(resultadoAnalisis?.resoluciones)
    ? resultadoAnalisis.resoluciones
    : []
  const resolucionesUnicas = resoluciones.filter((fila) => fila.estado === 'unica')
  const articulosAnteriores = [...listadoActivo.value.articulos]
  const conteoPrevio = new Map()
  articulosAnteriores.forEach((articulo) => {
    const codigo = normalizarCodigoBusqueda(articulo.codigo)
    if (codigo) conteoPrevio.set(codigo, (conteoPrevio.get(codigo) || 0) + 1)
  })
  const conteoImportado = new Map()
  resolucionesUnicas.forEach((fila) => {
    const codigo = normalizarCodigoBusqueda(fila.articuloUnico?.codigo)
    if (!codigo) return
    const registro = conteoImportado.get(codigo) || {
      codigo,
      descripcion: String(fila.articuloUnico?.nombre || '').trim(),
      cantidadImportada: 0,
      cantidadPrevia: conteoPrevio.get(codigo) || 0,
    }
    registro.cantidadImportada += 1
    conteoImportado.set(codigo, registro)
  })

  const idsFilasImportadas = []
  try {
    for (let indice = resolucionesUnicas.length - 1; indice >= 0; indice -= 1) {
      const fila = crearFilaListado(resolucionesUnicas[indice].articuloUnico)
      if (!fila) continue
      listadoActivo.value.articulos.push(fila)
      idsFilasImportadas.unshift(fila.idFila)
    }
    if (idsFilasImportadas.length) await persistirActivo()
  } catch (error) {
    listadoActivo.value.articulos = articulosAnteriores
    throw error
  }

  return {
    nombreArchivo: resultadoAnalisis.nombreArchivo,
    totalHojas: resultadoAnalisis.totalHojas,
    totalFilasUtiles: resultadoAnalisis.totalFilasUtiles,
    cantidadAgregada: idsFilasImportadas.length,
    idsFilasImportadas,
    repetidos: [...conteoImportado.values()].filter(
      (registro) => registro.cantidadImportada > 1 || registro.cantidadPrevia > 0,
    ),
    ambiguas: resoluciones.filter((fila) => fila.estado === 'ambigua'),
    noEncontradas: resoluciones.filter((fila) => fila.estado === 'noEncontrada'),
    inconsistencias: resoluciones.filter((fila) => fila.estado === 'inconsistente'),
    identificadorCompartido,
  }
}

async function ejecutarImportacionExcel({ obtenerResultado, identificadorCompartido = '' }) {
  if (importandoExcel.value || !listadoActivo.value || typeof obtenerResultado !== 'function') return
  importandoExcel.value = true
  identificadorExcelCompartidoEnProceso.value = identificadorCompartido
  resultadoImportacionExcel.value = null
  try {
    const resultadoAnalisis = await obtenerResultado()
    const resultado = await aplicarResultadoImportacionExcel(resultadoAnalisis, {
      identificadorCompartido,
    })
    resultadoImportacionExcel.value = resultado
    if (identificadorCompartido) {
      const limpieza = await finalizarExcelCompartidoPendiente(identificadorCompartido, {
        conservarConsulta: true,
      })
      if (!limpieza?.exito) {
        notificar('warning', 'El listado se importó, pero no se pudo limpiar el archivo temporal.')
      }
    }
    const cantidad = resultado.cantidadAgregada
    notificar('positive', `Se agregaron ${cantidad} artículo${cantidad === 1 ? '' : 's'}.`)
  } catch (error) {
    resultadoImportacionExcel.value = null
    notificar('negative', error.message || 'No se pudo importar el Excel.')
    if (identificadorCompartido) {
      await finalizarExcelCompartidoPendiente(identificadorCompartido)
      notificar('warning', 'Volvé a compartir el archivo para intentarlo nuevamente.')
    }
  } finally {
    importandoExcel.value = false
    identificadorExcelCompartidoEnProceso.value = ''
    await formularioListadoRef.value?.enfocarBusqueda?.()
  }
}

async function importarExcelListado(archivo) {
  if (ocupado.value || !listadoActivo.value) return
  if (!baseDatosCargada.value || !obtenerArticulosCargados().length) {
    notificar('warning', 'Cargá el Excel maestro antes de importar un listado.')
    return
  }
  await ejecutarImportacionExcel({
    obtenerResultado: () =>
      procesarArchivoExcelListado({
        archivo,
        articulos: obtenerArticulosCargados(),
        contextoBusqueda: listadoActivo.value.contextoBusqueda,
      }),
  })
}

async function procesarExcelCompartidoPendiente() {
  if (!paginaInicializada.value || importandoExcel.value) return
  if (route.query.destinoExcel !== 'listado') return
  const identificador = obtenerValorConsulta(route.query.archivoCompartido)
  if (!identificador || identificadorExcelCompartidoEnProceso.value === identificador) return
  const pendiente = await obtenerArchivoCompartidoPendiente()
  if (
    !pendiente?.uri ||
    pendiente.identificador !== identificador ||
    !esArchivoExcel(pendiente.nombre, pendiente.tipo)
  ) {
    await limpiarConsultaExcelCompartido()
    return
  }
  if (!baseDatosCargada.value || !obtenerArticulosCargados().length) {
    esperandoMaestroParaImportar.value = true
    if (identificadorAvisoMaestro.value !== identificador) {
      identificadorAvisoMaestro.value = identificador
      notificar(
        'warning',
        'Cargá primero el Excel maestro; después importaremos el listado recibido.',
        4000,
      )
    }
    return
  }
  esperandoMaestroParaImportar.value = false
  await ejecutarImportacionExcel({
    identificadorCompartido: identificador,
    obtenerResultado: async () => {
      const base64 = await leerArchivoCompartidoComoBase64(pendiente.uri)
      return procesarExcelCompartidoListado({
        base64,
        nombreArchivo: pendiente.nombre,
        tipoArchivo: pendiente.tipo,
        articulos: obtenerArticulosCargados(),
        contextoBusqueda: listadoActivo.value.contextoBusqueda,
      })
    },
  })
}

async function guardarContextoBusqueda(contextoBusqueda) {
  if (!listadoActivo.value) return
  listadoActivo.value.contextoBusqueda = contextoBusqueda
  try {
    await persistirActivo()
  } catch {
    notificar('negative', 'No se pudo guardar el contexto de búsqueda')
  }
}

async function agregarArticulo(articulo, { desdeCapitanaBita = false } = {}) {
  const codigo = normalizarCodigoBusqueda(articulo?.codigo)
  if (!codigo || !listadoActivo.value) return
  if (listadoActivo.value.articulos.some((item) => item.codigo === codigo)) {
    articuloPendienteRepetido.value = {
      ...articulo,
      codigo,
      nombre: String(articulo.nombre || articulo.descripcion || 'Artículo sin nombre').trim(),
      desdeCapitanaBita,
    }
    return false
  }
  await insertarArticulo(articulo)
  return true
}

async function insertarArticulo(articulo) {
  const fila = crearFilaListado(articulo)
  if (!fila || !listadoActivo.value) return
  listadoActivo.value.articulos.push(fila)
  try {
    await persistirActivo()
  } catch (error) {
    listadoActivo.value.articulos = listadoActivo.value.articulos.filter(
      (item) => item.idFila !== fila.idFila,
    )
    throw error
  }
}

function crearFilaListado(articulo, fechaMinima = 0) {
  const codigo = normalizarCodigoBusqueda(articulo?.codigo)
  if (!codigo || !listadoActivo.value) return null
  const fechaMayor = listadoActivo.value.articulos.reduce(
    (mayor, item) => Math.max(mayor, Number(item.fechaIngreso || 0)),
    0,
  )
  const ubicacionOriginal = String(articulo.ubicacionAntigua || '')
    .trim()
    .toUpperCase()
  const { stockListado, ubicacionListado } = resolverDatosArticulo(
    articulo,
    datosLocalesArticulos.value,
  )
  return {
    idFila: crypto.randomUUID(),
    codigo,
    descripcion: String(articulo.nombre || '').trim(),
    stockOriginal: articulo.stock ?? '',
    stockListado,
    ubicacionOriginal,
    ubicacionListado,
    fechaIngreso: Math.max(Date.now(), fechaMayor + 1, fechaMinima),
  }
}

async function confirmarArticuloRepetido() {
  const articulo = articuloPendienteRepetido.value
  if (!articulo) return
  articuloPendienteRepetido.value = null
  try {
    await insertarArticulo(articulo)
    await formularioListadoRef.value?.enfocarBusqueda?.()
    void procesarColaCapitanaBita()
  } catch (error) {
    articuloPendienteRepetido.value = articulo
    notificar('negative', error.message || 'No se pudo guardar el artículo repetido.')
  }
}

async function cancelarArticuloRepetido() {
  const desdeCapitanaBita = articuloPendienteRepetido.value?.desdeCapitanaBita
  articuloPendienteRepetido.value = null
  await nextTick()
  if (!desdeCapitanaBita) {
    await formularioListadoRef.value?.limpiarBusqueda?.({ descartarTextoCopiado: true })
  }
  void procesarColaCapitanaBita()
}

function limpiarEstadoCapitanaBita() {
  resultadoPendienteCapitanaBita.value = null
  memoriasPropuestasCapitanaBita.value = []
  colaInsercionCapitanaBita.value = []
}

function cerrarResultadosCapitanaBita() {
  resultadoPendienteCapitanaBita.value = null
  memoriasPropuestasCapitanaBita.value = []
}

async function procesarColaCapitanaBita() {
  if (procesandoColaCapitanaBita.value || articuloPendienteRepetido.value) {
    console.info('[CapitanaBita] Cola de inserción en espera', {
      procesando: procesandoColaCapitanaBita.value,
      articuloRepetidoPendiente: Boolean(articuloPendienteRepetido.value),
      pendientes: colaInsercionCapitanaBita.value.length,
    })
    return
  }
  console.info('[CapitanaBita] Procesando cola de inserción', {
    pendientes: colaInsercionCapitanaBita.value.length,
  })
  procesandoColaCapitanaBita.value = true
  try {
    while (colaInsercionCapitanaBita.value.length && !articuloPendienteRepetido.value) {
      const bloque = []
      const filasAgregadas = []
      while (colaInsercionCapitanaBita.value.length && !articuloPendienteRepetido.value) {
        const pendiente = colaInsercionCapitanaBita.value.shift()
        const codigo = normalizarCodigoBusqueda(pendiente.articulo?.codigo)
        const repetido = listadoActivo.value?.articulos.some(
          (item) => normalizarCodigoBusqueda(item.codigo) === codigo,
        )
        if (repetido) {
          articuloPendienteRepetido.value = {
            ...pendiente.articulo,
            codigo,
            nombre: String(pendiente.articulo?.nombre || 'Artículo sin nombre').trim(),
            desdeCapitanaBita: true,
          }
          break
        }
        const fila = crearFilaListado(pendiente.articulo)
        if (!fila) continue
        listadoActivo.value.articulos.push(fila)
        bloque.push(pendiente)
        filasAgregadas.push(fila)
      }
      if (filasAgregadas.length) {
        try {
          await persistirActivo()
        } catch (error) {
          const idsFallidos = new Set(filasAgregadas.map((fila) => fila.idFila))
          listadoActivo.value.articulos = listadoActivo.value.articulos.filter(
            (fila) => !idsFallidos.has(fila.idFila),
          )
          colaInsercionCapitanaBita.value.unshift(...bloque)
          notificar(
            'negative',
            error.message || `No se guardaron ${bloque.length} artículos; permanecen pendientes.`,
          )
          break
        }
      }
    }
  } finally {
    procesandoColaCapitanaBita.value = false
    console.info('[CapitanaBita] Cola de inserción finalizada', {
      pendientes: colaInsercionCapitanaBita.value.length,
    })
  }
}

function encolarArticuloCapitanaBita(articulo, cantidad = 1) {
  for (let indice = 0; indice < cantidad; indice += 1) {
    colaInsercionCapitanaBita.value.push({ articulo })
  }
  console.info('[CapitanaBita] Artículo encolado', {
    codigo: articulo?.codigo || '',
    cantidad,
    pendientes: colaInsercionCapitanaBita.value.length,
  })
  void procesarColaCapitanaBita()
}

function encolarResolucionesCapitanaBita(resoluciones) {
  resoluciones.forEach((resolucion) => {
    for (let indice = 0; indice < resolucion.cantidad; indice += 1) {
      colaInsercionCapitanaBita.value.push({ articulo: resolucion.articuloUnico })
    }
  })
  return procesarColaCapitanaBita()
}

async function procesarResultadoCapitanaBita(resultadoGemini) {
  console.info('[CapitanaBita] Resultado recibido por la página', {
    tieneListadoActivo: Boolean(listadoActivo.value),
    tieneResultado: Boolean(resultadoGemini),
    destinoResultado: resultadoGemini?.identificadorDestino || '',
    destinoActivo: listadoActivo.value?.id || '',
  })
  if (!listadoActivo.value || !resultadoGemini) {
    console.warn('[CapitanaBita] Resultado descartado: falta listado activo o resultado')
    return
  }
  if (resultadoGemini.identificadorDestino !== listadoActivo.value.id) {
    console.warn('[CapitanaBita] Resultado descartado: cambió el listado activo')
    return
  }
  cerrarResultadosCapitanaBita()
  const contextoBusqueda = resultadoGemini.contextoBusquedaUsado || ''
  const esImagen = resultadoGemini.tipoEntrada === 'imagen'
  const tieneContenido = esImagen
    ? resultadoGemini.esListadoDeArticulos && resultadoGemini.filas.length > 0
    : resultadoGemini.esPedidoDeRepuestos && resultadoGemini.solicitudes.length > 0
  if (!tieneContenido) {
    cerrarResultadosCapitanaBita()
    notificar('info', resultadoGemini.respuesta || 'No encontré una solicitud de repuestos.')
    return
  }
  const articulos = obtenerArticulosCargados()
  const memorias = esImagen ? [] : await obtenerMemoriasParaContexto(contextoBusqueda)
  const resoluciones = esImagen
    ? resolverSolicitudesImagenCapitanaBita({
        filas: resultadoGemini.filas,
        articulos,
        contextoBusqueda,
      })
    : resolverSolicitudesCapitanaBita({
        solicitudes: resultadoGemini.solicitudes,
        articulos,
        contextoBusqueda,
        memorias,
      })
  const unicas = resoluciones.filter((resolucion) => resolucion.estado === 'unica')
  if (!esImagen) {
    unicas.forEach((resolucion) => {
      if (resolucion.puedeOfrecerMemoria) {
        memoriasPropuestasCapitanaBita.value.push({
          idSolicitud: resolucion.idSolicitud,
          contexto: contextoBusqueda,
          textoOriginal: resolucion.textoOriginal,
          articulo: resolucion.articuloUnico,
        })
      }
    })
  }
  const ambiguedades = resoluciones.filter((resolucion) => resolucion.estado === 'ambigua')
  const noEncontrados = resoluciones.filter((resolucion) => resolucion.estado === 'noEncontrada')
  const inconsistencias = resoluciones.filter((resolucion) => resolucion.estado === 'inconsistente')
  const advertencias = esImagen ? resultadoGemini.advertencias : []
  const cantidadPreparada = unicas.reduce((total, resolucion) => total + resolucion.cantidad, 0)
  const resumen = esImagen
    ? `${cantidadPreparada} artículos preparados, ${ambiguedades.length} necesitan confirmación y ${noEncontrados.length + inconsistencias.length} no pudieron identificarse.`
    : ''
  resultadoPendienteCapitanaBita.value =
    ambiguedades.length ||
    noEncontrados.length ||
    inconsistencias.length ||
    advertencias.length ||
    memoriasPropuestasCapitanaBita.value.length
      ? {
          transcripcion: resultadoGemini.transcripcion,
          ambiguedades,
          noEncontrados,
          inconsistencias,
          advertencias,
          resumen,
          tipoEntrada: resultadoGemini.tipoEntrada,
          contextoBusqueda,
        }
      : null
  await encolarResolucionesCapitanaBita(unicas)
  if (!resultadoPendienteCapitanaBita.value) {
    if (!articuloPendienteRepetido.value && !colaInsercionCapitanaBita.value.length) {
      notificar(
        'positive',
        esImagen
          ? `${cantidadPreparada} artículos agregados desde la imagen.`
          : resultadoGemini.respuesta || 'Pedido agregado al listado.',
      )
    }
  }
}

function seleccionarCandidatoCapitanaBita({ idSolicitud, articulo }) {
  const pendiente = resultadoPendienteCapitanaBita.value
  if (!pendiente) return
  const grupo = pendiente.ambiguedades.find((item) => item.idSolicitud === idSolicitud)
  if (!grupo) return
  encolarArticuloCapitanaBita(articulo, grupo.cantidad)
  pendiente.ambiguedades = pendiente.ambiguedades.filter((item) => item.idSolicitud !== idSolicitud)
  if (grupo.puedeOfrecerMemoria) {
    memoriasPropuestasCapitanaBita.value.push({
      idSolicitud,
      contexto: pendiente.contextoBusqueda,
      textoOriginal: grupo.textoOriginal,
      articulo,
    })
  }
  if (
    !pendiente.ambiguedades.length &&
    !pendiente.noEncontrados.length &&
    !pendiente.inconsistencias.length &&
    !pendiente.advertencias.length &&
    !memoriasPropuestasCapitanaBita.value.length
  ) {
    cerrarResultadosCapitanaBita()
  }
}

function omitirSolicitudCapitanaBita(idSolicitud) {
  const pendiente = resultadoPendienteCapitanaBita.value
  if (!pendiente) return
  pendiente.ambiguedades = pendiente.ambiguedades.filter((item) => item.idSolicitud !== idSolicitud)
  pendiente.noEncontrados = pendiente.noEncontrados.filter(
    (item) => item.idSolicitud !== idSolicitud,
  )
  pendiente.inconsistencias = pendiente.inconsistencias.filter(
    (item) => item.idSolicitud !== idSolicitud,
  )
  if (
    !pendiente.ambiguedades.length &&
    !pendiente.noEncontrados.length &&
    !pendiente.inconsistencias.length &&
    !pendiente.advertencias.length &&
    !memoriasPropuestasCapitanaBita.value.length
  ) {
    cerrarResultadosCapitanaBita()
  }
}

async function guardarMemoriaDesdeSeleccion(propuesta) {
  try {
    await guardarMemoriaCapitanaBita({
      contexto: propuesta.contexto,
      expresionUsuario: propuesta.textoOriginal,
      busquedaConfirmada: propuesta.articulo.nombre,
      codigoArticuloReferencia: propuesta.articulo.codigo,
      descripcionArticuloReferencia: propuesta.articulo.nombre,
    })
    memoriasPropuestasCapitanaBita.value = memoriasPropuestasCapitanaBita.value.filter(
      (item) => item.idSolicitud !== propuesta.idSolicitud,
    )
    notificar('positive', 'Memoria guardada. Podés editarla o borrarla desde Configuración.', 4000)
    const pendiente = resultadoPendienteCapitanaBita.value
    if (
      pendiente &&
      !pendiente.ambiguedades.length &&
      !pendiente.noEncontrados.length &&
      !pendiente.inconsistencias.length &&
      !pendiente.advertencias.length
    ) {
      cerrarResultadosCapitanaBita()
    }
  } catch (error) {
    notificar('negative', error.message || 'No se pudo guardar la memoria.')
  }
}

async function guardarCambioStock({ idFila, stockListado }) {
  const articulo = listadoActivo.value?.articulos.find((item) => item.idFila === idFila)
  if (!articulo) return
  articulo.stockListado = stockListado
  await persistirActivo()
}

async function guardarCambioUbicacion({ idFila, ubicacionListado }) {
  const articulo = listadoActivo.value?.articulos.find((item) => item.idFila === idFila)
  if (!articulo) return
  articulo.ubicacionListado = ubicacionListado
  await persistirActivo()
}

async function eliminarArticulo(articulo) {
  if (!listadoActivo.value) return
  listadoActivo.value.articulos = listadoActivo.value.articulos.filter(
    (item) => item.idFila !== articulo.idFila,
  )
  await persistirActivo()
}

function solicitarEliminarTodos() {
  eliminarTodosSolicitado.value = true
}

function cerrarModalEliminarTodos() {
  eliminarTodosSolicitado.value = false
  modalActivo.value = false
}

async function confirmarEliminarTodos() {
  cerrarModalEliminarTodos()
  if (!listadoActivo.value) return
  listadoActivo.value.articulos = []
  await persistirActivo()
  notificar('positive', 'Se eliminaron todos los artículos')
}

async function actualizarConfiguracion(campo, valor) {
  if (!listadoActivo.value) return
  const columnaVisible = Boolean(valor)
  listadoActivo.value.configuracion[campo] = columnaVisible
  const criterioOculto =
    (!columnaVisible &&
      campo === 'mostrarStock' &&
      listadoActivo.value.orden.criterio === 'cantidad') ||
    (!columnaVisible &&
      campo === 'mostrarUbicacion' &&
      listadoActivo.value.orden.criterio === 'ubicacion')
  if (criterioOculto) {
    listadoActivo.value.orden = { criterio: 'fechaIngreso', direccion: 'descendente' }
  }
  await persistirActivo()
}

async function actualizarOrden(nuevoOrden) {
  if (!listadoActivo.value) return
  listadoActivo.value.orden = normalizarOrden(nuevoOrden)
  await persistirActivo()
}

async function enviarTodosAStock() {
  if (enviandoStock.value || !listadoActivo.value) return
  enviandoStock.value = true
  try {
    const resultado = await enviarTodosAStockServicio({
      ...listadoActivo.value,
      articulos: articulosOrdenados.value,
    })
    if (resultado.enviados.length)
      notificar('positive', `${resultado.enviados.length} artículos enviados a Stock`)
    if (resultado.omitidosConfirmados.length) {
      notificar(
        'warning',
        `${resultado.omitidosConfirmados.length} artículos omitidos por estar confirmados`,
      )
    }
    if (resultado.invalidos.length)
      notificar(
        'warning',
        `${resultado.invalidos.length} valores de stock inválidos no se enviaron`,
      )
  } catch (error) {
    notificar('negative', error.message || 'No se pudieron enviar los artículos a Stock')
  } finally {
    enviandoStock.value = false
  }
}

async function enviarTodosAUbicaciones() {
  if (enviandoUbicaciones.value || !listadoActivo.value) return
  enviandoUbicaciones.value = true
  try {
    const resultado = await enviarTodosAUbicacionesServicio({
      ...listadoActivo.value,
      articulos: articulosOrdenados.value,
    })
    await cargarDatosLocales()
    if (resultado.enviados.length)
      notificar('positive', `${resultado.enviados.length} artículos enviados a Ubicaciones`)
    if (resultado.invalidos.length)
      notificar('warning', `${resultado.invalidos.length} ubicaciones inválidas no se enviaron`)
  } catch (error) {
    notificar('negative', error.message || 'No se pudieron enviar los artículos a Ubicaciones')
  } finally {
    enviandoUbicaciones.value = false
  }
}

async function enviarArticuloAEtiquetas(articulo) {
  if (!baseDatosCargada.value) {
    notificar('warning', 'Cargá el Excel maestro antes de enviar a Etiquetas')
    return
  }
  const resultado = await enviarArticuloAEtiquetasServicio({
    ...articulo,
    ubicacion: articulo.ubicacionListado,
  })
  if (resultado.cantidad) notificar('positive', 'Artículo enviado a Etiquetas')
  else notificar('warning', 'El artículo ya no existe en la base cargada')
}

async function enviarTodosAEtiquetas() {
  if (!baseDatosCargada.value) {
    notificar('warning', 'Cargá el Excel maestro antes de enviar a Etiquetas')
    return
  }
  const resultado = await enviarTodosAEtiquetasServicio(articulosOrdenados.value)
  if (resultado.cantidad)
    notificar('positive', `${resultado.cantidad} artículos enviados a Etiquetas`)
  if (resultado.omitidos)
    notificar('warning', `${resultado.omitidos} artículos inexistentes fueron omitidos`)
}

async function exportarListado() {
  if (exportando.value || !listadoActivo.value) return
  exportando.value = true
  try {
    const generarArchivo =
      formatoExportacion.value === 'pdf' ? generarYGuardarPDFListado : generarYGuardarExcelListado
    const resultado = await generarArchivo(listadoActivo.value, articulosOrdenados.value)
    if (!esNavegadorWeb.value) {
      await compartirArchivo(resultado.uri, resultado.nombreArchivo, {
        titulo: `Listado de artículos en ${nombreFormatoExportacion.value}`,
        texto: `Archivo ${resultado.nombreArchivo}`,
        tituloDialogo: 'Seleccioná la app para compartir',
      })
    } else {
      notificar('positive', `${nombreFormatoExportacion.value} descargado correctamente`)
    }
  } catch (error) {
    notificar(
      'negative',
      error.message || `No se pudo generar el ${nombreFormatoExportacion.value}`,
    )
  } finally {
    exportando.value = false
  }
}

async function manejarBaseCargada(datos) {
  baseDatosCargada.value = true
  try {
    await cargarDatosLocales()
  } catch (error) {
    notificar('negative', error.message || 'No se pudieron cargar los datos guardados')
  }
  if (datos?.mensaje) notificar('positive', datos.mensaje)
  if (esperandoMaestroParaImportar.value) await procesarExcelCompartidoPendiente()
  if (!datos?.cargaAutomatica) await formularioListadoRef.value?.enfocarBusqueda?.()
}

function manejarErrorCarga(mensaje) {
  baseDatosCargada.value = obtenerEstadoCarga().cargado
  notificar('negative', mensaje || 'No se pudo cargar el Excel')
}

function cerrarPasoAtrasNativo() {
  if (formularioListadoRef.value?.cerrarInteraccion?.()) return true
  if (resultadoImportacionExcel.value) {
    void cerrarResultadoImportacionExcel()
    return true
  }
  if (resultadoPendienteCapitanaBita.value) {
    cerrarResultadosCapitanaBita()
    return true
  }
  if (listadoAEliminar.value) {
    cerrarModalEliminarListado()
    return true
  }
  if (eliminarTodosSolicitado.value) {
    cerrarModalEliminarTodos()
    return true
  }
  return false
}

function actualizarBarra() {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

watch(configuracionBarra, actualizarBarra, { deep: true })
watch(
  () => [route.query.destinoExcel, route.query.archivoCompartido],
  () => {
    if (paginaInicializada.value) void procesarExcelCompartidoPendiente()
  },
)

onMounted(async () => {
  const [, resultadoDatosLocales] = await Promise.allSettled([
    inicializarBaseDatos(),
    cargarDatosLocales(),
  ])
  if (resultadoDatosLocales.status === 'rejected') {
    notificar(
      'negative',
      resultadoDatosLocales.reason?.message || 'No se pudieron cargar los datos guardados',
    )
  }
  baseDatosCargada.value = obtenerEstadoCarga().cargado
  await cargarListados()
  await nextTick()
  formularioListadoRef.value?.establecerBaseCargada?.(baseDatosCargada.value)
  paginaInicializada.value = true
  await procesarExcelCompartidoPendiente()
  actualizarBarra()
})

onUnmounted(() => {
  paginaInicializada.value = false
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
.pagina-listados {
  padding-bottom: var(--espacio-inferior-contenido, 120px);
}
.tarjeta-administrar-listados {
  margin-bottom: 20px;
  overflow: hidden;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
}
.encabezado-administrar-listados {
  padding: 20px;
}
.encabezado-administrar-listados h3 {
  margin: 0;
  color: var(--color-texto-principal);
  font-size: 18px;
  font-weight: 600;
}
.contenido-administrar-listados {
  padding: 0 20px 20px;
}
.zona-agregar-listado {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}
.columnas-visibles-listado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  background-color: var(--color-superficie);
  color: var(--color-texto-principal);
}
.titulo-columnas-listado {
  font-weight: 600;
}
.interruptores-listado {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  color: var(--color-texto-principal);
}
.acciones-generales-tabla button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.icono-accion-listado {
  color: var(--color-primario);
}
.exportacion-listado {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  background: var(--color-superficie);
}
.selector-formato-listado {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.titulo-formato-listado {
  color: var(--color-texto-principal);
  font-weight: 700;
}
.ayuda-formato-listado {
  color: var(--color-texto-secundario);
  font-size: 0.82rem;
}
@media (max-width: 600px) {
  .encabezado-administrar-listados {
    padding: 16px;
  }
  .encabezado-administrar-listados h3 {
    font-size: 16px;
  }
  .contenido-administrar-listados {
    padding: 0 16px 16px;
  }
  .columnas-visibles-listado {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
