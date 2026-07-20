<template>
  <RouterLink :to="ruta" class="tarjeta-modulo-inicio">
    <div class="tarjeta-modulo-inicio-icono">
      <component :is="icono" :size="48" :stroke="1.5" />
    </div>
    <h3 class="tarjeta-modulo-inicio-titulo">{{ titulo }}</h3>
    <p class="tarjeta-modulo-inicio-descripcion">{{ descripcion }}</p>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  titulo: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  icono: {
    type: [Object, Function],
    required: true,
  },
  ruta: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.tarjeta-modulo-inicio {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
  text-align: center;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--sombra-boton);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.tarjeta-modulo-inicio:hover {
  transform: translateY(-4px);
  border-color: var(--color-primario);
  box-shadow: 0 4px 16px var(--sombra-boton);
}
.tarjeta-modulo-inicio:focus-visible {
  outline: 2px solid var(--color-acento);
  outline-offset: 3px;
}
.tarjeta-modulo-inicio-icono {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: var(--color-primario);
}
.tarjeta-modulo-inicio-titulo {
  margin: 0 0 0.5rem;
  color: var(--color-texto-principal);
  font-size: 1.5rem;
  font-weight: 600;
}
.tarjeta-modulo-inicio-descripcion {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.95rem;
  line-height: 1.5;
}
@media (max-width: 640px) {
  .tarjeta-modulo-inicio {
    padding: 1.5rem;
  }
  .tarjeta-modulo-inicio-titulo {
    font-size: 1.3rem;
  }
  .tarjeta-modulo-inicio-descripcion {
    font-size: 0.9rem;
  }
}
</style>
