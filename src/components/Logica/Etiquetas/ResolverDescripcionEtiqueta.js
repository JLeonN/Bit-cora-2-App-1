import { TAMANO_ETIQUETA_GRANDE, TAMANO_ETIQUETA_CHICA } from './ConfiguracionesDeEtiquetas/TamanosEtiqueta.js'

const tieneTexto = (valor) => typeof valor === 'string' && valor.length > 0
const tamanoDeCreacion = (etiqueta) => etiqueta?.tamano || TAMANO_ETIQUETA_GRANDE

function obtenerVariante(etiqueta, tamano) {
  const propia = etiqueta?.descripcionesPorTamano?.[tamano]
  if (tieneTexto(propia)) return propia
  return tamanoDeCreacion(etiqueta) === tamano && tieneTexto(etiqueta?.descripcion)
    ? etiqueta.descripcion
    : null
}

export function resolverDescripcionEtiqueta({ etiqueta = {}, tamano, memoriaPropia = null, memoriaAlterna = null }) {
  const alterno = tamano === TAMANO_ETIQUETA_GRANDE ? TAMANO_ETIQUETA_CHICA : TAMANO_ETIQUETA_GRANDE
  const candidatos = [
    [memoriaPropia?.descripcionFormateada, 'memoriaPropia'],
    [obtenerVariante(etiqueta, tamano), 'variantePropia'],
    [memoriaAlterna?.descripcionFormateada, 'memoriaAlterna'],
    [obtenerVariante(etiqueta, alterno), 'varianteAlterna'],
    [etiqueta.descripcion, 'origen'],
    [etiqueta.descripcionOriginal, 'origen'],
  ]
  const encontrado = candidatos.find(([descripcion]) => tieneTexto(descripcion))
  return {
    descripcion: encontrado?.[0] || '',
    origen: encontrado?.[1] || 'origen',
    memoriaActiva: encontrado?.[1] === 'memoriaPropia',
    memoriaActualizadaEn: encontrado?.[1] === 'memoriaPropia' ? memoriaPropia.actualizadoEn || null : null,
  }
}

export function guardarDescripcionDeTamano({ etiqueta, tamano, descripcion }) {
  const actualizada = {
    ...etiqueta,
    descripcionesPorTamano: {
      ...(etiqueta.descripcionesPorTamano || {}),
      [tamano]: String(descripcion ?? ''),
    },
  }
  if (tamanoDeCreacion(etiqueta) === tamano) actualizada.descripcion = String(descripcion ?? '')
  return actualizada
}
