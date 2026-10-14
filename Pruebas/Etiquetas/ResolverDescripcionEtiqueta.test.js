import test from 'node:test'
import assert from 'node:assert/strict'
import { resolverDescripcionEtiqueta, guardarDescripcionDeTamano } from '../../src/components/Logica/Etiquetas/ResolverDescripcionEtiqueta.js'
import { TAMANO_ETIQUETA_GRANDE as GRANDE, TAMANO_ETIQUETA_CHICA as CHICA, TAMANO_ETIQUETA_5X2P5 as NUEVA } from '../../src/components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/TamanosEtiqueta.js'

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

test('el tamaño manual chico se conserva sin afectar la etiqueta grande', () => {
  const etiqueta = guardarDescripcionDeTamano({
    etiqueta: { codigo: 'A', descripcion: 'Grande' },
    tamano: CHICA,
    descripcion: 'Chica',
    tamanoDescripcionPt: 18.5,
  })
  assert.equal(resolverDescripcionEtiqueta({ etiqueta, tamano: CHICA }).tamanoDescripcionPt, 18.5)
  assert.equal(Object.hasOwn(resolverDescripcionEtiqueta({ etiqueta, tamano: GRANDE }), 'tamanoDescripcionPt'), false)
  assert.equal(resolverDescripcionEtiqueta({ etiqueta, tamano: CHICA, memoriaPropia: { descripcionFormateada: 'Memoria', tamanoDescripcionPt: null } }).tamanoDescripcionPt, null)
  assert.equal(resolverDescripcionEtiqueta({ etiqueta, tamano: CHICA, memoriaPropia: { descripcionFormateada: 'Memoria', tamanoDescripcionPt: 22 } }).tamanoDescripcionPt, 22)
})

test('alternar tres tamaños conserva identidad, cantidad y origen sin crear memorias', () => {
  const etiqueta = { id: 7, codigo: 'A', cantidad: 3, descripcion: 'Grande', descripcionesPorTamano: { [GRANDE]: 'Grande' } }
  const original = structuredClone(etiqueta)
  for (const tamano of [GRANDE, CHICA, NUEVA, GRANDE]) {
    const visible = { ...etiqueta, ...resolverDescripcionEtiqueta({ etiqueta, tamano }) }
    assert.equal(visible.id, 7)
    assert.equal(visible.cantidad, 3)
    assert.equal(visible.memoriaActiva, false)
  }
  assert.deepEqual(etiqueta, original)
})

test('memoria nueva propia gana al texto grande y su tamaño manual queda aislado', () => {
  const etiqueta = { codigo: 'A', descripcion: 'Grande', cantidad: 2 }
  const grande = { descripcionFormateada: 'Memoria grande' }
  const prestada = resolverDescripcionEtiqueta({ etiqueta, tamano: NUEVA, memoriaAlterna: grande })
  assert.equal(prestada.descripcion, 'Memoria grande')
  assert.equal(prestada.memoriaActiva, false)
  const propia = { descripcionFormateada: 'Nueva', tamanoDescripcionPt: 19, actualizadoEn: 5 }
  const visible = resolverDescripcionEtiqueta({ etiqueta, tamano: NUEVA, memoriaPropia: propia, memoriaAlterna: grande })
  assert.equal(visible.descripcion, 'Nueva')
  assert.equal(visible.tamanoDescripcionPt, 19)
  assert.equal(visible.memoriaActiva, true)
  const editada = guardarDescripcionDeTamano({ etiqueta, tamano: NUEVA, descripcion: 'Editada', tamanoDescripcionPt: 24 })
  assert.equal(resolverDescripcionEtiqueta({ etiqueta: editada, tamano: NUEVA }).tamanoDescripcionPt, 24)
  assert.equal(resolverDescripcionEtiqueta({ etiqueta: editada, tamano: CHICA }).tamanoDescripcionPt, null)
  const auto = guardarDescripcionDeTamano({ etiqueta: editada, tamano: NUEVA, descripcion: 'Editada', tamanoDescripcionPt: null })
  assert.equal(resolverDescripcionEtiqueta({ etiqueta: auto, tamano: NUEVA }).tamanoDescripcionPt, null)
  assert.equal(resolverDescripcionEtiqueta({ etiqueta: auto, tamano: GRANDE }).descripcion, 'Grande')
})
