export const CRITERIOS_ORDEN = Object.freeze(['fechaIngreso', 'alfabetico'])
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

function validarSelectores(selectores) {
  const nombresSelectores = ['obtenerFecha', 'obtenerTexto', 'obtenerClave']
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

export function ordenarColeccion(elementos, orden, selectores) {
  validarSelectores(selectores)
  const ordenNormalizado = normalizarOrden(orden)
  const direccion = ordenNormalizado.direccion === 'ascendente' ? 1 : -1
  const registros = (Array.isArray(elementos) ? elementos : []).map((elemento, indice) => ({
    elemento,
    indice,
  }))

  registros.sort((registroA, registroB) => {
    const { elemento: elementoA, indice: indiceA } = registroA
    const { elemento: elementoB, indice: indiceB } = registroB
    let comparacionPrincipal = 0
    if (ordenNormalizado.criterio === 'alfabetico') {
      comparacionPrincipal = compararTexto(
        selectores.obtenerTexto(elementoA, indiceA),
        selectores.obtenerTexto(elementoB, indiceB),
      )
    } else {
      const fechaA = Number(selectores.obtenerFecha(elementoA, indiceA))
      const fechaB = Number(selectores.obtenerFecha(elementoB, indiceB))
      const fechaNormalizadaA = Number.isFinite(fechaA) ? fechaA : 0
      const fechaNormalizadaB = Number.isFinite(fechaB) ? fechaB : 0
      comparacionPrincipal = fechaNormalizadaA - fechaNormalizadaB
    }
    if (comparacionPrincipal !== 0) return comparacionPrincipal * direccion
    const comparacionClave = compararTexto(
      selectores.obtenerClave(elementoA, indiceA),
      selectores.obtenerClave(elementoB, indiceB),
    )
    return comparacionClave || indiceA - indiceB
  })

  return registros.map(({ elemento }) => elemento)
}
