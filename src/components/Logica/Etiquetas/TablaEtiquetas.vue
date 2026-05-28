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
          :indice-accion-edicion="indiceAccionEdicion"
          :version-accion-edicion="versionAccionEdicion"
          @borrador-campo="actualizarBorradorCampoInline"
          @confirmar-edicion="confirmarEdicionInline"
          @cancelar-edicion="cancelarEdicionInline"
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
          <div class="columna-confirmar">
            <div class="acciones-confirmar">
              <button type="button" class="boton-confirmar boton-check" @click="confirmarEdicionInline(indice)" :disabled="!tieneBorrador(indice)" title="Guardar cambios">
                <IconCheck :size="16" :stroke="2.2" />
              </button>
              <button type="button" class="boton-confirmar boton-restablecer" @click="restablecerEtiquetaDesdeMaestro(indice)" title="Restablecer valores de fábrica">
                <IconRestore :size="16" :stroke="2.2" />
              </button>
            </div>
          </div>
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
import { IconTrash, IconTag, IconCheck, IconRestore } from '@tabler/icons-vue'
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
const borradoresEdicion = ref({})
const indiceAccionEdicion = ref(-1)
const versionAccionEdicion = ref(0)
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

function actualizarBorradorCampoInline({ indice, campo, valor }) {
  if (!campo || !props.etiquetas[indice]) {
    return
  }
  if (!borradoresEdicion.value[indice]) {
    borradoresEdicion.value[indice] = {}
  }
  borradoresEdicion.value[indice][campo] = valor
}

function tieneBorrador(indice) {
  const borrador = borradoresEdicion.value[indice]
  return !!(borrador && Object.keys(borrador).length)
}

function confirmarEdicionInline(indice) {
  const etiquetaBase = props.etiquetas[indice]
  const borrador = borradoresEdicion.value[indice]
  if (!etiquetaBase || !borrador) {
    return
  }
  const etiquetaActualizada = { ...etiquetaBase }
  if (Object.prototype.hasOwnProperty.call(borrador, 'codigo')) {
    etiquetaActualizada.codigo = String(borrador.codigo || '').trim().toUpperCase()
  }
  if (Object.prototype.hasOwnProperty.call(borrador, 'descripcion')) {
    etiquetaActualizada.descripcion = String(borrador.descripcion || '')
  }
  if (Object.prototype.hasOwnProperty.call(borrador, 'ubicacion')) {
    const ubicacionNormalizada = String(borrador.ubicacion || '').toUpperCase().replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
    etiquetaActualizada.ubicacion = ubicacionNormalizada || 'Sin ubicación'
  }
  emit('editar-etiqueta', etiquetaActualizada)
  delete borradoresEdicion.value[indice]
  indiceAccionEdicion.value = indice
  versionAccionEdicion.value += 1
}

function cancelarEdicionInline(indice) {
  if (borradoresEdicion.value[indice]) {
    delete borradoresEdicion.value[indice]
  }
  indiceAccionEdicion.value = indice
  versionAccionEdicion.value += 1
}

function restablecerEtiquetaDesdeMaestro(indice) {
  const etiquetaBase = props.etiquetas[indice]
  if (!etiquetaBase) {
    return
  }
  let articuloMaestro = null
  try {
    const articulosCargados = obtenerArticulosCargados()
    if (Array.isArray(articulosCargados)) {
      articuloMaestro = articulosCargados.find(
        (articulo) =>
          articulo &&
          typeof articulo.codigo === 'string' &&
          articulo.codigo.toLowerCase() === String(etiquetaBase.codigo || '').toLowerCase(),
      )
    }
  } catch (error) {
    console.error('[restablecerEtiquetaDesdeMaestro] Error:', error)
  }
  const etiquetaRestablecida = {
    ...etiquetaBase,
    descripcion: articuloMaestro?.nombre || etiquetaBase.descripcion || '',
  }
  emit('editar-etiqueta', etiquetaRestablecida)
  if (borradoresEdicion.value[indice]) {
    delete borradoresEdicion.value[indice]
  }
  indiceAccionEdicion.value = indice
  versionAccionEdicion.value += 1
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
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 0.6rem;
  align-items: end;
}
.columna-confirmar {
  display: grid;
  gap: 0.2rem;
  justify-items: center;
  min-width: 88px;
}
.acciones-confirmar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.boton-confirmar {
  width: 30px;
  height: 30px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.boton-check {
  color: var(--color-exito);
}
.boton-restablecer {
  color: var(--color-carga);
}
.boton-confirmar:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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
