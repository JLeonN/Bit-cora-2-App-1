<template>
  <div class="contenedor-botones">
    <!-- <button class="boton-flotante" @click="$emit('descargar')" title="Descargar pedidos">
      <IconDownload stroke="2" size="24" />
    </button> -->

    <button class="boton-flotante" @click="$emit('enviar')" title="Enviar pedidos">
      <IconSend stroke="2" size="24" />
    </button>
  </div>
</template>

<script setup>
import {
  // IconDownload,
  IconSend,
} from '@tabler/icons-vue'
</script>

<style scoped>
.contenedor-botones {
  position: fixed;
  bottom: 65px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
}

.boton-flotante {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background-color: var(--color-primario);
  color: var(--color-texto-principal);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.boton-flotante:hover {
  background-color: var(--color-primario-oscuro);
}
</style>
