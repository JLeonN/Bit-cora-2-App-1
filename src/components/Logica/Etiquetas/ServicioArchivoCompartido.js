import { Capacitor, registerPlugin } from '@capacitor/core'

const ArchivoCompartidoNativo = registerPlugin('ArchivoCompartido')

function esAndroidNativo() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export async function obtenerArchivoCompartidoPendiente() {
  if (!esAndroidNativo()) {
    return { uri: null, nombre: '' }
  }
  try {
    const resultado = await ArchivoCompartidoNativo.obtenerArchivoCompartidoPendiente()
    return {
      uri: resultado?.uri || null,
      nombre: resultado?.nombre || '',
    }
  } catch (error) {
    console.error('[ServicioArchivoCompartido] Error obteniendo archivo pendiente:', error)
    return { uri: null, nombre: '' }
  }
}

export async function limpiarArchivoCompartidoPendiente() {
  if (!esAndroidNativo()) return { exito: true }
  try {
    return await ArchivoCompartidoNativo.limpiarArchivoCompartidoPendiente()
  } catch (error) {
    console.error('[ServicioArchivoCompartido] Error limpiando archivo pendiente:', error)
    return { exito: false }
  }
}

export async function leerTextoArchivoCompartido(uri) {
  if (!esAndroidNativo() || !uri) return null
  try {
    const resultado = await ArchivoCompartidoNativo.leerTextoArchivoCompartido({ uri })
    return String(resultado?.texto || '')
  } catch (error) {
    console.error('[ServicioArchivoCompartido] Error leyendo texto de archivo compartido:', error)
    return null
  }
}
