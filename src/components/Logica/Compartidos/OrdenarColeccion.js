export const CRITERIOS_ORDEN = Object.freeze([
  'fechaIngreso',
  'alfabetico',
  'ubicacion',
  'cantidad',
])
export const DIRECCIONES_ORDEN = Object.freeze(['ascendente', 'descendente'])

const ORDEN_INICIAL = Object.freeze({
  criterio: 'fechaIngreso',
  direccion: 'descendente',
})

export function normalizarOrden(orden) {
  const criterioValido = CRITERIOS_ORDEN.includes(orden?.criterio)
  const direccionValida = DIRECCIONES_ORDEN.includes(orden?.direccion)
  if (!criterioValido || !direccionValida) return { ...ORDEN_INICIAL }
  return { criterio: orden.criterio, direccion: orden.direccion }
}

function validarSelectores(selectores, criterio) {
  const selectorPorCriterio = {
    fechaIngreso: 'obtenerFecha',
    alfabetico: 'obtenerTexto',
    ubicacion: 'obtenerUbicacion',
    cantidad: 'obtenerCantidad',
  }
  const nombresSelectores = ['obtenerClave', selectorPorCriterio[criterio]]
  for (const nombreSelector of nombresSelectores) {
    if (typeof selectores?.[nombreSelector] !== 'function') {
      throw new TypeError(`ordenarColeccion requiere selectores.${nombreSelector}()`)
    }
  }
}

function compararTexto(valorA, valorB) {
  return String(valorA ?? '').localeCompare(String(valorB ?? ''), 'es', {
    sensitivity: 'base',
  })
}

function normalizarUbicacion(valor) {
  const ubicacion = String(valor ?? '').trim()
  if (!ubicacion || /^sin ubicaci[oó]n$/iu.test(ubicacion)) return null
  return ubicacion
}

function normalizarCantidad(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null
  const cantidad = Number(valor)
  return Number.isFinite(cantidad) ? cantidad : null
}

function compararConAusentes(valorA, valorB, compararValores, direccion) {
  const ausenteA = valorA === null
  const ausenteB = valorB === null
  if (ausenteA || ausenteB) {
    if (ausenteA && ausenteB) return 0
    return ausenteA ? 1 : -1
  }
  return compararValores(valorA, valorB) * direccion
}

export function ordenarColeccion(elementos, orden, selectores) {
  const ordenNormalizado = normalizarOrden(orden)
  validarSelectores(selectores, ordenNormalizado.criterio)
  const direccion = ordenNormalizado.direccion === 'ascendente' ? 1 : -1
  const registros = (Array.isArray(elementos) ? elementos : []).map((elemento, indice) => ({
    elemento,
    indice,
  }))

  registros.sort((registroA, registroB) => {
    const { elemento: elementoA, indice: indiceA } = registroA
    const { elemento: elementoB, indice: indiceB } = registroB
    let comparacionPrincipal = 0
    if (ordenNormalizado.criterio === 'fechaIngreso') {
      const fechaA = Number(selectores.obtenerFecha(elementoA, indiceA))
      const fechaB = Number(selectores.obtenerFecha(elementoB, indiceB))
      const fechaNormalizadaA = Number.isFinite(fechaA) ? fechaA : 0
      const fechaNormalizadaB = Number.isFinite(fechaB) ? fechaB : 0
      comparacionPrincipal = (fechaNormalizadaA - fechaNormalizadaB) * direccion
    } else if (ordenNormalizado.criterio === 'alfabetico') {
      comparacionPrincipal =
        compararTexto(
          selectores.obtenerTexto(elementoA, indiceA),
          selectores.obtenerTexto(elementoB, indiceB),
        ) * direccion
    } else if (ordenNormalizado.criterio === 'ubicacion') {
      const ubicacionA = normalizarUbicacion(selectores.obtenerUbicacion(elementoA, indiceA))
      const ubicacionB = normalizarUbicacion(selectores.obtenerUbicacion(elementoB, indiceB))
      comparacionPrincipal = compararConAusentes(
        ubicacionA,
        ubicacionB,
        (valorA, valorB) =>
          valorA.localeCompare(valorB, 'es', { sensitivity: 'base', numeric: true }),
        direccion,
      )
    } else {
      const cantidadA = normalizarCantidad(selectores.obtenerCantidad(elementoA, indiceA))
      const cantidadB = normalizarCantidad(selectores.obtenerCantidad(elementoB, indiceB))
      comparacionPrincipal = compararConAusentes(
        cantidadA,
        cantidadB,
        (valorA, valorB) => valorA - valorB,
        direccion,
      )
    }
    if (comparacionPrincipal !== 0) return comparacionPrincipal
    const comparacionClave = compararTexto(
      selectores.obtenerClave(elementoA, indiceA),
      selectores.obtenerClave(elementoB, indiceB),
    )
    return comparacionClave || indiceA - indiceB
  })

  return registros.map(({ elemento }) => elemento)
}
