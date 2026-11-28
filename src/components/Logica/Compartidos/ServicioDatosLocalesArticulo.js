import { obtenerSesionStock } from '../../BaseDeDatos/UsoAlmacenamientoStock.js'
import { obtenerUbicaciones } from '../../BaseDeDatos/usoAlmacenamientoUbicaciones.js'
import { normalizarCodigoBusqueda } from './CodigoEscaner.js'
import { obtenerArticulosBaseOriginal, obtenerArticulosCargados, obtenerInformacionArchivo } from '../../BaseDeDatos/LectorExcel.js'
import { obtenerCambiosUbicacion } from '../../BaseDeDatos/UsoHistorialUbicaciones.js'
import { resolverUbicacionVigente } from '../Ubicaciones/ServicioUbicacionVigente.js'

function normalizarUbicacion(valor) {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
}

function crearIndiceStockConfirmado(registros) {
  const stockConfirmadoPorCodigo = new Map()
  ;(Array.isArray(registros) ? registros : []).forEach((registro) => {
    const codigo = normalizarCodigoBusqueda(registro?.codigo)
    if (codigo && registro?.confirmado === true) {
      stockConfirmadoPorCodigo.set(codigo, registro.stockContado)
    }
  })
  return stockConfirmadoPorCodigo
}

function crearIndiceUbicaciones(ubicaciones) {
  const ubicacionPorCodigo = new Map()
  ;(Array.isArray(ubicaciones) ? ubicaciones : []).forEach((registro) => {
    const codigo = normalizarCodigoBusqueda(registro?.codigo)
    const ubicacion = normalizarUbicacion(registro?.ubicacion)
    if (codigo && ubicacion && !ubicacionPorCodigo.has(codigo)) {
      ubicacionPorCodigo.set(codigo, ubicacion)
    }
  })
  return ubicacionPorCodigo
}

export async function cargarDatosLocalesArticulos() {
  const [sesionStock, ubicaciones, cambios] = await Promise.all([obtenerSesionStock(), obtenerUbicaciones(), obtenerCambiosUbicacion()])
  const informacion = obtenerInformacionArchivo()
  const articulos = informacion?.fechaCargaExcel ? obtenerArticulosBaseOriginal() : obtenerArticulosCargados()
  const legadas = crearIndiceUbicaciones(ubicaciones)
  const cambiosPorCodigo = new Map()
  for (const cambio of cambios.slice(informacion?.indiceCambiosExcel ?? 0)) cambiosPorCodigo.set(normalizarCodigoBusqueda(cambio.codigo), cambio)
  const ubicacionPorCodigo = new Map()
  const origenUbicacionPorCodigo = new Map()
  for (const articulo of articulos) {
    const codigo = normalizarCodigoBusqueda(articulo.codigo)
    const cambio = cambiosPorCodigo.get(codigo)
    const legado = legadas.get(codigo)
    const vigente = resolverUbicacionVigente({
      articulo, cambios: cambio ? [cambio] : [], fechaCargaExcel: informacion?.fechaCargaExcel,
      usarOrdenRegistro: Number.isInteger(informacion?.indiceCambiosExcel),
      ubicacionesLegadas: legado ? [{ codigo, ubicacion: legado }] : [],
    })
    if (vigente.ubicacion) {
      ubicacionPorCodigo.set(codigo, vigente.ubicacion)
      origenUbicacionPorCodigo.set(codigo, vigente.origen === 'usuario' ? 'memoria' : 'excel')
    }
  }
  return { stockConfirmadoPorCodigo: crearIndiceStockConfirmado(sesionStock?.registros), ubicacionPorCodigo, origenUbicacionPorCodigo }
}

export function resolverDatosArticulo(articuloExcel, datosLocales) {
  const codigo = normalizarCodigoBusqueda(articuloExcel?.codigo)
  const stockConfirmadoPorCodigo = datosLocales?.stockConfirmadoPorCodigo
  const ubicacionPorCodigo = datosLocales?.ubicacionPorCodigo
  const tieneStockLocal =
    stockConfirmadoPorCodigo instanceof Map && stockConfirmadoPorCodigo.has(codigo)
  const tieneUbicacionLocal = ubicacionPorCodigo instanceof Map && ubicacionPorCodigo.has(codigo)
  return {
    stockListado: tieneStockLocal
      ? stockConfirmadoPorCodigo.get(codigo)
      : (articuloExcel?.stock ?? ''),
    ubicacionListado: tieneUbicacionLocal
      ? ubicacionPorCodigo.get(codigo)
      : normalizarUbicacion(articuloExcel?.ubicacionAntigua),
    origenStock: tieneStockLocal ? 'memoria' : 'excel',
    origenUbicacion: tieneUbicacionLocal ? (datosLocales.origenUbicacionPorCodigo?.get(codigo) || 'memoria') : 'excel',
  }
}
