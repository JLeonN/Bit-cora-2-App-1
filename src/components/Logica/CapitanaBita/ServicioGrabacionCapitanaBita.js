import { VoiceRecorder } from 'capacitor-voice-recorder'
import { ErrorCapitanaBita } from './ServicioCapitanaBita.js'

let grabacionActiva = false
let inicioGrabacion = 0

export async function comprobarGrabacionDisponible() {
  try {
    return Boolean((await VoiceRecorder.canDeviceVoiceRecord()).value)
  } catch {
    return false
  }
}

export async function solicitarPermisoGrabacion() {
  try {
    const actual = await VoiceRecorder.hasAudioRecordingPermission()
    if (actual.value) return true
    return Boolean((await VoiceRecorder.requestAudioRecordingPermission()).value)
  } catch (error) {
    throw new ErrorCapitanaBita('permiso', error)
  }
}

export async function iniciarGrabacion() {
  if (grabacionActiva) throw new Error('Ya hay una grabación activa.')
  if (!(await comprobarGrabacionDisponible()))
    throw new Error('Este dispositivo no permite grabar audio.')
  if (!(await solicitarPermisoGrabacion())) throw new ErrorCapitanaBita('permiso')
  try {
    const resultado = await VoiceRecorder.startRecording()
    if (!resultado.value) throw new Error('El complemento no pudo iniciar la grabación.')
    grabacionActiva = true
    inicioGrabacion = Date.now()
  } catch (error) {
    if (error instanceof ErrorCapitanaBita) throw error
    throw new Error('No se pudo iniciar la grabación.', { cause: error })
  }
}

export async function detenerGrabacion() {
  if (!grabacionActiva) throw new Error('No hay una grabación activa.')
  try {
    const { value } = await VoiceRecorder.stopRecording()
    const duracionSegundos = Math.max(
      0,
      Math.round((value?.msDuration || Date.now() - inicioGrabacion) / 1000),
    )
    const base64 = String(value?.recordDataBase64 || '').replace(/^data:[^;]+;base64,/, '')
    const mimeType = String(value?.mimeType || '')
    if (!base64 || !mimeType) throw new Error('La grabación quedó vacía.')
    return { base64, mimeType, duracionSegundos }
  } finally {
    grabacionActiva = false
    inicioGrabacion = 0
  }
}

export async function cancelarGrabacion() {
  if (!grabacionActiva) return false
  try {
    await VoiceRecorder.stopRecording()
  } finally {
    grabacionActiva = false
    inicioGrabacion = 0
  }
  return true
}
