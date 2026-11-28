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

test('busca posiciones compuestas sin mezclar pisos ni coincidencias parciales', () => {
  const articulos = [
    { codigo: '1', ubicacionAntigua: '13C6/A4' },
    { codigo: '2', ubicacionAntigua: '13-C6-A4' },
    { codigo: '3', ubicacionAntigua: '13--C6' },
    { codigo: '4', ubicacionAntigua: 'P1-13C6' },
    { codigo: '5', ubicacionAntigua: 'Piso1-13C6' },
    { codigo: '6', ubicacionAntigua: '13C60' },
    { codigo: '7', ubicacionAntigua: '13-C6(Piso)' },
    { codigo: '8', ubicacionAntigua: '13C6/28-A2' },
  ]
  const buscar = (ubicacion) => buscarArticulosPorUbicacion({ articulos, ubicacion }).map((item) => item.codigo)
  assert.deepEqual(buscar('13C6'), ['1', '2', '3', '7', '8'])
  assert.deepEqual(buscar('13A4'), ['1', '2'])
  assert.deepEqual(buscar('P1-13C6'), ['4', '5'])
  assert.deepEqual(buscar('Piso1-13C6'), ['4', '5'])
  assert.deepEqual(buscar('28-A2'), ['8'])
  assert.deepEqual(buscar('13C60'), ['6'])
})

test('reconoce niveles abreviados sin inventar posiciones no indicadas', () => {
  const articulos = [{ codigo: '1', ubicacionAntigua: '25-B4/6/7' }]
  for (const ubicacion of ['25B4', '25B6', '25B7']) {
    assert.equal(buscarArticulosPorUbicacion({ articulos, ubicacion }).length, 1)
  }
  assert.equal(buscarArticulosPorUbicacion({ articulos, ubicacion: '25B5' }).length, 0)
})
