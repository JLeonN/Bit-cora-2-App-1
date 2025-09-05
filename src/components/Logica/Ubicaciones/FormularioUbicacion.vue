<template>
  <form class="formulario" @submit.prevent="gestionarEnvio">
    <div class="contenedor-principal-formulario">
      <!-- input codigo CON BUSCADOR -->
      <div class="ubicacion-campo ubicacion-campo-con-buscador">
        <input
          v-model="nuevoCodigo"
          type="text"
          :placeholder="placeholderCodigo"
          :class="{ 'input-error': errorCodigo, 'animar-error': animarErrorCodigo }"
          @animationend="animarErrorCodigo = false"
          @input="restablercerPlaceholderCodigo"
          @focus="enfocarInputCodigo"
          @blur="desenfocarInputCodigo"
        />

        <!-- Componente buscador -->
        <CodigoMasNombre
          v-if="mostrarBuscador"
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
          @input="restablercerPlaceholderUbicacion"
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
import { ref } from 'vue'
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

// --- NUEVAS VARIABLES PARA EL BUSCADOR ---
const inputCodigoEnfocado = ref(false)
const mostrarBuscador = ref(false)

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
  mostrarBuscador.value = false
}

// --- NUEVAS FUNCIONES PARA EL BUSCADOR ---
function enfocarInputCodigo() {
  inputCodigoEnfocado.value = true
  mostrarBuscador.value = true
}

function desenfocarInputCodigo() {
  // Pequeño delay para permitir el click en el buscador
  setTimeout(() => {
    inputCodigoEnfocado.value = false
    mostrarBuscador.value = false
  }, 200)
}

function seleccionarArticuloDelBuscador(articulo) {
  nuevoCodigo.value = articulo.codigo
  mostrarBuscador.value = false
  restablercerPlaceholderCodigo()
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

// --- LÓGICA DEL BOTÓN DE CÁMARA ---
function abrirCamara() {
  mostrarCamara.value = true
}
function cerrarCamara() {
  mostrarCamara.value = false
}
function procesarUbicacionesEscaneadas(ubicaciones) {
  // 'ubicaciones' es el array que nos envía el componente CamaraUbicaciones
  // [{ codigo: '...', ubicacion: '...' }, { ... }]

  // Iteramos sobre cada objeto del array y lo emitimos al componente padre
  // de la misma forma que lo hace el formulario manual.
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
/* Nuevo estilo para el campo con buscador */
.ubicacion-campo-con-buscador {
  position: relative;
  z-index: 50;
}
</style>
