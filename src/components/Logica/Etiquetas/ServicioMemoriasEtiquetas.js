import { Filesystem, Directory } from '@capacitor/filesystem'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import {
  obtenerTodasLasMemoriasEtiquetas,
  construirJsonCompartirMemorias,
  parsearJsonCompartirMemorias,
  fusionarMemoriasDesdeJsonPayload,
  crearRespaldoMemoriaEtiquetas,
} from '../../BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js'
import {
  guardarUltimaExportacionMemorias,
  guardarUltimaImportacionMemorias,
} from '../../BaseDeDatos/usoAlmacenamientoMetadatosMemoriaEtiquetas.js'

function sanitizarTextoParaNombreArchivo(texto = '') {
  const base = String(texto || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
  return base || 'Usua-des'
}

export function crearNombreArchivoMemorias(nombreUsuario = '') {
  const nombreSanitizado = sanitizarTextoParaNombreArchivo(nombreUsuario)
  const ahora = new Date()
  const fecha = ahora.toISOString().split('T')[0]
  const hora = ahora.toTimeString().slice(0, 5).replace(':', '-')
  return `Memorias ${nombreSanitizado} ${fecha} # ${hora}.json`
}

function descargarJsonEnWeb(nombreArchivo, contenidoJson) {
  const blob = new Blob([contenidoJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  URL.revokeObjectURL(url)
}

export async function exportarMemoriasEtiquetas({ esPlataformaWeb, compartirArchivo }) {
  const entradas = await obtenerTodasLasMemoriasEtiquetas()
  if (!Array.isArray(entradas) || entradas.length === 0) {
    return { exito: false, sinDatos: true }
  }

  const nombreUsuario = await obtenerNombreUsuario()
  const payload = construirJsonCompartirMemorias({
    entradas,
    exportadoPor: nombreUsuario,
    exportadoEn: Date.now(),
  })
  const contenidoJson = JSON.stringify(payload, null, 2)
  const nombreArchivo = crearNombreArchivoMemorias(nombreUsuario)

  if (esPlataformaWeb()) {
    descargarJsonEnWeb(nombreArchivo, contenidoJson)
  } else {
    const resultado = await Filesystem.writeFile({
      path: nombreArchivo,
      directory: Directory.Cache,
      data: contenidoJson,
      encoding: 'utf8',
      recursive: true,
    })
    const compartido = await compartirArchivo(resultado.uri, nombreArchivo, {
      titulo: 'Memorias de etiquetas',
      texto: `Memorias exportadas por ${payload.exportadoPor}`,
    })
    if (!compartido) {
      return { exito: false, noCompartido: true }
    }
  }

  await guardarUltimaExportacionMemorias(Date.now())
  return {
    exito: true,
    cantidad: payload.cantidad,
    exportadoPor: payload.exportadoPor,
    nombreArchivo,
  }
}

export async function leerArchivoJsonDesdeSelector() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async (evento) => {
      try {
        const archivo = evento?.target?.files?.[0]
        if (!archivo) {
          resolve(null)
          return
        }
        const texto = await archivo.text()
        resolve({ nombre: archivo.name, texto })
      } catch (error) {
        reject(error)
      }
    }
    input.click()
  })
}

export async function importarMemoriasDesdeTexto({ textoJson, alAplicarCambios }) {
  const parseado = parsearJsonCompartirMemorias(textoJson)
  if (!parseado.exito) {
    return { exito: false, mensaje: parseado.mensaje || 'Archivo JSON inválido.' }
  }

  const payload = parseado.payload
  await crearRespaldoMemoriaEtiquetas()
  const resultadoFusion = await fusionarMemoriasDesdeJsonPayload(payload)
  const cantidadCambiosPantalla = await alAplicarCambios()
  await guardarUltimaImportacionMemorias(Date.now())

  return {
    exito: true,
    payload,
    entradasInvalidas: parseado.entradasInvalidas,
    resumen: resultadoFusion.resumen,
    cantidadCambiosPantalla,
  }
}

export function formatearFechaHoraLocal(fechaMs) {
  const fechaNumero = Number(fechaMs || 0)
  if (!Number.isFinite(fechaNumero) || fechaNumero <= 0) {
    return 'Sin registro'
  }
  return new Date(fechaNumero).toLocaleString('es-UY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
