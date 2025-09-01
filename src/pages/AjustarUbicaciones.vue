<template>
  <div class="contenedor-tabla">
    <h2 class="titulo-tabla">Ajustar ubicaciones</h2>

    <!-- Formulario de ubicación -->
    <FormularioUbicacion
      v-model:nuevoCodigo="nuevoCodigo"
      v-model:nuevaUbicacion="nuevaUbicacion"
      :placeholderCodigo="placeholderCodigo"
      :placeholderUbicacion="placeholderUbicacion"
      :errorCodigo="errorCodigo"
      :animarErrorCodigo="animarErrorCodigo"
      :errorUbicacion="errorUbicacion"
      :animarErrorUbicacion="animarErrorUbicacion"
      @restablecerPlaceholderCodigo="restablecerPlaceholderCodigo"
      @restablecerPlaceholderUbicacion="restablecerPlaceholderUbicacion"
      @agregarUbicacion="agregarUbicacion"
    />

    <!-- Indicadores de cantidad -->
    <div class="encabezado-tabla">
      <p class="texto-secundario">Ubicaciones totales: {{ ubicaciones.length }}</p>
      <p v-if="cantidadUbicacionesRepetidas > 0" class="texto-secundario texto-repetidos">
        Ubicaciones repetidas: {{ cantidadUbicacionesRepetidas }}
      </p>
    </div>

    <!-- Botón borrar toda la tabla -->
    <div class="contenedor-boton-borrar-todo" v-if="ubicaciones.length > 0">
      <IconTrash
        class="icono-accion icono-borrar-todo"
        @click="abrirModalEliminarTodas"
        title="Borrar todas las ubicaciones"
      />
    </div>

    <!-- Tabla de ubicaciones -->
    <table class="tabla">
      <thead>
        <tr>
          <th>Código</th>
          <th>Ubicación</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in ubicaciones"
          :key="index"
          :class="{ 'fila-duplicada': combinacionesDuplicadas.has(normalizarUbicacion(item)) }"
        >
          <td>
            <span
              class="globito"
              :class="{ 'texto-duplicado': combinacionesDuplicadas.has(normalizarUbicacion(item)) }"
              :title="item.codigo"
            >
              {{ item.codigo.slice(0, 15) }}<span v-if="item.codigo.length > 15">...</span>
            </span>
          </td>
          <td>
            <span
              class="globito"
              :class="{ 'texto-duplicado': combinacionesDuplicadas.has(normalizarUbicacion(item)) }"
              :title="item.ubicacion"
            >
              {{ item.ubicacion }}
            </span>
          </td>
          <td class="acciones">
            <IconPencil class="icono-accion icono-editar" @click="abrirModalEditar(index)" />
            <IconTrash class="icono-accion icono-borrar" @click="abrirModalEliminar(index)" />
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal: Editar Ubicación -->
    <ModalEditarUbicacion
      v-if="mostrarModalEditar"
      :codigo="ubicacionEditar?.codigo"
      :ubicacion="ubicacionEditar?.ubicacion"
      @guardar="guardarEdicion"
      @cerrar="cerrarModalEditar"
    />

    <!-- Modal: Eliminar Ubicación -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="ubicacionEliminar?.codigo"
      @confirmar="confirmarEliminacion"
      @cerrar="cerrarModalEliminar"
    />

    <!-- Modal: Eliminar Todas Ubicaciones -->
    <ModalEliminar
      v-if="mostrarModalEliminarTodas"
      texto="todas las ubicaciones"
      @confirmar="confirmarEliminacionTodas"
      @cerrar="cerrarModalEliminarTodas"
    />

    <!-- Botón enviar flotante -->
    <BotonEnviar @enviar="accionEnviarUbicaciones" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import ModalEditarUbicacion from '../components/Modales/ModalEditarUbicacion.vue'
import BotonEnviar from '../components/Botones/BotonesDescargarEnviar.vue'
import FormularioUbicacion from '../components/Logica/Ubicaciones/FormularioUbicacion.vue'
import {
  guardarUbicaciones,
  obtenerUbicaciones,
} from '../components/BaseDeDatos/usoAlmacenamientoUbicaciones'

// Estado
const ubicaciones = ref([])
const nuevoCodigo = ref('')
const nuevaUbicacion = ref('')

// Placeholders dinámicos
const placeholderCodigo = ref('Código del artículo')
const placeholderUbicacion = ref('Ubicación')

// Errores de inputs
const errorCodigo = ref(false)
const animarErrorCodigo = ref(false)
const errorUbicacion = ref(false)
const animarErrorUbicacion = ref(false)

// Modal eliminar
const mostrarModalEliminar = ref(false)
const ubicacionEliminar = ref(null)

// Modal eliminar todas
const mostrarModalEliminarTodas = ref(false)

// Modal editar
const mostrarModalEditar = ref(false)
const ubicacionEditar = ref(null)
let indiceEditar = null

// Flag para prevenir doble click / doble submit
let bloqueandoClick = false

// Cargar ubicaciones al montar
onMounted(async () => {
  ubicaciones.value = await obtenerUbicaciones()
})

// Funciones de reset de placeholders
function restablecerPlaceholderCodigo() {
  errorCodigo.value = false
  placeholderCodigo.value = 'Código del artículo'
}
function restablecerPlaceholderUbicacion() {
  errorUbicacion.value = false
  placeholderUbicacion.value = 'Ubicación'
}

// Código + Ubicación
function normalizarUbicacion(item) {
  return `${item.codigo.trim().toUpperCase()}|${item.ubicacion.trim().toUpperCase()}`
}

// Para duplicados
const combinacionesDuplicadas = computed(() => {
  const conteo = new Map()
  for (const u of ubicaciones.value) {
    const clave = normalizarUbicacion(u)
    conteo.set(clave, (conteo.get(clave) || 0) + 1)
  }
  const duplicados = new Set()
  for (const [clave, cantidad] of conteo.entries()) {
    if (cantidad > 1) duplicados.add(clave)
  }
  return duplicados
})

const cantidadUbicacionesRepetidas = computed(
  () =>
    ubicaciones.value.filter((u) => combinacionesDuplicadas.value.has(normalizarUbicacion(u)))
      .length,
)

// Agregar nueva ubicación
async function agregarUbicacion() {
  if (bloqueandoClick) return
  bloqueandoClick = true

  let valido = true
  if (!nuevoCodigo.value.trim()) {
    errorCodigo.value = true
    animarErrorCodigo.value = true
    placeholderCodigo.value = 'Ingresar un código'
    valido = false
  }
  if (!nuevaUbicacion.value.trim()) {
    errorUbicacion.value = true
    animarErrorUbicacion.value = true
    placeholderUbicacion.value = 'Ingresar una ubicación'
    valido = false
  }
  if (!valido) {
    bloqueandoClick = false
    return
  }

  ubicaciones.value.unshift({
    codigo: nuevoCodigo.value.trim().toUpperCase(),
    ubicacion: nuevaUbicacion.value.trim().toUpperCase(),
  })

  await guardarUbicaciones(ubicaciones.value)

  // limpiar inputs
  nuevoCodigo.value = ''
  nuevaUbicacion.value = ''
  restablecerPlaceholderCodigo()
  restablecerPlaceholderUbicacion()

  setTimeout(() => (bloqueandoClick = false), 100)
}

// Abrir modal editar
function abrirModalEditar(indice) {
  ubicacionEditar.value = { ...ubicaciones.value[indice] }
  indiceEditar = indice
  mostrarModalEditar.value = true
}

// Guardar edición
async function guardarEdicion(datos) {
  if (indiceEditar !== null) {
    ubicaciones.value[indiceEditar] = {
      codigo: datos.codigo.trim().toUpperCase(),
      ubicacion: datos.ubicacion.trim().toUpperCase(),
    }
    await guardarUbicaciones(ubicaciones.value)
  }
  mostrarModalEditar.value = false
  indiceEditar = null
}

// Cerrar modal editar
function cerrarModalEditar() {
  mostrarModalEditar.value = false
  indiceEditar = null
}

// Abrir modal eliminar
function abrirModalEliminar(indice) {
  ubicacionEliminar.value = ubicaciones.value[indice]
  mostrarModalEliminar.value = true
}

// Confirmar eliminación
async function confirmarEliminacion() {
  const indice = ubicaciones.value.findIndex(
    (u) => normalizarUbicacion(u) === normalizarUbicacion(ubicacionEliminar.value),
  )
  if (indice !== -1) {
    ubicaciones.value.splice(indice, 1)
    await guardarUbicaciones(ubicaciones.value)
  }
  mostrarModalEliminar.value = false
}

// Cerrar modal eliminar
function cerrarModalEliminar() {
  mostrarModalEliminar.value = false
}

// Abrir modal eliminar todas
function abrirModalEliminarTodas() {
  mostrarModalEliminarTodas.value = true
}

// Confirmar eliminación de todas
async function confirmarEliminacionTodas() {
  ubicaciones.value = []
  await guardarUbicaciones(ubicaciones.value)
  mostrarModalEliminarTodas.value = false
}

// Cerrar modal eliminar todas
function cerrarModalEliminarTodas() {
  mostrarModalEliminarTodas.value = false
}

// Acción enviar (por ahora vacía)
function accionEnviarUbicaciones() {
  console.log('Enviar ubicaciones - función pendiente')
}
</script>
