<template>
  <form class="formulario" @submit.prevent="gestionarEnvio">
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
          @focus="activarBuscador"
          @blur="desactivarBuscador"
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
          v-model="nuevaUbicacion"
          type="text"
          :placeholder="placeholderUbicacion"
          :class="{ 'input-error': errorUbicacion, 'animar-error': animarErrorUbicacion }"
          @animationend="animarErrorUbicacion = false"
          @input="restablecerPlaceholderUbicacion"
          @blur="formatearUbicacion"
        />
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
  />
</template>

<script setup>
import { ref, nextTick } from 'vue'
import TresBotones from '../../Botones/TresBotones.vue'
import { IconCamera } from '@tabler/icons-vue'
import CamaraUbicaciones from './CamaraUbicaciones.vue'
import CodigoMasNombre from './CodigoMasNombre.vue'

// --- ESTADO LOCAL DEL FORMULARIO ---
const nuevoCodigo = ref('')
const nuevaUbicacion = ref('')

const placeholderCodigo = ref('Código del artículo')
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
const emit = defineEmits(['ubicacion-agregada'])

// --- FUNCIONES INTERNAS ---
function restablecerPlaceholderCodigo() {
  errorCodigo.value = false
  placeholderCodigo.value = 'Código del artículo'
}

function restablecerPlaceholderUbicacion() {
  errorUbicacion.value = false
  placeholderUbicacion.value = 'Ubicación'
}

function limpiarFormulario() {
  nuevoCodigo.value = ''
  nuevaUbicacion.value = ''
  restablecerPlaceholderCodigo()
  restablecerPlaceholderUbicacion()
  mostrarBuscador.value = false
}

// --- FUNCIONES DEL BUSCADOR ---
function manejarInputCodigo() {
  restablecerPlaceholderCodigo()
  // Si hay texto y el input está enfocado, mostrar buscador
  if (inputEnfocado.value && nuevoCodigo.value.length >= 3) {
    mostrarBuscador.value = true
  } else {
    mostrarBuscador.value = false
  }
}

function activarBuscador() {
  inputEnfocado.value = true
  // Si ya hay texto suficiente, mostrar buscador inmediatamente
  if (nuevoCodigo.value.length >= 3) {
    mostrarBuscador.value = true
  }
}

function desactivarBuscador() {
  inputEnfocado.value = false
  // Delay para permitir el click en las opciones del buscador
  setTimeout(() => {
    if (!inputEnfocado.value) {
      mostrarBuscador.value = false
    }
  }, 200)
}

function seleccionarArticuloDelBuscador(articulo) {
  nuevoCodigo.value = articulo.codigo
  mostrarBuscador.value = false
  inputEnfocado.value = false
  restablecerPlaceholderCodigo()

  // Enfocar el siguiente input (ubicación)
  nextTick(() => {
    const inputUbicacion = document.querySelector(
      'input[placeholder*="ubicación"], input[placeholder*="Ubicación"]',
    )
    if (inputUbicacion) {
      inputUbicacion.focus()
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
function gestionarEnvio() {
  if (bloqueandoClick.value) return
  bloqueandoClick.value = true

  let valido = true
  if (!nuevoCodigo.value.trim()) {
    errorCodigo.value = true
    animarErrorCodigo.value = true
    placeholderCodigo.value = 'Ingresar un código'
    valido = false
  }
  if (!nuevaUbicacion.value.trim()) {
    errorUbicacion.value = true
    animarErrorUbicacion.value = true
    placeholderUbicacion.value = 'Ingresar una ubicación'
    valido = false
  }

  // Si no es válido, detenemos la ejecución.
  if (!valido) {
    setTimeout(() => (bloqueandoClick.value = false), 100)
    return
  }

  // --- FORMATEAMOS LA UBICACIÓN ANTES DE ENVIAR ---
  formatearUbicacion()

  // Emitimos los datos al padre
  emit('ubicacion-agregada', {
    codigo: nuevoCodigo.value.trim().toUpperCase(),
    ubicacion: nuevaUbicacion.value.trim().toUpperCase(),
  })

  // Limpiamos el formulario
  limpiarFormulario()

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
</script>

<style scoped>
/* --- ESTILO PARA EL CAMPO CON BUSCADOR --- */
.ubicacion-campo-con-buscador {
  position: relative;
  z-index: 50;
}

/* --- ASEGURAR QUE EL CONTENEDOR PRINCIPAL TENGA ESPACIO --- */
.contenedor-principal-formulario {
  position: relative;
}

/* --- MEJORAR SPACING EN MOBILE --- */
@media (max-width: 600px) {
  .ubicacion-campo-con-buscador {
    margin-bottom: 8px;
  }
}
</style>
