import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'
import {
  obtenerArticulosCargados,
  obtenerHistorialUbicaciones,
  obtenerUbicacionAntigua,
  validarCodigosDuplicadosEnUbicaciones,
} from '../../BaseDeDatos/LectorExcel.js'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

const ANCHOS_BASE_COLUMNAS = [
  { wch: 18 }, // A - articulo
  { wch: 6 }, // B - sub1
  { wch: 6 }, // C - sub2
  { wch: 10 }, // D - deposito
  { wch: 8 }, // E - ubic
  { wch: 65 }, // F - descripcion
  { wch: 12 }, // G - ubic antigua
  { wch: 7 }, // H - info
]

function esNavegadorWeb() {
  return !window.Capacitor || window.Capacitor.getPlatform() === 'web'
}

function obtenerNombreArticulo(codigo) {
  const articulosCargados = obtenerArticulosCargados()
  const codigoNormalizado = String(codigo || '')
    .trim()
    .toLowerCase()
  const articuloEncontrado = articulosCargados.find(
    (articulo) => articulo.codigo.toLowerCase() === codigoNormalizado,
  )
  return articuloEncontrado ? articuloEncontrado.nombre : 'Artículo inexistente'
}

function obtenerColumnaExcelPorIndice(indice) {
  let numero = indice + 1
  let columna = ''
  while (numero > 0) {
    const modulo = (numero - 1) % 26
    columna = String.fromCharCode(65 + modulo) + columna
    numero = Math.floor((numero - modulo) / 26)
  }
  return columna
}

function construirLibroUbicaciones(ubicaciones, nombreUsuario) {
  const hojaDeTrabajo = XLSX.utils.aoa_to_sheet([])

  hojaDeTrabajo.A1 = { v: 'articulo', t: 's' }
  hojaDeTrabajo.B1 = { v: 'sub1', t: 's' }
  hojaDeTrabajo.C1 = { v: 'sub2', t: 's' }
  hojaDeTrabajo.D1 = { v: 'deposito', t: 's' }
  hojaDeTrabajo.E1 = { v: 'ubic', t: 's' }
  hojaDeTrabajo.F1 = { v: 'Descripcion', t: 's' }
  hojaDeTrabajo.G1 = { v: 'Ubic Antigua', t: 's' }
  hojaDeTrabajo.H1 = { v: 'Info', t: 's' }

  let maximoHistorial = 0

  ubicaciones.forEach((ubicacion, indice) => {
    const numeroFila = indice + 2
    const codigo = String(ubicacion.codigo || '')
      .trim()
      .toUpperCase()
    const ubicacionNueva = String(ubicacion.ubicacion || '')
      .trim()
      .toUpperCase()

    const ubicacionAntigua = obtenerUbicacionAntigua(codigo)
    const descripcionArticulo = obtenerNombreArticulo(codigo)
    const historial = obtenerHistorialUbicaciones(codigo)
    maximoHistorial = Math.max(maximoHistorial, historial.length)

    const esUbicacionSL = ubicacionAntigua.toUpperCase() === 'SL'
    const esArticuloInexistente = descripcionArticulo === 'Artículo inexistente'
    const emojiInfo = esUbicacionSL || esArticuloInexistente ? '❌' : '✔️'

    hojaDeTrabajo[`A${numeroFila}`] = { v: codigo || 'Sin código', t: 's' }
    hojaDeTrabajo[`B${numeroFila}`] = { v: 0, t: 'n' }
    hojaDeTrabajo[`C${numeroFila}`] = { v: 0, t: 'n' }
    hojaDeTrabajo[`D${numeroFila}`] = { v: '00000016', t: 's' }
    hojaDeTrabajo[`E${numeroFila}`] = { v: ubicacionNueva || 'Sin ubicación', t: 's' }
    hojaDeTrabajo[`F${numeroFila}`] = { v: descripcionArticulo, t: 's' }
    hojaDeTrabajo[`G${numeroFila}`] = { v: ubicacionAntigua || '', t: 's' }
    hojaDeTrabajo[`H${numeroFila}`] = { v: emojiInfo, t: 's' }

    historial.forEach((valorHistorial, indiceHistorial) => {
      const indiceColumna = 8 + indiceHistorial // I=8
      const columna = obtenerColumnaExcelPorIndice(indiceColumna)
      hojaDeTrabajo[`${columna}${numeroFila}`] = { v: valorHistorial, t: 's' }
    })
  })

  for (let indice = 0; indice < maximoHistorial; indice++) {
    const indiceColumna = 8 + indice // I=8
    const columna = obtenerColumnaExcelPorIndice(indiceColumna)
    hojaDeTrabajo[`${columna}1`] = { v: `Historial ${indice + 1}`, t: 's' }
  }

  const ultimaFila = ubicaciones.length + 1
  const ultimaColumnaIndice = Math.max(7, 8 + maximoHistorial - 1)
  const ultimaColumna = obtenerColumnaExcelPorIndice(ultimaColumnaIndice)
  hojaDeTrabajo['!ref'] = `A1:${ultimaColumna}${ultimaFila}`

  const columnasHistorial = Array.from({ length: maximoHistorial }, () => ({ wch: 14 }))
  hojaDeTrabajo['!cols'] = [...ANCHOS_BASE_COLUMNAS, ...columnasHistorial]

  const libroDeTrabajo = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, nombreUsuario)
  return libroDeTrabajo
}

function descargarExcelEnNavegador(libroDeTrabajo, nombreArchivo) {
  XLSX.writeFile(libroDeTrabajo, nombreArchivo)
  return { uri: null, nombreArchivo }
}

export async function generarYGuardarExcelUbicaciones(ubicaciones) {
  if (!Array.isArray(ubicaciones) || ubicaciones.length === 0) {
    throw new Error('No hay ubicaciones para generar el archivo.')
  }

  const validacionDuplicados = validarCodigosDuplicadosEnUbicaciones(ubicaciones)
  if (!validacionDuplicados.exito) {
    throw new Error(
      `Hay códigos duplicados en Ubicaciones: ${validacionDuplicados.codigosDuplicados.join(', ')}`,
    )
  }

  const nombreUsuario = await obtenerNombreUsuario()
  const libroDeTrabajo = construirLibroUbicaciones(ubicaciones, nombreUsuario)

  const ahora = new Date()
  const fecha = ahora.toISOString().split('T')[0]
  const hora = ahora.toTimeString().slice(0, 5).replace(':', '-')
  const nombreArchivo = `Ubic ${nombreUsuario} ${fecha} # ${hora}.xlsx`

  if (esNavegadorWeb()) {
    return descargarExcelEnNavegador(libroDeTrabajo, nombreArchivo)
  }

  const datosEnBase64 = XLSX.write(libroDeTrabajo, { bookType: 'xlsx', type: 'base64' })
  const resultadoEscritura = await Filesystem.writeFile({
    path: nombreArchivo,
    data: datosEnBase64,
    directory: Directory.Cache,
  })
  return { uri: resultadoEscritura.uri, nombreArchivo }
}

export async function descargarExcelUbicacionesEnNavegador(ubicaciones) {
  if (!esNavegadorWeb()) {
    throw new Error('La descarga directa solo está disponible en navegador')
  }
  return generarYGuardarExcelUbicaciones(ubicaciones)
}

