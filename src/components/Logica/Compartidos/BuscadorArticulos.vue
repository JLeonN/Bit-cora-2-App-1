<template>
  <div v-if="mostrarLista" class="contenedor-buscador">
    <div class="tarjeta-resultados-mejorada">
      <div class="titulo-tarjeta-mejorado">
        <span v-if="baseDatosCargada">Artículos encontrados</span>
        <span v-else class="titulo-sin-base-mejorado"><IconDatabaseX :size="16" /> Base de datos no cargada</span>
      </div>
      <div v-if="resultadosBusqueda.length && baseDatosCargada" class="lista-resultados-mejorada">
        <div v-for="(resultado, indice) in resultadosBusqueda" :key="indice" class="item-resultado-mejorado" @click="seleccionarArticulo(resultado.articulo)">
          <div class="nombre-resultado-mejorado">
            <span v-for="(parte, indiceParte) in obtenerPartesTextoResaltado(resultado.articulo.nombre, busqueda)" :key="indiceParte" :class="{ 'texto-resaltado-mejorado': parte.resaltado }">{{ parte.texto }}</span>
          </div>
          <div class="codigo-resultado-mejorado">
            <span v-for="(parte, indiceParte) in obtenerPartesTextoResaltado(resultado.articulo.codigo, busqueda)" :key="indiceParte" :class="{ 'texto-resaltado-mejorado': parte.resaltado }">{{ parte.texto }}</span>
          </div>
        </div>
      </div>
      <div v-else-if="busqueda.length >= caracteresMinimos && baseDatosCargada" class="sin-resultados-mejorado"><IconSearch :size="16" /> Artículo inexistente</div>
      <div v-else-if="!baseDatosCargada" class="sin-base-datos-mejorada"><IconDatabaseX :size="20" /> Selecciona un archivo Excel primero</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { IconDatabaseX, IconSearch } from '@tabler/icons-vue'
import { obtenerArticulosCargados, obtenerEstadoCarga } from '../../BaseDeDatos/LectorExcel.js'
import { buscarArticulos } from './ServicioBusquedaArticulos.js'

const props = defineProps({
  busqueda: { type: String, default: '' },
  contextoBusqueda: { type: String, default: '' },
})
const emit = defineEmits(['articulo-seleccionado', 'estado-busqueda'])
const articulosDisponibles = ref([])
const baseDatosCargada = ref(false)
const cantidadArticulos = ref(0)
const caracteresMinimos = 3
const maximosResultados = 50
const mostrarLista = computed(() => props.busqueda.length >= caracteresMinimos)
const resultadosBusqueda = computed(() => {
  if (!mostrarLista.value || !baseDatosCargada.value) return []
  return buscarArticulos({
    articulos: articulosDisponibles.value,
    busqueda: props.busqueda,
    contextoBusqueda: props.contextoBusqueda,
    limiteResultados: maximosResultados,
  })
})
const estadoBusqueda = computed(() => ({
  busqueda: props.busqueda,
  contextoBusqueda: props.contextoBusqueda,
  busquedaValida: props.busqueda.length >= caracteresMinimos,
  baseDatosCargada: baseDatosCargada.value,
  cantidadResultados: resultadosBusqueda.value.length,
  articuloUnico: resultadosBusqueda.value.length === 1 ? resultadosBusqueda.value[0].articulo : null,
  tipoCoincidenciaUnica: resultadosBusqueda.value.length === 1 ? resultadosBusqueda.value[0].tipoCoincidencia : '',
}))

function actualizarArticulos() {
  const estado = obtenerEstadoCarga()
  baseDatosCargada.value = estado.cargado
  cantidadArticulos.value = estado.cantidad
  articulosDisponibles.value = estado.cargado ? obtenerArticulosCargados() : []
}
function seleccionarArticulo(articulo) {
  console.log('[BuscadorArticulos] Artículo seleccionado:', articulo)
  emit('articulo-seleccionado', articulo)
}
function obtenerPartesTextoResaltado(texto, termino) {
  if (!termino || !texto) return [{ texto: texto || '', resaltado: false }]
  const regex = new RegExp(termino.trim().split(/\s+/).filter(Boolean).map((parte) => parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi')
  const partes = []
  let posicion = 0
  let coincidencia
  while ((coincidencia = regex.exec(texto)) !== null) {
    if (coincidencia.index > posicion) partes.push({ texto: texto.slice(posicion, coincidencia.index), resaltado: false })
    partes.push({ texto: coincidencia[0], resaltado: true })
    posicion = coincidencia.index + coincidencia[0].length
  }
  if (posicion < texto.length) partes.push({ texto: texto.slice(posicion), resaltado: false })
  return partes.length ? partes : [{ texto, resaltado: false }]
}
function refrescarBaseDatos() {
  actualizarArticulos()
}
let intervalId = null
onMounted(() => {
  actualizarArticulos()
  intervalId = setInterval(() => {
    const estado = obtenerEstadoCarga()
    if (estado.cargado !== baseDatosCargada.value || estado.cantidad !== cantidadArticulos.value) actualizarArticulos()
  }, 1000)
})
onUnmounted(() => clearInterval(intervalId))
watch(estadoBusqueda, (estado) => emit('estado-busqueda', estado), { immediate: true })
defineExpose({
  refrescarBaseDatos,
  obtenerEstadoBase: () => ({ cargada: baseDatosCargada.value, cantidad: cantidadArticulos.value, articulos: articulosDisponibles.value.length }),
})
</script>

<style scoped>
.contenedor-buscador{position:relative;z-index:100}.tarjeta-resultados-mejorada{position:absolute;top:8px;left:0;right:0;background:var(--color-superficie);border:1px solid var(--color-borde);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.4);z-index:101;overflow:hidden}.titulo-tarjeta-mejorado{background:var(--color-primario-oscuro);color:var(--color-texto-principal);padding:12px 16px;font-weight:600;font-size:.9rem;text-align:center;border-bottom:1px solid var(--color-borde)}.titulo-sin-base-mejorado,.sin-base-datos-mejorada,.sin-resultados-mejorado{display:flex;align-items:center;justify-content:center;gap:8px}.titulo-sin-base-mejorado,.sin-base-datos-mejorada{color:var(--color-error)}.lista-resultados-mejorada{max-height:280px;overflow-y:auto}.item-resultado-mejorado{padding:14px 16px;cursor:pointer;border-bottom:1px solid var(--color-borde)}.item-resultado-mejorado:hover{background:var(--color-fondo)}.nombre-resultado-mejorado{font-size:.85rem;color:var(--color-texto-secundario);line-height:1.4;margin-bottom:6px}.codigo-resultado-mejorado{font-size:.95rem;color:var(--color-primario-claro);font-weight:600}.sin-resultados-mejorado,.sin-base-datos-mejorada{padding:20px 16px;text-align:center}.sin-resultados-mejorado{color:var(--color-texto-secundario)}
</style>
