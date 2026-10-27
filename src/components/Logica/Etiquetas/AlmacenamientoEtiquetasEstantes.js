import { Preferences } from '@capacitor/preferences'

const CLAVE_ETIQUETAS_ESTANTES = 'etiquetas_estantes_v1'

export async function obtenerEtiquetasEstantes() {
  const { value } = await Preferences.get({ key: CLAVE_ETIQUETAS_ESTANTES })
  if (!value) return []
  const etiquetas = JSON.parse(value)
  return Array.isArray(etiquetas) ? etiquetas : []
}

export async function guardarEtiquetasEstantes(etiquetas) {
  await Preferences.set({ key: CLAVE_ETIQUETAS_ESTANTES, value: JSON.stringify(etiquetas) })
}

export async function eliminarEtiquetasEstantes() {
  await Preferences.remove({ key: CLAVE_ETIQUETAS_ESTANTES })
}
