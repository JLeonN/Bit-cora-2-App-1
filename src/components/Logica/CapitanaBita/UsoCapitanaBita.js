import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'
import { obtenerMemoriasParaContexto } from '../../BaseDeDatos/UsoAlmacenamientoMemoriasCapitanaBita.js'
import { procesarAudioCapitanaBita, procesarTextoCapitanaBita } from './ServicioCapitanaBita.js'
import {
  cancelarGrabacion as cancelarGrabacionServicio,
  detenerGrabacion,
  iniciarGrabacion,
} from './ServicioGrabacionCapitanaBita.js'

let enfriamientoCompartidoHasta = 0

const MENSAJES_PROCESAMIENTO = Object.freeze([
  'Trazando la ruta del pedido…',
  'Descifrando abreviaciones del maestro…',
  'Revisando la bodega de repuestos…',
  'Afinando la búsqueda como un motor recién regulado…',
  'Buscando el repuesto a babor y estribor…',
  'Preparando los resultados para desembarcar…',
])

function elegirMensajeAleatorio(mensajes) {
  return mensajes[Math.floor(Math.random() * mensajes.length)]
}

function crearMensajesSaludo(nombreUsuario) {
  const nombre =
    String(nombreUsuario || '').trim() && nombreUsuario !== 'Usua desconocido'
      ? String(nombreUsuario).trim()
      : 'tripulante'
  const tratamiento = `amo ${nombre}`
  return [
    `Hola, ${tratamiento}. Capitana Bita lista para zarpar.`,
    `Bienvenido a bordo, ${tratamiento}. La bodega de repuestos está lista.`,
    `A la orden, ${tratamiento}. Motores encendidos y catálogo a estribor.`,
    `${tratamiento}, cubierta despejada: pongamos rumbo al repuesto correcto.`,
    `${tratamiento}, el barco está afinado como un motor recién ajustado.`,
    `Capitana Bita al timón, ${tratamiento}. Decime qué pieza buscamos.`,
  ]
}

export function usarCapitanaBita({ obtenerContextoBusqueda, obtenerIdentificadorDestino }) {
  const texto = ref('')
  const grabando = ref(false)
  const duracionGrabacion = ref(0)
  const procesando = ref(false)
  const enLinea = ref(globalThis.navigator?.onLine !== false)
  const permisoBloqueado = ref(false)
  const resultado = ref(null)
  const error = ref(null)
  const mensajeSaludo = ref('')
  const mensajeProcesamiento = ref(MENSAJES_PROCESAMIENTO[0])
  const enfriamientoHasta = ref(enfriamientoCompartidoHasta)
  let intervaloDuracion = null
  let intervaloMensajesProcesamiento = null
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

  async function prepararMensajeSaludo() {
    const nombreUsuario = await obtenerNombreUsuario()
    mensajeSaludo.value = elegirMensajeAleatorio(crearMensajesSaludo(nombreUsuario))
  }

  function detenerMensajesProcesamiento() {
    if (intervaloMensajesProcesamiento) window.clearInterval(intervaloMensajesProcesamiento)
    intervaloMensajesProcesamiento = null
  }

  function iniciarMensajesProcesamiento() {
    detenerMensajesProcesamiento()
    let indice = Math.floor(Math.random() * MENSAJES_PROCESAMIENTO.length)
    mensajeProcesamiento.value = MENSAJES_PROCESAMIENTO[indice]
    intervaloMensajesProcesamiento = window.setInterval(() => {
      indice = (indice + 1) % MENSAJES_PROCESAMIENTO.length
      mensajeProcesamiento.value = MENSAJES_PROCESAMIENTO[indice]
    }, 2200)
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
    if (!disponible.value) {
      console.warn('[CapitanaBita] Solicitud detenida: servicio no disponible', {
        motivo: motivoNoDisponible.value,
      })
      return null
    }
    const contextoBusqueda = String(obtenerContextoBusqueda?.() || '')
    const identificadorDestino = String(obtenerIdentificadorDestino?.() || '')
    console.info('[CapitanaBita] Preparando solicitud', {
      contextoBusqueda,
      identificadorDestino,
    })
    const [nombreUsuario, memorias] = await Promise.all([
      obtenerNombreUsuario(),
      obtenerMemoriasParaContexto(contextoBusqueda),
    ])
    console.info('[CapitanaBita] Datos locales preparados', {
      tieneNombreUsuario: Boolean(nombreUsuario),
      memorias: memorias.length,
    })
    return { contextoBusqueda, identificadorDestino, nombreUsuario, memorias }
  }

  async function enviarTexto() {
    const textoLimpio = String(texto.value || '').trim()
    console.info('[CapitanaBita] Envío de texto solicitado', {
      procesando: procesando.value,
      caracteres: textoLimpio.length,
    })
    if (procesando.value || !textoLimpio) return null
    const datos = await prepararSolicitud()
    if (!datos) return null
    const inicio = Date.now()
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
      console.info('[CapitanaBita] Texto procesado correctamente', {
        solicitudes: resultado.value.solicitudes.length,
        duracionMs: Date.now() - inicio,
      })
      return resultado.value
    } catch (errorRecibido) {
      console.error('[CapitanaBita] Error al procesar texto', {
        codigo: errorRecibido?.codigo || '',
        mensaje: errorRecibido?.message || '',
        duracionMs: Date.now() - inicio,
      })
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
    console.info('[CapitanaBita] Botón de micrófono pulsado', {
      grabando: grabando.value,
      procesando: procesando.value,
    })
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
        console.info('[CapitanaBita] Grabación iniciada')
      } catch (errorRecibido) {
        console.error('[CapitanaBita] No se pudo iniciar la grabación', {
          codigo: errorRecibido?.codigo || '',
          mensaje: errorRecibido?.message || '',
        })
        aplicarError(errorRecibido)
      }
      return null
    }
    const datos = datosSolicitudGrabada
    datosSolicitudGrabada = null
    grabando.value = false
    detenerContador()
    procesando.value = true
    const inicio = Date.now()
    try {
      const audio = await detenerGrabacion()
      console.info('[CapitanaBita] Audio capturado', {
        mimeType: audio.mimeType,
        caracteresBase64: audio.base64?.length || 0,
      })
      const procesado = await procesarAudioCapitanaBita({ ...audio, ...datos })
      resultado.value = {
        ...procesado,
        contextoBusquedaUsado: datos.contextoBusqueda,
        identificadorDestino: datos.identificadorDestino,
      }
      console.info('[CapitanaBita] Audio procesado correctamente', {
        solicitudes: resultado.value.solicitudes.length,
        duracionMs: Date.now() - inicio,
      })
      return resultado.value
    } catch (errorRecibido) {
      console.error('[CapitanaBita] Error al procesar audio', {
        codigo: errorRecibido?.codigo || '',
        mensaje: errorRecibido?.message || '',
        duracionMs: Date.now() - inicio,
      })
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

  watch(procesando, (estaProcesando) => {
    if (estaProcesando) iniciarMensajesProcesamiento()
    else detenerMensajesProcesamiento()
  })

  onMounted(() => {
    globalThis.addEventListener?.('online', actualizarConexion)
    globalThis.addEventListener?.('offline', actualizarConexion)
    void prepararMensajeSaludo()
  })
  onUnmounted(() => {
    globalThis.removeEventListener?.('online', actualizarConexion)
    globalThis.removeEventListener?.('offline', actualizarConexion)
    detenerContador()
    detenerMensajesProcesamiento()
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
    mensajeSaludo,
    mensajeProcesamiento,
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
