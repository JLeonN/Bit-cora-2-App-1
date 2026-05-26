import { ref } from 'vue'

const FAMILIA_FUENTE_ETIQUETA = "'Arial Black', 'Arial', 'Helvetica Neue', sans-serif"

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

const normalizarTextoDescripcion = (descripcion = '') => {
  return String(descripcion).replace(/\s+/g, ' ').trim().toUpperCase()
}

const obtenerLineasObjetivoDescripcion = (descripcion) => {
  const largo = normalizarTextoDescripcion(descripcion).length
  if (largo <= 24) return 2
  if (largo <= 56) return 3
  if (largo <= 78) return 4
  return 5
}

const dividirTextoEnLineas = (texto, anchoMaximoPx, tamanoPx, peso = 800) => {
  const palabras = normalizarTextoDescripcion(texto).split(' ').filter(Boolean)
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

const ajustarTamanoTextoEnUnaLinea = (texto, tamanoInicialPx, tamanoMinimoPx, anchoMaximoPx, peso = 800) => {
  let tamanoActual = tamanoInicialPx
  while (tamanoActual > tamanoMinimoPx && medirAnchoTexto(texto, tamanoActual, peso) > anchoMaximoPx) {
    tamanoActual -= 1
  }
  return Number(tamanoActual.toFixed(2))
}

export const usarEscalaEtiquetaMovil = (opciones = {}) => {
  const {
    anchoBase = 360,
    escalaMinima = 0.52,
    escalaMaxima = 1,
    alCambiarEscala = null,
  } = opciones
  const anchoPreview = ref(anchoBase)
  let observadorTamano = null
  const obtenerRangoEscalaPorPantalla = () => {
    if (typeof window === 'undefined') {
      return { min: escalaMinima, max: escalaMaxima }
    }
    const anchoVentana = window.innerWidth
    if (anchoVentana <= 600) {
      return { min: 0.5, max: 0.9 }
    }
    if (anchoVentana <= 1024) {
      return { min: 0.72, max: 1 }
    }
    return { min: 0.78, max: 1.1 }
  }
  const obtenerEscala = () => {
    const escalaCalculada = anchoPreview.value / anchoBase
    const rango = obtenerRangoEscalaPorPantalla()
    return Math.min(rango.max, Math.max(rango.min, escalaCalculada))
  }
  const obtenerDimensionesPreview = () => {
    const ancho = Math.max(220, anchoPreview.value || anchoBase)
    const alto = ancho / 1.5
    return { ancho, alto }
  }

  const componerDescripcion = (descripcion) => {
    const textoDescripcion = normalizarTextoDescripcion(descripcion)
    const { ancho, alto } = obtenerDimensionesPreview()
    const anchoMaximo = ancho * 0.9
    const lineasObjetivo = obtenerLineasObjetivoDescripcion(textoDescripcion)
    const tamanoInicial = Math.max(18, alto * 0.17)
    const tamanoMinimo = Math.max(11, alto * 0.08)
    let tamanoSeleccionado = tamanoMinimo
    let lineasSeleccionadas = dividirTextoEnLineas(textoDescripcion, anchoMaximo, tamanoMinimo)
    for (let tamanoActual = tamanoInicial; tamanoActual >= tamanoMinimo; tamanoActual -= 1) {
      const lineas = dividirTextoEnLineas(textoDescripcion, anchoMaximo, tamanoActual)
      if (lineas.length <= lineasObjetivo) {
        tamanoSeleccionado = tamanoActual
        lineasSeleccionadas = lineas
        break
      }
      lineasSeleccionadas = lineas
    }
    if (lineasSeleccionadas.length > lineasObjetivo + 1) {
      lineasSeleccionadas = lineasSeleccionadas.slice(0, lineasObjetivo + 1)
    }
    return {
      lineas: lineasSeleccionadas,
      estilo: {
        fontSize: `${tamanoSeleccionado.toFixed(2)}px`,
        lineHeight: '0.93',
      },
    }
  }

  const obtenerEstiloCodigo = (codigo) => {
    const codigoNormalizado = (codigo || '').trim().toUpperCase()
    const { ancho, alto } = obtenerDimensionesPreview()
    const anchoMaximo = ancho * 0.93
    const tamanoInicial = Math.max(22, alto * 0.19)
    const tamanoMinimo = Math.max(12, alto * 0.1)
    const tamanoAjustado = ajustarTamanoTextoEnUnaLinea(
      codigoNormalizado,
      tamanoInicial,
      tamanoMinimo,
      anchoMaximo,
      900,
    )
    return {
      fontSize: `${tamanoAjustado.toFixed(2)}px`,
      lineHeight: '1.02',
    }
  }

  const obtenerEstiloDescripcion = (descripcion) => componerDescripcion(descripcion).estilo

  const obtenerLineasDescripcion = (descripcion) => componerDescripcion(descripcion).lineas

  const obtenerEstiloContenedorBarra = () => {
    const { ancho, alto } = obtenerDimensionesPreview()
    const altoBase = Math.max(28, Math.min(72, alto * 0.16))
    return {
      minHeight: `${altoBase.toFixed(2)}px`,
      margin: `${Math.max(2, alto * 0.005).toFixed(2)}px 0 ${Math.max(4, alto * 0.02).toFixed(2)}px 0`,
      width: `${Math.max(220, ancho * 0.94).toFixed(2)}px`,
      maxWidth: '100%',
    }
  }

  const obtenerEstiloSvgBarra = () => {
    const { alto } = obtenerDimensionesPreview()
    return {
      minHeight: `${Math.max(22, alto * 0.12).toFixed(2)}px`,
      height: `${Math.max(26, alto * 0.14).toFixed(2)}px`,
    }
  }

  const obtenerEstiloUbicacion = () => {
    const { alto } = obtenerDimensionesPreview()
    return {
      fontSize: `${Math.max(11, Math.min(20, alto * 0.055)).toFixed(2)}px`,
    }
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
    obtenerEstiloCodigo,
    obtenerEstiloDescripcion,
    obtenerLineasDescripcion,
    obtenerEstiloContenedorBarra,
    obtenerEstiloSvgBarra,
    obtenerEstiloUbicacion,
    registrarContenedorPreview,
    desconectarObservador,
  }
}
