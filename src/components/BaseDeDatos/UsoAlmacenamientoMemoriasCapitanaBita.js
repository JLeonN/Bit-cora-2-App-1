import { Preferences } from '@capacitor/preferences'
import { normalizarTextoComparacionArticulo } from '../Logica/Compartidos/ServicioBusquedaArticulos.js'

const CLAVE_MEMORIAS_CAPITANA_BITA = 'memorias_capitana_bita'
const VERSION_MEMORIAS_CAPITANA_BITA = 1

function normalizarCampo(valor) {
  return normalizarTextoComparacionArticulo(valor)
}

function validarMemoria(memoria) {
  const contexto = normalizarCampo(memoria?.contexto)
  const expresionUsuario = normalizarCampo(memoria?.expresionUsuario)
  const busquedaConfirmada = normalizarCampo(memoria?.busquedaConfirmada)
  if (!contexto || !expresionUsuario || !busquedaConfirmada) {
    throw new Error('La memoria requiere contexto, expresión y búsqueda confirmada.')
  }
  return {
    ...memoria,
    contexto,
    expresionUsuario,
    busquedaConfirmada,
    codigoArticuloReferencia: normalizarCampo(memoria?.codigoArticuloReferencia),
    descripcionArticuloReferencia: String(memoria?.descripcionArticuloReferencia || '').trim(),
  }
}

async function leerColeccion() {
  const { value } = await Preferences.get({ key: CLAVE_MEMORIAS_CAPITANA_BITA })
  if (!value) return { version: VERSION_MEMORIAS_CAPITANA_BITA, memorias: [] }
  try {
    const coleccion = JSON.parse(value)
    if (
      coleccion?.version !== VERSION_MEMORIAS_CAPITANA_BITA ||
      !Array.isArray(coleccion.memorias)
    ) {
      return { version: VERSION_MEMORIAS_CAPITANA_BITA, memorias: [] }
    }
    return coleccion
  } catch {
    return { version: VERSION_MEMORIAS_CAPITANA_BITA, memorias: [] }
  }
}

async function guardarColeccion(memorias) {
  await Preferences.set({
    key: CLAVE_MEMORIAS_CAPITANA_BITA,
    value: JSON.stringify({ version: VERSION_MEMORIAS_CAPITANA_BITA, memorias }),
  })
}

export async function obtenerMemoriasCapitanaBita() {
  return (await leerColeccion()).memorias.map((memoria) => ({ ...memoria }))
}

export async function obtenerMemoriasParaContexto(contexto) {
  const contextoNormalizado = normalizarCampo(contexto)
  if (!contextoNormalizado) return []
  return (await obtenerMemoriasCapitanaBita()).filter(
    (memoria) => memoria.contexto === contextoNormalizado,
  )
}

export async function guardarMemoriaCapitanaBita(memoria) {
  const memoriaNormalizada = validarMemoria(memoria)
  const coleccion = await leerColeccion()
  const indiceExistente = coleccion.memorias.findIndex(
    (item) =>
      item.contexto === memoriaNormalizada.contexto &&
      item.expresionUsuario === memoriaNormalizada.expresionUsuario,
  )
  const ahora = new Date().toISOString()
  if (indiceExistente >= 0) {
    const existente = coleccion.memorias[indiceExistente]
    coleccion.memorias[indiceExistente] = {
      ...existente,
      ...memoriaNormalizada,
      id: existente.id,
      creadaEn: existente.creadaEn,
      actualizadaEn: ahora,
    }
  } else {
    coleccion.memorias.push({
      ...memoriaNormalizada,
      id: crypto.randomUUID(),
      creadaEn: ahora,
      actualizadaEn: ahora,
    })
  }
  await guardarColeccion(coleccion.memorias)
  return coleccion.memorias[indiceExistente >= 0 ? indiceExistente : coleccion.memorias.length - 1]
}

export async function actualizarMemoriaCapitanaBita(id, cambios) {
  const coleccion = await leerColeccion()
  const indice = coleccion.memorias.findIndex((memoria) => memoria.id === id)
  if (indice < 0) throw new Error('La memoria ya no existe.')
  const actualizada = validarMemoria({ ...coleccion.memorias[indice], ...cambios })
  const duplicada = coleccion.memorias.some(
    (memoria, posicion) =>
      posicion !== indice &&
      memoria.contexto === actualizada.contexto &&
      memoria.expresionUsuario === actualizada.expresionUsuario,
  )
  if (duplicada) throw new Error('Ya existe una memoria con ese contexto y expresión.')
  coleccion.memorias[indice] = {
    ...actualizada,
    id,
    creadaEn: coleccion.memorias[indice].creadaEn,
    actualizadaEn: new Date().toISOString(),
  }
  await guardarColeccion(coleccion.memorias)
  return { ...coleccion.memorias[indice] }
}

export async function eliminarMemoriaCapitanaBita(id) {
  const coleccion = await leerColeccion()
  const memorias = coleccion.memorias.filter((memoria) => memoria.id !== id)
  if (memorias.length === coleccion.memorias.length) return false
  await guardarColeccion(memorias)
  return true
}
