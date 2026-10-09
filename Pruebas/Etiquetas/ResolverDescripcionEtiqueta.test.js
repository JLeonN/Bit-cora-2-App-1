import test from 'node:test'
import assert from 'node:assert/strict'
import { resolverDescripcionEtiqueta, guardarDescripcionDeTamano } from '../../src/components/Logica/Etiquetas/ResolverDescripcionEtiqueta.js'
import { TAMANO_ETIQUETA_GRANDE as GRANDE, TAMANO_ETIQUETA_CHICA as CHICA } from '../../src/components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/TamanosEtiqueta.js'

test('una etiqueta histórica conserva su descripción grande al alternar', () => {
  const etiqueta = { id: 1, codigo: 'A', descripcion: 'Uno  dos\n\nTres' }
  const original = structuredClone(etiqueta)
  assert.equal(resolverDescripcionEtiqueta({ etiqueta, tamano: GRANDE }).descripcion, original.descripcion)
  assert.equal(resolverDescripcionEtiqueta({ etiqueta, tamano: CHICA }).descripcion, original.descripcion)
  assert.deepEqual(etiqueta, original)
})

test('la edición chica no modifica la grande, incluso con dos filas del mismo código', () => {
  const filas = [1, 2].map((id) => ({ id, codigo: 'A', descripcion: 'Grande' }))
  const editada = guardarDescripcionDeTamano({ etiqueta: filas[0], tamano: CHICA, descripcion: 'Chica\n\n  Dos' })
  assert.equal(editada.descripcion, 'Grande')
  assert.equal(resolverDescripcionEtiqueta({ etiqueta: editada, tamano: CHICA }).descripcion, 'Chica\n\n  Dos')
  assert.equal(resolverDescripcionEtiqueta({ etiqueta: filas[1], tamano: CHICA }).descripcion, 'Grande')
  const memoriaChica = { descripcionFormateada: 'Memoria chica', actualizadoEn: 123 }
  for (const fila of filas) {
    assert.equal(resolverDescripcionEtiqueta({ etiqueta: fila, tamano: CHICA, memoriaPropia: memoriaChica }).descripcion, 'Memoria chica')
  }
})

test('memoria propia gana frente a prestada y solo ella figura activa', () => {
  const etiqueta = { tamano: CHICA, descripcion: 'Nació chica' }
  const prestada = { descripcionFormateada: 'Grande', actualizadoEn: 1 }
  const propia = { descripcionFormateada: 'Chica', actualizadoEn: 2 }
  assert.deepEqual(resolverDescripcionEtiqueta({ etiqueta, tamano: GRANDE, memoriaAlterna: propia }), {
    descripcion: 'Chica',
    origen: 'memoriaAlterna',
    memoriaActiva: false,
    memoriaActualizadaEn: null,
  })
  assert.equal(resolverDescripcionEtiqueta({ etiqueta, tamano: GRANDE, memoriaPropia: prestada }).descripcion, 'Grande')
  assert.equal(resolverDescripcionEtiqueta({ etiqueta, tamano: GRANDE, memoriaPropia: prestada }).memoriaActiva, true)
})

test('35 etiquetas conservan identidad, orden y cantidad al proyectar ambos tamaños', () => {
  const lista = Array.from({ length: 35 }, (_, indice) => ({
    id: indice + 1,
    codigo: `C${indice + 1}`,
    cantidad: indice % 3 + 1,
    descripcion: `Artículo ${indice + 1}`,
  }))
  const original = structuredClone(lista)
  for (const tamano of [CHICA, GRANDE, CHICA, GRANDE]) {
    const visibles = lista.map((etiqueta) => ({
      ...etiqueta,
      ...resolverDescripcionEtiqueta({ etiqueta, tamano }),
    }))
    assert.deepEqual(visibles.map(({ id, codigo, cantidad }) => ({ id, codigo, cantidad })),
      original.map(({ id, codigo, cantidad }) => ({ id, codigo, cantidad })))
  }
  assert.deepEqual(lista, original)
})
