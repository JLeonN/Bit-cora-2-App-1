<template>
  <div class="modal-fondo" @click.self="$emit('cerrar')">
    <div class="modal-contenido">
      <h3 class="modal-titulo">¿Eliminar Pedido?</h3>
      <p class="modal-campo">
        ¿Estás seguro de que querés eliminar el pedido <strong>{{ pedido }}</strong
        >?
      </p>
      <div class="modal-botones">
        <button @click="$emit('cerrar')">Cancelar</button>
        <button @click="$emit('confirmar')">Eliminar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  pedido: String,
})

defineEmits(['cerrar', 'confirmar'])
</script>
