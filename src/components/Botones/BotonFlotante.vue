<template>
  <button class="boton-flotante" @click="$emit('abrir-modal')">
    <IconPlus stroke="{2}" size="24" />
  </button>
</template>

<script setup>
import { IconPlus } from '@tabler/icons-vue'
</script>

<style scoped>
.boton-flotante {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background-color: var(--color-acento);
  color: var(--color-texto-principal);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.boton-flotante:hover {
  background-color: var(--color-primario);
}
</style>
