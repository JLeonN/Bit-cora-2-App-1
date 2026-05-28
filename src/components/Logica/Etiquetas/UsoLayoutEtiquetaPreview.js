import { ref } from 'vue'
import { configuracionEtiqueta10x15 } from './ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta10x15.js'

const FAMILIA_FUENTE_ETIQUETA = "'Arial Black', Arial, Helvetica, sans-serif"
const ANCHO_REFERENCIA_PREVIEW = 1500
const MM_POR_PT = 0.352777778

const crearContextoMedicion = () => {
  if (typeof document === 'undefined') {
    return null
  }
  const lienzo = document.createElement('canvas')
  return lienzo.getContext('2d')
}

const contextoMedicion = crearContextoMedicion()

const medirAnchoTexto = (texto, tamanoPx, peso = 800) => {
  if (!texto || tamanoPx <= 0) {
    return 0
  }
  if (!contextoMedicion) {
    return texto.length * tamanoPx * 0.55
  }
  contextoMedicion.font = `${peso} ${tamanoPx}px ${FAMILIA_FUENTE_ETIQUETA}`
  return contextoMedicion.measureText(texto).width
}

const normalizarSaltosDescripcion = (descripcion = '') => String(descripcion).replace(/\r\n/g, '\n').replace(/\r/g, '\n')
const normalizarTextoDescripcion = (descripcion = '') => normalizarSaltosDescripcion(descripcion).replace(/\s+/g, ' ').trim().toUpperCase()
const contarLineasManualesDescripcion = (descripcion = '') => normalizarSaltosDescripcion(descripcion).split('\n').filter((linea) => linea.trim()).length

const obtenerLineasObjetivoDescripcion = (descripcion) => {
  const largo = normalizarTextoDescripcion(descripcion).length
  if (largo <= 24) return 2
  if (largo <= 56) return 3
  if (largo <= 78) return 4
  return 5
}

const dividirBloqueEnLineas = (texto, anchoMaximoPx, tamanoPx, peso = 800) => {
  const palabras = String(texto || '').replace(/\s+/g, ' ').trim().toUpperCase().split(' ').filter(Boolean)
  if (!palabras.length) {
    return []
  }
  const lineas = []
  let lineaActual = palabras[0]
  for (let i = 1; i < palabras.length; i += 1) {
    const candidato = `${lineaActual} ${palabras[i]}`
    if (medirAnchoTexto(candidato, tamanoPx, peso) <= anchoMaximoPx) {
      lineaActual = candidato
    } else {
      lineas.push(lineaActual)
      lineaActual = palabras[i]
    }
  }
  lineas.push(lineaActual)
  return lineas
}

const dividirTextoEnLineas = (texto, anchoMaximoPx, tamanoPx, peso = 800) => {
  const textoNormalizado = normalizarSaltosDescripcion(texto)
  const bloques = textoNormalizado.split('\n')
  const tieneSaltosManuales = bloques.length > 1
  const lineas = []
  for (const bloque of bloques) {
    if (tieneSaltosManuales) {
      const bloqueNormalizado = String(bloque || '').replace(/\s+/g, ' ').trim().toUpperCase()
      if (bloqueNormalizado) {
        lineas.push(bloqueNormalizado)
      }
      continue
    }
    const lineasBloque = dividirBloqueEnLineas(bloque, anchoMaximoPx, tamanoPx, peso)
    if (lineasBloque.length) {
      lineas.push(...lineasBloque)
    }
  }
  return lineas
}

const ajustarTamanoTextoEnUnaLinea = (texto, tamanoInicialPx, tamanoMinimoPx, anchoMaximoPx, peso = 800) => {
  let tamanoActual = tamanoInicialPx
  while (tamanoActual > tamanoMinimoPx && medirAnchoTexto(texto, tamanoActual, peso) > anchoMaximoPx) {
    tamanoActual -= 1
  }
  return Number(tamanoActual.toFixed(2))
}

const obtenerAnchoCodigoBarraMm = (codigo) => {
  const largoCodigo = String(codigo || '').trim().length
  if (largoCodigo <= 5) return 70
  if (largoCodigo <= 8) return 80
  return 110
}

const calcularLineasDescripcion = (lineas, tamanoBasePx, tamanoMinimoPx, anchoMaximoPx) => {
  return lineas.map((texto) => ({
    texto,
    tamanoPx: ajustarTamanoTextoEnUnaLinea(texto, tamanoBasePx, tamanoMinimoPx, anchoMaximoPx),
  }))
}

const pxAMm = (valorPx, altoReferenciaPx, altoPaginaMm) => (valorPx / altoReferenciaPx) * altoPaginaMm
const pxAPt = (valorPx, altoReferenciaPx, altoPaginaMm) => pxAMm(valorPx, altoReferenciaPx, altoPaginaMm) / MM_POR_PT
const mmAPx = (valorMm, escalaY) => valorMm * escalaY
const ptAPx = (valorPt, escalaY) => valorPt * MM_POR_PT * escalaY

export const calcularLayoutEtiquetaPreview = ({
  etiqueta = {},
  configuracion = configuracionEtiqueta10x15,
  anchoReferenciaPx = ANCHO_REFERENCIA_PREVIEW,
}) => {
  const { pagina } = configuracion
  const altoReferenciaPx = anchoReferenciaPx / (pagina.ancho / pagina.alto)
  const codigoNormalizado = String(etiqueta.codigo || '').trim().toUpperCase()
  const descripcionConSaltos = normalizarSaltosDescripcion(etiqueta.descripcion).trim().toUpperCase()
  const descripcionNormalizada = normalizarTextoDescripcion(etiqueta.descripcion)
  const ubicacionNormalizada = String(etiqueta.ubicacion || 'Sin ubicación').trim() || 'Sin ubicación'
  const anchoMaximoCodigoPx = anchoReferenciaPx * 0.93
  const tamanoCodigoInicialPx = Math.max(22, altoReferenciaPx * 0.19)
  const tamanoCodigoMinimoPx = Math.max(12, altoReferenciaPx * 0.1)
  const tamanoCodigoPx = ajustarTamanoTextoEnUnaLinea(
    codigoNormalizado,
    tamanoCodigoInicialPx,
    tamanoCodigoMinimoPx,
    anchoMaximoCodigoPx,
    900,
  )
  const codigoTopPx = altoReferenciaPx * 0.035
  const codigoAltoPx = tamanoCodigoPx * 1.02
  const barraTopPx = codigoTopPx + codigoAltoPx + altoReferenciaPx * 0.01
  const barraAltoPx = Math.max(26, altoReferenciaPx * 0.14)
  const barraAnchoMm = obtenerAnchoCodigoBarraMm(codigoNormalizado)
  const barraAnchoPx = (barraAnchoMm / pagina.ancho) * anchoReferenciaPx
  const descripcionTopPx = barraTopPx + barraAltoPx + altoReferenciaPx * 0.045
  const ubicacionTamanoPx = Math.max(18, Math.min(36, altoReferenciaPx * 0.09))
  const anchoMaximoDescripcionPx = anchoReferenciaPx * 0.92
  const altoMaximoDescripcionPx = altoReferenciaPx * 0.93 - descripcionTopPx - ubicacionTamanoPx * 0.8
  const lineasObjetivo = obtenerLineasObjetivoDescripcion(descripcionNormalizada)
  const maximoLineasDescripcion = Math.min(5, Math.max(lineasObjetivo + 2, contarLineasManualesDescripcion(descripcionConSaltos)))
  const tamanoDescripcionInicialPx = Math.max(18, altoReferenciaPx * 0.21)
  const tamanoDescripcionMinimoPx = Math.max(11, altoReferenciaPx * 0.08)
  let tamanoDescripcionPx = tamanoDescripcionMinimoPx
  let lineasDescripcion = dividirTextoEnLineas(descripcionConSaltos, anchoMaximoDescripcionPx, tamanoDescripcionMinimoPx)
  for (let tamanoActual = tamanoDescripcionInicialPx; tamanoActual >= tamanoDescripcionMinimoPx; tamanoActual -= 1) {
    const lineas = dividirTextoEnLineas(descripcionConSaltos, anchoMaximoDescripcionPx, tamanoActual)
    const altoTexto = lineas.length * tamanoActual * 0.93
    if (lineas.length <= maximoLineasDescripcion && altoTexto <= altoMaximoDescripcionPx) {
      tamanoDescripcionPx = tamanoActual
      lineasDescripcion = lineas
      break
    }
    lineasDescripcion = lineas
  }
  if (lineasDescripcion.length > maximoLineasDescripcion) {
    lineasDescripcion = lineasDescripcion.slice(0, maximoLineasDescripcion)
  }
  const lineasDescripcionConTamanos = calcularLineasDescripcion(
    lineasDescripcion,
    tamanoDescripcionPx,
    tamanoDescripcionMinimoPx,
    anchoMaximoDescripcionPx,
  ).map((linea) => ({
    ...linea,
    tamanoPt: pxAPt(linea.tamanoPx, altoReferenciaPx, pagina.alto),
  }))
  return {
    codigo: {
      texto: codigoNormalizado,
      tamanoPt: pxAPt(tamanoCodigoPx, altoReferenciaPx, pagina.alto),
      posicionY: pxAMm(codigoTopPx + tamanoCodigoPx * 0.79, altoReferenciaPx, pagina.alto),
    },
    codigoBarra: {
      ancho: pxAMm(barraAnchoPx, altoReferenciaPx, pagina.alto),
      alto: pxAMm(barraAltoPx, altoReferenciaPx, pagina.alto),
      posicionX: (pagina.ancho - pxAMm(barraAnchoPx, altoReferenciaPx, pagina.alto)) / 2,
      posicionY: pxAMm(barraTopPx, altoReferenciaPx, pagina.alto),
    },
    descripcion: {
      lineas: lineasDescripcionConTamanos,
      tamanoPt: pxAPt(tamanoDescripcionPx, altoReferenciaPx, pagina.alto),
      posicionY: pxAMm(descripcionTopPx + tamanoDescripcionPx * 0.79, altoReferenciaPx, pagina.alto),
      interlineadoPt: pxAPt(tamanoDescripcionPx * 0.93, altoReferenciaPx, pagina.alto),
    },
    ubicacion: {
      texto: ubicacionNormalizada,
      tamanoPt: pxAPt(ubicacionTamanoPx, altoReferenciaPx, pagina.alto),
      posicionX: pxAMm(anchoReferenciaPx * 0.015, altoReferenciaPx, pagina.alto),
      posicionY: pagina.alto - pxAMm(altoReferenciaPx * 0.025, altoReferenciaPx, pagina.alto),
    },
  }
}

export const convertirLayoutPreviewAPixeles = ({
  layout,
  configuracion = configuracionEtiqueta10x15,
  anchoPreviewPx = 0,
  altoPreviewPx = 0,
}) => {
  const { pagina } = configuracion
  const escalaX = anchoPreviewPx / pagina.ancho
  const escalaY = altoPreviewPx / pagina.alto
  const lineasDescripcion = layout.descripcion.lineas.map((linea) => linea.texto)
  return {
    lineasDescripcion,
    lineasDescripcionConEstilos: layout.descripcion.lineas.map((linea) => ({
      texto: linea.texto,
      estilo: {
        fontSize: `${ptAPx(linea.tamanoPt, escalaY).toFixed(2)}px`,
      },
    })),
    estilos: {
      codigo: {
        fontFamily: FAMILIA_FUENTE_ETIQUETA,
        fontSize: `${ptAPx(layout.codigo.tamanoPt, escalaY).toFixed(2)}px`,
        lineHeight: '1.02',
        top: `${(mmAPx(layout.codigo.posicionY, escalaY) - ptAPx(layout.codigo.tamanoPt, escalaY) * 0.79).toFixed(2)}px`,
      },
      barra: {
        top: `${mmAPx(layout.codigoBarra.posicionY, escalaY).toFixed(2)}px`,
        left: `${(layout.codigoBarra.posicionX * escalaX).toFixed(2)}px`,
        width: `${(layout.codigoBarra.ancho * escalaX).toFixed(2)}px`,
        height: `${(layout.codigoBarra.alto * escalaY).toFixed(2)}px`,
      },
      descripcion: {
        fontFamily: FAMILIA_FUENTE_ETIQUETA,
        fontSize: `${ptAPx(layout.descripcion.tamanoPt, escalaY).toFixed(2)}px`,
        lineHeight: `${ptAPx(layout.descripcion.interlineadoPt, escalaY).toFixed(2)}px`,
        top: `${(mmAPx(layout.descripcion.posicionY, escalaY) - ptAPx(layout.descripcion.tamanoPt, escalaY) * 0.79).toFixed(2)}px`,
      },
      ubicacion: {
        fontSize: `${ptAPx(layout.ubicacion.tamanoPt, escalaY).toFixed(2)}px`,
        left: `${(layout.ubicacion.posicionX * escalaX).toFixed(2)}px`,
        top: `${(mmAPx(layout.ubicacion.posicionY, escalaY) - ptAPx(layout.ubicacion.tamanoPt, escalaY) * 0.79).toFixed(2)}px`,
      },
    },
  }
}

export const usarLayoutEtiquetaPreview = (opciones = {}) => {
  const {
    anchoBase = 360,
    configuracion = configuracionEtiqueta10x15,
    alCambiarEscala = null,
  } = opciones
  const anchoPreview = ref(anchoBase)
  let observadorTamano = null
  const obtenerDimensionesPreview = () => {
    const ancho = Math.max(220, anchoPreview.value || anchoBase)
    const alto = ancho / (configuracion.pagina.ancho / configuracion.pagina.alto)
    return { ancho, alto }
  }
  const obtenerEscala = () => {
    const { ancho } = obtenerDimensionesPreview()
    return ancho / anchoBase
  }
  const obtenerLayoutPixeles = (etiqueta) => {
    const { ancho, alto } = obtenerDimensionesPreview()
    const layout = calcularLayoutEtiquetaPreview({ etiqueta, configuracion })
    return convertirLayoutPreviewAPixeles({
      layout,
      configuracion,
      anchoPreviewPx: ancho,
      altoPreviewPx: alto,
    })
  }
  const registrarContenedorPreview = (elemento) => {
    if (!elemento) {
      return
    }
    anchoPreview.value = elemento.getBoundingClientRect().width || anchoBase
    if (typeof ResizeObserver === 'undefined') {
      return
    }
    if (!observadorTamano) {
      observadorTamano = new ResizeObserver((entradas) => {
        for (const entrada of entradas) {
          const anchoNuevo = Math.round(entrada.contentRect.width)
          if (anchoNuevo && anchoNuevo !== anchoPreview.value) {
            anchoPreview.value = anchoNuevo
            if (typeof alCambiarEscala === 'function') {
              alCambiarEscala(obtenerEscala())
            }
          }
        }
      })
    }
    observadorTamano.observe(elemento)
  }
  const desconectarObservador = () => {
    if (observadorTamano) {
      observadorTamano.disconnect()
      observadorTamano = null
    }
  }
  return {
    anchoPreview,
    obtenerEscala,
    obtenerLayoutPixeles,
    registrarContenedorPreview,
    desconectarObservador,
  }
}
