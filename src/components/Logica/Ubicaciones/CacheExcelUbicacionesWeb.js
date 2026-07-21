import { obtenerEstadoCarga } from '../../BaseDeDatos/LectorExcel.js'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import { generarArchivoExcelUbicacionesParaCompartir } from './ExportarUbicacionesExcel.js'

let archivoExcelListo = null
let nombreUsuarioExcelListo = ''
let firmaExcelLista = ''
let firmaGeneracionActiva = ''
let promesaGeneracion = null
let versionGeneracion = 0

function obtenerIdentidadBaseDatos() {
  const archivo = obtenerEstadoCarga().archivo
  return {
    nombre: archivo?.nombre || '',
    tamano: archivo?.tamano || 0,
    tipo: archivo?.tipo || '',
    fechaModificacion: archivo?.fechaModificacion || 0,
  }
}

export async function crearFirmaExcelUbicaciones(ubicaciones) {
  const nombreUsuario = await obtenerNombreUsuario()
  const ubicacionesParaExportar = Array.isArray(ubicaciones)
    ? ubicaciones.map((ubicacion) => ({
        codigo: String(ubicacion?.codigo || '').trim().toUpperCase(),
        ubicacion: String(ubicacion?.ubicacion || '').trim().toUpperCase(),
      }))
    : []

  return {
    firma: JSON.stringify({
      ubicaciones: ubicacionesParaExportar,
      baseDatos: obtenerIdentidadBaseDatos(),
      nombreUsuario,
    }),
    nombreUsuario,
  }
}

export function invalidarExcelCompartible() {
  versionGeneracion += 1
  archivoExcelListo = null
  nombreUsuarioExcelListo = ''
  firmaExcelLista = ''
}

export function obtenerArchivoExcelListo() {
  return archivoExcelListo
}

export function obtenerDatosExcelListo() {
  return {
    archivoExcel: archivoExcelListo,
    nombreUsuario: nombreUsuarioExcelListo,
  }
}

export async function obtenerExcelCompartible(ubicaciones) {
  const { firma, nombreUsuario } = await crearFirmaExcelUbicaciones(ubicaciones)

  if (archivoExcelListo && firmaExcelLista === firma) {
    return archivoExcelListo
  }

  if (promesaGeneracion && firmaGeneracionActiva === firma) {
    return promesaGeneracion
  }

  const versionActual = ++versionGeneracion
  firmaGeneracionActiva = firma
  const promesaActual = generarArchivoExcelUbicacionesParaCompartir(ubicaciones, nombreUsuario)
    .then((archivoExcel) => {
      if (versionActual !== versionGeneracion) return null

      archivoExcelListo = archivoExcel
      nombreUsuarioExcelListo = nombreUsuario
      firmaExcelLista = firma
      return archivoExcel
    })
    .finally(() => {
      if (promesaGeneracion === promesaActual) {
        promesaGeneracion = null
        firmaGeneracionActiva = ''
      }
    })

  promesaGeneracion = promesaActual
  return promesaActual
}

export function descargarArchivoExcelEnNavegador(archivoExcel) {
  if (!archivoExcel) {
    throw new Error('No hay un Excel listo para descargar.')
  }

  const enlaceDescarga = document.createElement('a')
  const urlArchivo = URL.createObjectURL(archivoExcel)
  enlaceDescarga.href = urlArchivo
  enlaceDescarga.download = archivoExcel.name
  enlaceDescarga.style.display = 'none'
  document.body.appendChild(enlaceDescarga)
  enlaceDescarga.click()
  document.body.removeChild(enlaceDescarga)
  setTimeout(() => URL.revokeObjectURL(urlArchivo), 0)
}
