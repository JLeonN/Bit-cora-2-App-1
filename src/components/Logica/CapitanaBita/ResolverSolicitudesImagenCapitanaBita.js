import { resolverCoincidenciasPorEvidencia } from '../Compartidos/ServicioCoincidenciasEvidenciaArticulo.js'

export function resolverSolicitudesImagenCapitanaBita({ filas, articulos, contextoBusqueda = '' }) {
  if (!Array.isArray(filas) || !Array.isArray(articulos)) {
    console.warn('[CapitanaBita] No se puede resolver la imagen: datos inválidos')
    return []
  }
  return filas.map((fila) => {
    const coincidencias = resolverCoincidenciasPorEvidencia({
      articulos,
      codigoVisible: fila.codigoVisible,
      descripcionVisible: fila.descripcionVisible,
      contextoBusqueda,
    })
    const inconsistente = coincidencias.codigosDuplicados.length > 0 || coincidencias.hayConflicto
    const candidatos = inconsistente ? [] : coincidencias.candidatosCompatibles
    let estado = 'noEncontrada'
    let motivoConfirmacion = ''
    if (inconsistente) {
      estado = 'inconsistente'
      motivoConfirmacion = coincidencias.codigosDuplicados.length
        ? 'El código está duplicado en el Excel maestro.'
        : 'El código y la descripción visibles identifican artículos diferentes.'
    } else if (candidatos.length > 1) {
      estado = 'ambigua'
      motivoConfirmacion = fila.motivoDuda || 'La evidencia coincide con varios artículos.'
    } else if (candidatos.length === 1 && fila.lecturaClara === true) {
      estado = 'unica'
    } else if (candidatos.length === 1) {
      estado = 'ambigua'
      motivoConfirmacion = fila.motivoDuda || 'La lectura visual no es suficientemente clara.'
    }
    return {
      idSolicitud: fila.idSolicitud,
      textoOriginal: fila.textoVisible || fila.descripcionVisible || fila.codigoVisible,
      cantidad: fila.cantidad,
      estado,
      candidatos,
      articuloUnico: estado === 'unica' ? candidatos[0] : null,
      motivoConfirmacion,
      origen: 'imagen',
    }
  })
}
