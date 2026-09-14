import * as XLSX from 'xlsx'
import {
  crearIndiceCodigosMaestro,
  resolverCoincidenciasPorEvidencia,
} from '../Compartidos/ServicioCoincidenciasEvidenciaArticulo.js'
import {
  coincideContextoArticulo,
  normalizarTextoComparacionArticulo,
} from '../Compartidos/ServicioBusquedaArticulos.js'

const ENCABEZADOS_CODIGO = new Set(['CODIGO', 'COD', 'ARTICULO', 'SKU', 'REFERENCIA'])
const ENCABEZADOS_DESCRIPCION = new Set([
  'DESCRIPCION',
  'DESC',
  'NOMBRE',
  'DETALLE',
  'PRODUCTO',
])
const ENCABEZADOS_IGNORADOS = new Set([
  'CANTIDAD',
  'CANT',
  'UNIDADES',
  'STOCK',
  'UBICACION',
  'UBIC',
  'SUBUBICACION',
  'PRECIO',
  'COSTO',
  'DEPOSITO',
])
const TIPOS_EXCEL = new Set([
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

function normalizarEncabezado(valor) {
  return normalizarTextoComparacionArticulo(valor).replaceAll(' ', '')
}

function esFormatoExcel(nombreArchivo = '', tipoArchivo = '') {
  const nombre = String(nombreArchivo).trim().toLowerCase()
  const tipo = String(tipoArchivo).trim().toLowerCase()
  return nombre.endsWith('.xlsx') || nombre.endsWith('.xls') || TIPOS_EXCEL.has(tipo)
}

function validarCatalogo(articulos) {
  if (!Array.isArray(articulos) || articulos.length === 0) {
    throw new Error('No hay un catálogo maestro cargado para resolver el Excel.')
  }
}

function clasificarFilaEncabezado(valores) {
  const indicesCodigo = []
  const indicesDescripcion = []
  const indicesIgnorados = []
  let cantidadReconocidos = 0
  let cantidadNoVacios = 0

  valores.forEach((valor, indice) => {
    const encabezado = normalizarEncabezado(valor)
    if (!encabezado) return
    cantidadNoVacios += 1
    if (ENCABEZADOS_CODIGO.has(encabezado)) indicesCodigo.push(indice)
    else if (ENCABEZADOS_DESCRIPCION.has(encabezado)) indicesDescripcion.push(indice)
    else if (ENCABEZADOS_IGNORADOS.has(encabezado)) indicesIgnorados.push(indice)
    else return
    cantidadReconocidos += 1
  })

  const esEncabezado =
    cantidadReconocidos >= 2 ||
    (cantidadReconocidos === 1 && cantidadNoVacios === cantidadReconocidos)
  return {
    esEncabezado,
    indicesCodigo: esEncabezado ? indicesCodigo : [],
    indicesDescripcion: esEncabezado ? indicesDescripcion : [],
    indicesIgnorados: esEncabezado ? indicesIgnorados : [],
  }
}

function obtenerIdentidadArticulo(articulo) {
  return `${normalizarTextoComparacionArticulo(articulo?.codigo)}::${normalizarTextoComparacionArticulo(articulo?.nombre)}`
}

function unirCandidatos(destino, candidatos) {
  candidatos.forEach((articulo) => destino.set(obtenerIdentidadArticulo(articulo), articulo))
}

function crearResolucionBase({ hoja, numeroFila, indiceGlobal, valores }) {
  return {
    idFilaImportada: `${indiceGlobal}-${numeroFila}`,
    hoja,
    numeroFila,
    textoOriginal: valores
      .map((valor) => String(valor ?? '').trim())
      .filter(Boolean)
      .join(' | '),
    articuloUnico: null,
    candidatos: [],
  }
}

function resolverPorDescripcion({
  textos,
  articulos,
  contextoBusqueda,
  resolucionBase,
}) {
  const resultados = textos.map((texto) => {
    const evidencia = resolverCoincidenciasPorEvidencia({
      articulos,
      codigoVisible: '',
      descripcionVisible: texto,
      contextoBusqueda,
    })
    const nombreNormalizado = normalizarTextoComparacionArticulo(texto)
    const exactos = evidencia.candidatosCompatibles.filter(
      (articulo) =>
        coincideContextoArticulo(articulo, contextoBusqueda) &&
        normalizarTextoComparacionArticulo(articulo?.nombre) === nombreNormalizado,
    )
    return {
      texto,
      candidatos: exactos.length ? exactos : evidencia.candidatosCompatibles,
      esExacta: exactos.length > 0,
    }
  })
  const resultadosConCandidatos = resultados.filter((resultado) => resultado.candidatos.length)
  if (!resultadosConCandidatos.length) {
    return { ...resolucionBase, estado: 'noEncontrada', motivo: 'No se encontró el artículo.' }
  }

  const resultadosUnicos = resultadosConCandidatos.filter(
    (resultado) => resultado.candidatos.length === 1,
  )
  const candidatosUnicos = new Map()
  resultadosUnicos.forEach((resultado) => unirCandidatos(candidatosUnicos, resultado.candidatos))
  if (candidatosUnicos.size > 1) {
    return {
      ...resolucionBase,
      estado: 'ambigua',
      candidatos: [...candidatosUnicos.values()],
      motivo: 'Distintas celdas identifican artículos diferentes.',
    }
  }
  if (candidatosUnicos.size === 1) {
    const articuloUnico = [...candidatosUnicos.values()][0]
    const identidadUnica = obtenerIdentidadArticulo(articuloUnico)
    const evidenciaContradictoria = resultadosConCandidatos.some(
      (resultado) =>
        resultado.candidatos.length > 1 &&
        !resultado.candidatos.some(
          (candidato) => obtenerIdentidadArticulo(candidato) === identidadUnica,
        ),
    )
    if (!evidenciaContradictoria) {
      return { ...resolucionBase, estado: 'unica', articuloUnico }
    }
  }

  const candidatosCompatibles = new Map()
  resultadosConCandidatos.forEach((resultado) =>
    unirCandidatos(candidatosCompatibles, resultado.candidatos),
  )
  return {
    ...resolucionBase,
    estado: 'ambigua',
    candidatos: [...candidatosCompatibles.values()],
    motivo: 'La descripción coincide con más de un artículo.',
  }
}

function resolverFilaExcelListado({
  valores,
  mapaColumnas,
  indiceCodigos,
  articulos,
  contextoBusqueda,
  hoja,
  numeroFila,
  indiceGlobal,
}) {
  const indicesIgnorados = new Set(mapaColumnas?.indicesIgnorados || [])
  const celdasUtiles = valores
    .map((valor, indice) => ({ valor: String(valor ?? '').trim(), indice }))
    .filter((celda) => celda.valor && !indicesIgnorados.has(celda.indice))
  if (!celdasUtiles.length) return null

  const resolucionBase = crearResolucionBase({ hoja, numeroFila, indiceGlobal, valores })
  const codigosExactos = new Map()
  const codigosDuplicados = new Map()
  celdasUtiles.forEach(({ valor }) => {
    const codigo = normalizarTextoComparacionArticulo(valor)
    const coincidencias = indiceCodigos.get(codigo) || []
    if (coincidencias.length === 1) codigosExactos.set(codigo, coincidencias[0])
    if (coincidencias.length > 1) codigosDuplicados.set(codigo, coincidencias)
  })
  if (codigosDuplicados.size) {
    const candidatos = new Map()
    codigosDuplicados.forEach((coincidencias) => unirCandidatos(candidatos, coincidencias))
    return {
      ...resolucionBase,
      estado: 'inconsistente',
      candidatos: [...candidatos.values()],
      motivo: `El código ${[...codigosDuplicados.keys()].join(', ')} está duplicado en el catálogo maestro.`,
    }
  }
  if (codigosExactos.size > 1) {
    return {
      ...resolucionBase,
      estado: 'ambigua',
      candidatos: [...codigosExactos.values()],
      motivo: 'La fila contiene códigos exactos de artículos diferentes.',
    }
  }
  if (codigosExactos.size === 1) {
    return {
      ...resolucionBase,
      estado: 'unica',
      articuloUnico: [...codigosExactos.values()][0],
    }
  }

  const indicesDescripcion = mapaColumnas?.indicesDescripcion || []
  const celdasDescripcion = indicesDescripcion.length
    ? celdasUtiles.filter((celda) => indicesDescripcion.includes(celda.indice))
    : celdasUtiles.filter((celda) => !/^[-+]?\d+(?:[.,]\d+)?$/.test(celda.valor))
  const textosDescripcion = [...new Set(celdasDescripcion.map((celda) => celda.valor))]
  if (!textosDescripcion.length) {
    return { ...resolucionBase, estado: 'noEncontrada', motivo: 'No se encontró el artículo.' }
  }
  return resolverPorDescripcion({
    textos: textosDescripcion,
    articulos,
    contextoBusqueda,
    resolucionBase,
  })
}

function obtenerFilasHoja(hoja) {
  if (!hoja?.['!ref']) return []
  const rango = XLSX.utils.decode_range(hoja['!ref'])
  const filas = []
  for (let indiceFila = rango.s.r; indiceFila <= rango.e.r; indiceFila += 1) {
    const rangoFila = XLSX.utils.encode_range({
      s: { c: rango.s.c, r: indiceFila },
      e: { c: rango.e.c, r: indiceFila },
    })
    const valores = XLSX.utils.sheet_to_json(hoja, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
      range: rangoFila,
    })[0]
    if (Array.isArray(valores)) filas.push({ valores, numeroFila: indiceFila + 1 })
  }
  return filas
}

export function analizarLibroExcelListado({
  buffer,
  nombreArchivo = 'Excel importado',
  articulos,
  contextoBusqueda = '',
}) {
  validarCatalogo(articulos)
  if (!buffer || Number(buffer.byteLength) === 0) throw new Error('El archivo Excel está vacío.')
  let libro
  try {
    libro = XLSX.read(buffer, { type: 'array' })
  } catch {
    throw new Error('No se pudo leer el archivo Excel. Puede estar dañado o ser incompatible.')
  }
  if (!libro.SheetNames.length) throw new Error('El libro de Excel no contiene hojas.')

  const resoluciones = []
  const indiceCodigos = crearIndiceCodigosMaestro(articulos)
  let indiceGlobal = 0
  libro.SheetNames.forEach((nombreHoja) => {
    const hoja = libro.Sheets[nombreHoja]
    const filas = obtenerFilasHoja(hoja)
    let mapaColumnas = null
    filas.forEach(({ valores, numeroFila }) => {
      const clasificacion = clasificarFilaEncabezado(valores)
      if (clasificacion.esEncabezado) {
        mapaColumnas = clasificacion
        return
      }
      indiceGlobal += 1
      const resolucion = resolverFilaExcelListado({
        valores,
        mapaColumnas,
        indiceCodigos,
        articulos,
        contextoBusqueda,
        hoja: nombreHoja,
        numeroFila,
        indiceGlobal,
      })
      if (resolucion) resoluciones.push(resolucion)
    })
  })
  if (!resoluciones.length) throw new Error('El libro de Excel no contiene filas útiles.')
  return {
    nombreArchivo,
    totalHojas: libro.SheetNames.length,
    totalFilasUtiles: resoluciones.length,
    resoluciones,
  }
}

export async function procesarArchivoExcelListado({
  archivo,
  articulos,
  contextoBusqueda = '',
}) {
  if (!archivo || typeof archivo.arrayBuffer !== 'function') {
    throw new Error('Seleccioná un archivo Excel válido.')
  }
  if (!esFormatoExcel(archivo.name, archivo.type)) {
    throw new Error('El archivo debe tener formato .xlsx o .xls.')
  }
  const buffer = await archivo.arrayBuffer()
  return analizarLibroExcelListado({
    buffer,
    nombreArchivo: archivo.name || 'Excel importado',
    articulos,
    contextoBusqueda,
  })
}

function convertirBase64ABuffer(base64) {
  const contenido = String(base64 || '').replace(/^data:[^;]+;base64,/, '')
  if (!contenido) throw new Error('El archivo Excel recibido está vacío.')
  let binario
  try {
    binario = atob(contenido)
  } catch {
    throw new Error('No se pudo decodificar el archivo Excel recibido.')
  }
  const bytes = new Uint8Array(binario.length)
  for (let indice = 0; indice < binario.length; indice += 1) {
    bytes[indice] = binario.charCodeAt(indice)
  }
  return bytes.buffer
}

export function procesarExcelCompartidoListado({
  base64,
  nombreArchivo,
  tipoArchivo = '',
  articulos,
  contextoBusqueda = '',
}) {
  if (!esFormatoExcel(nombreArchivo, tipoArchivo)) {
    throw new Error('El archivo recibido debe tener formato .xlsx o .xls.')
  }
  return analizarLibroExcelListado({
    buffer: convertirBase64ABuffer(base64),
    nombreArchivo: nombreArchivo || 'Excel recibido',
    articulos,
    contextoBusqueda,
  })
}
