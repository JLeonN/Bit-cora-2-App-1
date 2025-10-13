// GeneradorEtiquetasPDF.js
import { jsPDF } from 'jspdf'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { generarCodigoBarraPNG } from './GeneradorCodigoBarra.js'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

/**
 * Detecta si estamos en un navegador web o en una app móvil
 */
const esNavegador = () => {
  return !window.Capacitor || window.Capacitor.getPlatform() === 'web'
}

/**
 * Descarga el PDF directamente en el navegador
 */
const descargarPDFEnNavegador = (pdf, nombreArchivo) => {
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  link.click()
  URL.revokeObjectURL(url)
}

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

  // ===== DIV 1: CÓDIGO DEL ARTÍCULO (arriba - ADAPTATIVO) =====
  pdf.setFont(codigoArticulo.fuenteNombre, codigoArticulo.fuenteEstilo)

  // Calcular tamaño según longitud del código
  let tamanoCodigoFuente = 50 // default
  if (codigoArticulo.tamanosAutomaticos) {
    const longitudCodigo = codigo.length
    const { tamanosAutomaticos } = codigoArticulo

    if (longitudCodigo <= tamanosAutomaticos.corto.hasta) {
      tamanoCodigoFuente = tamanosAutomaticos.corto.tamano
    } else if (longitudCodigo <= tamanosAutomaticos.mediano.hasta) {
      tamanoCodigoFuente = tamanosAutomaticos.mediano.tamano
    } else if (longitudCodigo <= tamanosAutomaticos.largo.hasta) {
      tamanoCodigoFuente = tamanosAutomaticos.largo.tamano
    } else {
      tamanoCodigoFuente = tamanosAutomaticos.muyLargo.tamano
    }
  } else {
    tamanoCodigoFuente = codigoArticulo.tamanoFuente || 50
  }

  pdf.setFontSize(tamanoCodigoFuente)

  const xCodigo = codigoArticulo.posicionX !== undefined ? codigoArticulo.posicionX : anchoHoja / 2
  pdf.text(codigo, xCodigo, codigoArticulo.posicionY, { align: codigoArticulo.alineacion })

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

  // ===== DIV 4: UBICACIÓN (abajo) =====
  pdf.setFontSize(configUbic.tamanoFuente)
  pdf.setFont(configUbic.fuenteNombre, configUbic.fuenteEstilo)

  const textoUbicacion = ubicacion || 'Sin ubicación'
  const xUbicacion = configUbic.posicionX !== undefined ? configUbic.posicionX : anchoHoja / 2
  pdf.text(textoUbicacion, xUbicacion, configUbic.posicionY, {
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
      orientation: 'landscape',
      unit: 'mm',
      format: [pagina.alto, pagina.ancho],
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
          pdf.addPage([pagina.alto, pagina.ancho])
        }
        esPrimeraPagina = false

        // Crear contenido de la etiqueta
        await crearPaginaEtiqueta(pdf, etiqueta, configuracion)
      }
    }

    // Obtener nombre de usuario
    const nombreUsuario = await obtenerNombreUsuario()

    // Formatear el ID de configuración sin espacios (10x15 cm -> 10x15cm)
    const idConfiguracionFormateado = configuracion.id.replace(/\s/g, '')

    // Construir nombre del archivo
    const nombreArchivo = `Etiquetas - ${nombreUsuario} - ${idConfiguracionFormateado}.pdf`

    // ===== SI ESTAMOS EN NAVEGADOR, DESCARGAR DIRECTAMENTE =====
    if (esNavegador()) {
      descargarPDFEnNavegador(pdf, nombreArchivo)

      console.log('[GeneradorEtiquetasPDF] ✅ PDF descargado en navegador')

      return {
        exito: true,
        mensaje: 'PDF descargado correctamente',
        rutaArchivo: null,
        nombreArchivo,
      }
    }

    // ===== SI ESTAMOS EN MÓVIL, USAR CAPACITOR =====
    // Convertir PDF a base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1]

    // Guardar en filesystem temporal
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
