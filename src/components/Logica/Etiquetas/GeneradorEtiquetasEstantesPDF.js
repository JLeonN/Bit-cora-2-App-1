import { jsPDF } from 'jspdf'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import { imprimirPDFEnNavegador } from '../Compartidos/ImprimirPDFEnNavegador.js'

const MM_POR_PT = 0.352777778

function esPlataformaWeb() {
  return !window.Capacitor || window.Capacitor.getPlatform() === 'web'
}

function dibujarEtiquetaEstante(pdf, codigo, pagina) {
  const anchoDisponible = pagina.ancho * 0.88
  const tamanoMaximo = Math.floor((pagina.alto * 0.76) / MM_POR_PT)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  let tamanoFuente = tamanoMaximo
  pdf.setFontSize(tamanoFuente)
  while (tamanoFuente > 8 && pdf.getTextWidth(codigo) > anchoDisponible) {
    tamanoFuente -= 1
    pdf.setFontSize(tamanoFuente)
  }
  pdf.text(codigo, pagina.ancho / 2, pagina.alto / 2, { align: 'center', baseline: 'middle' })
}

function descargarPDF(pdf, nombreArchivo) {
  const url = URL.createObjectURL(pdf.output('blob'))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}

export async function generarDocumentoEtiquetasEstantes(codigos, configuracion, destino = 'descargar') {
  if (!codigos.length) throw new Error('No hay etiquetas de estantes para generar.')
  const { pagina } = configuracion
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [pagina.alto, pagina.ancho], compress: true })
  pdf.setProperties({ title: `Etiquetas de estantes ${configuracion.nombre}`, subject: 'Ubicaciones de estantes' })
  for (const [indice, codigo] of codigos.entries()) {
    if (indice > 0) pdf.addPage([pagina.alto, pagina.ancho])
    dibujarEtiquetaEstante(pdf, codigo, pagina)
    if ((indice + 1) % 8 === 0) await new Promise((resolver) => setTimeout(resolver, 0))
  }
  const nombreUsuario = await obtenerNombreUsuario()
  const ahora = new Date()
  const fecha = ahora.toISOString().slice(0, 10)
  const hora = ahora.toTimeString().slice(0, 8).replace(/:/g, '-')
  const nombreArchivo = `Estantes - ${nombreUsuario} - ${configuracion.id} - ${fecha} ${hora}.pdf`
  if (esPlataformaWeb()) {
    if (destino === 'imprimir') await imprimirPDFEnNavegador(pdf)
    else descargarPDF(pdf, nombreArchivo)
    return { exito: true, rutaArchivo: null, nombreArchivo }
  }
  const resultado = await Filesystem.writeFile({
    path: nombreArchivo,
    data: pdf.output('datauristring').split(',')[1],
    directory: Directory.Cache,
  })
  return { exito: true, rutaArchivo: resultado.uri, nombreArchivo }
}
