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
  const fechaActualizacion = Number(registro?.fechaActualizacion || Date.now())
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
    fechaIngreso: Number(registro?.fechaIngreso || fechaActualizacion),
    fechaActualizacion,
  }
}

function obtenerSiguienteFecha(registros, propiedad) {
  const fechaMayor = registros.reduce(
    (mayor, registro) => Math.max(mayor, Number(registro?.[propiedad] || 0)),
    0,
  )
  return Math.max(Date.now(), fechaMayor + 1)
}

export function ordenarRegistrosStock(registros) {
  return [...registros].sort((registroA, registroB) => {
    if (registroA.confirmado !== registroB.confirmado) {
      return registroA.confirmado ? -1 : 1
    }
    return registroB.fechaIngreso - registroA.fechaIngreso
  })
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
    registros: ordenarRegistrosStock(Array.from(mapaRegistros.values())),
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
  const codigo = normalizarTexto(registro?.codigo)
  if (!codigo) {
    throw new Error('El registro de Stock no tiene código')
  }
  const indice = sesion.registros.findIndex(
    (registroGuardado) => registroGuardado.codigo === codigo,
  )
  const registroExistente = indice === -1 ? null : sesion.registros[indice]
  const registroNormalizado = normalizarRegistro({
    ...registro,
    fechaIngreso:
      registroExistente?.fechaIngreso || obtenerSiguienteFecha(sesion.registros, 'fechaIngreso'),
    fechaActualizacion: obtenerSiguienteFecha(sesion.registros, 'fechaActualizacion'),
  })
  if (indice === -1) {
    sesion.registros.push(registroNormalizado)
  } else {
    sesion.registros.splice(indice, 1, registroNormalizado)
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
  const fechaInicial =
    obtenerSiguienteFecha(sesion.registros, 'fechaIngreso') + Math.max(0, registros.length - 1)
  const fechaActualizacionInicial =
    obtenerSiguienteFecha(sesion.registros, 'fechaActualizacion') +
    Math.max(0, registros.length - 1)
  registros.forEach((registro, indice) => {
    const codigo = normalizarTexto(registro?.codigo)
    const registroExistente = mapa.get(codigo)
    const normalizado = normalizarRegistro({
      ...registro,
      fechaIngreso: registroExistente?.fechaIngreso || fechaInicial - indice,
      fechaActualizacion: fechaActualizacionInicial - indice,
    })
    if (normalizado.codigo) {
      mapa.set(normalizado.codigo, normalizado)
    }
  })
  sesion.registros = ordenarRegistrosStock(Array.from(mapa.values()))
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
