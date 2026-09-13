import test from 'node:test'
import assert from 'node:assert/strict'
import { resolverSolicitudesImagenCapitanaBita } from '../../src/components/Logica/CapitanaBita/ResolverSolicitudesImagenCapitanaBita.js'
import { validarRespuestaImagenCapitanaBita } from '../../src/components/Logica/CapitanaBita/ServicioCapitanaBita.js'

const articulos = [
  { codigo: 'AB-100', nombre: 'BOMBA AGUA YAMAHA', ubicacionAntigua: 'A1', stock: 2 },
  { codigo: 'AB-200', nombre: 'BOMBA ACEITE YAMAHA', ubicacionAntigua: 'A2', stock: 3 },
  { codigo: 'FI-100', nombre: 'FILTRO AIRE HONDA', ubicacionAntigua: 'B1', stock: 4 },
  { codigo: 'FI-200', nombre: 'FILTRO ACEITE HONDA', ubicacionAntigua: 'B2', stock: 5 },
]

function crearFila(datos = {}) {
  return {
    idSolicitud: 'fila-1',
    textoVisible: 'fila visible',
    codigoVisible: '',
    descripcionVisible: '',
    cantidad: 1,
    lecturaClara: true,
    motivoDuda: '',
    ...datos,
  }
}

function resolver(fila, maestro = articulos, contextoBusqueda = '') {
  return resolverSolicitudesImagenCapitanaBita({
    filas: [crearFila(fila)],
    articulos: maestro,
    contextoBusqueda,
  })[0]
}

test('código completo exacto y único produce única', () => {
  assert.equal(resolver({ codigoVisible: 'ab-100' }).estado, 'unica')
})

test('descripción completa única produce única', () => {
  assert.equal(resolver({ descripcionVisible: 'FILTRO AIRE HONDA' }).estado, 'unica')
})

test('descripción parcial distintiva produce única', () => {
  assert.equal(resolver({ descripcionVisible: 'BOMB AGU' }).estado, 'unica')
})

test('lectura dudosa con un candidato produce ambigua', () => {
  const resultado = resolver({
    codigoVisible: 'AB-100',
    lecturaClara: false,
    motivoDuda: 'borroso',
  })
  assert.equal(resultado.estado, 'ambigua')
  assert.equal(resultado.candidatos.length, 1)
})

test('fragmento genérico conserva todos los candidatos compatibles', () => {
  const resultado = resolver({ descripcionVisible: 'FILTRO' })
  assert.equal(resultado.estado, 'ambigua')
  assert.deepEqual(
    resultado.candidatos.map((item) => item.codigo),
    ['FI-100', 'FI-200'],
  )
})

test('código parcial con varias coincidencias produce ambigua', () => {
  assert.equal(resolver({ codigoVisible: 'AB' }).estado, 'ambigua')
})

test('código exacto y descripción contradictoria producen inconsistente', () => {
  assert.equal(
    resolver({ codigoVisible: 'AB-100', descripcionVisible: 'FILTRO AIRE HONDA' }).estado,
    'inconsistente',
  )
})

test('código duplicado en el maestro nunca produce única', () => {
  const maestro = [...articulos, { ...articulos[0], nombre: 'BOMBA AGUA YAMAHA REPETIDA' }]
  assert.equal(resolver({ codigoVisible: 'AB-100' }, maestro).estado, 'inconsistente')
})

test('descripciones iguales con códigos diferentes producen ambigua', () => {
  const maestro = [
    { codigo: 'X-1', nombre: 'MANIJA NEGRA' },
    { codigo: 'X-2', nombre: 'MANIJA NEGRA' },
  ]
  assert.equal(resolver({ descripcionVisible: 'MANIJA NEGRA' }, maestro).estado, 'ambigua')
})

test('el validador rechaza una fila sin código ni descripción', () => {
  assert.throws(() =>
    validarRespuestaImagenCapitanaBita({
      transcripcion: '',
      respuesta: '',
      esListadoDeArticulos: true,
      filas: [crearFila()],
      advertencias: [],
    }),
  )
})

test('el validador conserva cantidad 1 y limita cantidades superiores', () => {
  const respuesta = validarRespuestaImagenCapitanaBita({
    transcripcion: 'dos filas',
    respuesta: 'ok',
    esListadoDeArticulos: true,
    filas: [crearFila({ codigoVisible: 'AB-100', cantidad: 1200 })],
    advertencias: [],
  })
  assert.equal(respuesta.filas[0].cantidad, 999)
})

test('el validador rechaza cantidades cero, negativas y decimales', () => {
  for (const cantidad of [0, -1, 1.5]) {
    assert.throws(() =>
      validarRespuestaImagenCapitanaBita({
        transcripcion: 'fila',
        respuesta: 'ok',
        esListadoDeArticulos: true,
        filas: [crearFila({ codigoVisible: 'AB-100', cantidad })],
        advertencias: [],
      }),
    )
  }
})

test('la resolución inspecciona más de 50 coincidencias', () => {
  const maestro = Array.from({ length: 70 }, (_, indice) => ({
    codigo: `COD-${indice}`,
    nombre: `TORNILLO MODELO ${indice}`,
  }))
  const resultado = resolver({ descripcionVisible: 'TORNILLO' }, maestro)
  assert.equal(resultado.candidatos.length, 70)
})

test('el contexto filtra descripciones y el código exacto lo ignora', () => {
  assert.equal(
    resolver({ descripcionVisible: 'FILTRO' }, articulos, 'YAMAHA').estado,
    'noEncontrada',
  )
  assert.equal(resolver({ codigoVisible: 'FI-100' }, articulos, 'YAMAHA').estado, 'unica')
  assert.equal(
    resolver(
      { codigoVisible: 'FI-100', descripcionVisible: 'FILTRO AIRE HONDA' },
      articulos,
      'YAMAHA',
    ).estado,
    'unica',
  )
})

test('la resolución repetida mantiene orden, estados y candidatos', () => {
  const fila = crearFila({ descripcionVisible: 'FILTRO' })
  const argumentos = { filas: [fila], articulos, contextoBusqueda: '' }
  const primera = resolverSolicitudesImagenCapitanaBita(argumentos)
  const segunda = resolverSolicitudesImagenCapitanaBita(argumentos)
  assert.deepEqual(primera, segunda)
})
