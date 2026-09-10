<template>
  <div class="contenedor-tabla-listados">
    <div v-if="articulos.length === 0" class="estado-vacio-listado">
      <IconListDetails :size="42" />
      <strong>Este listado está vacío</strong>
      <span>Buscá o escaneá un artículo para agregarlo.</span>
    </div>
    <div
      v-else
      class="tabla-listados"
      role="table"
      aria-label="Artículos del listado"
      :style="{ '--columnas-listado': columnasListado }"
    >
      <div class="fila-listado encabezado-listado" role="row">
        <strong v-if="mostrarNumeracion" class="encabezado-numeracion">N.º</strong>
        <strong>Código</strong>
        <strong>Descripción</strong>
        <strong v-if="mostrarStock">Stock</strong>
        <strong v-if="mostrarUbicacion">Ubicación</strong>
        <strong>Acciones</strong>
      </div>
      <article
        v-for="(articulo, indice) in articulos"
        :key="articulo.codigo"
        class="fila-listado"
        :class="{
          'resaltado-atencion': codigoResaltado === articulo.codigo,
        }"
        :data-codigo="articulo.codigo"
        role="row"
      >
        <div v-if="mostrarNumeracion" class="celda-listado celda-numeracion" data-etiqueta="Número">
          {{ indice + 1 }}
        </div>
        <div class="celda-listado celda-codigo" data-etiqueta="Código">{{ articulo.codigo }}</div>
        <div class="celda-listado celda-descripcion" data-etiqueta="Descripción">
          {{ articulo.descripcion }}
        </div>
        <label v-if="mostrarStock" class="celda-listado celda-editable" data-etiqueta="Stock">
          <span class="etiqueta-movil">Stock</span>
          <input
            v-model="borradores[articulo.codigo].stockListado"
            type="text"
            inputmode="numeric"
            :class="{ 'campo-invalido': !esStockValido(borradores[articulo.codigo].stockListado) }"
            :aria-label="`Stock de ${articulo.codigo}`"
            @blur="confirmarStock(articulo)"
            @keyup.enter="$event.target.blur()"
          />
        </label>
        <label
          v-if="mostrarUbicacion"
          class="celda-listado celda-editable"
          data-etiqueta="Ubicación"
        >
          <span class="etiqueta-movil">Ubicación</span>
          <input
            v-model="borradores[articulo.codigo].ubicacionListado"
            type="text"
            :aria-label="`Ubicación de ${articulo.codigo}`"
            @input="normalizarBorradorUbicacion(articulo.codigo)"
            @blur="confirmarUbicacion(articulo)"
            @keyup.enter="$event.target.blur()"
          />
        </label>
        <div class="acciones-fila-listado acciones-ubicacion">
          <button
            type="button"
            class="boton-icono-listado"
            title="Enviar a Etiquetas"
            aria-label="Enviar a Etiquetas"
            @click="emit('enviar-etiqueta', articulo)"
          >
            <IconTag class="icono-ubicacion icono-etiqueta" :size="20" :stroke="2" />
          </button>
          <button
            type="button"
            class="boton-icono-listado"
            title="Eliminar artículo"
            aria-label="Eliminar artículo"
            @click="emit('eliminar', articulo)"
          >
            <IconTrash class="icono-ubicacion icono-borrar" :size="20" :stroke="2" />
          </button>
        </div>
      </article>
    </div>
    <div
      v-if="articulos.length > 0"
      class="lista-movil-listados"
      aria-label="Artículos del listado"
    >
      <TarjetaArticulo
        v-for="(articulo, indice) in articulos"
        :key="articulo.codigo"
        :nombre="articulo.descripcion"
        :codigo="articulo.codigo"
        :class="{
          'resaltado-atencion': codigoResaltado === articulo.codigo,
        }"
        :data-codigo="articulo.codigo"
      >
        <template v-if="mostrarStock || mostrarUbicacion" #contenido>
          <div class="campos-listado-tarjeta">
            <label v-if="mostrarStock" class="campo-listado-tarjeta">
              <span>Stock</span>
              <input
                v-model="borradores[articulo.codigo].stockListado"
                type="text"
                inputmode="numeric"
                :class="{
                  'campo-invalido': !esStockValido(borradores[articulo.codigo].stockListado),
                }"
                :aria-label="`Stock de ${articulo.codigo}`"
                @blur="confirmarStock(articulo)"
                @keyup.enter="$event.target.blur()"
              />
            </label>
            <label v-if="mostrarUbicacion" class="campo-listado-tarjeta">
              <span>Ubicación</span>
              <input
                v-model="borradores[articulo.codigo].ubicacionListado"
                type="text"
                :aria-label="`Ubicación de ${articulo.codigo}`"
                @input="normalizarBorradorUbicacion(articulo.codigo)"
                @blur="confirmarUbicacion(articulo)"
                @keyup.enter="$event.target.blur()"
              />
            </label>
          </div>
        </template>
        <template #informacion-pie>
          <span v-if="mostrarNumeracion" class="numeracion-tarjeta-listado"
            >N.º {{ indice + 1 }}</span
          >
        </template>
        <template #acciones>
          <button
            type="button"
            class="boton-accion-tarjeta"
            title="Enviar a Etiquetas"
            aria-label="Enviar a Etiquetas"
            @click="emit('enviar-etiqueta', articulo)"
          >
            <IconTag class="icono-ubicacion icono-etiqueta" :size="19" :stroke="2" />
          </button>
          <button
            type="button"
            class="boton-accion-tarjeta boton-eliminar-tarjeta"
            title="Eliminar artículo"
            aria-label="Eliminar artículo"
            @click="emit('eliminar', articulo)"
          >
            <IconTrash class="icono-ubicacion icono-borrar" :size="19" :stroke="2" />
          </button>
        </template>
      </TarjetaArticulo>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { IconListDetails, IconTag, IconTrash } from '@tabler/icons-vue'
import TarjetaArticulo from '../Compartidos/TarjetaArticulo.vue'

const props = defineProps({
  articulos: { type: Array, default: () => [] },
  mostrarNumeracion: { type: Boolean, required: true },
  mostrarStock: { type: Boolean, required: true },
  mostrarUbicacion: { type: Boolean, required: true },
  codigoResaltado: { type: String, default: '' },
})
const emit = defineEmits(['editar-stock', 'editar-ubicacion', 'eliminar', 'enviar-etiqueta'])
const borradores = reactive({})
const columnasListado = computed(() => {
  const columnas = []
  if (props.mostrarNumeracion) columnas.push('54px')
  columnas.push('minmax(120px, 0.8fr)', 'minmax(200px, 2fr)')
  if (props.mostrarStock) columnas.push('minmax(90px, 0.6fr)')
  if (props.mostrarUbicacion) columnas.push('minmax(120px, 0.8fr)')
  columnas.push('92px')
  return columnas.join(' ')
})

watch(
  () => props.articulos,
  (articulos) => {
    const codigosActuales = new Set(articulos.map((articulo) => articulo.codigo))
    Object.keys(borradores).forEach((codigo) => {
      if (!codigosActuales.has(codigo)) delete borradores[codigo]
    })
    articulos.forEach((articulo) => {
      borradores[articulo.codigo] = {
        stockListado: articulo.stockListado ?? '',
        ubicacionListado: articulo.ubicacionListado ?? '',
      }
    })
  },
  { deep: true, immediate: true },
)

function esStockValido(valor) {
  if (valor === '') return false
  const numero = Number(valor)
  return Number.isFinite(numero) && Number.isInteger(numero)
}

function normalizarBorradorUbicacion(codigo) {
  borradores[codigo].ubicacionListado = String(borradores[codigo].ubicacionListado || '')
    .toUpperCase()
    .replace(/\s+/g, '-')
}

function confirmarStock(articulo) {
  const stockListado = borradores[articulo.codigo].stockListado
  if (String(stockListado) === String(articulo.stockListado ?? '')) return
  emit('editar-stock', { codigo: articulo.codigo, stockListado })
}

function confirmarUbicacion(articulo) {
  normalizarBorradorUbicacion(articulo.codigo)
  const ubicacionListado = borradores[articulo.codigo].ubicacionListado.trim()
  if (ubicacionListado === String(articulo.ubicacionListado || '')) return
  emit('editar-ubicacion', { codigo: articulo.codigo, ubicacionListado })
}

function enfocarArticulo(codigo) {
  const filasArticulo = Array.from(document.querySelectorAll('[data-codigo]')).filter(
    (fila) => fila.dataset.codigo === codigo,
  )
  const elemento = filasArticulo.find((fila) => fila.offsetParent !== null) || filasArticulo[0]
  elemento?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

defineExpose({ enfocarArticulo })
</script>

<style scoped>
.contenedor-tabla-listados {
  width: 100%;
}
.estado-vacio-listado {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  padding: 36px 16px;
  color: var(--color-texto-secundario);
  background: var(--color-superficie);
  border: 1px dashed var(--color-borde);
  border-radius: 12px;
  text-align: center;
}
.tabla-listados {
  overflow: hidden;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
}
.lista-movil-listados {
  display: none;
}
.fila-listado {
  display: grid;
  grid-template-columns: var(--columnas-listado);
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  color: var(--color-texto-principal);
  border-bottom: 1px solid var(--color-borde);
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}
.fila-listado:last-child {
  border-bottom: 0;
}
.encabezado-listado {
  color: var(--color-primario-claro);
  background: transparent;
  font-size: 0.82rem;
}
.encabezado-listado strong {
  color: var(--color-primario-claro);
}
.encabezado-numeracion,
.celda-numeracion {
  text-align: center;
}
.celda-numeracion {
  color: var(--color-texto-secundario);
  font-weight: 700;
}
.celda-codigo {
  overflow-wrap: anywhere;
  font-weight: 700;
}
.celda-descripcion {
  overflow-wrap: anywhere;
}
.celda-editable input {
  width: 100%;
  min-height: 38px;
  padding: 7px 8px;
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 7px;
}
.celda-editable input:focus {
  border-color: var(--color-primario);
  outline: none;
}
.celda-editable input.campo-invalido {
  border-color: var(--color-texto-secundario);
}
.etiqueta-movil {
  display: none;
}
.acciones-fila-listado {
  justify-content: flex-end;
}
.boton-icono-listado {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.resaltado-atencion {
  background: var(--color-primario-claro);
  box-shadow: inset 4px 0 var(--color-primario);
}
.campos-listado-tarjeta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  padding-top: 0.8rem;
}
.campo-listado-tarjeta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.campo-listado-tarjeta span {
  color: var(--color-texto-secundario);
  font-size: 0.78rem;
  font-weight: 600;
}
.campo-listado-tarjeta input {
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  padding: 7px 8px;
  color: var(--color-texto-principal);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
}
.campo-listado-tarjeta input:focus {
  border-color: var(--color-primario);
  outline: none;
}
.campo-listado-tarjeta input.campo-invalido {
  border-color: var(--color-texto-secundario);
}
.numeracion-tarjeta-listado {
  color: var(--color-texto-secundario);
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}
.boton-eliminar-tarjeta {
  color: var(--color-error);
}
@media (max-width: 720px) {
  .tabla-listados {
    display: none;
  }
  .lista-movil-listados {
    display: grid;
    gap: 0.8rem;
  }
}
@media (max-width: 380px) {
  .campos-listado-tarjeta {
    grid-template-columns: 1fr;
  }
}
</style>
