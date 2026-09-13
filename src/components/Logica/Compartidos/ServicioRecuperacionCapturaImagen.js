import { Preferences } from '@capacitor/preferences'

const CLAVE_CAPTURA_IMAGEN_PENDIENTE = 'captura_imagen_pendiente'
const CLAVE_RESULTADO_CAPTURA_IMAGEN_RESTAURADA = 'resultado_captura_imagen_restaurada'
const DURACION_CAPTURA_PENDIENTE_MS = 15 * 60 * 1000
const observadoresResultadosRestaurados = new Set()

function fechaValida(valor) {
  const fecha = Number(valor)
  return Number.isFinite(fecha) && fecha > 0 ? fecha : 0
}

function capturaVencida(captura, ahora = Date.now()) {
  const creadaEn = fechaValida(captura?.creadaEn)
  return !creadaEn || ahora - creadaEn > DURACION_CAPTURA_PENDIENTE_MS
}

function normalizarMetadatos(metadatos) {
  const idCaptura = String(metadatos?.idCaptura || '').trim()
  const consumidor = String(metadatos?.consumidor || '').trim()
  if (!idCaptura || !consumidor) {
    throw new TypeError('La captura pendiente requiere idCaptura y consumidor.')
  }
  return {
    idCaptura,
    consumidor,
    identificadorDestino: String(metadatos?.identificadorDestino || '').trim(),
    contextoBusqueda: String(metadatos?.contextoBusqueda || ''),
    origen: String(metadatos?.origen || '').trim(),
    creadaEn: fechaValida(metadatos?.creadaEn) || Date.now(),
  }
}

async function leerPreferenciaJson(clave) {
  const { value } = await Preferences.get({ key: clave })
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    await Preferences.remove({ key: clave })
    return null
  }
}

async function eliminarEstadoCaptura() {
  await Promise.all([
    Preferences.remove({ key: CLAVE_CAPTURA_IMAGEN_PENDIENTE }),
    Preferences.remove({ key: CLAVE_RESULTADO_CAPTURA_IMAGEN_RESTAURADA }),
  ])
}

function normalizarDatosFoto(datos) {
  if (!datos || typeof datos !== 'object') return null
  return {
    path: typeof datos.path === 'string' ? datos.path : '',
    webPath: typeof datos.webPath === 'string' ? datos.webPath : '',
    format: typeof datos.format === 'string' ? datos.format : '',
    saved: datos.saved === true,
  }
}

export async function registrarCapturaPendiente(metadatos) {
  const captura = normalizarMetadatos(metadatos)
  await Preferences.remove({ key: CLAVE_RESULTADO_CAPTURA_IMAGEN_RESTAURADA })
  await Preferences.set({
    key: CLAVE_CAPTURA_IMAGEN_PENDIENTE,
    value: JSON.stringify(captura),
  })
  return captura
}

export async function registrarResultadoCapturaRestaurada(resultado) {
  if (resultado?.pluginId !== 'Camera' || resultado?.methodName !== 'getPhoto') return false
  const captura = await leerPreferenciaJson(CLAVE_CAPTURA_IMAGEN_PENDIENTE)
  if (!captura || capturaVencida(captura)) {
    await eliminarEstadoCaptura()
    return false
  }
  const resultadoNormalizado = {
    pluginId: 'Camera',
    methodName: 'getPhoto',
    success: resultado.success === true,
    data: resultado.success === true ? normalizarDatosFoto(resultado.data) : null,
    error:
      resultado.success === true
        ? null
        : { message: String(resultado?.error?.message || 'Error desconocido de Camera.') },
  }
  await Preferences.set({
    key: CLAVE_RESULTADO_CAPTURA_IMAGEN_RESTAURADA,
    value: JSON.stringify({ metadatos: captura, resultado: resultadoNormalizado }),
  })
  observadoresResultadosRestaurados.forEach((observador) => {
    try {
      observador(captura.consumidor)
    } catch {
      // Un consumidor no debe impedir que otros reciban la captura restaurada.
    }
  })
  return true
}

export function escucharCapturasRestauradas(observador) {
  if (typeof observador !== 'function') return () => {}
  observadoresResultadosRestaurados.add(observador)
  return () => observadoresResultadosRestaurados.delete(observador)
}

export async function consumirCapturaRestaurada(consumidor) {
  const consumidorNormalizado = String(consumidor || '').trim()
  if (!consumidorNormalizado) return null
  const capturaRestaurada = await leerPreferenciaJson(CLAVE_RESULTADO_CAPTURA_IMAGEN_RESTAURADA)
  if (!capturaRestaurada) {
    const captura = await leerPreferenciaJson(CLAVE_CAPTURA_IMAGEN_PENDIENTE)
    if (captura && capturaVencida(captura)) await eliminarEstadoCaptura()
    return null
  }
  if (capturaVencida(capturaRestaurada.metadatos)) {
    await eliminarEstadoCaptura()
    return null
  }
  if (capturaRestaurada.metadatos?.consumidor !== consumidorNormalizado) return null
  await eliminarEstadoCaptura()
  return capturaRestaurada
}

export async function limpiarCapturaPendiente(idCaptura) {
  const idNormalizado = String(idCaptura || '').trim()
  if (!idNormalizado) return false
  const captura = await leerPreferenciaJson(CLAVE_CAPTURA_IMAGEN_PENDIENTE)
  if (!captura || captura.idCaptura !== idNormalizado) return false
  await eliminarEstadoCaptura()
  return true
}
