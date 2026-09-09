<template>
  <section v-if="cantidadStock > 0 || cantidadUbicaciones > 0" class="resumen-cambios-listado">
    <div v-if="cantidadStock > 0" class="categoria-cambio">
      <p><strong>{{ cantidadStock }}</strong> cambios de stock pendientes.</p>
      <button type="button" :disabled="enviandoStock" @click="emit('enviar-stock')">
        {{ enviandoStock ? 'Enviando…' : 'Enviar cambios a Stock' }}
      </button>
    </div>
    <div v-if="cantidadUbicaciones > 0" class="categoria-cambio">
      <p><strong>{{ cantidadUbicaciones }}</strong> cambios de ubicación pendientes.</p>
      <button type="button" :disabled="enviandoUbicaciones" @click="emit('enviar-ubicaciones')">
        {{ enviandoUbicaciones ? 'Enviando…' : 'Enviar cambios a Ubicaciones' }}
      </button>
    </div>
  </section>
</template>

<script setup>
defineProps({
  cantidadStock: { type: Number, required: true },
  cantidadUbicaciones: { type: Number, required: true },
  enviandoStock: { type: Boolean, required: true },
  enviandoUbicaciones: { type: Boolean, required: true },
})
const emit = defineEmits(['enviar-stock', 'enviar-ubicaciones'])
</script>

<style scoped>
.resumen-cambios-listado {
  display: grid;
  gap: 10px;
  padding: 14px;
  background: var(--color-primario-claro);
  border: 1px solid var(--color-primario);
  border-radius: 12px;
}
.categoria-cambio {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
p {
  margin: 0;
  color: var(--color-texto-principal);
}
button {
  min-height: 40px;
  padding: 8px 12px;
  color: var(--color-superficie);
  background: var(--color-primario);
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.55;
}
@media (max-width: 560px) {
  .categoria-cambio {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
