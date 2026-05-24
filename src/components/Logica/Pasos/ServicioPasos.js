import { Capacitor } from '@capacitor/core'
import { registerPlugin } from '@capacitor/core'
import {
  actualizarTotalPasosDelDia,
  guardarCheckpointPasos,
  guardarEstadoMonitoreoPasos,
  guardarPreferenciaMonitoreoPasos,
  iniciarSesionPasos,
  cerrarSesionActiva,
  actualizarPasosSesionActiva,
  registrarEventoPasos,
  obtenerSesionActiva,
  obtenerPreferenciaMonitoreoPasos,
} from 'src/components/BaseDeDatos/usoAlmacenamientoPasos.js'

const ContadorPasosNativo = registerPlugin('ContadorPasos')
const INTERVALO_RESPALDO_MS = 15000

function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

class ServicioPasos {
  constructor() {
    this.listeners = new Set()
    this.intervaloRespaldo = null
    this.desuscribirNativo = null
    this.estadoActual = {
      pasosDia: 0,
      pasosSesion: 0,
      sesionActiva: false,
      fechaDia: obtenerFechaLocalISO(),
      ultimaActualizacion: Date.now(),
    }
  }

  esAndroidNativo() {
    return Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform()
  }

  async iniciarMonitoreo() {
    if (!this.esAndroidNativo()) {
      return { ok: false, motivo: 'solo_android_nativo' }
    }

    const permisos = await ContadorPasosNativo.solicitarPermisos()
    if (!permisos?.ok) {
      await registrarEventoPasos('permiso_denegado', 'No se otorgaron permisos de actividad/notificaciones')
      return { ok: false, motivo: 'permisos_denegados' }
    }

    await ContadorPasosNativo.iniciarMonitoreoPasos()
    await guardarEstadoMonitoreoPasos({ activo: true, origen: 'servicio_nativo' })
    await registrarEventoPasos('monitoreo_iniciado', 'Se inició el servicio nativo de pasos')

    if (!this.desuscribirNativo) {
      this.desuscribirNativo = await ContadorPasosNativo.addListener(
        'actualizacionPasos',
        async (payload) => {
          await this.procesarEstadoNativo(payload)
        },
      )
    }

    this.iniciarRespaldoTemporal()
    await this.refrescarEstadoDesdeNativo()
    return { ok: true }
  }

  async detenerMonitoreo() {
    if (!this.esAndroidNativo()) {
      return { ok: false, motivo: 'solo_android_nativo' }
    }
    await ContadorPasosNativo.detenerMonitoreoPasos()
    await guardarEstadoMonitoreoPasos({ activo: false, origen: 'servicio_nativo' })
    await registrarEventoPasos('monitoreo_detenido', 'Se detuvo el servicio nativo de pasos')
    this.detenerRespaldoTemporal()
    return { ok: true }
  }

  async iniciarSesionManual() {
    const existente = await obtenerSesionActiva()
    if (existente) {
      if (!this.estadoActual.sesionActiva) {
        await cerrarSesionActiva('interrumpida')
      } else {
        return { ok: false, motivo: 'ya_existe_sesion_activa' }
      }
    }

    await iniciarSesionPasos()
    if (this.esAndroidNativo()) {
      await ContadorPasosNativo.iniciarSesion()
      await this.refrescarEstadoDesdeNativo()
    } else {
      this.estadoActual.sesionActiva = true
      this.estadoActual.pasosSesion = 0
      this.notificarCambio()
    }
    await registrarEventoPasos('sesion_iniciada', 'El usuario inició una sesión manual de pasos')
    return { ok: true }
  }

  async detenerSesionManual() {
    if (this.esAndroidNativo()) {
      await ContadorPasosNativo.detenerSesion()
      await this.refrescarEstadoDesdeNativo()
    }
    await cerrarSesionActiva('manual')
    this.estadoActual.sesionActiva = false
    this.estadoActual.pasosSesion = 0
    this.notificarCambio()
    await registrarEventoPasos('sesion_finalizada', 'El usuario finalizó una sesión manual de pasos')
    return { ok: true }
  }

  async refrescarEstadoDesdeNativo() {
    if (!this.esAndroidNativo()) {
      await actualizarTotalPasosDelDia(this.estadoActual.pasosDia, this.estadoActual.fechaDia)
      this.notificarCambio()
      return this.estadoActual
    }
    const estado = await ContadorPasosNativo.obtenerEstadoMonitoreo()
    await this.procesarEstadoNativo(estado)
    return this.estadoActual
  }

  async procesarEstadoNativo(estadoNativo) {
    const fechaDia = estadoNativo?.fechaDia || obtenerFechaLocalISO()
    const pasosDia = Number(estadoNativo?.pasosDia || 0)
    const pasosSesion = Number(estadoNativo?.pasosSesion || 0)
    const sesionActiva = Boolean(estadoNativo?.sesionActiva)
    const ultimoMotivoSesion = estadoNativo?.ultimoMotivoSesion || ''

    this.estadoActual = {
      pasosDia,
      pasosSesion,
      sesionActiva,
      fechaDia,
      ultimaActualizacion: Date.now(),
    }

    await actualizarTotalPasosDelDia(pasosDia, fechaDia)
    await guardarCheckpointPasos({
      pasosTotalesSensor: pasosDia,
      pasosDiaActual: pasosDia,
      fecha: fechaDia,
      fechaHora: new Date().toISOString(),
    })

    if (sesionActiva) {
      await actualizarPasosSesionActiva(pasosSesion)
    }

    if (ultimoMotivoSesion === 'finalizadaPorReinicioDiario') {
      await cerrarSesionActiva('finalizadaPorReinicioDiario')
    }

    if (ultimoMotivoSesion === 'interrumpida') {
      await cerrarSesionActiva('interrumpida')
      await registrarEventoPasos('sesion_interrumpida', 'La sesión se cerró por interrupción del sistema')
    }

    this.notificarCambio()
  }

  iniciarRespaldoTemporal() {
    if (this.intervaloRespaldo) {
      return
    }
    this.intervaloRespaldo = setInterval(async () => {
      await guardarCheckpointPasos({
        pasosTotalesSensor: this.estadoActual.pasosDia,
        pasosDiaActual: this.estadoActual.pasosDia,
        fecha: this.estadoActual.fechaDia,
        fechaHora: new Date().toISOString(),
      })
    }, INTERVALO_RESPALDO_MS)
  }

  detenerRespaldoTemporal() {
    if (this.intervaloRespaldo) {
      clearInterval(this.intervaloRespaldo)
      this.intervaloRespaldo = null
    }
  }

  suscribir(listener) {
    this.listeners.add(listener)
    listener(this.estadoActual)
    return () => this.listeners.delete(listener)
  }

  notificarCambio() {
    this.listeners.forEach((listener) => listener(this.estadoActual))
  }

  async obtenerPreferenciaMonitoreo() {
    const preferencia = await obtenerPreferenciaMonitoreoPasos()
    return Boolean(preferencia?.habilitado)
  }

  async guardarPreferenciaMonitoreo(habilitado) {
    await guardarPreferenciaMonitoreoPasos(Boolean(habilitado))
  }
}

export const servicioPasos = new ServicioPasos()

