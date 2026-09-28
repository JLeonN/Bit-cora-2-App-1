import {
  guardarEtiquetas,
  obtenerEtiquetas,
} from '../../BaseDeDatos/usoAlmacenamientoEtiquetas.js'

function crearIdentificador(indice = 0) {
  return Date.now() + indice + Math.floor(Math.random() * 1000)
}

export function crearEtiquetaDesdeArticulo(articulo, indice = 0, cantidad = 1) {
  return {
    id: crearIdentificador(indice),
    codigo: String(articulo?.codigo || '')
      .trim()
      .toUpperCase(),
    descripcion: String(articulo?.nombre || articulo?.descripcion || '').trim(),
    ubicacion: String(articulo?.ubicacion || articulo?.ubicacionActual || '')
      .trim()
      .toUpperCase(),
    cantidad,
    tamano: '10x15cm',
  }
}

export async function agregarEtiquetasDesdeArticulos(articulos, cantidad = 1) {
  const lista = Array.isArray(articulos) ? articulos : []
  const etiquetasNuevas = lista
    .map((articulo, indice) => crearEtiquetaDesdeArticulo(articulo, indice, cantidad))
    .filter((etiqueta) => etiqueta.codigo)
  if (etiquetasNuevas.length === 0) {
    return { cantidad: 0, etiquetas: [] }
  }
  const etiquetasActuales = await obtenerEtiquetas()
  await guardarEtiquetas([...(Array.isArray(etiquetasActuales) ? etiquetasActuales : []), ...etiquetasNuevas])
  return { cantidad: etiquetasNuevas.length, etiquetas: etiquetasNuevas }
}
