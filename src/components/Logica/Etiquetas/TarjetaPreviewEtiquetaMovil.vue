<template>
  <div class="preview-etiqueta-movil" :class="`densidad-${densidad}`" ref="contenedorPreview">
    <p class="preview-codigo-movil" :style="obtenerEstiloCodigo(etiqueta?.codigo)">
      {{ etiqueta?.codigo }}
    </p>
    <div class="preview-barra-contenedor" :style="obtenerEstiloContenedorBarra()">
      <svg v-if="esCodigoValido" ref="svgBarra" class="preview-barra-svg" :style="obtenerEstiloSvgBarra()"></svg>
      <p v-else class="preview-barra-invalida">Código no compatible con barras</p>
    </div>
    <p class="preview-descripcion-movil" :style="obtenerEstiloDescripcion(nombreArticulo)">
      <span v-for="(linea, indiceLinea) in lineasDescripcion" :key="`${etiqueta?.id || etiqueta?.codigo}-${indiceLinea}`">
        {{ linea }}
      </span>
    </p>
    <p class="preview-ubicacion-movil" :class="{ 'texto-sl-neon': esUbicacionSl(etiqueta?.ubicacion) }" :style="obtenerEstiloUbicacion()">
      {{ etiqueta?.ubicacion || 'Sin ubicación' }}
    </p>
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

const contenedorPreview = ref(null)
const svgBarra = ref(null)
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
