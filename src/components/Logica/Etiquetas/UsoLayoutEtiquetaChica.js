import { calcularLayoutCodigoBarraChica } from './CalcularLayoutCodigoBarraChica.js'
import { calcularTamanoCodigoChico } from './CalcularTamanoCodigoChico.js'
import { medirAnchoTextoEtiquetaChica } from './MedirTextoEtiquetaChica.js'

const MM_POR_PT = 0.352777778
const MARGEN_DESCRIPCION_MM = 1.5
const TAMANO_MINIMO_PT = 4
const TAMANO_MAXIMO_AUTOMATICO_PT = 24

export function calcularLayoutEtiquetaChica({ etiqueta = {}, configuracion, anchoReferenciaPx = 1500 }) {
  const { pagina } = configuracion
  const margen = pagina.margenes?.todos ?? MARGEN_DESCRIPCION_MM
  const anchoDisponible = pagina.ancho - margen * 2
  const codigo = String(etiqueta.codigo || '').trim().toUpperCase()
  const descripcion = String(etiqueta.descripcion || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').toUpperCase()
  const lineas = descripcion.split('\n').slice(0, configuracion.descripcion.maximoLineas)
  const ubicacion = String(etiqueta.ubicacion || 'Sin ubicación').trim() || 'Sin ubicación'
  const tamanoCodigo = calcularTamanoCodigoChico(codigo, anchoDisponible)
  const inicioDescripcion = configuracion.descripcion.inicioY
  const altoDisponible = pagina.alto - margen - inicioDescripcion - 3
  let tamanoDescripcion = TAMANO_MAXIMO_AUTOMATICO_PT
  while (tamanoDescripcion > TAMANO_MINIMO_PT && (
    lineas.some((linea) => medirAnchoTextoEtiquetaChica(linea, tamanoDescripcion) > anchoDisponible) ||
    lineas.length * tamanoDescripcion * MM_POR_PT * 0.95 > altoDisponible
  )) tamanoDescripcion -= 0.25
  const tamanoAutomatico = Math.max(TAMANO_MINIMO_PT, tamanoDescripcion)
  const tamanoManual = Number(etiqueta.tamanoDescripcionPt)
  const tamanoFinal = etiqueta.tamanoDescripcionPt !== null && etiqueta.tamanoDescripcionPt !== undefined && Number.isFinite(tamanoManual)
    ? Math.min(40, Math.max(2, tamanoManual))
    : tamanoAutomatico
  return {
    codigo: { texto: codigo, tamanoPt: tamanoCodigo, posicionY: 1.2 + tamanoCodigo * MM_POR_PT * 0.79 },
    codigoBarra: calcularLayoutCodigoBarraChica(configuracion),
    descripcion: {
      lineas: lineas.map((texto) => ({ texto, tamanoPt: tamanoFinal })),
      tamanoPt: tamanoFinal,
      posicionY: inicioDescripcion + tamanoFinal * MM_POR_PT * 0.79,
      interlineadoPt: tamanoFinal * 0.95,
    },
    ubicacion: {
      texto: ubicacion,
      tamanoPt: configuracion.ubicacion.tamanoFuente,
      posicionX: configuracion.ubicacion.posicionX,
      posicionY: configuracion.ubicacion.posicionY,
    },
    anchoReferenciaPx,
  }
}
