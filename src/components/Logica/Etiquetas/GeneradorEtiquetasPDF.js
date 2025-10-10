// GeneradorEtiquetasPDF.js
import jsPDF from 'jspdf'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { generarCodigoBarraPNG } from './GeneradorCodigoBarra.js'

/**
 * Calcula el tamaño de fuente óptimo para la descripción
 * @param {string} descripcion - Texto de la descripción
 * @returns {number} - Tamaño de fuente en puntos (40-60)
 */
const calcularTamanoFuenteDescripcion = (descripcion) => {
  const longitud = descripcion.length

  // Lógica de ajuste automático
  if (longitud <= 15) return 60 // Descripciones cortas
  if (longitud <= 25) return 52 // Descripciones medianas
  if (longitud <= 35) return 46 // Descripciones un poco largas
  if (longitud <= 45) return 38 // Descripciones largas
  return 40 // Descripciones muy largas
}

/**
 * Calcula el tamaño del código numérico según la descripción
 * @param {string} descripcion - Texto de la descripción
 * @returns {number} - Tamaño de fuente para el código (35-50)
 */
const calcularTamanoCodigoNumerico = (descripcion) => {
  const longitud = descripcion.length

  // Si la descripción es muy larga, reducir el código de arriba
  if (longitud > 45) return 35 // Descripciones muy largas
  if (longitud > 35) return 40 // Descripciones largas
  return 50 // Normal
}

/**
 * Crea una página de etiqueta individual en PDF
 * @param {Object} pdf - Instancia de jsPDF
 * @param {Object} etiqueta - Datos de la etiqueta
 */
const crearPaginaEtiqueta = async (pdf, etiqueta) => {
  const { codigo, descripcion, ubicacion } = etiqueta

  // Generar código de barras
  const imagenCodigoBarra = await generarCodigoBarraPNG(codigo, 'grande')

  // Calcular tamaños de fuente
  const tamanoDescripcion = calcularTamanoFuenteDescripcion(descripcion)
  const tamanoCodigoNumerico = calcularTamanoCodigoNumerico(descripcion)

  // Dimensiones de la página (15cm x 10cm = 150mm x 100mm)
  const anchoHoja = 150 // mm
  const altoHoja = 100 // mm

  // CÓDIGO DEL ARTÍCULO (arriba, centrado, ajustable)
  pdf.setFontSize(tamanoCodigoNumerico)
  pdf.setFont('helvetica', 'bold')
  const anchoCodigo = pdf.getTextWidth(codigo)
  pdf.text(codigo, (anchoHoja - anchoCodigo) / 2, 15)

  // CÓDIGO DE BARRAS (centrado, más largo, menos espacio arriba)
  const anchoBarra = 125 // ancho de la imagen del código de barras (más largo)
  const altoBarra = 20 // alto de la imagen del código de barras (igual)
  pdf.addImage(
    imagenCodigoBarra,
    'PNG',
    (anchoHoja - anchoBarra) / 2,
    22, // más cerca del código de arriba
    anchoBarra,
    altoBarra,
  )

  // DESCRIPCIÓN (centrado, tamaño automático, bold)
  pdf.setFontSize(tamanoDescripcion)
  pdf.setFont('helvetica', 'bold')

  // Dividir texto si es muy largo
  const maxAncho = anchoHoja - 20 // dejar margen
  const lineasDescripcion = pdf.splitTextToSize(descripcion, maxAncho)

  // Ajustar posición según cantidad de líneas
  const yDescripcion = lineasDescripcion.length > 1 ? 52 : 50 // más espacio si es multilínea

  lineasDescripcion.forEach((linea, index) => {
    const anchoLinea = pdf.getTextWidth(linea)
    pdf.text(linea, (anchoHoja - anchoLinea) / 2, yDescripcion + index * (tamanoDescripcion * 0.35))
  })

  // UBICACIÓN (esquina inferior izquierda, pequeño)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(ubicacion || 'Sin ubicación', 5, altoHoja - 5)
}

/**
 * Genera documento PDF con todas las etiquetas
 * @param {Array} listaEtiquetas - Array de etiquetas a imprimir
 * @returns {Promise<Object>} - {exito, mensaje, rutaArchivo}
 */
export const generarDocumentoEtiquetas = async (listaEtiquetas) => {
  try {
    console.log(
      '[GeneradorEtiquetasPDF] Generando documento con',
      listaEtiquetas.length,
      'etiquetas',
    )

    if (!listaEtiquetas || listaEtiquetas.length === 0) {
      throw new Error('No hay etiquetas para generar')
    }

    // Crear PDF con tamaño personalizado (15cm x 10cm)
    // jsPDF usa milímetros por defecto
    const pdf = new jsPDF({
      orientation: 'landscape', // horizontal
      unit: 'mm',
      format: [100, 150], // [alto, ancho] en mm
    })

    let esPrimeraPagina = true

    // Generar páginas para cada etiqueta (respetando cantidad de copias)
    for (const etiqueta of listaEtiquetas) {
      const cantidadCopias = etiqueta.cantidad || 1

      // Generar copias de la misma etiqueta
      for (let i = 0; i < cantidadCopias; i++) {
        // Agregar nueva página (excepto la primera)
        if (!esPrimeraPagina) {
          pdf.addPage([100, 150], 'landscape')
        }
        esPrimeraPagina = false

        // Crear contenido de la etiqueta
        await crearPaginaEtiqueta(pdf, etiqueta)
      }
    }

    // Convertir PDF a base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1]

    // Guardar en filesystem temporal
    const nombreArchivo = `etiquetas_${new Date().getTime()}.pdf`
    const resultado = await Filesystem.writeFile({
      path: nombreArchivo,
      data: pdfBase64,
      directory: Directory.Cache,
    })

    console.log('[GeneradorEtiquetasPDF] ✅ Documento generado:', resultado.uri)

    return {
      exito: true,
      mensaje: 'Documento generado correctamente',
      rutaArchivo: resultado.uri,
      nombreArchivo,
    }
  } catch (error) {
    console.error('[GeneradorEtiquetasPDF] ❌ Error:', error)
    return {
      exito: false,
      mensaje: error.message || 'Error al generar documento',
      rutaArchivo: null,
    }
  }
}
