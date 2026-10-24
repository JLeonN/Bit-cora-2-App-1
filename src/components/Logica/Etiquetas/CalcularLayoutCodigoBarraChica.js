const MARGEN_MINIMO_CODIGO_BARRA_MM = 3

export function calcularLayoutCodigoBarraChica(configuracion) {
  const { pagina, codigoBarra } = configuracion
  const margen = Math.max(MARGEN_MINIMO_CODIGO_BARRA_MM, pagina.margenes?.todos ?? 0)
  const ancho = Math.min(codigoBarra.ancho, pagina.ancho - margen * 2)
  return {
    ancho,
    alto: codigoBarra.alto,
    posicionX: (pagina.ancho - ancho) / 2,
    posicionY: codigoBarra.posicionY,
  }
}
