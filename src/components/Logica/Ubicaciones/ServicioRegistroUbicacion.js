import {
  actualizarUbicacionArticulo,
  obtenerHistorialUbicaciones,
} from '../../BaseDeDatos/LectorExcel.js'
import {
  guardarUbicaciones,
  obtenerUbicaciones,
} from '../../BaseDeDatos/usoAlmacenamientoUbicaciones.js'

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
}

export function obtenerUltimaUbicacionRegistrada(codigo, ubicaciones, articulo, respaldo = '') {
  const codigoNormalizado = normalizarTexto(codigo)
  const movimiento = Array.isArray(ubicaciones)
    ? ubicaciones.find((item) => normalizarTexto(item?.codigo) === codigoNormalizado)
    : null
  if (movimiento?.ubicacion) return normalizarTexto(movimiento.ubicacion)
  const historial = Array.isArray(articulo?.historialUbicaciones)
    ? articulo.historialUbicaciones
    : []
  return normalizarTexto(historial.at(-1) || respaldo)
}

export async function registrarUbicacionArticulo(codigo, ubicacion) {
  const codigoNormalizado = normalizarTexto(codigo)
  const ubicacionNormalizada = normalizarTexto(ubicacion)
  if (!codigoNormalizado || !ubicacionNormalizada) {
    return { exito: false, mensaje: 'Código o ubicación inválidos' }
  }

  const ubicacionesActuales = await obtenerUbicaciones()
  const listaAnterior = Array.isArray(ubicacionesActuales) ? ubicacionesActuales : []
  const listaNueva = [{ codigo: codigoNormalizado, ubicacion: ubicacionNormalizada }, ...listaAnterior]
  const guardado = await guardarUbicaciones(listaNueva)
  if (!guardado) {
    return { exito: false, mensaje: 'No se pudo guardar la ubicación en Ubicaciones' }
  }

  const resultadoHistorial = await actualizarUbicacionArticulo(codigoNormalizado, ubicacionNormalizada)
  if (!resultadoHistorial.exito) {
    await guardarUbicaciones(listaAnterior)
    return resultadoHistorial
  }

  return {
    exito: true,
    ubicacion: ubicacionNormalizada,
    historialUbicaciones: obtenerHistorialUbicaciones(codigoNormalizado),
  }
}
