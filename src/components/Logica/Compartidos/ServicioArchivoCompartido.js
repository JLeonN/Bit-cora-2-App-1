import { Capacitor, registerPlugin } from '@capacitor/core'

const ArchivoCompartidoNativo = registerPlugin('ArchivoCompartido')

function esAndroidNativo() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
}

export function esArchivoExcel(nombre = '', tipo = '') {
  const nombreNormalizado = String(nombre).trim().toLowerCase()
  const tipoNormalizado = String(tipo).trim().toLowerCase()
  return (
    nombreNormalizado.endsWith('.xlsx') ||
    nombreNormalizado.endsWith('.xls') ||
    tipoNormalizado === 'application/vnd.ms-excel' ||
    tipoNormalizado === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
}

export async function obtenerArchivoCompartidoPendiente() {
  if (!esAndroidNativo()) return { uri: null, nombre: '', tipo: '' }
  try {
    const resultado = await ArchivoCompartidoNativo.obtenerArchivoCompartidoPendiente()
    return {
      uri: resultado?.uri || null,
      nombre: resultado?.nombre || '',
      tipo: resultado?.tipo || '',
    }
  } catch (error) {
    console.error('[ServicioArchivoCompartido] Error obteniendo archivo pendiente:', error)
    return { uri: null, nombre: '', tipo: '' }
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

export async function leerArchivoCompartidoComoBase64(uri) {
  if (!esAndroidNativo() || !uri) return null
  try {
    const resultado = await ArchivoCompartidoNativo.leerArchivoCompartidoComoBase64({ uri })
    return String(resultado?.base64 || '')
  } catch (error) {
    console.error('[ServicioArchivoCompartido] Error leyendo archivo compartido:', error)
    return null
  }
}
