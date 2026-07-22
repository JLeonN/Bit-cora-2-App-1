<template>
  <div class="contenedor-tabla contenedor-recibir-ubicaciones">
    <h2 class="titulo-tabla">Ubicaciones compartidas</h2>

    <div v-if="cargando" class="tarjeta-recibir-ubicaciones">
      <IconLoader2 class="icono-cargando" :size="28" />
      <p>Buscando las ubicaciones compartidas...</p>
    </div>

    <div v-else-if="mensajeError" class="tarjeta-recibir-ubicaciones tarjeta-error-recibir">
      <IconAlertCircle :size="28" />
      <p>{{ mensajeError }}</p>
    </div>

    <template v-else-if="ubicacionesCompartidas">
      <section class="tarjeta-recibir-ubicaciones">
        <IconLink :size="28" class="icono-recibir-ubicaciones" />
        <div>
          <h3>Lista recibida</h3>
          <p><strong>Usuario:</strong> {{ ubicacionesCompartidas.usuario }}</p>
          <p><strong>Ubicaciones:</strong> {{ ubicacionesCompartidas.cantidadUbicaciones }}</p>
          <p v-if="fechaFormateada"><strong>Compartida:</strong> {{ fechaFormateada }}</p>
        </div>
      </section>

      <TarjetaSeccion
        v-if="!baseDatosLista"
        titulo="Cargá tu Excel base"
        :expandida-por-defecto="true"
        descripcion-resumen="Necesitás tu Excel base para completar y descargar el archivo final."
        :ocultar-resumen-al-expandir="true"
      >
        <p class="texto-explicacion-recibir">
          El enlace trae los códigos y las nuevas ubicaciones. Tu Excel base completa la descripción,
          la ubicación anterior y el historial antes de descargar.
        </p>
        <SelectorExcel @base-datos-cargada="manejarBaseDatosCargada" @error-carga="manejarErrorCarga" />
        <p v-if="mensajeErrorBase" class="texto-error-base">{{ mensajeErrorBase }}</p>
      </TarjetaSeccion>

      <template v-else>
        <InformacionUbicaciones :ubicaciones="ubicacionesEditables" />

        <div class="bloque-buscador-recibidas">
          <IconSearch :size="20" class="icono-buscador-recibidas" />
          <input
            v-model="textoBusqueda"
            type="search"
            class="input-buscador-recibidas"
            placeholder="Buscar por código o nombre"
            aria-label="Buscar artículo recibido"
          />
        </div>

        <TablaUbicaciones
          :ubicaciones="ubicacionesEditables"
          :texto-busqueda="textoBusqueda"
          :mostrar-etiquetas="false"
          :mostrar-eliminar-todas="false"
          @abrirModalEditar="abrirModalEditar"
          @abrirModalEliminar="abrirModalEliminar"
        />

        <section class="tarjeta-recibir-ubicaciones tarjeta-descarga-recibir">
          <IconFileSpreadsheet :size="28" class="icono-recibir-ubicaciones" />
          <div>
            <h3>Excel final</h3>
            <p>Los cambios de esta tabla se incluirán en la descarga.</p>
          </div>
          <button
            type="button"
            class="boton-descargar-recibidas"
            :disabled="descargando || ubicacionesEditables.length === 0"
            @click="descargarExcelRecibido"
          >
            <IconLoader2 v-if="descargando" class="icono-cargando" :size="18" />
            <IconDownload v-else :size="18" />
            {{ descargando ? 'Generando...' : 'Descargar Excel' }}
          </button>
        </section>
      </template>

      <ModalEditarUbicacion
        v-if="indiceUbicacionEditar !== null"
        :codigo="ubicacionEditar?.codigo"
        :ubicacion="ubicacionEditar?.ubicacion"
        @guardar="guardarEdicion"
        @cerrar="cerrarModalEditar"
      />

      <ModalEliminar
        v-if="indiceUbicacionEliminar !== null"
        :texto="ubicacionEliminar?.codigo"
        @confirmar="confirmarEliminacion"
        @cerrar="cerrarModalEliminar"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  IconAlertCircle,
  IconDownload,
  IconFileSpreadsheet,
  IconLink,
  IconLoader2,
  IconSearch,
} from '@tabler/icons-vue'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import SelectorExcel from '../components/Logica/Ubicaciones/SelectorExcel.vue'
import InformacionUbicaciones from '../components/Logica/Ubicaciones/InformacionUbicaciones.vue'
import TablaUbicaciones from '../components/Logica/Ubicaciones/TablaUbicaciones.vue'
import ModalEditarUbicacion from '../components/Modales/ModalEditarUbicacion.vue'
import ModalEliminar from '../components/Modales/ModalEliminar.vue'
import { generarYGuardarExcelUbicaciones } from '../components/Logica/Ubicaciones/ExportarUbicacionesExcel.js'
import { obtenerEstadoCarga, inicializarBaseDatos } from '../components/BaseDeDatos/LectorExcel.js'
import { obtenerUbicacionesCompartidas } from '../components/Logica/Ubicaciones/ServicioCompartirUbicacionesFirestore.js'

const emit = defineEmits(['configurar-barra'])
const route = useRoute()
const cargando = ref(true)
const descargando = ref(false)
const mensajeError = ref('')
const mensajeErrorBase = ref('')
const ubicacionesCompartidas = ref(null)
const baseDatosLista = ref(false)
const ubicacionesEditables = ref([])
const textoBusqueda = ref('')
const indiceUbicacionEditar = ref(null)
const indiceUbicacionEliminar = ref(null)

const ubicacionEditar = computed(() => ubicacionesEditables.value[indiceUbicacionEditar.value] || null)
const ubicacionEliminar = computed(
  () => ubicacionesEditables.value[indiceUbicacionEliminar.value] || null,
)

const fechaFormateada = computed(() => {
  if (!ubicacionesCompartidas.value?.fechaCreacion) return ''
  const fecha = new Date(ubicacionesCompartidas.value.fechaCreacion)
  if (Number.isNaN(fecha.getTime())) return ''
  return new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha)
})

function actualizarBaseDatosLista() {
  baseDatosLista.value = obtenerEstadoCarga().cargado
}

function configurarBarra() {
  emit(
    'configurar-barra',
    {
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
      modalActivo: false,
    },
    null,
  )
}

function manejarBaseDatosCargada() {
  mensajeErrorBase.value = ''
  actualizarBaseDatosLista()
}

function manejarErrorCarga(mensaje) {
  mensajeErrorBase.value = mensaje || 'No se pudo cargar el Excel base.'
}

function abrirModalEditar(indice) {
  indiceUbicacionEditar.value = indice
}

function cerrarModalEditar() {
  indiceUbicacionEditar.value = null
}

function guardarEdicion({ codigo, ubicacion }) {
  const indice = indiceUbicacionEditar.value
  if (indice === null || !ubicacionesEditables.value[indice]) return
  ubicacionesEditables.value[indice] = {
    ...ubicacionesEditables.value[indice],
    codigo: String(codigo || '').trim(),
    ubicacion: String(ubicacion || '').trim(),
  }
  cerrarModalEditar()
}

function abrirModalEliminar(indice) {
  indiceUbicacionEliminar.value = indice
}

function cerrarModalEliminar() {
  indiceUbicacionEliminar.value = null
}

function confirmarEliminacion() {
  const indice = indiceUbicacionEliminar.value
  if (indice !== null) ubicacionesEditables.value.splice(indice, 1)
  cerrarModalEliminar()
}

async function descargarExcelRecibido() {
  if (!ubicacionesCompartidas.value || descargando.value) return

  try {
    descargando.value = true
    await generarYGuardarExcelUbicaciones(ubicacionesEditables.value)
  } catch (error) {
    mensajeError.value = `No se pudo generar el Excel: ${error.message}`
  } finally {
    descargando.value = false
  }
}

onMounted(async () => {
  configurarBarra()
  try {
    await inicializarBaseDatos()
    actualizarBaseDatosLista()
    ubicacionesCompartidas.value = await obtenerUbicacionesCompartidas(route.query.id)
    ubicacionesEditables.value = Array.isArray(ubicacionesCompartidas.value?.ubicaciones)
      ? ubicacionesCompartidas.value.ubicaciones.map((ubicacion) => ({ ...ubicacion }))
      : []
  } catch (error) {
    mensajeError.value = error.message || 'No se pudieron cargar las ubicaciones compartidas.'
  } finally {
    cargando.value = false
  }
})

onUnmounted(configurarBarra)
</script>

<style scoped>
.contenedor-recibir-ubicaciones {
  margin-bottom: 6rem;
}
.tarjeta-recibir-ubicaciones {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-borde);
  border-radius: 10px;
  background-color: var(--color-superficie);
  color: var(--color-texto-secundario);
}
.tarjeta-recibir-ubicaciones h3,
.tarjeta-recibir-ubicaciones p {
  margin: 0;
}
.tarjeta-recibir-ubicaciones p + p {
  margin-top: 0.35rem;
}
.icono-recibir-ubicaciones {
  color: var(--color-acento);
  flex-shrink: 0;
}
.tarjeta-error-recibir {
  color: var(--color-error);
}
.texto-explicacion-recibir {
  margin: 0 0 0.9rem;
  color: var(--color-texto-secundario);
}
.texto-error-base {
  margin: 0.75rem 0 0;
  color: var(--color-error);
}
.tarjeta-descarga-recibir {
  flex-wrap: wrap;
}
.bloque-buscador-recibidas {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 1rem 0;
  padding: 0.7rem 0.85rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background-color: var(--color-fondo);
}
.icono-buscador-recibidas {
  color: var(--color-acento);
  flex-shrink: 0;
}
.input-buscador-recibidas {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--color-texto-principal);
  font: inherit;
}
.input-buscador-recibidas::placeholder {
  color: var(--color-texto-secundario);
}
.boton-descargar-recibidas {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 42px;
  margin-left: auto;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-borde);
  border-radius: 8px;
  background: transparent;
  color: var(--color-texto-principal);
  cursor: pointer;
}
.boton-descargar-recibidas:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.icono-cargando {
  animation: girar 1s linear infinite;
}
@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 480px) {
  .tarjeta-descarga-recibir {
    align-items: flex-start;
  }
  .boton-descargar-recibidas {
    width: 100%;
    margin-left: 0;
  }
}
</style>
