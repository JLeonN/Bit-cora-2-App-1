<template>
  <button
    v-if="estadoInicializado && !baseDatosCargada"
    type="button"
    class="boton-base-datos-faltante"
    title="Cargar Excel maestro en Configuración"
    aria-label="Cargar Excel maestro en Configuración"
    @click="abrirConfiguracion"
  >
    <IconDatabase :size="20" :stroke="2" aria-hidden="true" />
  </button>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconDatabase } from '@tabler/icons-vue'
import { inicializarBaseDatos, obtenerEstadoCarga } from '../../BaseDeDatos/LectorExcel.js'

const route = useRoute()
const router = useRouter()
const baseDatosCargada = ref(false)
const estadoInicializado = ref(false)
let intervaloBaseDatos = null
let componenteActivo = true
let contadorSolicitudBaseDatos = 0

function actualizarEstadoBase() {
  baseDatosCargada.value = obtenerEstadoCarga().cargado
}

function obtenerValorConsulta(valor) {
  return Array.isArray(valor) ? String(valor[0] || '') : String(valor || '')
}

function abrirConfiguracion() {
  contadorSolicitudBaseDatos += 1
  const consulta = { baseDatos: `${Date.now()}${contadorSolicitudBaseDatos}` }
  const identificador = obtenerValorConsulta(route.query.archivoCompartido)
  if (route.path === '/listados' && route.query.destinoExcel === 'listado' && identificador) {
    consulta.destinoExcel = 'listado'
    consulta.archivoCompartido = identificador
  }
  void router.push({ path: '/configuracion', query: consulta })
}

onMounted(async () => {
  await inicializarBaseDatos()
  if (!componenteActivo) return
  actualizarEstadoBase()
  estadoInicializado.value = true
  intervaloBaseDatos = setInterval(actualizarEstadoBase, 1000)
})

onUnmounted(() => {
  componenteActivo = false
  if (intervaloBaseDatos) clearInterval(intervaloBaseDatos)
})
</script>
