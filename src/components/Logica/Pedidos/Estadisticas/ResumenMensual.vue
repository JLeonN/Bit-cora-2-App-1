<template>
  <div class="contenedor-resumen">
    <!-- Tarjeta 1: Total de pedidos + items -->
    <div class="tarjeta-metrica">
      <div class="icono-metrica">
        <IconPackage :size="24" />
      </div>
      <div class="info-metrica">
        <p class="valor-metrica">{{ totalPedidos }}</p>
        <p class="label-metrica">Total de pedidos</p>
        <p class="valor-secundario">{{ totalItems }} items</p>
      </div>
    </div>

    <!-- Tarjeta 2: Días trabajados -->
    <div class="tarjeta-metrica">
      <div class="icono-metrica">
        <IconCalendarCheck :size="24" />
      </div>
      <div class="info-metrica">
        <p class="valor-metrica">{{ diasTrabajados }}</p>
        <p class="label-metrica">Días trabajados</p>
      </div>
    </div>

    <!-- Tarjeta 3: Mejores días -->
    <div class="tarjeta-metrica">
      <div class="icono-metrica">
        <IconTrophy :size="24" />
      </div>
      <div class="info-metrica">
        <p class="valor-metrica-doble">
          <span class="linea-metrica"
            >Pedidos: {{ mejorDiaFechaPedidos }} ({{ mejorDiaCantidadPedidos }})</span
          >
          <span class="linea-metrica"
            >Items: {{ mejorDiaFechaItems }} ({{ mejorDiaCantidadItems }})</span
          >
        </p>
        <p class="label-metrica">Mejores días</p>
      </div>
    </div>

    <!-- Tarjeta 4: Promedios -->
    <div class="tarjeta-metrica">
      <div class="icono-metrica">
        <component :is="iconoPromedio" :size="24" />
      </div>
      <div class="info-metrica">
        <p class="valor-metrica-triple">
          <span class="linea-metrica">{{ promedioPedidosPorDia }} pedidos/día</span>
          <span class="linea-metrica">{{ promedioItemsPorDia }} items/día</span>
          <span class="linea-metrica">{{ promedioItemsPorPedido }} items/pedido</span>
        </p>
        <p class="label-metrica">Promedios</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconPackage, IconCalendarCheck, IconTrophy } from '@tabler/icons-vue'
import { obtenerIconoPromedio } from '../obtenerIconoPorCantidad.js'

// Props: recibe los datos ya calculados
const props = defineProps({
  totalPedidos: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  diasTrabajados: {
    type: Number,
    required: true,
  },
  promedioPedidosPorDia: {
    type: String,
    required: true,
  },
  promedioItemsPorDia: {
    type: String,
    required: true,
  },
  promedioItemsPorPedido: {
    type: String,
    required: true,
  },
  mejorDiaFechaPedidos: {
    type: String,
    required: true,
  },
  mejorDiaCantidadPedidos: {
    type: Number,
    required: true,
  },
  mejorDiaFechaItems: {
    type: String,
    required: true,
  },
  mejorDiaCantidadItems: {
    type: Number,
    required: true,
  },
})

// Computed para íconos dinámicos
const iconoPromedio = computed(() => {
  const promedioRedondeado = parseInt(props.promedioPedidosPorDia)
  return obtenerIconoPromedio(promedioRedondeado)
})
</script>

<style scoped>
.contenedor-resumen {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
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
.icono-metrica {
  background: var(--color-fondo);
  padding: 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--borde-boton);
  color: var(--color-acento);
}
.info-metrica {
  flex: 1;
}
.valor-metrica {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0;
  line-height: 1;
}
.valor-metrica-doble,
.valor-metrica-triple {
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
.valor-secundario {
  font-size: 1rem;
  color: var(--color-acento);
  margin: 0.5rem 0 0 0;
  font-weight: 600;
}
/* Responsive */
@media (max-width: 768px) {
  .contenedor-resumen {
    grid-template-columns: 1fr;
    gap: 0.875rem;
  }
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
