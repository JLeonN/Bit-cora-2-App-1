import { Schema } from 'firebase/ai'

export const NOMBRE_CAPITANA_BITA = 'Capitana Bita'
export const MODELO_CAPITANA_BITA = 'gemini-3.5-flash-lite'
export const MAXIMO_SOLICITUDES_CAPITANA_BITA = 60
export const MAXIMO_ALTERNATIVAS_CAPITANA_BITA = 5
export const MAXIMO_CARACTERES_TEXTO_CAPITANA_BITA = 12000
export const MAXIMO_CARACTERES_CAMPO_CAPITANA_BITA = 180
export const MAXIMO_TOKENS_SALIDA_CAPITANA_BITA = 8192
export const MAXIMO_ADVERTENCIAS_IMAGEN_CAPITANA_BITA = 10

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

const ESQUEMA_FILA_IMAGEN = Schema.object({
  properties: {
    idSolicitud: Schema.string({ description: 'Identificador único dentro de la respuesta.' }),
    textoVisible: Schema.string({ description: 'Contenido literal visible de la fila.' }),
    codigoVisible: Schema.string({ description: 'Código literal visible, o cadena vacía.' }),
    descripcionVisible: Schema.string({
      description: 'Descripción literal visible, o cadena vacía.',
    }),
    cantidad: Schema.integer({ description: 'Cantidad inequívoca; usar 1 cuando no sea visible.' }),
    lecturaClara: Schema.boolean({
      description: 'Indica únicamente si la evidencia visual es clara.',
    }),
    motivoDuda: Schema.string({ description: 'Motivo visual de duda, o cadena vacía.' }),
  },
})

export const ESQUEMA_RESPUESTA_IMAGEN_CAPITANA_BITA = Schema.object({
  properties: {
    transcripcion: Schema.string({ description: 'Transcripción literal de filas útiles.' }),
    respuesta: Schema.string({ description: 'Mensaje breve para la interfaz.' }),
    esListadoDeArticulos: Schema.boolean(),
    filas: Schema.array({
      items: ESQUEMA_FILA_IMAGEN,
    }),
    advertencias: Schema.array({
      items: Schema.string({ description: 'Problema visual breve sin inventar contenido.' }),
      maxItems: MAXIMO_ADVERTENCIAS_IMAGEN_CAPITANA_BITA,
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

export function crearInstruccionImagenCapitanaBita(nombreUsuario) {
  const nombre = obtenerNombreValido(nombreUsuario)
  const trato = nombre ? `Podés dirigirte brevemente al usuario como ${nombre}.` : ''
  return [
    'Sos Capitana Bita y transcribís listados fotografiados de repuestos de motos.',
    'La fuente puede ser papel, monitor o pantalla y puede tener perspectiva, desenfoque o columnas cortadas.',
    'Leé las filas útiles en orden visual, de arriba hacia abajo.',
    'Conservá literalmente códigos, descripciones y abreviaciones visibles.',
    'Nunca completes ni corrijas códigos, modelos, años, colores, palabras cortadas o datos borrosos.',
    'Ignorá stock, precio, ubicación, encabezados, numeración, corrector ortográfico, bordes y columnas ajenas al listado.',
    'Usá cantidad 1 salvo que una columna o marca identifique inequívocamente una cantidad entera positiva para esa fila.',
    'No interpretes años, modelos, stock, ubicación ni números cercanos como cantidades.',
    'Marcá lecturaClara false ante cortes, desenfoque, caracteres dudosos o conflicto visual y explicalo en motivoDuda.',
    'No crees filas totalmente ilegibles; resumilas en advertencias.',
    'El contexto y las equivalencias son solo ayudas de interpretación: nunca los conviertas en evidencia visible ni códigos inventados.',
    'No afirmes que un artículo existe y no resuelvas la evidencia contra ningún catálogo.',
    'Devolvé exclusivamente el JSON definido por el esquema, sin Markdown.',
    trato,
  ]
    .filter(Boolean)
    .join(' ')
}
