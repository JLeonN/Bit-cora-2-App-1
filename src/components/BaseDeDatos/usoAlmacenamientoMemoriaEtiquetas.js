import { Preferences } from '@capacitor/preferences'
import { TAMANO_ETIQUETA_GRANDE, TAMANO_ETIQUETA_CHICA } from '../Logica/Etiquetas/ConfiguracionesDeEtiquetas/TamanosEtiqueta.js'

const CLAVES = {
  [TAMANO_ETIQUETA_GRANDE]: 'memoria_etiquetas_v1',
  [TAMANO_ETIQUETA_CHICA]: 'memoria_etiquetas_2_5x6_7_v1',
}
const CLAVE_RESPALDO = 'respaldo_memorias_etiquetas_v2'
const LIMITE_MEMORIA = 1500
export const MAXIMO_ENTRADAS_COMPARTIR = 3000
const normalizarCodigo = (codigo) => String(codigo || '').trim().toUpperCase()
const esTamanoValido = (tamano) => Object.hasOwn(CLAVES, tamano)
const estructuraVacia = () => ({ version: '1.0', actualizadoEn: Date.now(), entradas: {} })
const clonarEntrada = (entrada) => ({
  codigo: normalizarCodigo(entrada.codigo),
  descripcionFormateada: String(entrada.descripcionFormateada ?? ''),
  actualizadoEn: Number(entrada.actualizadoEn || Date.now()),
})

function normalizarMemoria(cruda) {
  const memoria = estructuraVacia()
  if (!cruda || typeof cruda !== 'object') return memoria
  memoria.version = String(cruda.version || '1.0')
  memoria.actualizadoEn = Number(cruda.actualizadoEn || Date.now())
  for (const [codigo, entrada] of Object.entries(cruda.entradas || {})) {
    const clave = normalizarCodigo(codigo || entrada?.codigo)
    if (clave) memoria.entradas[clave] = clonarEntrada({ ...entrada, codigo: clave })
  }
  return memoria
}

async function leerMemoria(tamano) {
  if (!esTamanoValido(tamano)) throw new Error('Tamaño de etiqueta desconocido.')
  const { value } = await Preferences.get({ key: CLAVES[tamano] })
  return value ? normalizarMemoria(JSON.parse(value)) : estructuraVacia()
}

async function escribirMemoria(tamano, memoria) {
  await Preferences.set({ key: CLAVES[tamano], value: JSON.stringify(normalizarMemoria(memoria)) })
}

function recortarMemoria(memoria) {
  const entradas = Object.values(memoria.entradas)
  if (entradas.length <= LIMITE_MEMORIA) return memoria
  const recientes = entradas.sort((a, b) => b.actualizadoEn - a.actualizadoEn).slice(0, LIMITE_MEMORIA)
  return { ...memoria, entradas: Object.fromEntries(recientes.map((entrada) => [entrada.codigo, entrada])) }
}

export async function upsertMemoriaEtiqueta({ codigo, descripcionFormateada, tamano = TAMANO_ETIQUETA_GRANDE }) {
  if (!esTamanoValido(tamano)) return { exito: false, mensaje: 'Tamaño de etiqueta desconocido.' }
  const clave = normalizarCodigo(codigo)
  if (!clave) return { exito: false, mensaje: 'Código inválido para memoria de etiqueta.' }
  const memoria = await leerMemoria(tamano)
  memoria.entradas[clave] = clonarEntrada({ codigo: clave, descripcionFormateada, actualizadoEn: Date.now() })
  memoria.actualizadoEn = Date.now()
  const final = recortarMemoria(memoria)
  await escribirMemoria(tamano, final)
  return { exito: true, codigo: clave, entrada: final.entradas[clave] }
}

export async function obtenerMemoriaEtiquetaPorCodigo(codigo, tamano = TAMANO_ETIQUETA_GRANDE) {
  const memoria = await leerMemoria(tamano)
  return memoria.entradas[normalizarCodigo(codigo)] || null
}

export async function obtenerTodasLasMemoriasEtiquetas(tamano = TAMANO_ETIQUETA_GRANDE) {
  const memoria = await leerMemoria(tamano)
  return Object.values(memoria.entradas).sort((a, b) => b.actualizadoEn - a.actualizadoEn)
}

export async function obtenerTodasLasMemoriasPorTamano() {
  return {
    [TAMANO_ETIQUETA_GRANDE]: await obtenerTodasLasMemoriasEtiquetas(TAMANO_ETIQUETA_GRANDE),
    [TAMANO_ETIQUETA_CHICA]: await obtenerTodasLasMemoriasEtiquetas(TAMANO_ETIQUETA_CHICA),
  }
}

export async function eliminarMemoriaEtiquetaPorCodigo(codigo, tamano = TAMANO_ETIQUETA_GRANDE) {
  if (!esTamanoValido(tamano)) return { exito: false, mensaje: 'Tamaño de etiqueta desconocido.' }
  const clave = normalizarCodigo(codigo)
  if (!clave) return { exito: false, mensaje: 'Código inválido para eliminar memoria.' }
  const memoria = await leerMemoria(tamano)
  const eliminado = Boolean(memoria.entradas[clave])
  if (eliminado) {
    delete memoria.entradas[clave]
    memoria.actualizadoEn = Date.now()
    await escribirMemoria(tamano, memoria)
  }
  return { exito: true, eliminado, codigo: clave }
}

export async function limpiarMemoriaEtiquetas(tamano = TAMANO_ETIQUETA_GRANDE) {
  if (!esTamanoValido(tamano)) return { exito: false, mensaje: 'Tamaño de etiqueta desconocido.' }
  await Preferences.remove({ key: CLAVES[tamano] })
  return { exito: true }
}

export async function crearRespaldoMemoriaEtiquetas() {
  const memorias = {}
  for (const tamano of Object.keys(CLAVES)) memorias[tamano] = await leerMemoria(tamano)
  const respaldo = { creadoEn: Date.now(), memorias }
  await Preferences.set({ key: CLAVE_RESPALDO, value: JSON.stringify(respaldo) })
  return { exito: true, creadoEn: respaldo.creadoEn, cantidad: Object.values(memorias).reduce((total, memoria) => total + Object.keys(memoria.entradas).length, 0) }
}

export function construirJsonCompartirMemorias({ entradas = [], exportadoPor = 'Usuario desconocido', exportadoEn = Date.now() }) {
  if (entradas.length > MAXIMO_ENTRADAS_COMPARTIR) throw new Error('Se superó el límite de 3000 memorias.')
  const validas = entradas.filter((entrada) => esTamanoValido(entrada.tamano) && entrada.codigo && entrada.descripcionFormateada)
    .map((entrada) => ({ ...clonarEntrada(entrada), tamano: entrada.tamano }))
  return { version: '2.0', exportadoEn: Number(exportadoEn), exportadoPor: String(exportadoPor || 'Usuario desconocido'), cantidad: validas.length, entradas: validas }
}

export function parsearJsonCompartirMemorias(textoJson = '') {
  let json
  try { json = JSON.parse(String(textoJson)) } catch { return { exito: false, mensaje: 'No se pudo leer el JSON de memorias.' } }
  if (!['1.0', '2.0'].includes(json?.version) || !Array.isArray(json?.entradas) || !Number.isFinite(Number(json?.exportadoEn))) {
    return { exito: false, mensaje: 'El JSON no tiene una versión o estructura válida.' }
  }
  const limite = json.version === '1.0' ? 1000 : MAXIMO_ENTRADAS_COMPARTIR
  if (json.entradas.length > limite) return { exito: false, mensaje: `El archivo supera el límite de ${limite} entradas.` }
  const entradas = []
  let entradasInvalidas = 0
  for (const entrada of json.entradas) {
    const tamano = json.version === '1.0' ? TAMANO_ETIQUETA_GRANDE : entrada?.tamano
    if (!esTamanoValido(tamano) || !normalizarCodigo(entrada?.codigo) || typeof entrada?.descripcionFormateada !== 'string' || !entrada.descripcionFormateada || !Number.isFinite(Number(entrada?.actualizadoEn))) {
      entradasInvalidas += 1
      continue
    }
    entradas.push({ ...clonarEntrada(entrada), tamano })
  }
  return { exito: true, payload: { version: json.version, exportadoEn: Number(json.exportadoEn), exportadoPor: String(json.exportadoPor || 'usuario desconocido'), cantidad: entradas.length, entradas }, entradasInvalidas }
}

export async function fusionarMemoriasDesdeJsonPayload(payload) {
  const anteriores = {}
  const fusionadas = {}
  for (const tamano of Object.keys(CLAVES)) {
    anteriores[tamano] = await leerMemoria(tamano)
    fusionadas[tamano] = normalizarMemoria(anteriores[tamano])
  }
  let nuevas = 0
  let actualizadas = 0
  let ignoradas = 0
  for (const importada of payload.entradas || []) {
    if (!esTamanoValido(importada.tamano)) { ignoradas += 1; continue }
    const memoria = fusionadas[importada.tamano]
    const clave = normalizarCodigo(importada.codigo)
    const local = memoria.entradas[clave]
    if (!local) { memoria.entradas[clave] = clonarEntrada(importada); nuevas += 1 }
    else if (Number(importada.actualizadoEn) > Number(local.actualizadoEn)) { memoria.entradas[clave] = clonarEntrada(importada); actualizadas += 1 }
    else ignoradas += 1
  }
  for (const tamano of Object.keys(CLAVES)) {
    if (Object.keys(fusionadas[tamano].entradas).length > LIMITE_MEMORIA) {
      throw new Error(`La memoria ${tamano} supera el límite de ${LIMITE_MEMORIA} entradas.`)
    }
  }
  const afectados = Object.keys(CLAVES).filter((tamano) => JSON.stringify(fusionadas[tamano].entradas) !== JSON.stringify(anteriores[tamano].entradas))
  const escritos = []
  try {
    for (const tamano of afectados) {
      await escribirMemoria(tamano, recortarMemoria(fusionadas[tamano]))
      escritos.push(tamano)
    }
  } catch (error) {
    for (const tamano of escritos.reverse()) await escribirMemoria(tamano, anteriores[tamano])
    throw error
  }
  return { exito: true, resumen: { nuevas, actualizadas, ignoradas, totalFinal: Object.values(fusionadas).reduce((total, memoria) => total + Object.keys(memoria.entradas).length, 0) } }
}
