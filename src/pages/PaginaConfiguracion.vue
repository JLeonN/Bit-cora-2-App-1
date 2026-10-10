<template>
  <div class="pagina-configuracion">
    <div class="contenedor-configuracion">
      <TarjetaSeccion
        titulo="Base de datos para búsqueda"
        :icono="IconDatabase"
        :expandida-por-defecto="baseDatosExpandida"
        descripcion-resumen="Cargá o recargá el Excel con artículos para habilitar búsqueda, validaciones y alertas."
        :ocultar-resumen-al-expandir="true"
        :solicitud-resaltado="solicitudResaltadoBaseDatos"
      >
        <p class="texto-explicacion-base">
          Cargá el archivo Excel de artículos para actualizar la base de búsqueda y validar códigos en tiempo real.
        </p>
        <SelectorExcel
          v-if="baseDatosInicializada"
          :identificador-archivo-compartido="identificadorExcelMaestroCompartido"
          @base-datos-cargada="manejarBaseDatosCargada"
          @base-datos-limpia="manejarBaseDatosLimpia"
          @archivo-compartido-finalizado="finalizarExcelMaestroCompartido"
        />
      </TarjetaSeccion>
      <!-- SECCIÓN: Información Personal -->
      <TarjetaSeccion
        titulo="Información Personal"
        :icono="IconUser"
        :expandida-por-defecto="informacionPersonalExpandida"
      >
        <ConfiguracionUsuario
          ref="configuracionUsuarioRef"
          :solicitud-enfoque-nombre="solicitudEnfoqueNombre"
          @nombre-actualizado="manejarNombreActualizado"
        />
      </TarjetaSeccion>

      <TarjetaSeccion titulo="Memorias de Capitana Bita" :icono="IconBrain">
        <GestionMemoriasCapitanaBita ref="gestionMemoriasRef" />
      </TarjetaSeccion>

      <!-- SECCIÓN: Tutoriales y Ayuda -->
      <TarjetaSeccion
        titulo="Tutoriales y Ayuda"
        :icono="IconBook"
        :expandida-por-defecto="tutorialesExpandidos"
        :solicitud-resaltado="solicitudResaltadoTutoriales"
      >
        <SeccionTutoriales />
      </TarjetaSeccion>
    </div>
  </div>
</template>

<script setup>
import { getCurrentInstance, computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconBook, IconBrain, IconDatabase, IconUser } from '@tabler/icons-vue'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import SelectorExcel from '../components/Logica/Ubicaciones/SelectorExcel.vue'
import ConfiguracionUsuario from '../components/Configuracion/ConfiguracionUsuario.vue'
import GestionMemoriasCapitanaBita from '../components/Configuracion/GestionMemoriasCapitanaBita.vue'
import SeccionTutoriales from '../components/Configuracion/Tutoriales/SeccionTutoriales.vue'
import { inicializarBaseDatos, obtenerEstadoCarga } from '../components/BaseDeDatos/LectorExcel.js'

const instance = getCurrentInstance()
const route = useRoute()
const router = useRouter()

function obtenerValorConsulta(valor) {
  return Array.isArray(valor) ? String(valor[0] || '') : String(valor || '')
}

const baseDatosExpandida = ref(false)
const baseDatosInicializada = ref(false)
const identificadorExcelMaestroCompartido = computed(() => {
  if (route.query.destinoExcel !== 'maestro') return ''
  return obtenerValorConsulta(route.query.archivoCompartido)
})
const solicitudResaltadoBaseDatos = computed(
  () => obtenerValorConsulta(route.query.baseDatos) || identificadorExcelMaestroCompartido.value,
)
const haySolicitudBaseDatos = computed(() => Boolean(solicitudResaltadoBaseDatos.value))

const debeEditarNombre = computed(() => route.query.editarNombre === '1')
const informacionPersonalExpandida = computed(() => debeEditarNombre.value)
const solicitudEnfoqueNombre = computed(() => String(route.query.enfocarNombre || ''))
const tutorialesExpandidos = computed(() => route.query.tutoriales === '1')
const solicitudResaltadoTutoriales = computed(() => String(route.query.tutoriales || ''))
const configuracionUsuarioRef = ref(null)
const gestionMemoriasRef = ref(null)

function manejarBaseDatosCargada(datos) {
  if (!datos?.cargaAutomatica) baseDatosExpandida.value = false
}

function manejarBaseDatosLimpia() {
  baseDatosExpandida.value = true
}

async function finalizarExcelMaestroCompartido({ identificador }) {
  if (!identificador || identificador !== identificadorExcelMaestroCompartido.value) return
  const consulta = { ...route.query }
  delete consulta.destinoExcel
  delete consulta.archivoCompartido
  await router.replace({ path: route.path, query: consulta })
}

watch(solicitudResaltadoBaseDatos, (solicitud) => {
  if (solicitud) baseDatosExpandida.value = true
})

onMounted(async () => {
  await inicializarBaseDatos()
  baseDatosExpandida.value = !obtenerEstadoCarga().cargado || haySolicitudBaseDatos.value
  baseDatosInicializada.value = true
})

// Configurar barra de botones al montar el componente
const configurarBarraBotones = () => {
  const emit = instance?.emit
  if (emit) {
    emit(
      'configurar-barra',
      {
        mostrarAgregar: false,
        mostrarEnviar: false,
        puedeEnviar: false,
        botonesPersonalizados: [],
      },
      {
        onAtrasNativo: cerrarPasoAtrasNativo,
      },
    )
  }
}

function cerrarPasoAtrasNativo() {
  return (
    !!gestionMemoriasRef.value?.cerrarPasoAtrasNativo?.() ||
    !!configuracionUsuarioRef.value?.cerrarPasoAtrasNativo?.()
  )
}

// Manejar actualización de nombre
const manejarNombreActualizado = (nuevoNombre) => {
  console.log('Nombre actualizado:', nuevoNombre)
  // El MainLayout se encarga de actualizar el nombre automáticamente con el polling
}

// Configurar al montar
configurarBarraBotones()
</script>

<style scoped>
.pagina-configuracion {
  min-height: 100vh;
  padding: 20px;
  background: var(--color-fondo);
}
.contenedor-configuracion {
  max-width: 800px;
  margin: 0 auto;
}
.texto-explicacion-base {
  margin: 0 0 1rem;
  color: var(--color-texto-secundario);
}
/* Responsive */
@media (max-width: 600px) {
  .pagina-configuracion {
    padding: 15px;
  }
}
</style>
