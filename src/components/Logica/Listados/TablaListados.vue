<template>
  <div class="contenedor-tabla-listados">
    <div v-if="articulos.length === 0" class="estado-vacio-listado">
      <IconListDetails :size="42" />
      <strong>Este listado está vacío</strong>
      <span>Buscá o escaneá un artículo para agregarlo.</span>
    </div>
    <div v-else class="tabla-listados" role="table" aria-label="Artículos del listado">
      <div
        class="fila-listado encabezado-listado"
        :class="{ 'con-stock': mostrarStock, 'con-ubicacion': mostrarUbicacion }"
        role="row"
      >
        <strong>Código</strong>
        <strong>Descripción</strong>
        <strong v-if="mostrarStock">Stock</strong>
        <strong v-if="mostrarUbicacion">Ubicación</strong>
        <strong>Acciones</strong>
      </div>
      <article
        v-for="articulo in articulos"
        :key="articulo.codigo"
        class="fila-listado"
        :class="{
          'con-stock': mostrarStock,
          'con-ubicacion': mostrarUbicacion,
          'resaltado-atencion': codigoResaltado === articulo.codigo,
        }"
        :data-codigo="articulo.codigo"
        role="row"
      >
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
        <div class="acciones-fila-listado">
          <button
            type="button"
            title="Enviar a Etiquetas"
            aria-label="Enviar a Etiquetas"
            @click="emit('enviar-etiqueta', articulo)"
          >
            <IconTag :size="19" />
          </button>
          <button
            type="button"
            title="Eliminar artículo"
            aria-label="Eliminar artículo"
            @click="emit('eliminar', articulo)"
          >
            <IconTrash :size="19" />
          </button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { IconListDetails, IconTag, IconTrash } from '@tabler/icons-vue'

const props = defineProps({
  articulos: { type: Array, default: () => [] },
  mostrarStock: { type: Boolean, required: true },
  mostrarUbicacion: { type: Boolean, required: true },
  codigoResaltado: { type: String, default: '' },
})
const emit = defineEmits(['editar-stock', 'editar-ubicacion', 'eliminar', 'enviar-etiqueta'])
const borradores = reactive({})

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
  const elemento = Array.from(document.querySelectorAll('[data-codigo]')).find(
    (fila) => fila.dataset.codigo === codigo,
  )
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
.fila-listado {
  display: grid;
  grid-template-columns: minmax(120px, 0.8fr) minmax(240px, 2fr) 92px;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  color: var(--color-texto-principal);
  border-bottom: 1px solid var(--color-borde);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}
.fila-listado.con-stock {
  grid-template-columns: minmax(120px, 0.8fr) minmax(220px, 2fr) minmax(90px, 0.6fr) 92px;
}
.fila-listado.con-ubicacion {
  grid-template-columns: minmax(120px, 0.8fr) minmax(220px, 2fr) minmax(120px, 0.8fr) 92px;
}
.fila-listado.con-stock.con-ubicacion {
  grid-template-columns: minmax(120px, 0.8fr) minmax(200px, 2fr) minmax(90px, 0.6fr) minmax(120px, 0.8fr) 92px;
}
.fila-listado:last-child {
  border-bottom: 0;
}
.encabezado-listado {
  color: var(--color-texto-secundario);
  background: var(--color-primario-claro);
  font-size: 0.82rem;
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
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.acciones-fila-listado button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  color: var(--color-primario);
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  cursor: pointer;
}
.resaltado-atencion {
  background: var(--color-primario-claro);
  box-shadow: inset 4px 0 var(--color-primario);
}
@media (max-width: 720px) {
  .tabla-listados {
    display: grid;
    gap: 10px;
    overflow: visible;
    background: transparent;
    border: 0;
  }
  .encabezado-listado {
    display: none;
  }
  .fila-listado,.fila-listado.con-stock,.fila-listado.con-ubicacion,.fila-listado.con-stock.con-ubicacion {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 14px;
    background: var(--color-superficie);
    border: 1px solid var(--color-borde);
    border-radius: 12px;
  }
  .celda-codigo,.celda-descripcion {
    grid-column: 1 / -1;
  }
  .celda-editable {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .etiqueta-movil {
    display: block;
    color: var(--color-texto-secundario);
    font-size: 0.78rem;
    font-weight: 600;
  }
  .acciones-fila-listado {
    grid-column: 1 / -1;
  }
}
@media (max-width: 380px) {
  .fila-listado,.fila-listado.con-stock,.fila-listado.con-ubicacion,.fila-listado.con-stock.con-ubicacion {
    grid-template-columns: 1fr;
  }
  .celda-codigo,.celda-descripcion,.acciones-fila-listado {
    grid-column: auto;
  }
}
</style>
