// GeneradorEtiquetasWord.js
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  convertMillimetersToTwip,
} from 'docx'
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
  if (longitud <= 45) return 42 // Descripciones largas
  return 40 // Descripciones muy largas
}

/**
 * Crea una página de etiqueta individual
 * @param {Object} etiqueta - Datos de la etiqueta
 * @returns {Promise<Array>} - Array de párrafos para la página
 */
const crearPaginaEtiqueta = async (etiqueta) => {
  const { codigo, descripcion, ubicacion } = etiqueta

  // Generar código de barras
  const imagenCodigoBarra = await generarCodigoBarraPNG(codigo, 'grande')

  // Convertir base64 a buffer
  const base64Data = imagenCodigoBarra.split(',')[1]
  const bufferImagen = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

  // Calcular tamaño de fuente para descripción
  const tamanoDescripcion = calcularTamanoFuenteDescripcion(descripcion)

  // Crear párrafos de la etiqueta
  const parrafos = [
    // CÓDIGO DEL ARTÍCULO (arriba, centrado, grande)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: codigo,
          size: 50 * 2, // 50pt en half-points
          bold: true,
          font: 'Arial',
        }),
      ],
    }),

    // CÓDIGO DE BARRAS (centrado, imagen PNG)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [
        new ImageRun({
          data: bufferImagen,
          transformation: {
            width: 280, // Ancho en pixels
            height: 100, // Alto en pixels
          },
        }),
      ],
    }),

    // DESCRIPCIÓN (centrado, tamaño automático, bold)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 150, after: 400 },
      children: [
        new TextRun({
          text: descripcion,
          size: tamanoDescripcion * 2, // Convertir pt a half-points
          bold: true,
          font: 'Arial',
        }),
      ],
    }),

    // UBICACIÓN (esquina inferior izquierda, pequeño)
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 600 },
      children: [
        new TextRun({
          text: ubicacion || 'Sin ubicación',
          size: 10 * 2, // 10pt en half-points
          font: 'Arial',
        }),
      ],
    }),
  ]

  return parrafos
}

/**
 * Genera documento Word con todas las etiquetas
 * @param {Array} listaEtiquetas - Array de etiquetas a imprimir
 * @returns {Promise<Object>} - {exito, mensaje, rutaArchivo}
 */
export const generarDocumentoEtiquetas = async (listaEtiquetas) => {
  try {
    console.log(
      '[GeneradorEtiquetasWord] Generando documento con',
      listaEtiquetas.length,
      'etiquetas',
    )

    if (!listaEtiquetas || listaEtiquetas.length === 0) {
      throw new Error('No hay etiquetas para generar')
    }

    // Array para almacenar todas las secciones del documento
    const seccionesDocumento = []

    // Generar páginas para cada etiqueta (respetando cantidad de copias)
    for (const etiqueta of listaEtiquetas) {
      const cantidadCopias = etiqueta.cantidad || 1

      // Generar copias de la misma etiqueta
      for (let i = 0; i < cantidadCopias; i++) {
        const parrafosEtiqueta = await crearPaginaEtiqueta(etiqueta)
        seccionesDocumento.push(...parrafosEtiqueta)

        // Agregar salto de página (excepto en la última etiqueta)
        const esUltima =
          etiqueta === listaEtiquetas[listaEtiquetas.length - 1] && i === cantidadCopias - 1
        if (!esUltima) {
          seccionesDocumento.push(
            new Paragraph({
              pageBreakBefore: true,
            }),
          )
        }
      }
    }

    // Crear documento con configuración de página personalizada
    const documento = new Document({
      sections: [
        {
          properties: {
            page: {
              width: convertMillimetersToTwip(100), // 10cm de ancho
              height: convertMillimetersToTwip(150), // 15cm de alto
              margin: {
                top: convertMillimetersToTwip(5),
                right: convertMillimetersToTwip(5),
                bottom: convertMillimetersToTwip(5),
                left: convertMillimetersToTwip(5),
              },
            },
          },
          children: seccionesDocumento,
        },
      ],
    })

    // Generar archivo Word en memoria
    const blob = await Packer.toBlob(documento)

    // Convertir blob a base64 para Capacitor
    const reader = new FileReader()
    const base64Promise = new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

    const base64Data = await base64Promise

    // Guardar en filesystem temporal
    const nombreArchivo = `etiquetas_${new Date().getTime()}.docx`
    const resultado = await Filesystem.writeFile({
      path: nombreArchivo,
      data: base64Data,
      directory: Directory.Cache,
    })

    console.log('[GeneradorEtiquetasWord] ✅ Documento generado:', resultado.uri)

    return {
      exito: true,
      mensaje: 'Documento generado correctamente',
      rutaArchivo: resultado.uri,
      nombreArchivo,
    }
  } catch (error) {
    console.error('[GeneradorEtiquetasWord] ❌ Error:', error)
    return {
      exito: false,
      mensaje: error.message || 'Error al generar documento',
      rutaArchivo: null,
    }
  }
}
