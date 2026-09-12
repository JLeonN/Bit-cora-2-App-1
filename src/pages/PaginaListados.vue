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
          @articulo-seleccionado="agregarArticulo"
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
        <PanelResultadosCapitanaBita
          v-if="resultadoPendienteCapitanaBita"
          :transcripcion="resultadoPendienteCapitanaBita.transcripcion"
          :ambiguedades="resultadoPendienteCapitanaBita.ambiguedades"
          :no-encontrados="resultadoPendienteCapitanaBita.noEncontrados"
          :memorias-propuestas="memoriasPropuestasCapitanaBita"
          @seleccionar-candidato="seleccionarCandidatoCapitanaBita"
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
import { Capacitor } from '@capacitor/core'
import { Notify } from 'quasar'
import {
  IconDownload,
  IconMapRoute,
  IconPackages,
  IconShare,
  IconTag,
  IconTrash,
} from '@tabler/icons-vue'
import GestorListados from '../components/Logica/Listados/GestorListados.vue'
import FormularioListado from '../components/Logica/Listados/FormularioListado.vue'
import TablaListados from '../components/Logica/Listados/TablaListados.vue'
import PanelResultadosCapitanaBita from '../components/Logica/CapitanaBita/PanelResultadosCapitanaBita.vue'
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

const OPCIONES_FORMATO_EXPORTACION = [
  { label: 'Excel', value: 'excel' },
  { label: 'PDF A4', value: 'pdf' },
]

const emit = defineEmits(['configurar-barra'])
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
const ocupado = computed(
  () =>
    cargandoDatosLocales.value ||
    administrando.value ||
    exportando.value ||
    enviandoStock.value ||
    enviandoUbicaciones.value ||
    procesandoColaCapitanaBita.value,
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
  iconoEnviar: IconShare,
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
  const codigo = normalizarCodigoBusqueda(articulo?.codigo)
  if (!codigo || !listadoActivo.value) return
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
  listadoActivo.value.articulos.push({
    idFila: crypto.randomUUID(),
    codigo,
    descripcion: String(articulo.nombre || '').trim(),
    stockOriginal: articulo.stock ?? '',
    stockListado,
    ubicacionOriginal,
    ubicacionListado,
    fechaIngreso: Math.max(Date.now(), fechaMayor + 1),
  })
  await persistirActivo()
}

async function confirmarArticuloRepetido() {
  const articulo = articuloPendienteRepetido.value
  if (!articulo) return
  articuloPendienteRepetido.value = null
  await insertarArticulo(articulo)
  await formularioListadoRef.value?.enfocarBusqueda?.()
  void procesarColaCapitanaBita()
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
      const pendiente = colaInsercionCapitanaBita.value.shift()
      console.info('[CapitanaBita] Agregando artículo al listado', {
        codigo: pendiente.articulo?.codigo || '',
      })
      await agregarArticulo(pendiente.articulo, { desdeCapitanaBita: true })
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
  if (!resultadoGemini.esPedidoDeRepuestos || resultadoGemini.solicitudes.length === 0) {
    cerrarResultadosCapitanaBita()
    notificar('info', resultadoGemini.respuesta || 'No encontré una solicitud de repuestos.')
    return
  }
  const memorias = await obtenerMemoriasParaContexto(contextoBusqueda)
  const articulos = obtenerArticulosCargados()
  console.info('[CapitanaBita] Preparando resolución del resultado', {
    solicitudes: resultadoGemini.solicitudes.length,
    articulos: articulos.length,
    memorias: memorias.length,
  })
  const resoluciones = resolverSolicitudesCapitanaBita({
    solicitudes: resultadoGemini.solicitudes,
    articulos,
    contextoBusqueda,
    memorias,
  })
  resoluciones
    .filter((resolucion) => resolucion.estado === 'unica')
    .forEach((resolucion) => {
      encolarArticuloCapitanaBita(resolucion.articuloUnico, resolucion.cantidad)
      if (resolucion.puedeOfrecerMemoria) {
        memoriasPropuestasCapitanaBita.value.push({
          idSolicitud: resolucion.idSolicitud,
          contexto: contextoBusqueda,
          textoOriginal: resolucion.textoOriginal,
          articulo: resolucion.articuloUnico,
        })
      }
    })
  const ambiguedades = resoluciones.filter((resolucion) => resolucion.estado === 'ambigua')
  const noEncontrados = resoluciones.filter((resolucion) => resolucion.estado === 'noEncontrada')
  console.info('[CapitanaBita] Resultado local resumido', {
    unicas: resoluciones.filter((resolucion) => resolucion.estado === 'unica').length,
    ambiguedades: ambiguedades.length,
    noEncontrados: noEncontrados.length,
  })
  resultadoPendienteCapitanaBita.value =
    ambiguedades.length || noEncontrados.length || memoriasPropuestasCapitanaBita.value.length
      ? {
          transcripcion: resultadoGemini.transcripcion,
          ambiguedades,
          noEncontrados,
          contextoBusqueda,
        }
      : null
  if (!resultadoPendienteCapitanaBita.value) {
    notificar('positive', resultadoGemini.respuesta || 'Pedido agregado al listado.')
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
    if (pendiente && !pendiente.ambiguedades.length && !pendiente.noEncontrados.length) {
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
  if (!datos?.cargaAutomatica) await formularioListadoRef.value?.enfocarBusqueda?.()
}

function manejarErrorCarga(mensaje) {
  baseDatosCargada.value = obtenerEstadoCarga().cargado
  notificar('negative', mensaje || 'No se pudo cargar el Excel')
}

function cerrarPasoAtrasNativo() {
  if (formularioListadoRef.value?.cerrarInteraccion?.()) return true
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
  actualizarBarra()
})

onUnmounted(() => {
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
