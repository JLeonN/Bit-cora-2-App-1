import { obtenerSesionStock } from '../../BaseDeDatos/UsoAlmacenamientoStock.js'
import { obtenerUbicaciones } from '../../BaseDeDatos/usoAlmacenamientoUbicaciones.js'
import { normalizarCodigoBusqueda } from './CodigoEscaner.js'

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
  const [sesionStock, ubicaciones] = await Promise.all([obtenerSesionStock(), obtenerUbicaciones()])
  return {
    stockConfirmadoPorCodigo: crearIndiceStockConfirmado(sesionStock?.registros),
    ubicacionPorCodigo: crearIndiceUbicaciones(ubicaciones),
  }
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
    origenUbicacion: tieneUbicacionLocal ? 'memoria' : 'excel',
  }
}
