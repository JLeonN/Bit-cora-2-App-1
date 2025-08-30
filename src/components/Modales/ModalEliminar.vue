<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div class="modal-contenido">
      <h3 class="modal-titulo">¿Eliminar?</h3>
      <p class="modal-campo">
        ¿Estás seguro de que querés eliminar
        <strong v-if="texto">{{ texto }}</strong>
        <span v-else>esto</span>?
      </p>

      <DosBotones
        textoCancelar="Cancelar"
        textoEliminar="Eliminar"
        @cancelar="$emit('cerrar')"
        @eliminar="$emit('confirmar')"
      />
    </div>
  </div>
</template>

<script setup>
import DosBotones from '../Botones/TresBotones.vue'

defineProps({
  texto: {
    type: String,
    default: '',
  },
})

defineEmits(['cerrar', 'confirmar'])
</script>
