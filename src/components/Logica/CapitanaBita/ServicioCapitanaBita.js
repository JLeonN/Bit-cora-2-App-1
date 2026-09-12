import { getAI, getGenerativeModel, GoogleAIBackend, ThinkingLevel } from 'firebase/ai'
import { normalizarTextoComparacionArticulo } from '../Compartidos/ServicioBusquedaArticulos.js'
import { obtenerAplicacionFirebaseProtegida } from '../Compartidos/ServicioFirebase.js'
import {
  crearInstruccionSistemaCapitanaBita,
  ESQUEMA_RESPUESTA_CAPITANA_BITA,
  MAXIMO_ALTERNATIVAS_CAPITANA_BITA,
  MAXIMO_CARACTERES_CAMPO_CAPITANA_BITA,
  MAXIMO_CARACTERES_TEXTO_CAPITANA_BITA,
  MAXIMO_SOLICITUDES_CAPITANA_BITA,
  MAXIMO_TOKENS_SALIDA_CAPITANA_BITA,
  MODELO_CAPITANA_BITA,
} from './ConfiguracionCapitanaBita.js'

const TIEMPO_MAXIMO_SOLICITUD_MS = 45000

const MENSAJES_ERROR = Object.freeze({
  sinConexion: 'Capitana Bita necesita conexión a internet.',
  permiso: 'Permití el acceso al micrófono para dictar.',
  appCheck: 'No se pudo verificar esta instalación de Bitácora.',
  cuota: 'Capitana Bita alcanzó un límite temporal. Probá nuevamente más tarde.',
  saturado: 'Capitana Bita alcanzó un límite temporal. Probá nuevamente más tarde.',
  tiempoAgotado: 'Capitana Bita demoró demasiado en responder. Probá nuevamente.',
  respuestaInvalida: 'No pude interpretar el pedido. Probá nuevamente.',
  desconocido: 'Capitana Bita no está disponible temporalmente. Probá nuevamente.',
})

export class ErrorCapitanaBita extends Error {
  constructor(codigo, causa = null, enfriamientoHasta = 0) {
    super(MENSAJES_ERROR[codigo] || MENSAJES_ERROR.desconocido, { cause: causa })
    this.name = 'ErrorCapitanaBita'
    this.codigo = codigo
    this.enfriamientoHasta = enfriamientoHasta
  }
}

function limitarTexto(valor, maximo = MAXIMO_CARACTERES_CAMPO_CAPITANA_BITA) {
  return String(valor || '')
    .trim()
    .slice(0, maximo)
}

function crearIdSolicitud(indice, idsUsados, idPropuesto) {
  const propuesto = limitarTexto(idPropuesto, 80)
  if (propuesto && !idsUsados.has(propuesto)) return propuesto
  let consecutivo = indice + 1
  let id = `solicitud-${consecutivo}`
  while (idsUsados.has(id)) id = `solicitud-${++consecutivo}`
  return id
}

export function validarRespuestaCapitanaBita(valor) {
  if (
    !valor ||
    typeof valor !== 'object' ||
    typeof valor.transcripcion !== 'string' ||
    typeof valor.respuesta !== 'string' ||
    typeof valor.esPedidoDeRepuestos !== 'boolean' ||
    !Array.isArray(valor.solicitudes)
  ) {
    throw new ErrorCapitanaBita('respuestaInvalida')
  }
  if (!valor.esPedidoDeRepuestos && valor.solicitudes.length !== 0) {
    throw new ErrorCapitanaBita('respuestaInvalida')
  }
  if (valor.esPedidoDeRepuestos && valor.solicitudes.length === 0) {
    throw new ErrorCapitanaBita('respuestaInvalida')
  }
  const idsUsados = new Set()
  const solicitudes = valor.solicitudes
    .slice(0, MAXIMO_SOLICITUDES_CAPITANA_BITA)
    .map((solicitud, indice) => {
      if (
        !solicitud ||
        typeof solicitud !== 'object' ||
        typeof solicitud.textoOriginal !== 'string' ||
        typeof solicitud.busquedaPrincipal !== 'string' ||
        !Array.isArray(solicitud.alternativas) ||
        !solicitud.alternativas.every((alternativa) => typeof alternativa === 'string') ||
        !Number.isInteger(solicitud.cantidad) ||
        solicitud.cantidad < 1
      ) {
        throw new ErrorCapitanaBita('respuestaInvalida')
      }
      const textoOriginal = limitarTexto(solicitud.textoOriginal)
      const busquedaPrincipal = limitarTexto(solicitud.busquedaPrincipal)
      if (!textoOriginal || !busquedaPrincipal) throw new ErrorCapitanaBita('respuestaInvalida')
      const alternativas = solicitud.alternativas
        .slice(0, MAXIMO_ALTERNATIVAS_CAPITANA_BITA)
        .map((alternativa) => limitarTexto(alternativa))
        .filter(Boolean)
      if (
        alternativas.length !==
        Math.min(solicitud.alternativas.length, MAXIMO_ALTERNATIVAS_CAPITANA_BITA)
      ) {
        throw new ErrorCapitanaBita('respuestaInvalida')
      }
      const idSolicitud = crearIdSolicitud(indice, idsUsados, solicitud.idSolicitud)
      idsUsados.add(idSolicitud)
      return {
        idSolicitud,
        textoOriginal,
        busquedaPrincipal,
        alternativas: [...new Set(alternativas)],
        cantidad: Math.min(solicitud.cantidad, 999),
      }
    })
  return {
    transcripcion: limitarTexto(valor.transcripcion, MAXIMO_CARACTERES_TEXTO_CAPITANA_BITA),
    respuesta: limitarTexto(valor.respuesta, 300),
    esPedidoDeRepuestos: valor.esPedidoDeRepuestos,
    solicitudes,
  }
}

function crearPrompt({ contextoBusqueda, memorias, tipoEntrada }) {
  const contexto = normalizarTextoComparacionArticulo(contextoBusqueda) || 'SIN CONTEXTO'
  const equivalencias = (Array.isArray(memorias) ? memorias : []).map((memoria) => ({
    expresionUsuario: limitarTexto(memoria.expresionUsuario),
    busquedaConfirmada: limitarTexto(memoria.busquedaConfirmada),
  }))
  return [
    `Tipo de entrada: ${tipoEntrada}.`,
    `Contexto de búsqueda: ${contexto}.`,
    `Equivalencias confirmadas para este contexto: ${JSON.stringify(equivalencias)}.`,
    'Separá todos los artículos solicitados y respetá sus cantidades.',
    'Si no hay un pedido de repuestos válido, marcá esPedidoDeRepuestos como false y solicitudes vacío.',
  ].join('\n')
}

async function obtenerModeloCapitanaBita(nombreUsuario) {
  console.info('[CapitanaBita] Preparando Firebase AI')
  const aplicacion = await obtenerAplicacionFirebaseProtegida()
  const ai = getAI(aplicacion, { backend: new GoogleAIBackend() })
  const modelo = getGenerativeModel(
    ai,
    {
      model: MODELO_CAPITANA_BITA,
      systemInstruction: crearInstruccionSistemaCapitanaBita(nombreUsuario),
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: MAXIMO_TOKENS_SALIDA_CAPITANA_BITA,
        responseMimeType: 'application/json',
        responseSchema: ESQUEMA_RESPUESTA_CAPITANA_BITA,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    },
    { timeout: TIEMPO_MAXIMO_SOLICITUD_MS },
  )
  console.info('[CapitanaBita] Firebase AI preparado', {
    modelo: MODELO_CAPITANA_BITA,
    tiempoMaximoMs: TIEMPO_MAXIMO_SOLICITUD_MS,
  })
  return modelo
}

function obtenerEnfriamiento(error) {
  const segundos = Number(
    error?.customData?.retryAfterSeconds ||
      error?.customData?.retryDelay ||
      error?.retryAfterSeconds ||
      60,
  )
  return Date.now() + Math.max(15, Number.isFinite(segundos) ? segundos : 60) * 1000
}

function clasificarError(error) {
  if (error instanceof ErrorCapitanaBita) return error
  if (!globalThis.navigator?.onLine) return new ErrorCapitanaBita('sinConexion', error)
  const detalle = `${error?.code || ''} ${error?.message || ''}`.toLowerCase()
  if (/app.?check|attest|recaptcha|integrity|403/.test(detalle)) {
    return new ErrorCapitanaBita('appCheck', error)
  }
  if (/429|quota|resource.exhausted|rate.limit/.test(detalle)) {
    return new ErrorCapitanaBita('cuota', error, obtenerEnfriamiento(error))
  }
  if (/503|unavailable|overloaded|saturat/.test(detalle)) {
    return new ErrorCapitanaBita('saturado', error, obtenerEnfriamiento(error))
  }
  if (/timeout|timed.out|deadline|tiempo.agotado/.test(detalle)) {
    return new ErrorCapitanaBita('tiempoAgotado', error)
  }
  return new ErrorCapitanaBita('desconocido', error)
}

async function procesarContenido({ contenido, nombreUsuario, tipoEntrada }) {
  const inicio = Date.now()
  try {
    if (!globalThis.navigator?.onLine) throw new ErrorCapitanaBita('sinConexion')
    console.info('[CapitanaBita] Enviando solicitud a Gemini', { tipoEntrada })
    const modelo = await obtenerModeloCapitanaBita(nombreUsuario)
    const resultado = await modelo.generateContent(contenido)
    console.info('[CapitanaBita] Gemini respondió', {
      tipoEntrada,
      duracionMs: Date.now() - inicio,
    })
    const textoRespuesta = resultado.response.text()
    console.info('[CapitanaBita] Respuesta recibida como texto', {
      caracteres: textoRespuesta.length,
    })
    let datos
    try {
      datos = JSON.parse(textoRespuesta)
    } catch (error) {
      throw new ErrorCapitanaBita('respuestaInvalida', error)
    }
    const respuestaValidada = validarRespuestaCapitanaBita(datos)
    console.info('[CapitanaBita] Respuesta validada', {
      esPedidoDeRepuestos: respuestaValidada.esPedidoDeRepuestos,
      solicitudes: respuestaValidada.solicitudes.length,
    })
    return respuestaValidada
  } catch (error) {
    const errorClasificado = clasificarError(error)
    console.error('[CapitanaBita] Falló la solicitud', {
      tipoEntrada,
      duracionMs: Date.now() - inicio,
      codigo: errorClasificado.codigo,
      codigoOriginal: error?.code || error?.cause?.code || '',
      mensajeOriginal: error?.message || error?.cause?.message || '',
    })
    throw errorClasificado
  }
}

export async function procesarTextoCapitanaBita({
  texto,
  contextoBusqueda,
  nombreUsuario,
  memorias,
}) {
  const solicitud = limitarTexto(texto, MAXIMO_CARACTERES_TEXTO_CAPITANA_BITA)
  if (!solicitud) throw new ErrorCapitanaBita('respuestaInvalida')
  const prompt = `${crearPrompt({ contextoBusqueda, memorias, tipoEntrada: 'texto' })}\nSolicitud: ${solicitud}`
  return procesarContenido({
    contenido: prompt,
    nombreUsuario,
    tipoEntrada: 'texto',
  })
}

export async function procesarAudioCapitanaBita({
  base64,
  mimeType,
  contextoBusqueda,
  nombreUsuario,
  memorias,
}) {
  if (!base64 || !mimeType) throw new ErrorCapitanaBita('respuestaInvalida')
  const prompt = crearPrompt({ contextoBusqueda, memorias, tipoEntrada: 'audio' })
  return procesarContenido({
    contenido: [{ text: prompt }, { inlineData: { data: base64, mimeType } }],
    nombreUsuario,
    tipoEntrada: 'audio',
  })
}
