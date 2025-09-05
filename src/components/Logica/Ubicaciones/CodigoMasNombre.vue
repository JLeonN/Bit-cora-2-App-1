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
const maximosResultados = 5

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
  const resultados = []

  // 1. Códigos que empiecen con la búsqueda (PRIORIDAD MÁXIMA)
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

  // Combinar resultados por orden de prioridad
  resultados.push(...codigosEmpiezan)
  resultados.push(...nombresEmpiezan)
  resultados.push(...codigosContienen)
  resultados.push(...nombresContienen)

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

  const regex = new RegExp(`(${busqueda})`, 'gi')
  return texto.replace(regex, '<span class="texto-resaltado">$1</span>')
}
</script>

<style scoped>
/* --- CONTENEDOR PRINCIPAL --- */
.contenedor-buscador {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  margin-top: 4px;
}

/* --- LISTA DE RESULTADOS --- */
.lista-resultados {
  background-color: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 100%;
  overflow: hidden;
  animation: aparecerTarjeta 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 300px;
  overflow-y: auto;
}

/* --- ITEMS DE RESULTADO --- */
.item-resultado {
  padding: 14px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-borde);
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-resultado:hover {
  background-color: var(--color-fondo);
  transform: translateX(4px);
}

.item-resultado:last-child {
  border-bottom: none;
}

.item-resultado:active {
  transform: scale(0.98) translateX(4px);
  background-color: var(--color-primario-oscuro);
}

/* --- TEXTOS DE RESULTADO --- */
.codigo-resultado {
  font-size: 0.95rem;
  color: var(--color-primario-claro);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.nombre-resultado {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  line-height: 1.4;
}

/* --- SIN RESULTADOS --- */
.sin-resultados {
  background-color: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 100%;
  animation: aparecerTarjeta 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.texto-sin-resultados {
  padding: 18px 16px;
  text-align: center;
  color: var(--color-error);
  font-size: 0.9rem;
  font-weight: 500;
  font-style: italic;
}

/* --- TEXTO RESALTADO --- */
.texto-resaltado {
  background-color: var(--color-primario);
  color: var(--color-texto-principal);
  font-weight: bold;
  border-radius: 4px;
  padding: 2px 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

/* --- ANIMACIONES --- */
@keyframes aparecerTarjeta {
  0% {
    opacity: 0;
    transform: translateY(-15px) scale(0.9);
    filter: blur(2px);
  }
  50% {
    opacity: 0.7;
    transform: translateY(-5px) scale(0.95);
    filter: blur(1px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* --- SCROLLBAR PERSONALIZADA --- */
.lista-resultados::-webkit-scrollbar {
  width: 6px;
}

.lista-resultados::-webkit-scrollbar-track {
  background: var(--color-fondo);
  border-radius: 3px;
}

.lista-resultados::-webkit-scrollbar-thumb {
  background: var(--color-borde);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.lista-resultados::-webkit-scrollbar-thumb:hover {
  background: var(--color-texto-secundario);
}

/* --- RESPONSIVE --- */
@media (max-width: 600px) {
  .contenedor-buscador {
    margin-top: 2px;
  }

  .item-resultado {
    padding: 12px 14px;
  }

  .codigo-resultado {
    font-size: 0.9rem;
  }

  .nombre-resultado {
    font-size: 0.8rem;
  }

  .lista-resultados {
    border-radius: 8px;
    max-height: 250px;
  }

  .item-resultado:hover {
    transform: translateX(2px);
  }
}

@media (max-width: 400px) {
  .item-resultado {
    padding: 10px 12px;
    gap: 2px;
  }

  .texto-sin-resultados {
    padding: 16px 12px;
    font-size: 0.85rem;
  }
}
</style>
