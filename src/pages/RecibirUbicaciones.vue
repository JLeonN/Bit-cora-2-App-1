<template>
  <div class="contenedor-recibir-ubicaciones">
    <h2 class="titulo-recibir-ubicaciones">Ubicaciones compartidas</h2>

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

      <section v-else class="tarjeta-recibir-ubicaciones tarjeta-descarga-recibir">
        <IconFileSpreadsheet :size="28" class="icono-recibir-ubicaciones" />
        <div>
          <h3>Excel base listo</h3>
          <p>Podés descargar el Excel final con las ubicaciones recibidas.</p>
        </div>
        <button
          type="button"
          class="boton-descargar-recibidas"
          :disabled="descargando"
          @click="descargarExcelRecibido"
        >
          <IconLoader2 v-if="descargando" class="icono-cargando" :size="18" />
          <IconDownload v-else :size="18" />
          {{ descargando ? 'Generando...' : 'Descargar Excel' }}
        </button>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { IconAlertCircle, IconDownload, IconFileSpreadsheet, IconLink, IconLoader2 } from '@tabler/icons-vue'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import SelectorExcel from '../components/Logica/Ubicaciones/SelectorExcel.vue'
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

async function descargarExcelRecibido() {
  if (!ubicacionesCompartidas.value || descargando.value) return

  try {
    descargando.value = true
    await generarYGuardarExcelUbicaciones(ubicacionesCompartidas.value.ubicaciones)
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
  max-width: 760px;
  margin: 0 auto;
  padding: 1rem 1rem 6rem;
}
.titulo-recibir-ubicaciones {
  margin: 0 0 1rem;
  color: var(--color-texto-principal);
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
  .contenedor-recibir-ubicaciones {
    padding-right: 0.75rem;
    padding-left: 0.75rem;
  }
  .tarjeta-descarga-recibir {
    align-items: flex-start;
  }
  .boton-descargar-recibidas {
    width: 100%;
    margin-left: 0;
  }
}
</style>
