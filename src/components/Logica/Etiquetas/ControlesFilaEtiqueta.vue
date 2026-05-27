<template>
  <div class="campo-responsive">
    <span class="label-responsive">{{ modo === 'cantidad' ? 'Cantidad:' : 'Acciones:' }}</span>
    <div v-if="modo === 'cantidad'" class="control-cantidad">
      <button type="button" class="boton-cantidad boton-menos" @click="$emit('decrementar', indice)" :disabled="etiqueta.cantidad <= 1">
        <IconMinus :size="16" :stroke="2" />
      </button>
      <input
        type="number"
        min="1"
        :value="etiqueta.cantidad"
        @input="manejarInputCantidad"
        @change="manejarCambioCantidad"
        class="input-cantidad"
      />
      <button type="button" class="boton-cantidad boton-mas" @click="$emit('incrementar', indice)">
        <IconPlus :size="16" :stroke="2" />
      </button>
    </div>
    <div v-else class="acciones-ubicacion">
      <IconTrash class="icono-ubicacion icono-borrar" @click="$emit('eliminar', indice)" title="Eliminar etiqueta" />
    </div>
  </div>
</template>

<script setup>
import { IconTrash, IconPlus, IconMinus } from '@tabler/icons-vue'

const props = defineProps({
  etiqueta: {
    type: Object,
    required: true,
  },
  indice: {
    type: Number,
    required: true,
  },
  modo: {
    type: String,
    required: true,
    validator: (valor) => ['cantidad', 'acciones'].includes(valor),
  },
})

const emit = defineEmits(['incrementar', 'decrementar', 'actualizar', 'eliminar'])

function manejarInputCantidad(evento) {
  const valorIngresado = Number(evento.target.value)
  emit('actualizar', props.indice, valorIngresado)
}

function manejarCambioCantidad(evento) {
  const valorIngresado = Number(evento.target.value)
  emit('actualizar', props.indice, valorIngresado)
}
</script>

<style scoped>
.campo-responsive {
  display: grid;
  gap: 0.3rem;
}
.label-responsive {
  display: block;
  font-weight: 600;
  color: var(--color-primario-claro);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.35px;
  line-height: 1.1;
}
.control-cantidad {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  justify-content: flex-start;
}
.boton-cantidad {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}
.boton-cantidad:hover:not(:disabled) {
  background: var(--color-superficie);
  border-color: var(--color-primario);
  color: var(--color-primario);
}
.boton-cantidad:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.input-cantidad {
  width: 50px;
  padding: 0.3rem;
  text-align: center;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 4px;
  font-size: 0.9rem;
}
.input-cantidad:focus {
  outline: none;
  border-color: var(--color-primario);
}
.acciones-ubicacion {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}
.icono-ubicacion {
  cursor: pointer;
}
.icono-borrar {
  color: var(--color-error);
}
@media (max-width: 600px) {
  .campo-responsive {
    gap: 0.25rem;
    margin-bottom: 0.05rem;
    padding: 0.03rem 0;
  }
  .label-responsive {
    font-size: 0.7rem;
  }
  .control-cantidad {
    justify-content: flex-start;
    gap: 0.35rem;
    min-height: 1.9rem;
  }
  .boton-cantidad {
    width: 30px;
    height: 30px;
  }
  .input-cantidad {
    width: 44px;
    padding: 0.22rem;
    font-size: 0.82rem;
  }
  .acciones-ubicacion {
    justify-content: flex-end;
    gap: 0.5rem;
    min-height: 1.9rem;
    align-items: center;
  }
  .icono-ubicacion {
    width: 19px;
    height: 19px;
  }
}
@media (min-width: 601px) {
  .campo-responsive {
    gap: 0.35rem;
  }
  .boton-cantidad {
    width: 32px;
    height: 32px;
  }
  .input-cantidad {
    width: 52px;
    padding: 0.28rem;
  }
  .icono-ubicacion {
    width: 20px;
    height: 20px;
  }
}
</style>
