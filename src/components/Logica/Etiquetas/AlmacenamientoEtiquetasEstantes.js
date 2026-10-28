import { Preferences } from '@capacitor/preferences'

const CLAVE_ETIQUETAS_ESTANTES = 'etiquetas_estantes_v1'

export async function obtenerEtiquetasEstantes() {
  const { value } = await Preferences.get({ key: CLAVE_ETIQUETAS_ESTANTES })
  if (!value) return []
  const etiquetas = JSON.parse(value)
  if (!Array.isArray(etiquetas)) return []
  return etiquetas.map((etiqueta) => typeof etiqueta === 'string'
    ? { codigo: etiqueta, cantidad: 1 }
    : etiqueta).filter((etiqueta) => typeof etiqueta?.codigo === 'string' && Number.isInteger(etiqueta.cantidad) && etiqueta.cantidad >= 1 && etiqueta.cantidad <= 99)
}

export async function guardarEtiquetasEstantes(etiquetas) {
  await Preferences.set({ key: CLAVE_ETIQUETAS_ESTANTES, value: JSON.stringify(etiquetas) })
}

export async function eliminarEtiquetasEstantes() {
  await Preferences.remove({ key: CLAVE_ETIQUETAS_ESTANTES })
}
