import { Preferences } from '@capacitor/preferences'
import { normalizarCodigoBusqueda } from '../Logica/Compartidos/CodigoEscaner.js'

export const CLAVE_LISTADOS = 'listados_trabajo'
export const CLAVE_LISTADO_ACTIVO = 'listado_activo'
export const VERSION_LISTADOS = '1.1'

const CONFIGURACION_INICIAL = Object.freeze({ mostrarStock: false, mostrarUbicacion: false })
const ORDEN_INICIAL = Object.freeze({ criterio: 'fechaIngreso', direccion: 'descendente' })

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor))
}

function normalizarTexto(valor) {
  return String(valor ?? '').trim()
}

function normalizarUbicacion(valor) {
  return normalizarTexto(valor).toUpperCase()
}

function normalizarFecha(valor, alternativa = Date.now()) {
  const fecha = Number(valor)
  return Number.isFinite(fecha) && fecha > 0 ? fecha : alternativa
}

function extraerNombrePersonalizado(listado) {
  if (Object.prototype.hasOwnProperty.call(listado || {}, 'nombrePersonalizado')) {
    return normalizarTexto(listado.nombrePersonalizado)
  }
  const nombreAnterior = normalizarTexto(listado?.nombre)
  if (!nombreAnterior || nombreAnterior === 'Listado sin nombre') return ''
  const compuesto = nombreAnterior.match(
    /^Listado _ (.+) _ \d{2}-\d{2}-\d{4} \d{2}-\d{2}$/u,
  )
  if (compuesto) return normalizarTexto(compuesto[1])
  if (/^Listado \d{2}-\d{2}-\d{4} \d{2}-\d{2}(?: \d+)?$/u.test(nombreAnterior)) return ''
  return nombreAnterior
}

function normalizarArticulo(articulo) {
  const codigo = normalizarCodigoBusqueda(articulo?.codigo)
  if (!codigo) return null
  const stockOriginal = articulo?.stockOriginal ?? ''
  const ubicacionOriginal = normalizarUbicacion(articulo?.ubicacionOriginal)
  return {
    codigo,
    descripcion: normalizarTexto(articulo?.descripcion || articulo?.nombre),
    stockOriginal,
    stockListado: articulo?.stockListado ?? stockOriginal,
    ubicacionOriginal,
    ubicacionListado: normalizarUbicacion(articulo?.ubicacionListado ?? ubicacionOriginal),
    fechaIngreso: normalizarFecha(articulo?.fechaIngreso),
    stockProcesado: articulo?.stockProcesado ?? null,
    stockProcesadoEn: articulo?.stockProcesadoEn
      ? normalizarFecha(articulo.stockProcesadoEn)
      : null,
    resultadoStock: ['enviado', 'omitidoConfirmado'].includes(articulo?.resultadoStock)
      ? articulo.resultadoStock
      : null,
    ubicacionEnviada:
      articulo?.ubicacionEnviada === null || articulo?.ubicacionEnviada === undefined
        ? null
        : normalizarUbicacion(articulo.ubicacionEnviada),
    ubicacionEnviadaEn: articulo?.ubicacionEnviadaEn
      ? normalizarFecha(articulo.ubicacionEnviadaEn)
      : null,
  }
}

function normalizarArticulos(articulos) {
  const mapa = new Map()
  const ordenados = (Array.isArray(articulos) ? articulos : [])
    .map(normalizarArticulo)
    .filter(Boolean)
    .sort((articuloA, articuloB) => articuloA.fechaIngreso - articuloB.fechaIngreso)
  ordenados.forEach((articulo) => mapa.set(articulo.codigo, articulo))
  return Array.from(mapa.values())
}

function normalizarListado(listado, { actualizar = false } = {}) {
  const ahora = Date.now()
  const creadoEn = normalizarFecha(listado?.creadoEn, ahora)
  const nombrePersonalizado = extraerNombrePersonalizado(listado)
  const criterio = listado?.orden?.criterio === 'alfabetico' ? 'alfabetico' : 'fechaIngreso'
  const direccion = listado?.orden?.direccion === 'ascendente' ? 'ascendente' : 'descendente'
  return {
    id: normalizarTexto(listado?.id) || crypto.randomUUID(),
    nombre: nombrePersonalizado || 'Listado sin nombre',
    nombrePersonalizado,
    creadoEn,
    actualizadoEn: actualizar ? ahora : normalizarFecha(listado?.actualizadoEn, ahora),
    configuracion: {
      mostrarStock: Boolean(listado?.configuracion?.mostrarStock),
      mostrarUbicacion: Boolean(listado?.configuracion?.mostrarUbicacion),
    },
    orden: { criterio, direccion },
    articulos: normalizarArticulos(listado?.articulos),
  }
}

function crearColeccionVacia() {
  return { version: VERSION_LISTADOS, listados: [] }
}

function normalizarColeccion(coleccion) {
  if (!coleccion || typeof coleccion !== 'object') return crearColeccionVacia()
  const mapa = new Map()
  ;(Array.isArray(coleccion.listados) ? coleccion.listados : []).forEach((listado) => {
    const normalizado = normalizarListado(listado)
    mapa.set(normalizado.id, normalizado)
  })
  return { version: VERSION_LISTADOS, listados: Array.from(mapa.values()) }
}

async function persistirColeccion(coleccion) {
  const normalizada = normalizarColeccion(coleccion)
  await Preferences.set({ key: CLAVE_LISTADOS, value: JSON.stringify(normalizada) })
  return normalizada
}

export async function obtenerColeccionListados() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_LISTADOS })
    return value ? clonar(normalizarColeccion(JSON.parse(value))) : crearColeccionVacia()
  } catch (error) {
    console.error('[UsoAlmacenamientoListados] Error al leer los listados:', error)
    return crearColeccionVacia()
  }
}

export async function obtenerListados() {
  const coleccion = await obtenerColeccionListados()
  return clonar(coleccion.listados.sort((a, b) => b.actualizadoEn - a.actualizadoEn))
}

export async function obtenerListado(id) {
  const listados = await obtenerListados()
  return listados.find((listado) => listado.id === id) || null
}

export async function guardarListado(listado) {
  const coleccion = await obtenerColeccionListados()
  const normalizado = normalizarListado(listado, { actualizar: true })
  const indice = coleccion.listados.findIndex((guardado) => guardado.id === normalizado.id)
  if (indice === -1) coleccion.listados.push(normalizado)
  else coleccion.listados.splice(indice, 1, normalizado)
  await persistirColeccion(coleccion)
  return clonar(normalizado)
}

export async function crearListado() {
  const coleccion = await obtenerColeccionListados()
  const ahora = Date.now()
  const listado = normalizarListado({
    id: crypto.randomUUID(),
    nombrePersonalizado: '',
    creadoEn: ahora,
    actualizadoEn: ahora,
    configuracion: CONFIGURACION_INICIAL,
    orden: ORDEN_INICIAL,
    articulos: [],
  })
  coleccion.listados.push(listado)
  await persistirColeccion(coleccion)
  await Preferences.set({ key: CLAVE_LISTADO_ACTIVO, value: listado.id })
  return clonar(listado)
}

export async function renombrarListado(id, nombrePersonalizado) {
  const nombreNormalizado = normalizarTexto(nombrePersonalizado)
  const listado = await obtenerListado(id)
  if (!listado) throw new Error('No se encontró el listado')
  return guardarListado({ ...listado, nombrePersonalizado: nombreNormalizado })
}

export async function duplicarListado(id) {
  const original = await obtenerListado(id)
  if (!original) throw new Error('No se encontró el listado para duplicar')
  const ahora = Date.now()
  const copia = {
    ...original,
    id: crypto.randomUUID(),
    nombrePersonalizado: original.nombrePersonalizado
      ? `Copia de ${original.nombrePersonalizado}`
      : 'Copia',
    creadoEn: ahora,
    actualizadoEn: ahora,
    articulos: original.articulos.map((articulo) => ({
      ...articulo,
      stockProcesado: null,
      stockProcesadoEn: null,
      resultadoStock: null,
      ubicacionEnviada: null,
      ubicacionEnviadaEn: null,
    })),
  }
  const guardada = await guardarListado(copia)
  await guardarListadoActivo(guardada.id)
  return guardada
}

export async function eliminarListado(id) {
  const coleccion = await obtenerColeccionListados()
  const cantidadAnterior = coleccion.listados.length
  coleccion.listados = coleccion.listados.filter((listado) => listado.id !== id)
  const eliminado = cantidadAnterior !== coleccion.listados.length
  await persistirColeccion(coleccion)
  let listadoActivo = coleccion.listados.sort((a, b) => b.actualizadoEn - a.actualizadoEn)[0] || null
  if (!listadoActivo) listadoActivo = await crearListado()
  else await guardarListadoActivo(listadoActivo.id)
  return { eliminado, listadoActivo: clonar(listadoActivo) }
}

export async function obtenerListadoActivo() {
  try {
    const { value } = await Preferences.get({ key: CLAVE_LISTADO_ACTIVO })
    return value ? obtenerListado(value) : null
  } catch (error) {
    console.error('[UsoAlmacenamientoListados] Error al leer el listado activo:', error)
    return null
  }
}

export async function guardarListadoActivo(id) {
  const listado = await obtenerListado(id)
  if (!listado) throw new Error('No se puede activar un listado inexistente')
  await Preferences.set({ key: CLAVE_LISTADO_ACTIVO, value: id })
}
