import {
  actualizarUbicacionArticulo,
  obtenerHistorialUbicaciones,
  obtenerInformacionArchivo,
  obtenerArticuloBasePorCodigo,
  obtenerArticuloPorCodigo,
} from '../../BaseDeDatos/LectorExcel.js'
import {
  guardarUbicaciones,
  obtenerUbicaciones,
} from '../../BaseDeDatos/usoAlmacenamientoUbicaciones.js'
import { obtenerCambiosUbicacion, obtenerCambiosUbicacionEnMemoria, restaurarCambiosUbicacion } from '../../BaseDeDatos/UsoHistorialUbicaciones.js'
import { resolverUbicacionVigente } from './ServicioUbicacionVigente.js'

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
}

export function obtenerUltimaUbicacionRegistrada(codigo, ubicaciones, articulo, respaldo = '') {
  const info = obtenerInformacionArchivo()
  const base = obtenerArticuloBasePorCodigo(codigo)
  const vigente = resolverUbicacionVigente({
    articulo: info?.fechaCargaExcel ? base || articulo : articulo,
    cambios: obtenerCambiosUbicacionEnMemoria().slice(info?.indiceCambiosExcel ?? 0),
    fechaCargaExcel: info?.fechaCargaExcel,
    usarOrdenRegistro: Number.isInteger(info?.indiceCambiosExcel),
    ubicacionesLegadas: ubicaciones,
  }).ubicacion
  return info?.fechaCargaExcel && base ? vigente : vigente || normalizarTexto(respaldo)
}

export async function registrarUbicacionArticulo(codigo, ubicacion) {
  const codigoNormalizado = normalizarTexto(codigo)
  const ubicacionNormalizada = normalizarTexto(ubicacion)
  if (!codigoNormalizado || !ubicacionNormalizada) {
    return { exito: false, mensaje: 'Código o ubicación inválidos' }
  }

  const cambiosAnteriores = await obtenerCambiosUbicacion()
  const ubicacionesActuales = await obtenerUbicaciones()
  const listaAnterior = Array.isArray(ubicacionesActuales) ? ubicacionesActuales : []
  const listaNueva = [{ codigo: codigoNormalizado, ubicacion: ubicacionNormalizada }, ...listaAnterior]
  const articulo = obtenerArticuloPorCodigo(codigoNormalizado)
  const ubicacionActual = obtenerUltimaUbicacionRegistrada(codigoNormalizado, listaAnterior, articulo, articulo?.ubicacionAntigua)
  const codigosForzados = ubicacionActual !== ubicacionNormalizada ? [codigoNormalizado] : []
  const guardado = await guardarUbicaciones(listaNueva, { codigosForzados })
  if (!guardado) {
    return { exito: false, mensaje: 'No se pudo guardar la ubicación en Ubicaciones' }
  }

  let resultadoHistorial
  try {
    resultadoHistorial = await actualizarUbicacionArticulo(codigoNormalizado, ubicacionNormalizada)
    if (!resultadoHistorial.exito) throw new Error(resultadoHistorial.mensaje)
  } catch (error) {
    await guardarUbicaciones(listaAnterior, { registrarCambios: false })
    await restaurarCambiosUbicacion(cambiosAnteriores)
    return { exito: false, mensaje: error.message }
  }

  return {
    exito: true,
    ubicacion: ubicacionNormalizada,
    historialUbicaciones: obtenerHistorialUbicaciones(codigoNormalizado),
  }
}
