import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

const ANCHOS_COLUMNAS = [
  { wch: 18 },
  { wch: 65 },
  { wch: 14 },
  { wch: 14 },
  { wch: 14 },
  { wch: 7 },
  { wch: 12 },
]

function esNavegadorWeb() {
  return !window.Capacitor || window.Capacitor.getPlatform() === 'web'
}

function construirLibro(registros, nombreUsuario) {
  const filas = registros.map((registro) => [
    registro.codigo,
    registro.nombre,
    Number(registro.stockExcel),
    Number(registro.stockContado),
    registro.ubicacionActual || '',
    String(registro.ubicacionActual || '').trim().toUpperCase() === 'SL' ||
    registro.nombre === 'ARTÍCULO INEXISTENTE'
      ? '❌'
      : '✔️',
    Number(registro.stockContado) - Number(registro.stockExcel),
  ])
  const hoja = XLSX.utils.aoa_to_sheet([
    [
      'Código',
      'Descripción',
      'Stock Excel',
      'Stock contado',
      'Última ubicación',
      'Info',
      'Diferencia',
    ],
    ...filas,
  ])
  hoja['!cols'] = ANCHOS_COLUMNAS
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, nombreUsuario)
  return libro
}

export async function generarYGuardarExcelStock(registros) {
  const confirmados = Array.isArray(registros)
    ? registros.filter((registro) => registro.confirmado)
    : []
  if (confirmados.length === 0) {
    throw new Error('No hay conteos confirmados para generar el archivo')
  }

  const nombreUsuario = await obtenerNombreUsuario()
  const libro = construirLibro(confirmados, nombreUsuario)
  const ahora = new Date()
  const fecha = ahora.toISOString().split('T')[0]
  const hora = ahora.toTimeString().slice(0, 5).replace(':', '-')
  const nombreArchivo = `Stock ${nombreUsuario} ${fecha} # ${hora}.xlsx`

  if (esNavegadorWeb()) {
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
