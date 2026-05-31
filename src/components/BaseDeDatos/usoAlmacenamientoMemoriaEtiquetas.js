import { Preferences } from '@capacitor/preferences'

const CLAVE_MEMORIA_ETIQUETAS = 'memoria_etiquetas_v1'
const CLAVE_RESPALDO_MEMORIA_ETIQUETAS = 'respaldo_memoria_etiquetas_v1'
const VERSION_MEMORIA = '1.0'
const MAXIMO_ENTRADAS_MEMORIA = 1500
export const MAXIMO_ENTRADAS_COMPARTIR = 1000

const normalizarCodigo = (codigo) => String(codigo || '').trim().toUpperCase()

const crearEstructuraVacia = () => ({
  version: VERSION_MEMORIA,
  actualizadoEn: Date.now(),
  entradas: {},
})

const clonarEntrada = (entrada = {}) => ({
  codigo: normalizarCodigo(entrada.codigo),
  descripcionFormateada: String(entrada.descripcionFormateada || ''),
  actualizadoEn: Number(entrada.actualizadoEn || Date.now()),
})

const normalizarMemoria = (memoriaCruda) => {
  if (!memoriaCruda || typeof memoriaCruda !== 'object') {
    return crearEstructuraVacia()
  }

  const entradasCrudas =
    memoriaCruda.entradas && typeof memoriaCruda.entradas === 'object' ? memoriaCruda.entradas : {}

  const entradasNormalizadas = {}
  for (const [codigoCrudo, entrada] of Object.entries(entradasCrudas)) {
    const codigo = normalizarCodigo(codigoCrudo || entrada?.codigo)
    if (!codigo) continue
    entradasNormalizadas[codigo] = clonarEntrada({ ...entrada, codigo })
  }

  return {
    version: String(memoriaCruda.version || VERSION_MEMORIA),
    actualizadoEn: Number(memoriaCruda.actualizadoEn || Date.now()),
    entradas: entradasNormalizadas,
  }
}

async function leerMemoriaCompleta() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_MEMORIA_ETIQUETAS })
    if (!value) {
      return crearEstructuraVacia()
    }
    const memoriaCruda = JSON.parse(value)
    return normalizarMemoria(memoriaCruda)
  } catch (error) {
    console.error('[MemoriaEtiquetas] Error leyendo memoria:', error)
    return crearEstructuraVacia()
  }
}

async function persistirMemoriaCompleta(memoria) {
  const memoriaNormalizada = normalizarMemoria(memoria)
  await Preferences.set({
    key: CLAVE_MEMORIA_ETIQUETAS,
    value: JSON.stringify(memoriaNormalizada),
  })
}

function clonarMemoriaParaRespaldo(memoria) {
  return {
    version: String(memoria.version || VERSION_MEMORIA),
    actualizadoEn: Number(memoria.actualizadoEn || Date.now()),
    entradas: { ...(memoria.entradas || {}) },
  }
}

function recortarMemoriaSiSuperaLimite(memoria) {
  const codigos = Object.keys(memoria.entradas || {})
  if (codigos.length <= MAXIMO_ENTRADAS_MEMORIA) {
    return memoria
  }

  const entradasOrdenadas = codigos
    .map((codigo) => memoria.entradas[codigo])
    .filter(Boolean)
    .sort((a, b) => Number(b.actualizadoEn || 0) - Number(a.actualizadoEn || 0))
    .slice(0, MAXIMO_ENTRADAS_MEMORIA)

  const entradasRecortadas = {}
  for (const entrada of entradasOrdenadas) {
    const codigo = normalizarCodigo(entrada.codigo)
    if (codigo) {
      entradasRecortadas[codigo] = clonarEntrada(entrada)
    }
  }

  return {
    ...memoria,
    entradas: entradasRecortadas,
    actualizadoEn: Date.now(),
  }
}

export async function upsertMemoriaEtiqueta({ codigo, descripcionFormateada }) {
  const codigoNormalizado = normalizarCodigo(codigo)
  if (!codigoNormalizado) {
    return { exito: false, mensaje: 'Codigo inválido para memoria de etiqueta' }
  }

  const memoria = await leerMemoriaCompleta()
  memoria.entradas[codigoNormalizado] = clonarEntrada({
    codigo: codigoNormalizado,
    descripcionFormateada,
    actualizadoEn: Date.now(),
  })
  memoria.actualizadoEn = Date.now()

  const memoriaFinal = recortarMemoriaSiSuperaLimite(memoria)
  await persistirMemoriaCompleta(memoriaFinal)

  return { exito: true, codigo: codigoNormalizado, entrada: memoriaFinal.entradas[codigoNormalizado] }
}

export async function obtenerMemoriaEtiquetaPorCodigo(codigo) {
  const codigoNormalizado = normalizarCodigo(codigo)
  if (!codigoNormalizado) return null
  const memoria = await leerMemoriaCompleta()
  return memoria.entradas[codigoNormalizado] || null
}

export async function obtenerTodasLasMemoriasEtiquetas() {
  const memoria = await leerMemoriaCompleta()
  return Object.values(memoria.entradas || {}).sort(
    (a, b) => Number(b.actualizadoEn || 0) - Number(a.actualizadoEn || 0),
  )
}

export async function eliminarMemoriaEtiquetaPorCodigo(codigo) {
  const codigoNormalizado = normalizarCodigo(codigo)
  if (!codigoNormalizado) {
    return { exito: false, mensaje: 'Codigo inválido para eliminar memoria' }
  }
  const memoria = await leerMemoriaCompleta()
  if (!memoria.entradas[codigoNormalizado]) {
    return { exito: true, eliminado: false, codigo: codigoNormalizado }
  }
  delete memoria.entradas[codigoNormalizado]
  memoria.actualizadoEn = Date.now()
  await persistirMemoriaCompleta(memoria)
  return { exito: true, eliminado: true, codigo: codigoNormalizado }
}

export async function limpiarMemoriaEtiquetas() {
  await Preferences.remove({ key: CLAVE_MEMORIA_ETIQUETAS })
  return { exito: true }
}

export async function crearRespaldoMemoriaEtiquetas() {
  const memoria = await leerMemoriaCompleta()
  const respaldo = {
    creadoEn: Date.now(),
    memoria: clonarMemoriaParaRespaldo(memoria),
  }
  await Preferences.set({
    key: CLAVE_RESPALDO_MEMORIA_ETIQUETAS,
    value: JSON.stringify(respaldo),
  })
  return { exito: true, creadoEn: respaldo.creadoEn, cantidad: Object.keys(memoria.entradas || {}).length }
}

export function construirJsonCompartirMemorias({
  entradas = [],
  exportadoPor = 'Usua des',
  exportadoEn = Date.now(),
}) {
  const entradasNormalizadas = [...entradas]
    .map((entrada) => clonarEntrada(entrada))
    .filter((entrada) => entrada.codigo && entrada.descripcionFormateada)
    .sort((a, b) => Number(b.actualizadoEn || 0) - Number(a.actualizadoEn || 0))
    .slice(0, MAXIMO_ENTRADAS_COMPARTIR)

  return {
    version: VERSION_MEMORIA,
    exportadoEn: Number(exportadoEn),
    exportadoPor: String(exportadoPor || 'Usua des').trim() || 'Usua des',
    cantidad: entradasNormalizadas.length,
    entradas: entradasNormalizadas,
  }
}

function entradaJsonEsValida(entrada = {}) {
  if (!entrada || typeof entrada !== 'object') return false
  const codigo = normalizarCodigo(entrada.codigo)
  const descripcionFormateada = String(entrada.descripcionFormateada || '')
  const actualizadoEn = Number(entrada.actualizadoEn)
  return Boolean(codigo && descripcionFormateada && Number.isFinite(actualizadoEn))
}

export function parsearJsonCompartirMemorias(textoJson = '') {
  try {
    const json = JSON.parse(String(textoJson || ''))
    const version = String(json?.version || '')
    const exportadoEn = Number(json?.exportadoEn || 0)
    const exportadoPor = String(json?.exportadoPor || '').trim() || 'usuario desconocido'
    const entradas = Array.isArray(json?.entradas) ? json.entradas : null

    if (!version || !Number.isFinite(exportadoEn) || !entradas) {
      return { exito: false, mensaje: 'El JSON no tiene la estructura esperada.' }
    }

    const entradasValidas = entradas.filter(entradaJsonEsValida).map((entrada) => clonarEntrada(entrada))
    const entradasInvalidas = entradas.length - entradasValidas.length

    if (entradasValidas.length > MAXIMO_ENTRADAS_COMPARTIR) {
      return {
        exito: false,
        mensaje: `El archivo supera el limite de ${MAXIMO_ENTRADAS_COMPARTIR} entradas validas.`,
      }
    }

    return {
      exito: true,
      payload: {
        version,
        exportadoEn,
        exportadoPor,
        cantidad: Number(json?.cantidad || entradasValidas.length),
        entradas: entradasValidas,
      },
      entradasInvalidas,
    }
  } catch {
    return { exito: false, mensaje: 'No se pudo leer el JSON de memorias.' }
  }
}

export async function fusionarMemoriasDesdeJsonPayload(payload) {
  const memoriaLocal = await leerMemoriaCompleta()
  const entradasLocales = { ...(memoriaLocal.entradas || {}) }

  let nuevas = 0
  let actualizadas = 0
  let ignoradas = 0

  for (const entradaImportada of payload.entradas || []) {
    const codigo = normalizarCodigo(entradaImportada.codigo)
    if (!codigo) {
      ignoradas += 1
      continue
    }

    const local = entradasLocales[codigo]
    if (!local) {
      entradasLocales[codigo] = clonarEntrada(entradaImportada)
      nuevas += 1
      continue
    }

    const localTs = Number(local.actualizadoEn || 0)
    const remotoTs = Number(entradaImportada.actualizadoEn || 0)
    const mismaDescripcion = String(local.descripcionFormateada || '') === String(entradaImportada.descripcionFormateada || '')

    if (remotoTs > localTs) {
      entradasLocales[codigo] = clonarEntrada(entradaImportada)
      actualizadas += 1
      continue
    }

    if (remotoTs < localTs) {
      ignoradas += 1
      continue
    }

    // empate de fecha: local prevalece; duplicado exacto se considera ignorado
    if (mismaDescripcion) {
      ignoradas += 1
      continue
    }
    ignoradas += 1
  }

  const memoriaFusionada = recortarMemoriaSiSuperaLimite({
    version: VERSION_MEMORIA,
    actualizadoEn: Date.now(),
    entradas: entradasLocales,
  })

  await persistirMemoriaCompleta(memoriaFusionada)

  return {
    exito: true,
    resumen: {
      nuevas,
      actualizadas,
      ignoradas,
      totalFinal: Object.keys(memoriaFusionada.entradas || {}).length,
    },
    memoriaFusionada,
  }
}
