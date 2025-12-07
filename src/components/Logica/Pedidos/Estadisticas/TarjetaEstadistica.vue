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

        <span v-else class="valor-numero">{{ valorPrincipal }}</span>
      </div>

      <div v-if="valoresSecundarios && valoresSecundarios.length > 0" class="grupo-secundarios">
        <div
          v-for="(valor, index) in valoresSecundarios"
          :key="index"
          class="bloque-dato secundario"
        >
          <span class="valor-numero secundario-texto">{{ valor }}</span>
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
    type: [String, Number, Array], // Acepta arrays para la lista de promedios
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
  // Mantenemos la prop por compatibilidad, pero ya no afecta el estilo visual
  destacada: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.tarjeta-metrica {
  background: var(--color-superficie); /* Asegura fondo uniforme */
  border: 1px solid var(--color-borde); /* Borde uniforme para todas */
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* Más espacio entre titulo y números */
  height: 100%;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.tarjeta-metrica:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); /* Sombra un poco más elegante */
  border-color: var(--color-acento); /* Solo al pasar el mouse se ilumina el borde sutilmente */
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
  padding: 0.75rem; /* Contenedor del icono un poco más grande */
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
  flex: 1; /* Para que ocupe el resto de la altura */
  justify-content: flex-end; /* Alinea los números abajo si sobra espacio */
}

.bloque-dato {
  display: flex;
  flex-direction: column;
}

.valor-numero {
  font-size: 2.25rem; /* Números más grandes e impactantes */
  font-weight: 700;
  color: var(--color-texto-principal);
  line-height: 1;
}

.secundario-texto {
  font-size: 1.5rem; /* El texto secundario (ej. "242 items") un poco más chico pero legible */
  color: var(--color-acento);
  font-weight: 600;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Separador sutil */
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
  .secundario-texto {
    font-size: 1.25rem;
  }
}
</style>
