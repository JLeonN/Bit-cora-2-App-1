<template>
  <q-page class="pagina-configuracion">
    <div class="contenedor-configuracion">
      <div class="header-config">
        <IconSettings class="icono-header" :stroke="2" />
        <h2 class="titulo-pagina">Configuración</h2>
      </div>

      <!-- Componente de configuración de usuario -->
      <ConfiguracionUsuario @nombre-actualizado="actualizarNombreEnLayout" />
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { IconSettings } from '@tabler/icons-vue'
import ConfiguracionUsuario from '../components/Configuracion/ConfiguracionUsuario.vue'

// Props y emits para la barra inferior
const emit = defineEmits(['configurar-barra'])

// Configurar barra de botones al montar
onMounted(() => {
  emit('configurar-barra', {
    mostrarAgregar: false,
    mostrarEnviar: false,
    puedeEnviar: false,
    botonesPersonalizados: [],
  })
})

// Limpiar configuración al desmontar
onUnmounted(() => {
  emit('configurar-barra', {
    mostrarAgregar: false,
    mostrarEnviar: false,
    puedeEnviar: false,
    botonesPersonalizados: [],
  })
})

// Método para comunicar cambio de nombre al MainLayout
const actualizarNombreEnLayout = (nuevoNombre) => {
  // Emitir evento global o usar un store
  // Por ahora el MainLayout deberá actualizar por su cuenta
  console.log('Nombre actualizado:', nuevoNombre)
}
</script>

<style scoped>
.pagina-configuracion {
  padding: 20px;
  background: var(--color-fondo);
  min-height: 100vh;
}
.contenedor-configuracion {
  max-width: 800px;
  margin: 0 auto;
}
.header-config {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
  padding: 20px;
  background: var(--color-superficie);
  border-radius: 12px;
}
.icono-header {
  color: var(--color-primario);
  width: 32px;
  height: 32px;
}
.titulo-pagina {
  color: var(--color-texto-principal);
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}
/* Responsive */
@media (max-width: 768px) {
  .pagina-configuracion {
    padding: 15px;
  }
  .header-config {
    padding: 15px;
  }
  .titulo-pagina {
    font-size: 20px;
  }
}
</style>
