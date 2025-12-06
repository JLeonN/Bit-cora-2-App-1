<template>
  <div :class="['tarjeta-metrica', { 'tarjeta-destacada': destacada }]">
    <div class="icono-metrica">
      <component :is="icono" :size="24" />
    </div>
    <div class="info-metrica">
      <!-- Valor principal (puede ser número o múltiples líneas) -->
      <div v-if="Array.isArray(valorPrincipal)" class="valor-metrica-multiple">
        <span v-for="(linea, index) in valorPrincipal" :key="index" class="linea-metrica">
          {{ linea }}
        </span>
      </div>
      <p v-else class="valor-metrica">{{ valorPrincipal }}</p>

      <!-- Label principal -->
      <p class="label-metrica">{{ labelPrincipal }}</p>

      <!-- Valores secundarios (opcionales) -->
      <div v-if="valoresSecundarios && valoresSecundarios.length > 0" class="valores-secundarios">
        <p v-for="(valor, index) in valoresSecundarios" :key="index" class="valor-secundario">
          {{ valor }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icono: {
    type: Object,
    required: true,
  },
  valorPrincipal: {
    type: [String, Number, Array],
    required: true,
  },
  labelPrincipal: {
    type: String,
    required: true,
  },
  valoresSecundarios: {
    type: Array,
    default: () => [],
  },
  destacada: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.tarjeta-metrica {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.tarjeta-metrica:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--sombra-boton);
}
.tarjeta-destacada {
  background: linear-gradient(135deg, var(--color-superficie) 0%, var(--color-fondo) 100%);
}
.icono-metrica {
  background: var(--color-fondo);
  padding: 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--borde-boton);
  color: var(--color-acento);
  flex-shrink: 0;
}
.info-metrica {
  flex: 1;
  min-width: 0;
}
.valor-metrica {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0;
  line-height: 1;
}
.valor-metrica-multiple {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0;
}
.linea-metrica {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-texto-principal);
  line-height: 1.3;
}
.label-metrica {
  font-size: 0.875rem;
  color: var(--color-texto-secundario);
  margin: 0.5rem 0 0 0;
}
.valores-secundarios {
  margin-top: 0.5rem;
}
.valor-secundario {
  font-size: 1rem;
  color: var(--color-acento);
  margin: 0.25rem 0 0 0;
  font-weight: 600;
}
.valor-secundario:first-child {
  margin-top: 0;
}
/* Responsive */
@media (max-width: 768px) {
  .tarjeta-metrica {
    padding: 1.25rem;
  }
  .valor-metrica {
    font-size: 1.75rem;
  }
  .linea-metrica {
    font-size: 0.85rem;
  }
}
@media (max-width: 480px) {
  .tarjeta-metrica {
    padding: 1rem;
    gap: 0.875rem;
  }
  .icono-metrica {
    padding: 0.625rem;
  }
  .valor-metrica {
    font-size: 1.5rem;
  }
  .linea-metrica {
    font-size: 0.8rem;
  }
  .label-metrica {
    font-size: 0.8rem;
  }
  .valor-secundario {
    font-size: 0.9rem;
  }
}
</style>
