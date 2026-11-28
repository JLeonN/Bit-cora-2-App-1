function normalizar(valor) {
  return String(valor ?? '').trim().toUpperCase()
}

export function resolverUbicacionVigente({ articulo, cambios = [], fechaCargaExcel = null, ubicacionesLegadas = [], usarOrdenRegistro = false }) {
  const codigo = normalizar(articulo?.codigo)
  const cambio = cambios.filter((item) => normalizar(item.codigo) === codigo && (!fechaCargaExcel || (item.fechaActualizacion !== null && (usarOrdenRegistro || item.fechaActualizacion >= fechaCargaExcel)))).at(-1)
  if (cambio) return { ubicacion: normalizar(cambio.ubicacion), origen: 'usuario', fechaActualizacion: cambio.fechaActualizacion }
  if (!fechaCargaExcel) {
    const legado = ubicacionesLegadas.find((item) => normalizar(item.codigo) === codigo)
    if (legado?.ubicacion) return { ubicacion: normalizar(legado.ubicacion), origen: 'usuario', fechaActualizacion: null }
  }
  return { ubicacion: normalizar(articulo?.historialUbicaciones?.at(-1) || articulo?.ubicacionAntigua), origen: 'excel', fechaActualizacion: fechaCargaExcel }
}

export function buscarArticulosPorUbicacion({ articulos = [], cambios = [], fechaCargaExcel = null, ubicacionesLegadas = [], ubicacion, usarOrdenRegistro = false }) {
  const cambiosPorCodigo = new Map()
  const legadosPorCodigo = new Map()
  for (const cambio of cambios) cambiosPorCodigo.set(normalizar(cambio.codigo), cambio)
  for (const legado of ubicacionesLegadas) {
    const codigo = normalizar(legado.codigo)
    if (!legadosPorCodigo.has(codigo)) legadosPorCodigo.set(codigo, legado)
  }
  const buscada = normalizar(ubicacion)
  if (!buscada) return []
  const vistos = new Set()
  return articulos.flatMap((articulo) => {
    const codigo = normalizar(articulo.codigo)
    if (!codigo || vistos.has(codigo)) return []
    vistos.add(codigo)
    const cambio = cambiosPorCodigo.get(codigo)
    const legado = legadosPorCodigo.get(codigo)
    const vigente = resolverUbicacionVigente({ articulo, cambios: cambio ? [cambio] : [], fechaCargaExcel, ubicacionesLegadas: legado ? [legado] : [], usarOrdenRegistro })
    return vigente.ubicacion === buscada ? [{ ...articulo, ...vigente }] : []
  })
}
