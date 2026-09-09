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

export async function enviarTodosAStock(listado) {
  const articulos = Array.isArray(listado?.articulos) ? listado.articulos : []
  const sesion = await obtenerSesionStock()
  const confirmados = new Set(
    sesion.registros.filter((registro) => registro.confirmado).map((registro) => registro.codigo),
  )
  const enviados = []
  const omitidosConfirmados = []
  const invalidos = []
  const registros = []
  articulos.forEach((articulo) => {
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
      throw new Error('Cargá el Excel maestro antes de enviar artículos a Stock')
    }
    await guardarRegistrosStock(registros, informacionArchivo)
  }
  return { enviados, omitidosConfirmados, invalidos }
}

export async function enviarTodosAUbicaciones(listado) {
  const articulos = Array.isArray(listado?.articulos) ? listado.articulos : []
  const enviados = []
  const invalidos = []
  const movimientos = []
  articulos.forEach((articulo) => {
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
    const codigosEnviados = new Set(enviados)
    const ubicacionesConservadas = (Array.isArray(ubicaciones) ? ubicaciones : []).filter(
      (item) => !codigosEnviados.has(normalizarTexto(item?.codigo)),
    )
    const guardado = await guardarUbicaciones([
      ...movimientos,
      ...ubicacionesConservadas,
    ])
    if (!guardado) throw new Error('No se pudieron guardar los artículos en Ubicaciones')
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
