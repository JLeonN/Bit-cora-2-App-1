import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buscarArticulos,
  obtenerArticuloExacto,
} from '../../src/components/Logica/Compartidos/ServicioBusquedaArticulos.js'

const articulos = [
  { codigo: 'MAX-100', nombre: 'TABLERO MAX DELANTERO' },
  { codigo: 'MAX-200', nombre: 'TABLERO MAX TRASERO' },
  { codigo: 'MAR-100', nombre: 'TABLERO MARCH DELANTERO' },
  { codigo: 'FAR-100', nombre: 'FARO DELANTERO DERECHO MAX' },
  { codigo: 'FAR-200', nombre: 'FARO TRASERO IZQUIERDO MAX' },
]

function obtenerCodigos(busqueda, contextoBusqueda = '') {
  return buscarArticulos({ articulos, busqueda, contextoBusqueda }).map(
    ({ articulo }) => articulo.codigo,
  )
}

test('busca fragmentos cortos después de tres caracteres totales', () => {
  assert.deepEqual(obtenerCodigos('MAX TA').sort(), ['MAX-100', 'MAX-200'])
})

test('busca las palabras en cualquier orden', () => {
  assert.deepEqual(obtenerCodigos('TA MAX').sort(), ['MAX-100', 'MAX-200'])
})

test('acepta un fragmento de una letra si la búsqueda completa ya es válida', () => {
  assert.deepEqual(obtenerCodigos('MAX T').sort(), ['FAR-200', 'MAX-100', 'MAX-200'])
})

test('conserva abreviaciones y fragmentos combinados', () => {
  assert.deepEqual(obtenerCodigos('FAR DER'), ['FAR-100'])
})

test('mantiene el filtro por contexto', () => {
  assert.deepEqual(obtenerCodigos('TAB', 'TRAS'), ['MAX-200'])
})

test('mantiene prioridad y reconocimiento de código exacto', () => {
  const resultados = buscarArticulos({ articulos, busqueda: 'MAX-100' })
  assert.equal(resultados.length, 1)
  assert.equal(resultados[0].articulo.codigo, 'MAX-100')
  assert.equal(resultados[0].tipoCoincidencia, 'codigo-escaneado')
})

test('mantiene la resolución exacta utilizada al presionar Enter', () => {
  assert.equal(
    obtenerArticuloExacto({ articulos, busqueda: 'TABLERO MAX DELANTERO' })?.codigo,
    'MAX-100',
  )
})

test('actualiza los datos preparados si cambia un artículo', () => {
  const articulo = { codigo: 'CAM-1', nombre: 'PARAGOLPE HONDA' }
  assert.equal(buscarArticulos({ articulos: [articulo], busqueda: 'HON' }).length, 1)
  articulo.nombre = 'PARAGOLPE YAMAHA'
  assert.equal(buscarArticulos({ articulos: [articulo], busqueda: 'HON' }).length, 0)
  assert.equal(buscarArticulos({ articulos: [articulo], busqueda: 'YAM' }).length, 1)
})
