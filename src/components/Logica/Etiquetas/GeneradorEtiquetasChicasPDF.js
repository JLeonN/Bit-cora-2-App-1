import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import { imprimirPDFEnNavegador } from '../Compartidos/ImprimirPDFEnNavegador.js'
import { limpiarCodigoParaBarra, validarCodigoParaBarra } from './GeneradorCodigoBarra.js'
import { calcularLayoutEtiquetaChica } from './UsoLayoutEtiquetaChica.js'
import { calcularLayoutEtiqueta5x2p5 } from './UsoLayoutEtiqueta5x2p5.js'
import { TAMANO_ETIQUETA_CHICA, TAMANO_ETIQUETA_5X2P5 } from './ConfiguracionesDeEtiquetas/TamanosEtiqueta.js'

const MM_POR_PT = 0.352777778
const PAUSAR_CADA_PAGINAS = 8
const calcularLayoutPorTamano = {
  [TAMANO_ETIQUETA_CHICA]: calcularLayoutEtiquetaChica,
  [TAMANO_ETIQUETA_5X2P5]: calcularLayoutEtiqueta5x2p5,
}
const anchosPorTamano = {
  [TAMANO_ETIQUETA_CHICA]: 67,
  [TAMANO_ETIQUETA_5X2P5]: 50,
}

const esPlataformaWeb = () => !window.Capacitor || window.Capacitor.getPlatform() === 'web'
const pausarRenderCooperativo = () => new Promise((resolve) => setTimeout(resolve, 0))

function descargarPDFEnNavegador(pdf, nombreArchivo) {
  const url = URL.createObjectURL(pdf.output('blob'))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}

function obtenerTramosCodigoBarra(codigo) {
  const codigoLimpio = limpiarCodigoParaBarra(String(codigo || ''))
  if (!codigoLimpio || !validarCodigoParaBarra(codigoLimpio)) return []
  const canvas = document.createElement('canvas')
  try {
    JsBarcode(canvas, codigoLimpio, {
      format: 'CODE39',
      displayValue: false,
      background: '#ffffff',
      lineColor: '#000000',
      margin: 0,
      width: 3,
      height: 42,
    })
    const pixeles = canvas.getContext('2d').getImageData(0, Math.floor(canvas.height / 2), canvas.width, 1).data
    const tramos = []
    let inicio = -1
    for (let x = 0; x <= canvas.width; x += 1) {
      const esNegro = x < canvas.width && pixeles[x * 4] < 128
      if (esNegro && inicio < 0) inicio = x
      if (!esNegro && inicio >= 0) {
        tramos.push({ inicio: inicio / canvas.width, ancho: (x - inicio) / canvas.width })
        inicio = -1
      }
    }
    return tramos
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}

function dibujarEtiquetaVectorial(pdf, etiquetaPreparada, configuracion) {
  const { layout, tramosCodigoBarra } = etiquetaPreparada
  const anchoTexto = configuracion.pagina.ancho - 2 * configuracion.pagina.margenes.todos
  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(layout.codigo.tamanoPt)
  pdf.text(layout.codigo.texto, configuracion.pagina.ancho / 2,
    layout.codigo.posicionY - layout.codigo.tamanoPt * MM_POR_PT * 0.79,
    { align: 'center', baseline: 'top', maxWidth: anchoTexto })

  pdf.setFillColor(0, 0, 0)
  for (const tramo of tramosCodigoBarra) {
    pdf.rect(
      layout.codigoBarra.posicionX + tramo.inicio * layout.codigoBarra.ancho,
      layout.codigoBarra.posicionY,
      tramo.ancho * layout.codigoBarra.ancho,
      layout.codigoBarra.alto,
      'F',
    )
  }

  const arribaDescripcion = layout.descripcion.posicionY - layout.descripcion.tamanoPt * MM_POR_PT * 0.79
  const interlineado = layout.descripcion.interlineadoPt * MM_POR_PT
  pdf.setFontSize(layout.descripcion.tamanoPt)
  layout.descripcion.lineas.forEach((linea, indice) => {
    if (!linea.texto) return
    pdf.text(linea.texto, configuracion.pagina.ancho / 2, arribaDescripcion + indice * interlineado,
      { align: 'center', baseline: 'top', maxWidth: anchoTexto })
  })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(layout.ubicacion.tamanoPt)
  pdf.text(layout.ubicacion.texto, layout.ubicacion.posicionX,
    layout.ubicacion.posicionY - layout.ubicacion.tamanoPt * MM_POR_PT * 0.79,
    { baseline: 'top', maxWidth: anchoTexto })
}

export async function generarDocumentoEtiquetasChicas(listaEtiquetas, configuracion, destino = 'descargar') {
  try {
    if (!Array.isArray(listaEtiquetas) || listaEtiquetas.length === 0) throw new Error('No hay etiquetas para generar')
    const calcularLayout = calcularLayoutPorTamano[configuracion?.id]
    if (!calcularLayout || configuracion.pagina?.alto !== 25 || configuracion.pagina?.ancho !== anchosPorTamano[configuracion.id]) {
      throw new Error('La configuración de la etiqueta chica no es válida.')
    }
    const { pagina } = configuracion
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [pagina.alto, pagina.ancho], compress: true })
    pdf.setProperties({
      title: `Etiquetas ${configuracion.nombre}`,
      subject: 'Etiquetas con códigos de barras',
      author: 'Sistema de Etiquetas',
      creator: 'GeneradorEtiquetasChicasPDF',
    })
    let paginasGeneradas = 0
    const tramosPorCodigo = new Map()
    for (const etiqueta of listaEtiquetas) {
      const codigo = String(etiqueta.codigo || '')
      if (!tramosPorCodigo.has(codigo)) tramosPorCodigo.set(codigo, obtenerTramosCodigoBarra(codigo))
      const etiquetaPreparada = {
        layout: calcularLayout({ etiqueta, configuracion }),
        tramosCodigoBarra: tramosPorCodigo.get(codigo),
      }
      for (let indice = 0; indice < (etiqueta.cantidad || 1); indice += 1) {
        if (paginasGeneradas > 0) pdf.addPage([pagina.alto, pagina.ancho])
        dibujarEtiquetaVectorial(pdf, etiquetaPreparada, configuracion)
        paginasGeneradas += 1
        if (paginasGeneradas % PAUSAR_CADA_PAGINAS === 0) await pausarRenderCooperativo()
      }
    }
    const nombreUsuario = await obtenerNombreUsuario()
    const ahora = new Date()
    const fecha = ahora.toISOString().split('T')[0]
    const hora = ahora.toTimeString().slice(0, 5).replace(':', '-')
    const nombreArchivo = `Etiquetas - ${nombreUsuario} - ${configuracion.id} ${fecha} # ${hora}.pdf`
    if (esPlataformaWeb()) {
      if (destino === 'imprimir') await imprimirPDFEnNavegador(pdf)
      else descargarPDFEnNavegador(pdf, nombreArchivo)
      return { exito: true, mensaje: destino === 'imprimir' ? 'Diálogo de impresión abierto' : 'PDF descargado correctamente', rutaArchivo: null, nombreArchivo }
    }
    const resultado = await Filesystem.writeFile({
      path: nombreArchivo,
      data: pdf.output('datauristring').split(',')[1],
      directory: Directory.Cache,
    })
    return { exito: true, mensaje: 'Documento generado correctamente', rutaArchivo: resultado.uri, nombreArchivo }
  } catch (error) {
    console.error('[GeneradorEtiquetasChicasPDF] Error:', error)
    return { exito: false, mensaje: error.message || 'Error al generar documento', rutaArchivo: null, nombreArchivo: null }
  }
}
