// usoAlmacenamientoUbicaciones.js
import { Preferences } from '@capacitor/preferences'
import { obtenerCambiosUbicacion, registrarCambiosUbicacion } from './UsoHistorialUbicaciones.js'

// Clave para guardar las ubicaciones
const CLAVE_UBICACIONES = 'ubicaciones_trabajo'

export const guardarUbicaciones = async (ubicaciones, { registrarCambios = true, codigosForzados = [] } = {}) => {
  try {
    const anterior = await Preferences.get({ key: CLAVE_UBICACIONES })
    const listaAnterior = anterior.value ? JSON.parse(anterior.value) : []
    const normalizar = (valor) => String(valor || '').trim().toUpperCase()
    const anteriores = new Map()
    for (const item of listaAnterior) {
      const codigo = normalizar(item.codigo)
      if (!anteriores.has(codigo)) anteriores.set(codigo, normalizar(item.ubicacion))
    }
    const forzados = new Set(codigosForzados.map(normalizar))
    const nuevos = []
    const vistos = new Set()
    for (const item of ubicaciones) {
      const codigo = normalizar(item.codigo)
      const ubicacion = normalizar(item.ubicacion)
      if (!codigo || !ubicacion || vistos.has(codigo)) continue
      vistos.add(codigo)
      if (registrarCambios && (anteriores.get(codigo) !== ubicacion || forzados.has(codigo))) nuevos.push({ codigo, ubicacion, fechaActualizacion: Date.now() })
    }
    if (!registrarCambios) {
      const conocidos = new Set((await obtenerCambiosUbicacion()).map((item) => normalizar(item.codigo)))
      for (const [codigo, ubicacion] of anteriores) {
        if (codigo && ubicacion && !vistos.has(codigo) && !conocidos.has(codigo)) {
          nuevos.push({ codigo, ubicacion, fechaActualizacion: null })
        }
      }
    }
    await Preferences.set({ key: CLAVE_UBICACIONES, value: JSON.stringify(ubicaciones) })
    try {
      if (nuevos.length) await registrarCambiosUbicacion(nuevos)
    } catch (error) {
      if (anterior.value === null) await Preferences.remove({ key: CLAVE_UBICACIONES })
      else await Preferences.set({ key: CLAVE_UBICACIONES, value: anterior.value })
      throw error
    }
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
