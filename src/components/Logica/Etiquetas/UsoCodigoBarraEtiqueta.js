import JsBarcode from 'jsbarcode'
import { validarCodigoParaBarra, limpiarCodigoParaBarra, obtenerTramosCodigoBarra } from './GeneradorCodigoBarra.js'

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
    const escalaNormalizada = Math.max(0.45, Math.min(1.3, escala))
    const anchoModulo = Number((1.08 + (escalaNormalizada - 0.45) * 0.92).toFixed(2))
    const config = {
      format: 'CODE39',
      displayValue: false,
      background: '#ffffff',
      lineColor: '#000000',
      margin: 0,
      width: Math.max(0.98, anchoModulo),
      height: Math.max(28, Math.round(34 + escalaNormalizada * 14)),
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
  const renderizarCodigoBarraSvgVectorial = (destinoSvg, codigo) => {
    const codigoLimpio = normalizarCodigoBarra(codigo)
    limpiarSvgBarra(destinoSvg)
    if (!codigoBarraValido(codigoLimpio)) return false
    try {
      const tramos = obtenerTramosCodigoBarra(codigoLimpio)
      destinoSvg.setAttribute('viewBox', '0 0 1 1')
      destinoSvg.setAttribute('preserveAspectRatio', 'none')
      const fondo = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      fondo.setAttribute('width', '1')
      fondo.setAttribute('height', '1')
      fondo.setAttribute('fill', '#ffffff')
      destinoSvg.appendChild(fondo)
      for (const tramo of tramos) {
        const barra = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        barra.setAttribute('x', String(tramo.inicio))
        barra.setAttribute('width', String(tramo.ancho))
        barra.setAttribute('height', '1')
        barra.setAttribute('fill', '#000000')
        destinoSvg.appendChild(barra)
      }
      return true
    } catch (error) {
      console.error('[UsoCodigoBarraEtiqueta] Error renderizando barra vectorial:', error)
      limpiarSvgBarra(destinoSvg)
      return false
    }
  }
  return {
    normalizarCodigoBarra,
    codigoBarraValido,
    renderizarCodigoBarraSvg,
    renderizarCodigoBarraSvgVectorial,
  }
}
