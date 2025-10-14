// LectorExcel.js - Con persistencia automática y carga al inicializar
import * as XLSX from 'xlsx'
import { Preferences } from '@capacitor/preferences'

// Variable global para almacenar los artículos cargados
let articulosDelExcel = []
let estadoCarga = 'no-cargado' // 'no-cargado', 'cargando', 'cargado', 'error'
let informacionArchivo = null // Info del archivo seleccionado

// Clave para persistir en Preferences
const CLAVE_BASE_DATOS_PERSISTENTE = 'base_datos_excel_persistente'

// --- FUNCIONES DE PERSISTENCIA ---
async function guardarBaseDatosEnPreferences() {
  try {
    const datosAGuardar = {
      articulosCargados: articulosDelExcel,
      informacionArchivo: informacionArchivo,
      fechaCarga: Date.now(),
      version: '2.0',
    }

    await Preferences.set({
      key: CLAVE_BASE_DATOS_PERSISTENTE,
      value: JSON.stringify(datosAGuardar),
    })

    console.log(`[LectorExcel] Base de datos persistida: ${articulosDelExcel.length} artículos`)
  } catch (error) {
    console.error('[LectorExcel] Error al persistir base de datos:', error)
  }
}

async function cargarBaseDatosDesdePreferences() {
  try {
    const resultado = await Preferences.get({
      key: CLAVE_BASE_DATOS_PERSISTENTE,
    })

    if (!resultado.value) {
      console.log('[LectorExcel] No hay base de datos persistida')
      return false
    }

    const datosGuardados = JSON.parse(resultado.value)

    // Validar estructura de datos
    if (!datosGuardados.articulosCargados || !Array.isArray(datosGuardados.articulosCargados)) {
      console.log('[LectorExcel] Datos persistidos inválidos, limpiando...')
      await limpiarBaseDatosPersistida()
      return false
    }

    // Migración automática para versiones anteriores sin ubicación antigua
    const articulosMigrados = datosGuardados.articulosCargados.map((articulo) => ({
      codigo: articulo.codigo,
      nombre: articulo.nombre,
      ubicacionAntigua: articulo.ubicacionAntigua || '', // Por defecto vacío
      stock: articulo.stock || '', // Por defecto vacío
    }))

    // Restaurar datos
    articulosDelExcel = articulosMigrados
    informacionArchivo = datosGuardados.informacionArchivo
    estadoCarga = articulosDelExcel.length > 0 ? 'cargado' : 'no-cargado'

    console.log(`[LectorExcel] Base de datos cargada desde persistencia:`)
    console.log(`- Artículos: ${articulosDelExcel.length}`)
    console.log(`- Archivo: ${informacionArchivo?.nombre || 'Sin info'}`)
    console.log(`- Fecha carga: ${new Date(datosGuardados.fechaCarga || 0).toLocaleString()}`)
    console.log(
      `- Con ubicaciones antiguas: ${articulosMigrados.filter((a) => a.ubicacionAntigua).length}`,
    )

    return true
  } catch (error) {
    console.error('[LectorExcel] Error al cargar base persistida:', error)
    await limpiarBaseDatosPersistida()
    return false
  }
}

async function limpiarBaseDatosPersistida() {
  try {
    await Preferences.remove({
      key: CLAVE_BASE_DATOS_PERSISTENTE,
    })
    console.log('[LectorExcel] Base de datos persistida eliminada')
  } catch (error) {
    console.error('[LectorExcel] Error al limpiar base persistida:', error)
  }
}

// --- FUNCIÓN PARA CREAR INPUT DE ARCHIVO ---
function crearSelectorDeArchivo() {
  return new Promise((resolve, reject) => {
    // Crear input de archivo invisible
    const inputArchivo = document.createElement('input')
    inputArchivo.type = 'file'
    inputArchivo.accept = '.xlsx,.xls' // Solo Excel
    inputArchivo.style.display = 'none'

    // Manejar selección de archivo
    inputArchivo.onchange = (evento) => {
      const archivo = evento.target.files[0]
      if (archivo) {
        console.log(`📁 Archivo seleccionado: ${archivo.name} (${archivo.size} bytes)`)
        resolve(archivo)
      } else {
        reject(new Error('No se seleccionó ningún archivo'))
      }
      // Limpiar el input
      document.body.removeChild(inputArchivo)
    }

    // Manejar cancelación
    inputArchivo.oncancel = () => {
      reject(new Error('Selección cancelada'))
      document.body.removeChild(inputArchivo)
    }

    // Agregar al DOM y activar
    document.body.appendChild(inputArchivo)
    inputArchivo.click()
  })
}

// --- FUNCIÓN PARA LEER ARCHIVO COMO ARRAY BUFFER ---
function leerArchivoComoBuffer(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()

    lector.onload = (evento) => {
      resolve(evento.target.result)
    }

    lector.onerror = () => {
      reject(new Error('Error al leer el archivo'))
    }

    // Leer como ArrayBuffer para XLSX
    lector.readAsArrayBuffer(archivo)
  })
}

// --- FUNCIÓN PRINCIPAL PARA CARGAR EXCEL CON SELECTOR ---
export async function cargarArticulosDesdeExcel() {
  if (estadoCarga === 'cargando') {
    console.log('Ya se está procesando un archivo...')
    return { exito: false, mensaje: 'Ya está cargando...' }
  }

  estadoCarga = 'cargando'
  console.log('Iniciando selector de archivos...')

  try {
    // Mostrar selector de archivos
    console.log('Abriendo selector de archivos...')
    const archivoSeleccionado = await crearSelectorDeArchivo()

    // Guardar información del archivo
    informacionArchivo = {
      nombre: archivoSeleccionado.name,
      tamano: archivoSeleccionado.size,
      tipo: archivoSeleccionado.type,
      fechaModificacion: archivoSeleccionado.lastModified,
    }

    console.log('Archivo seleccionado:', informacionArchivo)

    // Validar que sea un Excel
    const esExcel =
      archivoSeleccionado.name.toLowerCase().endsWith('.xlsx') ||
      archivoSeleccionado.name.toLowerCase().endsWith('.xls') ||
      archivoSeleccionado.type.includes('spreadsheet')

    if (!esExcel) {
      throw new Error('El archivo seleccionado no es un Excel válido (.xlsx o .xls)')
    }

    // Leer el archivo
    console.log('Leyendo contenido del archivo...')
    const bufferArchivo = await leerArchivoComoBuffer(archivoSeleccionado)

    // Procesar Excel
    console.log('Procesando Excel...')
    const libroExcel = XLSX.read(bufferArchivo, { type: 'array' })

    if (!libroExcel.SheetNames || libroExcel.SheetNames.length === 0) {
      throw new Error('El archivo Excel no tiene hojas o está corrupto')
    }

    const nombrePrimeraHoja = libroExcel.SheetNames[0]
    const hojaExcel = libroExcel.Sheets[nombrePrimeraHoja]

    console.log(`Procesando hoja: "${nombrePrimeraHoja}"`)

    // Convertir a JSON
    const datosJson = XLSX.utils.sheet_to_json(hojaExcel, { header: 1 })
    console.log(`Filas encontradas: ${datosJson.length}`)

    // Procesar y validar datos
    const articulosProcesados = procesarDatosExcel(datosJson)

    if (articulosProcesados.length === 0) {
      estadoCarga = 'error'
      return {
        exito: false,
        mensaje:
          'El archivo no contiene datos válidos. Asegúrate de que tenga al menos 2 columnas: código y nombre.',
      }
    }

    // Guardar en variable global
    articulosDelExcel = articulosProcesados
    estadoCarga = 'cargado'

    // ** PERSISTIR AUTOMÁTICAMENTE **
    await guardarBaseDatosEnPreferences()

    console.log(`¡Carga exitosa!`)
    console.log(`Estadísticas:`)
    console.log(`- Archivo: ${informacionArchivo.nombre}`)
    console.log(`- Tamaño: ${(informacionArchivo.tamano / 1024).toFixed(1)} KB`)
    console.log(`- Artículos cargados: ${articulosProcesados.length}`)
    console.log(
      `- Con ubicaciones antiguas: ${articulosProcesados.filter((a) => a.ubicacionAntigua).length}`,
    )
    console.log(`- Con stock: ${articulosProcesados.filter((a) => a.stock).length}`)
    console.log(`- Muestra:`, articulosProcesados.slice(0, 3))

    return {
      exito: true,
      mensaje: `${articulosProcesados.length} artículos cargados desde "${informacionArchivo.nombre}"`,
      cantidad: articulosProcesados.length,
      archivo: informacionArchivo,
    }
  } catch (error) {
    estadoCarga = 'error'
    console.error('Error al cargar Excel:', error)

    let mensajeError = 'Error desconocido al procesar el archivo.'

    if (error.message?.includes('No se seleccionó')) {
      mensajeError = 'No se seleccionó ningún archivo.'
    } else if (error.message?.includes('cancelada')) {
      mensajeError = 'Selección de archivo cancelada.'
    } else if (error.message?.includes('no es un Excel')) {
      mensajeError = 'El archivo seleccionado no es un Excel válido. Debe ser .xlsx o .xls'
    } else if (error.message?.includes('no tiene hojas')) {
      mensajeError = 'El archivo Excel está corrupto o vacío.'
    } else if (error.message?.includes('no contiene datos')) {
      mensajeError =
        'El archivo no tiene el formato correcto. Debe tener columnas: código y nombre.'
    } else {
      mensajeError = `Error al procesar: ${error.message}`
    }

    return { exito: false, mensaje: mensajeError }
  }
}

// --- FUNCIÓN PARA PROCESAR DATOS DEL EXCEL ---
// Procesa las 4 columnas A, B, C, D
function procesarDatosExcel(datosJson) {
  const articulosProcesados = []
  const filas = datosJson.slice(1) // Omitir encabezados

  console.log(`Procesando ${filas.length} filas de datos...`)

  // Mostrar encabezados para debug
  if (datosJson.length > 0) {
    console.log(`Encabezados detectados:`, datosJson[0])
  }

  let filasOmitidas = 0

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i]

    // Validar que la fila tenga datos mínimos (código y nombre)
    if (!fila || fila.length < 2) {
      filasOmitidas++
      continue
    }

    const codigo = fila[0]?.toString()?.trim()
    const nombre = fila[1]?.toString()?.trim()
    const ubicacionAntigua = fila[2]?.toString()?.trim() || '' // Columna C
    const stock = fila[3]?.toString()?.trim() || '' // Columna D (para futuro)

    // Validar que código y nombre no estén vacíos
    if (!codigo || !nombre) {
      filasOmitidas++
      continue
    }

    // Incluir nuevos campos
    articulosProcesados.push({
      codigo: codigo.toUpperCase(),
      nombre: nombre.toUpperCase(),
      ubicacionAntigua: ubicacionAntigua.toUpperCase(),
      stock: stock, // (mantenemos original para números)
    })
  }

  console.log(`Procesamiento completado:`)
  console.log(`- Filas procesadas: ${articulosProcesados.length}`)
  console.log(`- Filas omitidas: ${filasOmitidas}`)
  console.log(
    `- Artículos con ubicación antigua: ${articulosProcesados.filter((a) => a.ubicacionAntigua).length}`,
  )
  console.log(`- Artículos con stock: ${articulosProcesados.filter((a) => a.stock).length}`)

  return articulosProcesados
}

// --- FUNCIÓN DE INICIALIZACIÓN AUTOMÁTICA ---
export async function inicializarBaseDatos() {
  if (estadoCarga !== 'no-cargado') {
    console.log('[LectorExcel] Base de datos ya inicializada')
    return
  }

  console.log('[LectorExcel] Inicializando base de datos...')

  const cargaExitosa = await cargarBaseDatosDesdePreferences()

  if (!cargaExitosa) {
    console.log('[LectorExcel] No hay base de datos persistida, esperando carga manual')
  }
}

// --- FUNCIONES AUXILIARES ---
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
  estadoCarga = 'no-cargado'
  informacionArchivo = null

  // Limpiar persistencia
  await limpiarBaseDatosPersistida()

  console.log('Base de datos reiniciada y persistencia limpiada')
}

// Obtener ubicación antigua de un artículo
export function obtenerUbicacionAntigua(codigo) {
  // Validar que el código recibido no esté vacío
  if (!codigo || typeof codigo !== 'string') {
    console.warn('[obtenerUbicacionAntigua] Código inválido:', codigo)
    return ''
  }
  const articuloEncontrado = articulosDelExcel.find(
    (articulo) =>
      articulo && // Validar que el artículo existe
      articulo.codigo && // Validar que el código existe
      typeof articulo.codigo === 'string' && // Validar que es string
      articulo.codigo.toLowerCase() === codigo.toLowerCase(),
  )
  return articuloEncontrado?.ubicacionAntigua || ''
}

// Obtener stock de un artículo (para futuro uso) - TAMBIÉN CORREGIDO
export function obtenerStock(codigo) {
  // Validar que el código recibido no esté vacío
  if (!codigo || typeof codigo !== 'string') {
    console.warn('[obtenerStock] Código inválido:', codigo)
    return ''
  }

  const articuloEncontrado = articulosDelExcel.find(
    (articulo) =>
      articulo && // Validar que el artículo existe
      articulo.codigo && // Validar que el código existe
      typeof articulo.codigo === 'string' && // Validar que es string
      articulo.codigo.toLowerCase() === codigo.toLowerCase(),
  )

  return articuloEncontrado?.stock || ''
}

// Obtener artículo completo por código
export function obtenerArticuloPorCodigo(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    console.warn('[obtenerArticuloPorCodigo] Código inválido:', codigo)
    return null
  }

  const articuloEncontrado = articulosDelExcel.find(
    (articulo) =>
      articulo &&
      articulo.codigo &&
      typeof articulo.codigo === 'string' &&
      articulo.codigo.toLowerCase() === codigo.toLowerCase(),
  )

  return articuloEncontrado || null
}

// --- FUNCIÓN PARA VERIFICAR SOPORTE DEL NAVEGADOR ---
export function verificarSoporteSelector() {
  const tieneFileAPI = !!(window.File && window.FileReader && window.FileList && window.Blob)
  const tieneInputFile = document.createElement('input').type === 'file'

  return {
    soportado: tieneFileAPI && tieneInputFile,
    fileAPI: tieneFileAPI,
    inputFile: tieneInputFile,
  }
}

// --- INICIALIZACIÓN AUTOMÁTICA AL IMPORTAR EL MÓDULO ---
// Se ejecuta automáticamente cuando se importa el módulo
setTimeout(() => {
  inicializarBaseDatos()
}, 100)
