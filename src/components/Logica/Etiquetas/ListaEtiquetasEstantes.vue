<template>
  <section class="seccion-etiquetas-estantes" aria-label="Etiquetas de estantes preparadas">
    <div v-if="etiquetas.length" class="encabezado-lista-estantes">
      <p>{{ etiquetas.length }} etiquetas de estantes preparadas</p>
      <button type="button" class="boton-limpiar-estantes" @click="emit('limpiar-estantes')">Limpiar todo</button>
    </div>
    <div v-if="etiquetas.length" class="grilla-etiquetas-estantes">
      <article v-for="codigo in etiquetas" :key="codigo" class="tarjeta-estante">
        <svg class="vista-etiqueta-estante" :viewBox="`0 0 ${configuracion.pagina.ancho} ${configuracion.pagina.alto}`" role="img" :aria-label="`Vista previa de la etiqueta ${codigo}`">
          <text
            class="texto-etiqueta-estante"
            :x="layoutsPorCodigo[codigo].posicionX"
            :y="layoutsPorCodigo[codigo].posicionY"
            :font-size="layoutsPorCodigo[codigo].tamanoFuentePt * MM_POR_PT"
            font-family="Helvetica, Arial, sans-serif"
            font-weight="bold"
            text-anchor="middle"
            dominant-baseline="middle"
          >{{ codigo }}</text>
        </svg>
        <button type="button" class="boton-eliminar-estante" :aria-label="`Eliminar etiqueta ${codigo}`" @click="emit('eliminar-estante', codigo)">Eliminar</button>
      </article>
    </div>
    <p v-else class="sin-etiquetas-estantes">Todavía no hay etiquetas de estantes. Agregalas desde el formulario de arriba.</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { jsPDF } from 'jspdf'
import { calcularLayoutEtiquetaEstante, MM_POR_PT } from './CalcularLayoutEtiquetaEstante.js'

const props = defineProps({
  etiquetas: { type: Array, required: true },
  configuracion: { type: Object, required: true },
})
const emit = defineEmits(['eliminar-estante', 'limpiar-estantes'])
const medidor = new jsPDF({ unit: 'mm' })
const layoutsPorCodigo = computed(() => Object.fromEntries(props.etiquetas.map((codigo) => [
  codigo,
  calcularLayoutEtiquetaEstante(medidor, codigo, props.configuracion.pagina),
])))
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
  display: block;
  width: 100%;
  height: auto;
  border-radius: 4px;
  background: var(--color-papel-etiqueta);
  overflow: hidden;
}
.texto-etiqueta-estante {
  fill: var(--color-tinta-etiqueta);
}
.boton-eliminar-estante {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
