import { Preferences } from '@capacitor/preferences'

const CLAVE_HISTORIAL = 'historial_ubicaciones_fechado_v1'
let cambios = []
let inicializado = false

export async function obtenerCambiosUbicacion() {
  if (!inicializado) {
    const resultado = await Preferences.get({ key: CLAVE_HISTORIAL })
    const datos = resultado.value ? JSON.parse(resultado.value) : { cambios: [] }
    if (!Array.isArray(datos.cambios)) throw new Error('El historial de ubicaciones no es válido')
    cambios = datos.cambios
    inicializado = true
  }
  return [...cambios]
}

export function obtenerCambiosUbicacionEnMemoria() {
  return cambios
}

export async function registrarCambiosUbicacion(nuevos) {
  await obtenerCambiosUbicacion()
  const registros = nuevos.map((item) => ({
    codigo: String(item.codigo || '').trim().toUpperCase(),
    ubicacion: String(item.ubicacion || '').trim().toUpperCase(),
    fechaActualizacion: item.fechaActualizacion == null ? null : Number(item.fechaActualizacion),
  }))
  if (registros.some((item) => !item.codigo || !item.ubicacion || (item.fechaActualizacion !== null && !Number.isFinite(item.fechaActualizacion)))) {
    throw new Error('Cambio de ubicación inválido')
  }
  const actualizados = [...cambios, ...registros]
  await Preferences.set({ key: CLAVE_HISTORIAL, value: JSON.stringify({ version: 1, cambios: actualizados }) })
  cambios = actualizados
}

export async function restaurarCambiosUbicacion(anteriores) {
  await Preferences.set({ key: CLAVE_HISTORIAL, value: JSON.stringify({ version: 1, cambios: anteriores }) })
  cambios = [...anteriores]
  inicializado = true
}
