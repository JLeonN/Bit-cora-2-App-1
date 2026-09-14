<template>
  <div
    class="modal-fondo"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-destino-excel"
    @click.self="cancelar"
  >
    <div class="modal-destino-excel">
      <h2 id="titulo-destino-excel">¿Cómo querés usar este Excel?</h2>
      <p v-if="nombreArchivo" class="nombre-excel-compartido">{{ nombreArchivo }}</p>
      <div class="acciones-destino-excel">
        <button
          type="button"
          class="boton-destino-excel boton-destino-maestro"
          :disabled="procesando"
          @click="emit('usar-como-maestro')"
        >
          Usar como Excel maestro
        </button>
        <button
          type="button"
          class="boton-destino-excel boton-destino-listado"
          :disabled="procesando"
          @click="emit('importar-como-listado')"
        >
          Importar como listado
        </button>
        <button
          type="button"
          class="boton-destino-excel boton-cancelar-destino"
          :disabled="procesando"
          @click="cancelar"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  nombreArchivo: { type: String, default: '' },
  procesando: { type: Boolean, default: false },
})
const emit = defineEmits(['usar-como-maestro', 'importar-como-listado', 'cancelar'])

function cancelar() {
  if (!props.procesando) emit('cancelar')
}
</script>

<style scoped>
.modal-destino-excel {
  width: min(90vw, 430px);
  max-height: min(85dvh, 620px);
  overflow-y: auto;
  padding: 24px;
  border: 1px solid var(--color-borde);
  border-radius: 14px;
  background: var(--color-superficie);
  color: var(--color-texto-principal);
  box-shadow: 0 14px 40px color-mix(in oklab, var(--color-fondo) 75%, transparent);
}
.modal-destino-excel h2 {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.35;
}
.nombre-excel-compartido {
  margin: 12px 0 0;
  overflow-wrap: anywhere;
  color: var(--color-texto-secundario);
}
.acciones-destino-excel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}
.boton-destino-excel {
  min-height: 44px;
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-borde);
  border-radius: 9px;
  color: var(--color-texto-principal);
  font-weight: 600;
  cursor: pointer;
}
.boton-destino-excel:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 2px;
}
.boton-destino-excel:disabled {
  cursor: wait;
  opacity: 0.6;
}
.boton-destino-maestro {
  background: var(--color-primario);
}
.boton-destino-listado {
  background: var(--color-primario-oscuro);
}
.boton-cancelar-destino {
  background: var(--color-fondo);
}
@media (max-width: 400px) {
  .modal-destino-excel {
    width: 88vw;
    padding: 18px;
  }
}
</style>
