import { jsPDF } from 'jspdf'

const FAMILIA_FUENTE = "'Arial Black', Arial, Helvetica, sans-serif"
let medidorPdf = null
let contextoCanvas = null

export function medirAnchoTextoEtiquetaChica(texto, tamanoPt) {
  if (!texto) return 0
  if (!medidorPdf) {
    medidorPdf = new jsPDF({ unit: 'mm' })
    medidorPdf.setFont('helvetica', 'bold')
  }
  medidorPdf.setFontSize(tamanoPt)
  const anchoPdf = medidorPdf.getTextWidth(texto)
  if (typeof document === 'undefined') return anchoPdf
  if (!contextoCanvas) contextoCanvas = document.createElement('canvas').getContext('2d')
  contextoCanvas.font = `800 ${tamanoPt * 96 / 72}px ${FAMILIA_FUENTE}`
  const anchoPreview = contextoCanvas.measureText(texto).width * 25.4 / 96
  return Math.max(anchoPdf, anchoPreview)
}
