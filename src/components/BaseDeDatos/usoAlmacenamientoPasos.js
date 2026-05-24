import { Preferences } from '@capacitor/preferences'

const CLAVE_PASOS_DIARIOS = 'pasos_diarios_v1'
const CLAVE_SESIONES_PASOS = 'sesiones_pasos_v1'
const CLAVE_EVENTOS_PASOS = 'eventos_pasos_v1'
const CLAVE_ESTADO_MONITOREO = 'estado_monitoreo_pasos_v1'
const CLAVE_CHECKPOINT_PASOS = 'checkpoint_pasos_v1'
const CLAVE_PREFERENCIA_MONITOREO = 'preferencia_monitoreo_pasos_v1'

function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function generarIdSesion() {
  return `sesion_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function leerJsonDesdePreferences(clave, valorPorDefecto) {
  try {
    const { value } = await Preferences.get({ key: clave })
    return value ? JSON.parse(value) : valorPorDefecto
  } catch (error) {
    console.error(`Error al leer ${clave}:`, error)
    return valorPorDefecto
  }
}

async function guardarJsonEnPreferences(clave, valor) {
  try {
    await Preferences.set({
      key: clave,
      value: JSON.stringify(valor),
    })
    return true
  } catch (error) {
    console.error(`Error al guardar ${clave}:`, error)
    return false
  }
}

export async function obtenerPasosDiarios() {
  return leerJsonDesdePreferences(CLAVE_PASOS_DIARIOS, [])
}

export async function guardarPasosDiarios(pasosDiarios) {
  return guardarJsonEnPreferences(CLAVE_PASOS_DIARIOS, pasosDiarios)
}

export async function actualizarTotalPasosDelDia(totalPasos, fecha = obtenerFechaLocalISO()) {
  const pasosDiarios = await obtenerPasosDiarios()
  const indice = pasosDiarios.findIndex((item) => item.fecha === fecha)

  const registro = {
    fecha,
    totalPasos: Number.isFinite(totalPasos) ? Math.max(0, totalPasos) : 0,
    ultimaActualizacion: new Date().toISOString(),
  }

  if (indice >= 0) {
    pasosDiarios[indice] = { ...pasosDiarios[indice], ...registro }
  } else {
    pasosDiarios.push(registro)
  }

  return guardarPasosDiarios(pasosDiarios)
}

export async function obtenerSesionesPasos() {
  return leerJsonDesdePreferences(CLAVE_SESIONES_PASOS, [])
}

export async function guardarSesionesPasos(sesiones) {
  return guardarJsonEnPreferences(CLAVE_SESIONES_PASOS, sesiones)
}

export async function obtenerSesionActiva() {
  const sesiones = await obtenerSesionesPasos()
  return sesiones.find((sesion) => sesion.estado === 'activa') || null
}

export async function iniciarSesionPasos(inicio = new Date().toISOString()) {
  const sesiones = await obtenerSesionesPasos()
  const sesionActiva = sesiones.find((sesion) => sesion.estado === 'activa')

  if (sesionActiva) {
    return { ok: false, motivo: 'ya_existe_sesion_activa', sesion: sesionActiva }
  }

  const nuevaSesion = {
    id: generarIdSesion(),
    inicio,
    fin: null,
    pasosSesion: 0,
    estado: 'activa',
    motivoCierre: null,
  }

  sesiones.push(nuevaSesion)
  const guardadoOk = await guardarSesionesPasos(sesiones)

  return { ok: guardadoOk, sesion: guardadoOk ? nuevaSesion : null }
}

export async function actualizarPasosSesionActiva(pasosSesion) {
  const sesiones = await obtenerSesionesPasos()
  const indice = sesiones.findIndex((sesion) => sesion.estado === 'activa')

  if (indice < 0) {
    return false
  }

  sesiones[indice].pasosSesion = Number.isFinite(pasosSesion) ? Math.max(0, pasosSesion) : 0
  return guardarSesionesPasos(sesiones)
}

export async function cerrarSesionActiva(motivoCierre = 'manual', fin = new Date().toISOString()) {
  const sesiones = await obtenerSesionesPasos()
  const indice = sesiones.findIndex((sesion) => sesion.estado === 'activa')

  if (indice < 0) {
    return { ok: false, motivo: 'no_hay_sesion_activa' }
  }

  const estadoFinal = motivoCierre === 'interrumpida' ? 'interrumpida' : 'finalizada'
  sesiones[indice] = {
    ...sesiones[indice],
    fin,
    estado: estadoFinal,
    motivoCierre,
  }

  const guardadoOk = await guardarSesionesPasos(sesiones)
  return { ok: guardadoOk, sesion: guardadoOk ? sesiones[indice] : null }
}

export async function obtenerEventosPasos() {
  return leerJsonDesdePreferences(CLAVE_EVENTOS_PASOS, [])
}

export async function guardarEventosPasos(eventos) {
  return guardarJsonEnPreferences(CLAVE_EVENTOS_PASOS, eventos)
}

export async function registrarEventoPasos(tipoEvento, detalle = '') {
  const eventos = await obtenerEventosPasos()
  eventos.push({
    fechaHora: new Date().toISOString(),
    tipoEvento,
    detalle,
  })
  return guardarEventosPasos(eventos)
}

export async function obtenerEstadoMonitoreoPasos() {
  return leerJsonDesdePreferences(CLAVE_ESTADO_MONITOREO, {
    activo: false,
    ultimaActualizacion: null,
  })
}

export async function guardarEstadoMonitoreoPasos(estado) {
  const estadoNormalizado = {
    activo: Boolean(estado?.activo),
    ultimaActualizacion: new Date().toISOString(),
    origen: estado?.origen || 'desconocido',
  }
  return guardarJsonEnPreferences(CLAVE_ESTADO_MONITOREO, estadoNormalizado)
}

export async function obtenerPreferenciaMonitoreoPasos() {
  return leerJsonDesdePreferences(CLAVE_PREFERENCIA_MONITOREO, {
    habilitado: false,
    ultimaActualizacion: null,
  })
}

export async function guardarPreferenciaMonitoreoPasos(habilitado) {
  return guardarJsonEnPreferences(CLAVE_PREFERENCIA_MONITOREO, {
    habilitado: Boolean(habilitado),
    ultimaActualizacion: new Date().toISOString(),
  })
}

export async function obtenerCheckpointPasos() {
  return leerJsonDesdePreferences(CLAVE_CHECKPOINT_PASOS, null)
}

export async function guardarCheckpointPasos({
  pasosTotalesSensor = 0,
  pasosDiaActual = 0,
  fecha = obtenerFechaLocalISO(),
  fechaHora = new Date().toISOString(),
}) {
  return guardarJsonEnPreferences(CLAVE_CHECKPOINT_PASOS, {
    fecha,
    fechaHora,
    pasosTotalesSensor: Number.isFinite(pasosTotalesSensor) ? Math.max(0, pasosTotalesSensor) : 0,
    pasosDiaActual: Number.isFinite(pasosDiaActual) ? Math.max(0, pasosDiaActual) : 0,
  })
}
