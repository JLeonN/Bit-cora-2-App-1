<template>
  <form class="formulario formulario-ubicacion" @submit.prevent="gestionarEnvio">
    <div class="contenedor-principal-formulario">
      <!-- INPUT CÓDIGO CON BUSCADOR -->
      <div class="ubicacion-campo ubicacion-campo-con-buscador">
        <CampoContextoArticulo
          id-campo="contexto-ubicaciones"
          :model-value="contextoBusqueda"
          @update:model-value="actualizarContextoBusqueda"
        />
        <ControlAutoseleccionArticulo
          :model-value="autoseleccionArticuloHabilitada"
          texto-ayuda="Cuando está activada, si la búsqueda encuentra un solo artículo, se selecciona automáticamente y muestra su información. Si está desactivada, podrás elegirlo manualmente desde la lista. Se recomienda activarla con lectores de códigos de barras tipo pistola: suelen enviar Enter al terminar la lectura y dejan el artículo listo para agregar."
          @update:model-value="cambiarAutoseleccionArticulo"
        />
        <div class="fila-codigo-camara">
          <div class="contenedor-input-codigo">
            <input
              ref="inputCodigo"
              v-model="nuevoCodigo"
              type="text"
              :placeholder="placeholderCodigo"
              :class="{ 'input-error': errorCodigo, 'animar-error': animarErrorCodigo }"
              @animationend="animarErrorCodigo = false"
              @input="manejarInputCodigo"
              @focus="manejarEnfoqueCodigo"
              @blur="manejarDesenfoqueCodigo"
              @keydown="manejarDobleEspacio"
            />
            <button
              v-if="nuevoCodigo"
              type="button"
              class="boton-copiar-codigo"
              title="Copiar texto"
              @click="copiarCodigoActual"
            >
              <IconCopy :size="16" />
            </button>

            <!-- Componente buscador -->
            <BuscadorArticulos
              v-if="mostrarBuscador && nuevoCodigo.length >= 3"
              :busqueda="nuevoCodigo"
              :contexto-busqueda="contextoBusqueda"
              @articulo-seleccionado="seleccionarArticuloDelBuscador"
              @estado-busqueda="manejarEstadoBuscador"
            />
          </div>
          <button
            type="button"
            class="camara-ubicacion"
            title="Escanear ubicaciones"
            @click="abrirCamara"
          >
            <IconCamera :stroke="2" />
          </button>
        </div>
      </div>
      <div
        v-if="articuloSeleccionadoInfo"
        class="tarjeta-info-articulo"
        :class="{ 'tarjeta-sl-neon': articuloSeleccionadoInfo.ubicacionOriginal === 'SL' }"
      >
        <div class="encabezado-info-articulo">
          <p class="titulo-info-articulo">Artículo seleccionado</p>
          <button
            type="button"
            class="boton-cerrar-info-articulo"
            title="Cerrar artículo seleccionado"
            @click="cerrarTarjetaArticuloSeleccionado"
          >
            <span aria-hidden="true" class="texto-cerrar-info-articulo">×</span>
          </button>
        </div>
        <p class="nombre-articulo-seleccionado">{{ articuloSeleccionadoInfo.nombre }}</p>
        <p class="codigo-articulo-seleccionado">{{ articuloSeleccionadoInfo.codigo }}</p>
        <p class="linea-info-articulo linea-origen-excel">
          <span class="etiqueta-info-articulo">Original Excel:</span>
          <span
            class="valor-origen-excel"
            :class="{ 'texto-sl-neon': articuloSeleccionadoInfo.ubicacionOriginal === 'SL' }"
          >
            {{ articuloSeleccionadoInfo.ubicacionOriginal || 'Sin ubicación' }}
          </span>
        </p>
        <p class="linea-info-articulo linea-historial">
          <span class="etiqueta-info-articulo">Historial:</span>
          <span
            v-for="(
              ubicacionHistorial, indiceHistorial
            ) in articuloSeleccionadoInfo.historialVisual"
            :key="'historial-' + indiceHistorial"
            class="chip-historial-ubicacion"
            :class="{
              'texto-sl-neon':
                ubicacionHistorial === 'SL' && articuloSeleccionadoInfo.ubicacionOriginal === 'SL',
            }"
          >
            {{ ubicacionHistorial }}
          </span>
        </p>
        <p class="linea-info-articulo">
          <span class="etiqueta-info-articulo">Stock del Excel:</span>
          {{ articuloSeleccionadoInfo.stockExcel || 'Sin stock' }}
        </p>
      </div>

      <!-- input ubicacion -->
      <div class="ubicacion-campo">
        <input
          ref="inputUbicacion"
          v-model="nuevaUbicacion"
          type="text"
          class="sin-enfoque-automatico"
          :placeholder="placeholderUbicacion"
          :class="{ 'input-error': errorUbicacion, 'animar-error': animarErrorUbicacion }"
          @animationend="animarErrorUbicacion = false"
          @input="restablecerPlaceholderUbicacion"
          @blur="manejarDesenfoqueUbicacion"
        />

        <!-- Botón para limpiar ubicación -->
        <button
          v-if="nuevaUbicacion"
          type="button"
          class="boton-limpiar-ubicacion"
          @click="limpiarUbicacionRecordada"
          title="Limpiar ubicación"
        >
          <IconTrash :size="16" />
        </button>
      </div>

      <div class="contenedor-botones-accion">
        <!-- Botón Agregar -->
        <div class="contenedor-boton-agregar">
          <TresBotones :textoAceptar="'Agregar'" />
        </div>
      </div>
    </div>
  </form>

  <CamaraUbicaciones
    v-if="mostrarCamara"
    @cancelar="cerrarCamara"
    @finalizar="procesarUbicacionesEscaneadas"
    @modal-abierto="manejarModalAbierto"
    @modal-cerrado="manejarModalCerrado"
  />
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import TresBotones from '../../Botones/TresBotones.vue'
import { IconCamera, IconTrash, IconCopy } from '@tabler/icons-vue'
import CamaraUbicaciones from './CamaraUbicaciones.vue'
import BuscadorArticulos from '../Compartidos/BuscadorArticulos.vue'
import CampoContextoArticulo from '../Compartidos/CampoContextoArticulo.vue'
import ControlAutoseleccionArticulo from '../Compartidos/ControlAutoseleccionArticulo.vue'
import { normalizarInputPreservandoCursor } from '../Compartidos/NormalizarInputCursor.js'
import {
  manejarDobleEspacioInput,
  normalizarInputArticulo,
} from '../Compartidos/InputArticuloInteligente.js'
import { usarTextoCopiadoInput } from '../Compartidos/UsoTextoCopiadoInput.js'
import {
  AMBITOS_CONTEXTO_ARTICULO,
  obtenerContextoArticulo,
  guardarContextoArticulo,
} from '../../BaseDeDatos/UsoAlmacenamientoContextosArticulo.js'
import {
  guardarUltimaUbicacion,
  obtenerUltimaUbicacion,
  limpiarUltimaUbicacion,
  guardarAutoseleccionArticulo,
  obtenerAutoseleccionArticulo,
} from './recordarUltimaTipografia.js'

// --- REFS DEL TEMPLATE ---
const inputCodigo = ref(null)
const inputUbicacion = ref(null)

// --- ESTADO LOCAL DEL FORMULARIO ---
const nuevoCodigo = ref('')
const contextoBusqueda = ref('')
const nuevaUbicacion = ref('')

const placeholderCodigo = ref('Código o nombre del artículo')
const placeholderUbicacion = ref('Ubicación')

const errorCodigo = ref(false)
const animarErrorCodigo = ref(false)
const errorUbicacion = ref(false)
const animarErrorUbicacion = ref(false)
const mostrarCamara = ref(false)

// --- Control de doble espacio ---
const ultimoEspacioTiempo = ref(0)

// --- ESTADO DEL BUSCADOR ---
const mostrarBuscador = ref(false)
const inputEnfocado = ref(false)
const seleccionRecienteDesdeBuscador = ref(false)
const articuloSeleccionadoInfo = ref(null)
const origenSeleccionActual = ref('ninguno')
const mantenerBuscadorVisible = ref(false)
const autoseleccionandoCodigo = ref(false)
const autoseleccionArticuloHabilitada = ref(false)
const { copiarTextoActual, obtenerTextoCopiado } = usarTextoCopiadoInput('FormularioUbicacion')

// --- Flag para prevenir doble click / doble submit ---
const bloqueandoClick = ref(false)

// --- EMITS ---
const emit = defineEmits(['ubicacion-agregada', 'modal-abierto', 'modal-cerrado'])

async function actualizarContextoBusqueda(valor) {
  contextoBusqueda.value = valor
  try {
    await guardarContextoArticulo(AMBITOS_CONTEXTO_ARTICULO.UBICACIONES, valor)
  } catch (error) {
    console.error('[FormularioUbicacion] No se pudo guardar el contexto:', error)
  }
}

// --- FUNCIONES INTERNAS ---
function restablecerPlaceholderCodigo() {
  errorCodigo.value = false
  placeholderCodigo.value = 'Código del artículo'
}

function restablecerPlaceholderUbicacion() {
  errorUbicacion.value = false
  placeholderUbicacion.value = 'Ubicación'
}

// --- FUNCIÓN PARA NORMALIZAR CÓDIGO ---
// --- FUNCIÓN PARA MANEJAR DOBLE ESPACIO ---
function manejarDobleEspacio(evento) {
  ultimoEspacioTiempo.value = manejarDobleEspacioInput({
    evento,
    valorActual: nuevoCodigo.value,
    asignarValor: (valor) => {
      nuevoCodigo.value = valor
    },
    referenciaInput: inputCodigo,
    ultimoEspacioTiempo: ultimoEspacioTiempo.value,
  })
}

// --- FUNCIÓN PARA LIMPIAR UBICACIÓN RECORDADA ---
async function limpiarUbicacionRecordada() {
  nuevaUbicacion.value = ''
  await limpiarUltimaUbicacion()
  console.log('[FormularioUbicacion] Ubicación recordada limpiada')
}

// --- FUNCIONES DEL BUSCADOR Y ENFOQUE ---
function manejarInputCodigo(evento) {
  normalizarInputPreservandoCursor({
    evento,
    normalizarValor: normalizarInputArticulo,
    asignarValor: (valor) => {
      nuevoCodigo.value = valor
    },
    referenciaInput: inputCodigo,
  })

  restablecerPlaceholderCodigo()
  seleccionRecienteDesdeBuscador.value = false
  if (autoseleccionandoCodigo.value) return
  const codigoActual = nuevoCodigo.value.trim().toUpperCase()
  const seleccionManualConCodigoDistinto =
    origenSeleccionActual.value === 'manual' &&
    articuloSeleccionadoInfo.value &&
    codigoActual !== articuloSeleccionadoInfo.value.codigo
  if (seleccionManualConCodigoDistinto) {
    articuloSeleccionadoInfo.value = null
    origenSeleccionActual.value = 'ninguno'
    mantenerBuscadorVisible.value = false
  }

  // Si hay texto y el input está enfocado, mostrar buscador
  if (inputEnfocado.value && nuevoCodigo.value.length >= 3) {
    mostrarBuscador.value = true
  } else {
    mostrarBuscador.value = false
  }
}

function manejarEnfoqueCodigo() {
  inputEnfocado.value = true
  if (seleccionRecienteDesdeBuscador.value) {
    nextTick(() => {
      inputCodigo.value?.select()
    })
    seleccionRecienteDesdeBuscador.value = false
  }

  // Si ya hay texto suficiente, mostrar buscador inmediatamente
  if (nuevoCodigo.value.length >= 3) {
    mostrarBuscador.value = true
  }
}

function manejarDesenfoqueCodigo() {
  inputEnfocado.value = false

  // Delay para permitir el click en las opciones del buscador
  setTimeout(() => {
    if (!inputEnfocado.value && !mantenerBuscadorVisible.value) {
      mostrarBuscador.value = false
    }
  }, 200)
}

async function copiarCodigoActual() {
  await copiarTextoActual(nuevoCodigo.value)
}

function manejarDesenfoqueUbicacion() {
  formatearUbicacion()
}

function construirInfoArticulo(articulo) {
  const historial = Array.isArray(articulo.historialUbicaciones)
    ? articulo.historialUbicaciones
    : []
  return {
    nombre: articulo.nombre,
    codigo: articulo.codigo,
    ubicacionOriginal: articulo.ubicacionAntigua || '',
    stockExcel: articulo.stock || '',
    historialVisual:
      historial.length > 0
        ? [...historial].reverse()
        : [articulo.ubicacionAntigua || 'SIN UBICACION'],
  }
}

function seleccionarArticuloDelBuscador(articulo, opciones = {}) {
  const { esAutoseleccion = false } = opciones
  autoseleccionandoCodigo.value = esAutoseleccion
  nuevoCodigo.value = articulo.codigo
  articuloSeleccionadoInfo.value = construirInfoArticulo(articulo)
  origenSeleccionActual.value = esAutoseleccion ? 'automatica' : 'manual'
  seleccionRecienteDesdeBuscador.value = true
  mantenerBuscadorVisible.value = esAutoseleccion
  mostrarBuscador.value = esAutoseleccion ? true : false
  inputEnfocado.value = false
  restablecerPlaceholderCodigo()
  autoseleccionandoCodigo.value = false

  // Si fue selección manual por click, enfocar ubicación para acelerar carga.
  if (!esAutoseleccion) {
    nextTick(() => {
      if (inputUbicacion.value) {
        inputUbicacion.value.focus()
      }
    })
  }
}

function cerrarTarjetaArticuloSeleccionado() {
  articuloSeleccionadoInfo.value = null
  origenSeleccionActual.value = 'ninguno'
  seleccionRecienteDesdeBuscador.value = false
  mantenerBuscadorVisible.value = false
  autoseleccionandoCodigo.value = false
  mostrarBuscador.value = false
  nuevoCodigo.value = ''
  restablecerPlaceholderCodigo()
  nextTick(() => {
    inputCodigo.value?.focus()
  })
}

async function cambiarAutoseleccionArticulo(habilitada) {
  autoseleccionArticuloHabilitada.value = Boolean(habilitada)
  await guardarAutoseleccionArticulo(autoseleccionArticuloHabilitada.value)

  if (!autoseleccionArticuloHabilitada.value && origenSeleccionActual.value === 'automatica') {
    articuloSeleccionadoInfo.value = null
    origenSeleccionActual.value = 'ninguno'
    mantenerBuscadorVisible.value = false
    mostrarBuscador.value = inputEnfocado.value && nuevoCodigo.value.length >= 3
  }
}

function manejarEstadoBuscador(estado) {
  if (!estado) return

  const busquedaValida = estado.busquedaValida && estado.baseDatosCargada
  if (!busquedaValida) {
    if (origenSeleccionActual.value === 'automatica') {
      articuloSeleccionadoInfo.value = null
      origenSeleccionActual.value = 'ninguno'
      mantenerBuscadorVisible.value = false
    }
    return
  }

  if (estado.cantidadResultados === 1 && estado.articuloUnico) {
    if (!autoseleccionArticuloHabilitada.value) {
      if (origenSeleccionActual.value === 'automatica') {
        articuloSeleccionadoInfo.value = null
        origenSeleccionActual.value = 'ninguno'
      }
      mantenerBuscadorVisible.value = false
      return
    }

    const codigoUnico = (estado.articuloUnico.codigo || '').toUpperCase()
    const seleccionadoActual = articuloSeleccionadoInfo.value?.codigo || ''

    if (seleccionadoActual !== codigoUnico) {
      seleccionarArticuloDelBuscador(estado.articuloUnico, { esAutoseleccion: true })
    }
    return
  }

  if (origenSeleccionActual.value === 'automatica') {
    articuloSeleccionadoInfo.value = null
    origenSeleccionActual.value = 'ninguno'
  }
  mantenerBuscadorVisible.value = false
}

// --- Formatear ubicación ---
function formatearUbicacion() {
  if (!nuevaUbicacion.value) return

  // Eliminamos espacios al inicio y final
  let texto = nuevaUbicacion.value.trim()
  // Reemplazamos espacios intermedios por guiones
  texto = texto.replace(/\s+/g, '-')
  nuevaUbicacion.value = texto
}

// --- LÓGICA DE ENVÍO Y VALIDACIÓN ---
async function gestionarEnvio() {
  if (bloqueandoClick.value) return
  bloqueandoClick.value = true

  let valido = true
  if (!nuevoCodigo.value.trim()) {
    errorCodigo.value = true
    animarErrorCodigo.value = true
    placeholderCodigo.value = 'Ingresar código o nombre'
    valido = false
  }
  if (!nuevaUbicacion.value.trim()) {
    errorUbicacion.value = true
    animarErrorUbicacion.value = true
    placeholderUbicacion.value = 'Ingresar una ubicación'
    valido = false
  }

  // Si no es válido, detenemos la ejecución
  if (!valido) {
    setTimeout(() => (bloqueandoClick.value = false), 100)
    return
  }

  // --- FORMATEAMOS LA UBICACIÓN ANTES DE ENVIAR ---
  formatearUbicacion()

  // GUARDAR LA ÚLTIMA UBICACIÓN ANTES DE EMITIR
  await guardarUltimaUbicacion(nuevaUbicacion.value)

  // Emitimos los datos al padre
  const codigoSeleccionado = articuloSeleccionadoInfo.value?.codigo || ''
  const codigoParaEnviar = codigoSeleccionado || nuevoCodigo.value.trim().toUpperCase()
  emit('ubicacion-agregada', {
    codigo: codigoParaEnviar,
    ubicacion: nuevaUbicacion.value.trim().toUpperCase(),
  })

  // Limpiar solo el código, mantener la ubicación para el próximo
  nuevoCodigo.value = ''
  articuloSeleccionadoInfo.value = null
  origenSeleccionActual.value = 'ninguno'
  seleccionRecienteDesdeBuscador.value = false
  mantenerBuscadorVisible.value = false
  restablecerPlaceholderCodigo()
  mostrarBuscador.value = false

  // Si el usuario copió un código/nombre, reponerlo automáticamente al agregar.
  const textoCopiado = obtenerTextoCopiado()
  if (textoCopiado) {
    nuevoCodigo.value = textoCopiado
  }

  // Volver al input de código para carga rápida en serie
  nextTick(() => {
    inputCodigo.value?.focus()
  })

  // --- DESBLOQUEAMOS EL CLICK ---
  setTimeout(() => (bloqueandoClick.value = false), 100)
}

// --- LÓGICA DEL BOTÓN DE CÁMARA ---
function abrirCamara() {
  mostrarCamara.value = true
  mostrarBuscador.value = false // Ocultar buscador si está abierto
}

function cerrarCamara() {
  mostrarCamara.value = false
}

function cerrarPasoAtrasNativo() {
  if (mostrarCamara.value) {
    cerrarCamara()
    return true
  }
  if (mostrarBuscador.value) {
    mostrarBuscador.value = false
    return true
  }
  return false
}

function procesarUbicacionesEscaneadas(ubicaciones) {
  for (const item of ubicaciones) {
    emit('ubicacion-agregada', {
      codigo: item.codigo, // Ya viene en mayúsculas desde la cámara
      ubicacion: item.ubicacion, // Ya viene en mayúsculas desde la cámara
    })
  }
  // Cerramos la cámara después de procesar
  cerrarCamara()
}

// --- LIFECYCLE ---
onMounted(async () => {
  const [ultimaUbicacion, autoseleccionGuardada, contextoGuardado] = await Promise.all([
    obtenerUltimaUbicacion(),
    obtenerAutoseleccionArticulo(),
    obtenerContextoArticulo(AMBITOS_CONTEXTO_ARTICULO.UBICACIONES),
  ])
  autoseleccionArticuloHabilitada.value = autoseleccionGuardada
  contextoBusqueda.value = contextoGuardado

  // CARGAR ÚLTIMA UBICACIÓN AL INICIAR
  if (ultimaUbicacion) {
    nuevaUbicacion.value = ultimaUbicacion
    console.log(`[FormularioUbicacion] Cargada última ubicación: ${ultimaUbicacion}`)
  }
})

const manejarModalAbierto = () => {
  emit('modal-abierto')
}

const manejarModalCerrado = () => {
  emit('modal-cerrado')
}

defineExpose({
  cerrarPasoAtrasNativo,
})
</script>
