import assert from 'node:assert/strict'
import test from 'node:test'
import { construirPartesWhatsAppListado } from '../../src/components/Logica/Listados/ServicioWhatsAppListados.js'

test('comparte nombre y código, y deja una línea vacía entre artículos', () => {
  const listado = { nombrePersonalizado: '', configuracion: {} }
  const articulos = [
    { descripcion: 'MANILLAR MAX', codigo: 'C440000021' },
    { descripcion: 'CÁRTER Ñ', codigo: '101140G' },
  ]

  const partes = construirPartesWhatsAppListado(listado, articulos)

  assert.equal(partes.length, 1)
  assert.equal(
    partes[0].mensaje,
    '*Artículo:* MANILLAR MAX\n*Código:* C440000021\n\n*Artículo:* CÁRTER Ñ\n*Código:* 101140G',
  )
})

test('respeta el nombre propio, la numeración y las columnas visibles con valores vacíos', () => {
  const listado = {
    nombrePersonalizado: 'Repuestos',
    configuracion: { mostrarNumeracion: true, mostrarStock: true, mostrarUbicacion: true },
  }
  const articulos = [{ descripcion: 'MANILLAR MAX', codigo: 'C440000021', stockListado: 0 }]

  const partes = construirPartesWhatsAppListado(listado, articulos)

  assert.equal(
    partes[0].mensaje,
    '*Listado: Repuestos*\n\n*1. Artículo:* MANILLAR MAX\n*Código:* C440000021\n*Stock:* 0\n*Ubicación:* ',
  )
})

test('divide listas largas sin perder artículos ni superar el límite del enlace', () => {
  const listado = { nombrePersonalizado: 'Repuestos', configuracion: {} }
  const articulos = Array.from({ length: 40 }, (_, indice) => ({
    descripcion: `Artículo ${indice + 1} ${'largo '.repeat(12)}`,
    codigo: `COD${indice + 1}`,
  }))

  const partes = construirPartesWhatsAppListado(listado, articulos)

  assert.ok(partes.length > 1)
  assert.equal(partes[0].inicio, 1)
  assert.equal(partes.at(-1).fin, articulos.length)
  partes.forEach((parte, indice) => {
    assert.ok(`https://wa.me/?text=${encodeURIComponent(parte.mensaje)}`.length <= 1800)
    assert.equal(parte.nombreUltimo, articulos[parte.fin - 1].descripcion)
    if (indice > 0) assert.equal(parte.inicio, partes[indice - 1].fin + 1)
  })
})

test('avisa si un solo artículo supera el espacio disponible', () => {
  const listado = { nombrePersonalizado: '', configuracion: {} }
  const articulos = [{ descripcion: 'A'.repeat(2000), codigo: '1' }]

  assert.throws(() => construirPartesWhatsAppListado(listado, articulos), /artículo 1 es demasiado largo/)
})
