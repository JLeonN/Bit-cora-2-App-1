import { nextTick } from 'vue'

export function normalizarInputArticulo(valor) {
  return String(valor || '')
    .toUpperCase()
    .replace(/[^A-Z0-9Ñ -]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
}

export function manejarDobleEspacioInput({
  evento,
  valorActual,
  asignarValor,
  referenciaInput,
  ultimoEspacioTiempo,
}) {
  if (evento.key !== ' ') return ultimoEspacioTiempo

  const tiempoActual = Date.now()
  const diferenciaTiempo = tiempoActual - ultimoEspacioTiempo
  if (diferenciaTiempo >= 300 || diferenciaTiempo <= 0) return tiempoActual

  evento.preventDefault()
  const posicionCursor = evento.target.selectionStart ?? String(valorActual || '').length
  const textoActual = String(valorActual || '')
  const textoAntes = textoActual.substring(0, Math.max(0, posicionCursor - 1))
  const textoDespues = textoActual.substring(posicionCursor)
  asignarValor(`${textoAntes}-${textoDespues}`)

  nextTick(() => {
    const input = referenciaInput?.value || referenciaInput || evento.target
    input?.setSelectionRange?.(posicionCursor, posicionCursor)
  })

  return 0
}
