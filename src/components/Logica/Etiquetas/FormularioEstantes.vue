<template>
  <form class="formulario-estantes" @submit.prevent="generarEtiquetas">
    <div class="controles-estantes">
      <div class="campo-estantes control-estantes">
        <label for="cantidad-estanterias" class="titulo-control-estantes">
          <span class="icono-estanteria" aria-hidden="true"></span>
          Cantidad de estanterías
        </label>
        <div class="contenedor-items-botones">
          <button type="button" class="boton-items" aria-label="Quitar una estantería" :disabled="cantidadEstanterias <= 1" @click="ajustarCantidadEstanterias(-1)">
            <IconMinus :stroke="2" />
          </button>
          <input id="cantidad-estanterias" :value="cantidadEstanterias" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" required @input="actualizarCantidadEstanterias" @focus="seleccionarContenido" @click="seleccionarContenido" />
          <button type="button" class="boton-items" aria-label="Agregar una estantería" :disabled="cantidadEstanterias >= 99" @click="ajustarCantidadEstanterias(1)">
            <IconPlus :stroke="2" />
          </button>
        </div>
        <span class="detalle-control-estantes">Cada estantería usa las mismas etiquetas.</span>
      </div>
      <div class="campo-estantes control-estantes">
        <label for="cantidad-columnas-estantes" class="titulo-control-estantes">
          <span class="icono-columnas" aria-hidden="true"><span></span><span></span><span></span></span>
          Cantidad de columnas
        </label>
        <div class="contenedor-items-botones">
          <button type="button" class="boton-items" aria-label="Quitar una columna" :disabled="cantidadColumnas <= 1" @click="ajustarCantidadColumnas(-1)">
            <IconMinus :stroke="2" />
          </button>
          <input id="cantidad-columnas-estantes" :value="cantidadColumnas" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" required @input="actualizarCantidadColumnas" @focus="seleccionarContenido" @click="seleccionarContenido" />
          <button type="button" class="boton-items" aria-label="Agregar una columna" :disabled="cantidadColumnas >= 26" @click="ajustarCantidadColumnas(1)">
            <IconPlus :stroke="2" />
          </button>
        </div>
        <span class="detalle-control-estantes">Cada columna tiene una letra, desde la A.</span>
      </div>
    </div>
    <section class="vista-previa-estantes" aria-labelledby="titulo-vista-previa-estantes">
      <div class="encabezado-vista-previa-estantes">
        <h3 id="titulo-vista-previa-estantes">Vista previa de la estantería</h3>
        <p>Indicá cuántos niveles tiene cada columna.</p>
      </div>
      <div class="desplazamiento-estanteria" tabindex="0" aria-label="Columnas de la estantería; desplazá horizontalmente para ver todas">
        <div class="estanteria-continua">
          <div v-for="(columna, indice) in columnas" :key="columna.letra" class="columna-estanteria">
            <div class="encabezado-columna-estanteria">
              <label :for="`niveles-columna-${columna.letra}`">Columna {{ columna.letra }}</label>
              <div class="control-niveles-estanteria">
                <div class="contenedor-items-botones">
                  <button type="button" class="boton-items" :aria-label="`Quitar un nivel a la columna ${columna.letra}`" :disabled="nivelesPorColumna[indice] <= 1" @click="ajustarNiveles(indice, -1)">
                    <IconMinus :stroke="2" />
                  </button>
                  <input :id="`niveles-columna-${columna.letra}`" :aria-label="`Niveles de la columna ${columna.letra}`" :value="nivelesPorColumna[indice]" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" required @input="actualizarNiveles($event, indice)" @focus="seleccionarContenido" @click="seleccionarContenido" />
                  <button type="button" class="boton-items" :aria-label="`Agregar un nivel a la columna ${columna.letra}`" :disabled="nivelesPorColumna[indice] >= 99" @click="ajustarNiveles(indice, 1)">
                    <IconPlus :stroke="2" />
                  </button>
                </div>
              </div>
            </div>
            <div class="modulo-estanteria" aria-hidden="true">
              <div v-for="nivel in Math.min(nivelesPorColumna[indice] || 1, MAX_NIVELES_VISTA_PREVIA)" :key="nivel" class="nivel-estanteria">
                <span>{{ columna.letra }}{{ nivel }}</span>
              </div>
            </div>
            <span v-if="nivelesPorColumna[indice] > MAX_NIVELES_VISTA_PREVIA" class="niveles-ocultos-estanteria">
              +{{ nivelesPorColumna[indice] - MAX_NIVELES_VISTA_PREVIA }} nivel{{ nivelesPorColumna[indice] - MAX_NIVELES_VISTA_PREVIA === 1 ? '' : 'es' }} más
            </span>
          </div>
        </div>
      </div>
      <p v-if="cantidadColumnas > 1" class="ayuda-desplazamiento-estanteria">Deslizá para ver más columnas →</p>
    </section>
    <div class="resumen-estantes" aria-live="polite">
      <span>{{ cantidadEstanterias }} copia{{ cantidadEstanterias === 1 ? '' : 's' }} por etiqueta</span>
      <strong>{{ totalEtiquetas }} etiqueta{{ totalEtiquetas === 1 ? '' : 's' }} distinta{{ totalEtiquetas === 1 ? '' : 's' }} × {{ cantidadEstanterias }} = {{ totalCopias }} etiqueta{{ totalCopias === 1 ? '' : 's' }}</strong>
      <span>Códigos: {{ ejemploEtiquetas }}.</span>
    </div>
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
const cantidadEstanterias = ref(1)
const MAX_NIVELES_VISTA_PREVIA = 6
const columnas = computed(() => Array.from({ length: Number.isInteger(cantidadColumnas.value) && cantidadColumnas.value > 0 && cantidadColumnas.value <= 26 ? cantidadColumnas.value : 0 }, (_, indice) => ({ letra: String.fromCharCode(65 + indice) })))
const totalEtiquetas = computed(() => columnas.value.reduce((total, _, indice) => total + (Number(nivelesPorColumna.value[indice]) || 0), 0))
const totalCopias = computed(() => totalEtiquetas.value * cantidadEstanterias.value)
const ejemploEtiquetas = computed(() => {
  const primera = columnas.value[0]
  const ultima = columnas.value.at(-1)
  if (!primera || !ultima || !totalEtiquetas.value) return 'completá las cantidades'
  if (totalEtiquetas.value === 1) return `${primera.letra}1`
  return `${primera.letra}1 a ${ultima.letra}${nivelesPorColumna.value[columnas.value.length - 1]}`
})

watch(cantidadColumnas, (cantidad) => {
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 26) return
  nivelesPorColumna.value = Array.from({ length: cantidad }, (_, indice) => nivelesPorColumna.value[indice] ?? nivelesPorColumna.value[0] ?? 1)
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

function actualizarCantidadEstanterias(evento) {
  cantidadEstanterias.value = normalizarCantidad(evento, 99)
}

function ajustarCantidadEstanterias(cambio) {
  cantidadEstanterias.value = Math.min(99, Math.max(1, cantidadEstanterias.value + cambio))
}

function actualizarNiveles(evento, indice) {
  asignarNivelesColumna(indice, normalizarCantidad(evento, 99))
}

function ajustarNiveles(indice, cambio) {
  asignarNivelesColumna(indice, Math.min(99, Math.max(1, nivelesPorColumna.value[indice] + cambio)))
}

function asignarNivelesColumna(indice, cantidad) {
  if (indice === 0) {
    nivelesPorColumna.value = nivelesPorColumna.value.map(() => cantidad)
    return
  }
  nivelesPorColumna.value[indice] = cantidad
}

function generarEtiquetas() {
  if (!columnas.value.length || nivelesPorColumna.value.some((cantidad) => !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) || !Number.isInteger(cantidadEstanterias.value) || cantidadEstanterias.value < 1 || cantidadEstanterias.value > 99) {
    Notify.create({ type: 'negative', message: 'Ingresá entre 1 y 99 niveles y estanterías.', position: 'top' })
    return
  }
  const etiquetas = columnas.value.flatMap(({ letra }, indice) => Array.from({ length: nivelesPorColumna.value[indice] }, (_, nivel) => ({ codigo: `${letra}${nivel + 1}`, cantidad: cantidadEstanterias.value })))
  emit('agregar-estantes', etiquetas)
}
</script>

<style scoped>
.formulario-estantes {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}
.controles-estantes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}
.campo-estantes {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
  font-weight: 600;
}
.control-estantes {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 0.6rem;
  padding: 0.85rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-superficie);
}
.titulo-control-estantes {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--color-texto-principal);
}
.icono-estanteria {
  display: block;
  position: relative;
  width: 24px;
  height: 22px;
  flex: none;
  border-left: 2px solid var(--color-primario);
  border-right: 2px solid var(--color-primario);
  border-bottom: 2px solid var(--color-primario);
}
.icono-estanteria::before,
.icono-estanteria::after {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primario);
  content: '';
}
.icono-estanteria::before {
  top: 5px;
}
.icono-estanteria::after {
  top: 12px;
}
.icono-columnas {
  display: flex;
  align-items: stretch;
  gap: 3px;
  width: 24px;
  height: 22px;
  flex: none;
}
.icono-columnas span {
  flex: 1;
  border: 2px solid var(--color-primario);
}
.control-estantes .contenedor-items-botones {
  width: 170px;
  gap: 0.3rem;
}
.control-estantes .boton-items {
  width: 40px;
  min-width: 40px;
}
.detalle-control-estantes {
  grid-column: 1 / -1;
  color: var(--color-texto-secundario);
  font-size: 0.8rem;
  font-weight: 400;
}
.vista-previa-estantes {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background: var(--color-superficie);
}
.encabezado-vista-previa-estantes h3 {
  margin: 0;
  color: var(--color-texto-principal);
  font-size: 1rem;
  font-weight: 700;
}
.encabezado-vista-previa-estantes p {
  margin: 0.2rem 0 0.9rem;
  color: var(--color-texto-secundario);
  font-size: 0.85rem;
}
.desplazamiento-estanteria {
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 0.7rem;
  scrollbar-color: var(--color-primario) var(--color-fondo);
}
.desplazamiento-estanteria:focus-visible {
  outline: 2px solid var(--color-primario);
  outline-offset: 2px;
}
.estanteria-continua {
  display: flex;
  width: max-content;
  align-items: stretch;
  margin-inline: auto;
}
.columna-estanteria {
  display: flex;
  flex: 0 0 clamp(180px, 21vw, 270px);
  flex-direction: column;
}
.encabezado-columna-estanteria {
  display: flex;
  min-height: 82px;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.5rem 0.7rem;
  color: var(--color-texto-principal);
  font-size: 0.85rem;
  font-weight: 600;
}
.control-niveles-estanteria {
  display: flex;
  align-items: center;
}
.control-niveles-estanteria .contenedor-items-botones {
  gap: 0.35rem;
}
.control-niveles-estanteria .boton-items {
  width: 46px;
  min-width: 46px;
  min-height: 44px;
  padding: 0;
}
.control-niveles-estanteria .boton-items svg {
  width: 20px;
  height: 20px;
}
.control-niveles-estanteria input {
  width: 54px;
  min-width: 54px;
  min-height: 44px;
  flex: 0 0 54px;
  padding: 0;
}
.modulo-estanteria {
  display: flex;
  position: relative;
  height: 300px;
  flex-direction: column;
  border-top: 10px solid var(--color-carga);
  border-left: 11px solid var(--color-texto-secundario);
  background: linear-gradient(180deg, var(--color-superficie), var(--color-fondo));
}
.columna-estanteria:last-child .modulo-estanteria {
  border-right: 11px solid var(--color-texto-secundario);
}
.modulo-estanteria::before,
.columna-estanteria:last-child .modulo-estanteria::after {
  position: absolute;
  z-index: 1;
  top: -10px;
  bottom: 0;
  width: 11px;
  background-image: radial-gradient(circle, var(--color-borde) 1.5px, transparent 2px), linear-gradient(90deg, var(--color-desactivado), var(--color-texto-secundario), var(--color-borde));
  background-size: 11px 18px, 100% 100%;
  content: '';
}
.modulo-estanteria::before {
  left: -11px;
}
.columna-estanteria:last-child .modulo-estanteria::after {
  right: -11px;
}
.nivel-estanteria {
  display: flex;
  position: relative;
  min-height: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-bottom: 12px;
}
.nivel-estanteria::before,
.nivel-estanteria::after {
  position: absolute;
  left: 0;
  right: 0;
  content: '';
}
.nivel-estanteria::before {
  bottom: 10px;
  height: 5px;
  background: linear-gradient(180deg, var(--color-texto-secundario), var(--color-desactivado));
}
.nivel-estanteria::after {
  bottom: 0;
  height: 10px;
  background: linear-gradient(180deg, var(--color-carga-claro), var(--color-carga) 35%, color-mix(in srgb, var(--color-carga) 65%, var(--color-fondo)));
  box-shadow: 0 3px 4px var(--sombra-boton);
}
.nivel-estanteria span {
  position: relative;
  z-index: 1;
  padding: 0.15rem 0.55rem;
  border: 1px solid var(--color-borde);
  border-radius: 5px;
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  font-size: 0.85rem;
  font-weight: 700;
}
.niveles-ocultos-estanteria {
  padding: 0.45rem 0.3rem 0;
  color: var(--color-texto-secundario);
  font-size: 0.75rem;
  text-align: center;
}
.ayuda-desplazamiento-estanteria {
  display: none;
  margin: 0.35rem 0 0;
  color: var(--color-primario-claro);
  font-size: 0.8rem;
}
.resumen-estantes {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}
.resumen-estantes strong {
  color: var(--color-texto-principal);
  font-size: 1rem;
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
@media (max-width: 850px) {
  .controles-estantes {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 520px) {
  .control-estantes {
    grid-template-columns: 1fr;
  }
  .control-estantes .contenedor-items-botones {
    width: 100%;
  }
}
@media (max-width: 600px) {
  .control-niveles-estanteria .contenedor-items-botones {
    gap: 0.25rem;
  }
  .control-niveles-estanteria .boton-items {
    width: 38px;
    min-width: 38px;
    min-height: 38px;
  }
  .control-niveles-estanteria .boton-items svg {
    width: 17px;
    height: 17px;
  }
  .control-niveles-estanteria input {
    width: 44px;
    min-width: 44px;
    min-height: 38px;
    flex-basis: 44px;
  }
  .vista-previa-estantes {
    padding: 0.75rem;
  }
  .columna-estanteria {
    flex-basis: 150px;
  }
  .modulo-estanteria {
    height: 230px;
  }
  .ayuda-desplazamiento-estanteria {
    display: block;
  }
}
</style>
