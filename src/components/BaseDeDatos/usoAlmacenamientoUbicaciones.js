// usoAlmacenamientoUbicaciones.js
import { Preferences } from '@capacitor/preferences'

// Clave para guardar las ubicaciones
const CLAVE_UBICACIONES = 'ubicaciones_trabajo'

export const guardarUbicaciones = async (ubicaciones) => {
  try {
    const datosString = JSON.stringify(ubicaciones)
    await Preferences.set({ key: CLAVE_UBICACIONES, value: datosString })
    return true
  } catch (error) {
    console.error('Error guardando ubicaciones:', error)
    return false
  }
}

export const obtenerUbicaciones = async () => {
  try {
    const { value } = await Preferences.get({ key: CLAVE_UBICACIONES })
    return value ? JSON.parse(value) : []
  } catch (error) {
    console.error('Error obteniendo ubicaciones:', error)
    return []
  }
}

export const eliminarUbicaciones = async () => {
  try {
    await Preferences.remove({ key: CLAVE_UBICACIONES })
    return true
  } catch (error) {
    console.error('Error eliminando ubicaciones:', error)
    return false
  }
}
