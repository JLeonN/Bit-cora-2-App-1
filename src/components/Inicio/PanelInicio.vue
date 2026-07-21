<template>
  <q-page class="pagina-inicio">
    <div class="grilla-modulos-inicio">
      <TarjetaModuloInicio
        v-for="modulo in modulosInicio"
        :key="modulo.ruta"
        v-bind="modulo"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import {
  IconMapRoute,
  IconPackages,
  IconPaw,
  IconSearch,
  IconSettings,
  IconTableRow,
  IconTag,
} from '@tabler/icons-vue'
import TarjetaModuloInicio from 'src/components/Inicio/TarjetaModuloInicio.vue'
import { servicioPasos } from 'src/components/Logica/Pasos/ServicioPasos.js'

const modulosDisponibles = [
  {
    titulo: 'Pedidos',
    descripcion: 'Gestiona tus pedidos diarios y consulta el historial',
    icono: IconTableRow,
    ruta: '/TablaPedidos',
  },
  {
    titulo: 'Ubicaciones',
    descripcion: 'Ajusta y actualiza las ubicaciones de tus artículos',
    icono: IconMapRoute,
    ruta: '/AjustarUbicaciones',
  },
  {
    titulo: 'Consulta de ubicación',
    descripcion: 'Busca un artículo y consulta o actualiza su ubicación',
    icono: IconSearch,
    ruta: '/ConsultaDeUbicacion',
  },
  {
    titulo: 'Stock',
    descripcion: 'Cuenta artículos y compara el resultado con el Excel',
    icono: IconPackages,
    ruta: '/stock',
  },
  {
    titulo: 'Etiquetas',
    descripcion: 'Genera etiquetas con códigos de barras para tus artículos',
    icono: IconTag,
    ruta: '/etiquetas',
  },
  {
    titulo: 'Contador de pasos',
    descripcion: 'Monitorea pasos diarios',
    icono: IconPaw,
    ruta: '/ContadorPasos',
  },
  {
    titulo: 'Tutoriales y configuración',
    descripcion: 'Accede a tutoriales y ajusta la configuración de la app',
    icono: IconSettings,
    ruta: '/configuracion?tutoriales=1',
  },
]

const modulosInicio = computed(() =>
  modulosDisponibles.filter(
    (modulo) => modulo.ruta !== '/ContadorPasos' || servicioPasos.estaDisponible(),
  ),
)
</script>

<style scoped>
.pagina-inicio {
  box-sizing: border-box;
  padding: 12px 16px var(--espacio-inferior-contenido, calc(84px + env(safe-area-inset-bottom, 0px)));
  background: var(--color-fondo);
}
.grilla-modulos-inicio {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 284px;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
@media (max-width: 1100px) {
  .grilla-modulos-inicio {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .pagina-inicio {
    padding: 1rem 1rem var(--espacio-inferior-contenido, calc(80px + env(safe-area-inset-bottom, 0px)));
  }
  .grilla-modulos-inicio {
    grid-template-columns: 1fr;
    grid-auto-rows: 240px;
    gap: 1rem;
  }
}
</style>
