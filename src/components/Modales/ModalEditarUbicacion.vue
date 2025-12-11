<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h3 class="modal-titulo">Editar Ubicación</h3>

      <!-- Campo Código -->
      <div class="modal-campo">
        <label for="codigo">Código del artículo</label>
        <input
          id="codigo"
          type="text"
          v-model="codigoEditado"
          @focus="modalActivo = true"
          @blur="modalActivo = false"
        />
      </div>

      <!-- Campo Ubicación -->
      <div class="modal-campo">
        <label for="ubicacion">Ubicación</label>
        <input
          id="ubicacion"
          type="text"
          v-model="ubicacionEditada"
          @focus="modalActivo = true"
          @blur="modalActivo = false"
        />
      </div>

      <DosBotones
        textoAceptar="Guardar"
        textoCancelar="Cancelar"
        @aceptar="guardarCambios"
        @cancelar="$emit('cerrar')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'

const props = defineProps({
  codigo: String,
  ubicacion: String,
})

const emit = defineEmits(['guardar', 'cerrar', 'modal-abierto', 'modal-cerrado'])

const codigoEditado = ref(props.codigo)
const ubicacionEditada = ref(props.ubicacion)
const modalActivo = ref(false)

watch(
  () => props.codigo,
  (nuevo) => {
    codigoEditado.value = nuevo
  },
)

watch(
  () => props.ubicacion,
  (nueva) => {
    ubicacionEditada.value = nueva
  },
)

function guardarCambios() {
  emit('guardar', {
    codigo: codigoEditado.value,
    ubicacion: ubicacionEditada.value,
  })
}

// Emitir que el modal está abierto al montar
onMounted(() => {
  emit('modal-abierto')
})

// Emitir que el modal está cerrado al desmontar
onUnmounted(() => {
  emit('modal-cerrado')
})
</script>
