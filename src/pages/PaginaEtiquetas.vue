<template>
  <div class="contenedor-tabla">
    <!-- HEADER CON TÍTULO Y SELECTOR DE TAMAÑO -->
    <div class="header-etiquetas">
      <h2 class="titulo-tabla">Etiquetas</h2>

      <div class="selector-tamano">
        <span class="label-tamano">Tamaño:</span>
        <label class="opcion-tamano">
          <input type="radio" name="tamano" value="chico" v-model="tamanoSeleccionado" />
          <span>Chico</span>
        </label>
        <label class="opcion-tamano">
          <input type="radio" name="tamano" value="mediano" v-model="tamanoSeleccionado" />
          <span>Mediano</span>
        </label>
        <label class="opcion-tamano">
          <input type="radio" name="tamano" value="grande" v-model="tamanoSeleccionado" checked />
          <span>Grande</span>
        </label>
      </div>
    </div>

    <!-- FORMULARIO DE ENTRADA -->
    <FormularioEtiqueta @agregar-etiqueta="agregarEtiqueta" />

    <!-- TABLA DE ARTÍCULOS -->
    <TablaEtiquetas
      :etiquetas="listaEtiquetas"
      @editar-etiqueta="editarEtiqueta"
      @eliminar-etiqueta="eliminarEtiqueta"
    />

    <!-- BARRA INFERIOR DE BOTONES -->
    <BarraBotonesInferior
      :mostrar-atras="true"
      :mostrar-agregar="false"
      :mostrar-enviar="false"
      :botones-personalizados="botonesPersonalizados"
      @atras="volverAtras"
      @boton-personalizado="manejarBotonPersonalizado"
    />

    <!-- MODAL ELIMINAR -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="`la etiqueta del artículo ${etiquetaAEliminar?.codigo}`"
      @confirmar="confirmarEliminar"
      @cerrar="cerrarModalEliminar"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import FormularioEtiqueta from '../components/Logica/Etiquetas/FormularioEtiqueta.vue'
import TablaEtiquetas from '../components/Logica/Etiquetas/TablaEtiquetas.vue'
import BarraBotonesInferior from '../components/Botones/BarraBotonesInferior.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'

const router = useRouter()

// --- ESTADO REACTIVO ---
const tamanoSeleccionado = ref('grande')
const listaEtiquetas = ref([])
const mostrarModalEliminar = ref(false)
const etiquetaAEliminar = ref(null)
const indiceAEliminar = ref(null)

// --- BOTONES PERSONALIZADOS ---
const botonesPersonalizados = computed(() => [
  {
    id: 'limpiar',
    icono: 'IconTrash',
    texto: 'Limpiar todo',
    color: 'rojo',
    deshabilitado: listaEtiquetas.value.length === 0,
  },
  {
    id: 'generar',
    icono: 'IconFileText',
    texto: 'Generar Word',
    color: 'verde',
    deshabilitado: listaEtiquetas.value.length === 0,
  },
])

// --- FUNCIONES ---
function agregarEtiqueta(etiqueta) {
  // Agregar el tamaño seleccionado a la etiqueta
  const etiquetaConTamano = {
    ...etiqueta,
    tamano: tamanoSeleccionado.value,
    id: Date.now(), // ID único para manipular después
  }

  listaEtiquetas.value.push(etiquetaConTamano)
  console.log('[PaginaEtiquetas] Etiqueta agregada:', etiquetaConTamano)
}

function editarEtiqueta(etiquetaEditada) {
  const indice = listaEtiquetas.value.findIndex((e) => e.id === etiquetaEditada.id)
  if (indice !== -1) {
    listaEtiquetas.value[indice] = etiquetaEditada
    console.log('[PaginaEtiquetas] Etiqueta editada:', etiquetaEditada)
  }
}

function eliminarEtiqueta(indice) {
  etiquetaAEliminar.value = listaEtiquetas.value[indice]
  indiceAEliminar.value = indice
  mostrarModalEliminar.value = true
}

function confirmarEliminar() {
  listaEtiquetas.value.splice(indiceAEliminar.value, 1)
  console.log('[PaginaEtiquetas] Etiqueta eliminada')
  cerrarModalEliminar()
}

function cerrarModalEliminar() {
  mostrarModalEliminar.value = false
  etiquetaAEliminar.value = null
  indiceAEliminar.value = null
}

function limpiarTodo() {
  if (listaEtiquetas.value.length === 0) return

  if (confirm('¿Estás seguro de que querés limpiar todas las etiquetas?')) {
    listaEtiquetas.value = []
    console.log('[PaginaEtiquetas] Lista de etiquetas limpiada')
  }
}

function generarWord() {
  console.log('[PaginaEtiquetas] Generando Word con:', listaEtiquetas.value.length, 'etiquetas')
  console.log('Tamaño seleccionado:', tamanoSeleccionado.value)
  // TODO: Implementar generación de Word
  alert('Función de generar Word - Próximamente')
}

function manejarBotonPersonalizado(idBoton) {
  if (idBoton === 'limpiar') {
    limpiarTodo()
  } else if (idBoton === 'generar') {
    generarWord()
  }
}

function volverAtras() {
  router.push('/')
}

// --- LIFECYCLE ---
onMounted(() => {
  console.log('[PaginaEtiquetas] Componente montado')
})

onUnmounted(() => {
  console.log('[PaginaEtiquetas] Componente desmontado')
})
</script>

<style scoped>
.contenedor-tabla {
  padding: 1rem;
  padding-bottom: 120px;
}
.header-etiquetas {
  background-color: var(--color-superficie);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-borde);
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.titulo-tabla {
  text-align: center;
  color: var(--color-primario);
  font-size: 3rem;
  font-weight: bold;
  margin: 0;
}
.selector-tamano {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 0.75rem;
  background: var(--color-fondo);
  border-radius: 8px;
  border: 1px solid var(--color-borde);
}
.label-tamano {
  font-weight: 600;
  color: var(--color-texto-secundario);
  font-size: 0.95rem;
}
.opcion-tamano {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  transition: background 0.2s ease;
}
.opcion-tamano:hover {
  background: var(--color-superficie);
}
.opcion-tamano input[type='radio'] {
  cursor: pointer;
  accent-color: var(--color-primario);
  width: 18px;
  height: 18px;
}
.opcion-tamano span {
  font-size: 0.95rem;
  color: var(--color-texto-principal);
  font-weight: 500;
}
/* Responsive */
@media (max-width: 600px) {
  .contenedor-tabla {
    padding: 0.75rem;
  }
  .header-etiquetas {
    padding: 1rem;
  }
  .selector-tamano {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }
  .label-tamano {
    font-size: 0.9rem;
  }
  .opcion-tamano {
    width: 100%;
    justify-content: center;
    padding: 0.6rem 1rem;
  }
}
@media (max-width: 900px) and (min-width: 601px) {
  .titulo-tabla {
    font-size: 1.8rem;
  }
}
</style>
