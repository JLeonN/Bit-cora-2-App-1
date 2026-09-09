<template>
  <section class="formulario-listado">
    <SelectorExcel
      v-if="!baseDatosCargada"
      @base-datos-cargada="manejarBaseCargada"
      @error-carga="emit('error-carga', $event)"
      @base-datos-limpia="manejarBaseLimpia"
    />
    <div v-else class="formulario formulario-ubicacion">
      <div class="contenedor-principal-formulario">
        <div class="ubicacion-campo ubicacion-campo-con-buscador">
          <div class="fila-codigo-camara">
            <div class="contenedor-input-codigo">
              <input
                ref="inputBusquedaRef"
                v-model="busquedaArticulo"
                class="campo-entrada-formulario"
                type="text"
                placeholder="Código o descripción del artículo"
                :disabled="deshabilitado"
                @focus="mostrarBuscador = true"
                @blur="ocultarBuscadorConDemora"
                @input="normalizarBusqueda"
                @keyup.enter="resolverBusqueda"
              />
              <CodigoMasNombre
                v-if="mostrarBuscador && busquedaArticulo.length >= 3"
                :busqueda="busquedaArticulo"
                @articulo-seleccionado="seleccionarArticulo"
                @estado-busqueda="estadoBusqueda = $event"
              />
            </div>
            <button
              type="button"
              class="camara-ubicacion"
              title="Escanear con cámara"
              :disabled="deshabilitado"
              @click="abrirCamara"
            >
              <IconCamera :size="22" :stroke="2" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <CamaraEscaneo
      v-if="mostrarCamara"
      :escaneo-unico="true"
      @finalizar="procesarEscaneo"
      @cancelar="cerrarCamara"
      @modal-abierto="emit('modal-abierto')"
      @modal-cerrado="emit('modal-cerrado')"
    />
  </section>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { IconCamera } from '@tabler/icons-vue'
import SelectorExcel from '../Ubicaciones/SelectorExcel.vue'
import CodigoMasNombre from '../Ubicaciones/CodigoMasNombre.vue'
import CamaraEscaneo from '../Ubicaciones/CamaraEscaneo.vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'
import {
  normalizarCodigoBusqueda,
  obtenerArticuloPorCodigoEscaneado,
} from '../Compartidos/CodigoEscaner.js'
import { normalizarInputPreservandoCursor } from '../Compartidos/NormalizarInputCursor.js'

defineProps({ deshabilitado: { type: Boolean, default: false } })
const emit = defineEmits([
  'articulo-seleccionado',
  'base-datos-cargada',
  'base-datos-limpia',
  'error-carga',
  'modal-abierto',
  'modal-cerrado',
])
const busquedaArticulo = ref('')
const mostrarBuscador = ref(false)
const mostrarCamara = ref(false)
const estadoBusqueda = ref({ articuloUnico: null })
const baseDatosCargada = ref(false)
const inputBusquedaRef = ref(null)

function manejarBaseCargada(datos) {
  baseDatosCargada.value = true
  emit('base-datos-cargada', datos)
  enfocarBusqueda()
}

function manejarBaseLimpia() {
  baseDatosCargada.value = false
  emit('base-datos-limpia')
}

function establecerBaseCargada(cargada) {
  baseDatosCargada.value = Boolean(cargada)
}

function normalizarBusqueda(evento) {
  normalizarInputPreservandoCursor({
    evento,
    normalizarValor: normalizarCodigoBusqueda,
    asignarValor: (valor) => {
      busquedaArticulo.value = valor
    },
    referenciaInput: inputBusquedaRef,
  })
  mostrarBuscador.value = true
}

function resolverBusqueda(valor = busquedaArticulo.value) {
  const articuloExacto = obtenerArticuloPorCodigoEscaneado(obtenerArticulosCargados(), valor)
  if (articuloExacto) {
    seleccionarArticulo(articuloExacto)
    return
  }
  if (estadoBusqueda.value?.articuloUnico) seleccionarArticulo(estadoBusqueda.value.articuloUnico)
}

function seleccionarArticulo(articulo) {
  emit('articulo-seleccionado', articulo)
  busquedaArticulo.value = ''
  mostrarBuscador.value = false
  enfocarBusqueda()
}

function procesarEscaneo(codigos) {
  cerrarCamara()
  const codigo = codigos?.[0]
  if (codigo) resolverBusqueda(codigo)
}

function abrirCamara() {
  mostrarBuscador.value = false
  mostrarCamara.value = true
}

function cerrarCamara() {
  mostrarCamara.value = false
}

function ocultarBuscadorConDemora() {
  window.setTimeout(() => {
    mostrarBuscador.value = false
  }, 180)
}

async function enfocarBusqueda() {
  await nextTick()
  inputBusquedaRef.value?.focus()
}

function cerrarInteraccion() {
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

defineExpose({ cerrarInteraccion, enfocarBusqueda, establecerBaseCargada })
</script>

<style scoped>
.formulario-listado {
  position: relative;
}
.formulario-listado :deep(.formulario-ubicacion) {
  padding-bottom: 0;
}
</style>
