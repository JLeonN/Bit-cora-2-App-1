<template>
  <div class="contenedor-stock">
    <h2 class="titulo-tabla">Stock</h2>

    <SelectorExcel
      v-if="!baseDatosCargada"
      @base-datos-cargada="manejarBaseCargada"
      @error-carga="manejarErrorCarga"
    />

    <div v-if="hayConflictoFuente" class="alerta-fuente-stock">
      <strong>La sesión pertenece a otro Excel.</strong>
      <span>Volvé a cargar el archivo anterior o iniciá una sesión nueva.</span>
      <button type="button" @click="mostrarModalNuevaSesion = true">Iniciar sesión nueva</button>
    </div>

    <TarjetaSeccion
      titulo="Base e importación"
      :expandida-por-defecto="false"
      descripcion-resumen="Cargá el Excel o prepará artículos desde la tabla de Ubicaciones."
    >
      <SelectorExcel
        v-if="baseDatosCargada"
        @base-datos-cargada="manejarBaseCargada"
        @error-carga="manejarErrorCarga"
      />
      <button
        type="button"
        class="boton-importar"
        :disabled="!baseDatosCargada || hayConflictoFuente"
        @click="importarDesdeUbicaciones"
      >
        <IconDatabaseImport :size="20" />
        Importar artículos desde Ubicaciones
      </button>
    </TarjetaSeccion>

    <div class="bloque-buscador-stock">
      <div class="campo-buscador-stock">
        <input
          ref="inputBusquedaRef"
          v-model="busquedaArticulo"
          type="text"
          placeholder="Código o nombre del artículo"
          :disabled="hayConflictoFuente"
          @focus="manejarEnfoqueBusqueda"
          @blur="manejarDesenfoqueBusqueda"
          @input="manejarInputBusqueda"
          @keydown="manejarDobleEspacio"
          @keyup.enter="buscarArticuloExacto"
        />
        <button
          v-if="busquedaArticulo"
          type="button"
          class="boton-copiar-stock"
          title="Copiar texto"
          @click="copiarBusqueda"
        >
          <IconCopy :size="16" />
        </button>
        <CodigoMasNombre
          v-if="mostrarBuscador && busquedaArticulo.length >= 3"
          :busqueda="busquedaArticulo"
          @articulo-seleccionado="seleccionarArticulo"
          @estado-busqueda="manejarEstadoBuscador"
        />
      </div>
      <button type="button" class="boton-camara-stock" @click="abrirCamara">
        <IconCamera :size="22" />
      </button>
    </div>

    <transition name="mostrar-stock">
      <section
        v-if="articuloSeleccionado"
        class="tarjeta-articulo-stock"
        :class="{ 'tarjeta-stock-sl': articuloSeleccionado.ubicacionAntigua === 'SL' }"
      >
        <div class="encabezado-tarjeta-stock">
          <div>
            <p class="subtitulo-tarjeta-stock">
              {{ registroSeleccionado?.confirmado ? 'Artículo ya contado' : 'Artículo seleccionado' }}
            </p>
            <p v-if="registroSeleccionado" class="aviso-conteo-anterior">
              Este artículo ya fue contado<span v-if="registroSeleccionado.ubicacionActual">
                en {{ registroSeleccionado.ubicacionActual }}</span
              >. Puedes actualizar la cantidad.
            </p>
          </div>
          <button
            type="button"
            class="boton-cerrar-info-articulo"
            title="Cerrar artículo seleccionado"
            @click="cancelarSeleccion"
          >
            <span aria-hidden="true" class="texto-cerrar-info-articulo texto-repetidos">×</span>
          </button>
        </div>
        <p class="nombre-articulo-stock">{{ articuloSeleccionado.nombre }}</p>
        <p class="dato-articulo-stock">Código: <strong>{{ articuloSeleccionado.codigo }}</strong></p>
        <p class="dato-articulo-stock">Stock del Excel: <strong>{{ stockExcelSeleccionado }}</strong></p>
        <p v-if="stockExcelAjustadoSeleccionado" class="aviso-stock-ajustado">
          El stock del Excel fue ajustado a un entero válido.
        </p>
        <p v-if="ultimaUbicacionSeleccionada" class="dato-articulo-stock">
          Ubicación actual: <strong>{{ ultimaUbicacionSeleccionada }}</strong>
        </p>
        <p class="dato-articulo-stock">
          Ubicación del Excel:
          <strong :class="{ 'texto-sl-neon': articuloSeleccionado.ubicacionAntigua === 'SL' }">
            {{ articuloSeleccionado.ubicacionAntigua || 'Sin ubicación' }}
          </strong>
        </p>

        <label class="etiqueta-campo-stock">Stock contado</label>
        <div class="contador-stock">
          <button type="button" @click="restarConteo">−</button>
          <input
            ref="inputConteoRef"
            v-model="conteoActual"
            type="number"
            step="1"
            @focus="$event.target.select()"
            @input="validarConteo"
          />
          <button type="button" @click="sumarConteo">+</button>
        </div>

        <label class="etiqueta-campo-stock" for="ubicacionStock">Ubicación</label>
        <div class="campo-ubicacion-stock">
          <input
            id="ubicacionStock"
            v-model="ubicacionSeleccionada"
            type="text"
            class="input-ubicacion-stock sin-enfoque-automatico"
            placeholder="Ubicación opcional"
            @input="marcarUbicacionComoUsuario"
            @blur="formatearUbicacionSeleccionada"
          />
          <button
            v-if="ubicacionSeleccionada"
            type="button"
            class="boton-limpiar-ubicacion"
            title="Limpiar ubicación"
            @click="limpiarUbicacionSeleccionada"
          >
            <IconTrash :size="16" />
          </button>
        </div>

        <div class="acciones-tarjeta-stock">
          <button type="button" class="boton-confirmar-stock" @click="confirmarConteoSeleccionado">
            <span class="texto-accion-completo">Confirmar conteo</span>
            <span class="texto-accion-corto">Confirmar</span>
          </button>
          <button type="button" class="boton-cancelar-stock" @click="cancelarSeleccion">
            <span class="texto-accion-completo">Cancelar conteo</span>
            <span class="texto-accion-corto">Cancelar</span>
          </button>
        </div>
      </section>
    </transition>

    <TarjetaSeccion
      v-if="registrosVisuales.length > 0"
      titulo="Información"
      :expandida-por-defecto="false"
      descripcion-resumen="Revisá los artículos totales, confirmados, pendientes y las alertas detectadas."
    >
      <p class="texto-informe">Artículos totales: {{ informe.total }}</p>
      <p v-if="informe.confirmados > 0" class="texto-informe">
        Confirmados: {{ informe.confirmados }}
      </p>
      <p v-if="informe.pendientes > 0" class="texto-informe">
        Pendientes: {{ informe.pendientes }}
      </p>
      <p v-if="informe.sl > 0" class="texto-informe texto-sl-neon">
        Ubicación SL: {{ informe.sl }}
      </p>
      <p v-if="informe.inexistentes > 0" class="texto-informe texto-inexistente">
        Artículos inexistentes: {{ informe.inexistentes }}
      </p>
      <p v-if="informe.duplicados > 0" class="texto-informe texto-duplicado">
        Duplicado: {{ informe.duplicados }}
      </p>
    </TarjetaSeccion>

    <TablaStock
      ref="tablaStockRef"
      :registros="registrosVisuales"
      @confirmar="confirmarRegistroPendiente"
      @guardar-edicion="guardarEdicionRegistro"
      @eliminar="abrirEliminarRegistro"
      @eliminar-todos="mostrarModalEliminarTodos = true"
      @enviar-etiqueta="enviarRegistroAEtiquetas"
      @enviar-todos-etiquetas="enviarTodosAEtiquetas"
    />

    <ModalEliminar
      v-if="registroAEliminar"
      :texto="registroAEliminar.nombre"
      @confirmar="confirmarEliminarRegistro"
      @cerrar="registroAEliminar = null"
      @modal-abierto="modalActivo = true"
      @modal-cerrado="modalActivo = false"
    />
    <ModalEliminar
      v-if="mostrarModalEliminarTodos"
      texto="todos los registros de Stock"
      @confirmar="confirmarEliminarTodos"
      @cerrar="mostrarModalEliminarTodos = false"
      @modal-abierto="modalActivo = true"
      @modal-cerrado="modalActivo = false"
    />
    <ModalEliminar
      v-if="mostrarModalNuevaSesion"
      texto="la sesión actual de Stock e iniciar una nueva"
      @confirmar="confirmarNuevaSesion"
      @cerrar="mostrarModalNuevaSesion = false"
      @modal-abierto="modalActivo = true"
      @modal-cerrado="modalActivo = false"
    />

    <CamaraEscaneo
      v-if="mostrarCamara"
      :escaneo-unico="true"
      @cancelar="cerrarCamara"
      @finalizar="procesarEscaneo"
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
  IconCamera,
  IconCopy,
  IconDatabaseImport,
  IconDownload,
  IconTrash,
} from '@tabler/icons-vue'
import SelectorExcel from '../components/Logica/Ubicaciones/SelectorExcel.vue'
import CodigoMasNombre from '../components/Logica/Ubicaciones/CodigoMasNombre.vue'
import CamaraEscaneo from '../components/Logica/Ubicaciones/CamaraEscaneo.vue'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import TablaStock from '../components/Logica/Stock/TablaStock.vue'
import {
  crearIdentidadExcel,
  coincidenFuentesExcel,
  eliminarRegistroStock,
  eliminarSesionStock,
  guardarRegistroStock,
  guardarRegistrosStock,
  iniciarSesionStock,
  normalizarCantidadStock,
  obtenerSesionStock,
  ordenarRegistrosStock,
} from '../components/BaseDeDatos/UsoAlmacenamientoStock.js'
import {
  obtenerArticuloPorCodigo,
  obtenerArticulosCargados,
  obtenerEstadoCarga,
} from '../components/BaseDeDatos/LectorExcel.js'
import { obtenerUbicaciones } from '../components/BaseDeDatos/usoAlmacenamientoUbicaciones.js'
import {
  obtenerUltimaUbicacionRegistrada,
  registrarUbicacionArticulo,
} from '../components/Logica/Ubicaciones/ServicioRegistroUbicacion.js'
import { normalizarInputPreservandoCursor } from '../components/Logica/Compartidos/NormalizarInputCursor.js'
import { agregarEtiquetasDesdeArticulos } from '../components/Logica/Etiquetas/ServicioEnvioEtiquetas.js'
import { generarYGuardarExcelStock } from '../components/Logica/Stock/ExportarStockExcel.js'
import { compartirArchivo } from '../components/Logica/Pedidos/CompartirExcel.js'

const emit = defineEmits(['configurar-barra'])

const sesion = ref({ fuenteExcel: null, registros: [] })
const ubicaciones = ref([])
const baseDatosCargada = ref(false)
const informacionArchivo = ref(null)
const busquedaArticulo = ref('')
const mostrarBuscador = ref(false)
const inputEnfocado = ref(false)
const articuloSeleccionado = ref(null)
const conteoActual = ref(0)
const conteoValidoAnterior = ref(0)
const ubicacionSeleccionada = ref('')
const ubicacionOrigenSeleccionada = ref('excel')
const mostrarCamara = ref(false)
const modalActivo = ref(false)
const registroAEliminar = ref(null)
const mostrarModalEliminarTodos = ref(false)
const mostrarModalNuevaSesion = ref(false)
const inputBusquedaRef = ref(null)
const inputConteoRef = ref(null)
const tablaStockRef = ref(null)
const ultimoEspacioTiempo = ref(0)

let intervaloBase = null

const fuenteActual = computed(() => crearIdentidadExcel(informacionArchivo.value))
const hayRegistros = computed(() => sesion.value.registros?.length > 0)
const hayConflictoFuente = computed(
  () =>
    hayRegistros.value &&
    Boolean(sesion.value.fuenteExcel) &&
    Boolean(fuenteActual.value) &&
    !coincidenFuentesExcel(sesion.value.fuenteExcel, fuenteActual.value),
)
const registroSeleccionado = computed(() =>
  sesion.value.registros?.find(
    (registro) => registro.codigo === articuloSeleccionado.value?.codigo,
  ),
)
const stockExcelSeleccionado = computed(() => {
  const normalizado = normalizarCantidadStock(articuloSeleccionado.value?.stock, {
    permitirDecimal: true,
  })
  return normalizado.valor ?? 0
})
const stockExcelAjustadoSeleccionado = computed(
  () =>
    normalizarCantidadStock(articuloSeleccionado.value?.stock, {
      permitirDecimal: true,
    }).ajustado,
)
const ultimaUbicacionSeleccionada = computed(() =>
  articuloSeleccionado.value
    ? obtenerUltimaUbicacionRegistrada(
        articuloSeleccionado.value.codigo,
        ubicaciones.value,
        articuloSeleccionado.value,
        registroSeleccionado.value?.ubicacionActual,
      )
    : '',
)
const registrosVisuales = computed(() =>
  ordenarRegistrosStock(
    (sesion.value.registros || []).map((registro) => {
      const articulo = obtenerArticuloPorCodigo(registro.codigo)
      const stockExcelOriginal = normalizarCantidadStock(articulo?.stock, {
        permitirDecimal: true,
      })
      const recuperarNegativoAnterior =
        registro.stockExcelAjustado &&
        Number.isInteger(Number(articulo?.stock)) &&
        Number(articulo?.stock) < 0
      const ubicacionOriginalExcel =
        articulo?.ubicacionAntigua || registro.ubicacionOriginalExcel || ''
      const ubicacionRegistrada = obtenerUltimaUbicacionRegistrada(
        registro.codigo,
        ubicaciones.value,
        articulo,
        registro.ubicacionActual,
      )
      return {
        ...registro,
        stockExcel: recuperarNegativoAnterior ? stockExcelOriginal.valor : registro.stockExcel,
        stockExcelAjustado: recuperarNegativoAnterior ? false : registro.stockExcelAjustado,
        ubicacionActual: ubicacionRegistrada || ubicacionOriginalExcel,
        ubicacionOrigen:
          registro.ubicacionOrigen === 'usuario' ||
          (ubicacionRegistrada &&
            formatearUbicacion(ubicacionRegistrada) !==
              formatearUbicacion(ubicacionOriginalExcel))
            ? 'usuario'
            : 'excel',
      }
    }),
  ),
)
const informe = computed(() => {
  const confirmados = registrosVisuales.value.filter((registro) => registro.confirmado)
  const conteoCodigosExcel = new Map()
  const articulosExcel = baseDatosCargada.value ? obtenerArticulosCargados() : []
  articulosExcel.forEach((articulo) => {
    const codigo = String(articulo?.codigo || '')
      .trim()
      .toUpperCase()
    if (codigo) conteoCodigosExcel.set(codigo, (conteoCodigosExcel.get(codigo) || 0) + 1)
  })
  const codigosDuplicados = new Set(
    [...conteoCodigosExcel.entries()]
      .filter(([, cantidad]) => cantidad > 1)
      .map(([codigo]) => codigo),
  )
  return {
    total: registrosVisuales.value.length,
    confirmados: confirmados.length,
    pendientes: registrosVisuales.value.length - confirmados.length,
    sl: registrosVisuales.value.filter(
      (registro) => formatearUbicacion(registro.ubicacionActual) === 'SL',
    ).length,
    inexistentes: registrosVisuales.value.filter(
      (registro) => registro.nombre === 'ARTÍCULO INEXISTENTE',
    ).length,
    duplicados: articulosExcel.filter((articulo) =>
      codigosDuplicados.has(
        String(articulo?.codigo || '')
          .trim()
          .toUpperCase(),
      ),
    ).length,
  }
})
const confirmados = computed(() =>
  registrosVisuales.value.filter((registro) => registro.confirmado),
)
const esNavegadorWeb = computed(() => Capacitor.getPlatform() === 'web')
const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: !esNavegadorWeb.value && confirmados.value.length > 0 && !hayConflictoFuente.value,
  puedeEnviar: confirmados.value.length > 0 && !hayConflictoFuente.value,
  botonesPersonalizados: esNavegadorWeb.value
    ? [
        {
          accion: 'descargar-stock',
          icono: IconDownload,
          titulo: 'Descargar Excel de Stock',
          desactivado: confirmados.value.length === 0 || hayConflictoFuente.value,
          claseCSS: '',
        },
      ]
    : [],
  modalActivo: modalActivo.value,
}))
const metodosParaBarra = {
  onAgregar: () => {},
  onEnviar: () => exportarStock(),
  onAccionPersonalizada: (accion) => {
    if (accion === 'descargar-stock') exportarStock()
  },
  onAtrasNativo: () => cerrarPasoAtrasNativo(),
}

function notificar(tipo, mensaje, timeout = 2400) {
  Notify.create({ type: tipo, message: mensaje, position: 'top', timeout })
}

function actualizarEstadoBase() {
  const estado = obtenerEstadoCarga()
  baseDatosCargada.value = estado.cargado
  informacionArchivo.value = estado.archivo || null
}

async function recargarDatos() {
  sesion.value = await obtenerSesionStock()
  ubicaciones.value = await obtenerUbicaciones()
  actualizarEstadoBase()
}

function asegurarFuenteValida() {
  if (!baseDatosCargada.value || !fuenteActual.value) {
    notificar('warning', 'Carga el Excel antes de trabajar con Stock')
    return false
  }
  if (hayConflictoFuente.value) {
    notificar('warning', 'La sesión de Stock pertenece a otro Excel')
    return false
  }
  return true
}

function normalizarBusqueda(valor) {
  return String(valor || '')
    .toUpperCase()
    .replace(/[^A-Z0-9Ñ -]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
}

function manejarInputBusqueda(evento) {
  normalizarInputPreservandoCursor({
    evento,
    normalizarValor: normalizarBusqueda,
    asignarValor: (valor) => {
      busquedaArticulo.value = valor
    },
    referenciaInput: inputBusquedaRef,
  })
  mostrarBuscador.value =
    inputEnfocado.value && busquedaArticulo.value.length >= 3 && baseDatosCargada.value
}

function manejarEnfoqueBusqueda() {
  inputEnfocado.value = true
  mostrarBuscador.value = busquedaArticulo.value.length >= 3 && baseDatosCargada.value
}

function manejarDesenfoqueBusqueda() {
  inputEnfocado.value = false
  setTimeout(() => {
    if (!inputEnfocado.value) mostrarBuscador.value = false
  }, 200)
}

function manejarDobleEspacio(evento) {
  if (evento.key !== ' ') return
  const ahora = Date.now()
  if (ahora - ultimoEspacioTiempo.value < 300) {
    evento.preventDefault()
    const posicion = evento.target.selectionStart ?? busquedaArticulo.value.length
    const textoAntes = busquedaArticulo.value.substring(0, posicion - 1)
    const textoDespues = busquedaArticulo.value.substring(posicion)
    busquedaArticulo.value = `${textoAntes}-${textoDespues}`
    nextTick(() => {
      inputBusquedaRef.value?.setSelectionRange(posicion, posicion)
    })
    ultimoEspacioTiempo.value = 0
    return
  }
  ultimoEspacioTiempo.value = ahora
}

function buscarArticuloExacto() {
  if (!asegurarFuenteValida()) return
  const termino = busquedaArticulo.value.trim().toUpperCase()
  const articulo = obtenerArticulosCargados().find(
    (item) => item.codigo === termino || item.nombre === termino,
  )
  if (!articulo) {
    notificar('warning', 'Artículo inexistente en la base cargada')
    return
  }
  seleccionarArticulo(articulo)
}

async function seleccionarArticulo(articulo) {
  if (!asegurarFuenteValida()) return
  articuloSeleccionado.value = articulo
  busquedaArticulo.value = articulo.codigo
  mostrarBuscador.value = false
  const registro = sesion.value.registros?.find((item) => item.codigo === articulo.codigo)
  const cantidad = registro?.stockContado ?? stockExcelSeleccionado.value
  conteoActual.value = cantidad
  conteoValidoAnterior.value = cantidad
  const ubicacionActual = obtenerUltimaUbicacionRegistrada(
    articulo.codigo,
    ubicaciones.value,
    articulo,
    registro?.ubicacionActual,
  )
  const ubicacionExcel = formatearUbicacion(articulo.ubicacionAntigua)
  const tieneUbicacionEnMemoria = ubicaciones.value.some(
    (item) =>
      formatearUbicacion(item?.codigo) === formatearUbicacion(articulo.codigo) &&
      Boolean(formatearUbicacion(item?.ubicacion)),
  )
  ubicacionSeleccionada.value = ubicacionActual || ubicacionExcel
  ubicacionOrigenSeleccionada.value =
    registro?.ubicacionOrigen === 'usuario' ||
    tieneUbicacionEnMemoria ||
    (ubicacionActual && formatearUbicacion(ubicacionActual) !== ubicacionExcel)
      ? 'usuario'
      : 'excel'
  await nextTick()
  inputConteoRef.value?.focus()
  inputConteoRef.value?.select()
}

function manejarEstadoBuscador(estado) {
  if (
    estado?.baseDatosCargada &&
    estado?.busquedaValida &&
    estado?.cantidadResultados === 1 &&
    estado?.articuloUnico &&
    articuloSeleccionado.value?.codigo !== estado.articuloUnico.codigo
  ) {
    seleccionarArticulo(estado.articuloUnico)
  }
}

function validarConteo(finalizar = false) {
  const textoCantidad = String(conteoActual.value ?? '').trim()
  if (!finalizar && (textoCantidad === '' || textoCantidad === '-')) return true
  const normalizado = normalizarCantidadStock(conteoActual.value)
  if (normalizado.valor === null) {
    conteoActual.value = conteoValidoAnterior.value
    notificar('warning', 'El conteo debe ser un número entero')
    return false
  }
  conteoActual.value = normalizado.valor
  conteoValidoAnterior.value = normalizado.valor
  return true
}

function restarConteo() {
  conteoActual.value = conteoValidoAnterior.value - 1
  conteoValidoAnterior.value = conteoActual.value
}

function sumarConteo() {
  conteoActual.value = conteoValidoAnterior.value + 1
  conteoValidoAnterior.value = conteoActual.value
}

function formatearUbicacion(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-')
}

function formatearUbicacionSeleccionada() {
  ubicacionSeleccionada.value = formatearUbicacion(ubicacionSeleccionada.value)
}

function marcarUbicacionComoUsuario() {
  ubicacionOrigenSeleccionada.value = ubicacionSeleccionada.value ? 'usuario' : 'excel'
}

function limpiarUbicacionSeleccionada() {
  ubicacionSeleccionada.value = ''
  ubicacionOrigenSeleccionada.value = 'excel'
}

async function guardarRegistro(registro, ubicacionAnterior = '') {
  const ubicacionIngresada = formatearUbicacion(registro.ubicacionActual)
  const ubicacionOriginalExcel = formatearUbicacion(registro.ubicacionOriginalExcel)
  const ubicacionOrigen = ubicacionIngresada ? registro.ubicacionOrigen || 'usuario' : 'excel'
  const ubicacionFinal = ubicacionIngresada || ubicacionOriginalExcel
  const cambioUbicacion =
    ubicacionOrigen === 'usuario' &&
    ubicacionFinal &&
    ubicacionFinal !== formatearUbicacion(ubicacionAnterior)
  if (cambioUbicacion) {
    const resultadoUbicacion = await registrarUbicacionArticulo(registro.codigo, ubicacionFinal)
    if (!resultadoUbicacion.exito) {
      throw new Error(resultadoUbicacion.mensaje || 'No se pudo actualizar la ubicación')
    }
    ubicaciones.value = await obtenerUbicaciones()
  }
  sesion.value = await guardarRegistroStock(
    { ...registro, ubicacionActual: ubicacionFinal, ubicacionOrigen },
    informacionArchivo.value,
  )
}

async function confirmarConteoSeleccionado() {
  if (!articuloSeleccionado.value || !asegurarFuenteValida()) return
  if (!validarConteo(true)) return
  formatearUbicacionSeleccionada()
  const registroAnterior = registroSeleccionado.value
  const stockExcel = normalizarCantidadStock(articuloSeleccionado.value.stock, {
    permitirDecimal: true,
  })
  try {
    await guardarRegistro(
      {
        codigo: articuloSeleccionado.value.codigo,
        nombre: articuloSeleccionado.value.nombre,
        stockExcel: stockExcel.valor ?? 0,
        stockExcelAjustado: stockExcel.ajustado,
        stockContado: conteoValidoAnterior.value,
        ubicacionActual: ubicacionSeleccionada.value,
        ubicacionOriginalExcel: articuloSeleccionado.value.ubicacionAntigua,
        ubicacionOrigen: ubicacionOrigenSeleccionada.value,
        confirmado: true,
      },
      registroAnterior?.ubicacionActual || ultimaUbicacionSeleccionada.value,
    )
    notificar('positive', 'Conteo confirmado')
    cancelarSeleccion()
  } catch (error) {
    notificar('negative', error.message, 3200)
  }
}

function cancelarSeleccion() {
  articuloSeleccionado.value = null
  busquedaArticulo.value = ''
  conteoActual.value = 0
  conteoValidoAnterior.value = 0
  ubicacionSeleccionada.value = ''
  ubicacionOrigenSeleccionada.value = 'excel'
  mostrarBuscador.value = false
  nextTick(() => inputBusquedaRef.value?.focus())
}

async function importarDesdeUbicaciones() {
  if (!asegurarFuenteValida()) return
  const lista = await obtenerUbicaciones()
  const vistos = new Set()
  const nuevos = []
  let omitidos = 0
  let inexistentes = 0
  for (const movimiento of lista) {
    const codigo = String(movimiento?.codigo || '')
      .trim()
      .toUpperCase()
    if (!codigo || vistos.has(codigo)) continue
    vistos.add(codigo)
    const existente = sesion.value.registros?.find((registro) => registro.codigo === codigo)
    if (existente?.confirmado) {
      omitidos++
      continue
    }
    const articulo = obtenerArticuloPorCodigo(codigo)
    const stockExcel = normalizarCantidadStock(articulo?.stock, { permitirDecimal: true })
    if (!articulo) inexistentes++
    nuevos.push({
      codigo,
      nombre: articulo?.nombre || 'ARTÍCULO INEXISTENTE',
      stockExcel: stockExcel.valor ?? 0,
      stockExcelAjustado: stockExcel.ajustado,
      stockContado: existente?.stockContado ?? stockExcel.valor ?? 0,
      ubicacionActual: formatearUbicacion(movimiento.ubicacion),
      ubicacionOriginalExcel: articulo?.ubicacionAntigua || '',
      ubicacionOrigen: 'usuario',
      confirmado: false,
      fechaActualizacion: Date.now(),
    })
  }
  if (nuevos.length === 0) {
    notificar('warning', 'No hay artículos nuevos para importar')
    return
  }
  sesion.value = await guardarRegistrosStock(nuevos, informacionArchivo.value)
  notificar(
    'positive',
    `${nuevos.length} importados, ${omitidos} confirmados omitidos, ${inexistentes} inexistentes`,
    3500,
  )
}

async function confirmarRegistroPendiente(registro) {
  try {
    await guardarRegistro({ ...registro, confirmado: true }, registro.ubicacionActual)
    notificar('positive', 'Conteo confirmado')
  } catch (error) {
    notificar('negative', error.message)
  }
}

async function guardarEdicionRegistro(registro) {
  const anterior = sesion.value.registros.find((item) => item.codigo === registro.codigo)
  try {
    await guardarRegistro(registro, anterior?.ubicacionActual)
    notificar('positive', 'Registro actualizado')
  } catch (error) {
    notificar('negative', error.message)
  }
}

function abrirEliminarRegistro(registro) {
  registroAEliminar.value = registro
}

async function confirmarEliminarRegistro() {
  sesion.value = await eliminarRegistroStock(registroAEliminar.value.codigo)
  registroAEliminar.value = null
  notificar('positive', 'Registro eliminado')
}

async function confirmarEliminarTodos() {
  sesion.value = await eliminarSesionStock()
  mostrarModalEliminarTodos.value = false
  notificar('positive', 'Sesión de Stock eliminada')
  nextTick(() => inputBusquedaRef.value?.focus())
}

async function confirmarNuevaSesion() {
  sesion.value = await iniciarSesionStock(informacionArchivo.value)
  mostrarModalNuevaSesion.value = false
  cancelarSeleccion()
  notificar('positive', 'Nueva sesión de Stock iniciada')
}

async function enviarRegistroAEtiquetas(registro) {
  if (!obtenerArticuloPorCodigo(registro.codigo)) {
    notificar('warning', 'No se puede enviar un artículo inexistente')
    return
  }
  const resultado = await agregarEtiquetasDesdeArticulos([registro])
  notificar('positive', `${resultado.cantidad} etiqueta enviada`)
}

async function enviarTodosAEtiquetas() {
  const validos = registrosVisuales.value.filter((registro) =>
    obtenerArticuloPorCodigo(registro.codigo),
  )
  const excluidos = registrosVisuales.value.length - validos.length
  const resultado = await agregarEtiquetasDesdeArticulos(validos)
  notificar(
    'positive',
    `${resultado.cantidad} etiquetas enviadas${excluidos ? `, ${excluidos} inexistentes omitidos` : ''}`,
    3200,
  )
}

async function exportarStock() {
  if (!asegurarFuenteValida()) return
  try {
    const resultado = await generarYGuardarExcelStock(registrosVisuales.value)
    if (!esNavegadorWeb.value) {
      await compartirArchivo(resultado.uri, resultado.nombreArchivo)
      notificar('positive', 'Excel de Stock preparado para compartir')
      return
    }
    notificar('positive', 'Excel de Stock descargado')
  } catch (error) {
    notificar('negative', error.message, 3200)
  }
}

async function copiarBusqueda() {
  try {
    await navigator.clipboard?.writeText(busquedaArticulo.value)
  } catch (error) {
    console.warn('[PaginaStock] No se pudo copiar:', error)
  }
}

function abrirCamara() {
  if (!asegurarFuenteValida()) return
  mostrarCamara.value = true
  mostrarBuscador.value = false
}

function cerrarCamara() {
  mostrarCamara.value = false
}

function procesarEscaneo(codigos) {
  cerrarCamara()
  if (!Array.isArray(codigos) || !codigos[0]) return
  busquedaArticulo.value = codigos[0]
  buscarArticuloExacto()
}

function manejarBaseCargada() {
  actualizarEstadoBase()
}

function manejarErrorCarga(mensaje) {
  notificar('negative', mensaje || 'No se pudo cargar el Excel')
  actualizarEstadoBase()
}

function cerrarPasoAtrasNativo() {
  if (mostrarCamara.value) {
    cerrarCamara()
    return true
  }
  if (tablaStockRef.value?.cerrarEdicion?.()) return true
  if (articuloSeleccionado.value) {
    cancelarSeleccion()
    return true
  }
  if (mostrarBuscador.value) {
    mostrarBuscador.value = false
    return true
  }
  return false
}

function actualizarBarra() {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

watch(configuracionBarra, actualizarBarra, { deep: true })

onMounted(async () => {
  await recargarDatos()
  actualizarBarra()
  intervaloBase = setInterval(actualizarEstadoBase, 1000)
})

onUnmounted(() => {
  if (intervaloBase) clearInterval(intervaloBase)
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
.contenedor-stock {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  max-width: 900px;
  margin: 20px auto;
  padding: 1rem;
  padding-bottom: 120px;
}
.titulo-stock {
  text-align: center;
  color: var(--color-primario);
  font-size: 2rem;
  margin: 0 0 1rem 0;
}
.alerta-fuente-stock {
  border: 1px solid var(--color-error);
  border-radius: 10px;
  padding: 0.9rem;
  margin-bottom: 1rem;
  display: grid;
  gap: 0.4rem;
  color: var(--color-texto-principal);
}
.alerta-fuente-stock span {
  color: var(--color-texto-secundario);
}
.alerta-fuente-stock button,
.boton-importar {
  border: 0;
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  background: var(--color-primario);
  color: var(--color-texto-principal);
  width: fit-content;
  cursor: pointer;
}
.boton-importar {
  margin-top: 0.8rem;
  display: flex;
  gap: 0.45rem;
  align-items: center;
}
.boton-importar:disabled {
  background: var(--color-desactivado);
  cursor: not-allowed;
}
.bloque-buscador-stock {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
  margin: 1rem 0;
}
.campo-buscador-stock {
  position: relative;
}
.campo-buscador-stock > input {
  width: 100%;
  min-height: 50px;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  padding: 0 42px 0 12px;
  font-size: 1rem;
}
.boton-copiar-stock {
  position: absolute;
  right: 10px;
  top: 16px;
  border: 0;
  background: transparent;
  color: var(--color-texto-secundario);
  cursor: pointer;
}
.boton-camara-stock {
  width: 50px;
  height: 50px;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  cursor: pointer;
}
.tarjeta-articulo-stock {
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--color-fondo);
}
.tarjeta-stock-sl {
  border-color: var(--color-neon-sl-borde);
  box-shadow: 0 0 12px var(--color-neon-sl-sombra), 0 0 24px var(--color-neon-sl-sombra);
}
.encabezado-tarjeta-stock {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.encabezado-tarjeta-stock > div {
  min-width: 0;
}
.subtitulo-tarjeta-stock {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
.aviso-conteo-anterior {
  color: var(--color-carga);
  margin: 0.35rem 0 0 0;
  font-size: 0.9rem;
}
.nombre-articulo-stock {
  color: var(--color-texto-principal);
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0.8rem 0 0 0;
  overflow-wrap: anywhere;
}
.dato-articulo-stock {
  color: var(--color-texto-secundario);
  margin: 0.4rem 0 0 0;
}
.dato-articulo-stock strong {
  color: var(--color-texto-principal);
}
.aviso-stock-ajustado {
  color: var(--color-carga);
  margin: 0.4rem 0 0 0;
  font-size: 0.85rem;
}
.texto-sl-neon {
  color: var(--color-neon-sl-texto) !important;
  text-shadow: 0 0 8px var(--color-neon-sl-sombra), 0 0 16px var(--color-neon-sl-sombra);
}
.etiqueta-campo-stock {
  display: block;
  margin: 0.85rem 0 0.35rem 0;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
.contador-stock {
  display: grid;
  grid-template-columns: minmax(42px, 52px) minmax(0, 1fr) minmax(42px, 52px);
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
}
.contador-stock button,
.contador-stock input,
.input-ubicacion-stock {
  box-sizing: border-box;
  min-height: 50px;
  min-width: 0;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-superficie);
  color: var(--color-texto-principal);
  text-align: center;
  font-size: 1.1rem;
}
.contador-stock input {
  width: 100%;
  padding: 0 0.35rem;
}
.campo-ubicacion-stock {
  position: relative;
}
.input-ubicacion-stock {
  width: 100%;
  text-align: left;
  padding: 0 2.75rem 0 0.75rem;
}
.acciones-tarjeta-stock {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  margin-top: 1rem;
}
.boton-confirmar-stock,
.boton-cancelar-stock {
  border: 0;
  border-radius: 8px;
  padding: 0.8rem;
  cursor: pointer;
  font-weight: 700;
}
.boton-confirmar-stock {
  background: var(--color-exito);
  color: var(--color-texto-principal);
}
.boton-cancelar-stock {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  color: var(--color-texto-secundario);
}
.texto-accion-corto {
  display: none;
}
.texto-informe {
  margin: 0.35rem 0;
  color: var(--color-texto-secundario);
}
.mostrar-stock-enter-active,
.mostrar-stock-leave-active {
  transition: all 0.25s ease;
}
.mostrar-stock-enter-from,
.mostrar-stock-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
@media (max-width: 600px) {
  .contenedor-stock {
    margin: 12px;
    padding: 0.75rem;
    padding-bottom: 110px;
  }
  .titulo-stock {
    font-size: 1.6rem;
  }
}
@media (max-width: 420px) {
  .texto-accion-completo {
    display: none;
  }
  .texto-accion-corto {
    display: inline;
  }
}
</style>
