import { nextTick } from 'vue'

function obtenerElementoInput(referenciaInput, elementoOriginal) {
  return referenciaInput?.value || referenciaInput || elementoOriginal
}

function obtenerPosicionNormalizada(valorOriginal, posicionOriginal, normalizarValor) {
  const textoAntesDelCursor = valorOriginal.substring(0, posicionOriginal)
  return normalizarValor(textoAntesDelCursor).length
}

export function normalizarInputPreservandoCursor({
  evento,
  normalizarValor,
  asignarValor,
  referenciaInput = null,
}) {
  const elementoOriginal = evento?.target
  if (!elementoOriginal) return ''

  const valorOriginal = String(elementoOriginal.value ?? '')
  const valorNormalizado = normalizarValor(valorOriginal)
  const inicioSeleccion = elementoOriginal.selectionStart ?? valorOriginal.length
  const finSeleccion = elementoOriginal.selectionEnd ?? inicioSeleccion

  asignarValor(valorNormalizado)

  if (valorOriginal !== valorNormalizado) {
    const nuevoInicioSeleccion = obtenerPosicionNormalizada(
      valorOriginal,
      inicioSeleccion,
      normalizarValor,
    )
    const nuevoFinSeleccion = obtenerPosicionNormalizada(
      valorOriginal,
      finSeleccion,
      normalizarValor,
    )

    nextTick(() => {
      const input = obtenerElementoInput(referenciaInput, elementoOriginal)
      input?.setSelectionRange?.(nuevoInicioSeleccion, nuevoFinSeleccion)
    })
  }

  return valorNormalizado
}
