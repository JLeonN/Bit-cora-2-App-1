<template>
  <div class="preview-etiqueta-movil" :class="`densidad-${densidad}`" ref="contenedorPreview">
    <p
      v-if="campoEditando !== 'codigo'"
      class="preview-codigo-movil editable-preview"
      :style="obtenerEstiloCodigo(etiqueta?.codigo)"
      tabindex="0"
      @click="iniciarEdicion('codigo')"
      @keydown.enter.prevent="iniciarEdicion('codigo')"
    >
      {{ etiqueta?.codigo }}
    </p>
    <input
      v-else
      ref="inputCodigoRef"
      class="input-inline input-codigo"
      type="text"
      :value="borradorCodigo"
      :style="obtenerEstiloCodigo(etiqueta?.codigo)"
      @input="actualizarCodigo"
      @keydown.enter.prevent="confirmarEdicion()"
      @keydown.esc.prevent="cancelarEdicion()"
      @blur="confirmarEdicion()"
    />
    <div class="preview-barra-contenedor" :style="obtenerEstiloContenedorBarra()">
      <svg v-if="esCodigoValido" ref="svgBarra" class="preview-barra-svg" :style="obtenerEstiloSvgBarra()"></svg>
      <p v-else class="preview-barra-invalida">Código no compatible con barras</p>
    </div>
    <p
      v-if="campoEditando !== 'descripcion'"
      class="preview-descripcion-movil editable-preview"
      :style="obtenerEstiloDescripcion(nombreArticulo)"
      tabindex="0"
      @click="iniciarEdicion('descripcion')"
      @keydown.enter.prevent="iniciarEdicion('descripcion')"
    >
      <span v-for="(linea, indiceLinea) in lineasDescripcion" :key="`${etiqueta?.id || etiqueta?.codigo}-${indiceLinea}`">
        {{ linea }}
      </span>
    </p>
    <textarea
      v-else
      ref="textareaDescripcionRef"
      class="input-inline textarea-descripcion"
      :value="borradorDescripcion"
      :style="obtenerEstiloDescripcion(nombreArticulo)"
      @input="actualizarDescripcion"
      @keydown.esc.prevent="cancelarEdicion()"
      @keydown.enter.exact.prevent="confirmarEdicion()"
      @blur="confirmarEdicion()"
      rows="4"
    />
    <p
      v-if="campoEditando !== 'ubicacion'"
      class="preview-ubicacion-movil editable-preview"
      :class="{ 'texto-sl-neon': esUbicacionSl(etiqueta?.ubicacion) }"
      :style="obtenerEstiloUbicacion()"
      tabindex="0"
      @click="iniciarEdicion('ubicacion')"
      @keydown.enter.prevent="iniciarEdicion('ubicacion')"
    >
      {{ etiqueta?.ubicacion || 'Sin ubicación' }}
    </p>
    <input
      v-else
      ref="inputUbicacionRef"
      class="input-inline input-ubicacion"
      type="text"
      :value="borradorUbicacion"
      :style="obtenerEstiloUbicacion()"
      @input="actualizarUbicacion"
      @keydown.enter.prevent="confirmarEdicion()"
      @keydown.esc.prevent="cancelarEdicion()"
      @blur="confirmarEdicion()"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usarEscalaEtiquetaMovil } from './UsoEscalaEtiquetaMovil.js'
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
})

const emit = defineEmits(['actualizar-campo'])
const contenedorPreview = ref(null)
const svgBarra = ref(null)
const inputCodigoRef = ref(null)
const textareaDescripcionRef = ref(null)
const inputUbicacionRef = ref(null)
const campoEditando = ref('')
const valorOriginalCampo = ref('')
const borradorCodigo = ref('')
const borradorDescripcion = ref('')
const borradorUbicacion = ref('')
const {
  anchoPreview,
  obtenerEscala,
  obtenerEstiloCodigo,
  obtenerEstiloDescripcion,
  obtenerLineasDescripcion,
  obtenerEstiloContenedorBarra,
  obtenerEstiloSvgBarra,
  obtenerEstiloUbicacion,
  registrarContenedorPreview,
  desconectarObservador,
} = usarEscalaEtiquetaMovil({
  anchoBase: 360,
  escalaMinima: 0.52,
  escalaMaxima: 1,
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
const lineasDescripcion = computed(() => obtenerLineasDescripcion(props.nombreArticulo))
const normalizarCodigo = (valor) => String(valor || '').trim().toUpperCase()
const normalizarUbicacion = (valor) => {
  const normalizado = String(valor || '').toUpperCase().replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
  return normalizado || 'Sin ubicación'
}

function emitirActualizacion(campo, valor) {
  emit('actualizar-campo', { indice: props.indice, campo, valor })
}

function iniciarEdicion(campo) {
  campoEditando.value = campo
  if (campo === 'codigo') {
    valorOriginalCampo.value = props.etiqueta?.codigo || ''
    borradorCodigo.value = props.etiqueta?.codigo || ''
    nextTick(() => inputCodigoRef.value?.focus())
    return
  }
  if (campo === 'descripcion') {
    valorOriginalCampo.value = props.nombreArticulo || ''
    borradorDescripcion.value = props.nombreArticulo || ''
    nextTick(() => textareaDescripcionRef.value?.focus())
    return
  }
  valorOriginalCampo.value = props.etiqueta?.ubicacion || 'Sin ubicación'
  borradorUbicacion.value = props.etiqueta?.ubicacion || 'Sin ubicación'
  nextTick(() => inputUbicacionRef.value?.focus())
}

function actualizarCodigo(evento) {
  borradorCodigo.value = evento.target.value
  emitirActualizacion('codigo', normalizarCodigo(borradorCodigo.value))
}

function actualizarDescripcion(evento) {
  borradorDescripcion.value = evento.target.value
  emitirActualizacion('descripcion', String(borradorDescripcion.value))
}

function actualizarUbicacion(evento) {
  borradorUbicacion.value = evento.target.value
  emitirActualizacion('ubicacion', normalizarUbicacion(borradorUbicacion.value))
}

function confirmarEdicion() {
  campoEditando.value = ''
}

function cancelarEdicion() {
  if (!campoEditando.value) return
  if (campoEditando.value === 'codigo') {
    emitirActualizacion('codigo', normalizarCodigo(valorOriginalCampo.value))
  } else if (campoEditando.value === 'descripcion') {
    emitirActualizacion('descripcion', String(valorOriginalCampo.value))
  } else {
    emitirActualizacion('ubicacion', normalizarUbicacion(valorOriginalCampo.value))
  }
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
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 15cm);
  max-width: 15cm;
  max-height: 10cm;
  aspect-ratio: 15 / 10;
  border: 1px solid color-mix(in oklab, var(--color-borde) 75%, transparent);
  border-radius: 6px;
  background: var(--color-texto-principal);
  color: var(--color-fondo);
  padding: 0.45rem 0.3rem 0.22rem 0.3rem;
  position: relative;
  overflow: hidden;
}
.editable-preview {
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.preview-codigo-movil {
  margin: 0 0 0.08rem 0;
  width: 100%;
  text-align: center;
  line-height: 1.02;
  font-weight: 800;
  letter-spacing: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  word-break: normal;
  cursor: text;
}
.preview-barra-contenedor {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.preview-barra-svg {
  width: 94%;
  max-width: 100%;
}
.preview-barra-invalida {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.68rem;
  text-align: center;
}
.preview-descripcion-movil {
  margin: 0.02rem 0 0 0;
  text-align: center;
  line-height: 0.93;
  font-weight: 800;
  text-transform: uppercase;
  padding: 0 0.14rem;
  width: 100%;
  letter-spacing: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: text;
}
.preview-descripcion-movil span {
  display: block;
  line-height: 1;
  font-weight: inherit;
  letter-spacing: inherit;
  white-space: nowrap;
}
.preview-ubicacion-movil {
  margin: auto 0 0 0;
  width: 100%;
  text-align: left;
  line-height: 1.08;
  font-weight: 500;
  color: var(--color-fondo);
  padding-left: 0.1rem;
  cursor: text;
}
.input-inline {
  width: 100%;
  border: 1px solid var(--color-primario);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 4px;
  padding: 0.1rem 0.25rem;
}
.input-inline:focus {
  outline: none;
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--color-primario) 75%, transparent);
}
.input-codigo {
  text-align: center;
  font-weight: 800;
}
.textarea-descripcion {
  text-transform: uppercase;
  font-weight: 800;
  line-height: 1;
  resize: none;
}
.input-ubicacion {
  margin-top: auto;
  text-align: left;
}
.texto-sl-neon {
  color: var(--color-neon-sl-texto);
  text-shadow: 0 0 8px var(--color-neon-sl-sombra), 0 0 16px var(--color-neon-sl-sombra);
}
.preview-etiqueta-movil.densidad-amplia {
  padding: 0.5rem 0.4rem 0.3rem 0.4rem;
}
.preview-etiqueta-movil.densidad-compacta {
  padding: 0.3rem 0.2rem 0.16rem 0.2rem;
}
</style>
