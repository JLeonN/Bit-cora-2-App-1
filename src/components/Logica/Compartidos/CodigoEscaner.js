export const PREFIJO_ESCANER_CHINO = 'P06'

export function normalizarCodigoBusqueda(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
}

export function quitarPrefijoEscanerChino(valor) {
  const codigo = normalizarCodigoBusqueda(valor)
  return codigo.startsWith(PREFIJO_ESCANER_CHINO)
    ? codigo.slice(PREFIJO_ESCANER_CHINO.length)
    : codigo
}

export function obtenerArticuloPorCodigoEscaneado(articulos, valor) {
  const terminoBusqueda = normalizarCodigoBusqueda(valor)
  if (!terminoBusqueda || !Array.isArray(articulos)) return null

  const buscarExacto = (codigoBuscado) =>
    articulos.filter(
      (articulo) => normalizarCodigoBusqueda(articulo?.codigo) === codigoBuscado,
    )

  const codigosParaProbar = [terminoBusqueda]
  const terminoSinPrefijo = quitarPrefijoEscanerChino(terminoBusqueda)
  if (terminoSinPrefijo !== terminoBusqueda) {
    codigosParaProbar.push(terminoSinPrefijo)
  }

  for (const codigoParaProbar of codigosParaProbar) {
    const coincidenciasExactas = buscarExacto(codigoParaProbar)
    if (coincidenciasExactas.length === 1) {
      return coincidenciasExactas[0]
    }
  }

  const coincidenciasPorCodigoCompleto = articulos.filter((articulo) => {
    const codigoArticulo = normalizarCodigoBusqueda(articulo?.codigo)
    return codigoArticulo && terminoSinPrefijo.startsWith(codigoArticulo)
  })

  return coincidenciasPorCodigoCompleto.length === 1 ? coincidenciasPorCodigoCompleto[0] : null
}
