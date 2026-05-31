import { Preferences } from '@capacitor/preferences'

const CLAVE_METADATOS_MEMORIA_ETIQUETAS = 'metadatos_memoria_etiquetas_v1'

const crearMetadatosVacios = () => ({
  ultimaExportacionMemoriasEn: null,
  ultimaImportacionMemoriasEn: null,
})

function normalizarMetadatos(metadatosCrudos = {}) {
  const exportacion = Number(metadatosCrudos?.ultimaExportacionMemoriasEn || 0)
  const importacion = Number(metadatosCrudos?.ultimaImportacionMemoriasEn || 0)

  return {
    ultimaExportacionMemoriasEn: Number.isFinite(exportacion) && exportacion > 0 ? exportacion : null,
    ultimaImportacionMemoriasEn: Number.isFinite(importacion) && importacion > 0 ? importacion : null,
  }
}

export async function obtenerMetadatosMemoriaEtiquetas() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_METADATOS_MEMORIA_ETIQUETAS })
    if (!value) {
      return crearMetadatosVacios()
    }
    const metadatosCrudos = JSON.parse(value)
    return normalizarMetadatos(metadatosCrudos)
  } catch (error) {
    console.error('[MetadatosMemoriaEtiquetas] Error leyendo metadatos:', error)
    return crearMetadatosVacios()
  }
}

async function persistirMetadatos(metadatos) {
  await Preferences.set({
    key: CLAVE_METADATOS_MEMORIA_ETIQUETAS,
    value: JSON.stringify(normalizarMetadatos(metadatos)),
  })
}

export async function guardarUltimaExportacionMemorias(fechaMs) {
  const metadatos = await obtenerMetadatosMemoriaEtiquetas()
  metadatos.ultimaExportacionMemoriasEn = Number(fechaMs || Date.now())
  await persistirMetadatos(metadatos)
  return { exito: true }
}

export async function guardarUltimaImportacionMemorias(fechaMs) {
  const metadatos = await obtenerMetadatosMemoriaEtiquetas()
  metadatos.ultimaImportacionMemoriasEn = Number(fechaMs || Date.now())
  await persistirMetadatos(metadatos)
  return { exito: true }
}
