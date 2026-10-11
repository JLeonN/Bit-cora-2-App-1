import { Directory, Filesystem } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import * as XLSX from 'xlsx'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import { crearNombreHojaBitacora } from '../Compartidos/IdentificacionBitacora.js'
import { crearNombreArchivoListado } from './NombreArchivoListado.js'

export function calcularAnchoColumna(valores, minimo, maximo) {
  const mayorLongitud = valores.reduce(
    (mayor, valor) => Math.max(mayor, String(valor ?? '').length),
    0,
  )
  return Math.min(maximo, Math.max(minimo, mayorLongitud + 2))
}

export function construirLibroListado(articulosOrdenados, configuracion, nombreListado) {
  const encabezados = ['Código', 'Descripción']
  if (configuracion?.mostrarNumeracion) encabezados.unshift('N.º')
  if (configuracion?.mostrarStock) encabezados.push('Stock')
  if (configuracion?.mostrarUbicacion) encabezados.push('Ubicación')
  const filas = articulosOrdenados.map((articulo, indice) => {
    const fila = [articulo.codigo, articulo.descripcion]
    if (configuracion?.mostrarNumeracion) fila.unshift(indice + 1)
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
  if (configuracion?.mostrarNumeracion) limites.unshift([6, 10])
  if (configuracion?.mostrarStock) limites.push([10, 18])
  if (configuracion?.mostrarUbicacion) limites.push([12, 30])
  hoja['!cols'] = limites.map(([minimo, maximo], indice) => ({
    wch: calcularAnchoColumna(datos.map((fila) => fila[indice]), minimo, maximo),
  }))
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, crearNombreHojaBitacora(nombreListado))
  return libro
}

export async function generarYGuardarExcelListado(listado, articulosOrdenados) {
  if (!Array.isArray(articulosOrdenados) || articulosOrdenados.length === 0) {
    throw new Error('No hay artículos para generar el archivo')
  }
  const libro = construirLibroListado(
    articulosOrdenados,
    listado.configuracion,
    listado.nombre,
  )
  const nombreUsuario = await obtenerNombreUsuario()
  const nombreArchivo = crearNombreArchivoListado(listado, nombreUsuario, new Date(), 'xlsx')
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
