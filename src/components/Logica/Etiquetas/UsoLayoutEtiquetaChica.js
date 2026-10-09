const MM_POR_PT = 0.352777778
const MARGEN_DESCRIPCION_MM = 1.5
const TAMANO_MINIMO_PT = 4
const FAMILIA_FUENTE = "'Arial Black', Arial, Helvetica, sans-serif"

function medirAnchoMm(texto, tamanoPt) {
  if (typeof document === 'undefined') return texto.length * tamanoPt * MM_POR_PT * 0.58
  const contexto = document.createElement('canvas').getContext('2d')
  contexto.font = `800 ${tamanoPt * 96 / 72}px ${FAMILIA_FUENTE}`
  return contexto.measureText(texto).width * 25.4 / 96
}

export function calcularLayoutEtiquetaChica({ etiqueta = {}, configuracion, anchoReferenciaPx = 1500 }) {
  const { pagina } = configuracion
  const margen = pagina.margenes?.todos ?? MARGEN_DESCRIPCION_MM
  const anchoDisponible = pagina.ancho - margen * 2
  const codigo = String(etiqueta.codigo || '').trim().toUpperCase()
  const descripcion = String(etiqueta.descripcion || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').toUpperCase()
  const lineas = descripcion.split('\n')
  const ubicacion = String(etiqueta.ubicacion || 'Sin ubicación').trim() || 'Sin ubicación'
  const anchoBarra = Math.min(configuracion.codigoBarra.ancho, anchoDisponible)
  let tamanoCodigo = Math.min(9, configuracion.codigoArticulo.tamanosAutomaticos.corto.tamano)
  while (tamanoCodigo > TAMANO_MINIMO_PT && medirAnchoMm(codigo, tamanoCodigo) > anchoDisponible) tamanoCodigo -= 0.25
  const inicioDescripcion = 12.7
  const altoDisponible = pagina.alto - margen - inicioDescripcion - 3
  let tamanoDescripcion = 10
  while (tamanoDescripcion > TAMANO_MINIMO_PT && (
    lineas.some((linea) => medirAnchoMm(linea, tamanoDescripcion) > anchoDisponible) ||
    lineas.length * tamanoDescripcion * MM_POR_PT * 0.95 > altoDisponible
  )) tamanoDescripcion -= 0.25
  const tamanoFinal = Math.max(TAMANO_MINIMO_PT, tamanoDescripcion)
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
