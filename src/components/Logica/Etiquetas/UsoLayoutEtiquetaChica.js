const MM_POR_PT = 0.352777778
const MARGEN_DESCRIPCION_MM = 1.5
const TAMANO_MINIMO_PT = 4
const TAMANO_MAXIMO_AUTOMATICO_PT = 24
const FAMILIA_FUENTE = "'Arial Black', Arial, Helvetica, sans-serif"
let contextoMedicion = null

function medirAnchoMm(texto, tamanoPt) {
  if (typeof document === 'undefined') return texto.length * tamanoPt * MM_POR_PT * 0.58
  if (!contextoMedicion) contextoMedicion = document.createElement('canvas').getContext('2d')
  contextoMedicion.font = `800 ${tamanoPt * 96 / 72}px ${FAMILIA_FUENTE}`
  return contextoMedicion.measureText(texto).width * 25.4 / 96
}

export function calcularLayoutEtiquetaChica({ etiqueta = {}, configuracion, anchoReferenciaPx = 1500 }) {
  const { pagina } = configuracion
  const margen = pagina.margenes?.todos ?? MARGEN_DESCRIPCION_MM
  const anchoDisponible = pagina.ancho - margen * 2
  const codigo = String(etiqueta.codigo || '').trim().toUpperCase()
  const descripcion = String(etiqueta.descripcion || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').toUpperCase()
  const lineas = descripcion.split('\n').slice(0, configuracion.descripcion.maximoLineas)
  const ubicacion = String(etiqueta.ubicacion || 'Sin ubicación').trim() || 'Sin ubicación'
  const anchoBarra = Math.min(configuracion.codigoBarra.ancho, anchoDisponible)
  let tamanoCodigo = Math.min(9, configuracion.codigoArticulo.tamanosAutomaticos.corto.tamano)
  while (tamanoCodigo > TAMANO_MINIMO_PT && medirAnchoMm(codigo, tamanoCodigo) > anchoDisponible) tamanoCodigo -= 0.25
  const inicioDescripcion = 12.7
  const altoDisponible = pagina.alto - margen - inicioDescripcion - 3
  let tamanoDescripcion = TAMANO_MAXIMO_AUTOMATICO_PT
  while (tamanoDescripcion > TAMANO_MINIMO_PT && (
    lineas.some((linea) => medirAnchoMm(linea, tamanoDescripcion) > anchoDisponible) ||
    lineas.length * tamanoDescripcion * MM_POR_PT * 0.95 > altoDisponible
  )) tamanoDescripcion -= 0.25
  const tamanoAutomatico = Math.max(TAMANO_MINIMO_PT, tamanoDescripcion)
  const tamanoManual = Number(etiqueta.tamanoDescripcionPt)
  const tamanoFinal = etiqueta.tamanoDescripcionPt !== null && etiqueta.tamanoDescripcionPt !== undefined && Number.isFinite(tamanoManual)
    ? Math.min(40, Math.max(2, tamanoManual))
    : tamanoAutomatico
  return {
    codigo: { texto: codigo, tamanoPt: tamanoCodigo, posicionY: 1.2 + tamanoCodigo * MM_POR_PT * 0.79 },
    codigoBarra: {
      ancho: anchoBarra,
      alto: configuracion.codigoBarra.alto,
      posicionX: (pagina.ancho - anchoBarra) / 2,
      posicionY: configuracion.codigoBarra.posicionY,
    },
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
