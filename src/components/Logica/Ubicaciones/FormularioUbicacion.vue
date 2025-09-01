<template>
  <form class="formulario" @submit.prevent="gestionarEnvio">
    <div class="ubicacion-campo">
      <input
        v-model="nuevoCodigo"
        type="text"
        :placeholder="placeholderCodigo"
        :class="{ 'input-error': errorCodigo, 'animar-error': animarErrorCodigo }"
        @animationend="animarErrorCodigo = false"
        @input="restablercerPlaceholderCodigo"
      />
    </div>

    <div class="ubicacion-campo">
      <input
        v-model="nuevaUbicacion"
        type="text"
        :placeholder="placeholderUbicacion"
        :class="{ 'input-error': errorUbicacion, 'animar-error': animarErrorUbicacion }"
        @animationend="animarErrorUbicacion = false"
        @input="restablercerPlaceholderUbicacion"
        @blur="formatearUbicacion"
      />
    </div>

    <div class="contenedor-boton-agregar">
      <TresBotones :textoAceptar="'Agregar'" />
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import TresBotones from '../../Botones/TresBotones.vue'

// --- ESTADO LOCAL DEL FORMULARIO ---
const nuevoCodigo = ref('')
const nuevaUbicacion = ref('')

const placeholderCodigo = ref('Código del artículo')
const placeholderUbicacion = ref('Ubicación')

const errorCodigo = ref(false)
const animarErrorCodigo = ref(false)
const errorUbicacion = ref(false)
const animarErrorUbicacion = ref(false)

// --- Flag para prevenir doble click / doble submit ---
const bloqueandoClick = ref(false)

// --- EMITS ---
const emit = defineEmits(['ubicacion-agregada'])

// --- FUNCIONES INTERNAS ---
function restablercerPlaceholderCodigo() {
  errorCodigo.value = false
  placeholderCodigo.value = 'Código del artículo'
}

function restablercerPlaceholderUbicacion() {
  errorUbicacion.value = false
  placeholderUbicacion.value = 'Ubicación'
}

function limpiarFormulario() {
  nuevoCodigo.value = ''
  nuevaUbicacion.value = ''
  restablercerPlaceholderCodigo()
  restablercerPlaceholderUbicacion()
}

// --- Formatear ubicación al salir del input o al enviar ---
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
  // --- BLOQUEAMOS LA FUNCIÓN SI YA SE ESTÁ EJECUTANDO ---
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
</script>
