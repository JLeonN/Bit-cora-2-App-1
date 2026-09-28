<template>
  <div class="contenedor-consulta">
    <h2 class="titulo-consulta">Consulta de ubicación</h2>

    <SelectorExcel
      v-if="!baseDatosCargada"
      @base-datos-cargada="manejarBaseCargada"
      @error-carga="manejarErrorCarga"
    />

    <div class="bloque-buscador" :class="{ 'bloque-buscador-con-resultado': articuloConsultado }">
      <CampoContextoArticulo
        id-campo="contexto-consulta-ubicacion"
        :model-value="contextoBusqueda"
        @update:model-value="actualizarContextoBusqueda"
      />
      <div class="campo-buscador">
        <input
          ref="inputBusquedaRef"
          v-model="busquedaArticulo"
          type="text"
          placeholder="Código o nombre del artículo"
          class="input-buscador"
          @focus="manejarEnfoqueBusqueda"
          @blur="manejarDesenfoqueBusqueda"
          @keydown="manejarDobleEspacio"
          @input="manejarInputBusqueda"
          @keyup.enter="buscarArticuloExacto"
        />
        <button
          v-if="busquedaArticulo"
          type="button"
          class="boton-copiar-busqueda"
          title="Copiar texto"
          @click="copiarBusquedaActual"
        >
          <IconCopy :size="16" />
        </button>

        <BuscadorArticulos
          v-if="mostrarBuscador && busquedaArticulo.length >= 3"
          :busqueda="busquedaArticulo"
          :contexto-busqueda="contextoBusqueda"
          @articulo-seleccionado="seleccionarArticulo"
          @estado-busqueda="manejarEstadoBuscador"
        />
      </div>

      <button type="button" class="boton-camara" @click="abrirCamara">
        <IconCamera :stroke="2" />
      </button>
    </div>

    <transition name="mostrar-resultado">
      <div v-if="articuloConsultado" class="resultado-consulta">
        <div class="tarjeta-resultado" :class="{ 'tarjeta-sl-neon': esUbicacionOriginalSL }">
          <div class="encabezado-resultado">
            <p class="etiqueta-resultado">Historial de ubicaciones</p>
            <button
              type="button"
              class="boton-compartir-whatsapp"
              title="Compartir artículo por WhatsApp"
              aria-label="Compartir artículo por WhatsApp"
              @click="compartirArticuloWhatsApp"
            >
              <IconBrandWhatsapp :size="23" :stroke="2" aria-hidden="true" />
            </button>
          </div>
          <div class="lista-historial-ubicaciones">
            <p
              v-for="(ubicacion, indice) in historialVisual"
              :key="`historial-${indice}`"
              class="valor-ubicacion"
              :class="{ 'texto-sl-neon': ubicacion === 'SL' && esUbicacionOriginalSL }"
            >
              {{ ubicacion }}
            </p>
          </div>
          <p class="ubicacion-original">
            Original Excel:
            <strong :class="{ 'texto-sl-neon': esUbicacionOriginalSL }">{{
              articuloConsultado.ubicacionAntigua || 'SIN UBICACIÓN'
            }}</strong>
          </p>
          <p class="valor-nombre">{{ articuloConsultado.nombre }}</p>
          <p class="valor-codigo">{{ articuloConsultado.codigo }}</p>
          <p class="valor-stock-excel">Stock del Excel: {{ articuloConsultado.stock || 'Sin stock' }}</p>
        </div>

        <button type="button" class="boton-actualizar-ubicacion" @click="alternarEditorUbicacion">
          {{ mostrarEditorUbicacion ? 'Cancelar actualización' : 'Actualizar ubicación' }}
        </button>

        <transition name="mostrar-editor">
          <form
            v-if="mostrarEditorUbicacion"
            class="editor-ubicacion"
            @submit.prevent="guardarNuevaUbicacion"
          >
            <div class="campo-editor">
              <input
                ref="inputNuevaUbicacionRef"
                v-model="nuevaUbicacion"
                type="text"
                placeholder="Nueva ubicación"
                class="input-ubicacion"
                @blur="formatearNuevaUbicacion"
              />
              <button
                v-if="nuevaUbicacion"
                type="button"
                class="boton-limpiar-ubicacion"
                title="Limpiar ubicación"
                @click="nuevaUbicacion = ''"
              >
                <IconTrash :size="16" />
              </button>
            </div>
            <button type="submit" class="boton-guardar-ubicacion">Guardar ubicación</button>
          </form>
        </transition>

        <div class="acciones-envio-consulta">
          <button type="button" class="boton-accion-consulta" :disabled="enviandoStock" @click="enviarAStock">
            {{ enviandoStock ? 'Enviando…' : 'Enviar a Stock' }}
          </button>
          <div class="accion-desplegable-consulta">
            <button
              type="button"
              class="boton-accion-consulta"
              :aria-expanded="mostrarEnvioListado"
              aria-controls="panel-envio-listado"
              @click="alternarEnvioListado"
            >
              {{ mostrarEnvioListado ? 'Cerrar envío a Listado' : 'Enviar a Listado' }}
            </button>
            <transition name="mostrar-editor">
              <div v-if="mostrarEnvioListado" id="panel-envio-listado" class="panel-envio-consulta">
                <GestorListados
                  :listados="listadosDisponibles"
                  :listado-activo="listadoSeleccionado"
                  :ocupado="enviandoListado"
                  solo-seleccion
                  @abrir="seleccionarListadoEnvio"
                />
                <button type="button" class="boton-confirmar-envio" :disabled="!idListadoSeleccionado || enviandoListado" @click="enviarAListado">
                  {{ enviandoListado ? 'Enviando…' : 'Enviar al listado elegido' }}
                </button>
              </div>
            </transition>
          </div>
          <div class="accion-desplegable-consulta">
            <button
              type="button"
              class="boton-accion-consulta"
              :aria-expanded="mostrarEnvioEtiquetas"
              aria-controls="panel-envio-etiquetas"
              @click="alternarEnvioEtiquetas"
            >
              {{ mostrarEnvioEtiquetas ? 'Cerrar envío a Etiquetas' : 'Enviar a Etiquetas' }}
            </button>
            <transition name="mostrar-editor">
              <form v-if="mostrarEnvioEtiquetas" id="panel-envio-etiquetas" class="panel-envio-consulta" @submit.prevent="enviarAEtiquetas">
                <label for="copias-consulta">Cantidad de copias</label>
                <div class="controles-copias-consulta">
                  <button
                    type="button"
                    class="boton-cantidad-consulta"
                    aria-label="Quitar una copia"
                    :disabled="enviandoEtiquetas || cantidadCopias <= 1"
                    @click="ajustarCantidadCopias(-1)"
                  >
                    <IconMinus :size="18" :stroke="2" aria-hidden="true" />
                  </button>
                  <input
                    id="copias-consulta"
                    v-model.number="cantidadCopias"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    class="input-copias-consulta"
                    :disabled="enviandoEtiquetas"
                    required
                    @blur="normalizarCantidadCopias"
                  />
                  <button
                    type="button"
                    class="boton-cantidad-consulta"
                    aria-label="Agregar una copia"
                    :disabled="enviandoEtiquetas || cantidadCopias >= Number.MAX_SAFE_INTEGER"
                    @click="ajustarCantidadCopias(1)"
                  >
                    <IconPlus :size="18" :stroke="2" aria-hidden="true" />
                  </button>
                </div>
                <button type="submit" class="boton-confirmar-envio" :disabled="enviandoEtiquetas">
                  {{ enviandoEtiquetas ? 'Enviando…' : 'Enviar a Etiquetas' }}
                </button>
              </form>
            </transition>
          </div>
        </div>
      </div>
    </transition>

    <CamaraEscaneo
      v-if="mostrarCamara"
      :escaneo-unico="true"
      @cancelar="cerrarCamara"
      @finalizar="procesarCodigosEscaneados"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { IconCamera, IconTrash, IconCopy, IconBrandWhatsapp, IconMinus, IconPlus } from '@tabler/icons-vue'
import SelectorExcel from '../components/Logica/Ubicaciones/SelectorExcel.vue'
import BuscadorArticulos from '../components/Logica/Compartidos/BuscadorArticulos.vue'
import CampoContextoArticulo from '../components/Logica/Compartidos/CampoContextoArticulo.vue'
import CamaraEscaneo from '../components/Logica/Ubicaciones/CamaraEscaneo.vue'
import GestorListados from '../components/Logica/Listados/GestorListados.vue'
import {
  obtenerInformacionArchivo,
  obtenerArticulosCargados,
  obtenerEstadoCarga,
  obtenerHistorialUbicaciones,
} from '../components/BaseDeDatos/LectorExcel.js'
import { registrarUbicacionArticulo } from '../components/Logica/Ubicaciones/ServicioRegistroUbicacion.js'
import { obtenerUltimaUbicacionRegistrada } from '../components/Logica/Ubicaciones/ServicioRegistroUbicacion.js'
import { obtenerUbicaciones } from '../components/BaseDeDatos/usoAlmacenamientoUbicaciones.js'
import { guardarRegistroStock, normalizarCantidadStock, obtenerSesionStock } from '../components/BaseDeDatos/UsoAlmacenamientoStock.js'
import { guardarListado, obtenerListado, obtenerListados } from '../components/BaseDeDatos/UsoAlmacenamientoListados.js'
import { cargarDatosLocalesArticulos, resolverDatosArticulo } from '../components/Logica/Compartidos/ServicioDatosLocalesArticulo.js'
import { agregarEtiquetasDesdeArticulos } from '../components/Logica/Etiquetas/ServicioEnvioEtiquetas.js'
import { normalizarInputPreservandoCursor } from '../components/Logica/Compartidos/NormalizarInputCursor.js'
import { obtenerArticuloExacto } from '../components/Logica/Compartidos/ServicioBusquedaArticulos.js'
import {
  abrirWhatsAppConMensaje,
  abrirWhatsAppEnAndroid,
} from '../components/Logica/Compartidos/CompartirWhatsApp.js'
import {
  AMBITOS_CONTEXTO_ARTICULO,
  obtenerContextoArticulo,
  guardarContextoArticulo,
} from '../components/BaseDeDatos/UsoAlmacenamientoContextosArticulo.js'

const emit = defineEmits(['configurar-barra'])
const CLAVE_ULTIMO_LISTADO_CONSULTA = 'ultimo_listado_consulta_ubicacion'

const busquedaArticulo = ref('')
const contextoBusqueda = ref('')
const articuloConsultado = ref(null)
const mostrarBuscador = ref(false)
const inputEnfocado = ref(false)
const mostrarCamara = ref(false)
const mostrarEditorUbicacion = ref(false)
const nuevaUbicacion = ref('')
const modalActivo = ref(false)
const baseDatosCargada = ref(false)
const inputBusquedaRef = ref(null)
const inputNuevaUbicacionRef = ref(null)
const ultimoEspacioTiempo = ref(0)
const seleccionRecienteDesdeBuscador = ref(false)
const textoCopiadoBusqueda = ref('')
const mostrarEnvioListado = ref(false)
const mostrarEnvioEtiquetas = ref(false)
const listadosDisponibles = ref([])
const idListadoSeleccionado = ref('')
const cantidadCopias = ref(1)
const enviandoStock = ref(false)
const enviandoListado = ref(false)
const enviandoEtiquetas = ref(false)

const listadoSeleccionado = computed(() => listadosDisponibles.value.find((listado) => listado.id === idListadoSeleccionado.value) || null)

let intervaloBaseDatos = null

const historialVisual = computed(() => {
  if (!articuloConsultado.value?.codigo) return []
  const historial = Array.isArray(articuloConsultado.value.historialUbicaciones)
    ? [...articuloConsultado.value.historialUbicaciones]
    : []
  if (historial.length === 0) {
    return [articuloConsultado.value.ubicacionAntigua || 'SIN UBICACIÓN']
  }
  return [...historial].reverse()
})

const esUbicacionOriginalSL = computed(
  () => (articuloConsultado.value?.ubicacionAntigua || '').trim().toUpperCase() === 'SL',
)

const cerrarPanelesEnvio = () => {
  mostrarEnvioListado.value = false
  mostrarEnvioEtiquetas.value = false
  idListadoSeleccionado.value = ''
  cantidadCopias.value = 1
}

const alternarEnvioListado = async () => {
  mostrarEnvioListado.value = !mostrarEnvioListado.value
  mostrarEnvioEtiquetas.value = false
  if (!mostrarEnvioListado.value) return
  idListadoSeleccionado.value = ''
  listadosDisponibles.value = []
  try {
    const [listados, preferencia] = await Promise.all([
      obtenerListados(),
      Preferences.get({ key: CLAVE_ULTIMO_LISTADO_CONSULTA }),
    ])
    if (!mostrarEnvioListado.value) return
    listadosDisponibles.value = listados.sort(
      (primero, segundo) => primero.creadoEn - segundo.creadoEn,
    )
    idListadoSeleccionado.value = listadosDisponibles.value.some((listado) => listado.id === preferencia.value)
      ? preferencia.value
      : ''
    if (listadosDisponibles.value.length === 0) {
      Notify.create({ type: 'warning', message: 'Primero creá un listado', position: 'top' })
    }
  } catch (error) {
    Notify.create({ type: 'negative', message: error.message || 'No se pudieron cargar los listados', position: 'top' })
  }
}

const seleccionarListadoEnvio = async (id) => {
  idListadoSeleccionado.value = id
  try {
    await Preferences.set({ key: CLAVE_ULTIMO_LISTADO_CONSULTA, value: id })
  } catch {
    Notify.create({ type: 'warning', message: 'No se pudo recordar el listado elegido', position: 'top' })
  }
}

const alternarEnvioEtiquetas = () => {
  mostrarEnvioEtiquetas.value = !mostrarEnvioEtiquetas.value
  mostrarEnvioListado.value = false
  cantidadCopias.value = 1
}

const normalizarCantidadCopias = () => {
  const cantidad = Number(cantidadCopias.value)
  cantidadCopias.value = Number.isFinite(cantidad) && cantidad >= 1
    ? Math.min(Math.trunc(cantidad), Number.MAX_SAFE_INTEGER)
    : 1
}

const ajustarCantidadCopias = (cambio) => {
  const cantidad = Number.isSafeInteger(cantidadCopias.value) && cantidadCopias.value >= 1
    ? cantidadCopias.value
    : cambio > 0 ? 0 : 1
  cantidadCopias.value = Math.max(1, Math.min(cantidad + cambio, Number.MAX_SAFE_INTEGER))
}

const obtenerUbicacionActualConsulta = async (articulo) => {
  const ubicaciones = await obtenerUbicaciones()
  return obtenerUltimaUbicacionRegistrada(articulo.codigo, ubicaciones, articulo, articulo.ubicacionAntigua)
    || articulo.ubicacionAntigua || ''
}

const enviarAStock = async () => {
  const articulo = articuloConsultado.value
  if (!articulo?.codigo || enviandoStock.value) return
  enviandoStock.value = true
  try {
    const fuenteExcel = obtenerInformacionArchivo()
    if (!fuenteExcel) throw new Error('Cargá el Excel maestro antes de enviar a Stock')
    const sesion = await obtenerSesionStock()
    if (sesion.registros.some((registro) => registro.codigo === articulo.codigo)) {
      Notify.create({ type: 'info', message: 'Este artículo ya está en Stock', position: 'top' })
      return
    }
    const stockExcel = normalizarCantidadStock(articulo.stock, { permitirDecimal: true })
    const ubicacionActual = await obtenerUbicacionActualConsulta(articulo)
    await guardarRegistroStock({
      codigo: articulo.codigo,
      nombre: articulo.nombre,
      stockExcel: stockExcel.valor ?? 0,
      stockContado: stockExcel.valor ?? 0,
      stockExcelAjustado: stockExcel.ajustado,
      ubicacionActual,
      ubicacionOriginalExcel: articulo.ubicacionAntigua,
      ubicacionOrigen: ubicacionActual === articulo.ubicacionAntigua ? 'excel' : 'usuario',
      confirmado: false,
    }, fuenteExcel)
    Notify.create({ type: 'positive', message: 'Artículo enviado a Stock como pendiente de conteo', position: 'top' })
  } catch (error) {
    Notify.create({ type: 'negative', message: error.message || 'No se pudo enviar a Stock', position: 'top' })
  } finally {
    enviandoStock.value = false
  }
}

const enviarAListado = async () => {
  const articulo = articuloConsultado.value
  if (!articulo?.codigo || !idListadoSeleccionado.value || enviandoListado.value) return
  enviandoListado.value = true
  try {
    const listado = await obtenerListado(idListadoSeleccionado.value)
    if (!listado) throw new Error('El listado elegido ya no existe')
    if (listado.articulos.some((fila) => fila.codigo === articulo.codigo)) {
      Notify.create({ type: 'info', message: 'Este artículo ya está en el listado elegido', position: 'top' })
      return
    }
    const datosLocales = await cargarDatosLocalesArticulos()
    const { stockListado, ubicacionListado } = resolverDatosArticulo(articulo, datosLocales)
    listado.articulos.push({
      idFila: crypto.randomUUID(),
      codigo: articulo.codigo,
      descripcion: articulo.nombre,
      stockOriginal: articulo.stock ?? '',
      stockListado,
      ubicacionOriginal: articulo.ubicacionAntigua || '',
      ubicacionListado,
      fechaIngreso: Date.now(),
    })
    await guardarListado(listado)
    mostrarEnvioListado.value = false
    Notify.create({ type: 'positive', message: `Artículo enviado a ${listado.nombre}`, position: 'top' })
  } catch (error) {
    Notify.create({ type: 'negative', message: error.message || 'No se pudo enviar al listado', position: 'top' })
  } finally {
    enviandoListado.value = false
  }
}

const enviarAEtiquetas = async () => {
  const articulo = articuloConsultado.value
  if (!articulo?.codigo || enviandoEtiquetas.value) return
  if (!Number.isSafeInteger(cantidadCopias.value) || cantidadCopias.value < 1) {
    Notify.create({ type: 'warning', message: 'Ingresá una cantidad válida de copias', position: 'top' })
    return
  }
  enviandoEtiquetas.value = true
  try {
    const ubicacion = await obtenerUbicacionActualConsulta(articulo)
    await agregarEtiquetasDesdeArticulos([{ ...articulo, ubicacion }], cantidadCopias.value)
    mostrarEnvioEtiquetas.value = false
    Notify.create({ type: 'positive', message: 'Etiqueta agregada', position: 'top' })
  } catch (error) {
    Notify.create({ type: 'negative', message: error.message || 'No se pudo enviar a Etiquetas', position: 'top' })
  } finally {
    enviandoEtiquetas.value = false
  }
}

const compartirArticuloWhatsApp = async () => {
  const articulo = articuloConsultado.value
  if (!articulo?.nombre || !articulo?.codigo) return

  const mensaje = `*Artículo:* ${articulo.nombre}\n*Código:* ${articulo.codigo}`
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      await abrirWhatsAppEnAndroid(mensaje)
    } else {
      abrirWhatsAppConMensaje(mensaje)
    }
  } catch (error) {
    console.error('[ConsultaDeUbicacion] No se pudo abrir WhatsApp:', error)
    Notify.create({
      type: 'negative',
      message: 'No se pudo abrir WhatsApp. Intentá nuevamente.',
      position: 'top',
    })
  }
}

const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: false,
  puedeEnviar: false,
  botonesPersonalizados: [],
  modalActivo: modalActivo.value,
}))

const metodosParaBarra = {
  onAgregar: () => {},
  onEnviar: () => {},
  onAccionPersonalizada: () => {},
  onAtrasNativo: () => cerrarPasoAtrasNativo(),
}

const actualizarConfiguracionBarra = () => {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

const actualizarEstadoBaseDatos = () => {
  const estado = obtenerEstadoCarga()
  baseDatosCargada.value = estado.cargado
}

const normalizarTextoBusqueda = (valor) => {
  if (!valor) return ''
  let texto = valor.toUpperCase()
  texto = texto.replace(/[^A-Z0-9\u00D1 -]/g, '-')
  texto = texto.replace(/-+/g, '-')
  texto = texto.replace(/\s+/g, ' ')
  return texto
}

const formatearNuevaUbicacion = () => {
  if (!nuevaUbicacion.value) return
  let texto = nuevaUbicacion.value.trim().toUpperCase()
  texto = texto.replace(/\s+/g, '-')
  nuevaUbicacion.value = texto
}

const manejarDobleEspacio = (evento) => {
  if (evento.key !== ' ') return
  const tiempoActual = Date.now()
  const diferencia = tiempoActual - ultimoEspacioTiempo.value
  if (diferencia < 300 && diferencia > 0) {
    evento.preventDefault()
    const posicion = evento.target.selectionStart
    const textoActual = busquedaArticulo.value
    const textoAntes = textoActual.substring(0, posicion - 1)
    const textoDespues = textoActual.substring(posicion)
    busquedaArticulo.value = textoAntes + '-' + textoDespues
    nextTick(() => {
      if (inputBusquedaRef.value) {
        inputBusquedaRef.value.setSelectionRange(posicion, posicion)
      }
    })
    ultimoEspacioTiempo.value = 0
  } else {
    ultimoEspacioTiempo.value = tiempoActual
  }
}

const manejarInputBusqueda = (evento) => {
  seleccionRecienteDesdeBuscador.value = false
  normalizarInputPreservandoCursor({
    evento,
    normalizarValor: normalizarTextoBusqueda,
    asignarValor: (valor) => {
      busquedaArticulo.value = valor
    },
    referenciaInput: inputBusquedaRef,
  })
  mostrarBuscador.value =
    inputEnfocado.value && busquedaArticulo.value.length >= 3 && baseDatosCargada.value
}

const manejarEnfoqueBusqueda = () => {
  inputEnfocado.value = true
  if (seleccionRecienteDesdeBuscador.value) {
    inputBusquedaRef.value?.select()
    seleccionRecienteDesdeBuscador.value = false
  }
  mostrarBuscador.value = busquedaArticulo.value.length >= 3 && baseDatosCargada.value
}

const manejarDesenfoqueBusqueda = () => {
  inputEnfocado.value = false
  setTimeout(() => {
    if (!inputEnfocado.value) {
      mostrarBuscador.value = false
    }
  }, 200)
}

const buscarEnBase = (textoBusqueda) => obtenerArticuloExacto({
  articulos: obtenerArticulosCargados(),
  busqueda: textoBusqueda,
  contextoBusqueda: contextoBusqueda.value,
})

async function actualizarContextoBusqueda(valor) {
  contextoBusqueda.value = valor
  try {
    await guardarContextoArticulo(AMBITOS_CONTEXTO_ARTICULO.CONSULTA_UBICACION, valor)
  } catch {
    Notify.create({ type: 'negative', message: 'No se pudo guardar el contexto de búsqueda', position: 'top' })
  }
}

const buscarArticuloExacto = () => {
  if (!baseDatosCargada.value) {
    Notify.create({
      type: 'warning',
      message: 'Primero carga el archivo Excel para consultar ubicaciones',
      position: 'top',
      timeout: 2500,
    })
    return
  }

  const articulo = buscarEnBase(busquedaArticulo.value)
  if (!articulo) {
    Notify.create({
      type: 'warning',
      message: 'Artículo inexistente en la base cargada',
      position: 'top',
      timeout: 2200,
    })
    return
  }

  const historial = obtenerHistorialUbicaciones(articulo.codigo)
  articuloConsultado.value = { ...articulo, historialUbicaciones: historial }
  cerrarPanelesEnvio()
  mostrarEditorUbicacion.value = false
  nuevaUbicacion.value = ''
}

const copiarBusquedaActual = async () => {
  const texto = String(busquedaArticulo.value || '')
  if (!texto) return
  textoCopiadoBusqueda.value = texto
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto)
    }
  } catch (error) {
    console.warn('[ConsultaDeUbicacion] No se pudo copiar al portapapeles:', error)
  }
}

const seleccionarArticulo = (articulo, opciones = {}) => {
  const { esAutoseleccionEscaner = false } = opciones
  const historial = obtenerHistorialUbicaciones(articulo.codigo)
  busquedaArticulo.value = articulo.codigo
  seleccionRecienteDesdeBuscador.value = true
  articuloConsultado.value = { ...articulo, historialUbicaciones: historial }
  cerrarPanelesEnvio()
  mostrarBuscador.value = esAutoseleccionEscaner
  inputEnfocado.value = esAutoseleccionEscaner
  mostrarEditorUbicacion.value = false
  nuevaUbicacion.value = ''
}

const manejarEstadoBuscador = (estado) => {
  if (
    !estado?.baseDatosCargada ||
    !estado?.busquedaValida ||
    estado.tipoCoincidenciaUnica !== 'codigo-escaneado' ||
    !estado.articuloUnico
  ) {
    return
  }
  if (articuloConsultado.value?.codigo === estado.articuloUnico.codigo) return
  seleccionarArticulo(estado.articuloUnico, { esAutoseleccionEscaner: true })
}

const abrirCamara = () => {
  if (!baseDatosCargada.value) {
    Notify.create({
      type: 'warning',
      message: 'Carga el Excel antes de escanear artículos',
      position: 'top',
      timeout: 2200,
    })
    return
  }
  mostrarCamara.value = true
}

const cerrarCamara = () => {
  mostrarCamara.value = false
}

const procesarCodigosEscaneados = (codigos) => {
  cerrarCamara()
  if (!Array.isArray(codigos) || codigos.length === 0) return

  const codigoPrincipal = codigos[0]
  busquedaArticulo.value = codigoPrincipal
  seleccionRecienteDesdeBuscador.value = false
  const articulo = buscarEnBase(codigoPrincipal)
  if (!articulo) {
    Notify.create({
      type: 'warning',
      message: `El código ${codigoPrincipal} no existe en la base cargada`,
      position: 'top',
      timeout: 2200,
    })
    return
  }

  const historial = obtenerHistorialUbicaciones(articulo.codigo)
  articuloConsultado.value = { ...articulo, historialUbicaciones: historial }
  cerrarPanelesEnvio()
  mostrarEditorUbicacion.value = false
  nuevaUbicacion.value = ''
}

const alternarEditorUbicacion = async () => {
  mostrarEditorUbicacion.value = !mostrarEditorUbicacion.value
  if (mostrarEditorUbicacion.value) {
    nuevaUbicacion.value = ''
    await nextTick()
    inputNuevaUbicacionRef.value?.focus()
  }
}

const guardarNuevaUbicacion = async () => {
  if (!articuloConsultado.value?.codigo) return
  formatearNuevaUbicacion()
  if (!nuevaUbicacion.value) {
    Notify.create({
      type: 'warning',
      message: 'Ingresa una ubicación nueva antes de guardar',
      position: 'top',
      timeout: 2200,
    })
    return
  }

  const historialActual = Array.isArray(articuloConsultado.value.historialUbicaciones)
    ? articuloConsultado.value.historialUbicaciones
    : []
  const ubicacionReferencia =
    historialActual.length > 0
      ? historialActual[historialActual.length - 1]
      : articuloConsultado.value.ubicacionAntigua
  const ubicacionNueva = nuevaUbicacion.value.trim().toUpperCase()
  if ((ubicacionReferencia || '').trim().toUpperCase() === ubicacionNueva) {
    Notify.create({
      type: 'warning',
      message: 'La ubicación nueva es igual a la última conocida',
      position: 'top',
      timeout: 2200,
    })
    return
  }

  const resultado = await registrarUbicacionArticulo(
    articuloConsultado.value.codigo,
    ubicacionNueva,
  )
  if (!resultado.exito) {
    Notify.create({
      type: 'negative',
      message: resultado.mensaje || 'No se pudo actualizar la ubicación',
      position: 'top',
      timeout: 2600,
    })
    return
  }

  const historialActualizado = obtenerHistorialUbicaciones(articuloConsultado.value.codigo)
  articuloConsultado.value = {
    ...articuloConsultado.value,
    historialUbicaciones: historialActualizado,
  }
  if (textoCopiadoBusqueda.value) {
    busquedaArticulo.value = textoCopiadoBusqueda.value
  }
  mostrarEditorUbicacion.value = false
  nuevaUbicacion.value = ''
  await nextTick()
  inputBusquedaRef.value?.focus()
  const largoTextoBusqueda = busquedaArticulo.value.length
  inputBusquedaRef.value?.setSelectionRange(largoTextoBusqueda, largoTextoBusqueda)

  Notify.create({
    type: 'positive',
    message: 'Ubicación actualizada y agregada a Ubicaciones para enviar',
    position: 'top',
    timeout: 2600,
  })
}

const manejarBaseCargada = () => {
  actualizarEstadoBaseDatos()
}

const manejarErrorCarga = () => {
  actualizarEstadoBaseDatos()
}

const manejarModalAbierto = () => {
  modalActivo.value = true
}

const manejarModalCerrado = () => {
  modalActivo.value = false
}

function cerrarPasoAtrasNativo() {
  if (mostrarCamara.value) {
    cerrarCamara()
    modalActivo.value = false
    return true
  }
  if (mostrarEditorUbicacion.value) {
    mostrarEditorUbicacion.value = false
    nuevaUbicacion.value = ''
    return true
  }
  if (mostrarEnvioListado.value || mostrarEnvioEtiquetas.value) {
    cerrarPanelesEnvio()
    return true
  }
  if (mostrarBuscador.value) {
    mostrarBuscador.value = false
    return true
  }
  return false
}

watch(
  () => modalActivo.value,
  () => {
    actualizarConfiguracionBarra()
  },
)

onMounted(async () => {
  contextoBusqueda.value = await obtenerContextoArticulo(AMBITOS_CONTEXTO_ARTICULO.CONSULTA_UBICACION)
  actualizarEstadoBaseDatos()
  actualizarConfiguracionBarra()
  intervaloBaseDatos = setInterval(() => {
    actualizarEstadoBaseDatos()
  }, 1000)
})

onUnmounted(() => {
  if (intervaloBaseDatos) {
    clearInterval(intervaloBaseDatos)
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
.contenedor-consulta {
  background-color: var(--color-superficie);
  padding: 1rem;
  padding-bottom: 120px;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  max-width: 900px;
  margin: 20px auto;
}
.titulo-consulta {
  text-align: center;
  color: var(--color-primario);
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 1rem 0;
}
.bloque-buscador {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
  align-items: center;
  transition: all 0.35s ease;
}
.bloque-buscador :deep(.campo-contexto-articulo) {
  grid-column: 1 / -1;
  width: 100%;
  min-width: 0;
  margin-bottom: 0;
}
.bloque-buscador-con-resultado {
  margin-top: 0.4rem;
}
.campo-buscador {
  position: relative;
}
.input-buscador {
  width: 100%;
  padding: 14px 40px 14px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}
.boton-copiar-busqueda {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--color-texto-secundario);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  opacity: 0.6;
  transition: all 0.2s ease;
}
.boton-copiar-busqueda:hover {
  opacity: 1;
  color: var(--color-acento);
  transform: translateY(-50%) scale(1.08);
}
.input-buscador:focus {
  border-color: var(--color-primario);
}
.boton-camara {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  color: var(--color-texto-principal);
  width: 50px;
  height: 50px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.25s ease;
}
.boton-camara:hover {
  border-color: var(--color-primario);
}
.resultado-consulta {
  margin-top: 1rem;
}
.tarjeta-resultado {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 1rem;
}
.tarjeta-sl-neon {
  border-color: var(--color-neon-sl-borde);
  box-shadow: 0 0 12px var(--color-neon-sl-sombra), 0 0 24px var(--color-neon-sl-sombra);
}
.encabezado-resultado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.boton-compartir-whatsapp {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  cursor: pointer;
}
.boton-compartir-whatsapp:hover,
.boton-compartir-whatsapp:focus-visible {
  border-color: var(--color-primario);
  color: var(--color-primario-claro);
}
.etiqueta-resultado {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
.lista-historial-ubicaciones {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.4rem;
}
.valor-ubicacion {
  margin: 0;
  color: var(--color-primario);
  font-size: clamp(1.4rem, 6vw, 2.2rem);
  font-weight: 800;
  line-height: 1.05;
}
.texto-sl-neon {
  color: var(--color-neon-sl-texto);
  text-shadow: 0 0 8px var(--color-neon-sl-sombra), 0 0 16px var(--color-neon-sl-sombra);
}
.ubicacion-original {
  margin: 0.5rem 0 0.7rem 0;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}
.valor-nombre {
  margin: 0;
  color: var(--color-texto-principal);
  font-size: clamp(1rem, 4.5vw, 1.6rem);
  font-weight: 700;
}
.valor-codigo {
  margin: 0.3rem 0 0 0;
  color: var(--color-texto-secundario);
  font-size: clamp(0.95rem, 3.8vw, 1.1rem);
  font-weight: 600;
}
.valor-stock-excel {
  margin: 0.3rem 0 0 0;
  color: var(--color-texto-secundario);
  font-size: 0.95rem;
  font-weight: 600;
}
.boton-actualizar-ubicacion {
  margin-top: 0.75rem;
  width: 100%;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 8px;
  padding: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}
.boton-actualizar-ubicacion:hover {
  border-color: var(--color-primario);
}
.acciones-envio-consulta {
  display: grid;
  gap: 0.6rem;
  margin-top: 0.7rem;
}
.accion-desplegable-consulta {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
}
.boton-accion-consulta,
.boton-confirmar-envio {
  width: 100%;
  min-height: 44px;
  padding: 0.7rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-weight: 600;
  cursor: pointer;
}
.boton-accion-consulta:hover,
.boton-confirmar-envio:hover {
  border-color: var(--color-primario);
}
.boton-accion-consulta:disabled,
.boton-confirmar-envio:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.panel-envio-consulta {
  display: grid;
  gap: 0.65rem;
  min-width: 0;
  padding: 0.8rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
}
.panel-envio-consulta label {
  color: var(--color-texto-secundario);
  font-weight: 600;
}
.controles-copias-consulta {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  gap: 0.5rem;
}
.boton-cantidad-consulta {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  cursor: pointer;
}
.boton-cantidad-consulta:hover:not(:disabled) {
  border-color: var(--color-primario);
}
.boton-cantidad-consulta:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.input-copias-consulta {
  width: 100%;
  min-height: 44px;
  padding: 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
  text-align: center;
  appearance: textfield;
  -moz-appearance: textfield;
}
.input-copias-consulta::-webkit-outer-spin-button,
.input-copias-consulta::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.boton-confirmar-envio {
  background: var(--color-primario);
}
.editor-ubicacion {
  margin-top: 0.7rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.6rem;
  align-items: center;
}
.campo-editor {
  position: relative;
}
.input-ubicacion {
  width: 100%;
  padding: 14px 38px 14px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
  outline: none;
}
.input-ubicacion:focus {
  border-color: var(--color-primario);
}
.boton-limpiar-ubicacion {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--color-texto-secundario);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
}
.boton-guardar-ubicacion {
  background: var(--color-exito);
  color: var(--color-texto-principal);
  border: none;
  border-radius: 8px;
  padding: 14px 16px;
  font-weight: 700;
  cursor: pointer;
}
.mostrar-resultado-enter-active,
.mostrar-resultado-leave-active,
.mostrar-editor-enter-active,
.mostrar-editor-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.mostrar-resultado-enter-from,
.mostrar-resultado-leave-to,
.mostrar-editor-enter-from,
.mostrar-editor-leave-to {
  opacity: 0;
  transform: translateY(10px);
  max-height: 0;
}
.mostrar-resultado-enter-to,
.mostrar-resultado-leave-from,
.mostrar-editor-enter-to,
.mostrar-editor-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 900px;
}
@media (max-width: 600px) {
  .contenedor-consulta {
    padding: 0.75rem;
    margin: 12px;
  }
  .titulo-consulta {
    font-size: 1.6rem;
  }
  .editor-ubicacion {
    grid-template-columns: 1fr;
  }
}
</style>
