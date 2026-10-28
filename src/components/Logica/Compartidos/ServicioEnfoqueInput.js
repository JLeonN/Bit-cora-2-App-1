const TIPOS_INPUT_EDITABLES = new Set([
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
])
const SELECTOR_DIALOGO =
  '.q-dialog, [role="dialog"], .modal-fondo, .modal-contenido, .modal-fondo-fotos, .modal-camara-fotos'
const MARGEN_HEADER = 12
const MARGEN_HEADER_AJUSTADO = 6
const DEMORAS_AJUSTE = [80, 320]
const RUTAS_CON_AJUSTE = new Set([
  '/AjustarUbicaciones',
  '/ConsultaDeUbicacion',
  '/listados',
  '/stock',
  '/etiquetas',
])

let manejadorEnfoqueActivo = null
let manejadorDesenfoqueActivo = null
let manejadorCambioVentana = null
let manejadorCambioRuta = null
let temporizadoresPendientes = []
let temporizadorAjusteFinal = null
let espaciadorTemporal = null
let campoEnfocado = null
let headerAjustado = null
let desplazamientoHeader = 0
let traslacionHeaderOriginal = ''
let alturaVentanaAnterior = 0
let desplazamientoVentanaAnterior = 0

function esRutaConAjuste() {
  return RUTAS_CON_AJUSTE.has(window.location.hash.slice(1).split('?')[0])
}

function esDispositivoTactil() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  return (
    window.matchMedia?.('(pointer: coarse)').matches === true ||
    Number(navigator.maxTouchPoints || 0) > 0
  )
}

function esCampoEditable(elemento) {
  if (
    !(elemento instanceof HTMLElement) ||
    elemento.hasAttribute('disabled') ||
    elemento.hasAttribute('readonly') ||
    (elemento.classList.contains('sin-enfoque-automatico') && !esRutaConAjuste()) ||
    elemento.closest(SELECTOR_DIALOGO)
  ) {
    return false
  }
  if (elemento.matches('textarea, select')) return true
  if (elemento.isContentEditable) return true
  if (!(elemento instanceof HTMLInputElement)) return false
  return TIPOS_INPUT_EDITABLES.has(String(elemento.type || 'text').toLowerCase())
}

function obtenerLimiteSuperiorPagina() {
  const header = document.querySelector('.q-header')
  const margen = esRutaConAjuste() ? MARGEN_HEADER_AJUSTADO : MARGEN_HEADER
  if (!header) return margen
  if (esRutaConAjuste()) {
    return (window.visualViewport?.offsetTop || 0) + header.getBoundingClientRect().height + margen
  }
  const rect = header.getBoundingClientRect()
  return Math.max(0, rect.bottom) + margen
}

function mantenerHeaderVisible() {
  const header = document.querySelector('.q-header')
  if (!header || !esRutaConAjuste()) return
  if (headerAjustado !== header) {
    restaurarHeader()
    headerAjustado = header
    traslacionHeaderOriginal = header.style.translate
  }
  const limiteVisible = window.visualViewport?.offsetTop || 0
  const posicionActual = header.getBoundingClientRect().top
  const diferencia = limiteVisible - posicionActual
  if (Math.abs(diferencia) < 1) return
  desplazamientoHeader = Math.max(0, desplazamientoHeader + diferencia)
  header.style.translate = desplazamientoHeader
    ? `0 ${desplazamientoHeader}px`
    : traslacionHeaderOriginal
}

function restaurarHeader() {
  if (headerAjustado) headerAjustado.style.translate = traslacionHeaderOriginal
  headerAjustado = null
  desplazamientoHeader = 0
  traslacionHeaderOriginal = ''
}

function asegurarEspacioDesplazable() {
  const contenedor = document.querySelector('.q-page-container') || document.body
  if (!espaciadorTemporal) {
    espaciadorTemporal = document.createElement('div')
    espaciadorTemporal.setAttribute('aria-hidden', 'true')
    espaciadorTemporal.style.pointerEvents = 'none'
    espaciadorTemporal.style.width = '100%'
    contenedor.appendChild(espaciadorTemporal)
  }
  const alturaVisible = window.visualViewport?.height || window.innerHeight
  espaciadorTemporal.style.height = `${Math.max(0, alturaVisible - obtenerLimiteSuperiorPagina())}px`
}

function eliminarEspaciadorTemporal() {
  espaciadorTemporal?.remove()
  espaciadorTemporal = null
}

function desplazarCampo(campo, comportamiento = 'smooth') {
  if (!campo.isConnected || document.activeElement !== campo) return
  mantenerHeaderVisible()
  asegurarEspacioDesplazable()
  const rect = campo.getBoundingClientRect()
  window.scrollTo({
    top: Math.max(0, window.scrollY + rect.top - obtenerLimiteSuperiorPagina()),
    behavior: comportamiento,
  })
}

function cancelarAjustesPendientes() {
  temporizadoresPendientes.forEach((temporizador) => window.clearTimeout(temporizador))
  temporizadoresPendientes = []
  window.clearTimeout(temporizadorAjusteFinal)
  temporizadorAjusteFinal = null
}

function programarDesplazamiento(campo) {
  cancelarAjustesPendientes()
  campoEnfocado = campo
  if (esRutaConAjuste()) {
    alturaVentanaAnterior = window.visualViewport?.height || window.innerHeight
    desplazamientoVentanaAnterior = window.visualViewport?.offsetTop || 0
    temporizadoresPendientes = [
      window.setTimeout(() => desplazarCampo(campo), 80),
      window.setTimeout(() => desplazarCampo(campo, 'instant'), 1000),
    ]
    temporizadorAjusteFinal = window.setTimeout(() => desplazarCampo(campo, 'instant'), 500)
    return
  }
  temporizadoresPendientes = DEMORAS_AJUSTE.map((demora) =>
    window.setTimeout(() => desplazarCampo(campo), demora),
  )
}

function ajustarPorCambioVentana() {
  if (!campoEnfocado || document.activeElement !== campoEnfocado || !esRutaConAjuste()) return
  mantenerHeaderVisible()
  const alturaActual = window.visualViewport?.height || window.innerHeight
  const desplazamientoActual = window.visualViewport?.offsetTop || 0
  if (
    Math.abs(alturaActual - alturaVentanaAnterior) < 1 &&
    Math.abs(desplazamientoActual - desplazamientoVentanaAnterior) < 1
  ) {
    return
  }
  alturaVentanaAnterior = alturaActual
  desplazamientoVentanaAnterior = desplazamientoActual
  window.clearTimeout(temporizadorAjusteFinal)
  temporizadorAjusteFinal = window.setTimeout(
    () => desplazarCampo(campoEnfocado, 'instant'),
    160,
  )
}

function limpiarEnfoqueActivo() {
  cancelarAjustesPendientes()
  campoEnfocado = null
  eliminarEspaciadorTemporal()
  restaurarHeader()
}

export function activarEnfoqueGlobalInputs() {
  if (typeof document === 'undefined' || manejadorEnfoqueActivo || !esDispositivoTactil()) {
    return false
  }
  manejadorEnfoqueActivo = (evento) => {
    cancelarAjustesPendientes()
    if (esCampoEditable(evento.target)) programarDesplazamiento(evento.target)
  }
  manejadorDesenfoqueActivo = () => {
    window.setTimeout(() => {
      if (!esCampoEditable(document.activeElement)) {
        limpiarEnfoqueActivo()
      }
    }, 0)
  }
  manejadorCambioVentana = () => ajustarPorCambioVentana()
  manejadorCambioRuta = () => {
    if (!campoEnfocado?.isConnected || !esRutaConAjuste()) limpiarEnfoqueActivo()
  }
  document.addEventListener('focusin', manejadorEnfoqueActivo)
  document.addEventListener('focusout', manejadorDesenfoqueActivo)
  window.addEventListener('scroll', manejadorCambioVentana, { passive: true })
  window.addEventListener('hashchange', manejadorCambioRuta)
  window.visualViewport?.addEventListener('scroll', manejadorCambioVentana, { passive: true })
  window.visualViewport?.addEventListener('resize', manejadorCambioVentana, { passive: true })
  return true
}

export function desactivarEnfoqueGlobalInputs() {
  limpiarEnfoqueActivo()
  if (!manejadorEnfoqueActivo || typeof document === 'undefined') return
  document.removeEventListener('focusin', manejadorEnfoqueActivo)
  document.removeEventListener('focusout', manejadorDesenfoqueActivo)
  window.removeEventListener('scroll', manejadorCambioVentana)
  window.removeEventListener('hashchange', manejadorCambioRuta)
  window.visualViewport?.removeEventListener('scroll', manejadorCambioVentana)
  window.visualViewport?.removeEventListener('resize', manejadorCambioVentana)
  manejadorEnfoqueActivo = null
  manejadorDesenfoqueActivo = null
  manejadorCambioVentana = null
  manejadorCambioRuta = null
}
