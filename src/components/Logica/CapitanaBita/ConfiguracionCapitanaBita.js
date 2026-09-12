import { Schema } from 'firebase/ai'

export const NOMBRE_CAPITANA_BITA = 'Capitana Bita'
export const MODELO_CAPITANA_BITA = 'gemini-3.5-flash-lite'
export const MAXIMO_SOLICITUDES_CAPITANA_BITA = 60
export const MAXIMO_ALTERNATIVAS_CAPITANA_BITA = 5
export const MAXIMO_CARACTERES_TEXTO_CAPITANA_BITA = 12000
export const MAXIMO_CARACTERES_CAMPO_CAPITANA_BITA = 180
export const MAXIMO_TOKENS_SALIDA_CAPITANA_BITA = 8192

const ESQUEMA_SOLICITUD = Schema.object({
  properties: {
    idSolicitud: Schema.string({ description: 'Identificador único dentro de la respuesta.' }),
    textoOriginal: Schema.string({ description: 'Fragmento exacto pedido por el usuario.' }),
    busquedaPrincipal: Schema.string({ description: 'Descripción corta para búsqueda local.' }),
    alternativas: Schema.array({
      items: Schema.string({ description: 'Sinónimo de vocabulario de repuestos.' }),
      maxItems: MAXIMO_ALTERNATIVAS_CAPITANA_BITA,
    }),
    cantidad: Schema.integer({ description: 'Cantidad entera positiva solicitada.' }),
  },
})

export const ESQUEMA_RESPUESTA_CAPITANA_BITA = Schema.object({
  properties: {
    transcripcion: Schema.string({ description: 'Texto relevante recibido o transcripto.' }),
    respuesta: Schema.string({ description: 'Mensaje breve para la interfaz.' }),
    esPedidoDeRepuestos: Schema.boolean(),
    solicitudes: Schema.array({
      items: ESQUEMA_SOLICITUD,
    }),
  },
})

function obtenerNombreValido(nombreUsuario) {
  const nombre = String(nombreUsuario || '')
    .trim()
    .slice(0, 60)
  return nombre && nombre !== 'Usua desconocido' ? nombre : ''
}

export function crearInstruccionSistemaCapitanaBita(nombreUsuario) {
  const nombre = obtenerNombreValido(nombreUsuario)
  const trato = nombre ? `Podés dirigirte brevemente al usuario como ${nombre}.` : ''
  return [
    'Sos Capitana Bita, asistente de trabajo para una casa de repuestos de motos.',
    'Trabajá exclusivamente con solicitudes de repuestos, componentes y accesorios de motos.',
    'Extraé artículos aunque el usuario salude o agregue comentarios irrelevantes.',
    'No respondas preguntas generales ajenas al trabajo.',
    'No inventes códigos, stock, ubicación, color ni compatibilidad.',
    'No afirmes que un artículo existe: solamente proponé términos de búsqueda.',
    'Conservá restricciones expresas como delantero, trasero, completo, color, año o versión.',
    'Usá el contexto como marca, modelo o año, pero nunca lo transformes en un artículo.',
    'En alternativas incluí solo sinónimos útiles y nunca códigos inventados.',
    'Tené en cuenta abreviaciones habituales del maestro, como LAT para lateral, DER para derecha, IZQ para izquierda, DEL para delantero y TRAS para trasero.',
    'Devolvé exclusivamente el JSON definido por el esquema, sin Markdown.',
    trato,
  ]
    .filter(Boolean)
    .join(' ')
}
