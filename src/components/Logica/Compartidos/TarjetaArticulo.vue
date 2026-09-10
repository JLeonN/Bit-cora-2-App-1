<template>
  <article class="tarjeta-articulo-compartida">
    <header class="encabezado-tarjeta-articulo">
      <p class="nombre-tarjeta-articulo">{{ nombre }}</p>
      <p class="codigo-tarjeta-articulo">{{ codigo }}</p>
    </header>
    <div v-if="$slots.contenido" class="contenido-tarjeta-articulo">
      <slot name="contenido" />
    </div>
    <footer class="pie-tarjeta-articulo">
      <div class="informacion-pie-tarjeta">
        <slot name="informacion-pie" />
      </div>
      <div class="acciones-tarjeta-articulo">
        <slot name="acciones" />
      </div>
    </footer>
  </article>
</template>

<script setup>
defineProps({
  nombre: { type: String, default: '' },
  codigo: { type: String, default: '' },
})
</script>

<style scoped>
.tarjeta-articulo-compartida {
  padding: 1rem;
  background: var(--color-fondo);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
}
.encabezado-tarjeta-articulo {
  min-width: 0;
}
.nombre-tarjeta-articulo {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--color-texto-principal);
  font-size: 1.15rem;
  font-weight: 700;
}
.codigo-tarjeta-articulo {
  margin: 0.2rem 0 0 0;
  overflow-wrap: anywhere;
  color: var(--color-texto-secundario);
}
.contenido-tarjeta-articulo {
  min-height: 5.4rem;
}
.pie-tarjeta-articulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-top: 0.8rem;
}
.informacion-pie-tarjeta {
  min-width: 0;
}
.acciones-tarjeta-articulo {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}
.acciones-tarjeta-articulo :slotted(.boton-accion-tarjeta) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 50%;
  cursor: pointer;
}
@media (max-width: 370px) {
  .pie-tarjeta-articulo {
    align-items: flex-start;
    flex-direction: column;
  }
  .acciones-tarjeta-articulo {
    align-self: flex-end;
  }
}
</style>
