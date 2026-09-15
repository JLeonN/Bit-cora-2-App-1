import { obtenerArticuloPorCodigoEscaneado } from './CodigoEscaner.js'
import {
  expandirAbreviacionesArticulo,
  sonPalabrasEquivalentesArticulo,
} from './DiccionarioAbreviacionesArticulos.js'

const cacheDatosBusquedaArticulo = new WeakMap()
const comparadorNombres = new Intl.Collator('es', { sensitivity: 'base' })

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

function normalizarNombreBusquedaArticulo(valor) {
  return expandirAbreviacionesArticulo(normalizarTextoComparacionArticulo(valor))
}

function tokenizarConsulta(valor) {
  return normalizarNombreBusquedaArticulo(valor).split(' ').filter(Boolean)
}

function prepararDatosArticulo(articulo) {
  const codigoOriginal = String(articulo?.codigo || '')
  const nombreOriginal = String(articulo?.nombre || '')
  const esObjeto = articulo !== null && typeof articulo === 'object'
  const datosGuardados = esObjeto ? cacheDatosBusquedaArticulo.get(articulo) : null
  if (
    datosGuardados?.codigoOriginal === codigoOriginal &&
    datosGuardados?.nombreOriginal === nombreOriginal
  ) {
    return datosGuardados
  }

  const codigoComparacion = normalizarTextoComparacionArticulo(codigoOriginal)
  const nombreComparacion = normalizarTextoComparacionArticulo(nombreOriginal)
  const nombreNormalizado = expandirAbreviacionesArticulo(nombreComparacion)
  const datos = {
    articulo,
    codigoOriginal,
    nombreOriginal,
    codigoComparacion,
    nombreComparacion,
    nombreNormalizado,
    palabrasNombre: nombreNormalizado.split(' ').filter(Boolean),
    longitudNombre: nombreComparacion.length,
  }
  if (esObjeto) cacheDatosBusquedaArticulo.set(articulo, datos)
  return datos
}

function sonPalabrasCoincidentes(palabraNombre, palabraBuscada, permitirPrefijoCorto) {
  return (
    sonPalabrasEquivalentesArticulo(palabraNombre, palabraBuscada) ||
    (permitirPrefijoCorto &&
      palabraBuscada.length > 0 &&
      palabraNombre.startsWith(palabraBuscada))
  )
}

function contienePalabraEquivalente(
  palabrasNombre,
  palabraBuscada,
  permitirPrefijoCorto = false,
) {
  return palabrasNombre.some((palabraNombre) =>
    sonPalabrasCoincidentes(palabraNombre, palabraBuscada, permitirPrefijoCorto),
  )
}

function coincideTerminosContexto(datosArticulo, terminosContexto) {
  if (terminosContexto.length === 0) return true
  return terminosContexto.every((termino) =>
    contienePalabraEquivalente(datosArticulo.palabrasNombre, termino),
  )
}

export function coincideContextoArticulo(articulo, contextoBusqueda) {
  return coincideTerminosContexto(prepararDatosArticulo(articulo), tokenizarConsulta(contextoBusqueda))
}

function calcularPuntajeRelevancia(datosArticulo, datosBusqueda) {
  const { nombreNormalizado, palabrasNombre } = datosArticulo
  const { termino, palabras, permitirPrefijoCorto } = datosBusqueda
  if (!termino || palabras.length === 0) return 0

  let puntaje = 0
  if (nombreNormalizado === termino) puntaje += 10000
  else if (nombreNormalizado.startsWith(`${termino} `)) puntaje += 7000
  else if (nombreNormalizado.includes(termino)) puntaje += 6000

  let posicionAnterior = -1
  let palabrasEnOrden = true
  palabras.forEach((palabra) => {
    const indiceExacto = palabrasNombre.indexOf(palabra)
    const indiceParcial = palabrasNombre.findIndex((palabraNombre) =>
      sonPalabrasCoincidentes(palabraNombre, palabra, permitirPrefijoCorto),
    )
    const indice = indiceExacto !== -1 ? indiceExacto : indiceParcial
    if (indiceExacto !== -1) puntaje += 500
    else if (indiceParcial !== -1) puntaje += 250
    if (indice < posicionAnterior) palabrasEnOrden = false
    posicionAnterior = indice
  })

  if (palabrasEnOrden) puntaje += 800
  const primeraCoincidencia = palabrasNombre.findIndex((palabraNombre) =>
    palabras.some((palabra) => palabraNombre.includes(palabra)),
  )
  if (primeraCoincidencia === 0) puntaje += 600
  else if (primeraCoincidencia > 0) puntaje -= primeraCoincidencia * 80
  puntaje -= Math.max(0, palabrasNombre.length - palabras.length) * 120
  puntaje -= Math.max(0, nombreNormalizado.length - termino.length) * 3
  return puntaje
}

function ordenarPorRelevancia(datosArticulos, datosBusqueda) {
  return datosArticulos
    .map((datosArticulo) => ({
      datosArticulo,
      puntaje: calcularPuntajeRelevancia(datosArticulo, datosBusqueda),
    }))
    .sort((resultadoA, resultadoB) => {
      const diferencia = resultadoB.puntaje - resultadoA.puntaje
      if (diferencia !== 0) return diferencia
      const diferenciaLongitud =
        resultadoA.datosArticulo.longitudNombre - resultadoB.datosArticulo.longitudNombre
      if (diferenciaLongitud !== 0) return diferenciaLongitud
      return comparadorNombres.compare(
        resultadoA.datosArticulo.nombreOriginal,
        resultadoB.datosArticulo.nombreOriginal,
      )
    })
    .map((resultado) => resultado.datosArticulo)
}

// Los códigos exactos ignoran el contexto por seguridad operativa.
export function buscarArticulos({ articulos, busqueda, contextoBusqueda = '', limiteResultados = 50 }) {
  if (!Array.isArray(articulos) || !String(busqueda || '').trim()) return []
  const escaneado = obtenerArticuloPorCodigoEscaneado(articulos, busqueda)
  if (escaneado) return [{ articulo: escaneado, tipoCoincidencia: 'codigo-escaneado' }]

  const termino = normalizarNombreBusquedaArticulo(busqueda)
  const palabras = termino.split(' ').filter(Boolean)
  const datosBusqueda = {
    termino,
    palabras,
    permitirPrefijoCorto: String(busqueda).trim().length >= 3,
  }
  const terminosContexto = tokenizarConsulta(contextoBusqueda)
  const candidatos = articulos
    .map(prepararDatosArticulo)
    .filter((datosArticulo) => coincideTerminosContexto(datosArticulo, terminosContexto))
  const codigosEmpiezan = candidatos.filter((datosArticulo) =>
    datosArticulo.codigoComparacion.startsWith(termino),
  )
  const codigosEmpiezanSet = new Set(codigosEmpiezan)
  const nombresCoinciden = candidatos.filter(
    (datosArticulo) =>
      palabras.every((palabra) =>
        contienePalabraEquivalente(
          datosArticulo.palabrasNombre,
          palabra,
          datosBusqueda.permitirPrefijoCorto,
        ),
      ) && !codigosEmpiezanSet.has(datosArticulo),
  )
  const nombresCoincidenSet = new Set(nombresCoinciden)
  const codigosContienen = candidatos.filter(
    (datosArticulo) =>
      datosArticulo.codigoComparacion.includes(termino) &&
      !codigosEmpiezanSet.has(datosArticulo) &&
      !nombresCoincidenSet.has(datosArticulo),
  )
  const codigosContienenSet = new Set(codigosContienen)
  const resultados = [
    ...codigosEmpiezan.map(({ articulo }) => ({ articulo, tipoCoincidencia: 'codigo-exacto' })),
    ...ordenarPorRelevancia(nombresCoinciden, datosBusqueda).map(({ articulo }) => ({
      articulo,
      tipoCoincidencia: 'nombre-completo',
    })),
    ...codigosContienen.map(({ articulo }) => ({ articulo, tipoCoincidencia: 'codigo-parcial' })),
  ]

  if (palabras.length <= 1) {
    const parciales = candidatos.filter(
      (datosArticulo) =>
        palabras.some((palabra) =>
          contienePalabraEquivalente(
            datosArticulo.palabrasNombre,
            palabra,
            datosBusqueda.permitirPrefijoCorto,
          ),
        ) &&
        !codigosEmpiezanSet.has(datosArticulo) &&
        !nombresCoincidenSet.has(datosArticulo) &&
        !codigosContienenSet.has(datosArticulo),
    )
    resultados.push(
      ...ordenarPorRelevancia(parciales, datosBusqueda).map(({ articulo }) => ({
        articulo,
        tipoCoincidencia: 'nombre-parcial',
      })),
    )
  }
  return resultados.slice(0, limiteResultados)
}

// obtenerArticuloExacto es la entrada determinista para Enter y futuras interfaces estructuradas.
export function obtenerArticuloExacto({ articulos, busqueda, contextoBusqueda = '' }) {
  if (!Array.isArray(articulos) || !String(busqueda || '').trim()) return null
  const escaneado = obtenerArticuloPorCodigoEscaneado(articulos, busqueda)
  if (escaneado) return escaneado

  const termino = normalizarTextoComparacionArticulo(busqueda)
  const terminosContexto = tokenizarConsulta(contextoBusqueda)
  const coincidencias = articulos
    .map(prepararDatosArticulo)
    .filter(
      (datosArticulo) =>
        coincideTerminosContexto(datosArticulo, terminosContexto) &&
        (datosArticulo.codigoComparacion === termino ||
          datosArticulo.nombreComparacion === termino),
    )
  return coincidencias.length === 1 ? coincidencias[0].articulo : null
}
