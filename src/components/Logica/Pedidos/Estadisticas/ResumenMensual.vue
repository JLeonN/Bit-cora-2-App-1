<template>
  <div class="contenedor-resumen">
    <!-- Tarjeta: Total de pedidos -->
    <div class="tarjeta-metrica">
      <div class="icono-metrica">
        <IconPackage :size="24" />
      </div>
      <div class="info-metrica">
        <p class="valor-metrica">{{ totalPedidos }}</p>
        <p class="label-metrica">Total de pedidos</p>
      </div>
    </div>

    <!-- Tarjeta: Días trabajados -->
    <div class="tarjeta-metrica">
      <div class="icono-metrica">
        <IconCalendarCheck :size="24" />
      </div>
      <div class="info-metrica">
        <p class="valor-metrica">{{ diasTrabajados }}</p>
        <p class="label-metrica">Días trabajados</p>
      </div>
    </div>

    <!-- Tarjeta: Promedio por día -->
    <div class="tarjeta-metrica">
      <div class="icono-metrica">
        <IconChartLine :size="24" />
      </div>
      <div class="info-metrica">
        <p class="valor-metrica">{{ promedioPorDia }}</p>
        <p class="label-metrica">Promedio por día</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconPackage, IconCalendarCheck, IconChartLine } from '@tabler/icons-vue'

// Props: recibe los datos ya calculados
defineProps({
  totalPedidos: {
    type: Number,
    required: true,
  },
  diasTrabajados: {
    type: Number,
    required: true,
  },
  promedioPorDia: {
    type: String,
    required: true,
  },
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
.tarjeta-metrica.destacada {
  background: linear-gradient(135deg, var(--color-primario-oscuro) 0%, var(--color-primario) 100%);
  border-color: var(--color-primario);
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
.tarjeta-metrica.destacada .icono-metrica {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
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
.tarjeta-metrica.destacada .valor-metrica {
  color: white;
}
.label-metrica {
  font-size: 0.875rem;
  color: var(--color-texto-secundario);
  margin: 0.25rem 0 0 0;
}
.tarjeta-metrica.destacada .label-metrica {
  color: rgba(255, 255, 255, 0.9);
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
  .label-metrica {
    font-size: 0.8rem;
  }
}
</style>
