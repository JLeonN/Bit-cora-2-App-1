import test from 'node:test'
import assert from 'node:assert/strict'

const datos = new Map()
globalThis.window = { localStorage: {
  getItem: (clave) => datos.get(clave) ?? null,
  setItem: (clave, valor) => datos.set(clave, valor),
  removeItem: (clave) => datos.delete(clave),
} }
const { guardarUbicaciones, obtenerUbicaciones } = await import('../../src/components/BaseDeDatos/usoAlmacenamientoUbicaciones.js')
const { obtenerCambiosUbicacion } = await import('../../src/components/BaseDeDatos/UsoHistorialUbicaciones.js')
const { Preferences } = await import('@capacitor/preferences')

test('conserva cambios fechados al quitar filas y no registra de nuevo una lista sin cambios', async () => {
  assert.equal(await guardarUbicaciones([{ codigo: '1', ubicacion: 'A1' }]), true)
  const inicial = await obtenerCambiosUbicacion()
  assert.equal(inicial.length, 1)
  assert.equal(typeof inicial[0].fechaActualizacion, 'number')
  assert.equal(await guardarUbicaciones([{ codigo: '1', ubicacion: 'A1' }]), true)
  assert.equal((await obtenerCambiosUbicacion()).length, 1)
  assert.equal(await guardarUbicaciones([], { registrarCambios: false }), true)
  assert.deepEqual(await obtenerUbicaciones(), [])
  assert.deepEqual(await obtenerCambiosUbicacion(), inicial)
})

test('al borrar una ubicación anterior sin fecha conserva su valor sin inventar una fecha', async () => {
  await Preferences.set({ key: 'ubicaciones_trabajo', value: JSON.stringify([{ codigo: '2', ubicacion: 'B1' }]) })
  assert.equal(await guardarUbicaciones([], { registrarCambios: false }), true)
  const cambio = (await obtenerCambiosUbicacion()).find((item) => item.codigo === '2')
  assert.equal(cambio.ubicacion, 'B1')
  assert.equal(cambio.fechaActualizacion, null)
})
