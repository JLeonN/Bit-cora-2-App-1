<template>
  <div class="contenedor-buscador" v-if="mostrarLista">
    <div class="lista-resultados" v-if="resultadosBusqueda.length > 0">
      <div
        v-for="(articulo, indice) in resultadosBusqueda"
        :key="indice"
        class="item-resultado"
        @click="seleccionarArticulo(articulo)"
      >
        <div
          class="codigo-resultado"
          v-html="resaltarCoincidencia(articulo.codigo, busqueda)"
        ></div>
        <div
          class="nombre-resultado"
          v-html="resaltarCoincidencia(articulo.nombre, busqueda)"
        ></div>
      </div>
    </div>

    <div v-else-if="busqueda.length >= caracteresMinimos" class="sin-resultados">
      <div class="texto-sin-resultados">No se encontraron artículos</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { articulos } from '../../BaseDeDatos/CodigosArticulos.js'

// Props
const props = defineProps({
  busqueda: {
    type: String,
    default: '',
  },
})

// Emits
const emit = defineEmits(['articulo-seleccionado'])

// Variables reactivas
const caracteresMinimos = 2
const maximosResultados = 5

// Computed
const mostrarLista = computed(() => {
  return props.busqueda.length >= caracteresMinimos
})

const resultadosBusqueda = computed(() => {
  if (props.busqueda.length < caracteresMinimos) {
    return []
  }

  const terminoBusqueda = props.busqueda.toLowerCase().trim()
  const resultados = []

  // 1. Códigos que empiecen con la búsqueda
  const codigosEmpiezan = articulos.filter((articulo) =>
    articulo.codigo.toLowerCase().startsWith(terminoBusqueda),
  )

  // 2. Nombres que empiecen con la búsqueda
  const nombresEmpiezan = articulos.filter(
    (articulo) =>
      articulo.nombre.toLowerCase().startsWith(terminoBusqueda) &&
      !codigosEmpiezan.includes(articulo),
  )

  // 3. Códigos que contengan la búsqueda (pero no empiecen)
  const codigosContienen = articulos.filter(
    (articulo) =>
      articulo.codigo.toLowerCase().includes(terminoBusqueda) &&
      !articulo.codigo.toLowerCase().startsWith(terminoBusqueda) &&
      !codigosEmpiezan.includes(articulo) &&
      !nombresEmpiezan.includes(articulo),
  )

  // 4. Nombres que contengan la búsqueda (pero no empiecen)
  const nombresContienen = articulos.filter(
    (articulo) =>
      articulo.nombre.toLowerCase().includes(terminoBusqueda) &&
      !articulo.nombre.toLowerCase().startsWith(terminoBusqueda) &&
      !codigosEmpiezan.includes(articulo) &&
      !nombresEmpiezan.includes(articulo) &&
      !codigosContienen.includes(articulo),
  )

  // Combinar resultados por prioridad
  resultados.push(...codigosEmpiezan)
  resultados.push(...nombresEmpiezan)
  resultados.push(...codigosContienen)
  resultados.push(...nombresContienen)

  return resultados.slice(0, maximosResultados)
})

// Métodos
function seleccionarArticulo(articulo) {
  emit('articulo-seleccionado', articulo)
}

function resaltarCoincidencia(texto, busqueda) {
  if (!busqueda || busqueda.length < caracteresMinimos) {
    return texto
  }

  const regex = new RegExp(`(${busqueda})`, 'gi')
  return texto.replace(regex, '<span class="texto-resaltado">$1</span>')
}
</script>

<style scoped>
.contenedor-buscador {
  position: relative;
  z-index: 100;
}

.lista-resultados {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  max-height: 300px;
  overflow-y: auto;
  z-index: 101;
}

.item-resultado {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-borde);
  transition: background-color 0.2s ease;
}

.item-resultado:hover {
  background-color: var(--color-fondo);
}

.item-resultado:last-child {
  border-bottom: none;
}

.codigo-resultado {
  font-size: 0.9rem;
  color: var(--color-primario-claro);
  font-weight: 600;
  margin-bottom: 4px;
}

.nombre-resultado {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  line-height: 1.3;
}

.sin-resultados {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 101;
}

.texto-sin-resultados {
  padding: 16px;
  text-align: center;
  color: var(--color-texto-secundario);
  font-size: 0.9rem;
}

.texto-resaltado {
  background-color: var(--color-primario);
  color: var(--color-texto-principal);
  font-weight: bold;
  border-radius: 3px;
  padding: 1px 3px;
}

/* Scrollbar personalizada para la lista */
.lista-resultados::-webkit-scrollbar {
  width: 6px;
}

.lista-resultados::-webkit-scrollbar-track {
  background: var(--color-fondo);
}

.lista-resultados::-webkit-scrollbar-thumb {
  background: var(--color-borde);
  border-radius: 3px;
}

.lista-resultados::-webkit-scrollbar-thumb:hover {
  background: var(--color-texto-secundario);
}
</style>
