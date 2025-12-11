<template>
  <div class="contenedor-tabla">
    <!-- HEADER CON TÍTULO Y SELECTOR DE TAMAÑO -->
    <div class="header-etiquetas">
      <h2 class="titulo-tabla">Etiquetas</h2>

      <p class="texto-info-tamano">Las etiquetas se generan en formato <strong>10x15 cm</strong></p>
    </div>

    <!-- FORMULARIO DE ENTRADA -->
    <FormularioEtiqueta
      @agregar-etiqueta="agregarEtiqueta"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- TABLA DE ARTÍCULOS -->
    <TablaEtiquetas
      :etiquetas="listaEtiquetas"
      @editar-etiqueta="editarEtiqueta"
      @eliminar-etiqueta="eliminarEtiqueta"
      @limpiar-todo="limpiarTodo"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- MODAL ELIMINAR ETIQUETA INDIVIDUAL -->
    <ModalEliminar
      v-if="mostrarModalEliminar"
      :texto="`la etiqueta del artículo ${etiquetaAEliminar?.codigo}`"
      @confirmar="confirmarEliminar"
      @cerrar="cerrarModalEliminar"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />

    <!-- MODAL ELIMINAR TODO -->
    <ModalEliminar
      v-if="mostrarModalLimpiarTodo"
      texto="todas las etiquetas"
      @confirmar="confirmarLimpiarTodo"
      @cerrar="cerrarModalLimpiarTodo"
      @modal-abierto="manejarModalAbierto"
      @modal-cerrado="manejarModalCerrado"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Loading, Notify } from 'quasar'
import FormularioEtiqueta from '../components/Logica/Etiquetas/FormularioEtiqueta.vue'
import TablaEtiquetas from '../components/Logica/Etiquetas/TablaEtiquetas.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import { generarDocumentoEtiquetas } from '../components/Logica/Etiquetas/GeneradorEtiquetasPDF.js'
import { configuracionEtiqueta10x15 } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta10x15.js'
import { configuracionEtiqueta5x10 } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta5x10.js'
import { configuracionEtiqueta2_5x6_7 } from '../components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta2.5x6.7.js'
import { compartirArchivo } from '../components/Logica/Pedidos/CompartirExcel.js'
import {
  guardarEtiquetas,
  obtenerEtiquetas,
  eliminarEtiquetas,
} from '../components/BaseDeDatos/usoAlmacenamientoEtiquetas.js'

// --- ESTADO REACTIVO ---
const tamanoSeleccionado = ref('10x15cm')
const listaEtiquetas = ref([])
const mostrarModalEliminar = ref(false)
const mostrarModalLimpiarTodo = ref(false)
const etiquetaAEliminar = ref(null)
const indiceAEliminar = ref(null)
const generandoDocumento = ref(false)

// Estado para controlar si algún modal está activo
const modalActivo = ref(false)

let intervaloPolling = null

const emit = defineEmits(['configurar-barra'])

// --- FUNCIÓN PARA OBTENER CONFIGURACIÓN SEGÚN TAMAÑO ---
function obtenerConfiguracionPorTamano(tamano) {
  const configuraciones = {
    '10x15cm': configuracionEtiqueta10x15,
    '5x10cm': configuracionEtiqueta5x10,
    '2.5x6.7cm': configuracionEtiqueta2_5x6_7,
  }

  return configuraciones[tamano] || configuracionEtiqueta10x15
}

// --- FUNCIONES DE PERSISTENCIA ---
async function cargarEtiquetasGuardadas() {
  try {
    const etiquetasGuardadas = await obtenerEtiquetas()
    if (etiquetasGuardadas && etiquetasGuardadas.length > 0) {
      listaEtiquetas.value = etiquetasGuardadas
      console.log('[PaginaEtiquetas] Etiquetas cargadas:', etiquetasGuardadas.length)
    }
  } catch (error) {
    console.error('[PaginaEtiquetas] Error cargando etiquetas:', error)
  }
}

async function persistirEtiquetas() {
  try {
    await guardarEtiquetas(listaEtiquetas.value)
    console.log('[PaginaEtiquetas] Etiquetas persistidas:', listaEtiquetas.value.length)
  } catch (error) {
    console.error('[PaginaEtiquetas] Error persistiendo etiquetas:', error)
  }
}

// --- POLLING PARA DETECTAR ETIQUETAS AGREGADAS DESDE UBICACIONES ---
async function verificarNuevasEtiquetas() {
  try {
    const etiquetasActuales = await obtenerEtiquetas()

    if (!etiquetasActuales) return

    // Solo actualizar si la cantidad cambió
    if (etiquetasActuales.length !== listaEtiquetas.value.length) {
      listaEtiquetas.value = etiquetasActuales
      console.log(
        '[PaginaEtiquetas] Etiquetas actualizadas desde almacenamiento:',
        etiquetasActuales.length,
      )
    }
  } catch (error) {
    console.error('[PaginaEtiquetas] Error en polling:', error)
  }
}

// --- FUNCIONES ---
function agregarEtiqueta(etiqueta) {
  const etiquetaConId = {
    ...etiqueta,
    id: Date.now(),
  }

  listaEtiquetas.value.push(etiquetaConId)
  console.log('[PaginaEtiquetas] Etiqueta agregada:', etiquetaConId)

  persistirEtiquetas()
}

function editarEtiqueta(etiquetaEditada) {
  const indice = listaEtiquetas.value.findIndex((e) => e.id === etiquetaEditada.id)
  if (indice !== -1) {
    listaEtiquetas.value[indice] = etiquetaEditada
    console.log('[PaginaEtiquetas] Etiqueta editada:', etiquetaEditada)

    persistirEtiquetas()
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

  persistirEtiquetas()

  cerrarModalEliminar()
}

function cerrarModalEliminar() {
  mostrarModalEliminar.value = false
  etiquetaAEliminar.value = null
  indiceAEliminar.value = null
}

function limpiarTodo() {
  if (listaEtiquetas.value.length === 0) return
  mostrarModalLimpiarTodo.value = true
}

async function confirmarLimpiarTodo() {
  listaEtiquetas.value = []
  console.log('[PaginaEtiquetas] Lista de etiquetas limpiada')

  await eliminarEtiquetas()

  cerrarModalLimpiarTodo()
}

function cerrarModalLimpiarTodo() {
  mostrarModalLimpiarTodo.value = false
}

async function generarPDF() {
  if (listaEtiquetas.value.length === 0) return

  try {
    generandoDocumento.value = true

    Loading.show({
      message: 'Generando documento PDF...',
      spinnerColor: 'primary',
    })

    console.log('🔍 Tamaño seleccionado:', tamanoSeleccionado.value)
    console.log('[PaginaEtiquetas] Generando PDF con', listaEtiquetas.value.length, 'etiquetas')

    const configuracion = obtenerConfiguracionPorTamano(tamanoSeleccionado.value)

    console.log('📐 Configuración usada:', configuracion.nombre)
    console.log('📏 Dimensiones:', configuracion.pagina)

    const resultado = await generarDocumentoEtiquetas(listaEtiquetas.value, configuracion)

    Loading.hide()

    if (!resultado.exito) {
      throw new Error(resultado.mensaje)
    }

    console.log('[PaginaEtiquetas] ✅ Documento generado:', resultado.rutaArchivo)

    const compartido = await compartirArchivo(resultado.rutaArchivo, resultado.nombreArchivo)

    if (compartido) {
      Notify.create({
        type: 'positive',
        message: '✅ Documento generado y compartido correctamente',
        position: 'top',
        timeout: 2000,
      })
    }
  } catch (error) {
    console.error('[PaginaEtiquetas] ❌ Error generando PDF:', error)
    Loading.hide()
    Notify.create({
      type: 'negative',
      message: `❌ Error: ${error.message}`,
      position: 'top',
      timeout: 3000,
    })
  } finally {
    generandoDocumento.value = false
  }
}

const configuracionBarra = computed(() => ({
  mostrarAtras: true,
  mostrarInicio: true,
  mostrarAgregar: false,
  mostrarEnviar: listaEtiquetas.value.length > 0,
  puedeEnviar: listaEtiquetas.value.length > 0,
  botonesPersonalizados: [],
  modalActivo: modalActivo.value,
}))

const metodosParaBarra = {
  onEnviar: () => generarPDF(),
  onAgregar: () => {},
  onAccionPersonalizada: () => {},
}

// Métodos para manejar el estado del modal
const manejarModalAbierto = () => {
  modalActivo.value = true
}

const manejarModalCerrado = () => {
  modalActivo.value = false
}

// --- LIFECYCLE ---
onMounted(async () => {
  await cargarEtiquetasGuardadas()

  emit('configurar-barra', configuracionBarra.value, metodosParaBarra)

  // Iniciar polling cada 2 segundos
  intervaloPolling = setInterval(() => {
    verificarNuevasEtiquetas()
  }, 2000)

  console.log('[PaginaEtiquetas] Polling iniciado')
})

onUnmounted(() => {
  // Limpiar polling
  if (intervaloPolling) {
    clearInterval(intervaloPolling)
    console.log('[PaginaEtiquetas] Polling detenido')
  }

  emit(
    'configurar-barra',
    {
      mostrarAtras: false,
      mostrarInicio: false,
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
      modalActivo: false,
    },
    null,
  )
})

watch(
  () => listaEtiquetas.value.length,
  () => {
    emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
  },
  { deep: true },
)

// Watcher para actualizar cuando cambia el estado del modal
watch(
  () => modalActivo.value,
  () => {
    emit('configurar-barra', configuracionBarra.value, metodosParaBarra)
  },
)
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
  font-size: 2rem;
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
  flex-wrap: wrap;
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
@media (max-width: 600px) {
  .contenedor-tabla {
    padding: 0.75rem;
  }
  .header-etiquetas {
    padding: 1rem;
  }
  .titulo-tabla {
    font-size: 1.5rem;
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
.texto-info-tamano {
  text-align: center;
  color: var(--color-texto-secundario);
  font-size: 0.95rem;
  margin: 0;
  padding: 0.5rem;
  background: var(--color-fondo);
  border-radius: 6px;
}
.texto-info-tamano strong {
  color: var(--color-primario);
  font-weight: 600;
}
</style>
