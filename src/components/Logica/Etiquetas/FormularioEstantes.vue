<template>
  <form class="formulario-estantes" @submit.prevent="generarEtiquetas">
    <div class="campo-estantes">
      <label for="cantidad-columnas-estantes">Cantidad de columnas</label>
      <div class="contenedor-items-botones">
        <button type="button" class="boton-items" aria-label="Quitar una columna" :disabled="cantidadColumnas <= 1" @click="ajustarCantidadColumnas(-1)">
          <IconMinus :stroke="2" />
        </button>
        <input id="cantidad-columnas-estantes" :value="cantidadColumnas" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" required @input="actualizarCantidadColumnas" @focus="seleccionarContenido" @click="seleccionarContenido" />
        <button type="button" class="boton-items" aria-label="Agregar una columna" :disabled="cantidadColumnas >= 26" @click="ajustarCantidadColumnas(1)">
          <IconPlus :stroke="2" />
        </button>
      </div>
    </div>
    <p class="ayuda-estantes">Cada columna corresponde a una letra, desde la A. Indicá cuántos niveles tiene cada una.</p>
    <div class="grilla-columnas-estantes">
      <label v-for="(columna, indice) in columnas" :key="columna.letra" class="campo-estantes" :for="`niveles-columna-${columna.letra}`">
        Columna {{ columna.letra }}
        <input :id="`niveles-columna-${columna.letra}`" :value="nivelesPorColumna[indice]" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" required @input="actualizarNiveles($event, indice)" @focus="seleccionarContenido" @click="seleccionarContenido" />
      </label>
    </div>
    <p class="resumen-estantes">Se preparará{{ totalEtiquetas === 1 ? '' : 'n' }} {{ totalEtiquetas }} etiqueta{{ totalEtiquetas === 1 ? '' : 's' }}: {{ ejemploEtiquetas }}.</p>
    <button class="boton-generar-estantes" type="submit">Agregar etiquetas de estantes</button>
  </form>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Notify } from 'quasar'
import { IconMinus, IconPlus } from '@tabler/icons-vue'

const emit = defineEmits(['agregar-estantes'])
const cantidadColumnas = ref(1)
const nivelesPorColumna = ref([1])
const columnas = computed(() => Array.from({ length: Number.isInteger(cantidadColumnas.value) && cantidadColumnas.value > 0 && cantidadColumnas.value <= 26 ? cantidadColumnas.value : 0 }, (_, indice) => ({ letra: String.fromCharCode(65 + indice) })))
const totalEtiquetas = computed(() => columnas.value.reduce((total, _, indice) => total + (Number(nivelesPorColumna.value[indice]) || 0), 0))
const ejemploEtiquetas = computed(() => {
  const primera = columnas.value[0]
  const ultima = columnas.value.at(-1)
  if (!primera || !ultima || !totalEtiquetas.value) return 'completá las cantidades'
  if (totalEtiquetas.value === 1) return `${primera.letra}1`
  return `${primera.letra}1 a ${ultima.letra}${nivelesPorColumna.value[columnas.value.length - 1]}`
})

watch(cantidadColumnas, (cantidad) => {
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 26) return
  nivelesPorColumna.value = Array.from({ length: cantidad }, (_, indice) => nivelesPorColumna.value[indice] ?? 1)
})

function seleccionarContenido(evento) {
  evento.target.select()
}

function normalizarCantidad(evento, maximo) {
  const texto = evento.target.value.trim()
  const valor = /^\d+$/.test(texto) ? Number(texto) : 1
  const cantidad = Math.min(maximo, Math.max(1, valor))
  evento.target.value = String(cantidad)
  return cantidad
}

function actualizarCantidadColumnas(evento) {
  cantidadColumnas.value = normalizarCantidad(evento, 26)
}

function ajustarCantidadColumnas(cambio) {
  cantidadColumnas.value = Math.min(26, Math.max(1, cantidadColumnas.value + cambio))
}

function actualizarNiveles(evento, indice) {
  nivelesPorColumna.value[indice] = normalizarCantidad(evento, 99)
}

function generarEtiquetas() {
  if (!columnas.value.length || nivelesPorColumna.value.some((cantidad) => !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99)) {
    Notify.create({ type: 'negative', message: 'Ingresá entre 1 y 99 niveles por columna.', position: 'top' })
    return
  }
  const codigos = columnas.value.flatMap(({ letra }, indice) => Array.from({ length: nivelesPorColumna.value[indice] }, (_, nivel) => `${letra}${nivel + 1}`))
  emit('agregar-estantes', codigos)
}
</script>

<style scoped>
.formulario-estantes {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.campo-estantes {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  font-weight: 600;
}
.grilla-columnas-estantes input {
  width: 100%;
  min-height: 42px;
  padding: 0.6rem;
  border: 1px solid var(--color-borde);
  border-radius: 6px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
}
.grilla-columnas-estantes input:focus-visible {
  outline: 2px solid var(--color-primario);
}
.ayuda-estantes,
.resumen-estantes {
  margin: 0;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}
.grilla-columnas-estantes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 0.75rem;
}
.boton-generar-estantes {
  min-height: 44px;
  border: 0;
  border-radius: 6px;
  background: var(--color-exito);
  color: var(--color-texto-principal);
  font-weight: 600;
  cursor: pointer;
}
.boton-generar-estantes:focus-visible {
  outline: 2px solid var(--color-primario);
  outline-offset: 2px;
}
</style>
