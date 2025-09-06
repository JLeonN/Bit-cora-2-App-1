// LectorExcel.js - Servicio para leer base de datos desde Excel
import { Filesystem, Directory } from '@capacitor/filesystem'
import * as XLSX from 'xlsx'

// TODO: Cambiar nombre del archivo por el definitivo
const NOMBRE_ARCHIVO_EXCEL = 'articulos.xlsx'

// --- CONFIGURACIÓN DE RUTAS DE BÚSQUEDA ---
// Define aquí las carpetas donde buscar el archivo Excel.
// Puedes agregar más si es necesario.
const RUTAS_POSIBLES = [
  { nombre: 'Documents', directorio: Directory.Documents },
  { nombre: 'Downloads', directorio: Directory.Downloads },
  // Agrega otras rutas si es necesario, por ejemplo:
  // { nombre: 'External', directorio: Directory.External },
]

// Define subcarpetas comunes donde podría estar el archivo.
const RUTAS_ESPECIFICAS = [
  '', // Raíz del directorio base (ej. /Downloads/)
  'WhatsApp/Media/WhatsApp Documents/',
  'Download/',
  'Bluetooth/',
]

// Variable global para almacenar los artículos cargados
let articulosDelExcel = []
let estadoCarga = 'no-cargado' // 'no-cargado', 'cargando', 'cargado', 'error'

// --- FUNCIÓN PARA BUSCAR EN MÚLTIPLES RUTAS ---
async function buscarArchivoEnMultiplesRutas() {
  console.log('Iniciando búsqueda en múltiples ubicaciones...')

  for (const rutaBase of RUTAS_POSIBLES) {
    for (const subruta of RUTAS_ESPECIFICAS) {
      const rutaCompleta = subruta + NOMBRE_ARCHIVO_EXCEL
      try {
        console.log(`Probando en: ${rutaBase.nombre}/${rutaCompleta}`)
        const archivo = await Filesystem.readFile({
          path: rutaCompleta,
          directory: rutaBase.directorio,
        })
        console.log(`¡ARCHIVO ENCONTRADO en ${rutaBase.nombre}/${rutaCompleta}!`)
        return archivo // Retorna el archivo encontrado
      } catch (error) {
        // Si no es un error de "archivo no encontrado", muéstralo.
        if (error.message && !error.message.includes('File does not exist')) {
          console.warn(`Aviso en ${rutaBase.nombre}/${rutaCompleta}: ${error.message}`)
        }
        // Si no, continúa buscando silenciosamente.
      }
    }
  }

  console.log('Archivo no encontrado en ninguna ubicación.')
  return null // Retorna null si no se encontró en ninguna parte
}

// --- FUNCIÓN PRINCIPAL PARA CARGAR EXCEL ---
export async function cargarArticulosDesdeExcel() {
  if (estadoCarga === 'cargando') {
    console.log('Ya se está procesando el archivo Excel...')
    return { exito: false, mensaje: 'Ya está cargando...' }
  }

  estadoCarga = 'cargando'
  console.log(`Buscando archivo: ${NOMBRE_ARCHIVO_EXCEL}...`)

  try {
    const archivoLeido = await buscarArchivoEnMultiplesRutas()

    if (!archivoLeido) {
      throw new Error('File does not exist')
    }

    console.log('Archivo encontrado, procesando Excel...')

    // Convertir Base64 a buffer para XLSX
    const datosBuffer = Uint8Array.from(atob(archivoLeido.data), (c) => c.charCodeAt(0))

    // Parsear Excel
    const libroExcel = XLSX.read(datosBuffer, { type: 'array' })
    const nombrePrimeraHoja = libroExcel.SheetNames[0]
    const hojaExcel = libroExcel.Sheets[nombrePrimeraHoja]

    // Convertir a JSON
    const datosJson = XLSX.utils.sheet_to_json(hojaExcel, { header: 1 })

    // Procesar y validar datos
    const articulosProcesados = procesarDatosExcel(datosJson)

    if (articulosProcesados.length === 0) {
      estadoCarga = 'error'
      return { exito: false, mensaje: 'El archivo Excel está vacío o tiene un formato incorrecto.' }
    }

    // Guardar en variable global
    articulosDelExcel = articulosProcesados
    estadoCarga = 'cargado'

    console.log(`Excel cargado exitosamente: ${articulosDelExcel.length} artículos`)
    return {
      exito: true,
      mensaje: `Base de datos cargada: ${articulosDelExcel.length} artículos`,
      cantidad: articulosDelExcel.length,
    }
  } catch (error) {
    estadoCarga = 'error'
    console.error('Error al cargar Excel:', error)

    let mensajeError = 'Error desconocido al procesar el archivo.'
    if (error.message?.includes('File does not exist')) {
      mensajeError = `No se encontró "${NOMBRE_ARCHIVO_EXCEL}". Asegúrate de que esté en Descargas, Documentos o carpetas similares.`
    } else if (error.message?.includes('Permission denied')) {
      mensajeError = 'No se tienen los permisos necesarios para leer el archivo.'
    }

    return { exito: false, mensaje: mensajeError }
  }
}

// --- FUNCIÓN PARA PROCESAR DATOS DEL EXCEL ---
function procesarDatosExcel(datosJson) {
  const articulosProcesados = []
  // Omitir la primera fila (encabezados)
  const filas = datosJson.slice(1)

  for (const fila of filas) {
    // Validar que la fila exista y tenga al menos 2 columnas
    if (!fila || fila.length < 2) continue

    const codigo = fila[0]?.toString()?.trim()
    const nombre = fila[1]?.toString()?.trim()

    // Validar que código y nombre no estén vacíos
    if (!codigo || !nombre) continue

    articulosProcesados.push({
      codigo: codigo.toUpperCase(),
      nombre: nombre.toUpperCase(),
    })
  }

  return articulosProcesados
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
  }
}

export function reiniciarBaseDatos() {
  articulosDelExcel = []
  estadoCarga = 'no-cargado'
}
