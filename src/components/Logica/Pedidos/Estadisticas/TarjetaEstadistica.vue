<template>
  <div class="tarjeta-metrica">
    <div class="header-tarjeta">
      <span class="label-metrica">{{ labelPrincipal }}</span>
      <div class="icono-metrica">
        <component :is="icono" :size="32" stroke-width="1.5" />
      </div>
    </div>

    <div class="grid-datos">
      <div class="bloque-dato principal">
        <div v-if="Array.isArray(valorPrincipal)" class="grupo-lista">
          <div v-for="(linea, index) in valorPrincipal" :key="index" class="item-lista">
            <span class="bullet">•</span>
            <span class="valor-texto">{{ linea }}</span>
          </div>
        </div>

        <!-- Valor principal: número + texto -->
        <div v-else class="grupo-valor">
          <span class="valor-numero">{{ valorPrincipal }}</span>
          <span v-if="textoPrincipal" class="texto-descriptivo">{{ textoPrincipal }}</span>
        </div>
      </div>

      <!-- Valores secundarios -->
      <div v-if="valoresSecundarios && valoresSecundarios.length > 0" class="grupo-secundarios">
        <div
          v-for="(valor, index) in valoresSecundarios"
          :key="index"
          class="bloque-dato secundario"
        >
          <div class="grupo-valor">
            <span class="valor-numero secundario-numero">{{ valor.numero }}</span>
            <span class="texto-descriptivo secundario-texto">{{ valor.texto }}</span>
          </div>
        </div>
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
  textoPrincipal: {
    type: String,
    default: '',
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
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.tarjeta-metrica:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
  border-color: var(--color-acento);
}
/* Header */
.header-tarjeta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.label-metrica {
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-texto-secundario);
  margin-top: 0.25rem;
}
.icono-metrica {
  background: var(--color-fondo);
  padding: 0.75rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--borde-boton);
  color: var(--color-acento);
  flex-shrink: 0;
}
/* Datos */
.grid-datos {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  justify-content: flex-end;
}
.bloque-dato {
  display: flex;
  flex-direction: column;
}
/* Grupo de valor (número + texto) */
.grupo-valor {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}
/* Números en color acento */
.valor-numero {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-acento);
  line-height: 1;
}
/* Texto descriptivo en blanco */
.texto-descriptivo {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-texto-principal);
  line-height: 1;
}
/* Valores secundarios más pequeños */
.secundario-numero {
  font-size: 1.5rem;
}
.secundario-texto {
  font-size: 1.25rem;
}
/* Estilos específicos para la lista (Promedios) */
.grupo-lista {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}
.item-lista {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.item-lista:last-child {
  border-bottom: none;
}
.bullet {
  color: var(--color-acento);
  font-size: 1.2rem;
  line-height: 1;
}
.valor-texto {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-texto-principal);
}
/* Responsive */
@media (max-width: 768px) {
  .valor-numero {
    font-size: 1.75rem;
  }
  .texto-descriptivo {
    font-size: 1.25rem;
  }
  .secundario-numero {
    font-size: 1.25rem;
  }
  .secundario-texto {
    font-size: 1rem;
  }
}
</style>
