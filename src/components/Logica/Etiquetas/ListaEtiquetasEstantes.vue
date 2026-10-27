<template>
  <section class="seccion-etiquetas-estantes" aria-label="Etiquetas de estantes preparadas">
    <div v-if="etiquetas.length" class="encabezado-lista-estantes">
      <p>{{ etiquetas.length }} etiquetas de estantes preparadas</p>
      <button type="button" class="boton-limpiar-estantes" @click="emit('limpiar-estantes')">Limpiar todo</button>
    </div>
    <div v-if="etiquetas.length" class="grilla-etiquetas-estantes">
      <article v-for="codigo in etiquetas" :key="codigo" class="tarjeta-estante">
        <div class="vista-etiqueta-estante" :class="{ 'vista-etiqueta-estante-chica': configuracion.pagina.alto <= 25 }" :style="{ aspectRatio: `${configuracion.pagina.ancho} / ${configuracion.pagina.alto}` }">
          <span>{{ codigo }}</span>
        </div>
        <button type="button" class="boton-eliminar-estante" :aria-label="`Eliminar etiqueta ${codigo}`" @click="emit('eliminar-estante', codigo)">Eliminar</button>
      </article>
    </div>
    <p v-else class="sin-etiquetas-estantes">Todavía no hay etiquetas de estantes. Agregalas desde el formulario de arriba.</p>
  </section>
</template>

<script setup>
defineProps({
  etiquetas: { type: Array, required: true },
  configuracion: { type: Object, required: true },
})
const emit = defineEmits(['eliminar-estante', 'limpiar-estantes'])
</script>

<style scoped>
.seccion-etiquetas-estantes {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}
.encabezado-lista-estantes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.encabezado-lista-estantes p,
.sin-etiquetas-estantes {
  margin: 0;
  color: var(--color-texto-secundario);
}
.boton-limpiar-estantes,
.boton-eliminar-estante {
  padding: 0.45rem 0.7rem;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  cursor: pointer;
}
.boton-limpiar-estantes:focus-visible,
.boton-eliminar-estante:focus-visible {
  outline: 2px solid var(--color-primario);
  outline-offset: 2px;
}
.grilla-etiquetas-estantes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}
.tarjeta-estante {
  padding: 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: var(--color-superficie);
}
.vista-etiqueta-estante {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-radius: 4px;
  background: var(--color-texto-principal);
  color: var(--color-fondo);
  overflow: hidden;
}
.vista-etiqueta-estante span {
  max-width: 90%;
  font-size: clamp(2.4rem, 8vw, 5rem);
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
}
.vista-etiqueta-estante-chica span {
  font-size: clamp(2rem, 5vw, 3.3rem);
}
.boton-eliminar-estante {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
