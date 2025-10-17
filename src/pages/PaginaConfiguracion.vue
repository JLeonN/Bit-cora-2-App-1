<template>
  <div class="pagina-configuracion">
    <div class="contenedor-configuracion">
      <!-- SECCIÓN: Información Personal -->
      <TarjetaSeccion titulo="Información Personal" :icono="IconUser" :expandida-por-defecto="true">
        <ConfiguracionUsuario @nombre-actualizado="manejarNombreActualizado" />
      </TarjetaSeccion>

      <!-- SECCIÓN: Tutoriales y Ayuda -->
      <TarjetaSeccion titulo="Tutoriales y Ayuda" :icono="IconBook" :expandida-por-defecto="false">
        <SeccionTutoriales />
      </TarjetaSeccion>
    </div>
  </div>
</template>

<script setup>
import { getCurrentInstance } from 'vue'
import { IconUser, IconBook } from '@tabler/icons-vue'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import ConfiguracionUsuario from '../components/Configuracion/ConfiguracionUsuario.vue'
import SeccionTutoriales from '../components/Configuracion/Tutoriales/SeccionTutoriales.vue'

const instance = getCurrentInstance()

// Configurar barra de botones al montar el componente
const configurarBarraBotones = () => {
  const emit = instance?.emit
  if (emit) {
    emit('configurar-barra', {
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
    })
  }
}

// Manejar actualización de nombre
const manejarNombreActualizado = (nuevoNombre) => {
  console.log('Nombre actualizado:', nuevoNombre)
  // El MainLayout se encarga de actualizar el nombre automáticamente con el polling
}

// Configurar al montar
configurarBarraBotones()
</script>

<style scoped>
.pagina-configuracion {
  min-height: 100vh;
  padding: 20px;
  background: var(--color-fondo);
}
.contenedor-configuracion {
  max-width: 800px;
  margin: 0 auto;
}
/* Responsive */
@media (max-width: 600px) {
  .pagina-configuracion {
    padding: 15px;
  }
}
</style>
