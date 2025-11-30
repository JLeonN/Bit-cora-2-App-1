<template>
  <div class="contenedor-estadisticas">
    <h2 class="titulo-estadisticas">Estadísticas de Pedidos</h2>
    <p class="subtitulo-estadisticas">Resumen del mes actual</p>

    <!-- Componente hijo: ResumenMensual -->
    <ResumenMensual />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import ResumenMensual from './ResumenMensual.vue'

// Emit para configurar la barra inferior
const emit = defineEmits(['configurar-barra'])

// Configuración dinámica de la barra inferior
const configuracionBarra = computed(() => ({
  mostrarAgregar: false,
  mostrarEnviar: false,
  puedeEnviar: false,
  botonesPersonalizados: [],
}))

// Métodos que la barra inferior va a llamar
const metodosParaBarra = {
  onAgregar: () => {},
  onEnviar: () => {},
  onAccionPersonalizada: () => {},
}

// Función para actualizar la configuración de la barra
const actualizarConfiguracionBarra = () => {
  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
}

onMounted(() => {
  actualizarConfiguracionBarra()
})

onUnmounted(() => {
  // Limpiar configuración de la barra al salir de la página
  emit(
    'configurar-barra',
    {
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
    },
    null,
  )
})
</script>

<style scoped>
.contenedor-estadisticas {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
.titulo-estadisticas {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-texto-principal);
  margin: 0 0 0.5rem 0;
  text-align: center;
}
.subtitulo-estadisticas {
  font-size: 1rem;
  color: var(--color-texto-secundario);
  margin: 0 0 2rem 0;
  text-align: center;
}
/* Responsive */
@media (max-width: 600px) {
  .contenedor-estadisticas {
    padding: 1rem;
  }
  .titulo-estadisticas {
    font-size: 1.5rem;
  }
  .subtitulo-estadisticas {
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
}
</style>
