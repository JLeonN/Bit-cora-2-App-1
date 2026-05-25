<template>
  <q-page class="pagina-inicio">
    <div class="contenedor-botones">
      <div class="tarjeta-inicio-modulo" @click="irA('/TablaPedidos')">
        <div class="tarjeta-inicio-icono">
          <IconTableRow :size="48" :stroke="1.5" />
        </div>
        <h3 class="tarjeta-inicio-titulo">Pedidos</h3>
        <p class="tarjeta-inicio-descripcion">Gestiona tus pedidos diarios y consulta el historial</p>
      </div>
      <div class="tarjeta-inicio-modulo" @click="irA('/AjustarUbicaciones')">
        <div class="tarjeta-inicio-icono">
          <IconMapRoute :size="48" :stroke="1.5" />
        </div>
        <h3 class="tarjeta-inicio-titulo">Ubicaciones</h3>
        <p class="tarjeta-inicio-descripcion">Ajusta y actualiza las ubicaciones de tus artículos</p>
      </div>
      <div class="tarjeta-inicio-modulo" @click="irA('/ConsultaDeUbicacion')">
        <div class="tarjeta-inicio-icono">
          <IconSearch :size="48" :stroke="1.5" />
        </div>
        <h3 class="tarjeta-inicio-titulo">Consulta de ubicación</h3>
        <p class="tarjeta-inicio-descripcion">Busca un artículo y consulta o actualiza su ubicación</p>
      </div>
      <div class="tarjeta-inicio-modulo" @click="irA('/etiquetas')">
        <div class="tarjeta-inicio-icono">
          <IconTag :size="48" :stroke="1.5" />
        </div>
        <h3 class="tarjeta-inicio-titulo">Etiquetas</h3>
        <p class="tarjeta-inicio-descripcion">Genera etiquetas con códigos de barras para tus artículos</p>
      </div>
      <TarjetaContadorPasos />
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { IconTableRow, IconMapRoute, IconSearch, IconTag } from '@tabler/icons-vue'
import TarjetaContadorPasos from 'src/components/Logica/Pasos/TarjetaContadorPasos.vue'

const router = useRouter()

const irA = (ruta) => {
  router.push(ruta)
}
</script>

<style scoped>
.pagina-inicio {
  padding: 2rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--color-fondo);
}
.contenedor-botones {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
}
@media (max-width: 768px) {
  .pagina-inicio {
    padding: 1rem;
  }
  .contenedor-botones {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .tarjeta-inicio-modulo {
    padding: 1.5rem;
  }
  .tarjeta-inicio-titulo {
    font-size: 1.3rem;
  }
  .tarjeta-inicio-descripcion {
    font-size: 0.9rem;
  }
}
</style>
