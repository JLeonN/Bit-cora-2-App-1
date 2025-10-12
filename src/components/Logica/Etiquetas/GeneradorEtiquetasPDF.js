// GeneradorEtiquetasPDF.js
import jsPDF from 'jspdf'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { generarCodigoBarraPNG } from './GeneradorCodigoBarra.js'

/**
 * Calcula el tamaño de fuente óptimo para la descripción
 * @param {string} descripcion - Texto de la descripción
 * @returns {number} - Tamaño de fuente en puntos (20-60)
 */
const calcularTamanoFuenteDescripcion = (descripcion) => {
  const longitud = descripcion.length

  // Lógica de ajuste automático - MÁS NIVELES
  if (longitud <= 15) return 60 // Descripciones muy cortas
  if (longitud <= 25) return 52 // Descripciones cortas
  if (longitud <= 35) return 46 // Descripciones medianas
  if (longitud <= 45) return 40 // Descripciones un poco largas
  if (longitud <= 60) return 34 // Descripciones largas
  if (longitud <= 80) return 28 // Descripciones muy largas
  if (longitud <= 100) return 24 // Descripciones extra largas
  return 20 // Descripciones gigantes
}

/**
 * Calcula el tamaño del código numérico según su longitud
 * @param {string} codigo - Código del artículo
 * @returns {number} - Tamaño de fuente (40, 45 o 50pt)
 */
const calcularTamanoCodigoNumerico = (codigo) => {
  const longitud = codigo.length

  // Si la descripción es muy larga, reducir el código de arriba
  if (longitud <= 13) return 50 // Códigos cortos
  if (longitud <= 15) return 45 // Códigos medianos
  return 40 // Códigos largos (más de 15)
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
  const margen = 4 // mm - Margen en todos los bordes

  // CÓDIGO DEL ARTÍCULO (arriba, centrado, ajustable)
  // Área útil (descontando márgenes)
  const anchoUtil = anchoHoja - margen * 2 // 150 - 8 = 142mm

  // ===== DIV 1: CÓDIGO DEL ARTÍCULO (arriba) =====
  // Para ajustar posición vertical: modificá "margen + 11"
  // Para ajustar tamaño: modificá la función calcularTamanoCodigoNumerico()
  pdf.setFontSize(tamanoCodigoNumerico)
  pdf.setFont('helvetica', 'bold')
  const anchoCodigo = pdf.getTextWidth(codigo)
  pdf.text(codigo, (anchoHoja - anchoCodigo) / 2, margen + 11)

  // ===== DIV 2: CÓDIGO DE BARRAS =====
  // Para ajustar posición: modificá "margen + 14"
  // Para ajustar tamaño: modificá anchoBarra y altoBarra
  const anchoBarra = 120
  const altoBarra = 20
  pdf.addImage(
    imagenCodigoBarra,
    'PNG',
    (anchoHoja - anchoBarra) / 2,
    margen + 14,
    anchoBarra,
    altoBarra,
  )

  // ===== DIV 3: DESCRIPCIÓN (adaptativa) =====
  pdf.setFontSize(tamanoDescripcion)
  pdf.setFont('helvetica', 'bold')

  // Dividir texto respetando márgenes (máximo 7 líneas)
  const maxAncho = anchoUtil - 4
  const lineasDescripcion = pdf.splitTextToSize(descripcion, maxAncho)

  // Limitar a máximo 7 líneas
  const lineasMaximas = lineasDescripcion.slice(0, 7)

  // Calcular posición Y dinámica según cantidad de líneas
  let yDescripcion
  if (lineasMaximas.length === 1) {
    yDescripcion = 55 // 1 línea: más abajo
  } else if (lineasMaximas.length === 2) {
    yDescripcion = 55 // 2 líneas: igual
  } else if (lineasMaximas.length === 3) {
    yDescripcion = 52 // 3 líneas: un poco más arriba
  } else if (lineasMaximas.length === 4) {
    yDescripcion = 50 // 4 líneas: más arriba
  } else if (lineasMaximas.length === 5) {
    yDescripcion = 48 // 5 líneas: bastante arriba
  } else if (lineasMaximas.length === 6) {
    yDescripcion = 46 // 6 líneas: muy arriba
  } else {
    yDescripcion = 44 // 7 líneas: super arriba para que entre todo
  }

  // Renderizar líneas centradas
  lineasMaximas.forEach((linea, index) => {
    const anchoLinea = pdf.getTextWidth(linea)
    const interlineado = tamanoDescripcion * 0.35
    pdf.text(linea, (anchoHoja - anchoLinea) / 2, yDescripcion + index * interlineado)
  })

  // UBICACIÓN (esquina inferior izquierda, pequeño)
  // ===== DIV 4: UBICACIÓN (fija abajo izquierda) =====
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(ubicacion || 'Sin ubicación', margen, altoHoja - margen)
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
