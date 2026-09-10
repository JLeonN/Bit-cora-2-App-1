import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { jsPDF } from 'jspdf'

const ANCHO_PAGINA = 297
const ALTO_PAGINA = 210
const MARGEN = 10
const ALTO_ENCABEZADO = 8
const ALTO_MINIMO_FILA = 7
const TAMANO_TEXTO = 8
const INTERLINEADO = 3.6

function sanitizarNombreArchivo(nombre) {
  return String(nombre || '').replace(/[<>:"/\\|?*]/g, '').trim()
}

function crearNombreArchivoListado(nombrePersonalizado) {
  const ahora = new Date()
  const rellenar = (valor) => String(valor).padStart(2, '0')
  const fecha = `${rellenar(ahora.getDate())}-${rellenar(ahora.getMonth() + 1)}-${ahora.getFullYear()}`
  const hora = `${rellenar(ahora.getHours())}-${rellenar(ahora.getMinutes())}`
  const nombre = sanitizarNombreArchivo(nombrePersonalizado)
  return nombre
    ? `Listado _ ${nombre} _ ${fecha} ${hora}.pdf`
    : `Listado ${fecha} ${hora}.pdf`
}

function obtenerColumnas(configuracion) {
  const columnas = []
  if (configuracion?.mostrarNumeracion) {
    columnas.push({ clave: 'numero', titulo: 'N.º', ancho: 12, alineacion: 'center' })
  }
  columnas.push({ clave: 'codigo', titulo: 'Código', ancho: 38, alineacion: 'left' })
  if (configuracion?.mostrarStock) {
    columnas.push({ clave: 'stock', titulo: 'Stock', ancho: 22, alineacion: 'right' })
  }
  if (configuracion?.mostrarUbicacion) {
    columnas.push({ clave: 'ubicacion', titulo: 'Ubicación', ancho: 36, alineacion: 'left' })
  }
  const anchoFijo = columnas.reduce((total, columna) => total + columna.ancho, 0)
  columnas.splice(configuracion?.mostrarNumeracion ? 2 : 1, 0, {
    clave: 'descripcion',
    titulo: 'Descripción',
    ancho: ANCHO_PAGINA - MARGEN * 2 - anchoFijo,
    alineacion: 'left',
  })
  return columnas
}

function obtenerValorCelda(articulo, clave, indice) {
  const valores = {
    numero: indice + 1,
    codigo: articulo.codigo,
    descripcion: articulo.descripcion,
    stock: articulo.stockListado,
    ubicacion: articulo.ubicacionListado,
  }
  return String(valores[clave] ?? '')
}

function prepararFila(pdf, articulo, indice, columnas) {
  const celdas = columnas.map((columna) => ({
    ...columna,
    lineas: pdf.splitTextToSize(
      obtenerValorCelda(articulo, columna.clave, indice),
      columna.ancho - 4,
    ),
  }))
  const cantidadLineas = Math.max(...celdas.map((celda) => celda.lineas.length), 1)
  return { celdas, alto: Math.max(ALTO_MINIMO_FILA, cantidadLineas * INTERLINEADO + 3) }
}

function dibujarTitulo(pdf, nombreListado) {
  pdf.setTextColor(0)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text(String(nombreListado || 'Listado sin nombre'), MARGEN, 13)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('Listado de artículos · Formato A4', MARGEN, 18)
  return 23
}

function dibujarEncabezado(pdf, columnas, posicionY) {
  pdf.setFillColor(232, 232, 232)
  pdf.setDrawColor(120)
  pdf.setTextColor(0)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(TAMANO_TEXTO)
  let posicionX = MARGEN
  columnas.forEach((columna) => {
    pdf.setFillColor(232, 232, 232)
    pdf.rect(posicionX, posicionY, columna.ancho, ALTO_ENCABEZADO, 'FD')
    let posicionTextoX = posicionX + 2
    if (columna.alineacion === 'right') posicionTextoX = posicionX + columna.ancho - 2
    if (columna.alineacion === 'center') posicionTextoX = posicionX + columna.ancho / 2
    pdf.text(columna.titulo, posicionTextoX, posicionY + 5.2, {
      align: columna.alineacion === 'center' ? 'center' : columna.alineacion,
    })
    posicionX += columna.ancho
  })
  return posicionY + ALTO_ENCABEZADO
}

function dibujarFila(pdf, fila, posicionY) {
  pdf.setDrawColor(170)
  pdf.setTextColor(0)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(TAMANO_TEXTO)
  let posicionX = MARGEN
  fila.celdas.forEach((celda) => {
    pdf.rect(posicionX, posicionY, celda.ancho, fila.alto)
    let posicionTextoX = posicionX + 2
    if (celda.alineacion === 'right') posicionTextoX = posicionX + celda.ancho - 2
    if (celda.alineacion === 'center') posicionTextoX = posicionX + celda.ancho / 2
    pdf.text(celda.lineas, posicionTextoX, posicionY + 4.6, { align: celda.alineacion })
    posicionX += celda.ancho
  })
}

function agregarPiePaginas(pdf) {
  const totalPaginas = pdf.getNumberOfPages()
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(90)
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    pdf.setPage(pagina)
    pdf.text(`Página ${pagina} de ${totalPaginas}`, ANCHO_PAGINA - MARGEN, ALTO_PAGINA - 5, {
      align: 'right',
    })
  }
}

export function construirDocumentoPDFListado(articulosOrdenados, configuracion, nombreListado) {
  if (!Array.isArray(articulosOrdenados) || articulosOrdenados.length === 0) {
    throw new Error('No hay artículos para generar el archivo')
  }
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  const columnas = obtenerColumnas(configuracion)
  let posicionY = dibujarEncabezado(pdf, columnas, dibujarTitulo(pdf, nombreListado))
  articulosOrdenados.forEach((articulo, indice) => {
    const fila = prepararFila(pdf, articulo, indice, columnas)
    if (posicionY + fila.alto > ALTO_PAGINA - MARGEN) {
      pdf.addPage()
      posicionY = dibujarEncabezado(pdf, columnas, dibujarTitulo(pdf, nombreListado))
    }
    dibujarFila(pdf, fila, posicionY)
    posicionY += fila.alto
  })
  agregarPiePaginas(pdf)
  pdf.setProperties({
    title: String(nombreListado || 'Listado sin nombre'),
    subject: 'Listado de artículos para imprimir en A4',
    creator: 'Bitácora 2',
  })
  return pdf
}

function descargarPDFEnNavegador(pdf, nombreArchivo) {
  const url = URL.createObjectURL(pdf.output('blob'))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}

export async function generarYGuardarPDFListado(listado, articulosOrdenados) {
  const pdf = construirDocumentoPDFListado(
    articulosOrdenados,
    listado.configuracion,
    listado.nombre,
  )
  const nombreArchivo = crearNombreArchivoListado(listado.nombrePersonalizado)
  if (Capacitor.getPlatform() === 'web') {
    descargarPDFEnNavegador(pdf, nombreArchivo)
    return { uri: null, nombreArchivo }
  }
  const datosEnBase64 = pdf.output('datauristring').split(',')[1]
  const resultado = await Filesystem.writeFile({
    path: nombreArchivo,
    data: datosEnBase64,
    directory: Directory.Cache,
  })
  return { uri: resultado.uri, nombreArchivo }
}
