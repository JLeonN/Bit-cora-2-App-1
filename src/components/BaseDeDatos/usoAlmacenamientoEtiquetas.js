// usoAlmacenamientoEtiquetas.js
import { Preferences } from '@capacitor/preferences'

const CLAVE_ETIQUETAS = 'historial_etiquetas'

export async function guardarEtiquetas(etiquetas) {
  try {
    await Preferences.set({
      key: CLAVE_ETIQUETAS,
      value: JSON.stringify(etiquetas),
    })
    console.log('Etiquetas guardadas correctamente.')
  } catch (error) {
    console.error('Error al guardar las etiquetas:', error)
  }
}

export async function obtenerEtiquetas() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_ETIQUETAS })
    return value ? JSON.parse(value) : []
  } catch (error) {
    console.error('Error al leer las etiquetas:', error)
    return []
  }
}

export async function eliminarEtiquetas() {
  try {
    await Preferences.remove({ key: CLAVE_ETIQUETAS })
    console.log('Etiquetas eliminadas del almacenamiento.')
  } catch (error) {
    console.error('Error al eliminar las etiquetas:', error)
  }
}
