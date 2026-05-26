import { ref } from 'vue'

export const usarEscalaEtiquetaMovil = (opciones = {}) => {
  const {
    anchoBase = 360,
    escalaMinima = 0.52,
    escalaMaxima = 1,
    alCambiarEscala = null,
  } = opciones
  const anchoPreview = ref(anchoBase)
  let observadorTamano = null
  const obtenerEscala = () => {
    const escalaCalculada = anchoPreview.value / anchoBase
    return Math.min(escalaMaxima, Math.max(escalaMinima, escalaCalculada))
  }
  const convertirRem = (tamanoBase, escalaActual) => `${(tamanoBase * escalaActual).toFixed(3)}rem`
  const obtenerTamanoDescripcionBase = (textoDescripcion) => {
    const textoLimpio = (textoDescripcion || '').trim()
    const largo = textoLimpio.length
    if (largo <= 24) return 2.35
    if (largo <= 36) return 2.05
    if (largo <= 48) return 1.78
    if (largo <= 64) return 1.52
    if (largo <= 84) return 1.32
    return 1.15
  }
  const obtenerTamanoCodigoBase = (codigo) => {
    const largoCodigo = (codigo || '').trim().length
    if (largoCodigo <= 13) return 2.7
    if (largoCodigo <= 17) return 2.4
    if (largoCodigo <= 21) return 2.08
    return 1.82
  }
  const obtenerEstiloCodigo = (codigo) => {
    const escalaActual = obtenerEscala()
    return {
      fontSize: convertirRem(obtenerTamanoCodigoBase(codigo), escalaActual),
    }
  }
  const obtenerEstiloDescripcion = (descripcion) => {
    const escalaActual = obtenerEscala()
    return {
      fontSize: convertirRem(obtenerTamanoDescripcionBase(descripcion), escalaActual),
    }
  }
  const obtenerEstiloContenedorBarra = () => {
    const escalaActual = obtenerEscala()
    return {
      minHeight: convertirRem(2.95, escalaActual),
      margin: `${(0.1 * escalaActual).toFixed(3)}rem 0 ${(0.22 * escalaActual).toFixed(3)}rem 0`,
    }
  }
  const obtenerEstiloSvgBarra = () => {
    const escalaActual = obtenerEscala()
    return {
      minHeight: convertirRem(2.25, escalaActual),
    }
  }
  const obtenerEstiloUbicacion = () => {
    const escalaActual = obtenerEscala()
    return {
      fontSize: convertirRem(0.88, escalaActual),
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
    obtenerEstiloContenedorBarra,
    obtenerEstiloSvgBarra,
    obtenerEstiloUbicacion,
    registrarContenedorPreview,
    desconectarObservador,
  }
}
