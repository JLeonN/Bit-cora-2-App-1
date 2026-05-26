import * as XLSX from 'xlsx'
import { Preferences } from '@capacitor/preferences'

let articulosDelExcel = []
let articulosBaseOriginal = []
let estadoCarga = 'no-cargado'
let informacionArchivo = null

const CLAVE_BASE_DATOS_PERSISTENTE = 'base_datos_excel_persistente'

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
}

function normalizarHistorial(historial) {
  if (!Array.isArray(historial)) return []
  return historial.map(normalizarTexto).filter(Boolean)
}

function normalizarArticulo(articulo) {
  return {
    codigo: normalizarTexto(articulo?.codigo),
    nombre: normalizarTexto(articulo?.nombre),
    ubicacionAntigua: normalizarTexto(articulo?.ubicacionAntigua),
    stock: articulo?.stock || '',
    historialUbicaciones: normalizarHistorial(articulo?.historialUbicaciones),
  }
}

function obtenerCodigosDuplicadosEnLista(listaUbicaciones) {
  const conteo = new Map()
  for (const item of listaUbicaciones) {
    const codigo = normalizarTexto(item?.codigo)
    if (!codigo) continue
    conteo.set(codigo, (conteo.get(codigo) || 0) + 1)
  }
  return Array.from(conteo.entries())
    .filter(([, cantidad]) => cantidad > 1)
    .map(([codigo]) => codigo)
}

async function guardarBaseDatosEnPreferences() {
  try {
    const datosAGuardar = {
      articulosCargados: articulosDelExcel,
      articulosBaseOriginal: articulosBaseOriginal,
      informacionArchivo: informacionArchivo,
      fechaCarga: Date.now(),
      version: '3.0',
    }

    await Preferences.set({
      key: CLAVE_BASE_DATOS_PERSISTENTE,
      value: JSON.stringify(datosAGuardar),
    })
  } catch (error) {
    console.error('[LectorExcel] Error al persistir base de datos:', error)
  }
}

async function limpiarBaseDatosPersistida() {
  try {
    await Preferences.remove({ key: CLAVE_BASE_DATOS_PERSISTENTE })
  } catch (error) {
    console.error('[LectorExcel] Error al limpiar base persistida:', error)
  }
}

async function cargarBaseDatosDesdePreferences() {
  try {
    const resultado = await Preferences.get({ key: CLAVE_BASE_DATOS_PERSISTENTE })
    if (!resultado.value) return false

    const datosGuardados = JSON.parse(resultado.value)
    if (!Array.isArray(datosGuardados.articulosCargados)) {
      await limpiarBaseDatosPersistida()
      return false
    }

    const articulosMigrados = datosGuardados.articulosCargados.map(normalizarArticulo)
    const baseOriginalGuardada = Array.isArray(datosGuardados.articulosBaseOriginal)
      ? datosGuardados.articulosBaseOriginal
      : articulosMigrados
    const baseOriginalMigrada = baseOriginalGuardada.map(normalizarArticulo)

    articulosDelExcel = articulosMigrados
    articulosBaseOriginal = baseOriginalMigrada
    informacionArchivo = datosGuardados.informacionArchivo || null
    estadoCarga = articulosDelExcel.length > 0 ? 'cargado' : 'no-cargado'
    return true
  } catch (error) {
    console.error('[LectorExcel] Error al cargar base persistida:', error)
    await limpiarBaseDatosPersistida()
    return false
  }
}

function crearSelectorDeArchivo() {
  return new Promise((resolve, reject) => {
    const inputArchivo = document.createElement('input')
    inputArchivo.type = 'file'
    inputArchivo.accept = '.xlsx,.xls'
    inputArchivo.style.display = 'none'

    inputArchivo.onchange = (evento) => {
      const archivo = evento.target.files?.[0]
      if (archivo) {
        resolve(archivo)
      } else {
        reject(new Error('No se selecciono ningun archivo'))
      }
      document.body.removeChild(inputArchivo)
    }

    inputArchivo.oncancel = () => {
      reject(new Error('Seleccion cancelada'))
      document.body.removeChild(inputArchivo)
    }

    document.body.appendChild(inputArchivo)
    inputArchivo.click()
  })
}

function leerArchivoComoBuffer(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = (evento) => resolve(evento.target.result)
    lector.onerror = () => reject(new Error('Error al leer el archivo'))
    lector.readAsArrayBuffer(archivo)
  })
}

function procesarDatosExcel(datosJson) {
  const articulosProcesados = []
  const filas = datosJson.slice(1)

  for (const fila of filas) {
    if (!fila || fila.length < 2) continue
    const codigo = normalizarTexto(fila[0])
    const nombre = normalizarTexto(fila[1])
    const ubicacionAntigua = normalizarTexto(fila[2])
    const stock = fila[3]?.toString()?.trim() || ''
    if (!codigo || !nombre) continue

    articulosProcesados.push({
      codigo,
      nombre,
      ubicacionAntigua,
      stock,
      historialUbicaciones: [],
    })
  }

  return articulosProcesados
}

export async function cargarArticulosDesdeExcel() {
  if (estadoCarga === 'cargando') {
    return { exito: false, mensaje: 'Ya esta cargando...' }
  }

  estadoCarga = 'cargando'

  try {
    const archivoSeleccionado = await crearSelectorDeArchivo()
    informacionArchivo = {
      nombre: archivoSeleccionado.name,
      tamano: archivoSeleccionado.size,
      tipo: archivoSeleccionado.type,
      fechaModificacion: archivoSeleccionado.lastModified,
    }

    const esExcel =
      archivoSeleccionado.name.toLowerCase().endsWith('.xlsx') ||
      archivoSeleccionado.name.toLowerCase().endsWith('.xls') ||
      archivoSeleccionado.type.includes('spreadsheet')

    if (!esExcel) {
      throw new Error('El archivo seleccionado no es un Excel valido (.xlsx o .xls)')
    }

    const bufferArchivo = await leerArchivoComoBuffer(archivoSeleccionado)
    const libroExcel = XLSX.read(bufferArchivo, { type: 'array' })
    if (!libroExcel.SheetNames || libroExcel.SheetNames.length === 0) {
      throw new Error('El archivo Excel no tiene hojas o esta corrupto')
    }

    const nombrePrimeraHoja = libroExcel.SheetNames[0]
    const hojaExcel = libroExcel.Sheets[nombrePrimeraHoja]
    const datosJson = XLSX.utils.sheet_to_json(hojaExcel, { header: 1 })
    const articulosProcesados = procesarDatosExcel(datosJson)

    if (articulosProcesados.length === 0) {
      estadoCarga = 'error'
      return {
        exito: false,
        mensaje:
          'El archivo no contiene datos validos. Asegurate de que tenga al menos 2 columnas: codigo y nombre.',
      }
    }

    articulosBaseOriginal = articulosProcesados.map((articulo) => ({ ...articulo }))
    articulosDelExcel = articulosProcesados.map((articulo) => ({ ...articulo }))
    estadoCarga = 'cargado'
    await guardarBaseDatosEnPreferences()

    return {
      exito: true,
      mensaje: `${articulosProcesados.length} articulos cargados desde "${informacionArchivo.nombre}"`,
      cantidad: articulosProcesados.length,
      archivo: informacionArchivo,
    }
  } catch (error) {
    estadoCarga = 'error'
    let mensajeError = 'Error desconocido al procesar el archivo.'
    if (error.message?.includes('No se selecciono')) {
      mensajeError = 'No se selecciono ningun archivo.'
    } else if (error.message?.includes('cancelada')) {
      mensajeError = 'Seleccion de archivo cancelada.'
    } else if (error.message?.includes('no es un Excel')) {
      mensajeError = 'El archivo seleccionado no es un Excel valido. Debe ser .xlsx o .xls'
    } else if (error.message?.includes('no tiene hojas')) {
      mensajeError = 'El archivo Excel esta corrupto o vacio.'
    } else if (error.message?.includes('no contiene datos')) {
      mensajeError = 'El archivo no tiene el formato correcto. Debe tener columnas: codigo y nombre.'
    } else {
      mensajeError = `Error al procesar: ${error.message}`
    }
    return { exito: false, mensaje: mensajeError }
  }
}

export async function inicializarBaseDatos() {
  if (estadoCarga !== 'no-cargado') return
  const cargaExitosa = await cargarBaseDatosDesdePreferences()
  if (!cargaExitosa) {
    estadoCarga = 'no-cargado'
  }
}

export function obtenerArticulosCargados() {
  return articulosDelExcel
}

export function obtenerEstadoCarga() {
  return {
    estado: estadoCarga,
    cantidad: articulosDelExcel.length,
    cargado: estadoCarga === 'cargado',
    archivo: informacionArchivo,
  }
}

export function obtenerInformacionArchivo() {
  return informacionArchivo
}

export async function reiniciarBaseDatos() {
  articulosDelExcel = []
  articulosBaseOriginal = []
  estadoCarga = 'no-cargado'
  informacionArchivo = null
  await limpiarBaseDatosPersistida()
}

export function obtenerUbicacionAntigua(codigo) {
  if (!codigo || typeof codigo !== 'string') return ''
  const codigoNormalizado = normalizarTexto(codigo)
  const articuloEncontrado = articulosDelExcel.find(
    (articulo) => normalizarTexto(articulo?.codigo) === codigoNormalizado,
  )
  return articuloEncontrado?.ubicacionAntigua || ''
}

export function obtenerStock(codigo) {
  if (!codigo || typeof codigo !== 'string') return ''
  const codigoNormalizado = normalizarTexto(codigo)
  const articuloEncontrado = articulosDelExcel.find(
    (articulo) => normalizarTexto(articulo?.codigo) === codigoNormalizado,
  )
  return articuloEncontrado?.stock || ''
}

export function obtenerArticuloPorCodigo(codigo) {
  if (!codigo || typeof codigo !== 'string') return null
  const codigoNormalizado = normalizarTexto(codigo)
  return (
    articulosDelExcel.find((articulo) => normalizarTexto(articulo?.codigo) === codigoNormalizado) ||
    null
  )
}

export function obtenerHistorialUbicaciones(codigo) {
  const articulo = obtenerArticuloPorCodigo(codigo)
  if (!articulo) return []
  return Array.isArray(articulo.historialUbicaciones) ? [...articulo.historialUbicaciones] : []
}

export async function actualizarUbicacionArticulo(codigo, nuevaUbicacion) {
  if (!codigo || typeof codigo !== 'string') {
    return { exito: false, mensaje: 'Codigo invalido para actualizar ubicacion' }
  }
  if (!nuevaUbicacion || typeof nuevaUbicacion !== 'string') {
    return { exito: false, mensaje: 'Ubicacion invalida para actualizar' }
  }
  if (!Array.isArray(articulosDelExcel) || articulosDelExcel.length === 0) {
    return { exito: false, mensaje: 'No hay base de datos cargada para actualizar' }
  }

  const codigoNormalizado = normalizarTexto(codigo)
  const ubicacionNormalizada = normalizarTexto(nuevaUbicacion)
  const indiceArticulo = articulosDelExcel.findIndex(
    (articulo) => normalizarTexto(articulo?.codigo) === codigoNormalizado,
  )

  if (indiceArticulo === -1) {
    return { exito: false, mensaje: `No se encontro el articulo ${codigoNormalizado}` }
  }

  const historialActual = Array.isArray(articulosDelExcel[indiceArticulo]?.historialUbicaciones)
    ? [...articulosDelExcel[indiceArticulo].historialUbicaciones]
    : []
  const ultimaUbicacion = historialActual.at(-1)
  if (ultimaUbicacion === ubicacionNormalizada) {
    return { exito: false, mensaje: 'La ubicacion nueva es igual a la ultima del historial' }
  }

  historialActual.push(ubicacionNormalizada)
  articulosDelExcel[indiceArticulo] = {
    ...articulosDelExcel[indiceArticulo],
    historialUbicaciones: historialActual,
  }

  await guardarBaseDatosEnPreferences()
  return {
    exito: true,
    mensaje: 'Historial de ubicaciones actualizado correctamente',
    articulo: articulosDelExcel[indiceArticulo],
  }
}

export function validarCodigosDuplicadosEnUbicaciones(listaUbicaciones) {
  if (!Array.isArray(listaUbicaciones)) {
    return { exito: false, codigosDuplicados: [] }
  }
  const codigosDuplicados = obtenerCodigosDuplicadosEnLista(listaUbicaciones)
  return {
    exito: codigosDuplicados.length === 0,
    codigosDuplicados,
  }
}

export async function reconstruirUbicacionesDesdeLista(listaUbicaciones) {
  if (!Array.isArray(listaUbicaciones)) {
    return { exito: false, mensaje: 'La lista de ubicaciones no tiene formato valido' }
  }
  if (!Array.isArray(articulosBaseOriginal) || articulosBaseOriginal.length === 0) {
    return { exito: false, mensaje: 'No hay base de datos original para reconstruir' }
  }

  const codigosDuplicados = obtenerCodigosDuplicadosEnLista(listaUbicaciones)
  if (codigosDuplicados.length > 0) {
    return {
      exito: false,
      mensaje: `Hay codigos duplicados en Ubicaciones: ${codigosDuplicados.join(', ')}`,
      codigosDuplicados,
    }
  }

  const mapaUbicacionActual = new Map()
  for (const ubicacionItem of listaUbicaciones) {
    const codigo = normalizarTexto(ubicacionItem?.codigo)
    const ubicacion = normalizarTexto(ubicacionItem?.ubicacion)
    if (!codigo || !ubicacion) continue
    mapaUbicacionActual.set(codigo, ubicacion)
  }

  const mapaHistorialActual = new Map(
    articulosDelExcel.map((articulo) => [
      normalizarTexto(articulo?.codigo),
      normalizarHistorial(articulo?.historialUbicaciones),
    ]),
  )

  articulosDelExcel = articulosBaseOriginal.map((articulo) => {
    const codigoArticulo = normalizarTexto(articulo?.codigo)
    const historial = mapaHistorialActual.get(codigoArticulo) || []
    const ubicacionDesdeLista = mapaUbicacionActual.get(codigoArticulo) || ''
    const historialResultado = [...historial]

    if (ubicacionDesdeLista && historialResultado.at(-1) !== ubicacionDesdeLista) {
      historialResultado.push(ubicacionDesdeLista)
    }

    return {
      ...normalizarArticulo(articulo),
      historialUbicaciones: historialResultado,
    }
  })

  await guardarBaseDatosEnPreferences()
  return {
    exito: true,
    mensaje: 'Base reconstruida correctamente desde la lista de ubicaciones',
    totalArticulos: articulosDelExcel.length,
    totalAplicados: mapaUbicacionActual.size,
  }
}

export function verificarSoporteSelector() {
  const tieneFileAPI = !!(window.File && window.FileReader && window.FileList && window.Blob)
  const tieneInputFile = document.createElement('input').type === 'file'
  return {
    soportado: tieneFileAPI && tieneInputFile,
    fileAPI: tieneFileAPI,
    inputFile: tieneInputFile,
  }
}

setTimeout(() => {
  inicializarBaseDatos()
}, 100)
