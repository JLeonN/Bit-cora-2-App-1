// ExportarUbicacionesExcel.js
import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'

// --- Función principal ---
export async function generarYGuardarExcelUbicaciones(ubicaciones) {
  if (!ubicaciones || ubicaciones.length === 0) {
    console.error('No se proporcionaron ubicaciones para generar el archivo.')
    return null
  }

  try {
    // --- Crear hoja de trabajo vacía ---
    const hojaDeTrabajo = XLSX.utils.aoa_to_sheet([])

    // --- Datos de ubicaciones desde fila 1 ---
    ubicaciones.forEach((u, index) => {
      const fila = index + 1 // fila 1 para el primer dato
      hojaDeTrabajo[`A${fila}`] = { v: u.codigo || 'Sin código', t: 's' }
      hojaDeTrabajo[`B${fila}`] = { v: u.ubicacion || 'Sin ubicación', t: 's' }
      // Para agregar más columnas, descomenta y edita:
      // hojaDeTrabajo[`C${fila}`] = { v: u.otroCampo || '', t: 's' }
      // hojaDeTrabajo[`D${fila}`] = { v: u.otroDato || '', t: 's' }
    })

    // --- Definir rango de la hoja para que Excel lo muestre ---
    const ultimaFila = ubicaciones.length
    hojaDeTrabajo['!ref'] = `A1:B${ultimaFila}` // <-- aquí cambias columnas si agregas más

    // --- Crear libro y agregar hoja ---
    const libroDeTrabajo = XLSX.utils.book_new()
    const nombreHoja = 'Ubicaciones' // <-- aquí cambias nombre de la hoja
    XLSX.utils.book_append_sheet(libroDeTrabajo, hojaDeTrabajo, nombreHoja)

    // --- Nombre del archivo ---
    const nombreArchivo = 'Ubicaciones.xlsx' // <-- aquí cambias nombre del archivo
    // --- Convertir a Base64 y guardar ---
    const datosEnBase64 = XLSX.write(libroDeTrabajo, { bookType: 'xlsx', type: 'base64' })
    const resultadoEscritura = await Filesystem.writeFile({
      path: nombreArchivo,
      data: datosEnBase64,
      directory: Directory.Cache, // <-- si querés cambiar carpeta, aquí
    })

    console.log('Archivo de ubicaciones guardado temporalmente en:', resultadoEscritura.uri) // <-- log opcional
    return { uri: resultadoEscritura.uri, nombreArchivo } // <-- retorna URI y nombre
  } catch (error) {
    console.error('Error al generar o guardar el archivo Excel de ubicaciones:', error)
    return null
  }
}
