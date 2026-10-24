// GeneradorCodigoBarra.js
import JsBarcode from 'jsbarcode'

/**
 * Genera un código de barras en formato PNG base64
 * @param {string} codigo - Código del artículo a convertir en código de barras
 * @param {string} tamano - Tamaño de la etiqueta ('chico', 'mediano', 'grande')
 * @returns {Promise<string>} - Imagen PNG en base64
 */
export const generarCodigoBarraPNG = async (codigo, tamano = 'grande') => {
  try {
    // Validar que el código no esté vacío
    if (!codigo || codigo.trim() === '') {
      throw new Error('El código no puede estar vacío')
    }

    // Configuración de tamaños según etiqueta
    const configuraciones = {
      grande: {
        height: 80, // Altura del código de barras
        fontSize: 26, // Tamaño de fuente fijo
        width: 3, // Ancho de las barras
        margin: 0, // Margen
      },
      mediano: {
        height: 60,
        fontSize: 20,
        width: 2,
        margin: 0,
      },
      chico: {
        height: 40,
        fontSize: 16,
        width: 2,
        margin: 0,
      },
    }

    const config = configuraciones[tamano] || configuraciones.grande

    // Crear un canvas temporal en memoria
    const canvas = document.createElement('canvas')

    // CODE39 agrega los asteriscos automáticamente
    // NO agregar asteriscos manualmente, la librería lo hace
    JsBarcode(canvas, codigo.toUpperCase(), {
      format: 'CODE39', // Formato Code 39
      height: config.height,
      fontSize: config.fontSize,
      width: config.width,
      margin: config.margin,
      displayValue: false, // NO mostrar el texto debajo (lo ponemos nosotros después)
      background: '#ffffff', // Fondo blanco
      lineColor: '#000000', // Barras negras
    })

    // Convertir el canvas a base64 PNG
    const imagenBase64 = canvas.toDataURL('image/png')

    return imagenBase64
  } catch (error) {
    console.error('[GeneradorCodigoBarra] Error generando código de barras:', error)
    throw error
  }
}

/**
 * Valida si un código es compatible con Code 39
 * @param {string} codigo - Código a validar
 * @returns {boolean} - true si es válido
 */
export const validarCodigoParaBarra = (codigo) => {
  // Code 39 acepta: A-Z, 0-9, y algunos símbolos especiales (-, ., $, /, +, %, espacio)
  const caracteresValidos = /^[A-Z0-9\-.$/+%\s]+$/i
  return caracteresValidos.test(codigo)
}

/**
 * Limpia un código para que sea compatible con Code 39
 * @param {string} codigo - Código a limpiar
 * @returns {string} - Código limpio
 */
export const limpiarCodigoParaBarra = (codigo) => {
  // Convertir a mayúsculas y quitar caracteres no válidos
  return codigo
    .toUpperCase()
    .replace(/[^A-Z0-9\-.$/+%\s]/g, '')
    .trim()
}

export const obtenerTramosCodigoBarra = (codigo) => {
  const codigoLimpio = limpiarCodigoParaBarra(String(codigo || ''))
  if (!codigoLimpio || !validarCodigoParaBarra(codigoLimpio)) return []
  const lienzo = document.createElement('canvas')
  try {
    JsBarcode(lienzo, codigoLimpio, {
      format: 'CODE39',
      displayValue: false,
      background: '#ffffff',
      lineColor: '#000000',
      margin: 0,
      width: 3,
      height: 42,
    })
    const pixeles = lienzo.getContext('2d').getImageData(0, Math.floor(lienzo.height / 2), lienzo.width, 1).data
    const tramos = []
    let inicio = -1
    for (let x = 0; x <= lienzo.width; x += 1) {
      const esNegro = x < lienzo.width && pixeles[x * 4] < 128
      if (esNegro && inicio < 0) inicio = x
      if (!esNegro && inicio >= 0) {
        tramos.push({ inicio: inicio / lienzo.width, ancho: (x - inicio) / lienzo.width })
        inicio = -1
      }
    }
    return tramos
  } finally {
    lienzo.width = 0
    lienzo.height = 0
  }
}
