<template>
  <div>
    <!-- Indicadores de cantidad -->
    <div class="encabezado-tabla">
      <p class="texto-secundario">Ubicaciones totales: {{ ubicaciones.length }}</p>
      <p v-if="cantidadCodigosRepetidos > 0" class="texto-secundario texto-repetidos">
        Códigos repetidos: {{ cantidadCodigosRepetidos }}
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
    <table class="tabla-ubicaciones">
      <thead>
        <tr>
          <th class="columna-nombre-codigo">Nombre y Código</th>
          <th class="columna-ubicacion">Ubicación</th>
          <th class="columna-acciones">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in ubicaciones"
          :key="index"
          class="fila-ubicacion"
          :class="{
            'fila-ubicacion-duplicada': codigosDuplicados.has(normalizarCodigo(item.codigo)),
          }"
        >
          <td class="celda-nombre-codigo">
            <span
              class="globito-ubicacion"
              :class="{ 'texto-duplicado': codigosDuplicados.has(normalizarCodigo(item.codigo)) }"
              :title="`${obtenerNombreArticulo(item.codigo)} - ${item.codigo}`"
            >
              <div class="contenedor-nombre-codigo">
                <div class="nombre-articulo">
                  {{ obtenerNombreArticulo(item.codigo) }}
                </div>
                <div class="codigo-articulo">
                  {{ item.codigo.slice(0, 15) }}<span v-if="item.codigo.length > 15">...</span>
                </div>
              </div>
            </span>
          </td>
          <td class="celda-ubicacion">
            <span class="globito-ubicacion" :title="item.ubicacion">
              {{ item.ubicacion }}
            </span>
          </td>
          <td class="celda-acciones">
            <div class="acciones-ubicacion">
              <IconPencil
                class="icono-ubicacion icono-editar"
                @click="$emit('abrirModalEditar', index)"
              />
              <IconTrash
                class="icono-ubicacion icono-borrar"
                @click="$emit('abrirModalEliminar', index)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IconPencil, IconTrash } from '@tabler/icons-vue'
import { articulos } from '../../BaseDeDatos/CodigosArticulos.js'

const props = defineProps({
  ubicaciones: {
    type: Array,
    required: true,
  },
})

// --- Función para normalizar solo el código ---
function normalizarCodigo(codigo) {
  return codigo.trim().toUpperCase()
}

// --- Función para obtener el nombre del artículo ---
function obtenerNombreArticulo(codigo) {
  const articuloEncontrado = articulos.find(
    (articulo) => articulo.codigo.toLowerCase() === codigo.toLowerCase(),
  )
  return articuloEncontrado ? articuloEncontrado.nombre : 'Artículo inexistente'
}

// --- Lógica de duplicados ---
const codigosDuplicados = computed(() => {
  const conteo = new Map()
  // Contar ocurrencias de cada código
  for (const ubicacion of props.ubicaciones) {
    const codigoNormalizado = normalizarCodigo(ubicacion.codigo)
    conteo.set(codigoNormalizado, (conteo.get(codigoNormalizado) || 0) + 1)
  }

  // Crear Set con códigos que aparecen más de una vez
  const duplicados = new Set()
  for (const [codigo, cantidad] of conteo.entries()) {
    if (cantidad > 1) {
      duplicados.add(codigo)
    }
  }
  return duplicados
})

// --- Conteo de ubicaciones con códigos repetidos ---
const cantidadCodigosRepetidos = computed(
  () =>
    props.ubicaciones.filter((ubicacion) =>
      codigosDuplicados.value.has(normalizarCodigo(ubicacion.codigo)),
    ).length,
)
</script>
