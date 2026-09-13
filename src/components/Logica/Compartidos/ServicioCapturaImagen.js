import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import {
  limpiarCapturaPendiente,
  registrarCapturaPendiente,
} from 'src/components/Logica/Compartidos/ServicioRecuperacionCapturaImagen.js'

export const ORIGENES_CAPTURA_IMAGEN = Object.freeze({
  CAMARA: 'camara',
  GALERIA: 'galeria',
})

export const CODIGOS_ERROR_CAPTURA_IMAGEN = Object.freeze({
  CANCELADA: 'cancelada',
  PERMISO: 'permiso',
  NO_DISPONIBLE: 'noDisponible',
  FORMATO_INVALIDO: 'formatoInvalido',
  LECTURA_FALLIDA: 'lecturaFallida',
  TAMANO_EXCEDIDO: 'tamanoExcedido',
  DESCONOCIDO: 'desconocido',
})

export const DIMENSION_MAXIMA_IMAGEN = 3072
export const CALIDAD_INICIAL_IMAGEN = 0.86
export const CALIDAD_MINIMA_IMAGEN = 0.5
export const MAXIMO_BYTES_IMAGEN = 6.5 * 1024 * 1024

const PASO_CALIDAD_IMAGEN = 0.12
const FACTOR_REDUCCION_DIMENSION = 0.82
const MAXIMO_INTENTOS_PREPARACION = 10
const FORMATOS_IMAGEN_ADMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp'])

export class ErrorCapturaImagen extends Error {
  constructor(codigo, mensaje, causa = null) {
    super(mensaje)
    this.name = 'ErrorCapturaImagen'
    this.codigo = codigo
    this.causa = causa
  }
}

function normalizarFormato(formato) {
  const valor = String(formato || '')
    .trim()
    .toLowerCase()
  if (valor === 'jpg' || valor === 'jpeg' || valor === 'image/jpg') return 'image/jpeg'
  if (valor === 'png') return 'image/png'
  if (valor === 'webp') return 'image/webp'
  return valor
}

function obtenerCodigoError(error) {
  const mensaje = String(error?.message || error || '').toLowerCase()
  if (/cancel|cancelled|canceled|no image selected|no image picked/.test(mensaje)) {
    return CODIGOS_ERROR_CAPTURA_IMAGEN.CANCELADA
  }
  if (/permission|permiso|denied|denegad/.test(mensaje)) {
    return CODIGOS_ERROR_CAPTURA_IMAGEN.PERMISO
  }
  if (/not available|unavailable|no camera|not implemented/.test(mensaje)) {
    return CODIGOS_ERROR_CAPTURA_IMAGEN.NO_DISPONIBLE
  }
  return CODIGOS_ERROR_CAPTURA_IMAGEN.DESCONOCIDO
}

export function clasificarErrorCapturaImagen(error) {
  if (error instanceof ErrorCapturaImagen) return error
  const codigo = obtenerCodigoError(error)
  const mensajes = {
    [CODIGOS_ERROR_CAPTURA_IMAGEN.CANCELADA]: 'La selección de imagen fue cancelada.',
    [CODIGOS_ERROR_CAPTURA_IMAGEN.PERMISO]: 'No hay permiso para acceder a la imagen.',
    [CODIGOS_ERROR_CAPTURA_IMAGEN.NO_DISPONIBLE]: 'La cámara o galería no está disponible.',
    [CODIGOS_ERROR_CAPTURA_IMAGEN.DESCONOCIDO]: 'No se pudo obtener la imagen.',
  }
  return new ErrorCapturaImagen(codigo, mensajes[codigo], error)
}

function cargarImagen(url) {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image()
    imagen.onload = () => resolver(imagen)
    imagen.onerror = (error) => rechazar(error)
    imagen.src = url
  })
}

function convertirCanvasABlob(canvas, calidad) {
  return new Promise((resolver, rechazar) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolver(blob)
        else rechazar(new Error('El navegador no pudo convertir la imagen a JPEG.'))
      },
      'image/jpeg',
      calidad,
    )
  })
}

function convertirBlobABase64(blob) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => {
      const resultado = String(lector.result || '')
      resolver(resultado.includes(',') ? resultado.slice(resultado.indexOf(',') + 1) : resultado)
    }
    lector.onerror = () => rechazar(lector.error || new Error('No se pudo leer la imagen.'))
    lector.readAsDataURL(blob)
  })
}

function calcularDimensiones(anchoOriginal, altoOriginal, dimensionMaxima) {
  const escala = Math.min(1, dimensionMaxima / anchoOriginal, dimensionMaxima / altoOriginal)
  return {
    ancho: Math.max(1, Math.round(anchoOriginal * escala)),
    alto: Math.max(1, Math.round(altoOriginal * escala)),
  }
}

function validarOrigen(origen) {
  if (!Object.values(ORIGENES_CAPTURA_IMAGEN).includes(origen)) {
    throw new ErrorCapturaImagen(
      CODIGOS_ERROR_CAPTURA_IMAGEN.NO_DISPONIBLE,
      'El origen de imagen no es válido.',
    )
  }
}

export async function prepararImagenCapturada({ url, formato, origen }) {
  validarOrigen(origen)
  if (!url || typeof url !== 'string') {
    throw new ErrorCapturaImagen(
      CODIGOS_ERROR_CAPTURA_IMAGEN.LECTURA_FALLIDA,
      'La imagen seleccionada no tiene una ruta legible.',
    )
  }
  let urlTemporal = ''
  let imagen = null
  let canvas = null
  try {
    const respuesta = await fetch(url)
    if (!respuesta.ok) throw new Error(`No se pudo leer la imagen (${respuesta.status}).`)
    const blobEntrada = await respuesta.blob()
    const tipoEntrada = normalizarFormato(formato || blobEntrada.type)
    if (!FORMATOS_IMAGEN_ADMITIDOS.has(tipoEntrada)) {
      throw new ErrorCapturaImagen(
        CODIGOS_ERROR_CAPTURA_IMAGEN.FORMATO_INVALIDO,
        'El formato de imagen no es compatible. Usá JPEG, PNG o WebP.',
      )
    }
    urlTemporal = URL.createObjectURL(blobEntrada)
    imagen = await cargarImagen(urlTemporal)
    if (!imagen.naturalWidth || !imagen.naturalHeight) {
      throw new Error('La imagen no contiene dimensiones válidas.')
    }
    canvas = document.createElement('canvas')
    const contexto = canvas.getContext('2d')
    if (!contexto) throw new Error('El navegador no permite preparar la imagen.')
    let dimensionMaxima = DIMENSION_MAXIMA_IMAGEN
    let calidad = CALIDAD_INICIAL_IMAGEN
    for (let intento = 0; intento < MAXIMO_INTENTOS_PREPARACION; intento += 1) {
      const dimensiones = calcularDimensiones(
        imagen.naturalWidth,
        imagen.naturalHeight,
        dimensionMaxima,
      )
      canvas.width = dimensiones.ancho
      canvas.height = dimensiones.alto
      contexto.fillStyle = '#ffffff'
      contexto.fillRect(0, 0, dimensiones.ancho, dimensiones.alto)
      contexto.drawImage(imagen, 0, 0, dimensiones.ancho, dimensiones.alto)
      const blobSalida = await convertirCanvasABlob(canvas, calidad)
      const bytesBase64Estimados = Math.ceil(blobSalida.size / 3) * 4
      if (bytesBase64Estimados <= MAXIMO_BYTES_IMAGEN) {
        const base64 = await convertirBlobABase64(blobSalida)
        return {
          base64,
          mimeType: 'image/jpeg',
          ancho: dimensiones.ancho,
          alto: dimensiones.alto,
          tamanoBytes: blobSalida.size,
          origen,
        }
      }
      if (calidad > CALIDAD_MINIMA_IMAGEN) {
        calidad = Math.max(CALIDAD_MINIMA_IMAGEN, calidad - PASO_CALIDAD_IMAGEN)
      } else {
        dimensionMaxima = Math.max(1, Math.round(dimensionMaxima * FACTOR_REDUCCION_DIMENSION))
      }
    }
    throw new ErrorCapturaImagen(
      CODIGOS_ERROR_CAPTURA_IMAGEN.TAMANO_EXCEDIDO,
      'La imagen es demasiado grande para procesarla.',
    )
  } catch (error) {
    if (error instanceof ErrorCapturaImagen) throw error
    throw new ErrorCapturaImagen(
      CODIGOS_ERROR_CAPTURA_IMAGEN.LECTURA_FALLIDA,
      'No se pudo leer o preparar la imagen.',
      error,
    )
  } finally {
    if (urlTemporal) URL.revokeObjectURL(urlTemporal)
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
    }
    imagen = null
    canvas = null
  }
}

export function prepararResultadoCapturaImagen(resultado, origen) {
  const url =
    resultado?.webPath || (resultado?.path ? Capacitor.convertFileSrc(resultado.path) : '')
  return prepararImagenCapturada({ url, formato: resultado?.format, origen })
}

export async function capturarImagen({ origen, metadatosRecuperacion = null }) {
  validarOrigen(origen)
  const idCaptura = String(metadatosRecuperacion?.idCaptura || '').trim()
  if (metadatosRecuperacion) {
    await registrarCapturaPendiente({ ...metadatosRecuperacion, origen })
  }
  try {
    const foto = await Camera.getPhoto({
      source: origen === ORIGENES_CAPTURA_IMAGEN.CAMARA ? CameraSource.Camera : CameraSource.Photos,
      direction: CameraDirection.Rear,
      resultType: CameraResultType.Uri,
      quality: Math.round(CALIDAD_INICIAL_IMAGEN * 100),
      width: DIMENSION_MAXIMA_IMAGEN,
      height: DIMENSION_MAXIMA_IMAGEN,
      correctOrientation: true,
      allowEditing: false,
      saveToGallery: false,
      webUseInput: Capacitor.getPlatform() === 'web',
    })
    return await prepararResultadoCapturaImagen(foto, origen)
  } catch (error) {
    throw clasificarErrorCapturaImagen(error)
  } finally {
    if (idCaptura) {
      try {
        await limpiarCapturaPendiente(idCaptura)
      } catch (error) {
        console.warn('[ServicioCapturaImagen] No se pudieron limpiar los metadatos.', error)
      }
    }
  }
}
