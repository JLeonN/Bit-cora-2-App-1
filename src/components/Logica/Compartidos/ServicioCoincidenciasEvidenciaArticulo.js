import {
  expandirAbreviacionesArticulo,
  sonPalabrasEquivalentesArticulo,
} from './DiccionarioAbreviacionesArticulos.js'
import {
  coincideContextoArticulo,
  normalizarTextoComparacionArticulo,
} from './ServicioBusquedaArticulos.js'

function normalizarCodigo(valor) {
  return normalizarTextoComparacionArticulo(valor)
}

function obtenerPalabras(valor) {
  return expandirAbreviacionesArticulo(normalizarTextoComparacionArticulo(valor))
    .split(' ')
    .filter(Boolean)
}

function descripcionCompatible(articulo, descripcionVisible) {
  const palabrasVisibles = obtenerPalabras(descripcionVisible)
  if (!palabrasVisibles.length) return true
  const palabrasArticulo = obtenerPalabras(articulo?.nombre)
  return palabrasVisibles.every((visible) =>
    palabrasArticulo.some((palabra) => sonPalabrasEquivalentesArticulo(palabra, visible)),
  )
}

export function crearIndiceCodigosMaestro(articulos) {
  const indice = new Map()
  if (!Array.isArray(articulos)) return indice
  articulos.forEach((articulo) => {
    const codigo = normalizarCodigo(articulo?.codigo)
    if (!codigo) return
    const registros = indice.get(codigo) || []
    registros.push(articulo)
    indice.set(codigo, registros)
  })
  return indice
}

export function resolverCoincidenciasPorEvidencia({
  articulos,
  codigoVisible,
  descripcionVisible,
  contextoBusqueda = '',
}) {
  const coleccion = Array.isArray(articulos) ? articulos : []
  const codigo = normalizarCodigo(codigoVisible)
  const tieneDescripcion = obtenerPalabras(descripcionVisible).length > 0
  const indiceCodigos = crearIndiceCodigosMaestro(coleccion)
  const coincidenciasCodigoExacto = codigo ? [...(indiceCodigos.get(codigo) || [])] : []
  const codigosDuplicados = coincidenciasCodigoExacto.length > 1 ? [codigo] : []
  const candidatosCodigo = codigo
    ? coleccion.filter((articulo) => normalizarCodigo(articulo?.codigo).includes(codigo))
    : coleccion
  const candidatosDescripcion = tieneDescripcion
    ? coleccion.filter(
        (articulo) =>
          coincideContextoArticulo(articulo, contextoBusqueda) &&
          descripcionCompatible(articulo, descripcionVisible),
      )
    : coleccion.filter((articulo) => coincideContextoArticulo(articulo, contextoBusqueda))
  const candidatosDescripcionSinContexto = tieneDescripcion
    ? coleccion.filter((articulo) => descripcionCompatible(articulo, descripcionVisible))
    : coleccion
  const conjuntoDescripcion = new Set(candidatosDescripcion)
  const conjuntoDescripcionSinContexto = new Set(candidatosDescripcionSinContexto)
  let candidatosCompatibles
  if (coincidenciasCodigoExacto.length) {
    candidatosCompatibles = tieneDescripcion
      ? coincidenciasCodigoExacto.filter((articulo) => conjuntoDescripcionSinContexto.has(articulo))
      : coincidenciasCodigoExacto
  } else if (codigo && tieneDescripcion) {
    candidatosCompatibles = candidatosCodigo.filter((articulo) => conjuntoDescripcion.has(articulo))
  } else if (codigo) {
    candidatosCompatibles = candidatosCodigo.filter((articulo) =>
      coincideContextoArticulo(articulo, contextoBusqueda),
    )
  } else {
    candidatosCompatibles = candidatosDescripcion
  }
  const hayConflicto = Boolean(
    coincidenciasCodigoExacto.length &&
      tieneDescripcion &&
      candidatosCompatibles.length === 0 &&
      candidatosDescripcionSinContexto.length,
  )
  return {
    coincidenciasCodigoExacto,
    candidatosCompatibles,
    codigosDuplicados,
    hayConflicto,
  }
}
