<template>
  <div class="contenedor-tabla contenedor-memorias">
    <h2 class="titulo-tabla titulo-memorias">Memorias de etiquetas</h2>

    <p class="texto-secundario texto-introduccion-memorias">
      Compartí e importá memorias para reutilizar descripciones editadas entre dispositivos.
    </p>

    <div class="tarjeta-acciones-fija">
      <h3 class="titulo-acciones-fija">Acciones</h3>
      <div class="acciones-memoria">
        <button
          type="button"
          class="boton-accion-memoria"
          :disabled="importandoMemorias || exportandoMemorias"
          @click="exportarMemorias"
        >
          {{ exportandoMemorias ? 'Exportando...' : 'Exportar memorias' }}
        </button>
        <button
          type="button"
          class="boton-accion-memoria"
          :disabled="importandoMemorias || exportandoMemorias"
          @click="importarMemorias"
        >
          {{ importandoMemorias ? 'Importando...' : 'Importar memorias' }}
        </button>
      </div>
    </div>

    <TarjetaSeccion titulo="Resumen de memoria" :expandida-por-defecto="false">
      <div class="bloque-resumen-memorias">
        <p class="texto-secundario linea-resumen-memorias">
          <strong>Memorias guardadas:</strong> {{ cantidadMemorias }}
        </p>
        <p class="texto-secundario linea-resumen-memorias">
          <strong>Última exportación:</strong> {{ ultimaExportacionTexto }}
        </p>
        <p class="texto-secundario linea-resumen-memorias">
          <strong>Última importación:</strong> {{ ultimaImportacionTexto }}
        </p>
      </div>
    </TarjetaSeccion>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { Loading, Notify } from 'quasar'
import TarjetaSeccion from '../components/Configuracion/Tutoriales/TarjetaSeccion.vue'
import { compartirArchivo } from '../components/Logica/Pedidos/CompartirExcel.js'
import { esPlataformaWeb } from '../components/Logica/Etiquetas/GeneradorEtiquetasPDF.js'
import { obtenerTodasLasMemoriasEtiquetas } from '../components/BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js'
import { obtenerMetadatosMemoriaEtiquetas } from '../components/BaseDeDatos/usoAlmacenamientoMetadatosMemoriaEtiquetas.js'
import {
  exportarMemoriasEtiquetas,
  leerArchivoJsonDesdeSelector,
  importarMemoriasDesdeTexto,
  formatearFechaHoraLocal,
} from '../components/Logica/Etiquetas/ServicioMemoriasEtiquetas.js'

const emit = defineEmits(['configurar-barra'])

const importandoMemorias = ref(false)
const exportandoMemorias = ref(false)
const cantidadMemorias = ref(0)
const ultimaExportacionMemoriasEn = ref(null)
const ultimaImportacionMemoriasEn = ref(null)

const ultimaExportacionTexto = computed(() =>
  formatearFechaHoraLocal(ultimaExportacionMemoriasEn.value),
)
const ultimaImportacionTexto = computed(() =>
  formatearFechaHoraLocal(ultimaImportacionMemoriasEn.value),
)

async function refrescarDatosMemorias() {
  const memorias = await obtenerTodasLasMemoriasEtiquetas()
  cantidadMemorias.value = Array.isArray(memorias) ? memorias.length : 0

  const metadatos = await obtenerMetadatosMemoriaEtiquetas()
  ultimaExportacionMemoriasEn.value = metadatos.ultimaExportacionMemoriasEn
  ultimaImportacionMemoriasEn.value = metadatos.ultimaImportacionMemoriasEn
}

async function exportarMemorias() {
  if (importandoMemorias.value || exportandoMemorias.value) return
  exportandoMemorias.value = true
  try {
    const resultado = await exportarMemoriasEtiquetas({ esPlataformaWeb, compartirArchivo })
    if (resultado.sinDatos) {
      Notify.create({
        type: 'warning',
        message: 'No hay memorias para exportar.',
        position: 'top',
        timeout: 1800,
      })
      return
    }
    if (resultado.noCompartido) {
      Notify.create({
        type: 'warning',
        message: 'No se pudo abrir el menú de compartir.',
        position: 'top',
        timeout: 2200,
      })
      return
    }

    await refrescarDatosMemorias()
    Notify.create({
      type: 'positive',
      message: `Memorias exportadas: ${resultado.cantidad}`,
      position: 'top',
      timeout: 1800,
    })
  } catch (error) {
    console.error('[PaginaMemoriasEtiquetas] Error exportando memorias:', error)
    Notify.create({
      type: 'negative',
      message: 'No se pudo exportar las memorias.',
      position: 'top',
      timeout: 2200,
    })
  } finally {
    exportandoMemorias.value = false
  }
}

async function importarMemorias() {
  if (importandoMemorias.value || exportandoMemorias.value) return
  importandoMemorias.value = true
  try {
    const archivo = await leerArchivoJsonDesdeSelector()
    if (!archivo) return

    Loading.show({
      message: `Importando memorias (${archivo.nombre || 'archivo manual'})...`,
      spinnerColor: 'primary',
    })
    const resultado = await importarMemoriasDesdeTexto({
      textoJson: archivo.texto,
      alAplicarCambios: async () => 0,
    })
    Loading.hide()

    if (!resultado.exito) {
      Notify.create({
        type: 'negative',
        message: resultado.mensaje || 'No se pudo importar las memorias.',
        position: 'top',
        timeout: 2500,
      })
      return
    }

    await refrescarDatosMemorias()
    Notify.create({
      type: 'positive',
      message: `Importación lista (${resultado.payload.exportadoPor}): +${resultado.resumen.nuevas} nuevas, ${resultado.resumen.actualizadas} actualizadas, ${resultado.resumen.ignoradas} ignoradas, ${resultado.entradasInvalidas} inválidas.`,
      position: 'top',
      timeout: 3600,
    })
  } catch (error) {
    console.error('[PaginaMemoriasEtiquetas] Error importando memorias:', error)
    Loading.hide()
    Notify.create({
      type: 'negative',
      message: 'No se pudo importar las memorias.',
      position: 'top',
      timeout: 2500,
    })
  } finally {
    importandoMemorias.value = false
  }
}

onMounted(async () => {
  await refrescarDatosMemorias()
  emit(
    'configurar-barra',
    {
      mostrarAtras: true,
      mostrarInicio: true,
      mostrarAgregar: false,
      mostrarEnviar: false,
      puedeEnviar: false,
      botonesPersonalizados: [],
      modalActivo: false,
    },
    {
      onAgregar: () => {},
      onEnviar: () => {},
      onAccionPersonalizada: () => {},
    },
  )
})
</script>

<style scoped>
.contenedor-memorias {
  display: grid;
  gap: 0.9rem;
}
.titulo-memorias {
  margin-bottom: 0;
}
.texto-introduccion-memorias {
  margin: 0;
  text-align: center;
}
.bloque-resumen-memorias {
  display: grid;
  gap: 0.35rem;
}
.linea-resumen-memorias {
  margin: 0;
}
.acciones-memoria {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}
.tarjeta-acciones-fija {
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  padding: 1rem;
}
.titulo-acciones-fija {
  margin: 0 0 0.6rem 0;
  color: var(--color-texto-principal);
  font-size: 1rem;
}
.boton-accion-memoria {
  border: 1px solid var(--color-borde);
  background: var(--color-fondo);
  color: var(--color-texto-principal);
  border-radius: 8px;
  padding: 0.5rem 0.72rem;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.2s ease;
}
.boton-accion-memoria:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.boton-accion-memoria:hover:not(:disabled) {
  filter: brightness(1.1);
}
@media (max-width: 600px) {
  .acciones-memoria {
    flex-direction: column;
  }
}
</style>
