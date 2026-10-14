import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import { limpiarCodigoParaBarra, validarCodigoParaBarra } from './GeneradorCodigoBarra.js'
import { calcularLayoutEtiqueta5x2p5 } from './UsoLayoutEtiqueta5x2p5.js'
import { convertirLayoutPreviewAPixeles } from './UsoLayoutEtiquetaPreview.js'
import { TAMANO_ETIQUETA_5X2P5 } from './ConfiguracionesDeEtiquetas/TamanosEtiqueta.js'

const PERFIL_RENDER_WEB = { anchoRenderPx: 1200, escalaCanvas: 1.35, calidadJpeg: 0.82 }
const PERFIL_RENDER_MOVIL = { anchoRenderPx: 680, escalaCanvas: 1, calidadJpeg: 0.68 }
const FAMILIA_FUENTE_ETIQUETA = 'Arial Black, Arial, Helvetica, sans-serif'

const esPlataformaWeb = () => !window.Capacitor || window.Capacitor.getPlatform() === 'web'
const obtenerNumeroPx = (valor) => Number.parseFloat(String(valor || '0').replace('px', '')) || 0
const pausarRenderCooperativo = () => new Promise((resolve) => setTimeout(resolve, 0))

function descargarPDF5x2p5EnNavegador(pdf, nombreArchivo) {
  const url = URL.createObjectURL(pdf.output('blob'))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}

function imprimirPDF5x2p5EnNavegador(pdf) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(pdf.output('blob'))
    const marco = document.createElement('iframe')
    marco.style.position = 'fixed'
    marco.style.left = '-10000px'
    marco.style.width = '1px'
    marco.style.height = '1px'
    marco.style.border = '0'
    marco.setAttribute('aria-hidden', 'true')
    let temporizadorLimpieza = null
    const temporizadorCarga = setTimeout(() => {
      limpiar()
      reject(new Error('El visor de PDF tardó demasiado en abrirse.'))
    }, 20000)
    const limpiar = () => {
      clearTimeout(temporizadorCarga)
      if (temporizadorLimpieza) clearTimeout(temporizadorLimpieza)
      marco.contentWindow?.removeEventListener('afterprint', limpiar)
      marco.onload = null
      marco.onerror = null
      marco.remove()
      URL.revokeObjectURL(url)
    }
    marco.onload = () => {
      clearTimeout(temporizadorCarga)
      marco.onload = null
      try {
        marco.contentWindow.addEventListener('afterprint', limpiar, { once: true })
        temporizadorLimpieza = setTimeout(limpiar, 300000)
        marco.contentWindow.focus()
        marco.contentWindow.print()
        resolve()
      } catch (error) {
        limpiar()
        reject(error)
      }
    }
    marco.onerror = () => {
      limpiar()
      reject(new Error('No se pudo abrir el documento para imprimir.'))
    }
    marco.src = url
    document.body.appendChild(marco)
  })
}

function crearCanvasCodigoBarra(codigo, altoPx) {
  const codigoLimpio = limpiarCodigoParaBarra(String(codigo || ''))
  if (!codigoLimpio || !validarCodigoParaBarra(codigoLimpio)) return null
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

function generarImagenEtiqueta5x2p5(etiqueta, configuracion, perfilRender) {
  const { anchoRenderPx, escalaCanvas, calidadJpeg } = perfilRender
  const altoRenderPx = anchoRenderPx / 2
  const layout = calcularLayoutEtiqueta5x2p5({ etiqueta, configuracion, anchoReferenciaPx: anchoRenderPx })
  const layoutPx = convertirLayoutPreviewAPixeles({
    layout,
    configuracion,
    anchoPreviewPx: anchoRenderPx,
    altoPreviewPx: altoRenderPx,
  })
  const canvas = document.createElement('canvas')
  canvas.width = anchoRenderPx * escalaCanvas
  canvas.height = altoRenderPx * escalaCanvas
  let canvasBarra = null
  try {
    const contexto = canvas.getContext('2d')
    contexto.scale(escalaCanvas, escalaCanvas)
    contexto.fillStyle = '#ffffff'
    contexto.fillRect(0, 0, anchoRenderPx, altoRenderPx)
    contexto.fillStyle = '#000000'
    contexto.textAlign = 'center'
    contexto.textBaseline = 'top'
    contexto.font = `900 ${obtenerNumeroPx(layoutPx.estilos.codigo.fontSize)}px ${FAMILIA_FUENTE_ETIQUETA}`
    contexto.fillText(layout.codigo.texto, anchoRenderPx / 2, obtenerNumeroPx(layoutPx.estilos.codigo.top))

    const altoBarra = obtenerNumeroPx(layoutPx.estilos.barra.height)
    canvasBarra = crearCanvasCodigoBarra(etiqueta.codigo, altoBarra)
    if (canvasBarra) {
      contexto.drawImage(canvasBarra,
        obtenerNumeroPx(layoutPx.estilos.barra.left),
        obtenerNumeroPx(layoutPx.estilos.barra.top),
        obtenerNumeroPx(layoutPx.estilos.barra.width),
        altoBarra)
    }

    const topDescripcion = obtenerNumeroPx(layoutPx.estilos.descripcion.top)
    const interlineadoDescripcion = obtenerNumeroPx(layoutPx.estilos.descripcion.lineHeight)
    layoutPx.lineasDescripcionConEstilos.forEach((linea, indice) => {
      contexto.font = `900 ${obtenerNumeroPx(linea.estilo.fontSize)}px ${FAMILIA_FUENTE_ETIQUETA}`
      contexto.fillText(linea.texto, anchoRenderPx / 2, topDescripcion + indice * interlineadoDescripcion)
    })

    contexto.textAlign = 'left'
    contexto.font = `400 ${obtenerNumeroPx(layoutPx.estilos.ubicacion.fontSize)}px Arial, Helvetica, sans-serif`
    contexto.fillText(layout.ubicacion.texto,
      obtenerNumeroPx(layoutPx.estilos.ubicacion.left),
      obtenerNumeroPx(layoutPx.estilos.ubicacion.top))
    return canvas.toDataURL('image/jpeg', calidadJpeg)
  } finally {
    canvas.width = 0
    canvas.height = 0
    if (canvasBarra) {
      canvasBarra.width = 0
      canvasBarra.height = 0
    }
  }
}

export async function generarDocumentoEtiquetas5x2p5(listaEtiquetas, configuracion, destino = 'descargar') {
  try {
    if (!Array.isArray(listaEtiquetas) || listaEtiquetas.length === 0) throw new Error('No hay etiquetas para generar')
    if (configuracion?.id !== TAMANO_ETIQUETA_5X2P5 || configuracion.pagina?.ancho !== 50 || configuracion.pagina?.alto !== 25) {
      throw new Error('La configuración de la etiqueta 5 × 2,5 cm no es válida.')
    }
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [25, 50], compress: true })
    pdf.setProperties({
      title: `Etiquetas ${configuracion.nombre}`,
      subject: 'Etiquetas con códigos de barras',
      author: 'Sistema de Etiquetas',
      creator: 'GeneradorEtiquetas5x2p5PDF',
    })
    const perfilRender = esPlataformaWeb() ? PERFIL_RENDER_WEB : PERFIL_RENDER_MOVIL
    let paginasGeneradas = 0
    for (const etiqueta of listaEtiquetas) {
      const imagen = generarImagenEtiqueta5x2p5(etiqueta, configuracion, perfilRender)
      for (let indice = 0; indice < (etiqueta.cantidad || 1); indice += 1) {
        if (paginasGeneradas > 0) pdf.addPage([25, 50])
        pdf.addImage(imagen, 'JPEG', 0, 0, 50, 25, undefined, 'FAST')
        paginasGeneradas += 1
        if (paginasGeneradas % 8 === 0) await pausarRenderCooperativo()
      }
    }
    const nombreUsuario = await obtenerNombreUsuario()
    const ahora = new Date()
    const fecha = ahora.toISOString().split('T')[0]
    const hora = ahora.toTimeString().slice(0, 5).replace(':', '-')
    const nombreArchivo = `Etiquetas - ${nombreUsuario} - 5x2.5cm ${fecha} # ${hora}.pdf`
    if (esPlataformaWeb()) {
      if (destino === 'imprimir') await imprimirPDF5x2p5EnNavegador(pdf)
      else descargarPDF5x2p5EnNavegador(pdf, nombreArchivo)
      return { exito: true, mensaje: destino === 'imprimir' ? 'Diálogo de impresión abierto' : 'PDF descargado correctamente', rutaArchivo: null, nombreArchivo }
    }
    const resultado = await Filesystem.writeFile({
      path: nombreArchivo,
      data: pdf.output('datauristring').split(',')[1],
      directory: Directory.Cache,
    })
    return { exito: true, mensaje: 'Documento generado correctamente', rutaArchivo: resultado.uri, nombreArchivo }
  } catch (error) {
    console.error('[GeneradorEtiquetas5x2p5PDF] Error:', error)
    return { exito: false, mensaje: error.message || 'Error al generar documento', rutaArchivo: null, nombreArchivo: null }
  }
}
