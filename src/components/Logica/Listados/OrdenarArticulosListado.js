export function ordenarArticulosListado(articulos, orden = {}) {
  const lista = Array.isArray(articulos) ? [...articulos] : []
  const direccion = orden.direccion === 'ascendente' ? 1 : -1
  if (orden.criterio === 'alfabetico') {
    return lista.sort((articuloA, articuloB) => {
      const comparacion = String(articuloA.descripcion || '').localeCompare(
        String(articuloB.descripcion || ''),
        'es',
        { sensitivity: 'base' },
      )
      if (comparacion !== 0) return comparacion * direccion
      const fecha = Number(articuloA.fechaIngreso) - Number(articuloB.fechaIngreso)
      if (fecha !== 0) return fecha
      return String(articuloA.codigo).localeCompare(String(articuloB.codigo), 'es')
    })
  }
  return lista.sort((articuloA, articuloB) => {
    const diferencia = Number(articuloA.fechaIngreso) - Number(articuloB.fechaIngreso)
    if (diferencia !== 0) return diferencia * direccion
    return String(articuloA.codigo).localeCompare(String(articuloB.codigo), 'es') * direccion
  })
}
