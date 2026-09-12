import { obtenerArticuloPorCodigoEscaneado } from './CodigoEscaner.js'
import {
  expandirAbreviacionesArticulo,
  sonPalabrasEquivalentesArticulo,
} from './DiccionarioAbreviacionesArticulos.js'

export function normalizarEntradaBusquedaArticulo(valor) {
  return String(valor || '')
    .toUpperCase()
    .replace(/[^A-Z0-9Ñ -]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
}

export function normalizarTextoComparacionArticulo(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9Ñ]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function tokenizarConsulta(valor) {
  return normalizarNombreBusquedaArticulo(valor).split(' ').filter(Boolean)
}

function normalizarNombreBusquedaArticulo(valor) {
  return expandirAbreviacionesArticulo(normalizarTextoComparacionArticulo(valor))
}

function contienePalabraEquivalente(palabrasNombre, palabraBuscada) {
  return palabrasNombre.some((palabraNombre) =>
    sonPalabrasEquivalentesArticulo(palabraNombre, palabraBuscada),
  )
}

export function coincideContextoArticulo(articulo, contextoBusqueda) {
  const terminos = tokenizarConsulta(contextoBusqueda)
  if (terminos.length === 0) return true
  const palabrasNombre = tokenizarConsulta(articulo?.nombre)
  return terminos.every((termino) => contienePalabraEquivalente(palabrasNombre, termino))
}

function calcularPuntajeRelevancia(nombre, terminoBusqueda) {
  const nombreNormalizado = normalizarNombreBusquedaArticulo(nombre).toLowerCase()
  const terminoNormalizado = normalizarNombreBusquedaArticulo(terminoBusqueda).toLowerCase()
  const palabrasBuscadas = terminoNormalizado.split(' ').filter(Boolean)
  const palabrasNombre = nombreNormalizado.split(' ').filter(Boolean)
  if (!terminoNormalizado || palabrasBuscadas.length === 0) return 0
  let puntaje = 0
  if (nombreNormalizado === terminoNormalizado) puntaje += 10000
  else if (nombreNormalizado.startsWith(`${terminoNormalizado} `)) puntaje += 7000
  else if (nombreNormalizado.includes(terminoNormalizado)) puntaje += 6000
  let posicionAnterior = -1
  let palabrasEnOrden = true
  palabrasBuscadas.forEach((palabra) => {
    const indiceExacto = palabrasNombre.indexOf(palabra)
    const indiceParcial = palabrasNombre.findIndex((nombrePalabra) =>
      sonPalabrasEquivalentesArticulo(nombrePalabra, palabra),
    )
    const indice = indiceExacto !== -1 ? indiceExacto : indiceParcial
    if (indiceExacto !== -1) puntaje += 500
    else if (indiceParcial !== -1) puntaje += 250
    if (indice < posicionAnterior) palabrasEnOrden = false
    posicionAnterior = indice
  })
  if (palabrasEnOrden) puntaje += 800
  const primeraCoincidencia = palabrasNombre.findIndex((nombrePalabra) =>
    palabrasBuscadas.some((palabra) => nombrePalabra.includes(palabra)),
  )
  if (primeraCoincidencia === 0) puntaje += 600
  else if (primeraCoincidencia > 0) puntaje -= primeraCoincidencia * 80
  puntaje -= Math.max(0, palabrasNombre.length - palabrasBuscadas.length) * 120
  puntaje -= Math.max(0, nombreNormalizado.length - terminoNormalizado.length) * 3
  return puntaje
}

function ordenarPorRelevancia(articulos, terminoBusqueda) {
  return [...articulos].sort((articuloA, articuloB) => {
    const diferencia =
      calcularPuntajeRelevancia(articuloB.nombre, terminoBusqueda) -
      calcularPuntajeRelevancia(articuloA.nombre, terminoBusqueda)
    if (diferencia !== 0) return diferencia
    const longitudA = normalizarTextoComparacionArticulo(articuloA.nombre).length
    const longitudB = normalizarTextoComparacionArticulo(articuloB.nombre).length
    if (longitudA !== longitudB) return longitudA - longitudB
    return String(articuloA.nombre || '').localeCompare(String(articuloB.nombre || ''), 'es', {
      sensitivity: 'base',
    })
  })
}

// Los códigos exactos ignoran el contexto por seguridad operativa.
export function buscarArticulos({ articulos, busqueda, contextoBusqueda = '', limiteResultados = 50 }) {
  if (!Array.isArray(articulos) || !String(busqueda || '').trim()) return []
  const escaneado = obtenerArticuloPorCodigoEscaneado(articulos, busqueda)
  if (escaneado) return [{ articulo: escaneado, tipoCoincidencia: 'codigo-escaneado' }]
  const termino = normalizarNombreBusquedaArticulo(busqueda).toLowerCase()
  const palabras = termino.split(' ').filter(Boolean)
  const candidatos = articulos.filter((articulo) => coincideContextoArticulo(articulo, contextoBusqueda))
  const codigosEmpiezan = candidatos.filter((articulo) =>
    normalizarTextoComparacionArticulo(articulo.codigo).toLowerCase().startsWith(termino),
  )
  const nombresCoinciden = candidatos.filter((articulo) => {
    const palabrasNombre = tokenizarConsulta(articulo.nombre).map((palabra) => palabra.toLowerCase())
    return (
      palabras.every((palabra) => contienePalabraEquivalente(palabrasNombre, palabra)) &&
      !codigosEmpiezan.includes(articulo)
    )
  })
  const codigosContienen = candidatos.filter((articulo) => {
    const codigo = normalizarTextoComparacionArticulo(articulo.codigo).toLowerCase()
    return codigo.includes(termino) && !codigosEmpiezan.includes(articulo) && !nombresCoinciden.includes(articulo)
  })
  const resultados = [
    ...codigosEmpiezan.map((articulo) => ({ articulo, tipoCoincidencia: 'codigo-exacto' })),
    ...ordenarPorRelevancia(nombresCoinciden, termino).map((articulo) => ({ articulo, tipoCoincidencia: 'nombre-completo' })),
    ...codigosContienen.map((articulo) => ({ articulo, tipoCoincidencia: 'codigo-parcial' })),
  ]
  if (palabras.length <= 1) {
    const parciales = candidatos.filter((articulo) => {
      const palabrasNombre = tokenizarConsulta(articulo.nombre).map((palabra) =>
        palabra.toLowerCase(),
      )
      return (
        palabras.some((palabra) => contienePalabraEquivalente(palabrasNombre, palabra)) &&
        !codigosEmpiezan.includes(articulo) &&
        !nombresCoinciden.includes(articulo) &&
        !codigosContienen.includes(articulo)
      )
    })
    resultados.push(...ordenarPorRelevancia(parciales, termino).map((articulo) => ({ articulo, tipoCoincidencia: 'nombre-parcial' })))
  }
  return resultados.slice(0, limiteResultados)
}

// obtenerArticuloExacto es la entrada determinista para Enter y futuras interfaces estructuradas.
export function obtenerArticuloExacto({ articulos, busqueda, contextoBusqueda = '' }) {
  if (!Array.isArray(articulos) || !String(busqueda || '').trim()) return null
  const escaneado = obtenerArticuloPorCodigoEscaneado(articulos, busqueda)
  if (escaneado) return escaneado
  const termino = normalizarTextoComparacionArticulo(busqueda)
  const candidatos = articulos.filter((articulo) => coincideContextoArticulo(articulo, contextoBusqueda))
  const coincidencias = candidatos.filter((articulo) =>
    normalizarTextoComparacionArticulo(articulo.codigo) === termino ||
    normalizarTextoComparacionArticulo(articulo.nombre) === termino,
  )
  return coincidencias.length === 1 ? coincidencias[0] : null
}
