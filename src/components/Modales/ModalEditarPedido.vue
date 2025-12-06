<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div :class="['modal-contenido', { activo: modalActivo }]">
      <h3 class="modal-titulo">Editar Pedido</h3>

      <!-- Campo: Número de pedido -->
      <div class="modal-campo">
        <label for="pedido">Número de pedido</label>
        <input
          id="pedido"
          type="text"
          v-model="pedidoEditado"
          @focus="modalActivo = true"
          @blur="modalActivo = false"
        />
      </div>

      <!-- Campo: Cantidad de items -->
      <div class="modal-campo">
        <label for="items">Cantidad de items</label>
        <input
          id="items"
          type="number"
          inputmode="numeric"
          min="1"
          v-model.number="itemsEditados"
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
import { ref, watch } from 'vue'
import DosBotones from '../Botones/TresBotones.vue'

const props = defineProps({
  pedido: String,
  items: {
    type: Number,
    default: 1,
  },
})
const emit = defineEmits(['guardar', 'cerrar'])

const pedidoEditado = ref(props.pedido)
const itemsEditados = ref(props.items || 1)
const modalActivo = ref(false)

watch(
  () => props.pedido,
  (nuevo) => {
    pedidoEditado.value = nuevo
  },
)

watch(
  () => props.items,
  (nuevo) => {
    itemsEditados.value = nuevo || 1
  },
)

function guardarCambios() {
  emit('guardar', {
    numero: pedidoEditado.value,
    items: itemsEditados.value,
  })
}
</script>

<style scoped>
/* Modal fondo */
.modal-fondo {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
/* Modal contenido */
.modal-contenido {
  background: var(--color-superficie);
  border-radius: 16px;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
}
.modal-contenido.activo {
  transform: translateY(-30%);
}
/* Título */
.modal-titulo {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-texto-principal);
}
/* Campo del modal */
.modal-campo {
  margin-bottom: 1rem;
}
.modal-campo label {
  display: block;
  font-size: 0.95rem;
  color: var(--color-texto-secundario);
  margin-bottom: 0.5rem;
}
.modal-campo input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 1rem;
}
.modal-campo input:focus {
  outline: none;
  border-color: var(--color-acento);
}
/* Input number sin flechas */
.input-items-escaneado::-webkit-inner-spin-button,
.input-items-escaneado::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.input-items-escaneado {
  appearance: textfield;
  -moz-appearance: textfield;
}
</style>
