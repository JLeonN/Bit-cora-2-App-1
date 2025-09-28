// ExportarUbicacionesExcel.js
import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'
import { obtenerArticulosCargados, obtenerUbicacionAntigua } from '../../BaseDeDatos/LectorExcel.js'

// --- CONFIGURACIÓN DE ANCHOS DE COLUMNAS ---
const ANCHOS_COLUMNAS = [
  { wch: 18 }, // A - articulo
  { wch: 6 }, // B - sub1
  { wch: 6 }, // C - sub2
  { wch: 10 }, // D - deposito
  { wch: 8 }, // E - ubic
  { wch: 65 }, // F - Descripcion
  { wch: 12 }, // G - Ubic Antigua
  { wch: 7 }, // H - Info (emojis)
]

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
    hojaDeTrabajo['G1'] = { v: 'Ubic Antigua', t: 's' }
    hojaDeTrabajo['H1'] = { v: 'Info', t: 's' }

    // --- Contadores para estadísticas ---
    let ubicacionesAntiguasEncontradas = 0
    let ubicacionesAntiguasVacias = 0

    // --- Datos de ubicaciones desde fila 2 ---
    ubicaciones.forEach((ubicacion, indice) => {
      const numeroFila = indice + 2 // fila 2 para el primer dato

      // Obtener ubicación antigua y descripción
      const ubicacionAntiguaDelArticulo = obtenerUbicacionAntigua(ubicacion.codigo)
      const descripcionArticulo = obtenerNombreArticulo(ubicacion.codigo)

      // Actualizar estadísticas
      if (ubicacionAntiguaDelArticulo && ubicacionAntiguaDelArticulo.trim() !== '') {
        ubicacionesAntiguasEncontradas++
      } else {
        ubicacionesAntiguasVacias++
      }

      // --- DETERMINAR EMOJI SEGÚN CONDICIONES ---
      const esUbicacionSL = ubicacionAntiguaDelArticulo.toUpperCase() === 'SL'
      const esArticuloInexistente = descripcionArticulo === 'Artículo inexistente'

      // Prioridad: SL → ❌, Inexistente → ❌, Resto → ✔️
      let emojiInfo = '✔️' // Por defecto OK

      if (esUbicacionSL || esArticuloInexistente) {
        emojiInfo = '❌' // Error para SL o inexistente
      }

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
      // Columna E: ubicación nueva
      hojaDeTrabajo[`E${numeroFila}`] = {
        v: ubicacion.ubicacion || 'Sin ubicación',
        t: 's',
      }
      // Columna F: descripción (nombre del artículo)
      hojaDeTrabajo[`F${numeroFila}`] = {
        v: descripcionArticulo,
        t: 's',
      }

      // Columna G: ubicación antigua
      hojaDeTrabajo[`G${numeroFila}`] = {
        v: ubicacionAntiguaDelArticulo || '', // Vacío si no tiene
        t: 's',
      }

      // Columna H: Info con emoji
      hojaDeTrabajo[`H${numeroFila}`] = {
        v: emojiInfo,
        t: 's',
      }
    })

    // --- Definir rango de la hoja ---
    const ultimaFila = ubicaciones.length + 1 // +1 por los encabezados
    hojaDeTrabajo['!ref'] = `A1:H${ultimaFila}` // Ahora hasta columna H

    // --- APLICAR ANCHOS DE COLUMNAS ---
    hojaDeTrabajo['!cols'] = ANCHOS_COLUMNAS

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

    // --- Log de estadísticas ---
    console.log('- Archivo de ubicaciones generado exitosamente:')
    console.log(`- Ubicaciones totales: ${ubicaciones.length}`)
    console.log(`- Con ubicación antigua: ${ubicacionesAntiguasEncontradas}`)
    console.log(`- Sin ubicación antigua: ${ubicacionesAntiguasVacias}`)
    console.log(`- Anchos aplicados: A(18), B(6), C(6), D(10), E(8), F(65), G(12), H(7)`)
    console.log(`📋 COLUMNA INFO (H):`)
    console.log(`- = Ubicación SL o Artículo inexistente`)
    console.log(`- = Todo correcto`)
    console.log(`- Archivo guardado en: ${resultadoEscritura.uri}`)

    return { uri: resultadoEscritura.uri, nombreArchivo }
  } catch (error) {
    console.error('Error al generar o guardar el archivo Excel de ubicaciones:', error)
    return null
  }
}

// Función auxiliar para obtener estadísticas antes de exportar
export function obtenerEstadisticasUbicaciones(ubicaciones) {
  if (!ubicaciones || ubicaciones.length === 0) {
    return {
      total: 0,
      conUbicacionAntigua: 0,
      sinUbicacionAntigua: 0,
      porcentajeConAntigua: 0,
    }
  }
  let conUbicacionAntigua = 0
  let sinUbicacionAntigua = 0
  ubicaciones.forEach((ubicacion) => {
    const ubicacionAntigua = obtenerUbicacionAntigua(ubicacion.codigo)
    if (ubicacionAntigua && ubicacionAntigua.trim() !== '') {
      conUbicacionAntigua++
    } else {
      sinUbicacionAntigua++
    }
  })
  const porcentajeConAntigua = Math.round((conUbicacionAntigua / ubicaciones.length) * 100)
  return {
    total: ubicaciones.length,
    conUbicacionAntigua,
    sinUbicacionAntigua,
    porcentajeConAntigua,
  }
}

// Función para validar si hay datos de ubicaciones antiguas
export function validarDatosUbicacionesAntiguas() {
  const articulosCargados = obtenerArticulosCargados()
  if (articulosCargados.length === 0) {
    return {
      valido: false,
      mensaje: 'No hay base de datos Excel cargada',
      tieneUbicacionesAntiguas: false,
      totalArticulos: 0,
      articulosConUbicacionAntigua: 0,
    }
  }
  const articulosConUbicacionAntigua = articulosCargados.filter(
    (articulo) => articulo.ubicacionAntigua && articulo.ubicacionAntigua.trim() !== '',
  ).length
  return {
    valido: true,
    mensaje: 'Base de datos disponible',
    tieneUbicacionesAntiguas: articulosConUbicacionAntigua > 0,
    totalArticulos: articulosCargados.length,
    articulosConUbicacionAntigua,
  }
}
