const MAXIMO_CARACTERES_ENLACE = 1800
const RESERVA_ENCABEZADO_PARTE = 100
const PREFIJO_ENLACE = 'https://wa.me/?text='

function construirBloqueArticulo(articulo, indice, configuracion) {
  const etiquetaNombre = configuracion?.mostrarNumeracion
    ? `*${indice + 1}. Artículo:*`
    : '*Artículo:*'
  const lineas = [
    `${etiquetaNombre} ${articulo.descripcion}`,
    `*Código:* ${articulo.codigo}`,
  ]
  if (configuracion?.mostrarStock) lineas.push(`*Stock:* ${articulo.stockListado ?? ''}`)
  if (configuracion?.mostrarUbicacion) {
    lineas.push(`*Ubicación:* ${articulo.ubicacionListado ?? ''}`)
  }
  return lineas.join('\n')
}

function construirEncabezado(listado, numeroParte, totalPartes) {
  const nombre = String(listado?.nombrePersonalizado || '').trim()
  const lineas = []
  if (nombre && nombre !== 'Listado sin nombre') lineas.push(`*Listado: ${nombre}*`)
  if (totalPartes > 1) lineas.push(`*Parte ${numeroParte} de ${totalPartes}*`)
  return lineas.join('\n')
}

function construirMensaje(encabezado, bloques) {
  return [encabezado, bloques.join('\n\n')].filter(Boolean).join('\n\n')
}

function largoEnlace(mensaje) {
  return PREFIJO_ENLACE.length + encodeURIComponent(mensaje).length
}

export function construirPartesWhatsAppListado(listado, articulosOrdenados) {
  if (!Array.isArray(articulosOrdenados) || articulosOrdenados.length === 0) return []

  const encabezadoBase = construirEncabezado(listado, 1, 1)
  const grupos = []
  let grupoActual = []
  let indiceInicial = 0

  articulosOrdenados.forEach((articulo, indice) => {
    const bloque = construirBloqueArticulo(articulo, indice, listado?.configuracion)
    const candidato = [...grupoActual, bloque]
    const mensaje = construirMensaje(encabezadoBase, candidato)
    if (largoEnlace(mensaje) + RESERVA_ENCABEZADO_PARTE > MAXIMO_CARACTERES_ENLACE) {
      if (grupoActual.length === 0) {
        throw new Error(`El artículo ${indice + 1} es demasiado largo para compartir por WhatsApp. Usá Excel o PDF.`)
      }
      grupos.push({ bloques: grupoActual, inicio: indiceInicial, fin: indice - 1 })
      grupoActual = [bloque]
      indiceInicial = indice
      if (
        largoEnlace(construirMensaje(encabezadoBase, grupoActual)) +
          RESERVA_ENCABEZADO_PARTE >
        MAXIMO_CARACTERES_ENLACE
      ) {
        throw new Error(`El artículo ${indice + 1} es demasiado largo para compartir por WhatsApp. Usá Excel o PDF.`)
      }
    } else {
      grupoActual = candidato
    }
  })
  grupos.push({ bloques: grupoActual, inicio: indiceInicial, fin: articulosOrdenados.length - 1 })

  return grupos.map((grupo, indice) => {
    const mensaje = construirMensaje(
      construirEncabezado(listado, indice + 1, grupos.length),
      grupo.bloques,
    )
    if (largoEnlace(mensaje) > MAXIMO_CARACTERES_ENLACE) {
      throw new Error('Una parte del listado supera el límite de WhatsApp. Usá Excel o PDF.')
    }
    return {
      mensaje,
      inicio: grupo.inicio + 1,
      fin: grupo.fin + 1,
      nombreUltimo: articulosOrdenados[grupo.fin].descripcion,
    }
  })
}
