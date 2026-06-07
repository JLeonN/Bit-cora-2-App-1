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
const DEMORAS_AJUSTE = [80, 320]

let manejadorEnfoqueActivo = null
let manejadorDesenfoqueActivo = null
let temporizadoresPendientes = []
let espaciadorTemporal = null

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
    elemento.classList.contains('sin-enfoque-automatico') ||
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
  if (!header) return MARGEN_HEADER
  const rect = header.getBoundingClientRect()
  return Math.max(0, rect.bottom) + MARGEN_HEADER
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

function desplazarCampo(campo) {
  if (!campo.isConnected || document.activeElement !== campo) return
  asegurarEspacioDesplazable()
  const rect = campo.getBoundingClientRect()
  window.scrollTo({
    top: Math.max(0, window.scrollY + rect.top - obtenerLimiteSuperiorPagina()),
    behavior: 'smooth',
  })
}

function cancelarAjustesPendientes() {
  temporizadoresPendientes.forEach((temporizador) => window.clearTimeout(temporizador))
  temporizadoresPendientes = []
}

function programarDesplazamiento(campo) {
  cancelarAjustesPendientes()
  temporizadoresPendientes = DEMORAS_AJUSTE.map((demora) =>
    window.setTimeout(() => desplazarCampo(campo), demora),
  )
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
      if (!esCampoEditable(document.activeElement)) eliminarEspaciadorTemporal()
    }, 0)
  }
  document.addEventListener('focusin', manejadorEnfoqueActivo)
  document.addEventListener('focusout', manejadorDesenfoqueActivo)
  return true
}

export function desactivarEnfoqueGlobalInputs() {
  cancelarAjustesPendientes()
  eliminarEspaciadorTemporal()
  if (!manejadorEnfoqueActivo || typeof document === 'undefined') return
  document.removeEventListener('focusin', manejadorEnfoqueActivo)
  document.removeEventListener('focusout', manejadorDesenfoqueActivo)
  manejadorEnfoqueActivo = null
  manejadorDesenfoqueActivo = null
}
