<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div class="modal-contenido">
      <h3 class="modal-titulo">¿Eliminar Pedido?</h3>
      <p class="modal-campo">
        ¿Estás seguro de que querés eliminar el pedido <strong>{{ pedido }}</strong
        >?
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
  pedido: String,
})

defineEmits(['cerrar', 'confirmar'])
</script>
