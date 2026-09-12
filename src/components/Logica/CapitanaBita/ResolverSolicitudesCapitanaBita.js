import {
  buscarArticulos,
  normalizarTextoComparacionArticulo,
} from '../Compartidos/ServicioBusquedaArticulos.js'

function codigoNormalizado(articulo) {
  return normalizarTextoComparacionArticulo(articulo?.codigo)
}

function obtenerMemoriaExacta(solicitud, contextoBusqueda, memorias) {
  const contexto = normalizarTextoComparacionArticulo(contextoBusqueda)
  const expresion = normalizarTextoComparacionArticulo(solicitud.textoOriginal)
  if (!contexto || !expresion) return null
  return (
    (memorias || []).find(
      (memoria) =>
        normalizarTextoComparacionArticulo(memoria.contexto) === contexto &&
        normalizarTextoComparacionArticulo(memoria.expresionUsuario) === expresion,
    ) || null
  )
}

function crearConsultas(solicitud, memoria) {
  const consultas = [
    memoria?.busquedaConfirmada,
    solicitud.busquedaPrincipal,
    ...solicitud.alternativas,
  ]
  const vistas = new Set()
  return consultas.filter((consulta) => {
    const normalizada = normalizarTextoComparacionArticulo(consulta)
    if (!normalizada || vistas.has(normalizada)) return false
    vistas.add(normalizada)
    return true
  })
}

export function resolverSolicitudesCapitanaBita({
  solicitudes,
  articulos,
  contextoBusqueda,
  memorias,
}) {
  if (!Array.isArray(solicitudes) || !Array.isArray(articulos)) return []
  return solicitudes.map((solicitud) => {
    const memoriaAplicada = obtenerMemoriaExacta(solicitud, contextoBusqueda, memorias)
    const consultas = crearConsultas(solicitud, memoriaAplicada)
    const candidatosPorCodigo = new Map()
    consultas.forEach((consulta, indiceConsulta) => {
      buscarArticulos({ articulos, busqueda: consulta, contextoBusqueda }).forEach((resultado) => {
        const codigo = codigoNormalizado(resultado.articulo)
        if (!codigo) return
        const existente = candidatosPorCodigo.get(codigo)
        if (existente) {
          existente.consultasOrigen.push(consulta)
          return
        }
        candidatosPorCodigo.set(codigo, {
          ...resultado.articulo,
          consultasOrigen: [consulta],
          origenAlternativo: indiceConsulta > (memoriaAplicada ? 0 : -1),
        })
      })
    })
    const candidatos = [...candidatosPorCodigo.values()]
    const estado =
      candidatos.length === 1 ? 'unica' : candidatos.length > 1 ? 'ambigua' : 'noEncontrada'
    const articuloUnico = estado === 'unica' ? candidatos[0] : null
    const consultaPrincipal = normalizarTextoComparacionArticulo(solicitud.busquedaPrincipal)
    const unicaPorAlternativa =
      articuloUnico &&
      !articuloUnico.consultasOrigen.some(
        (consulta) => normalizarTextoComparacionArticulo(consulta) === consultaPrincipal,
      )
    return {
      idSolicitud: solicitud.idSolicitud,
      textoOriginal: solicitud.textoOriginal,
      cantidad: solicitud.cantidad,
      estado,
      candidatos,
      articuloUnico,
      memoriaAplicada,
      puedeOfrecerMemoria:
        Boolean(normalizarTextoComparacionArticulo(contextoBusqueda)) &&
        !memoriaAplicada &&
        (estado === 'ambigua' || Boolean(unicaPorAlternativa)),
    }
  })
}
