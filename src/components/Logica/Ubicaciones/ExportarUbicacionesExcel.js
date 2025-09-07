// ExportarUbicacionesExcel.js
import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'
import { obtenerArticulosCargados } from '../../BaseDeDatos/LectorExcel.js'

// --- Función para obtener el nombre del artículo ---
function obtenerNombreArticulo(codigo) {
  const articulosCargados = obtenerArticulosCargados()
  const articuloEncontrado = articulosCargados.find(
    (articulo) => articulo.codigo.toLowerCase() === codigo.toLowerCase(),
  )
  return articuloEncontrado ? articuloEncontrado.nombre : 'Artículo inexistente'
}

// --- Función principal ---
export async function generarYGuardarExcelUbicaciones(ubicaciones) {
  if (!ubicaciones || ubicaciones.length === 0) {
    console.error('No se proporcionaron ubicaciones para generar el archivo.')
    return null
  }

  try {
    // --- Crear hoja de trabajo vacía ---
    const hojaDeTrabajo = XLSX.utils.aoa_to_sheet([])
    // --- ENCABEZADOS en fila 1 ---
    hojaDeTrabajo['A1'] = { v: 'articulo', t: 's' }
    hojaDeTrabajo['B1'] = { v: 'sub1', t: 's' }
    hojaDeTrabajo['C1'] = { v: 'sub2', t: 's' }
    hojaDeTrabajo['D1'] = { v: 'deposito', t: 's' }
    hojaDeTrabajo['E1'] = { v: 'ubic', t: 's' }
    hojaDeTrabajo['F1'] = { v: 'Descripcion', t: 's' }

    // --- Datos de ubicaciones desde fila 2 ---
    ubicaciones.forEach((ubicacion, indice) => {
      const numeroFila = indice + 2 // fila 2 para el primer dato
      // Columna A: código del artículo
      hojaDeTrabajo[`A${numeroFila}`] = {
        v: ubicacion.codigo || 'Sin código',
        t: 's',
      }
      // Columna B: sub1 (siempre 0)
      hojaDeTrabajo[`B${numeroFila}`] = {
        v: 0,
        t: 'n',
      }
      // Columna C: sub2 (siempre 0)
      hojaDeTrabajo[`C${numeroFila}`] = {
        v: 0,
        t: 'n',
      }
      // Columna D: deposito (siempre 00000016)
      hojaDeTrabajo[`D${numeroFila}`] = {
        v: '00000016',
        t: 's',
      }
      // Columna E: ubicación
      hojaDeTrabajo[`E${numeroFila}`] = {
        v: ubicacion.ubicacion || 'Sin ubicación',
        t: 's',
      }
      // Columna F: descripción (nombre del artículo)
      hojaDeTrabajo[`F${numeroFila}`] = {
        v: obtenerNombreArticulo(ubicacion.codigo),
        t: 's',
      }
    })

    // --- Definir rango de la hoja ---
    const ultimaFila = ubicaciones.length + 1 // +1 por los encabezados
    hojaDeTrabajo['!ref'] = `A1:F${ultimaFila}`
    // --- Crear libro y agregar hoja ---
    const libroDeTrabajo = XLSX.utils.book_new()
    const nombreHoja = 'Ubicaciones'
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, nombreHoja)

    // --- Nombre del archivo ---
    const nombreArchivo = 'Ubicaciones.xlsx'
    // --- Convertir a Base64 y guardar ---
    const datosEnBase64 = XLSX.write(libroDeTrabajo, { bookType: 'xlsx', type: 'base64' })
    const resultadoEscritura = await Filesystem.writeFile({
      path: nombreArchivo,
      data: datosEnBase64,
      directory: Directory.Cache,
    })
    console.log('Archivo de ubicaciones guardado temporalmente en:', resultadoEscritura.uri)
    return { uri: resultadoEscritura.uri, nombreArchivo }
  } catch (error) {
    console.error('Error al generar o guardar el archivo Excel de ubicaciones:', error)
    return null
  }
}
