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
          }"
        >
          <td class="celda-nombre-codigo" data-label="Artículo:">
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
          </td>

          <td class="celda-ubicacion" data-label="Ubicación:">
            <span class="globito-ubicacion" :title="etiqueta.ubicacion || 'Sin ubicación'">
              {{ etiqueta.ubicacion || 'Sin ubicación' }}
            </span>
          </td>

          <td class="celda-cantidad" data-label="Cantidad:">
            <div class="control-cantidad">
              <button
                type="button"
                class="boton-cantidad boton-menos"
                @click="decrementarCantidad(indice)"
                :disabled="etiqueta.cantidad <= 1"
              >
                <IconMinus :size="16" :stroke="2" />
              </button>
              <input
                type="number"
                min="1"
                v-model.number="etiqueta.cantidad"
                @change="actualizarCantidad(indice)"
                class="input-cantidad"
              />
              <button
                type="button"
                class="boton-cantidad boton-mas"
                @click="incrementarCantidad(indice)"
              >
                <IconPlus :size="16" :stroke="2" />
              </button>
            </div>
          </td>

          <td class="celda-acciones" data-label="Acciones:">
            <div class="acciones-ubicacion">
              <IconPencil
                class="icono-ubicacion icono-editar"
                @click="editarEtiqueta(indice)"
                title="Editar etiqueta"
              />
              <IconTrash
                class="icono-ubicacion icono-borrar"
                @click="eliminarEtiqueta(indice)"
                title="Eliminar etiqueta"
              />
            </div>
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
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { IconPencil, IconTrash, IconPlus, IconMinus, IconTag } from '@tabler/icons-vue'
import ModalEditarEtiqueta from '../../Modales/ModalEditarEtiqueta.vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'

const props = defineProps({
  etiquetas: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['editar-etiqueta', 'eliminar-etiqueta', 'limpiar-todo'])

// --- ESTADO REACTIVO ---
const mostrarModalEditar = ref(false)
const etiquetaEditando = ref(null)
const indiceEditando = ref(null)

// --- COMPUTED ---
const totalCopias = computed(() => {
  return props.etiquetas.reduce((total, etiqueta) => total + (etiqueta.cantidad || 1), 0)
})

// --- FUNCIONES ---
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

function actualizarCantidad(indice) {
  const etiquetaActualizada = { ...props.etiquetas[indice] }
  if (etiquetaActualizada.cantidad < 1 || !etiquetaActualizada.cantidad) {
    etiquetaActualizada.cantidad = 1
  }
  emit('editar-etiqueta', etiquetaActualizada)
}

function editarEtiqueta(indice) {
  etiquetaEditando.value = { ...props.etiquetas[indice] }
  indiceEditando.value = indice
  mostrarModalEditar.value = true
}

function guardarEdicion(etiquetaEditada) {
  emit('editar-etiqueta', etiquetaEditada)
  cerrarModalEditar()
}

function cerrarModalEditar() {
  mostrarModalEditar.value = false
  etiquetaEditando.value = null
  indiceEditando.value = null
}

function eliminarEtiqueta(indice) {
  emit('eliminar-etiqueta', indice)
}

function confirmarLimpiar() {
  if (confirm('¿Estás seguro de que querés limpiar todas las etiquetas?')) {
    emit('limpiar-todo')
  }
}

// --- Función para normalizar solo el código ---
function normalizarCodigo(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return ''
  }
  return codigo.trim().toUpperCase()
}

// --- Función para obtener el nombre del artículo ---
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

    // Si no lo encuentra, usa la descripción de la etiqueta como fallback
    const etiquetaActual = props.etiquetas.find((e) => e.codigo === codigo)
    return articuloEncontrado?.nombre || etiquetaActual?.descripcion || 'Artículo inexistente'
  } catch (error) {
    console.error('[obtenerNombreArticulo] Error:', error)
    return 'Error al buscar artículo'
  }
}

// --- Función para verificar si un artículo existe ---
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

// --- Lógica de duplicados ---
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

// --- Conteo de etiquetas con códigos repetidos ---
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

// --- Conteo de artículos inexistentes ---
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
.contenedor-tabla {
  background-color: var(--color-superficie);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  margin-bottom: 1.5rem;
}
.encabezado-tabla {
  /* Clase para los contadores */
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin-bottom: 1rem;
}
.texto-secundario {
  font-size: 0.9rem;
  color: var(--color-texto-secundario);
  background: var(--color-fondo);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-weight: 500;
}
.texto-repetidos {
  color: var(--color-alerta);
  background-color: var(--color-alerta-fondo);
}
.texto-inexistente {
  color: var(--color-error);
  background-color: var(--color-error-fondo);
}
/* Botón borrar toda la tabla */
.contenedor-boton-borrar-todo {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}
.icono-borrar-todo {
  cursor: pointer;
  color: var(--color-error);
  transition: transform 0.2s ease;
}
.icono-borrar-todo:hover {
  transform: scale(1.1);
}
/* Sin etiquetas */
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
/* Tabla - Usando clases de TablaUbicaciones */
.tabla-ubicaciones {
  width: 100%;
  border-collapse: collapse;
}
.tabla-ubicaciones th,
.tabla-ubicaciones td {
  padding: 12px;
  border-bottom: 1px solid var(--color-borde);
  text-align: left;
  color: var(--color-texto-principal);
  vertical-align: middle;
}
.tabla-ubicaciones th {
  color: var(--color-primario-claro);
  font-weight: 600;
  font-size: 0.9rem;
}
.tabla-ubicaciones tbody tr:last-child td {
  border-bottom: none;
}
.columna-nombre-codigo {
  width: 40%;
}
.columna-ubicacion {
  width: 25%;
}
.columna-cantidad {
  width: 20%;
  text-align: center;
}
.columna-acciones {
  width: 15%;
  text-align: center;
}
/* Estilos para estado de fila */
.fila-ubicacion-duplicada {
  background-color: var(--color-alerta-fondo);
}
.fila-articulo-inexistente {
  background-color: var(--color-error-fondo);
}
.texto-duplicado {
  color: var(--color-alerta);
}
.texto-articulo-inexistente {
  color: var(--color-error);
}
/* Contenido de celda */
.contenedor-nombre-codigo {
  display: flex;
  flex-direction: column;
}
.nombre-articulo {
  font-weight: 600;
  font-size: 0.95rem;
}
.codigo-articulo {
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
}
.celda-cantidad {
  text-align: center;
}
/* Control de cantidad */
.control-cantidad {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}
.boton-cantidad {
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}
.input-cantidad {
  width: 50px;
  padding: 0.3rem;
  text-align: center;
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 4px;
  font-size: 0.9rem;
}
/* Acciones */
.acciones-ubicacion {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
}
.icono-ubicacion {
  cursor: pointer;
  transition: transform 0.2s ease;
}
.icono-ubicacion:hover {
  transform: scale(1.2);
}
.icono-editar {
  color: var(--color-acento);
}
.icono-borrar {
  color: var(--color-error);
}

/* Responsive */
@media (max-width: 900px) {
  .tabla-ubicaciones {
    font-size: 0.85rem;
  }
  .tabla-ubicaciones th,
  .tabla-ubicaciones td {
    padding: 8px;
  }
}

/* OPTIMIZACIÓN MÓVIL (Compactar campos) */
@media (max-width: 600px) {
  .contenedor-tabla {
    padding: 1rem;
    overflow-x: auto;
  }
  .tabla-ubicaciones {
    display: block;
    overflow-x: auto;
  }
  .tabla-ubicaciones thead {
    display: none;
  }
  .tabla-ubicaciones tbody,
  .tabla-ubicaciones tr,
  .tabla-ubicaciones td {
    display: block;
    width: 100%;
  }
  .tabla-ubicaciones tr {
    margin-bottom: 1rem;
    border: 1px solid var(--color-borde);
    border-radius: 8px;
    padding: 1rem;
    background: var(--color-fondo);
  }
  .tabla-ubicaciones td {
    padding: 0.2rem 0; /* Menos padding vertical para compactar */
    border: none;
    text-align: left;
    display: flex; /* Habilitar Flexbox en la celda */
    align-items: center;
  }

  /* Estilo de la etiqueta del campo (Ej: 'Ubicación:') */
  .tabla-ubicaciones td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-primario-claro);
    display: inline-block; /* Mostrar en línea con el valor */
    margin-right: 0.5rem; /* Espacio después de los dos puntos */
    font-size: 0.9rem;
    min-width: 85px; /* Ancho fijo para alinear etiquetas como 'Ubicación:', 'Cantidad:' */
  }

  /* Excepción para la celda de Nombre y Código (Artículo) */
  .celda-nombre-codigo {
    display: block; /* Vuelve a ser bloque para que el contenido (nombre/código) use todo el ancho */
  }
  .celda-nombre-codigo::before {
    content: attr(data-label);
    display: block; /* La etiqueta ('Artículo:') va en su propia línea */
    margin-bottom: 0.3rem;
    min-width: 0; /* Desactiva el min-width */
  }

  /* Ajuste para controles dentro de celdas compactas */
  .celda-cantidad {
    text-align: left; /* Alinea el contenido a la izquierda del flexbox */
  }
  .control-cantidad {
    justify-content: flex-start; /* Alinea los botones a la izquierda */
  }
  .acciones-ubicacion {
    justify-content: flex-start; /* Alinea los iconos a la izquierda */
  }
}
</style>
