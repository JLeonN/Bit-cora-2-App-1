import JsBarcode from 'jsbarcode'
import { validarCodigoParaBarra, limpiarCodigoParaBarra } from './GeneradorCodigoBarra.js'

export const usarCodigoBarraEtiqueta = () => {
  const cacheConfigBarra = new Map()
  const normalizarCodigoBarra = (codigo) => {
    if (!codigo || typeof codigo !== 'string') {
      return ''
    }
    return limpiarCodigoParaBarra(codigo)
  }
  const codigoBarraValido = (codigo) => {
    const codigoLimpio = normalizarCodigoBarra(codigo)
    if (!codigoLimpio) {
      return false
    }
    return validarCodigoParaBarra(codigoLimpio)
  }
  const obtenerConfigBarra = (codigoLimpio, escala = 1) => {
    const claveConfig = `${codigoLimpio}|${Math.round(escala * 100)}`
    if (cacheConfigBarra.has(claveConfig)) {
      return cacheConfigBarra.get(claveConfig)
    }
    const config = {
      format: 'CODE39',
      displayValue: false,
      background: '#ffffff',
      lineColor: '#000000',
      margin: 0,
      width: Math.max(0.95, Number((1.32 * escala).toFixed(2))),
      height: Math.max(24, Math.round(34 * escala)),
    }
    cacheConfigBarra.set(claveConfig, config)
    return config
  }
  const limpiarSvgBarra = (destinoSvg) => {
    while (destinoSvg.firstChild) {
      destinoSvg.removeChild(destinoSvg.firstChild)
    }
  }
  const aplicarAtributosSvgBarra = (destinoSvg) => {
    const cajas = destinoSvg.getBBox ? destinoSvg.getBBox() : null
    const ancho = Math.max(1, Math.ceil(cajas?.width || 260))
    const alto = Math.max(1, Math.ceil(cajas?.height || 42))
    destinoSvg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`)
    destinoSvg.setAttribute('width', '100%')
    destinoSvg.setAttribute('height', '100%')
    destinoSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  }
  const renderizarCodigoBarraSvg = (destinoSvg, codigo, escala = 1) => {
    const codigoLimpio = normalizarCodigoBarra(codigo)
    if (!codigoBarraValido(codigoLimpio)) {
      limpiarSvgBarra(destinoSvg)
      return false
    }
    try {
      JsBarcode(destinoSvg, codigoLimpio, obtenerConfigBarra(codigoLimpio, escala))
      aplicarAtributosSvgBarra(destinoSvg)
      return true
    } catch (error) {
      console.error('[UsoCodigoBarraEtiqueta] Error renderizando barra:', error)
      limpiarSvgBarra(destinoSvg)
      return false
    }
  }
  return {
    normalizarCodigoBarra,
    codigoBarraValido,
    renderizarCodigoBarraSvg,
  }
}
