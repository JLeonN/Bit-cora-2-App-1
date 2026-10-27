export const MM_POR_PT = 0.352777778

const MARGEN_MINIMO_MM = 3
const FACTOR_SEGURIDAD_ANCHO = 0.96

export function calcularLayoutEtiquetaEstante(medidor, codigo, pagina) {
  const margen = Math.max(MARGEN_MINIMO_MM, pagina.margenes?.todos ?? MARGEN_MINIMO_MM)
  const anchoDisponible = pagina.ancho - margen * 2
  const altoDisponible = pagina.alto - margen * 2
  medidor.setFont('helvetica', 'bold')
  medidor.setFontSize(1)
  const anchoPorPunto = medidor.getTextWidth(codigo)
  const tamanoPorAncho = anchoPorPunto > 0 ? (anchoDisponible * FACTOR_SEGURIDAD_ANCHO) / anchoPorPunto : 8
  const tamanoPorAlto = altoDisponible / MM_POR_PT
  return {
    tamanoFuentePt: Math.max(8, Math.floor(Math.min(tamanoPorAncho, tamanoPorAlto))),
    posicionX: pagina.ancho / 2,
    posicionY: pagina.alto / 2,
  }
}
