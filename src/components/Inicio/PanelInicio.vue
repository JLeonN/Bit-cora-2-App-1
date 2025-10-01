<template>
  <q-page class="pagina-inicio">
    <div class="contenedor-botones">
      <!-- PEDIDOS -->
      <div class="tarjeta-funcion" @click="irA('/TablaPedidos')">
        <div class="icono-funcion">
          <IconTableRow :size="48" :stroke="1.5" />
        </div>
        <h3>Pedidos</h3>
        <p>Gestiona tus pedidos diarios y consulta el historial</p>
      </div>

      <!-- UBICACIONES -->
      <div class="tarjeta-funcion" @click="irA('/AjustarUbicaciones')">
        <div class="icono-funcion">
          <IconMapRoute :size="48" :stroke="1.5" />
        </div>
        <h3>Ubicaciones</h3>
        <p>Ajusta y actualiza las ubicaciones de tus artículos</p>
      </div>

      <!-- ETIQUETAS -->
      <div class="tarjeta-funcion" @click="irA('/etiquetas')">
        <div class="icono-funcion">
          <IconTag :size="48" :stroke="1.5" />
        </div>
        <h3>Etiquetas</h3>
        <p>Genera etiquetas con códigos de barras para tus artículos</p>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { IconTableRow, IconMapRoute, IconTag } from '@tabler/icons-vue'

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
.tarjeta-funcion {
  background: var(--color-superficie);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--sombra-boton);
  border: 1px solid var(--color-borde);
}
.tarjeta-funcion:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px var(--sombra-boton);
  border-color: var(--color-primario);
}
.icono-funcion {
  color: var(--color-primario);
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
.tarjeta-funcion h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-texto-principal);
  margin: 0 0 0.5rem 0;
}
.tarjeta-funcion p {
  font-size: 0.95rem;
  color: var(--color-texto-secundario);
  margin: 0;
  line-height: 1.5;
}
/* RESPONSIVE */
@media (max-width: 768px) {
  .pagina-inicio {
    padding: 1rem;
  }
  .contenedor-botones {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .tarjeta-funcion {
    padding: 1.5rem;
  }
  .tarjeta-funcion h3 {
    font-size: 1.3rem;
  }
  .tarjeta-funcion p {
    font-size: 0.9rem;
  }
}
</style>
