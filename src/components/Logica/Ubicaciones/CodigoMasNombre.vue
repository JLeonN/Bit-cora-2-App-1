<template>
  <div class="contenedor-buscador" v-if="mostrarLista">
    <div class="lista-resultados" v-if="resultadosBusqueda.length > 0">
      <div
        v-for="(articulo, indice) in resultadosBusqueda"
        :key="indice"
        class="item-resultado"
        @click="seleccionarArticulo(articulo)"
      >
        <!-- Nombre primero -->
        <div
          class="nombre-resultado"
          v-html="resaltarCoincidencia(articulo.nombre, busqueda)"
        ></div>
        <!-- Código después -->
        <div
          class="codigo-resultado"
          v-html="resaltarCoincidencia(articulo.codigo, busqueda)"
        ></div>
      </div>
    </div>

    <div v-else-if="busqueda.length >= caracteresMinimos" class="sin-resultados">
      <div class="texto-sin-resultados">Artículo inexistente</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { articulos } from '../../BaseDeDatos/CodigosArticulos.js'

// --- PROPS ---
const props = defineProps({
  busqueda: {
    type: String,
    default: '',
  },
})

// --- EMITS ---
const emit = defineEmits(['articulo-seleccionado'])

// --- CONFIGURACIÓN DEL BUSCADOR ---
const caracteresMinimos = 3
const maximosResultados = 3

// --- COMPUTED PARA MOSTRAR/OCULTAR LISTA ---
const mostrarLista = computed(() => {
  return props.busqueda.length >= caracteresMinimos
})

// --- COMPUTED PARA RESULTADOS DE BÚSQUEDA ---
const resultadosBusqueda = computed(() => {
  if (props.busqueda.length < caracteresMinimos) {
    return []
  }

  const terminoBusqueda = props.busqueda.toLowerCase().trim()
  const palabras = terminoBusqueda.split(/\s+/) // dividir en palabras
  const resultados = []

  // 1. Códigos que empiecen con la búsqueda (PRIORIDAD MÁXIMA)
  const codigosEmpiezan = articulos.filter((articulo) =>
    articulo.codigo.toLowerCase().startsWith(terminoBusqueda),
  )

  // 2. Nombres que contengan todas las palabras en cualquier orden
  const nombresCoinciden = articulos.filter((articulo) => {
    const nombre = articulo.nombre.toLowerCase()
    return palabras.every((palabra) => nombre.includes(palabra))
  })

  // 3. Códigos que contengan la búsqueda (pero no empiecen)
  const codigosContienen = articulos.filter(
    (articulo) =>
      articulo.codigo.toLowerCase().includes(terminoBusqueda) &&
      !codigosEmpiezan.includes(articulo),
  )

  // Combinar resultados
  resultados.push(...codigosEmpiezan)
  resultados.push(...nombresCoinciden)
  resultados.push(...codigosContienen)

  return resultados.slice(0, maximosResultados)
})

// --- FUNCIONES ---
function seleccionarArticulo(articulo) {
  emit('articulo-seleccionado', articulo)
}

function resaltarCoincidencia(texto, busqueda) {
  if (!busqueda || busqueda.length < caracteresMinimos) {
    return texto
  }

  const palabras = busqueda.trim().split(/\s+/).filter(Boolean)
  let textoResaltado = texto

  // resaltar cada palabra por separado
  palabras.forEach((palabra) => {
    const regex = new RegExp(`(${palabra})`, 'gi')
    textoResaltado = textoResaltado.replace(regex, '<span class="texto-resaltado">$1</span>')
  })

  return textoResaltado
}
</script>
