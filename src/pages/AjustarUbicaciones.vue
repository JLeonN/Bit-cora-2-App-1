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
            <IconTrash class="icono-accion icono-borrar" @click="eliminarUbicacion(index)" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'

// Estado local (sin base de datos todavía)
const ubicaciones = ref([])
const nuevoCodigo = ref('')
const nuevaUbicacion = ref('')

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

// Eliminar ubicación
function eliminarUbicacion(indice) {
  if (confirm('¿Eliminar esta ubicación?')) {
    ubicaciones.value.splice(indice, 1)
  }
}
</script>
