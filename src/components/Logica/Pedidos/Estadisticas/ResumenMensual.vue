<template>
  <div class="contenedor-resumen">
    <!-- Tarjeta 1: Total de pedidos + items -->
    <TarjetaEstadistica
      :icono="IconPackage"
      :valor-principal="totalPedidos"
      label-principal="Total de pedidos"
      :valores-secundarios="[`${totalItems} Items`]"
    />

    <!-- Tarjeta 2: Días trabajados -->
    <TarjetaEstadistica
      :icono="IconCalendarCheck"
      :valor-principal="diasTrabajados"
      label-principal="Días trabajados"
    />

    <!-- Tarjeta 3: Mejores días -->
    <TarjetaEstadistica
      :icono="IconTrophy"
      :valor-principal="[
        `Pedidos: ${mejorDiaFechaPedidos} (${mejorDiaCantidadPedidos})`,
        `Items: ${mejorDiaFechaItems} (${mejorDiaCantidadItems})`,
      ]"
      label-principal="Mejores días"
    />

    <!-- Tarjeta 4: Promedios -->
    <TarjetaEstadistica
      :icono="iconoPromedio"
      :valor-principal="[
        `${promedioPedidosPorDia} Pedidos por día`,
        `${promedioItemsPorDia} Items por día`,
        `${promedioItemsPorPedido} Items por pedido`,
      ]"
      label-principal="Promedios"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconPackage, IconCalendarCheck, IconTrophy } from '@tabler/icons-vue'
import { obtenerIconoPromedio } from '../obtenerIconoPorCantidad.js'
import TarjetaEstadistica from './TarjetaEstadistica.vue'

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
/* Responsive */
@media (max-width: 768px) {
  .contenedor-resumen {
    grid-template-columns: 1fr;
    gap: 0.875rem;
  }
}
</style>
