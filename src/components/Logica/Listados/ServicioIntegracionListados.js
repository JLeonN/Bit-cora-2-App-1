import {
  obtenerInformacionArchivo,
  obtenerArticuloPorCodigo,
} from '../../BaseDeDatos/LectorExcel.js'
import {
  guardarRegistrosStock,
  normalizarCantidadStock,
  obtenerSesionStock,
} from '../../BaseDeDatos/UsoAlmacenamientoStock.js'
import {
  guardarUbicaciones,
  obtenerUbicaciones,
} from '../../BaseDeDatos/usoAlmacenamientoUbicaciones.js'
import { agregarEtiquetasDesdeArticulos } from '../Etiquetas/ServicioEnvioEtiquetas.js'

function normalizarTexto(valor) {
  return String(valor ?? '').trim().toUpperCase()
}

function normalizarUbicacion(valor) {
  return normalizarTexto(valor).replace(/\s+/g, '-')
}

function normalizarStockComparable(valor) {
  if (valor === '' || valor === null || valor === undefined) return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

export function obtenerCambiosStockPendientes(listado) {
  return (listado?.articulos || []).filter((articulo) => {
    const actual = normalizarStockComparable(articulo.stockListado)
    const original = normalizarStockComparable(articulo.stockOriginal)
    const procesado = normalizarStockComparable(articulo.stockProcesado)
    const nuncaProcesado = articulo.stockProcesado === null || articulo.stockProcesado === undefined
    return actual !== original && (nuncaProcesado || actual !== procesado)
  })
}

export function obtenerCambiosUbicacionPendientes(listado) {
  return (listado?.articulos || []).filter((articulo) => {
    const actual = normalizarUbicacion(articulo.ubicacionListado)
    const original = normalizarUbicacion(articulo.ubicacionOriginal)
    const enviada = normalizarUbicacion(articulo.ubicacionEnviada)
    const nuncaEnviada = articulo.ubicacionEnviada === null || articulo.ubicacionEnviada === undefined
    return actual !== original && (nuncaEnviada || actual !== enviada)
  })
}

export async function enviarCambiosAStock(listado) {
  const cambios = obtenerCambiosStockPendientes(listado)
  const sesion = await obtenerSesionStock()
  const confirmados = new Set(
    sesion.registros.filter((registro) => registro.confirmado).map((registro) => registro.codigo),
  )
  const enviados = []
  const omitidosConfirmados = []
  const invalidos = []
  const registros = []
  cambios.forEach((articulo) => {
    const codigo = normalizarTexto(articulo.codigo)
    const stockContado = normalizarCantidadStock(articulo.stockListado)
    if (!codigo || articulo.stockListado === '' || stockContado.valor === null) {
      if (codigo) invalidos.push(codigo)
      return
    }
    if (confirmados.has(codigo)) {
      omitidosConfirmados.push(codigo)
      return
    }
    const stockExcel = normalizarCantidadStock(articulo.stockOriginal, { permitirDecimal: true })
    const ubicacionActual = normalizarUbicacion(articulo.ubicacionListado)
    const ubicacionOriginalExcel = normalizarUbicacion(articulo.ubicacionOriginal)
    registros.push({
      codigo,
      nombre: articulo.descripcion,
      stockExcel: stockExcel.valor ?? 0,
      stockContado: stockContado.valor,
      stockExcelAjustado: stockExcel.ajustado,
      ubicacionActual,
      ubicacionOriginalExcel,
      ubicacionOrigen: ubicacionActual === ubicacionOriginalExcel ? 'excel' : 'usuario',
      confirmado: false,
      fechaActualizacion: Date.now(),
    })
    enviados.push(codigo)
  })
  if (registros.length > 0) {
    const informacionArchivo = obtenerInformacionArchivo()
    if (!informacionArchivo) {
      throw new Error('Cargá el Excel maestro antes de enviar cambios a Stock')
    }
    await guardarRegistrosStock(registros, informacionArchivo)
  }
  return { enviados, omitidosConfirmados, invalidos }
}

export async function enviarCambiosAUbicaciones(listado) {
  const cambios = obtenerCambiosUbicacionPendientes(listado)
  const enviados = []
  const invalidos = []
  const movimientos = []
  cambios.forEach((articulo) => {
    const codigo = normalizarTexto(articulo.codigo)
    const ubicacion = normalizarUbicacion(articulo.ubicacionListado)
    if (!codigo || !ubicacion) {
      if (codigo) invalidos.push(codigo)
      return
    }
    movimientos.push({ codigo, ubicacion })
    enviados.push(codigo)
  })
  if (movimientos.length > 0) {
    const ubicaciones = await obtenerUbicaciones()
    const guardado = await guardarUbicaciones([
      ...movimientos,
      ...(Array.isArray(ubicaciones) ? ubicaciones : []),
    ])
    if (!guardado) throw new Error('No se pudieron guardar los cambios en Ubicaciones')
  }
  return { enviados, invalidos }
}

export async function enviarArticuloAEtiquetas(articulo) {
  if (!obtenerArticuloPorCodigo(articulo?.codigo)) return { cantidad: 0, etiquetas: [] }
  return agregarEtiquetasDesdeArticulos([
    {
      codigo: articulo.codigo,
      descripcion: articulo.descripcion,
      ubicacion: articulo.ubicacionListado,
    },
  ])
}

export async function enviarTodosAEtiquetas(articulosOrdenados) {
  const lista = Array.isArray(articulosOrdenados) ? articulosOrdenados : []
  const validos = lista.filter((articulo) => obtenerArticuloPorCodigo(articulo.codigo))
  const resultado = await agregarEtiquetasDesdeArticulos(
    validos.map((articulo) => ({
      codigo: articulo.codigo,
      descripcion: articulo.descripcion,
      ubicacion: articulo.ubicacionListado,
    })),
  )
  return { ...resultado, omitidos: lista.length - validos.length }
}
