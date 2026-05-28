<template>
  <div class="preview-etiqueta-movil" :class="`densidad-${densidad}`" ref="contenedorPreview">
    <p
      v-if="campoEditando !== 'codigo'"
      class="preview-codigo-movil editable-preview"
      :style="layoutPreview.estilos.codigo"
      tabindex="0"
      @click="iniciarEdicion('codigo')"
      @keydown.enter.prevent="iniciarEdicion('codigo')"
    >
      {{ etiqueta?.codigo }}
    </p>
    <input
      v-else
      ref="inputCodigoRef"
      class="input-inline input-codigo campo-editando"
      type="text"
      :value="borradorCodigo"
      :style="layoutPreview.estilos.codigo"
      @input="actualizarCodigo"
      @blur="confirmarEdicion"
      @keydown.enter.prevent
      @keydown.esc.prevent="cancelarEdicion()"
    />
    <div class="preview-barra-contenedor" :style="layoutPreview.estilos.barra">
      <svg v-if="esCodigoValido" ref="svgBarra" class="preview-barra-svg"></svg>
      <p v-else class="preview-barra-invalida">Código no compatible con barras</p>
    </div>
    <p
      v-if="campoEditando !== 'descripcion'"
      class="preview-descripcion-movil editable-preview"
      :style="layoutPreview.estilos.descripcion"
      tabindex="0"
      @click="iniciarEdicion('descripcion')"
      @keydown.enter.prevent="iniciarEdicion('descripcion')"
    >
      <span
        v-for="(linea, indiceLinea) in lineasDescripcionConEstilos"
        :key="`${etiqueta?.id || etiqueta?.codigo}-${indiceLinea}`"
        :style="linea.estilo"
      >
        {{ linea.texto }}
      </span>
    </p>
    <textarea
      v-else
      ref="textareaDescripcionRef"
      class="input-inline textarea-descripcion campo-editando"
      :value="borradorDescripcion"
      :style="estiloTextareaDescripcion"
      @input="actualizarDescripcion"
      @blur="confirmarEdicion"
      @keydown.esc.prevent="cancelarEdicion()"
      :rows="filasDescripcionEdicion"
      wrap="off"
    />
    <p
      v-if="campoEditando !== 'ubicacion'"
      class="preview-ubicacion-movil editable-preview"
      :class="{ 'texto-sl-neon': esUbicacionSl(etiqueta?.ubicacion) }"
      :style="layoutPreview.estilos.ubicacion"
      tabindex="0"
      @click="iniciarEdicion('ubicacion')"
      @keydown.enter.prevent="iniciarEdicion('ubicacion')"
    >
      {{ etiqueta?.ubicacion || 'Sin ubicación' }}
    </p>
    <input
      v-else
      ref="inputUbicacionRef"
      class="input-inline input-ubicacion campo-editando"
      type="text"
      :value="borradorUbicacion"
      :style="layoutPreview.estilos.ubicacion"
      @input="actualizarUbicacion"
      @blur="confirmarEdicion"
      @keydown.enter.prevent
      @keydown.esc.prevent="cancelarEdicion()"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usarLayoutEtiquetaPreview } from './UsoLayoutEtiquetaPreview.js'
import { usarCodigoBarraEtiqueta } from './UsoCodigoBarraEtiqueta.js'

const props = defineProps({
  etiqueta: {
    type: Object,
    required: true,
  },
  indice: {
    type: Number,
    required: true,
  },
  nombreArticulo: {
    type: String,
    required: true,
  },
  esUbicacionSl: {
    type: Function,
    required: true,
  },
  codigoBarraValido: {
    type: Function,
    required: true,
  },
  indiceAccionEdicion: {
    type: Number,
    default: -1,
  },
  versionAccionEdicion: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['borrador-campo', 'cancelar-edicion', 'confirmar-edicion'])
const contenedorPreview = ref(null)
const svgBarra = ref(null)
const inputCodigoRef = ref(null)
const textareaDescripcionRef = ref(null)
const inputUbicacionRef = ref(null)
const campoEditando = ref('')
const borradorCodigo = ref('')
const borradorDescripcion = ref('')
const borradorUbicacion = ref('')
const lineasDescripcionEdicion = ref([])
const lineasDescripcionEdicionConEstilos = ref([])
const estiloDescripcionEdicion = ref(null)
const fontSizeDescripcionEdicionPx = ref(null)
const {
  anchoPreview,
  obtenerEscala,
  obtenerLayoutPixeles,
  registrarContenedorPreview,
  desconectarObservador,
} = usarLayoutEtiquetaPreview({
  anchoBase: 360,
  alCambiarEscala: () => {
    renderizarBarra()
  },
})

const { renderizarCodigoBarraSvg } = usarCodigoBarraEtiqueta()
const esCodigoValido = computed(() => props.codigoBarraValido(props.etiqueta?.codigo))
const densidad = computed(() => {
  if (anchoPreview.value >= 500) return 'amplia'
  if (anchoPreview.value >= 360) return 'media'
  return 'compacta'
})
const descripcionParaLayout = computed(() => (campoEditando.value === 'descripcion' ? borradorDescripcion.value : props.nombreArticulo))
const etiquetaParaLayout = computed(() => ({
  ...props.etiqueta,
  descripcion: descripcionParaLayout.value,
}))
const layoutPreview = computed(() => obtenerLayoutPixeles(etiquetaParaLayout.value))
const lineasDescripcion = computed(() => layoutPreview.value.lineasDescripcion)
const lineasDescripcionConEstilos = computed(() => {
  if (campoEditando.value !== 'descripcion') {
    return layoutPreview.value.lineasDescripcionConEstilos
  }
  return lineasDescripcionEdicion.value.map((texto, indice) => ({
    texto,
    estilo:
      lineasDescripcionEdicionConEstilos.value[indice]?.estilo ||
      lineasDescripcionEdicionConEstilos.value[0]?.estilo ||
      {},
  }))
})
const filasDescripcionEdicion = computed(() => Math.max(3, lineasDescripcionEdicion.value.length || lineasDescripcion.value.length))
const estiloTextareaDescripcion = computed(() => ({
  ...obtenerEstiloDescripcionParaEdicion(),
  left: '4%',
  width: '92%',
  height: '55%',
}))
const normalizarCodigo = (valor) => String(valor || '').trim().toUpperCase()
const normalizarSaltosLocales = (valor) => String(valor || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
const normalizarUbicacion = (valor) => {
  const normalizado = String(valor || '').toUpperCase().replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
  return normalizado || 'Sin ubicación'
}

function emitirActualizacion(campo, valor) {
  emit('borrador-campo', { indice: props.indice, campo, valor })
}

function obtenerNumeroDesdePx(valor, fallback = null) {
  if (typeof valor !== 'string') return fallback
  const numero = Number.parseFloat(valor.replace('px', ''))
  return Number.isFinite(numero) ? numero : fallback
}

function obtenerFontSizeMinimoDescripcion() {
  const tamanos = lineasDescripcionEdicionConEstilos.value
    .map((linea) => obtenerNumeroDesdePx(linea?.estilo?.fontSize))
    .filter((tamano) => tamano !== null)
  if (!tamanos.length) {
    return null
  }
  return Math.min(...tamanos)
}

function obtenerEstiloDescripcionParaEdicion() {
  const estiloBase = campoEditando.value === 'descripcion' && estiloDescripcionEdicion.value
    ? estiloDescripcionEdicion.value
    : layoutPreview.value.estilos.descripcion
  if (campoEditando.value !== 'descripcion' || !estiloBase) {
    return estiloBase
  }
  const tamanoBase = obtenerNumeroDesdePx(estiloBase.fontSize)
  const interlineadoBase = obtenerNumeroDesdePx(estiloBase.lineHeight)
  const tamanoMinimo = fontSizeDescripcionEdicionPx.value || tamanoBase
  const factorInterlineado = tamanoBase && interlineadoBase ? interlineadoBase / tamanoBase : 0.93
  return {
    ...estiloBase,
    fontSize: `${tamanoMinimo.toFixed(2)}px`,
    lineHeight: `${(tamanoMinimo * factorInterlineado).toFixed(2)}px`,
  }
}

function iniciarEdicion(campo) {
  if (campo === 'codigo') {
    borradorCodigo.value = props.etiqueta?.codigo || ''
    campoEditando.value = campo
    nextTick(() => inputCodigoRef.value?.focus())
    return
  }
  if (campo === 'descripcion') {
    lineasDescripcionEdicion.value = [...lineasDescripcion.value]
    lineasDescripcionEdicionConEstilos.value = layoutPreview.value.lineasDescripcionConEstilos.map((linea) => ({
      texto: linea.texto,
      estilo: { ...linea.estilo },
    }))
    estiloDescripcionEdicion.value = { ...layoutPreview.value.estilos.descripcion }
    fontSizeDescripcionEdicionPx.value = obtenerFontSizeMinimoDescripcion()
    borradorDescripcion.value = lineasDescripcionEdicion.value.join('\n')
    campoEditando.value = campo
    nextTick(() => textareaDescripcionRef.value?.focus())
    return
  }
  borradorUbicacion.value = props.etiqueta?.ubicacion || 'Sin ubicación'
  campoEditando.value = campo
  nextTick(() => inputUbicacionRef.value?.focus())
}

function actualizarCodigo(evento) {
  borradorCodigo.value = evento.target.value
  emitirActualizacion('codigo', normalizarCodigo(borradorCodigo.value))
}

function actualizarDescripcion(evento) {
  borradorDescripcion.value = evento.target.value
  lineasDescripcionEdicion.value = normalizarSaltosLocales(borradorDescripcion.value).split('\n')
  emitirActualizacion('descripcion', String(borradorDescripcion.value))
}

function actualizarUbicacion(evento) {
  borradorUbicacion.value = evento.target.value
  emitirActualizacion('ubicacion', normalizarUbicacion(borradorUbicacion.value))
}

function confirmarEdicion() {
  if (!campoEditando.value) return
  const campoActual = campoEditando.value
  if (campoActual === 'codigo') {
    emitirActualizacion('codigo', normalizarCodigo(borradorCodigo.value))
  }
  if (campoActual === 'descripcion') {
    emitirActualizacion('descripcion', String(borradorDescripcion.value))
    lineasDescripcionEdicion.value = []
    lineasDescripcionEdicionConEstilos.value = []
    estiloDescripcionEdicion.value = null
    fontSizeDescripcionEdicionPx.value = null
  }
  if (campoActual === 'ubicacion') {
    emitirActualizacion('ubicacion', normalizarUbicacion(borradorUbicacion.value))
  }
  emit('confirmar-edicion', props.indice)
  campoEditando.value = ''
}

function cancelarEdicion() {
  if (!campoEditando.value) return
  emit('cancelar-edicion', props.indice)
  borradorCodigo.value = props.etiqueta?.codigo || ''
  borradorDescripcion.value = props.nombreArticulo || ''
  borradorUbicacion.value = props.etiqueta?.ubicacion || 'Sin ubicación'
  lineasDescripcionEdicion.value = []
  lineasDescripcionEdicionConEstilos.value = []
  estiloDescripcionEdicion.value = null
  fontSizeDescripcionEdicionPx.value = null
  campoEditando.value = ''
}

function renderizarBarra() {
  if (!esCodigoValido.value || !svgBarra.value) {
    return
  }
  renderizarCodigoBarraSvg(svgBarra.value, props.etiqueta?.codigo, obtenerEscala())
}

watch(
  () => props.etiqueta?.codigo,
  async () => {
    await nextTick()
    renderizarBarra()
  },
)

watch(
  () => props.nombreArticulo,
  async () => {
    await nextTick()
    renderizarBarra()
  },
)

watch(
  () => props.versionAccionEdicion,
  () => {
    if (props.indiceAccionEdicion === props.indice) {
      campoEditando.value = ''
      borradorCodigo.value = props.etiqueta?.codigo || ''
      borradorDescripcion.value = props.nombreArticulo || ''
      borradorUbicacion.value = props.etiqueta?.ubicacion || 'Sin ubicación'
      lineasDescripcionEdicion.value = []
      lineasDescripcionEdicionConEstilos.value = []
      estiloDescripcionEdicion.value = null
      fontSizeDescripcionEdicionPx.value = null
    }
  },
)

onMounted(async () => {
  registrarContenedorPreview(contenedorPreview.value)
  await nextTick()
  renderizarBarra()
})

onBeforeUnmount(() => {
  desconectarObservador()
})
</script>

<style scoped>
.preview-etiqueta-movil {
  width: min(100%, 15cm);
  max-width: 15cm;
  max-height: 10cm;
  aspect-ratio: 15 / 10;
  border: 1px solid color-mix(in oklab, var(--color-borde) 75%, transparent);
  border-radius: 6px;
  background: var(--color-texto-principal);
  color: var(--color-fondo);
  padding: 0;
  position: relative;
  overflow: hidden;
}
.editable-preview {
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.preview-codigo-movil {
  position: absolute;
  left: 0;
  margin: 0;
  width: 100%;
  text-align: center;
  font-weight: 800;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  word-break: normal;
  cursor: text;
}
.preview-barra-contenedor {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
}
.preview-barra-svg {
  width: 100%;
  height: 100%;
}
.preview-barra-invalida {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.68rem;
  text-align: center;
}
.preview-descripcion-movil {
  position: absolute;
  left: 0;
  margin: 0;
  text-align: center;
  font-weight: 800;
  text-transform: uppercase;
  padding: 0;
  width: 100%;
  letter-spacing: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: text;
}
.preview-descripcion-movil span {
  display: block;
  line-height: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  white-space: nowrap;
}
.preview-ubicacion-movil {
  position: absolute;
  margin: 0;
  width: auto;
  text-align: left;
  line-height: 1.08;
  font-weight: 500;
  color: var(--color-fondo);
  padding-left: 0.1rem;
  cursor: text;
}
.input-inline {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--color-fondo);
  border-radius: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: inherit;
  letter-spacing: inherit;
}
.input-inline:focus {
  outline: none;
  box-shadow: none;
}
.campo-editando {
  background: color-mix(in oklab, var(--color-primario) 14%, white);
  border: 2px solid var(--color-primario);
  border-radius: 6px;
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primario) 20%, transparent);
  color: var(--color-fondo);
  padding: 0.08em 0.14em;
}
.campo-editando:focus {
  outline: none;
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--color-primario) 28%, transparent);
}
.input-codigo {
  position: absolute;
  left: 0;
  margin: 0;
  text-align: center;
  font-weight: 800;
  padding: 0;
}
.textarea-descripcion {
  position: absolute;
  left: 0;
  margin: 0;
  width: 100%;
  text-align: center;
  text-transform: uppercase;
  font-weight: 800;
  resize: none;
  padding: 0;
  overflow: hidden;
  white-space: pre;
}
.input-ubicacion {
  position: absolute;
  margin: 0;
  width: auto;
  text-align: left;
  line-height: 1.08;
  font-weight: 500;
  padding-left: 0.1rem;
}
.texto-sl-neon {
  color: var(--color-neon-sl-texto);
  text-shadow: 0 0 8px var(--color-neon-sl-sombra), 0 0 16px var(--color-neon-sl-sombra);
}
</style>
