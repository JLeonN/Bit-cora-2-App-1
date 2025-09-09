// recordarUltimaTipografia.js
import { Preferences } from '@capacitor/preferences'

const CLAVE_ULTIMA_UBICACION = 'ultima_ubicacion_ingresada'

// Guardar la última ubicación utilizada
export async function guardarUltimaUbicacion(ubicacion) {
  try {
    const ubicacionLimpia = ubicacion.trim().toUpperCase()
    if (ubicacionLimpia) {
      await Preferences.set({
        key: CLAVE_ULTIMA_UBICACION,
        value: ubicacionLimpia,
      })
      console.log(`[UltimaUbicacion] Guardada: ${ubicacionLimpia}`)
    }
  } catch (error) {
    console.error('[UltimaUbicacion] Error al guardar:', error)
  }
}

// Obtener la última ubicación utilizada
export async function obtenerUltimaUbicacion() {
  try {
    const resultado = await Preferences.get({
      key: CLAVE_ULTIMA_UBICACION,
    })

    const ubicacion = resultado.value || ''
    console.log(`[UltimaUbicacion] Obtenida: ${ubicacion}`)
    return ubicacion
  } catch (error) {
    console.error('[UltimaUbicacion] Error al obtener:', error)
    return ''
  }
}

// Limpiar la última ubicación guardada
export async function limpiarUltimaUbicacion() {
  try {
    await Preferences.remove({
      key: CLAVE_ULTIMA_UBICACION,
    })
    console.log('[UltimaUbicacion] Limpiada')
  } catch (error) {
    console.error('[UltimaUbicacion] Error al limpiar:', error)
  }
}
