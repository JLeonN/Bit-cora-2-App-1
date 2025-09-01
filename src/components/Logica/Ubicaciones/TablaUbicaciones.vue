<template>
  <div>
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
        @click="$emit('abrirModalEliminarTodas')"
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
            <IconPencil
              class="icono-accion icono-editar"
              @click="$emit('abrirModalEditar', index)"
            />
            <IconTrash
              class="icono-accion icono-borrar"
              @click="$emit('abrirModalEliminar', index)"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
// --- Se importa 'computed' para manejar la lógica localmente ---
import { computed } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'

// --- Las props ---
const props = defineProps({
  ubicaciones: {
    type: Array,
    required: true,
  },
})

// función local para pintar duplicados y calcularlos
function normalizarUbicacion(item) {
  return `${item.codigo.trim().toUpperCase()}|${item.ubicacion.trim().toUpperCase()}`
}

// --- Lógica de duplicados ---
const combinacionesDuplicadas = computed(() => {
  const conteo = new Map()
  for (const u of props.ubicaciones) {
    const clave = normalizarUbicacion(u)
    conteo.set(clave, (conteo.get(clave) || 0) + 1)
  }
  const duplicados = new Set()
  for (const [clave, cantidad] of conteo.entries()) {
    if (cantidad > 1) duplicados.add(clave)
  }
  return duplicados
})

// --- El conteo también se calcula aquí ---
const cantidadUbicacionesRepetidas = computed(
  () =>
    props.ubicaciones.filter((u) => combinacionesDuplicadas.value.has(normalizarUbicacion(u)))
      .length,
)
</script>
