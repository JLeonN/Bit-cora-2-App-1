import { Preferences } from '@capacitor/preferences'

const CLAVE_STOCK = 'sesion_stock'
const VERSION_STOCK = '1.0'

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toUpperCase()
}

export function normalizarCantidadStock(valor, { permitirDecimal = false } = {}) {
  if (valor === '' || valor === null || valor === undefined) {
    return { valor: 0, ajustado: true, motivo: 'vacío' }
  }
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero < 0) {
    return { valor: 0, ajustado: true, motivo: 'inválido' }
  }
  if (!Number.isInteger(numero)) {
    if (!permitirDecimal) {
      return { valor: null, ajustado: false, motivo: 'decimal' }
    }
    return { valor: Math.trunc(numero), ajustado: true, motivo: 'decimal' }
  }
  return { valor: numero, ajustado: false, motivo: '' }
}

export function crearIdentidadExcel(informacionArchivo) {
  if (!informacionArchivo) return null
  return {
    nombre: String(informacionArchivo.nombre || ''),
    tamano: Number(informacionArchivo.tamano || 0),
    fechaModificacion: Number(informacionArchivo.fechaModificacion || 0),
  }
}

export function coincidenFuentesExcel(fuenteA, fuenteB) {
  if (!fuenteA || !fuenteB) return false
  return (
    String(fuenteA.nombre || '') === String(fuenteB.nombre || '') &&
    Number(fuenteA.tamano || 0) === Number(fuenteB.tamano || 0) &&
    Number(fuenteA.fechaModificacion || 0) === Number(fuenteB.fechaModificacion || 0)
  )
}

function normalizarRegistro(registro) {
  const cantidadExcel = normalizarCantidadStock(registro?.stockExcel, { permitirDecimal: true })
  const cantidadContada = normalizarCantidadStock(registro?.stockContado)
  return {
    codigo: normalizarTexto(registro?.codigo),
    nombre: normalizarTexto(registro?.nombre) || 'ARTÍCULO INEXISTENTE',
    stockExcel: cantidadExcel.valor ?? 0,
    stockContado: cantidadContada.valor ?? 0,
    stockExcelAjustado: Boolean(registro?.stockExcelAjustado || cantidadExcel.ajustado),
    ubicacionActual: normalizarTexto(registro?.ubicacionActual),
    ubicacionOriginalExcel: normalizarTexto(registro?.ubicacionOriginalExcel),
    ubicacionOrigen:
      registro?.ubicacionOrigen === 'excel' ||
      (!registro?.ubicacionOrigen &&
        normalizarTexto(registro?.ubicacionActual) ===
          normalizarTexto(registro?.ubicacionOriginalExcel))
        ? 'excel'
        : 'usuario',
    confirmado: Boolean(registro?.confirmado),
    fechaActualizacion: Number(registro?.fechaActualizacion || Date.now()),
  }
}

function crearSesionVacia(fuenteExcel = null) {
  return {
    version: VERSION_STOCK,
    fuenteExcel: crearIdentidadExcel(fuenteExcel),
    fechaInicio: Date.now(),
    registros: [],
  }
}

function normalizarSesion(sesion) {
  if (!sesion || typeof sesion !== 'object') return crearSesionVacia()
  const registros = Array.isArray(sesion.registros) ? sesion.registros : []
  const mapaRegistros = new Map()
  registros.forEach((registro) => {
    const normalizado = normalizarRegistro(registro)
    if (normalizado.codigo) {
      mapaRegistros.set(normalizado.codigo, normalizado)
    }
  })
  return {
    version: VERSION_STOCK,
    fuenteExcel: crearIdentidadExcel(sesion.fuenteExcel),
    fechaInicio: Number(sesion.fechaInicio || Date.now()),
    registros: Array.from(mapaRegistros.values()).sort(
      (registroA, registroB) => registroB.fechaActualizacion - registroA.fechaActualizacion,
    ),
  }
}

async function guardarSesion(sesion) {
  const sesionNormalizada = normalizarSesion(sesion)
  await Preferences.set({
    key: CLAVE_STOCK,
    value: JSON.stringify(sesionNormalizada),
  })
  return sesionNormalizada
}

export async function obtenerSesionStock() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_STOCK })
    return value ? normalizarSesion(JSON.parse(value)) : crearSesionVacia()
  } catch (error) {
    console.error('[UsoAlmacenamientoStock] Error al leer la sesión:', error)
    return crearSesionVacia()
  }
}

export async function iniciarSesionStock(fuenteExcel) {
  return guardarSesion(crearSesionVacia(fuenteExcel))
}

export async function guardarRegistroStock(registro, fuenteExcel) {
  const sesion = await obtenerSesionStock()
  if (!sesion.fuenteExcel || sesion.registros.length === 0) {
    sesion.fuenteExcel = crearIdentidadExcel(fuenteExcel)
  }
  if (!coincidenFuentesExcel(sesion.fuenteExcel, crearIdentidadExcel(fuenteExcel))) {
    throw new Error('La sesión de Stock pertenece a otro archivo Excel')
  }
  const registroNormalizado = normalizarRegistro({
    ...registro,
    fechaActualizacion: Date.now(),
  })
  if (!registroNormalizado.codigo) {
    throw new Error('El registro de Stock no tiene código')
  }
  const indice = sesion.registros.findIndex(
    (registroGuardado) => registroGuardado.codigo === registroNormalizado.codigo,
  )
  if (indice === -1) {
    sesion.registros.unshift(registroNormalizado)
  } else {
    sesion.registros.splice(indice, 1)
    sesion.registros.unshift(registroNormalizado)
  }
  return guardarSesion(sesion)
}

export async function guardarRegistrosStock(registros, fuenteExcel) {
  const sesion = await obtenerSesionStock()
  if (!sesion.fuenteExcel || sesion.registros.length === 0) {
    sesion.fuenteExcel = crearIdentidadExcel(fuenteExcel)
  }
  if (!coincidenFuentesExcel(sesion.fuenteExcel, crearIdentidadExcel(fuenteExcel))) {
    throw new Error('La sesión de Stock pertenece a otro archivo Excel')
  }
  const mapa = new Map(sesion.registros.map((registro) => [registro.codigo, registro]))
  registros.forEach((registro) => {
    const normalizado = normalizarRegistro(registro)
    if (normalizado.codigo) {
      mapa.set(normalizado.codigo, normalizado)
    }
  })
  sesion.registros = Array.from(mapa.values()).sort(
    (registroA, registroB) => registroB.fechaActualizacion - registroA.fechaActualizacion,
  )
  return guardarSesion(sesion)
}

export async function eliminarRegistroStock(codigo) {
  const sesion = await obtenerSesionStock()
  const codigoNormalizado = normalizarTexto(codigo)
  sesion.registros = sesion.registros.filter((registro) => registro.codigo !== codigoNormalizado)
  return guardarSesion(sesion)
}

export async function eliminarSesionStock() {
  await Preferences.remove({ key: CLAVE_STOCK })
  return crearSesionVacia()
}
