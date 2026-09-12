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
          <CampoContextoArticulo
            id-campo="contexto-listado"
            :model-value="contextoBusqueda"
            :deshabilitado="busquedaDeshabilitada"
            @update:model-value="emit('actualizar-contexto', $event)"
          />
          <ControlAutoseleccionArticulo
            :model-value="autoseleccionArticuloHabilitada"
            texto-ayuda="Cuando está activada, si la búsqueda encuentra un solo artículo, se agrega automáticamente al listado. Si está desactivada, podrás elegirlo manualmente desde la lista. Se recomienda activarla con lectores de códigos de barras tipo pistola."
            @update:model-value="cambiarAutoseleccionArticulo"
          />
          <div class="fila-codigo-camara">
            <div class="contenedor-input-codigo">
              <input
                ref="inputBusquedaRef"
                v-model="busquedaArticulo"
                class="campo-entrada-formulario"
                type="text"
                placeholder="Código o descripción del artículo"
                :disabled="busquedaDeshabilitada"
                @focus="mostrarBuscador = true"
                @blur="ocultarBuscadorConDemora"
                @input="normalizarBusqueda"
                @keydown="manejarDobleEspacio"
                @keyup.enter="resolverBusqueda"
              />
              <button
                v-if="busquedaArticulo"
                type="button"
                class="boton-copiar-codigo"
                title="Copiar texto"
                :disabled="busquedaDeshabilitada"
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
            <button
              type="button"
              class="camara-ubicacion"
              title="Escanear con cámara"
              :disabled="busquedaDeshabilitada"
              @click="abrirCamara"
            >
              <IconCamera :size="22" :stroke="2" />
            </button>
          </div>
          <div
            v-if="articuloRepetido"
            class="aviso-articulo-repetido"
            role="alert"
            aria-live="polite"
          >
            <div class="datos-articulo-repetido">
              <strong>{{ articuloRepetido.nombre }}</strong>
              <span>{{ articuloRepetido.codigo }}</span>
            </div>
            <p>
              Este artículo ya aparece en {{ textoLineasRepetidas }}. ¿Querés agregarlo igualmente?
            </p>
            <div class="acciones-articulo-repetido">
              <button
                type="button"
                class="boton-confirmar-repetido"
                @click="emit('confirmar-repetido')"
              >
                Sí, agregar
              </button>
              <button
                type="button"
                class="boton-cancelar-repetido"
                @click="emit('cancelar-repetido')"
              >
                No
              </button>
            </div>
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
import { computed, nextTick, onMounted, ref } from 'vue'
import { IconCamera, IconCopy } from '@tabler/icons-vue'
import SelectorExcel from '../Ubicaciones/SelectorExcel.vue'
import BuscadorArticulos from '../Compartidos/BuscadorArticulos.vue'
import CampoContextoArticulo from '../Compartidos/CampoContextoArticulo.vue'
import CamaraEscaneo from '../Ubicaciones/CamaraEscaneo.vue'
import ControlAutoseleccionArticulo from '../Compartidos/ControlAutoseleccionArticulo.vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'
import {
  guardarAutoseleccionArticulo,
  obtenerAutoseleccionArticulo,
} from '../Ubicaciones/recordarUltimaTipografia.js'
import { obtenerArticuloExacto } from '../Compartidos/ServicioBusquedaArticulos.js'
import { normalizarInputPreservandoCursor } from '../Compartidos/NormalizarInputCursor.js'
import {
  manejarDobleEspacioInput,
  normalizarInputArticulo,
} from '../Compartidos/InputArticuloInteligente.js'
import { usarTextoCopiadoInput } from '../Compartidos/UsoTextoCopiadoInput.js'

const props = defineProps({
  deshabilitado: { type: Boolean, default: false },
  contextoBusqueda: { type: String, default: '' },
  articuloRepetido: { type: Object, default: null },
  lineasRepetidas: { type: Array, default: () => [] },
})
const emit = defineEmits([
  'articulo-seleccionado',
  'base-datos-cargada',
  'base-datos-limpia',
  'error-carga',
  'modal-abierto',
  'modal-cerrado',
  'confirmar-repetido',
  'cancelar-repetido',
  'actualizar-contexto',
])
const busquedaArticulo = ref('')
const mostrarBuscador = ref(false)
const mostrarCamara = ref(false)
const estadoBusqueda = ref({ articuloUnico: null })
const baseDatosCargada = ref(false)
const inputBusquedaRef = ref(null)
const autoseleccionArticuloHabilitada = ref(false)
const ultimoEspacioTiempo = ref(0)
const { copiarTextoActual, limpiarTextoCopiado, obtenerTextoCopiado } =
  usarTextoCopiadoInput('FormularioListado')
const busquedaDeshabilitada = computed(() => props.deshabilitado || Boolean(props.articuloRepetido))
const textoLineasRepetidas = computed(() => {
  const lineas = props.lineasRepetidas
  if (lineas.length === 1) return `la línea ${lineas[0]}`
  const ultimaLinea = lineas.at(-1)
  return `las líneas ${lineas.slice(0, -1).join(', ')} y ${ultimaLinea}`
})

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
    normalizarValor: normalizarInputArticulo,
    asignarValor: (valor) => {
      busquedaArticulo.value = valor
    },
    referenciaInput: inputBusquedaRef,
  })
  mostrarBuscador.value = true
}

function manejarDobleEspacio(evento) {
  ultimoEspacioTiempo.value = manejarDobleEspacioInput({
    evento,
    valorActual: busquedaArticulo.value,
    asignarValor: (valor) => {
      busquedaArticulo.value = valor
    },
    referenciaInput: inputBusquedaRef,
    ultimoEspacioTiempo: ultimoEspacioTiempo.value,
  })
}

function manejarEstadoBuscador(estado) {
  estadoBusqueda.value = estado || { articuloUnico: null }
  if (autoseleccionArticuloHabilitada.value && estado?.articuloUnico) {
    seleccionarArticulo(estado.articuloUnico)
  }
}

async function cambiarAutoseleccionArticulo(habilitada) {
  autoseleccionArticuloHabilitada.value = Boolean(habilitada)
  await guardarAutoseleccionArticulo(autoseleccionArticuloHabilitada.value)
  if (autoseleccionArticuloHabilitada.value) manejarEstadoBuscador(estadoBusqueda.value)
}

function resolverBusqueda(valor = busquedaArticulo.value) {
  const articuloExacto = obtenerArticuloExacto({
    articulos: obtenerArticulosCargados(),
    busqueda: valor,
    contextoBusqueda: props.contextoBusqueda,
  })
  if (articuloExacto) {
    seleccionarArticulo(articuloExacto)
    return
  }
  if (estadoBusqueda.value?.articuloUnico) seleccionarArticulo(estadoBusqueda.value.articuloUnico)
}

async function copiarBusquedaActual() {
  await copiarTextoActual(busquedaArticulo.value)
}

function seleccionarArticulo(articulo) {
  emit('articulo-seleccionado', articulo)
  busquedaArticulo.value = obtenerTextoCopiado()
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

async function limpiarBusqueda({ descartarTextoCopiado = false } = {}) {
  busquedaArticulo.value = ''
  mostrarBuscador.value = false
  estadoBusqueda.value = { articuloUnico: null }
  if (descartarTextoCopiado) limpiarTextoCopiado()
  await enfocarBusqueda()
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
  if (props.articuloRepetido) {
    emit('cancelar-repetido')
    return true
  }
  return false
}

onMounted(async () => {
  autoseleccionArticuloHabilitada.value = await obtenerAutoseleccionArticulo()
})

defineExpose({ cerrarInteraccion, enfocarBusqueda, establecerBaseCargada, limpiarBusqueda })
</script>

<style scoped>
.formulario-listado {
  position: relative;
}
.formulario-listado :deep(.formulario-ubicacion) {
  padding-bottom: 0;
}
.aviso-articulo-repetido {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.9rem;
  color: var(--color-texto-principal);
  background: color-mix(in oklab, var(--color-acento) 10%, var(--color-superficie));
  border: 1px solid var(--color-acento);
  border-radius: 10px;
}
.datos-articulo-repetido {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.85rem;
}
.datos-articulo-repetido strong {
  overflow-wrap: anywhere;
}
.datos-articulo-repetido span {
  color: var(--color-texto-secundario);
  font-size: 0.76rem;
}
.aviso-articulo-repetido p {
  margin: 0;
  font-size: 0.88rem;
}
.acciones-articulo-repetido {
  display: flex;
  gap: 0.6rem;
}
.acciones-articulo-repetido button {
  min-height: 40px;
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}
.boton-confirmar-repetido {
  background: var(--color-primario);
}
.boton-cancelar-repetido {
  background: var(--color-superficie);
}
@media (max-width: 480px) {
  .acciones-articulo-repetido button {
    flex: 1;
  }
}
</style>
