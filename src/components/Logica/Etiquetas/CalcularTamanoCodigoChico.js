import { medirAnchoTextoEtiquetaChica } from './MedirTextoEtiquetaChica.js'

const TAMANO_BASE_PT = 9
const FACTOR_SEGURIDAD = 0.98

export function calcularTamanoCodigoChico(codigo, anchoDisponibleMm) {
  if (!codigo) return TAMANO_BASE_PT
  const anchoMedido = medirAnchoTextoEtiquetaChica(codigo, TAMANO_BASE_PT)
  const tamanoCalculado = TAMANO_BASE_PT * anchoDisponibleMm * FACTOR_SEGURIDAD / anchoMedido
  return Math.max(0.25, Math.min(TAMANO_BASE_PT, Math.floor(tamanoCalculado * 4) / 4))
}
