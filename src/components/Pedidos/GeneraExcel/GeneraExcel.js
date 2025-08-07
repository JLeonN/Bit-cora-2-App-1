import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'

export async function generarYGuardarExcelTemporal(pedidos) {
  if (!pedidos || pedidos.length === 0) {
    console.error('No se proporcionaron pedidos para generar el archivo.')
    return null
  }

  try {
    // Generar el contenido del Excel en formato Base64 ---
    const hojaDeTrabajo = XLSX.utils.json_to_sheet(pedidos)
    const libroDeTrabajo = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, 'Pedidos')

    // Formato que Filesystem necesita para escribir archivos binarios.
    const datosEnBase64 = XLSX.write(libroDeTrabajo, { bookType: 'xlsx', type: 'base64' })

    // Guardar el archivo en el almacenamiento temporal ---
    const resultadoEscritura = await Filesystem.writeFile({
      path: `reporte-pedidos-${new Date().getTime()}.xlsx`, // Nombre único para evitar conflictos
      data: datosEnBase64,
      directory: Directory.Cache,
    })

    console.log('Archivo guardado temporalmente en:', resultadoEscritura.uri)

    // URI es la que necesitarás para el plugin de Email.
    return resultadoEscritura.uri
  } catch (error) {
    console.error('Error al generar o guardar el archivo Excel:', error)
    return null // Null para indicar que la operación falló.
  }
}
