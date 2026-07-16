// recordarUltimaTipografia.js
import { Preferences } from '@capacitor/preferences'

const CLAVE_ULTIMA_UBICACION = 'ultima_ubicacion_ingresada'
const CLAVE_AUTOSELECCION_ARTICULO = 'autoseleccion_articulo_ubicaciones'

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

export async function guardarAutoseleccionArticulo(habilitada) {
  try {
    await Preferences.set({
      key: CLAVE_AUTOSELECCION_ARTICULO,
      value: String(Boolean(habilitada)),
    })
  } catch (error) {
    console.error('[AutoseleccionArticulo] Error al guardar:', error)
  }
}

export async function obtenerAutoseleccionArticulo() {
  try {
    const resultado = await Preferences.get({
      key: CLAVE_AUTOSELECCION_ARTICULO,
    })
    return resultado.value === 'true'
  } catch (error) {
    console.error('[AutoseleccionArticulo] Error al obtener:', error)
    return false
  }
}
