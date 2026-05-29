// GeneradorEtiquetasPDF.js
import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { limpiarCodigoParaBarra, validarCodigoParaBarra } from './GeneradorCodigoBarra.js'
import { calcularLayoutEtiquetaPreview, convertirLayoutPreviewAPixeles } from './UsoLayoutEtiquetaPreview.js'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

const PERFIL_RENDER_WEB = { anchoRenderPx: 1300, escalaCanvas: 1.5 }
const PERFIL_RENDER_MOVIL = { anchoRenderPx: 900, escalaCanvas: 1.1 }
const PAUSAR_CADA_PAGINAS = 8
const FAMILIA_FUENTE_ETIQUETA = 'Arial Black, Arial, Helvetica, sans-serif'

export const esPlataformaWeb = () => !window.Capacitor || window.Capacitor.getPlatform() === 'web'

const descargarPDFEnNavegador = (pdf, nombreArchivo) => {
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  link.click()
  URL.revokeObjectURL(url)
}

const obtenerNumeroPx = (valor) => Number.parseFloat(String(valor || '0').replace('px', '')) || 0
const obtenerPerfilRender = () => (esPlataformaWeb() ? PERFIL_RENDER_WEB : PERFIL_RENDER_MOVIL)
const pausarRenderCooperativo = () => new Promise((resolve) => setTimeout(resolve, 0))

const dibujarTextoCentrado = (contexto, texto, x, y) => {
  contexto.fillText(texto, x, y)
}

const crearCanvasCodigoBarra = (codigo, altoPx) => {
  const codigoLimpio = limpiarCodigoParaBarra(String(codigo || ''))
  if (!codigoLimpio || !validarCodigoParaBarra(codigoLimpio)) {
    return null
  }
  const canvasBarra = document.createElement('canvas')
  JsBarcode(canvasBarra, codigoLimpio, {
    format: 'CODE39',
    displayValue: false,
    background: '#ffffff',
    lineColor: '#000000',
    margin: 0,
    width: 3,
    height: Math.max(42, Math.round(altoPx)),
  })
  return canvasBarra
}

const generarCanvasEtiquetaDesdePreview = async (etiqueta, configuracion) => {
  const perfilRender = obtenerPerfilRender()
  const { pagina } = configuracion
  const altoRenderPx = perfilRender.anchoRenderPx / (pagina.ancho / pagina.alto)
  const anchoCanvas = perfilRender.anchoRenderPx * perfilRender.escalaCanvas
  const altoCanvas = altoRenderPx * perfilRender.escalaCanvas
  const layout = calcularLayoutEtiquetaPreview({
    etiqueta,
    configuracion,
    anchoReferenciaPx: perfilRender.anchoRenderPx,
  })
  const layoutPx = convertirLayoutPreviewAPixeles({
    layout,
    configuracion,
    anchoPreviewPx: perfilRender.anchoRenderPx,
    altoPreviewPx: altoRenderPx,
  })
  const canvas = document.createElement('canvas')
  canvas.width = anchoCanvas
  canvas.height = altoCanvas
  const contexto = canvas.getContext('2d')
  contexto.scale(perfilRender.escalaCanvas, perfilRender.escalaCanvas)
  contexto.fillStyle = '#ffffff'
  contexto.fillRect(0, 0, perfilRender.anchoRenderPx, altoRenderPx)
  contexto.fillStyle = '#000000'
  contexto.textAlign = 'center'
  contexto.textBaseline = 'top'

  const tamanoCodigo = obtenerNumeroPx(layoutPx.estilos.codigo.fontSize)
  const topCodigo = obtenerNumeroPx(layoutPx.estilos.codigo.top)
  contexto.font = `900 ${tamanoCodigo}px ${FAMILIA_FUENTE_ETIQUETA}`
  dibujarTextoCentrado(contexto, layout.codigo.texto, perfilRender.anchoRenderPx / 2, topCodigo)

  const leftBarra = obtenerNumeroPx(layoutPx.estilos.barra.left)
  const topBarra = obtenerNumeroPx(layoutPx.estilos.barra.top)
  const anchoBarra = obtenerNumeroPx(layoutPx.estilos.barra.width)
  const altoBarra = obtenerNumeroPx(layoutPx.estilos.barra.height)
  const canvasBarra = crearCanvasCodigoBarra(etiqueta.codigo, altoBarra)
  if (canvasBarra) {
    contexto.drawImage(canvasBarra, leftBarra, topBarra, anchoBarra, altoBarra)
  }

  const topDescripcion = obtenerNumeroPx(layoutPx.estilos.descripcion.top)
  const interlineadoDescripcion = obtenerNumeroPx(layoutPx.estilos.descripcion.lineHeight)
  layoutPx.lineasDescripcionConEstilos.forEach((linea, indice) => {
    const tamanoLinea = obtenerNumeroPx(linea.estilo.fontSize)
    contexto.font = `900 ${tamanoLinea}px ${FAMILIA_FUENTE_ETIQUETA}`
    dibujarTextoCentrado(
      contexto,
      linea.texto,
      perfilRender.anchoRenderPx / 2,
      topDescripcion + indice * interlineadoDescripcion,
    )
  })

  const tamanoUbicacion = obtenerNumeroPx(layoutPx.estilos.ubicacion.fontSize)
  const leftUbicacion = obtenerNumeroPx(layoutPx.estilos.ubicacion.left)
  const topUbicacion = obtenerNumeroPx(layoutPx.estilos.ubicacion.top)
  contexto.textAlign = 'left'
  contexto.font = `400 ${tamanoUbicacion}px Arial, Helvetica, sans-serif`
  contexto.fillText(layout.ubicacion.texto, leftUbicacion, topUbicacion)

  return { canvas, canvasBarra }
}

const crearPaginaEtiqueta = async (pdf, etiqueta, configuracion) => {
  const { pagina } = configuracion
  const { canvas, canvasBarra } = await generarCanvasEtiquetaDesdePreview(etiqueta, configuracion)
  pdf.addImage(canvas, 'PNG', 0, 0, pagina.ancho, pagina.alto)
  canvas.width = 0
  canvas.height = 0
  if (canvasBarra) {
    canvasBarra.width = 0
    canvasBarra.height = 0
  }
}

export const generarDocumentoEtiquetas = async (listaEtiquetas, configuracion) => {
  try {
    console.log(
      '[GeneradorEtiquetasPDF] Generando documento con',
      listaEtiquetas.length,
      'etiquetas usando configuración:',
      configuracion.nombre,
    )

    if (!listaEtiquetas || listaEtiquetas.length === 0) {
      throw new Error('No hay etiquetas para generar')
    }

    if (!configuracion) {
      throw new Error('No se proporcionó configuración de etiqueta')
    }

    const { pagina } = configuracion
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [pagina.alto, pagina.ancho],
    })

    pdf.setProperties({
      title: `Etiquetas ${configuracion.nombre}`,
      subject: 'Etiquetas con códigos de barras',
      author: 'Sistema de Etiquetas',
      creator: 'GeneradorEtiquetasPDF',
    })

    const inicioGeneracion = Date.now()
    let paginasGeneradas = 0
    let esPrimeraPagina = true
    for (const etiqueta of listaEtiquetas) {
      const cantidadCopias = etiqueta.cantidad || 1
      for (let i = 0; i < cantidadCopias; i += 1) {
        if (!esPrimeraPagina) {
          pdf.addPage([pagina.alto, pagina.ancho])
        }
        esPrimeraPagina = false
        await crearPaginaEtiqueta(pdf, etiqueta, configuracion)
        paginasGeneradas += 1
        if (paginasGeneradas % PAUSAR_CADA_PAGINAS === 0) {
          await pausarRenderCooperativo()
        }
      }
    }

    const nombreUsuario = await obtenerNombreUsuario()
    const idConfiguracionFormateado = configuracion.id.replace(/\s/g, '')
    const nombreArchivo = `Etiquetas - ${nombreUsuario} - ${idConfiguracionFormateado}.pdf`

    if (esPlataformaWeb()) {
      descargarPDFEnNavegador(pdf, nombreArchivo)
      console.log('[GeneradorEtiquetasPDF] PDF descargado en navegador')
      console.log('[GeneradorEtiquetasPDF] Telemetría:', {
        tiempoMs: Date.now() - inicioGeneracion,
        paginasGeneradas,
        plataforma: 'web',
        ruta: 'descarga',
      })
      return {
        exito: true,
        mensaje: 'PDF descargado correctamente',
        rutaArchivo: null,
        nombreArchivo,
      }
    }

    const pdfBase64 = pdf.output('datauristring').split(',')[1]
    const resultado = await Filesystem.writeFile({
      path: nombreArchivo,
      data: pdfBase64,
      directory: Directory.Cache,
    })

    console.log('[GeneradorEtiquetasPDF] Documento generado:', resultado.uri)
    console.log('[GeneradorEtiquetasPDF] Telemetría:', {
      tiempoMs: Date.now() - inicioGeneracion,
      paginasGeneradas,
      plataforma: window?.Capacitor?.getPlatform?.() || 'desconocida',
      ruta: 'share',
    })
    return {
      exito: true,
      mensaje: 'Documento generado correctamente',
      rutaArchivo: resultado.uri,
      nombreArchivo,
    }
  } catch (error) {
    console.error('[GeneradorEtiquetasPDF] Error:', error)
    return {
      exito: false,
      mensaje: error.message || 'Error al generar documento',
      rutaArchivo: null,
    }
  }
}
