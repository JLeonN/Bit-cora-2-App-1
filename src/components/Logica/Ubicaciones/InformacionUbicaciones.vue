<template>
  <div v-if="ubicacionesValidas.length > 0" class="bloque-informacion-ubicaciones">
    <TarjetaSeccion
      titulo="Información"
      :expandida-por-defecto="informacionExpandida"
      descripcion-resumen="Resumen rápido de cantidades y alertas de artículos."
      :ocultar-resumen-al-expandir="true"
      @cambio-expansion="manejarCambioExpansionInformacion"
    >
      <p class="texto-info-completa">
        Revisá aquí los totales y alertas. Si aparece un artículo inexistente o un código repetido,
        esta sección se abre automáticamente para que no se te pase.
      </p>
      <div class="tarjeta-resumen-etiquetas">
        <div class="resumen-etiquetas-contenido">
          <p class="texto-secundario linea-resumen">
            Ubicaciones totales: {{ ubicacionesValidas.length }}
          </p>
          <p
            v-if="cantidadCodigosRepetidos > 0"
            class="texto-secundario texto-repetidos linea-resumen"
          >
            Códigos repetidos: {{ cantidadCodigosRepetidos }}
          </p>
          <p
            v-if="cantidadArticulosInexistentes > 0"
            class="texto-secundario texto-inexistente linea-resumen"
          >
            Artículos inexistentes: {{ cantidadArticulosInexistentes }}
          </p>
        </div>
      </div>
    </TarjetaSeccion>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'
import TarjetaSeccion from '../../Configuracion/Tutoriales/TarjetaSeccion.vue'

const props = defineProps({
  ubicaciones: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const informacionExpandida = ref(false)

const ubicacionesValidas = computed(() => {
  if (!Array.isArray(props.ubicaciones)) return []
  return props.ubicaciones.filter(
    (ubicacion) =>
      ubicacion && typeof ubicacion === 'object' && (ubicacion.codigo || ubicacion.ubicacion),
  )
})

function normalizarCodigo(codigo) {
  if (!codigo || typeof codigo !== 'string') return ''
  return codigo.trim().toUpperCase()
}

function esArticuloInexistente(codigo) {
  if (!codigo || typeof codigo !== 'string') return true

  try {
    const articulosCargados = obtenerArticulosCargados()
    if (!Array.isArray(articulosCargados)) return true
    return !articulosCargados.some(
      (articulo) =>
        articulo &&
        articulo.codigo &&
        typeof articulo.codigo === 'string' &&
        articulo.codigo.toLowerCase() === codigo.toLowerCase(),
    )
  } catch (error) {
    console.error('[InformacionUbicaciones] Error al validar artículo:', error)
    return true
  }
}

const codigosDuplicados = computed(() => {
  const conteo = new Map()

  for (const ubicacion of ubicacionesValidas.value) {
    const codigoNormalizado = normalizarCodigo(ubicacion.codigo)
    if (codigoNormalizado) {
      conteo.set(codigoNormalizado, (conteo.get(codigoNormalizado) || 0) + 1)
    }
  }

  return new Set([...conteo].filter(([, cantidad]) => cantidad > 1).map(([codigo]) => codigo))
})

const cantidadCodigosRepetidos = computed(
  () =>
    ubicacionesValidas.value.filter((ubicacion) =>
      codigosDuplicados.value.has(normalizarCodigo(ubicacion.codigo)),
    ).length,
)

const cantidadArticulosInexistentes = computed(
  () => ubicacionesValidas.value.filter((ubicacion) => esArticuloInexistente(ubicacion.codigo)).length,
)

const firmaAlertas = computed(
  () => `${cantidadCodigosRepetidos.value}|${cantidadArticulosInexistentes.value}`,
)

function manejarCambioExpansionInformacion(estaExpandida) {
  informacionExpandida.value = Boolean(estaExpandida)
}

watch(
  firmaAlertas,
  (firmaNueva, firmaAnterior) => {
    if (
      firmaNueva !== firmaAnterior &&
      (cantidadCodigosRepetidos.value > 0 || cantidadArticulosInexistentes.value > 0)
    ) {
      informacionExpandida.value = true
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.bloque-informacion-ubicaciones {
  margin: 0.75rem 0;
}
@media (min-width: 601px) {
  .bloque-informacion-ubicaciones {
    margin: 0.9rem 0 1rem 0;
  }
}
</style>
