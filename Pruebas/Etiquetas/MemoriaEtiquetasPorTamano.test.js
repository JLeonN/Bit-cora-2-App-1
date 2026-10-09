import test from 'node:test'
import assert from 'node:assert/strict'
import { construirJsonCompartirMemorias, parsearJsonCompartirMemorias, MAXIMO_ENTRADAS_COMPARTIR } from '../../src/components/BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js'
import { upsertMemoriaEtiqueta, obtenerMemoriaEtiquetaPorCodigo, obtenerTodasLasMemoriasPorTamano, crearRespaldoMemoriaEtiquetas, fusionarMemoriasDesdeJsonPayload } from '../../src/components/BaseDeDatos/usoAlmacenamientoMemoriaEtiquetas.js'

const entrada = (tamano) => ({ codigo: 'A', tamano, descripcionFormateada: tamano, actualizadoEn: 5 })

test('JSON v1 se interpreta como grande', () => {
  const json = { version: '1.0', exportadoEn: 1, entradas: [{ codigo: 'A', descripcionFormateada: 'Texto', actualizadoEn: 2 }] }
  const resultado = parsearJsonCompartirMemorias(JSON.stringify(json))
  assert.equal(resultado.payload.entradas[0].tamano, '10x15cm')
})

test('JSON v2 conserva dos memorias del mismo código e invalida tamaño desconocido', () => {
  const json = construirJsonCompartirMemorias({ entradas: [entrada('10x15cm'), entrada('2.5x6.7cm')] })
  assert.equal(json.cantidad, 2)
  const parseado = parsearJsonCompartirMemorias(JSON.stringify({ ...json, entradas: [...json.entradas, entrada('5x10cm')] }))
  assert.equal(parseado.payload.entradas.length, 2)
  assert.equal(parseado.entradasInvalidas, 1)
  assert.deepEqual(parseado.payload.entradas.map((item) => item.tamano), ['10x15cm', '2.5x6.7cm'])
})

test('rechaza más de 3000 entradas sin recorte silencioso', () => {
  const json = { version: '2.0', exportadoEn: 1, entradas: Array.from({ length: MAXIMO_ENTRADAS_COMPARTIR + 1 }, () => entrada('10x15cm')) }
  assert.equal(parsearJsonCompartirMemorias(JSON.stringify(json)).exito, false)
})

test('almacenamiento separado y respaldo de ambas memorias', async () => {
  const datos = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => datos.get(key) ?? null,
      setItem: (key, value) => datos.set(key, value),
      removeItem: (key) => datos.delete(key),
    },
  }
  try {
    await upsertMemoriaEtiqueta({ codigo: 'a', descripcionFormateada: 'Grande' })
    await upsertMemoriaEtiqueta({ codigo: 'a', descripcionFormateada: 'Chica', tamano: '2.5x6.7cm' })
    assert.equal((await obtenerMemoriaEtiquetaPorCodigo('A')).descripcionFormateada, 'Grande')
    assert.equal((await obtenerMemoriaEtiquetaPorCodigo('A', '2.5x6.7cm')).descripcionFormateada, 'Chica')
    assert.equal((await obtenerTodasLasMemoriasPorTamano())['2.5x6.7cm'].length, 1)
    assert.equal((await upsertMemoriaEtiqueta({ codigo: 'A', descripcionFormateada: 'X', tamano: '5x10cm' })).exito, false)
    await crearRespaldoMemoriaEtiquetas()
    assert.ok(datos.has('CapacitorStorage.respaldo_memorias_etiquetas_v2'))
    assert.ok(!datos.has('CapacitorStorage.respaldo_memoria_etiquetas_v1'))
    const resultado = await fusionarMemoriasDesdeJsonPayload({ entradas: [
      { ...entrada('2.5x6.7cm'), descripcionFormateada: 'Importada', actualizadoEn: Date.now() + 10000 },
    ] })
    assert.equal(resultado.resumen.actualizadas, 1)
    assert.equal((await obtenerMemoriaEtiquetaPorCodigo('A')).descripcionFormateada, 'Grande')
    assert.equal((await obtenerMemoriaEtiquetaPorCodigo('A', '2.5x6.7cm')).descripcionFormateada, 'Importada')
    let fallarChica = true
    globalThis.window.localStorage.setItem = (key, value) => {
      if (key.endsWith('memoria_etiquetas_2_5x6_7_v1') && fallarChica) {
        fallarChica = false
        throw new Error('Fallo simulado')
      }
      datos.set(key, value)
    }
    await assert.rejects(() => fusionarMemoriasDesdeJsonPayload({ entradas: [
      { ...entrada('10x15cm'), descripcionFormateada: 'Grande nueva', actualizadoEn: Date.now() + 20000 },
      { ...entrada('2.5x6.7cm'), descripcionFormateada: 'Chica nueva', actualizadoEn: Date.now() + 20000 },
    ] }))
    assert.equal((await obtenerMemoriaEtiquetaPorCodigo('A')).descripcionFormateada, 'Grande')
    assert.equal((await obtenerMemoriaEtiquetaPorCodigo('A', '2.5x6.7cm')).descripcionFormateada, 'Importada')
  } finally {
    delete globalThis.window
  }
})
