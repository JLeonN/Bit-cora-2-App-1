<template>
  <div class="contenedor-botones" :class="{ 'layout-completo': layoutCompleto }">
    <button v-if="textoAceptar" class="boton boton-confirmar" @click="$emit('aceptar')">
      {{ textoAceptar }}
    </button>

    <button v-if="textoCancelar" class="boton boton-cancelar" @click="$emit('cancelar')">
      {{ textoCancelar }}
    </button>

    <button v-if="textoEliminar" class="boton boton-eliminar" @click="$emit('eliminar')">
      {{ textoEliminar }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  textoAceptar: String,
  textoCancelar: String,
  textoEliminar: String,
  layoutCompleto: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['aceptar', 'cancelar', 'eliminar'])
</script>

<style scoped>
.contenedor-botones {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
/* Layout completo: botones ocupan 50/50 */
.contenedor-botones.layout-completo {
  justify-content: stretch;
  gap: 0.75rem;
}
.contenedor-botones.layout-completo .boton {
  flex: 1;
}
.boton {
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}
.boton-confirmar {
  background-color: var(--color-exito);
  color: var(--color-texto-principal);
}
.boton-confirmar:hover {
  background-color: #388e3c;
}
.boton-cancelar {
  background-color: transparent;
  color: var(--color-texto-secundario);
}
.boton-cancelar:hover {
  background-color: var(--color-borde);
  color: var(--color-texto-principal);
}
.boton-eliminar {
  background-color: var(--color-error);
  color: white;
}
.boton-eliminar:hover {
  background-color: #c62828;
}
</style>
