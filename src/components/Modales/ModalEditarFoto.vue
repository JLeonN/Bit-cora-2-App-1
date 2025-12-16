<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div class="modal-contenido">
      <h3 class="modal-titulo">Editar código</h3>

      <div class="modal-campo">
        <label>Código actual: {{ foto.codigo }}</label>
      </div>

      <div class="modal-campo ubicacion-campo-con-buscador">
        <label>Nuevo código</label>
        <input
          ref="inputCodigo"
          v-model="nuevoCodigo"
          type="text"
          placeholder="Buscar por código o nombre..."
          :class="{ 'input-error': error, 'animar-error': animarError }"
          @input="handleInput"
          @keyup.enter="guardar"
        />

        <!-- Buscador inteligente -->
        <CodigoMasNombre
          v-if="mostrarBuscador"
          :busqueda="nuevoCodigo"
          @articulo-seleccionado="seleccionarArticulo"
        />
      </div>

      <div class="modal-campo">
        <label>Nombre del artículo</label>
        <p class="texto-secundario">{{ nombreArticulo }}</p>
      </div>

      <div class="botones-modal">
        <button class="boton-cancelar" @click="$emit('cerrar')">Cancelar</button>
        <button class="boton-confirmar" @click="guardar">Guardar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import CodigoMasNombre from '../Logica/Ubicaciones/CodigoMasNombre.vue'

const props = defineProps({
  foto: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['cerrar', 'guardar'])

// Estado
const nuevoCodigo = ref('')
const nombreArticulo = ref('')
const error = ref(false)
const animarError = ref(false)
const inputCodigo = ref(null)
const mostrarResultadosBuscador = ref(true)

// Computed para mostrar buscador
const mostrarBuscador = computed(() => {
  return nuevoCodigo.value.length >= 3 && mostrarResultadosBuscador.value
})

// Manejar input (activar buscador al escribir)
function handleInput() {
  nuevoCodigo.value = nuevoCodigo.value.toUpperCase()
  mostrarResultadosBuscador.value = true
}

// Seleccionar artículo del buscador
function seleccionarArticulo(articulo) {
  nuevoCodigo.value = articulo.codigo
  nombreArticulo.value = articulo.nombre

  // Ocultar dropdown
  mostrarResultadosBuscador.value = false

  // Quitar foco para cerrar teclado
  nextTick(() => {
    if (inputCodigo.value) {
      inputCodigo.value.blur()
    }
  })
}

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

  // Enviar código Y nombre
  emit('guardar', props.foto.id, codigoLimpio, nombreArticulo.value)
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
  nombreArticulo.value = props.foto.nombreArticulo
  mostrarResultadosBuscador.value = false
  nextTick(() => {
    if (inputCodigo.value) {
      inputCodigo.value.focus()
      inputCodigo.value.select()
    }
  })
})
</script>

<style scoped>
.botones-modal {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
.boton-cancelar,
.boton-confirmar {
  flex: 1;
  padding: 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}
.boton-cancelar {
  background: transparent;
  color: var(--color-texto-secundario);
  border: 1px solid var(--color-borde);
}
.boton-cancelar:hover {
  background: var(--color-fondo);
  border-color: var(--color-texto-secundario);
}
.boton-confirmar {
  background: var(--color-exito);
  color: white;
}
.boton-confirmar:hover {
  filter: brightness(1.1);
  transform: translateY(-2px);
}
.ubicacion-campo-con-buscador {
  position: relative;
  z-index: 50;
}
</style>
