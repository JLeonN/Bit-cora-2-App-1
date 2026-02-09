<template>
  <form ref="formularioRef" class="formulario" @submit.prevent="gestionarEnvio">
    <div class="contenedor-principal-formulario">
      <!-- INPUT CÓDIGO CON BUSCADOR -->
      <div class="ubicacion-campo ubicacion-campo-con-buscador">
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
        />

        <!-- Componente buscador -->
        <CodigoMasNombre
          v-if="mostrarBuscador && nuevoCodigo.length >= 3"
          :busqueda="nuevoCodigo"
          @articulo-seleccionado="seleccionarArticuloDelBuscador"
        />
      </div>

      <!-- input ubicacion -->
      <div class="ubicacion-campo">
        <input
          ref="inputUbicacion"
          v-model="nuevaUbicacion"
          type="text"
          :placeholder="placeholderUbicacion"
          :class="{ 'input-error': errorUbicacion, 'animar-error': animarErrorUbicacion }"
          @animationend="animarErrorUbicacion = false"
          @input="restablecerPlaceholderUbicacion"
          @focus="manejarEnfoqueUbicacion"
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
        <!-- Botón de la cámara -->
        <button type="button" class="camara-ubicacion" @click="abrirCamara">
          <IconCamera :stroke="2" />
        </button>
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
import { IconCamera, IconTrash } from '@tabler/icons-vue'
import CamaraUbicaciones from './CamaraUbicaciones.vue'
import CodigoMasNombre from './CodigoMasNombre.vue'
import {
  guardarUltimaUbicacion,
  obtenerUltimaUbicacion,
  limpiarUltimaUbicacion,
} from './recordarUltimaTipografia.js'

// --- REFS DEL TEMPLATE ---
const formularioRef = ref(null)
const inputCodigo = ref(null)
const inputUbicacion = ref(null)

// --- ESTADO LOCAL DEL FORMULARIO ---
const nuevoCodigo = ref('')
const nuevaUbicacion = ref('')

const placeholderCodigo = ref('Código o nombre del artículo')
const placeholderUbicacion = ref('Ubicación')

const errorCodigo = ref(false)
const animarErrorCodigo = ref(false)
const errorUbicacion = ref(false)
const animarErrorUbicacion = ref(false)
const mostrarCamara = ref(false)

// --- ESTADO DEL BUSCADOR ---
const mostrarBuscador = ref(false)
const inputEnfocado = ref(false)

// --- Flag para prevenir doble click / doble submit ---
const bloqueandoClick = ref(false)

// --- EMITS ---
const emit = defineEmits(['ubicacion-agregada', 'modal-abierto', 'modal-cerrado'])

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
function normalizarCodigo(codigo) {
  if (!codigo) return ''

  // 1. Convertir a mayúsculas
  let codigoLimpio = codigo.toUpperCase()

  // 2. Reemplazar cualquier carácter que NO sea letra, número, Ñ, espacio o guión por un guión
  codigoLimpio = codigoLimpio.replace(/[^A-Z0-9Ñ -]/g, '-')

  // 3. Evitar guiones múltiples seguidos
  codigoLimpio = codigoLimpio.replace(/-+/g, '-')

  // 4. Evitar espacios múltiples seguidos
  codigoLimpio = codigoLimpio.replace(/\s+/g, ' ')

  return codigoLimpio
}

// --- FUNCIÓN PARA LIMPIAR UBICACIÓN RECORDADA ---
async function limpiarUbicacionRecordada() {
  nuevaUbicacion.value = ''
  await limpiarUltimaUbicacion()
  console.log('[FormularioUbicacion] Ubicación recordada limpiada')
}

// --- FUNCIÓN DE SCROLL AUTOMÁTICO ---
function moverFormularioArriba() {
  if (!formularioRef.value) return

  const rect = formularioRef.value.getBoundingClientRect()
  const offset = 82 // píxeles desde arriba

  window.scrollTo({
    top: window.scrollY + rect.top - offset,
    behavior: 'smooth',
  })
}

// --- FUNCIONES DEL BUSCADOR Y ENFOQUE ---
function manejarInputCodigo(evento) {
  const valorOriginal = evento.target.value
  const valorNormalizado = normalizarCodigo(valorOriginal)

  // Solo actualizar si cambió algo
  if (valorOriginal !== valorNormalizado) {
    nuevoCodigo.value = valorNormalizado
    // Mantener el cursor en la posición correcta
    nextTick(() => {
      if (inputCodigo.value) {
        inputCodigo.value.setSelectionRange(valorNormalizado.length, valorNormalizado.length)
      }
    })
  }

  restablecerPlaceholderCodigo()

  // Si hay texto y el input está enfocado, mostrar buscador
  if (inputEnfocado.value && nuevoCodigo.value.length >= 3) {
    mostrarBuscador.value = true
  } else {
    mostrarBuscador.value = false
  }
}

function manejarEnfoqueCodigo() {
  inputEnfocado.value = true

  // Solo scroll automático, sin anclar
  moverFormularioArriba()

  // Si ya hay texto suficiente, mostrar buscador inmediatamente
  if (nuevoCodigo.value.length >= 3) {
    mostrarBuscador.value = true
  }
}

function manejarDesenfoqueCodigo() {
  inputEnfocado.value = false

  // Delay para permitir el click en las opciones del buscador
  setTimeout(() => {
    if (!inputEnfocado.value) {
      mostrarBuscador.value = false
    }
  }, 200)
}

function manejarEnfoqueUbicacion() {
  // Solo scroll automático, sin anclar
  moverFormularioArriba()
}

function manejarDesenfoqueUbicacion() {
  formatearUbicacion()
}

function seleccionarArticuloDelBuscador(articulo) {
  nuevoCodigo.value = articulo.codigo
  mostrarBuscador.value = false
  inputEnfocado.value = false
  restablecerPlaceholderCodigo()

  // Enfocar el siguiente input (ubicación)
  nextTick(() => {
    if (inputUbicacion.value) {
      inputUbicacion.value.focus()
    }
  })
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
  emit('ubicacion-agregada', {
    codigo: nuevoCodigo.value.trim().toUpperCase(),
    ubicacion: nuevaUbicacion.value.trim().toUpperCase(),
  })

  // Limpiar solo el código, mantener la ubicación para el próximo
  nuevoCodigo.value = ''
  restablecerPlaceholderCodigo()
  mostrarBuscador.value = false

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
  // CARGAR ÚLTIMA UBICACIÓN AL INICIAR
  const ultimaUbicacion = await obtenerUltimaUbicacion()
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
</script>
