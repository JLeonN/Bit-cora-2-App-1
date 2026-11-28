import test from 'node:test'
import assert from 'node:assert/strict'
import { buscarArticulosPorUbicacion, resolverUbicacionVigente } from '../../src/components/Logica/Ubicaciones/ServicioUbicacionVigente.js'

test('la base, los movimientos recientes y los datos legados mantienen su prioridad', () => {
  const articulo = { codigo: '1', ubicacionAntigua: 'A1', historialUbicaciones: ['B1'] }
  const cambios = [{ codigo: '1', ubicacion: 'C1', fechaActualizacion: 20 }]
  assert.equal(resolverUbicacionVigente({ articulo, cambios, fechaCargaExcel: 10 }).ubicacion, 'C1')
  assert.equal(resolverUbicacionVigente({ articulo, cambios, fechaCargaExcel: 30 }).ubicacion, 'B1')
  assert.equal(resolverUbicacionVigente({ articulo, ubicacionesLegadas: [{ codigo: '1', ubicacion: 'D1' }] }).ubicacion, 'D1')
})

test('la consulta es exacta, normalizada y no duplica artículos', () => {
  const articulos = [
    { codigo: '1', ubicacionAntigua: '3-B7' },
    { codigo: '1', ubicacionAntigua: '3-B7' },
    { codigo: '2', ubicacionAntigua: '3-B70' },
  ]
  const resultado = buscarArticulosPorUbicacion({ articulos, ubicacion: ' 3-b7 ' })
  assert.deepEqual(resultado.map((articulo) => articulo.codigo), ['1'])
})

test('una carga nueva invalida movimientos anteriores y conserva los posteriores', () => {
  const articulo = { codigo: '1', ubicacionAntigua: 'A1' }
  const cambios = [
    { codigo: '1', ubicacion: 'B1', fechaActualizacion: 10 },
    { codigo: '1', ubicacion: 'C1', fechaActualizacion: 30 },
    { codigo: '1', ubicacion: 'D1', fechaActualizacion: 40 },
  ]
  assert.equal(resolverUbicacionVigente({ articulo, cambios, fechaCargaExcel: 20 }).ubicacion, 'D1')
  assert.equal(resolverUbicacionVigente({ articulo, cambios, fechaCargaExcel: 50 }).ubicacion, 'A1')
  assert.equal(resolverUbicacionVigente({ articulo, cambios: cambios.slice(0, 1), fechaCargaExcel: 10 }).ubicacion, 'B1')
})

test('las ubicaciones antiguas solo prevalecen cuando la carga no tiene fecha', () => {
  const articulo = { codigo: '1', ubicacionAntigua: 'A1' }
  const ubicacionesLegadas = [{ codigo: '1', ubicacion: 'B1' }]
  assert.equal(resolverUbicacionVigente({ articulo, ubicacionesLegadas }).ubicacion, 'B1')
  assert.equal(resolverUbicacionVigente({ articulo, ubicacionesLegadas, fechaCargaExcel: 10 }).ubicacion, 'A1')
  assert.deepEqual(buscarArticulosPorUbicacion({ articulos: [articulo], ubicacionesLegadas, fechaCargaExcel: 10, ubicacion: 'B1' }), [])
})
