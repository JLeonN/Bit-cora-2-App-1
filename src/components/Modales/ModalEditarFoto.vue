<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div class="modal-contenido">
      <h3 class="modal-titulo">Editar código</h3>

      <div class="modal-campo">
        <label>Código actual: {{ foto.codigo }}</label>
      </div>

      <div class="modal-campo">
        <label>Nuevo código</label>
        <input
          ref="inputCodigo"
          v-model="nuevoCodigo"
          type="text"
          placeholder="Ingresá el nuevo código..."
          :class="{ 'input-error': error, 'animar-error': animarError }"
          @input="nuevoCodigo = nuevoCodigo.toUpperCase()"
          @keyup.enter="guardar"
        />
      </div>

      <div class="modal-campo">
        <label>Nombre del artículo</label>
        <p class="texto-secundario">{{ foto.nombreArticulo }}</p>
      </div>

      <TresBotones
        textoCancelar="Cancelar"
        textoConfirmar="Guardar"
        :mostrarEliminar="false"
        @cancelar="$emit('cerrar')"
        @confirmar="guardar"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import TresBotones from '../Botones/TresBotones.vue'

const props = defineProps({
  foto: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['cerrar', 'guardar'])

// Estado
const nuevoCodigo = ref('')
const error = ref(false)
const animarError = ref(false)
const inputCodigo = ref(null)

// Guardar
function guardar() {
  const codigoLimpio = nuevoCodigo.value.trim()

  if (!codigoLimpio) {
    mostrarError()
    return
  }

  if (codigoLimpio === props.foto.codigo) {
    emit('cerrar')
    return
  }

  emit('guardar', props.foto.id, codigoLimpio)
}

// Mostrar error con animación
function mostrarError() {
  error.value = true
  animarError.value = true

  setTimeout(() => {
    animarError.value = false
  }, 500)

  setTimeout(() => {
    error.value = false
  }, 2000)
}

// Lifecycle
onMounted(() => {
  nuevoCodigo.value = props.foto.codigo
  nextTick(() => {
    if (inputCodigo.value) {
      inputCodigo.value.focus()
      inputCodigo.value.select()
    }
  })
})
</script>
