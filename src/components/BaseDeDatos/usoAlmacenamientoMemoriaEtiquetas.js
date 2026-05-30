import { Preferences } from '@capacitor/preferences'

const CLAVE_MEMORIA_ETIQUETAS = 'memoria_etiquetas_v1'
const VERSION_MEMORIA = '1.0'
const MAXIMO_ENTRADAS_MEMORIA = 1500

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
