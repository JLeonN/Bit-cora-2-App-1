function normalizar(valor) {
  return String(valor ?? '').trim().toUpperCase()
}

function obtenerUbicacionesBuscables(valor) {
  const texto = normalizar(valor).replace(/\s+/g, '')
  if (!texto) return []
  const ubicaciones = new Set([texto.replace(/-/g, '')])
  let piso = ''
  let estanteria = ''
  let letra = ''
  for (const parte of texto.split('/')) {
    let fragmento = parte.replace(/\(PISO\)$/i, '')
    const prefijo = fragmento.match(/^(?:PISO|P)([123])(?=-|\d)/)
    if (prefijo) {
      piso = `P${prefijo[1]}`
      fragmento = fragmento.slice(prefijo[0].length).replace(/^-+/, '')
    }
    const posicionCompleta = fragmento.match(/^(\d+)-*([A-Z])(\d+)(.*)$/)
    if (posicionCompleta) {
      estanteria = posicionCompleta[1]
      letra = posicionCompleta[2]
      ubicaciones.add(`${piso}:${estanteria}${letra}${posicionCompleta[3]}`)
      let resto = posicionCompleta[4]
      while (resto) {
        const siguiente = resto.match(/^-+([A-Z])(\d+)(.*)$/)
        if (!siguiente) break
        letra = siguiente[1]
        ubicaciones.add(`${piso}:${estanteria}${letra}${siguiente[2]}`)
        resto = siguiente[3]
      }
      continue
    }
    const posicionAbreviada = fragmento.match(/^([A-Z])(\d+)$/)
    if (estanteria && posicionAbreviada) {
      letra = posicionAbreviada[1]
      ubicaciones.add(`${piso}:${estanteria}${letra}${posicionAbreviada[2]}`)
    } else if (estanteria && letra && /^\d+$/.test(fragmento)) {
      ubicaciones.add(`${piso}:${estanteria}${letra}${fragmento}`)
    }
  }
  return [...ubicaciones]
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
  const buscadas = obtenerUbicacionesBuscables(ubicacion)
  if (!buscadas.length) return []
  const vistos = new Set()
  return articulos.flatMap((articulo) => {
    const codigo = normalizar(articulo.codigo)
    if (!codigo || vistos.has(codigo)) return []
    vistos.add(codigo)
    const cambio = cambiosPorCodigo.get(codigo)
    const legado = legadosPorCodigo.get(codigo)
    const vigente = resolverUbicacionVigente({ articulo, cambios: cambio ? [cambio] : [], fechaCargaExcel, ubicacionesLegadas: legado ? [legado] : [], usarOrdenRegistro })
    const ubicacionesRegistradas = obtenerUbicacionesBuscables(vigente.ubicacion)
    return buscadas.some((valor) => ubicacionesRegistradas.includes(valor)) ? [{ ...articulo, ...vigente }] : []
  })
}
