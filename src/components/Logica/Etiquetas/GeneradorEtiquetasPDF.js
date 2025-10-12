// GeneradorEtiquetasPDF.js
import { jsPDF } from 'jspdf'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { generarCodigoBarraPNG } from './GeneradorCodigoBarra.js'

/**
 * Calcula el tamaño de fuente óptimo para la descripción según configuración
 * @param {string} descripcion - Texto de la descripción
 * @param {Object} configDescripcion - Configuración de descripción
 * @returns {number} - Tamaño de fuente en puntos
 */
const calcularTamanoFuenteDescripcion = (descripcion, configDescripcion) => {
  const longitud = descripcion.length
  const { tamanosAutomaticos } = configDescripcion

  if (longitud <= tamanosAutomaticos.muyCorta.hasta) {
    return tamanosAutomaticos.muyCorta.tamano
  }
  if (longitud <= tamanosAutomaticos.corta.hasta) {
    return tamanosAutomaticos.corta.tamano
  }
  if (longitud <= tamanosAutomaticos.mediana.hasta) {
    return tamanosAutomaticos.mediana.tamano
  }
  if (longitud <= tamanosAutomaticos.larga.hasta) {
    return tamanosAutomaticos.larga.tamano
  }
  if (longitud <= tamanosAutomaticos.muyLarga.hasta) {
    return tamanosAutomaticos.muyLarga.tamano
  }
  if (longitud <= tamanosAutomaticos.extraLarga.hasta) {
    return tamanosAutomaticos.extraLarga.tamano
  }
  return tamanosAutomaticos.gigante.tamano
}

/**
 * Divide texto en múltiples líneas según ancho máximo
 * @param {jsPDF} pdf - Instancia de jsPDF
 * @param {string} texto - Texto a dividir
 * @param {number} anchoMaximo - Ancho máximo en mm
 * @returns {Array<string>} - Array de líneas
 */
const dividirTextoEnLineas = (pdf, texto, anchoMaximo) => {
  const palabras = texto.split(' ')
  const lineas = []
  let lineaActual = ''

  palabras.forEach((palabra) => {
    const lineaPrueba = lineaActual ? `${lineaActual} ${palabra}` : palabra
    const anchoLineaPrueba = pdf.getTextWidth(lineaPrueba)

    if (anchoLineaPrueba <= anchoMaximo) {
      lineaActual = lineaPrueba
    } else {
      if (lineaActual) lineas.push(lineaActual)
      lineaActual = palabra
    }
  })

  if (lineaActual) lineas.push(lineaActual)
  return lineas
}

/**
 * Crea una página de etiqueta individual en el PDF
 * @param {jsPDF} pdf - Instancia de jsPDF
 * @param {Object} etiqueta - Datos de la etiqueta
 * @param {Object} configuracion - Configuración de la etiqueta
 */
const crearPaginaEtiqueta = async (pdf, etiqueta, configuracion) => {
  const { codigo, descripcion, ubicacion } = etiqueta
  const {
    pagina,
    codigoArticulo,
    codigoBarra,
    descripcion: configDesc,
    ubicacion: configUbic,
  } = configuracion

  const anchoHoja = pagina.ancho
  const margen = pagina.margenes.todos

  // ===== DIV 1: CÓDIGO DEL ARTÍCULO (arriba) =====
  pdf.setFont(codigoArticulo.fuenteNombre, codigoArticulo.fuenteEstilo)
  pdf.setFontSize(codigoArticulo.tamanoFuente)

  const xCentro = anchoHoja / 2
  pdf.text(codigo, xCentro, codigoArticulo.posicionY, { align: codigoArticulo.alineacion })

  // ===== DIV 2: CÓDIGO DE BARRAS =====
  try {
    const imagenCodigoBarra = await generarCodigoBarraPNG(codigo, codigoBarra.tamanoBarras)
    const base64Data = imagenCodigoBarra.split(',')[1]

    const xCodigoBarra = codigoBarra.centrado ? (anchoHoja - codigoBarra.ancho) / 2 : margen

    pdf.addImage(
      `data:image/png;base64,${base64Data}`,
      'PNG',
      xCodigoBarra,
      codigoBarra.posicionY,
      codigoBarra.ancho,
      codigoBarra.alto,
    )
  } catch (error) {
    console.error('[crearPaginaEtiqueta] Error al agregar código de barras:', error)
  }

  // ===== DIV 3: DESCRIPCIÓN (centrada, tamaño y posición adaptativa) =====
  const tamanoDescripcion = calcularTamanoFuenteDescripcion(descripcion, configDesc)
  pdf.setFont(configDesc.fuenteNombre, configDesc.fuenteEstilo)
  pdf.setFontSize(tamanoDescripcion)

  // Dividir texto en líneas
  const lineasDescripcion = dividirTextoEnLineas(pdf, descripcion, configDesc.anchoMaximo)

  // Limitar a máximo de líneas configurado
  const lineasMaximas = lineasDescripcion.slice(0, configDesc.maximoLineas)

  // Calcular posición Y dinámica según cantidad de líneas
  const cantidadLineas = lineasMaximas.length
  const yDescripcion =
    configDesc.posicionesYPorLineas[cantidadLineas] || configDesc.posicionesYPorLineas[7] // Default: posición para 7 líneas

  // Renderizar líneas centradas
  lineasMaximas.forEach((linea, index) => {
    const anchoLinea = pdf.getTextWidth(linea)
    const interlineado = tamanoDescripcion * configDesc.interlineadoFactor
    pdf.text(linea, (anchoHoja - anchoLinea) / 2, yDescripcion + index * interlineado)
  })

  // ===== DIV 4: UBICACIÓN (fija abajo izquierda) =====
  pdf.setFontSize(configUbic.tamanoFuente)
  pdf.setFont(configUbic.fuenteNombre, configUbic.fuenteEstilo)

  const textoUbicacion = ubicacion || 'Sin ubicación'
  pdf.text(textoUbicacion, configUbic.posicionX, configUbic.posicionY, {
    align: configUbic.alineacion,
  })
}

/**
 * Genera documento PDF con todas las etiquetas usando la configuración especificada
 * @param {Array} listaEtiquetas - Array de etiquetas a imprimir
 * @param {Object} configuracion - Configuración de etiqueta (ConfiguracionEtiqueta10x15, etc.)
 * @returns {Promise<Object>} - {exito, mensaje, rutaArchivo, nombreArchivo}
 */
export const generarDocumentoEtiquetas = async (listaEtiquetas, configuracion) => {
  try {
    console.log(
      '[GeneradorEtiquetasPDF] Generando documento con',
      listaEtiquetas.length,
      'etiquetas usando configuración:',
      configuracion.nombre,
    )

    if (!listaEtiquetas || listaEtiquetas.length === 0) {
      throw new Error('No hay etiquetas para generar')
    }

    if (!configuracion) {
      throw new Error('No se proporcionó configuración de etiqueta')
    }

    const { pagina } = configuracion

    // Crear PDF con dimensiones personalizadas (en mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pagina.ancho, pagina.alto],
    })

    // Configurar propiedades del documento
    pdf.setProperties({
      title: `Etiquetas ${configuracion.nombre}`,
      subject: 'Etiquetas con códigos de barras',
      author: 'Sistema de Etiquetas',
      creator: 'GeneradorEtiquetasPDF',
    })

    let esPrimeraPagina = true

    // Generar páginas para cada etiqueta (respetando cantidad de copias)
    for (const etiqueta of listaEtiquetas) {
      const cantidadCopias = etiqueta.cantidad || 1

      // Generar copias de la misma etiqueta
      for (let i = 0; i < cantidadCopias; i++) {
        // Agregar nueva página (excepto la primera)
        if (!esPrimeraPagina) {
          pdf.addPage([pagina.ancho, pagina.alto])
        }
        esPrimeraPagina = false

        // Crear contenido de la etiqueta
        await crearPaginaEtiqueta(pdf, etiqueta, configuracion)
      }
    }

    // Convertir PDF a base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1]

    // Guardar en filesystem temporal
    const nombreArchivo = `etiquetas_${configuracion.id}_${new Date().getTime()}.pdf`
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
