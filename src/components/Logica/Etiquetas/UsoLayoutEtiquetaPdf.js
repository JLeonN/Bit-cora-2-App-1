import { jsPDF } from 'jspdf'
import { configuracionEtiqueta10x15 } from './ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta10x15.js'
import { componerLineasDescripcionEtiqueta } from './UsoComposicionDescripcionEtiqueta.js'

const FACTOR_ASCENSO_TEXTO = 0.79
const MM_POR_PT = 0.352777778

let medidorPdf10x15 = null

const obtenerMedidorPdf10x15 = () => {
  if (!medidorPdf10x15) {
    medidorPdf10x15 = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [configuracionEtiqueta10x15.pagina.alto, configuracionEtiqueta10x15.pagina.ancho],
    })
  }
  return medidorPdf10x15
}

const ptAMm = (pt) => pt * MM_POR_PT

export const obtenerTamanoFuenteCodigoPt = (codigo, configCodigo = configuracionEtiqueta10x15.codigoArticulo) => {
  const texto = String(codigo || '')
  const { tamanosAutomaticos } = configCodigo
  if (texto.length <= tamanosAutomaticos.corto.hasta) return tamanosAutomaticos.corto.tamano
  if (texto.length <= tamanosAutomaticos.mediano.hasta) return tamanosAutomaticos.mediano.tamano
  if (texto.length <= tamanosAutomaticos.largo.hasta) return tamanosAutomaticos.largo.tamano
  return tamanosAutomaticos.muyLargo.tamano
}

export const obtenerTamanoFuenteDescripcionPt = (descripcion, configDescripcion = configuracionEtiqueta10x15.descripcion) => {
  const longitud = String(descripcion || '').length
  const { tamanosAutomaticos } = configDescripcion
  if (longitud <= tamanosAutomaticos.muyCorta.hasta) return tamanosAutomaticos.muyCorta.tamano
  if (longitud <= tamanosAutomaticos.corta.hasta) return tamanosAutomaticos.corta.tamano
  if (longitud <= tamanosAutomaticos.mediana.hasta) return tamanosAutomaticos.mediana.tamano
  if (longitud <= tamanosAutomaticos.larga.hasta) return tamanosAutomaticos.larga.tamano
  if (longitud <= tamanosAutomaticos.muyLarga.hasta) return tamanosAutomaticos.muyLarga.tamano
  if (longitud <= tamanosAutomaticos.extraLarga.hasta) return tamanosAutomaticos.extraLarga.tamano
  return tamanosAutomaticos.gigante.tamano
}

export const obtenerLineasDescripcionConMetricaPdf = ({
  descripcion = '',
  configDescripcion = configuracionEtiqueta10x15.descripcion,
}) => {
  const medidor = obtenerMedidorPdf10x15()
  const tamanoPt = obtenerTamanoFuenteDescripcionPt(descripcion, configDescripcion)
  medidor.setFont(configDescripcion.fuenteNombre, configDescripcion.fuenteEstilo)
  medidor.setFontSize(tamanoPt)
  const lineas = componerLineasDescripcionEtiqueta({
    texto: String(descripcion || '').toUpperCase(),
    anchoMaximo: configDescripcion.anchoMaximo,
    maximoLineas: configDescripcion.maximoLineas,
    medirAncho: (textoLinea) => medidor.getTextWidth(textoLinea),
  })
  return { tamanoPt, lineas }
}

export const obtenerLayoutPreviewEtiqueta10x15 = ({
  etiqueta = {},
  anchoPreviewPx = 0,
  altoPreviewPx = 0,
  configuracion = configuracionEtiqueta10x15,
}) => {
  const { pagina, codigoArticulo, codigoBarra, descripcion, ubicacion } = configuracion
  const escalaX = anchoPreviewPx / pagina.ancho
  const escalaY = altoPreviewPx / pagina.alto
  const codigoTexto = String(etiqueta.codigo || '').toUpperCase()
  const descripcionTexto = String(etiqueta.descripcion || '').toUpperCase()
  const tamanoCodigoPt = obtenerTamanoFuenteCodigoPt(codigoTexto, codigoArticulo)
  const { tamanoPt: tamanoDescripcionPt, lineas: lineasDescripcion } = obtenerLineasDescripcionConMetricaPdf({
    descripcion: descripcionTexto,
    configDescripcion: descripcion,
  })
  const tamanoUbicacionPt = ubicacion.tamanoFuente
  const tamanoCodigoPx = ptAMm(tamanoCodigoPt) * escalaY
  const tamanoDescripcionPx = ptAMm(tamanoDescripcionPt) * escalaY
  const tamanoUbicacionPx = ptAMm(tamanoUbicacionPt) * escalaY
  const interlineadoDescripcionPx = (tamanoDescripcionPt * descripcion.interlineadoFactor) * escalaY
  const yDescripcionMm = descripcion.posicionesYPorLineas[lineasDescripcion.length] || descripcion.posicionesYPorLineas[7]
  return {
    lineasDescripcion,
    estilos: {
      codigo: {
        fontSize: `${tamanoCodigoPx.toFixed(2)}px`,
        top: `${(codigoArticulo.posicionY * escalaY - tamanoCodigoPx * FACTOR_ASCENSO_TEXTO).toFixed(2)}px`,
      },
      barra: {
        top: `${(codigoBarra.posicionY * escalaY).toFixed(2)}px`,
        width: `${(codigoBarra.ancho * escalaX).toFixed(2)}px`,
        height: `${(codigoBarra.alto * escalaY).toFixed(2)}px`,
      },
      descripcion: {
        fontSize: `${tamanoDescripcionPx.toFixed(2)}px`,
        top: `${(yDescripcionMm * escalaY - tamanoDescripcionPx * FACTOR_ASCENSO_TEXTO).toFixed(2)}px`,
        lineHeight: `${interlineadoDescripcionPx.toFixed(2)}px`,
      },
      ubicacion: {
        fontSize: `${tamanoUbicacionPx.toFixed(2)}px`,
        left: `${(ubicacion.posicionX * escalaX).toFixed(2)}px`,
        top: `${(ubicacion.posicionY * escalaY - tamanoUbicacionPx * FACTOR_ASCENSO_TEXTO).toFixed(2)}px`,
      },
    },
  }
}
