import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

const estadoBotonAtras = {
  router: null,
  hayInteraccionGlobalAbierta: () => false,
  cerrarInteraccionGlobal: () => {},
  obtenerRutaActual: () => '/',
  obtenerManejadorPagina: () => null,
}

let listenerRegistrado = false

export function configurarEstadoBotonAtrasNativo(configuracion) {
  Object.assign(estadoBotonAtras, configuracion)
}

export function limpiarEstadoBotonAtrasNativo() {
  estadoBotonAtras.hayInteraccionGlobalAbierta = () => false
  estadoBotonAtras.cerrarInteraccionGlobal = () => {}
  estadoBotonAtras.obtenerRutaActual = () => '/'
  estadoBotonAtras.obtenerManejadorPagina = () => null
}

export async function iniciarBotonAtrasNativo(router) {
  estadoBotonAtras.router = router

  if (
    listenerRegistrado ||
    !Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() !== 'android'
  ) {
    return
  }

  await App.addListener('backButton', manejarBotonAtrasNativo)
  listenerRegistrado = true
}

async function manejarBotonAtrasNativo() {
  if (estadoBotonAtras.hayInteraccionGlobalAbierta()) {
    await estadoBotonAtras.cerrarInteraccionGlobal()
    return
  }

  const manejarAtrasPagina = estadoBotonAtras.obtenerManejadorPagina()
  if (typeof manejarAtrasPagina === 'function') {
    const eventoManejado = await manejarAtrasPagina()
    if (eventoManejado) {
      return
    }
  }

  const rutaActual =
    estadoBotonAtras.obtenerRutaActual() || estadoBotonAtras.router?.currentRoute?.value?.path || '/'

  if (rutaActual !== '/') {
    estadoBotonAtras.router?.back()
  }
}
