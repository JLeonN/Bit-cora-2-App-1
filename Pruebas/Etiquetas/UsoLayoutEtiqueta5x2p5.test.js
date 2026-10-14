import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularLayoutEtiqueta5x2p5 } from '../../src/components/Logica/Etiquetas/UsoLayoutEtiqueta5x2p5.js'
import { configuracionEtiqueta5x2p5 as configuracion } from '../../src/components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta5x2p5.js'

test('página horizontal de 50 × 25 mm con margen interior inicial de 3 mm', () => {
  const layout = calcularLayoutEtiqueta5x2p5({ etiqueta: { codigo: ' a123 ', descripcion: 'Texto' }, configuracion })
  assert.deepEqual([configuracion.pagina.ancho, configuracion.pagina.alto], [50, 25])
  assert.equal(configuracion.pagina.margenes.todos, 3)
  assert.equal(layout.codigo.texto, 'A123')
  assert.equal(layout.codigoBarra.posicionX, 6)
  assert.ok(layout.codigoBarra.posicionX >= 3)
  assert.ok(layout.codigoBarra.posicionX + layout.codigoBarra.ancho <= 47)
  assert.ok(Math.abs(layout.codigo.posicionY - layout.codigo.tamanoPt * 0.352777778 * 0.79 - 3) < 0.000001)
  assert.equal(layout.ubicacion.posicionX, 3)
  assert.equal(layout.ubicacion.posicionY, 22)
})

test('solo dibuja cuatro renglones y conserva la descripción original', () => {
  const descripcion = 'Uno  dos\n\nTres\nCuatro\nCinco'
  const etiqueta = { descripcion }
  const layout = calcularLayoutEtiqueta5x2p5({ etiqueta, configuracion })
  assert.deepEqual(layout.descripcion.lineas.map((linea) => linea.texto), ['UNO  DOS', '', 'TRES', 'CUATRO'])
  assert.equal(etiqueta.descripcion, descripcion)
})

test('ajusta letra automáticamente por ancho y cantidad de renglones', () => {
  const unaLinea = calcularLayoutEtiqueta5x2p5({ etiqueta: { descripcion: 'ALARMA' }, configuracion })
  const cuatroLineas = calcularLayoutEtiqueta5x2p5({ etiqueta: { descripcion: 'ALARMA\nALARMA\nALARMA\nALARMA' }, configuracion })
  const muyLarga = calcularLayoutEtiqueta5x2p5({ etiqueta: { codigo: 'A'.repeat(100), descripcion: 'A'.repeat(120) }, configuracion })
  assert.ok(unaLinea.descripcion.tamanoPt > cuatroLineas.descripcion.tamanoPt)
  assert.equal(muyLarga.descripcion.tamanoPt, 4)
  assert.equal(muyLarga.codigo.tamanoPt, 4)
})

test('tamaño manual y Auto quedan independientes', () => {
  const manual = calcularLayoutEtiqueta5x2p5({ etiqueta: { descripcion: 'ALARMA', tamanoDescripcionPt: 32 }, configuracion })
  const automatico = calcularLayoutEtiqueta5x2p5({ etiqueta: { descripcion: 'ALARMA', tamanoDescripcionPt: null }, configuracion })
  assert.equal(manual.descripcion.tamanoPt, 32)
  assert.ok(automatico.descripcion.tamanoPt < 32)
  assert.equal(calcularLayoutEtiqueta5x2p5({ etiqueta: { tamanoDescripcionPt: 50 }, configuracion }).descripcion.tamanoPt, 40)
  assert.equal(calcularLayoutEtiqueta5x2p5({ etiqueta: { tamanoDescripcionPt: 1 }, configuracion }).descripcion.tamanoPt, 2)
})
