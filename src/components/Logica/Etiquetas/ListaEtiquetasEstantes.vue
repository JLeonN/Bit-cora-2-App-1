<template>
  <section class="seccion-etiquetas-estantes" aria-label="Etiquetas de estantes preparadas">
    <div v-if="etiquetas.length" class="encabezado-lista-estantes">
      <p>{{ etiquetas.length }} códigos preparados · {{ totalCopias }} etiquetas en total</p>
      <button type="button" class="boton-limpiar-estantes" @click="emit('limpiar-estantes')">Limpiar todo</button>
    </div>
    <div v-if="etiquetas.length" class="grilla-etiquetas-estantes">
      <article v-for="etiqueta in etiquetas" :key="etiqueta.codigo" class="tarjeta-estante">
        <svg class="vista-etiqueta-estante" :viewBox="`0 0 ${configuracion.pagina.ancho} ${configuracion.pagina.alto}`" role="img" :aria-label="`Vista previa de la etiqueta ${etiqueta.codigo}`">
          <text
            class="texto-etiqueta-estante"
            :x="layoutsPorCodigo[etiqueta.codigo].posicionX"
            :y="layoutsPorCodigo[etiqueta.codigo].posicionY"
            :font-size="layoutsPorCodigo[etiqueta.codigo].tamanoFuentePt * MM_POR_PT"
            font-family="Helvetica, Arial, sans-serif"
            font-weight="bold"
            text-anchor="middle"
            dominant-baseline="middle"
          >{{ etiqueta.codigo }}</text>
        </svg>
        <label class="campo-copias-estante" :for="`copias-estante-${etiqueta.codigo}`">
          Copias
          <input :id="`copias-estante-${etiqueta.codigo}`" :value="etiqueta.cantidad" type="text" inputmode="numeric" pattern="[1-9][0-9]?" autocomplete="off" @input="validarCopias($event, etiqueta)" @change="actualizarCopias($event, etiqueta)" @focus="seleccionarContenido" @click="seleccionarContenido" />
        </label>
        <button type="button" class="boton-eliminar-estante" :aria-label="`Eliminar etiqueta ${etiqueta.codigo}`" @click="emit('eliminar-estante', etiqueta.codigo)">Eliminar</button>
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
const emit = defineEmits(['actualizar-copias', 'eliminar-estante', 'limpiar-estantes'])
const medidor = new jsPDF({ unit: 'mm' })
const totalCopias = computed(() => props.etiquetas.reduce((total, etiqueta) => total + etiqueta.cantidad, 0))
const layoutsPorCodigo = computed(() => Object.fromEntries(props.etiquetas.map((etiqueta) => [
  etiqueta.codigo,
  calcularLayoutEtiquetaEstante(medidor, etiqueta.codigo, props.configuracion.pagina),
])))

function seleccionarContenido(evento) {
  evento.target.select()
}

function validarCopias(evento, etiqueta) {
  const texto = evento.target.value.trim()
  if (!/^\d+$/.test(texto) || Number(texto) < 1) {
    evento.target.value = String(etiqueta.cantidad)
    return
  }
  if (Number(texto) > 99) evento.target.value = '99'
}

function actualizarCopias(evento, etiqueta) {
  const cantidad = Number(evento.target.value)
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
    evento.target.value = String(etiqueta.cantidad)
    return
  }
  evento.target.value = String(cantidad)
  emit('actualizar-copias', { codigo: etiqueta.codigo, cantidad })
}
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
.campo-copias-estante {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: var(--color-texto-secundario);
}
.campo-copias-estante input {
  width: 5rem;
  min-height: 36px;
  padding: 0.35rem;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  text-align: center;
}
.boton-eliminar-estante {
  width: 100%;
  margin-top: 0.5rem;
}
</style>
