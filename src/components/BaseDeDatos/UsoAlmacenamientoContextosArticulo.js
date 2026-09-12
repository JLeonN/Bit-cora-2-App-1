import { Preferences } from '@capacitor/preferences'
import { normalizarEntradaBusquedaArticulo } from '../Logica/Compartidos/ServicioBusquedaArticulos.js'

export const AMBITOS_CONTEXTO_ARTICULO = Object.freeze({
  STOCK: 'stock',
  UBICACIONES: 'ubicaciones',
  CONSULTA_UBICACION: 'consultaUbicacion',
  ETIQUETAS: 'etiquetas',
})

const PREFIJO_CLAVE = 'contexto_busqueda_articulo_'

function validarAmbito(ambito) {
  if (!Object.values(AMBITOS_CONTEXTO_ARTICULO).includes(ambito)) {
    throw new Error(`Ámbito de contexto de artículo desconocido: ${ambito}`)
  }
  return `${PREFIJO_CLAVE}${ambito}`
}

export async function obtenerContextoArticulo(ambito) {
  try {
    const { value } = await Preferences.get({ key: validarAmbito(ambito) })
    return normalizarEntradaBusquedaArticulo(value)
  } catch (error) {
    console.error('[UsoAlmacenamientoContextosArticulo] Error al leer:', error)
    return ''
  }
}

export async function guardarContextoArticulo(ambito, contextoBusqueda) {
  const clave = validarAmbito(ambito)
  const contextoNormalizado = normalizarEntradaBusquedaArticulo(contextoBusqueda)
  try {
    if (contextoNormalizado) await Preferences.set({ key: clave, value: contextoNormalizado })
    else await Preferences.remove({ key: clave })
    return contextoNormalizado
  } catch (error) {
    console.error('[UsoAlmacenamientoContextosArticulo] Error al guardar:', error)
    throw error
  }
}
