<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h3 class="modal-titulo">Editar Etiqueta</h3>

      <!-- Campo Código -->
      <div class="modal-campo">
        <label for="codigo-editar">Código del artículo</label>
        <input
          id="codigo-editar"
          type="text"
          v-model="etiquetaEditada.codigo"
          @focus="modalActivo = true"
          @blur="modalActivo = false"
        />
      </div>

      <!-- Campo Descripción -->
      <div class="modal-campo">
        <label for="descripcion-editar">Descripción</label>
        <textarea
          id="descripcion-editar"
          v-model="etiquetaEditada.descripcion"
          @focus="modalActivo = true"
          @blur="modalActivo = false"
          rows="3"
        ></textarea>
      </div>

      <!-- Campo Ubicación -->
      <div class="modal-campo">
        <label for="ubicacion-editar">Ubicación</label>
        <input
          id="ubicacion-editar"
          type="text"
          v-model="etiquetaEditada.ubicacion"
          @focus="modalActivo = true"
          @blur="modalActivo = false"
        />
      </div>

      <!-- Campo Cantidad -->
      <div class="modal-campo">
        <label for="cantidad-editar">Cantidad de copias</label>
        <input
          id="cantidad-editar"
          type="number"
          min="1"
          v-model.number="etiquetaEditada.cantidad"
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
  etiqueta: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['guardar', 'cerrar', 'modal-abierto', 'modal-cerrado'])

const etiquetaEditada = ref({
  id: props.etiqueta.id,
  codigo: props.etiqueta.codigo,
  descripcion: props.etiqueta.descripcion,
  ubicacion: props.etiqueta.ubicacion,
  cantidad: props.etiqueta.cantidad,
  tamano: props.etiqueta.tamano,
})

const modalActivo = ref(false)

watch(
  () => props.etiqueta,
  (nuevo) => {
    etiquetaEditada.value = {
      id: nuevo.id,
      codigo: nuevo.codigo,
      descripcion: nuevo.descripcion,
      ubicacion: nuevo.ubicacion,
      cantidad: nuevo.cantidad,
      tamano: nuevo.tamano,
    }
  },
  { deep: true },
)

watch(
  () => etiquetaEditada.value.ubicacion,
  (newValue) => {
    if (typeof newValue === 'string') {
      const formattedValue = newValue.toUpperCase().replace(/\s+/g, '-')
      if (formattedValue !== etiquetaEditada.value.ubicacion) {
        etiquetaEditada.value.ubicacion = formattedValue
      }
    }
  },
)

function guardarCambios() {
  if (!etiquetaEditada.value.codigo.trim()) {
    alert('El código no puede estar vacío')
    return
  }

  if (!etiquetaEditada.value.descripcion.trim()) {
    alert('La descripción no puede estar vacía')
    return
  }

  if (etiquetaEditada.value.cantidad < 1) {
    etiquetaEditada.value.cantidad = 1
  }

  const ubicacionFinal = (etiquetaEditada.value.ubicacion || '').replace(/^-+|-+$/g, '')

  emit('guardar', {
    ...etiquetaEditada.value,
    codigo: etiquetaEditada.value.codigo.trim().toUpperCase(),
    descripcion: etiquetaEditada.value.descripcion.trim(),
    ubicacion: ubicacionFinal || 'Sin ubicación',
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

<style scoped>
.modal-campo textarea {
  padding: 0.5rem;
  border: 1px solid var(--color-borde);
  background-color: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
}
.modal-campo textarea:focus {
  outline: none;
  border-color: var(--color-primario);
}
</style>
