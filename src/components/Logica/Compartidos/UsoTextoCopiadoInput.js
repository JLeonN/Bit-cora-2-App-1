export function usarTextoCopiadoInput(nombreOrigen) {
  let textoCopiado = ''

  async function copiarTextoActual(textoActual) {
    const texto = String(textoActual || '')
    if (!texto) return

    textoCopiado = texto
    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(texto)
      }
    } catch (error) {
      console.warn(`[${nombreOrigen}] No se pudo copiar al portapapeles:`, error)
    }
  }

  function obtenerTextoCopiado() {
    return textoCopiado
  }

  function limpiarTextoCopiado() {
    textoCopiado = ''
  }

  return { copiarTextoActual, limpiarTextoCopiado, obtenerTextoCopiado }
}
