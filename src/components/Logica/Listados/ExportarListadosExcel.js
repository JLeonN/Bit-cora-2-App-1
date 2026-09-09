import { Directory, Filesystem } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import * as XLSX from 'xlsx'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

export function calcularAnchoColumna(valores, minimo, maximo) {
  const mayorLongitud = valores.reduce(
    (mayor, valor) => Math.max(mayor, String(valor ?? '').length),
    0,
  )
  return Math.min(maximo, Math.max(minimo, mayorLongitud + 2))
}

function sanitizarNombreHoja(nombre) {
  return String(nombre || '').replace(/[\\/?*[\]:]/g, '').trim().slice(0, 31) || 'Listado'
}

export function construirLibroListado(articulosOrdenados, configuracion, nombreListado) {
  const encabezados = ['Código', 'Descripción']
  if (configuracion?.mostrarStock) encabezados.push('Stock')
  if (configuracion?.mostrarUbicacion) encabezados.push('Ubicación')
  const filas = articulosOrdenados.map((articulo) => {
    const fila = [articulo.codigo, articulo.descripcion]
    if (configuracion?.mostrarStock) fila.push(articulo.stockListado)
    if (configuracion?.mostrarUbicacion) fila.push(articulo.ubicacionListado)
    return fila
  })
  const datos = [encabezados, ...filas]
  const hoja = XLSX.utils.aoa_to_sheet(datos)
  const limites = [
    [14, 24],
    [30, 80],
  ]
  if (configuracion?.mostrarStock) limites.push([10, 18])
  if (configuracion?.mostrarUbicacion) limites.push([12, 30])
  hoja['!cols'] = limites.map(([minimo, maximo], indice) => ({
    wch: calcularAnchoColumna(datos.map((fila) => fila[indice]), minimo, maximo),
  }))
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, sanitizarNombreHoja(nombreListado))
  return libro
}

function sanitizarNombreArchivo(nombre) {
  return String(nombre || '').replace(/[<>:"/\\|?*]/g, '').trim()
}

export async function generarYGuardarExcelListado(listado, articulosOrdenados) {
  if (!Array.isArray(articulosOrdenados) || articulosOrdenados.length === 0) {
    throw new Error('No hay artículos para generar el archivo')
  }
  const nombreUsuario = sanitizarNombreArchivo(await obtenerNombreUsuario()) || 'Usuario'
  const libro = construirLibroListado(
    articulosOrdenados,
    listado.configuracion,
    listado.nombre,
  )
  const ahora = new Date()
  const fecha = ahora.toISOString().split('T')[0]
  const hora = ahora.toTimeString().slice(0, 5).replace(':', '-')
  const nombreArchivo = `Listados ${nombreUsuario} ${fecha} # ${hora}.xlsx`
  if (Capacitor.getPlatform() === 'web') {
    XLSX.writeFile(libro, nombreArchivo)
    return { uri: null, nombreArchivo }
  }
  const datosEnBase64 = XLSX.write(libro, { bookType: 'xlsx', type: 'base64' })
  const resultado = await Filesystem.writeFile({
    path: nombreArchivo,
    data: datosEnBase64,
    directory: Directory.Cache,
  })
  return { uri: resultado.uri, nombreArchivo }
}
