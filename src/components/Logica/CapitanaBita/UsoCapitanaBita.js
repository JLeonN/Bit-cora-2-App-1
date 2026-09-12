import { computed, onMounted, onUnmounted, ref } from 'vue'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import { obtenerMemoriasParaContexto } from '../../BaseDeDatos/UsoAlmacenamientoMemoriasCapitanaBita.js'
import { procesarAudioCapitanaBita, procesarTextoCapitanaBita } from './ServicioCapitanaBita.js'
import {
  cancelarGrabacion as cancelarGrabacionServicio,
  detenerGrabacion,
  iniciarGrabacion,
} from './ServicioGrabacionCapitanaBita.js'

let enfriamientoCompartidoHasta = 0

export function usarCapitanaBita({ obtenerContextoBusqueda, obtenerIdentificadorDestino }) {
  const texto = ref('')
  const grabando = ref(false)
  const duracionGrabacion = ref(0)
  const procesando = ref(false)
  const enLinea = ref(globalThis.navigator?.onLine !== false)
  const permisoBloqueado = ref(false)
  const resultado = ref(null)
  const error = ref(null)
  const enfriamientoHasta = ref(enfriamientoCompartidoHasta)
  let intervaloDuracion = null
  let temporizadorEnfriamiento = null
  let datosSolicitudGrabada = null

  const disponible = computed(
    () =>
      enLinea.value &&
      !permisoBloqueado.value &&
      !procesando.value &&
      Date.now() >= enfriamientoHasta.value,
  )
  const motivoNoDisponible = computed(() => {
    if (!enLinea.value) return 'Capitana Bita necesita conexión a internet.'
    if (permisoBloqueado.value) return 'Permití el acceso al micrófono para dictar.'
    if (procesando.value) return 'Capitana Bita está procesando el pedido…'
    if (Date.now() < enfriamientoHasta.value) {
      return `Podés reintentar desde las ${new Date(enfriamientoHasta.value).toLocaleTimeString(
        [],
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      )}.`
    }
    return ''
  })

  function comprobarDisponibilidad() {
    enLinea.value = globalThis.navigator?.onLine !== false
    if (Date.now() >= enfriamientoCompartidoHasta) enfriamientoHasta.value = 0
    return disponible.value
  }

  function actualizarConexion() {
    comprobarDisponibilidad()
  }

  function limpiarError() {
    error.value = null
  }

  function cerrarResultados() {
    resultado.value = null
  }

  function aplicarError(errorRecibido) {
    error.value = errorRecibido?.message || 'Capitana Bita no está disponible temporalmente.'
    if (errorRecibido?.codigo === 'permiso') permisoBloqueado.value = true
    if (errorRecibido?.enfriamientoHasta) {
      enfriamientoCompartidoHasta = errorRecibido.enfriamientoHasta
      enfriamientoHasta.value = enfriamientoCompartidoHasta
      if (temporizadorEnfriamiento) window.clearTimeout(temporizadorEnfriamiento)
      temporizadorEnfriamiento = window.setTimeout(() => {
        enfriamientoHasta.value = 0
        enfriamientoCompartidoHasta = 0
      }, Math.max(0, enfriamientoCompartidoHasta - Date.now()))
    }
  }

  async function prepararSolicitud() {
    comprobarDisponibilidad()
    if (!disponible.value) return null
    const contextoBusqueda = String(obtenerContextoBusqueda?.() || '')
    const identificadorDestino = String(obtenerIdentificadorDestino?.() || '')
    const [nombreUsuario, memorias] = await Promise.all([
      obtenerNombreUsuario(),
      obtenerMemoriasParaContexto(contextoBusqueda),
    ])
    return { contextoBusqueda, identificadorDestino, nombreUsuario, memorias }
  }

  async function enviarTexto() {
    if (procesando.value || !String(texto.value || '').trim()) return null
    const datos = await prepararSolicitud()
    if (!datos) return null
    procesando.value = true
    limpiarError()
    try {
      const procesado = await procesarTextoCapitanaBita({ texto: texto.value, ...datos })
      resultado.value = {
        ...procesado,
        contextoBusquedaUsado: datos.contextoBusqueda,
        identificadorDestino: datos.identificadorDestino,
      }
      texto.value = ''
      return resultado.value
    } catch (errorRecibido) {
      aplicarError(errorRecibido)
      return null
    } finally {
      procesando.value = false
    }
  }

  function iniciarContador() {
    duracionGrabacion.value = 0
    const inicio = Date.now()
    intervaloDuracion = window.setInterval(() => {
      duracionGrabacion.value = Math.floor((Date.now() - inicio) / 1000)
    }, 1000)
  }

  function detenerContador() {
    if (intervaloDuracion) window.clearInterval(intervaloDuracion)
    intervaloDuracion = null
  }

  async function alternarGrabacion() {
    if (procesando.value) return null
    limpiarError()
    if (!grabando.value) {
      const datos = await prepararSolicitud()
      if (!datos) return null
      try {
        await iniciarGrabacion()
        datosSolicitudGrabada = datos
        grabando.value = true
        iniciarContador()
      } catch (errorRecibido) {
        aplicarError(errorRecibido)
      }
      return null
    }
    const datos = datosSolicitudGrabada
    datosSolicitudGrabada = null
    grabando.value = false
    detenerContador()
    procesando.value = true
    try {
      const audio = await detenerGrabacion()
      const procesado = await procesarAudioCapitanaBita({ ...audio, ...datos })
      resultado.value = {
        ...procesado,
        contextoBusquedaUsado: datos.contextoBusqueda,
        identificadorDestino: datos.identificadorDestino,
      }
      return resultado.value
    } catch (errorRecibido) {
      aplicarError(errorRecibido)
      return null
    } finally {
      procesando.value = false
      duracionGrabacion.value = 0
    }
  }

  async function cancelarGrabacion() {
    if (!grabando.value) return false
    grabando.value = false
    detenerContador()
    duracionGrabacion.value = 0
    await cancelarGrabacionServicio()
    datosSolicitudGrabada = null
    return true
  }

  onMounted(() => {
    globalThis.addEventListener?.('online', actualizarConexion)
    globalThis.addEventListener?.('offline', actualizarConexion)
  })
  onUnmounted(() => {
    globalThis.removeEventListener?.('online', actualizarConexion)
    globalThis.removeEventListener?.('offline', actualizarConexion)
    detenerContador()
    if (temporizadorEnfriamiento) window.clearTimeout(temporizadorEnfriamiento)
    void cancelarGrabacionServicio()
  })

  return {
    texto,
    grabando,
    duracionGrabacion,
    procesando,
    disponible,
    motivoNoDisponible,
    resultado,
    error,
    enfriamientoHasta,
    enviarTexto,
    alternarGrabacion,
    cancelarGrabacion,
    cerrarResultados,
    limpiarError,
    comprobarDisponibilidad,
  }
}
