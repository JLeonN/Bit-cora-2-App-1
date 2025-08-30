<template>
  <div class="contenedor-tabla">
    <h2 class="titulo-tabla">Ajustar ubicaciones</h2>

    <!-- Formulario de ubicación -->
    <form class="formulario" @submit.prevent="agregarUbicacion">
      <div class="ubicacion-campo">
        <input
          v-model="nuevoCodigo"
          type="text"
          :placeholder="placeholderCodigo"
          :class="{ 'input-error': errorCodigo, 'animar-error': animarErrorCodigo }"
          @animationend="animarErrorCodigo = false"
          @input="restablecerPlaceholderCodigo"
        />
      </div>

      <div class="ubicacion-campo">
        <input
          v-model="nuevaUbicacion"
          type="text"
          :placeholder="placeholderUbicacion"
          :class="{ 'input-error': errorUbicacion, 'animar-error': animarErrorUbicacion }"
          @animationend="animarErrorUbicacion = false"
          @input="restablecerPlaceholderUbicacion"
        />
      </div>

      <!-- Botón agregar ubicación -->
      <div class="contenedor-boton-agregar">
        <TresBotones :textoAceptar="'Agregar'" @aceptar="agregarUbicacion" />
      </div>
    </form>

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
        <tr v-for="(item, index) in ubicaciones" :key="index">
          <td>
            <span class="globito" :title="item.codigo">
              {{ item.codigo.slice(0, 15) }}<span v-if="item.codigo.length > 15">...</span>
            </span>
          </td>
          <td>{{ item.ubicacion }}</td>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import ModalEditarUbicacion from '../components/Modales/ModalEditarUbicacion.vue'
import TresBotones from '../components/Botones/TresBotones.vue'
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

  // Convertimos a mayúsculas antes de agregar
  ubicaciones.value.push({
    codigo: nuevoCodigo.value.trim().toUpperCase(),
    ubicacion: nuevaUbicacion.value.trim().toUpperCase(),
  })

  await guardarUbicaciones(ubicaciones.value)

  // limpiar inputs
  nuevoCodigo.value = ''
  nuevaUbicacion.value = ''
  restablecerPlaceholderCodigo()
  restablecerPlaceholderUbicacion()

  // desbloquear después de 100ms
  setTimeout(() => {
    bloqueandoClick = false
  }, 100)
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
    // Convertimos a mayúsculas antes de guardar
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
  const indice = ubicaciones.value.findIndex((u) => u.codigo === ubicacionEliminar.value.codigo)
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
</script>
