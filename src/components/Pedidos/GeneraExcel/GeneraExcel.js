import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'

export async function generarYGuardarExcelTemporal(pedidos) {
  if (!pedidos || pedidos.length === 0) {
    console.error('No se proporcionaron pedidos para generar el archivo.')
    return null
  }

  try {
    const hojaDeTrabajo = XLSX.utils.json_to_sheet(pedidos)
    const libroDeTrabajo = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'Pedidos')

    const datosEnBase64 = XLSX.write(libroDeTrabajo, { bookType: 'xlsx', type: 'base64' })

    const nombreArchivo = `Pedidos Realizados${new Date().getTime()}.xlsx`
    const resultadoEscritura = await Filesystem.writeFile({
      path: nombreArchivo,
      data: datosEnBase64,
      directory: Directory.Cache,
    })

    console.log('Archivo guardado temporalmente en:', resultadoEscritura.uri)

    // Devuelve ambos valores
    return { uri: resultadoEscritura.uri, nombreArchivo }
  } catch (error) {
    console.error('Error al generar o guardar el archivo Excel:', error)
    return null
  }
}
