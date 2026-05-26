<template>
  <div>
    <div class="encabezado-tabla">
      <p v-if="etiquetas.length > 0" class="texto-secundario">
        Etiquetas totales: {{ etiquetas.length }}
      </p>
      <p v-if="etiquetas.length > 0" class="texto-secundario">Copias totales: {{ totalCopias }}</p>
      <p v-if="cantidadCodigosRepetidos > 0" class="texto-secundario texto-repetidos">
        Códigos repetidos: {{ cantidadCodigosRepetidos }}
      </p>
      <p v-if="cantidadArticulosInexistentes > 0" class="texto-secundario texto-inexistente">
        Artículos inexistentes: {{ cantidadArticulosInexistentes }}
      </p>
    </div>
    <div class="contenedor-boton-borrar-todo" v-if="etiquetas.length > 0">
      <IconTrash
        class="icono-accion icono-borrar-todo"
        @click="confirmarLimpiar"
        title="Limpiar todas las etiquetas"
      />
    </div>
    <table class="tabla-ubicaciones" v-if="etiquetas.length > 0">
      <thead>
        <tr>
          <th class="columna-nombre-codigo">Nombre y Código</th>
          <th class="columna-ubicacion">Ubicación</th>
          <th class="columna-cantidad">Cantidad</th>
          <th class="columna-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(etiqueta, indice) in etiquetas"
          :key="etiqueta.id"
          class="fila-ubicacion"
          :class="{
            'fila-ubicacion-duplicada': codigosDuplicados.has(normalizarCodigo(etiqueta.codigo)),
            'fila-articulo-inexistente': esArticuloInexistente(etiqueta.codigo),
            'fila-ubicacion-sl': esUbicacionSL(etiqueta.ubicacion),
          }"
        >
          <td class="celda-nombre-codigo">
            <TarjetaPreviewEtiquetaMovil
              :etiqueta="etiqueta"
              :nombre-articulo="obtenerNombreArticulo(etiqueta.codigo)"
              :es-ubicacion-sl="esUbicacionSL"
              :codigo-barra-valido="codigoBarraValido"
            />
            <div class="campo-responsive">
              <span class="label-responsive">Nombre y Código:</span>
              <span
                class="globito-ubicacion"
                :class="{
                  'texto-duplicado': codigosDuplicados.has(normalizarCodigo(etiqueta.codigo)),
                  'texto-articulo-inexistente': esArticuloInexistente(etiqueta.codigo),
                }"
                :title="`${obtenerNombreArticulo(etiqueta.codigo)} - ${etiqueta.codigo}`"
              >
                <div class="contenedor-nombre-codigo">
                  <div class="nombre-articulo">
                    {{ obtenerNombreArticulo(etiqueta.codigo) }}
                  </div>
                  <div class="codigo-articulo">{{ etiqueta.codigo }}</div>
                </div>
              </span>
            </div>
          </td>
          <td class="celda-ubicacion">
            <div class="campo-responsive">
              <span class="label-responsive">Ubicación:</span>
              <span
                class="globito-ubicacion"
                :class="{ 'texto-sl-neon': esUbicacionSL(etiqueta.ubicacion) }"
                :title="etiqueta.ubicacion || 'Sin ubicación'"
              >
                {{ etiqueta.ubicacion || 'Sin ubicación' }}
              </span>
            </div>
          </td>
          <td class="celda-cantidad">
            <ControlesFilaEtiqueta
              modo="cantidad"
              :etiqueta="etiqueta"
              :indice="indice"
              @incrementar="incrementarCantidad"
              @decrementar="decrementarCantidad"
              @actualizar="actualizarCantidad"
            />
          </td>
          <td class="celda-acciones">
            <ControlesFilaEtiqueta
              modo="acciones"
              :etiqueta="etiqueta"
              :indice="indice"
              @editar="editarEtiqueta"
              @eliminar="eliminarEtiqueta"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="etiquetas.length === 0" class="sin-etiquetas">
      <IconTag :size="48" :stroke="1.5" class="icono-vacio" />
      <p>No hay etiquetas agregadas</p>
      <span class="texto-ayuda">Agregá etiquetas usando el formulario de arriba</span>
    </div>
    <ModalEditarEtiqueta
      v-if="mostrarModalEditar"
      :etiqueta="etiquetaEditando"
      @guardar="guardarEdicion"
      @cerrar="cerrarModalEditar"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />
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
import ModalEditarEtiqueta from '../../Modales/ModalEditarEtiqueta.vue'
import ModalEliminar from '../../Modales/ModalEliminar.vue'
import TarjetaPreviewEtiquetaMovil from './TarjetaPreviewEtiquetaMovil.vue'
import ControlesFilaEtiqueta from './ControlesFilaEtiqueta.vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'
import { usarCodigoBarraEtiqueta } from './UsoCodigoBarraEtiqueta.js'

const props = defineProps({
  etiquetas: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits([
  'editar-etiqueta',
  'eliminar-etiqueta',
  'limpiar-todo',
  'modal-abierto',
  'modal-cerrado',
])

const mostrarModalEditar = ref(false)
const etiquetaEditando = ref(null)
const mostrarModalLimpiarTodo = ref(false)
const { codigoBarraValido } = usarCodigoBarraEtiqueta()

const manejarModalAbierto = () => {
  emit('modal-abierto')
}
const manejarModalCerrado = () => {
  emit('modal-cerrado')
}
const totalCopias = computed(() => {
  return props.etiquetas.reduce((total, etiqueta) => total + (etiqueta.cantidad || 1), 0)
})

function incrementarCantidad(indice) {
  const etiquetaActualizada = { ...props.etiquetas[indice] }
  etiquetaActualizada.cantidad++
  emit('editar-etiqueta', etiquetaActualizada)
}

function decrementarCantidad(indice) {
  if (props.etiquetas[indice].cantidad > 1) {
    const etiquetaActualizada = { ...props.etiquetas[indice] }
    etiquetaActualizada.cantidad--
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

function editarEtiqueta(indice) {
  etiquetaEditando.value = { ...props.etiquetas[indice] }
  mostrarModalEditar.value = true
}

function guardarEdicion(etiquetaEditada) {
  emit('editar-etiqueta', etiquetaEditada)
  cerrarModalEditar()
}

function cerrarModalEditar() {
  mostrarModalEditar.value = false
  etiquetaEditando.value = null
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

function obtenerNombreArticulo(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return 'Artículo inexistente'
  }
  try {
    const articulosCargados = obtenerArticulosCargados()
    if (!Array.isArray(articulosCargados)) {
      return 'Base de datos no cargada'
    }
    const articuloEncontrado = articulosCargados.find(
      (articulo) =>
        articulo &&
        articulo.codigo &&
        typeof articulo.codigo === 'string' &&
        articulo.codigo.toLowerCase() === codigo.toLowerCase(),
    )
    const etiquetaActual = props.etiquetas.find((etiqueta) => etiqueta.codigo === codigo)
    return articuloEncontrado?.nombre || etiquetaActual?.descripcion || 'Artículo inexistente'
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
      (articulo) =>
        articulo &&
        articulo.codigo &&
        typeof articulo.codigo === 'string' &&
        articulo.codigo.toLowerCase() === codigo.toLowerCase(),
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
    return props.etiquetas.filter(
      (etiqueta) =>
        etiqueta &&
        etiqueta.codigo &&
        codigosDuplicados.value.has(normalizarCodigo(etiqueta.codigo)),
    ).length
  } catch (error) {
    console.error('[cantidadCodigosRepetidos] Error:', error)
    return 0
  }
})

const cantidadArticulosInexistentes = computed(() => {
  try {
    return props.etiquetas.filter((etiqueta) => etiqueta && esArticuloInexistente(etiqueta.codigo))
      .length
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
.label-responsive {
  display: none;
}
.fila-ubicacion-sl {
  border-color: var(--color-neon-sl-borde);
  box-shadow: 0 0 12px var(--color-neon-sl-sombra), 0 0 24px var(--color-neon-sl-sombra);
}
.texto-sl-neon {
  color: var(--color-neon-sl-texto);
  text-shadow: 0 0 8px var(--color-neon-sl-sombra), 0 0 16px var(--color-neon-sl-sombra);
}
.columna-nombre-codigo {
  width: 40%;
}
.columna-ubicacion {
  width: 10%;
}
.columna-cantidad {
  width: 20%;
  padding-left: 5rem !important;
}
.columna-acciones {
  width: 10%;
  text-align: center;
}
.celda-cantidad {
  padding-left: 1rem;
}
@media (max-width: 900px) {
  .tabla-ubicaciones {
    font-size: 0.85rem;
  }
  .tabla-ubicaciones th,
  .tabla-ubicaciones td {
    padding: 0.7rem 0.8rem;
  }
  .globito-ubicacion {
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
  }
}
@media (max-width: 600px) {
  .encabezado-tabla {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem;
  }
  .texto-secundario {
    width: 100%;
    padding: 0.3rem 0.6rem;
    font-size: 0.85rem;
  }
  .contenedor-boton-borrar-todo {
    margin-bottom: 0.5rem;
  }
  .tabla-ubicaciones {
    display: block;
    border: none;
    background: transparent;
  }
  .tabla-ubicaciones thead {
    display: none;
  }
  .tabla-ubicaciones tbody,
  .tabla-ubicaciones td {
    display: block;
    width: 100%;
  }
  .tabla-ubicaciones tbody tr {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: 0.6rem;
    row-gap: 0.26rem;
    margin-bottom: 0.75rem;
    border: 1px solid var(--color-borde);
    border-radius: 8px;
    padding: 0.56rem 0.54rem;
    background: var(--color-superficie);
  }
  .celda-nombre-codigo {
    grid-column: 1 / -1;
  }
  .celda-ubicacion {
    display: none !important;
  }
  .celda-cantidad {
    grid-column: 1 / 2;
    border-top: 1px solid color-mix(in oklab, var(--color-borde) 65%, transparent);
    padding-top: 0.45rem !important;
  }
  .celda-acciones {
    grid-column: 2 / 3;
    border-top: 1px solid color-mix(in oklab, var(--color-borde) 65%, transparent);
    padding-top: 0.45rem !important;
  }
  .tabla-ubicaciones tbody tr.fila-ubicacion-sl {
    border-color: var(--color-neon-sl-borde);
    box-shadow: 0 0 10px var(--color-neon-sl-sombra), 0 0 20px var(--color-neon-sl-sombra);
  }
  .tabla-ubicaciones tbody tr.fila-ubicacion-duplicada {
    background: color-mix(in oklab, var(--color-error) 10%, transparent);
  }
  .tabla-ubicaciones tbody tr.fila-articulo-inexistente {
    background: color-mix(in oklab, var(--color-carga) 10%, transparent);
  }
  .tabla-ubicaciones td {
    padding: 0.16rem 0;
    border: none;
    text-align: left;
  }
  .celda-nombre-codigo .campo-responsive,
  .celda-ubicacion .campo-responsive {
    display: none;
  }
  .sin-etiquetas {
    padding: 2rem 1rem;
  }
  .sin-etiquetas p {
    font-size: 1rem;
  }
  .texto-ayuda {
    font-size: 0.85rem;
  }
}
</style>
