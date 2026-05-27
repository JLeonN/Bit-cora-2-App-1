<template>
  <div>
    <div class="encabezado-tabla">
      <p v-if="etiquetas.length > 0" class="texto-secundario">Etiquetas totales: {{ etiquetas.length }}</p>
      <p v-if="etiquetas.length > 0" class="texto-secundario">Copias totales: {{ totalCopias }}</p>
      <p v-if="cantidadCodigosRepetidos > 0" class="texto-secundario texto-repetidos">Códigos repetidos: {{ cantidadCodigosRepetidos }}</p>
      <p v-if="cantidadArticulosInexistentes > 0" class="texto-secundario texto-inexistente">Artículos inexistentes: {{ cantidadArticulosInexistentes }}</p>
    </div>
    <div class="contenedor-boton-borrar-todo" v-if="etiquetas.length > 0">
      <IconTrash class="icono-accion icono-borrar-todo" @click="confirmarLimpiar" title="Limpiar todas las etiquetas" />
    </div>
    <div v-if="etiquetas.length > 0" class="grilla-tarjetas-etiquetas">
      <article
        v-for="(etiqueta, indice) in etiquetas"
        :key="etiqueta.id"
        class="tarjeta-etiqueta-item"
        :class="{
          'tarjeta-etiqueta-duplicada': codigosDuplicados.has(normalizarCodigo(etiqueta.codigo)),
          'tarjeta-etiqueta-inexistente': esArticuloInexistente(etiqueta.codigo),
          'fila-ubicacion-sl': esUbicacionSL(etiqueta.ubicacion),
        }"
      >
        <TarjetaPreviewEtiquetaMovil
          :etiqueta="etiqueta"
          :indice="indice"
          :nombre-articulo="obtenerNombreArticulo(etiqueta)"
          :es-ubicacion-sl="esUbicacionSL"
          :codigo-barra-valido="codigoBarraValido"
          @actualizar-campo="actualizarCampoInline"
        />
        <div class="franja-controles-tarjeta">
          <ControlesFilaEtiqueta
            modo="cantidad"
            :etiqueta="etiqueta"
            :indice="indice"
            @incrementar="incrementarCantidad"
            @decrementar="decrementarCantidad"
            @actualizar="actualizarCantidad"
          />
          <ControlesFilaEtiqueta modo="acciones" :etiqueta="etiqueta" :indice="indice" @eliminar="eliminarEtiqueta" />
        </div>
      </article>
    </div>
    <div v-if="etiquetas.length === 0" class="sin-etiquetas">
      <IconTag :size="48" :stroke="1.5" class="icono-vacio" />
      <p>No hay etiquetas agregadas</p>
      <span class="texto-ayuda">Agregá etiquetas usando el formulario de arriba</span>
    </div>
    <ModalEliminar
      v-if="mostrarModalLimpiarTodo"
      texto="todas las etiquetas"
      @confirmar="confirmarLimpiarTodo"
      @cerrar="cerrarModalLimpiarTodo"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconTrash, IconTag } from '@tabler/icons-vue'
import ModalEliminar from '../../Modales/ModalEliminar.vue'
import TarjetaPreviewEtiquetaMovil from './TarjetaPreviewEtiquetaMovil.vue'
import ControlesFilaEtiqueta from './ControlesFilaEtiqueta.vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'
import { usarCodigoBarraEtiqueta } from './UsoCodigoBarraEtiqueta.js'

const props = defineProps({
  etiquetas: { type: Array, required: true },
})

const emit = defineEmits(['editar-etiqueta', 'eliminar-etiqueta', 'limpiar-todo', 'modal-abierto', 'modal-cerrado'])
const mostrarModalLimpiarTodo = ref(false)
const { codigoBarraValido } = usarCodigoBarraEtiqueta()

const manejarModalAbierto = () => emit('modal-abierto')
const manejarModalCerrado = () => emit('modal-cerrado')
const totalCopias = computed(() => props.etiquetas.reduce((total, etiqueta) => total + (etiqueta.cantidad || 1), 0))

function incrementarCantidad(indice) {
  const etiquetaActualizada = { ...props.etiquetas[indice] }
  etiquetaActualizada.cantidad += 1
  emit('editar-etiqueta', etiquetaActualizada)
}

function decrementarCantidad(indice) {
  if (props.etiquetas[indice].cantidad > 1) {
    const etiquetaActualizada = { ...props.etiquetas[indice] }
    etiquetaActualizada.cantidad -= 1
    emit('editar-etiqueta', etiquetaActualizada)
  }
}

function actualizarCantidad(indice, nuevaCantidad = null) {
  const etiquetaActualizada = { ...props.etiquetas[indice] }
  if (nuevaCantidad !== null && Number.isFinite(nuevaCantidad)) {
    etiquetaActualizada.cantidad = nuevaCantidad
  }
  if (etiquetaActualizada.cantidad < 1 || !etiquetaActualizada.cantidad) {
    etiquetaActualizada.cantidad = 1
  }
  emit('editar-etiqueta', etiquetaActualizada)
}

function actualizarCampoInline({ indice, campo, valor }) {
  const etiquetaBase = props.etiquetas[indice]
  if (!etiquetaBase || !campo) {
    return
  }
  const etiquetaActualizada = { ...etiquetaBase, [campo]: valor }
  if (campo === 'codigo') {
    etiquetaActualizada.codigo = String(valor || '').trim().toUpperCase()
  }
  if (campo === 'descripcion') {
    etiquetaActualizada.descripcion = String(valor || '')
  }
  if (campo === 'ubicacion') {
    const ubicacionNormalizada = String(valor || '').toUpperCase().replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
    etiquetaActualizada.ubicacion = ubicacionNormalizada || 'Sin ubicación'
  }
  emit('editar-etiqueta', etiquetaActualizada)
}

function eliminarEtiqueta(indice) {
  emit('eliminar-etiqueta', indice)
}

function confirmarLimpiar() {
  mostrarModalLimpiarTodo.value = true
}

function confirmarLimpiarTodo() {
  emit('limpiar-todo')
  mostrarModalLimpiarTodo.value = false
}

function cerrarModalLimpiarTodo() {
  mostrarModalLimpiarTodo.value = false
}

function normalizarCodigo(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return ''
  }
  return codigo.trim().toUpperCase()
}

function esUbicacionSL(ubicacion) {
  if (!ubicacion || typeof ubicacion !== 'string') {
    return false
  }
  return ubicacion.trim().toUpperCase() === 'SL'
}

function obtenerNombreArticulo(etiqueta) {
  const codigo = etiqueta?.codigo
  if (!codigo || typeof codigo !== 'string') {
    return 'Artículo inexistente'
  }
  try {
    const articulosCargados = obtenerArticulosCargados()
    if (!Array.isArray(articulosCargados)) {
      return 'Base de datos no cargada'
    }
    const articuloEncontrado = articulosCargados.find(
      (articulo) => articulo && articulo.codigo && typeof articulo.codigo === 'string' && articulo.codigo.toLowerCase() === codigo.toLowerCase(),
    )
    return etiqueta?.descripcion || articuloEncontrado?.nombre || 'Artículo inexistente'
  } catch (error) {
    console.error('[obtenerNombreArticulo] Error:', error)
    return 'Error al buscar artículo'
  }
}

function esArticuloInexistente(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return true
  }
  try {
    const articulosCargados = obtenerArticulosCargados()
    if (!Array.isArray(articulosCargados)) {
      return true
    }
    return !articulosCargados.some(
      (articulo) => articulo && articulo.codigo && typeof articulo.codigo === 'string' && articulo.codigo.toLowerCase() === codigo.toLowerCase(),
    )
  } catch (error) {
    console.error('[esArticuloInexistente] Error:', error)
    return true
  }
}

const codigosDuplicados = computed(() => {
  try {
    const conteo = new Map()
    for (const etiqueta of props.etiquetas) {
      if (!etiqueta || !etiqueta.codigo) continue
      const codigoNormalizado = normalizarCodigo(etiqueta.codigo)
      if (codigoNormalizado) {
        conteo.set(codigoNormalizado, (conteo.get(codigoNormalizado) || 0) + 1)
      }
    }
    const duplicados = new Set()
    for (const [codigo, cantidad] of conteo.entries()) {
      if (cantidad > 1) {
        duplicados.add(codigo)
      }
    }
    return duplicados
  } catch (error) {
    console.error('[codigosDuplicados] Error:', error)
    return new Set()
  }
})

const cantidadCodigosRepetidos = computed(() => {
  try {
    return props.etiquetas.filter((etiqueta) => etiqueta && etiqueta.codigo && codigosDuplicados.value.has(normalizarCodigo(etiqueta.codigo))).length
  } catch (error) {
    console.error('[cantidadCodigosRepetidos] Error:', error)
    return 0
  }
})

const cantidadArticulosInexistentes = computed(() => {
  try {
    return props.etiquetas.filter((etiqueta) => etiqueta && esArticuloInexistente(etiqueta.codigo)).length
  } catch (error) {
    console.error('[cantidadArticulosInexistentes] Error:', error)
    return 0
  }
})
</script>

<style scoped>
.sin-etiquetas {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-texto-secundario);
}
.icono-vacio {
  color: var(--color-texto-secundario);
  opacity: 0.5;
  margin-bottom: 1rem;
}
.sin-etiquetas p {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--color-texto-principal);
}
.texto-ayuda {
  font-size: 0.9rem;
  font-style: italic;
}
.fila-ubicacion-sl {
  border-color: var(--color-neon-sl-borde);
  box-shadow: 0 0 12px var(--color-neon-sl-sombra), 0 0 24px var(--color-neon-sl-sombra);
}
.grilla-tarjetas-etiquetas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15cm), 1fr));
  gap: 0.85rem;
}
.tarjeta-etiqueta-item {
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  padding: 0.56rem 0.54rem;
  background: var(--color-superficie);
  width: min(100%, 15.9cm);
  justify-self: center;
}
.tarjeta-etiqueta-duplicada {
  background: color-mix(in oklab, var(--color-error) 10%, transparent);
}
.tarjeta-etiqueta-inexistente {
  background: color-mix(in oklab, var(--color-carga) 10%, transparent);
}
.franja-controles-tarjeta {
  margin-top: 0.32rem;
  padding-top: 0.42rem;
  border-top: 1px solid color-mix(in oklab, var(--color-borde) 65%, transparent);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.6rem;
}
@media (min-width: 601px) and (max-width: 1024px) {
  .tarjeta-etiqueta-item {
    padding: 0.65rem;
  }
}
@media (min-width: 1025px) {
  .grilla-tarjetas-etiquetas {
    gap: 1rem;
  }
  .tarjeta-etiqueta-item {
    padding: 0.7rem;
  }
}
</style>
