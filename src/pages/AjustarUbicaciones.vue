<template>
  <div class="contenedor-tabla">
    <h2 class="titulo-tabla">Ajustar ubicaciones</h2>

    <!-- Formulario de ubicación -->
    <form class="formulario" @submit.prevent="agregarUbicacion">
      <input v-model="nuevoCodigo" type="text" placeholder="Código del artículo" required />
      <input v-model="nuevaUbicacion" type="text" placeholder="Ubicación" required />
      <button type="submit">Agregar</button>
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
            <IconPencil class="icono-accion icono-editar" @click="editarUbicacion(index)" />
            <IconTrash class="icono-accion icono-borrar" @click="abrirModalEliminar(index)" />
          </td>
        </tr>
      </tbody>
    </table>

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
import { ref } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'

// Estado local (sin base de datos todavía)
const ubicaciones = ref([])
const nuevoCodigo = ref('')
const nuevaUbicacion = ref('')

// Control del modal
const mostrarModalEliminar = ref(false)
const ubicacionEliminar = ref(null)

// Agregar nueva ubicación
function agregarUbicacion() {
  ubicaciones.value.push({
    codigo: nuevoCodigo.value,
    ubicacion: nuevaUbicacion.value,
  })

  // limpiar inputs
  nuevoCodigo.value = ''
  nuevaUbicacion.value = ''
}

// Editar ubicación
function editarUbicacion(indice) {
  const nueva = prompt('Editar ubicación:', ubicaciones.value[indice].ubicacion)
  if (nueva !== null && nueva.trim() !== '') {
    ubicaciones.value[indice].ubicacion = nueva.trim()
  }
}

// Abrir modal eliminar
function abrirModalEliminar(indice) {
  ubicacionEliminar.value = ubicaciones.value[indice]
  mostrarModalEliminar.value = true
}

// Confirmar eliminación
function confirmarEliminacion() {
  const indice = ubicaciones.value.findIndex((u) => u.codigo === ubicacionEliminar.value.codigo)
  if (indice !== -1) {
    ubicaciones.value.splice(indice, 1)
  }
  mostrarModalEliminar.value = false
}

// Cerrar modal
function cerrarModalEliminar() {
  mostrarModalEliminar.value = false
}
</script>
