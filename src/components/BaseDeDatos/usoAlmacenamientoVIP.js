// usoAlmacenamientoVIP.js
import { Preferences } from '@capacitor/preferences'

// Clave para almacenar en Preferences
const CLAVE_VIP = 'acceso_vip_usuario'

// ⚠️ CLAVE MAESTRA - Cambia esto por tu clave secreta
const CLAVE_MAESTRA = '1234'

/**
 * Valida si una clave ingresada es correcta
 * @param {string} claveIngresada - La clave que el usuario ingresó
 * @returns {boolean} - true si la clave es válida
 */
export function validarClaveVIP(claveIngresada) {
  if (!claveIngresada || typeof claveIngresada !== 'string') {
    return false
  }

  // Comparación sin distinguir mayúsculas/minúsculas y sin espacios
  const claveNormalizada = claveIngresada.trim().toUpperCase()
  const claveMaestraNormalizada = CLAVE_MAESTRA.trim().toUpperCase()

  return claveNormalizada === claveMaestraNormalizada
}

/**
 * Guarda la clave VIP en el almacenamiento local
 * @param {string} clave - La clave válida a guardar
 * @returns {Promise<boolean>} - true si se guardó correctamente
 */
export async function guardarClaveVIP(clave) {
  try {
    // Validar antes de guardar
    if (!validarClaveVIP(clave)) {
      console.error('[VIP] Intento de guardar clave inválida')
      return false
    }

    const configuracionVIP = {
      claveActiva: true,
      fechaActivacion: new Date().toISOString(),
      version: '1.0',
    }

    await Preferences.set({
      key: CLAVE_VIP,
      value: JSON.stringify(configuracionVIP),
    })

    console.log('[VIP] Acceso VIP activado correctamente')
    return true
  } catch (error) {
    console.error('[VIP] Error al guardar clave VIP:', error)
    return false
  }
}

/**
 * Verifica si el usuario tiene acceso VIP activo
 * @returns {Promise<boolean>} - true si tiene acceso VIP
 */
export async function tieneAccesoVIP() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_VIP })

    if (!value) {
      return false
    }

    const configuracion = JSON.parse(value)
    return configuracion.claveActiva === true
  } catch (error) {
    console.error('[VIP] Error al verificar acceso VIP:', error)
    return false
  }
}

/**
 * Obtiene la información completa del acceso VIP
 * @returns {Promise<object|null>} - Configuración VIP o null
 */
export async function obtenerConfiguracionVIP() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_VIP })

    if (!value) {
      return null
    }

    return JSON.parse(value)
  } catch (error) {
    console.error('[VIP] Error al obtener configuración VIP:', error)
    return null
  }
}

/**
 * Elimina el acceso VIP (para testing o reseteo)
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
export async function eliminarClaveVIP() {
  try {
    await Preferences.remove({ key: CLAVE_VIP })
    console.log('[VIP] Acceso VIP eliminado')
    return true
  } catch (error) {
    console.error('[VIP] Error al eliminar clave VIP:', error)
    return false
  }
}
