<template>
  <div class="envoltura-preview-etiqueta" :class="{ 'envoltura-preview-chica': esChica }">
  <div class="preview-etiqueta-movil" :class="[`densidad-${densidad}`, { 'preview-etiqueta-chica': esChica }]" ref="contenedorPreview">
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
      :class="{ 'descripcion-chica': esChica }"
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
      @blur="confirmarEdicionSiSaleDeControles"
      @keydown.enter="manejarEnterDescripcion"
      @keydown.esc.prevent="cancelarEdicion()"
      :rows="filasDescripcionEdicion"
      wrap="off"
    />
    <p
      v-if="campoEditando !== 'ubicacion'"
      class="preview-ubicacion-movil editable-preview"
      :class="{ 'texto-sl-neon': esUbicacionSl(etiqueta?.ubicacion) }"
      :style="layoutPreview.estilos.ubicacion"
      :tabindex="esChica && campoEditando === 'descripcion' ? -1 : 0"
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
  <div v-if="esChica && campoEditando === 'descripcion'" class="controles-tamano-descripcion">
    <button type="button" class="boton-tamano-descripcion" aria-label="Reducir tamaño del texto" title="Reducir tamaño del texto" @pointerdown.prevent @blur="confirmarEdicionSiSaleDeControles" @click="ajustarTamanoDescripcion(-0.5)">−</button>
    <span class="valor-tamano-descripcion">{{ tamanoDescripcionVisible }} pt</span>
    <button type="button" class="boton-tamano-descripcion" aria-label="Aumentar tamaño del texto" title="Aumentar tamaño del texto" @pointerdown.prevent @blur="confirmarEdicionSiSaleDeControles" @click="ajustarTamanoDescripcion(0.5)">+</button>
    <button type="button" class="boton-tamano-automatico" title="Volver al tamaño automático" @pointerdown.prevent @blur="confirmarEdicionSiSaleDeControles" @click="restablecerTamanoAutomatico">Auto</button>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { usarLayoutEtiquetaPreview } from './UsoLayoutEtiquetaPreview.js'
import { usarCodigoBarraEtiqueta } from './UsoCodigoBarraEtiqueta.js'
import { TAMANO_ETIQUETA_CHICA } from './ConfiguracionesDeEtiquetas/TamanosEtiqueta.js'

const props = defineProps({
  etiqueta: {
    type: Object,
    required: true,
  },
  configuracion: { type: Object, required: true },
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
const descripcionModificada = ref(false)
const borradorTamanoDescripcionPt = ref(null)
const tamanoDescripcionModificado = ref(false)
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
  configuracion: props.configuracion,
  alCambiarEscala: () => {
    renderizarBarra()
  },
})

const { renderizarCodigoBarraSvg } = usarCodigoBarraEtiqueta()
const esChica = computed(() => props.configuracion.id === TAMANO_ETIQUETA_CHICA)
const esCodigoValido = computed(() => props.codigoBarraValido(props.etiqueta?.codigo))
const densidad = computed(() => {
  if (anchoPreview.value >= 500) return 'amplia'
  if (anchoPreview.value >= 360) return 'media'
  return 'compacta'
})
const descripcionParaLayout = computed(() => (campoEditando.value === 'descripcion'
  ? borradorDescripcion.value
  : esChica.value ? props.etiqueta.descripcion : props.nombreArticulo))
const etiquetaParaLayout = computed(() => ({
  ...props.etiqueta,
  descripcion: descripcionParaLayout.value,
  ...(esChica.value && campoEditando.value === 'descripcion' ? { tamanoDescripcionPt: borradorTamanoDescripcionPt.value } : {}),
}))
const layoutPreview = computed(() => obtenerLayoutPixeles(etiquetaParaLayout.value))
const tamanoDescripcionVisible = computed(() => {
  const tamanoPx = obtenerNumeroDesdePx(layoutPreview.value.estilos.descripcion.fontSize, 0)
  const escala = anchoPreview.value / props.configuracion.pagina.ancho
  return (tamanoPx / (0.352777778 * escala)).toFixed(1)
})
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
const maximoRenglonesChica = computed(() => props.configuracion.descripcion?.maximoLineas || 4)
const filasDescripcionEdicion = computed(() => esChica.value
  ? maximoRenglonesChica.value
  : Math.max(3, lineasDescripcionEdicion.value.length || lineasDescripcion.value.length))
const estiloTextareaDescripcion = computed(() => {
  const estilo = {
    ...obtenerEstiloDescripcionParaEdicion(),
    left: '4%',
    width: '92%',
  }
  if (!esChica.value) return { ...estilo, height: '55%' }
  const inicio = obtenerNumeroDesdePx(layoutPreview.value.estilos.descripcion.top, 0)
  const ubicacion = obtenerNumeroDesdePx(layoutPreview.value.estilos.ubicacion.top, 0)
  const separacion = anchoPreview.value * 0.012
  const altoDisponible = Math.max(0, ubicacion - inicio - separacion)
  const altoManual = borradorTamanoDescripcionPt.value === null ? 0 :
    normalizarSaltosLocales(borradorDescripcion.value).split('\n').length * obtenerNumeroDesdePx(estilo.lineHeight, 0) + 4
  return { ...estilo, height: `${Math.max(altoDisponible, altoManual).toFixed(2)}px` }
})
const normalizarCodigo = (valor) => String(valor || '').trim().toUpperCase()
const normalizarSaltosLocales = (valor) => String(valor || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
const limitarRenglonesChica = (valor) => normalizarSaltosLocales(valor).split('\n').slice(0, maximoRenglonesChica.value).join('\n')
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
  if (esChica.value) return layoutPreview.value.estilos.descripcion
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
    borradorDescripcion.value = esChica.value
      ? limitarRenglonesChica(props.etiqueta.descripcion || '')
      : lineasDescripcionEdicion.value.join('\n')
    descripcionModificada.value = false
    borradorTamanoDescripcionPt.value = esChica.value ? props.etiqueta.tamanoDescripcionPt ?? null : null
    tamanoDescripcionModificado.value = false
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
  const valor = esChica.value ? limitarRenglonesChica(evento.target.value) : evento.target.value
  if (esChica.value && valor !== evento.target.value) evento.target.value = valor
  borradorDescripcion.value = valor
  descripcionModificada.value = true
  lineasDescripcionEdicion.value = normalizarSaltosLocales(borradorDescripcion.value).split('\n')
  emitirActualizacion('descripcion', String(borradorDescripcion.value))
}

function manejarEnterDescripcion(evento) {
  if (!esChica.value) return
  const campo = evento.target
  const texto = String(campo.value || '')
  const candidato = `${texto.slice(0, campo.selectionStart)}\n${texto.slice(campo.selectionEnd)}`
  if (normalizarSaltosLocales(candidato).split('\n').length > maximoRenglonesChica.value) {
    evento.preventDefault()
  }
}

function ajustarTamanoDescripcion(cambio) {
  const actual = borradorTamanoDescripcionPt.value ?? Number(tamanoDescripcionVisible.value)
  borradorTamanoDescripcionPt.value = Math.min(40, Math.max(2, Math.round((actual + cambio) * 2) / 2))
  tamanoDescripcionModificado.value = true
  emitirActualizacion('tamanoDescripcionPt', borradorTamanoDescripcionPt.value)
}

function restablecerTamanoAutomatico() {
  borradorTamanoDescripcionPt.value = null
  tamanoDescripcionModificado.value = true
  emitirActualizacion('tamanoDescripcionPt', null)
}

function confirmarEdicionSiSaleDeControles(evento) {
  const siguiente = evento.relatedTarget
  if (esChica.value && campoEditando.value === 'descripcion' && (
    siguiente === textareaDescripcionRef.value || siguiente?.closest?.('.controles-tamano-descripcion')
  )) return
  confirmarEdicion()
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
    if (esChica.value && !descripcionModificada.value && !tamanoDescripcionModificado.value) {
      cancelarEdicion()
      return
    }
    if (!esChica.value || descripcionModificada.value) emitirActualizacion('descripcion', String(borradorDescripcion.value))
    if (esChica.value && tamanoDescripcionModificado.value) emitirActualizacion('tamanoDescripcionPt', borradorTamanoDescripcionPt.value)
  }
  if (campoActual === 'ubicacion') {
    emitirActualizacion('ubicacion', normalizarUbicacion(borradorUbicacion.value))
  }
  emit('confirmar-edicion', props.indice)
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
  descripcionModificada.value = false
  borradorTamanoDescripcionPt.value = null
  tamanoDescripcionModificado.value = false
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
      descripcionModificada.value = false
      borradorTamanoDescripcionPt.value = null
      tamanoDescripcionModificado.value = false
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
.envoltura-preview-etiqueta {
  width: min(100%, 15cm);
}
.envoltura-preview-chica {
  width: min(100%, 12cm);
}
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
.preview-etiqueta-chica {
  width: min(100%, 12cm);
  max-width: 12cm;
  max-height: none;
  aspect-ratio: 67 / 25;
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
.descripcion-chica span {
  white-space: pre;
  min-height: 1em;
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
.controles-tamano-descripcion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.4rem;
  color: var(--color-texto-principal);
}
.boton-tamano-descripcion,
.boton-tamano-automatico {
  min-width: 36px;
  height: 36px;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  cursor: pointer;
}
.boton-tamano-descripcion {
  font-size: 1.3rem;
}
.boton-tamano-automatico {
  padding: 0 0.5rem;
}
.valor-tamano-descripcion {
  min-width: 3rem;
  text-align: center;
  font-size: 0.85rem;
}
</style>
