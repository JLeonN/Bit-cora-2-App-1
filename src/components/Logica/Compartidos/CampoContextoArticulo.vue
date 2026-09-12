<template>
  <div class="campo-contexto-articulo">
    <label :for="idCampo">Contexto de búsqueda</label>
    <div class="contenedor-input-contexto">
      <input
        :id="idCampo"
        ref="inputRef"
        :value="modelValue"
        type="text"
        :disabled="deshabilitado"
        @focus="inputEnfocado = true"
        @blur="inputEnfocado = false"
        @input="manejarInput"
      />
      <span
        v-if="!modelValue && !inputEnfocado"
        ref="ventanaAyudaRef"
        class="ventana-ayuda-contexto"
        aria-hidden="true"
      >
        <span
          ref="textoAyudaRef"
          class="texto-ayuda-contexto"
          :class="{ 'texto-ayuda-animado': ayudaDesborda }"
          :style="estiloAnimacionAyuda"
        >{{ TEXTO_AYUDA }}</span>
      </span>
      <button v-if="modelValue" type="button" title="Borrar contexto de búsqueda" aria-label="Borrar contexto de búsqueda" @click="borrarContexto">
        <IconTrash :size="18" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { IconTrash } from '@tabler/icons-vue'
import { normalizarInputPreservandoCursor } from './NormalizarInputCursor.js'
import { normalizarInputArticulo } from './InputArticuloInteligente.js'

const TEXTO_AYUDA = 'Escribí palabras para limitar los artículos que aparecen en la búsqueda.'
defineProps({
  modelValue: { type: String, default: '' },
  idCampo: { type: String, required: true },
  deshabilitado: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])
const inputRef = ref(null)
const ventanaAyudaRef = ref(null)
const textoAyudaRef = ref(null)
const inputEnfocado = ref(false)
const ayudaDesborda = ref(false)
const estiloAnimacionAyuda = ref({})
let observadorTamano = null

function actualizarAnimacionAyuda() {
  nextTick(() => {
    const ventana = ventanaAyudaRef.value
    const texto = textoAyudaRef.value
    if (!ventana || !texto) return
    const desborde = Math.max(0, texto.scrollWidth - ventana.clientWidth)
    ayudaDesborda.value = desborde > 0
    estiloAnimacionAyuda.value = desborde
      ? { '--distancia-ayuda': `-${desborde}px`, '--duracion-ayuda': `${Math.max(8, desborde / 20)}s` }
      : {}
  })
}
function manejarInput(evento) {
  normalizarInputPreservandoCursor({ evento, normalizarValor: normalizarInputArticulo, asignarValor: (valor) => emit('update:modelValue', valor), referenciaInput: inputRef })
}
function borrarContexto() {
  emit('update:modelValue', '')
  inputRef.value?.focus()
}
onMounted(() => {
  actualizarAnimacionAyuda()
  observadorTamano = new ResizeObserver(actualizarAnimacionAyuda)
  observadorTamano.observe(inputRef.value)
})
onBeforeUnmount(() => observadorTamano?.disconnect())
</script>

<style scoped>
.campo-contexto-articulo{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}.campo-contexto-articulo label{color:var(--color-texto-secundario);font-size:.85rem;font-weight:600}.contenedor-input-contexto{position:relative;display:flex;align-items:center;min-width:0}.contenedor-input-contexto input{width:100%;min-width:0;padding:10px 42px 10px 12px;border:1px solid var(--color-borde);border-radius:8px;background:var(--color-superficie);color:var(--color-texto-principal)}.contenedor-input-contexto input:focus{outline:none;border-color:var(--color-primario)}.ventana-ayuda-contexto{position:absolute;left:12px;right:42px;overflow:hidden;color:var(--color-texto-secundario);font-size:.85rem;white-space:nowrap;pointer-events:none}.texto-ayuda-contexto{display:inline-block}.texto-ayuda-animado{animation:desplazar-ayuda-contexto var(--duracion-ayuda) 2.5s ease-in-out infinite alternate}.contenedor-input-contexto button{position:absolute;right:5px;display:flex;align-items:center;justify-content:center;min-width:36px;min-height:36px;padding:6px;border:0;background:transparent;color:var(--color-error);cursor:pointer}.contenedor-input-contexto button:disabled{opacity:.5}@keyframes desplazar-ayuda-contexto{0%,15%{transform:translateX(0)}85%,100%{transform:translateX(var(--distancia-ayuda))}}
</style>
