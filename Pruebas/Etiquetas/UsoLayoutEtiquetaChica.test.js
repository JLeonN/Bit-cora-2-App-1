import test from 'node:test'
import assert from 'node:assert/strict'
import { calcularLayoutEtiquetaChica } from '../../src/components/Logica/Etiquetas/UsoLayoutEtiquetaChica.js'
import { configuracionEtiqueta2_5x6_7 as configuracion } from '../../src/components/Logica/Etiquetas/ConfiguracionesDeEtiquetas/ConfiguracionEtiqueta2.5x6.7.js'

test('la etiqueta chica usa página 67 × 25 y barra dentro de márgenes', () => {
  const layout = calcularLayoutEtiquetaChica({ etiqueta: { codigo: 'A123', descripcion: 'Texto' }, configuracion })
  assert.deepEqual([configuracion.pagina.ancho, configuracion.pagina.alto], [67, 25])
  assert.ok(layout.codigoBarra.posicionX >= configuracion.pagina.margenes.todos)
  assert.ok(layout.codigoBarra.posicionX + layout.codigoBarra.ancho <= 67 - configuracion.pagina.margenes.todos)
})

test('muestra como máximo cuatro renglones sin alterar el texto original', () => {
  const descripcion = 'Uno  dos\n\nTres\nCuatro\nCinco\nSeis\nSiete\nOcho\nNueve'
  const layout = calcularLayoutEtiquetaChica({ etiqueta: { descripcion }, configuracion })
  assert.deepEqual(layout.descripcion.lineas.map((linea) => linea.texto), ['UNO  DOS', '', 'TRES', 'CUATRO'])
  assert.equal(descripcion, 'Uno  dos\n\nTres\nCuatro\nCinco\nSeis\nSiete\nOcho\nNueve')
})

test('reduce la letra chica hasta 4 pt ante una línea muy larga', () => {
  const layout = calcularLayoutEtiquetaChica({ etiqueta: { descripcion: 'A'.repeat(120) }, configuracion })
  assert.equal(layout.descripcion.tamanoPt, 4)
})

test('agranda automáticamente el texto corto y reajusta al agregar renglones', () => {
  const unaLinea = calcularLayoutEtiquetaChica({ etiqueta: { descripcion: 'ALARMA NEXT 450' }, configuracion })
  const dosLineas = calcularLayoutEtiquetaChica({ etiqueta: { descripcion: 'ALARMA\nNEXT 450' }, configuracion })
  assert.ok(unaLinea.descripcion.tamanoPt > 10)
  assert.ok(dosLineas.descripcion.tamanoPt < unaLinea.descripcion.tamanoPt)
  assert.ok(dosLineas.descripcion.tamanoPt > 4)
})

test('respeta el tamaño manual aunque exceda el espacio automático', () => {
  const layout = calcularLayoutEtiquetaChica({ etiqueta: { descripcion: 'ALARMA NEXT 450', tamanoDescripcionPt: 32 }, configuracion })
  assert.equal(layout.descripcion.tamanoPt, 32)
  assert.equal(layout.descripcion.lineas[0].tamanoPt, 32)
})

test('reutiliza el lienzo de medición al calcular varias etiquetas chicas', () => {
  const documentoAnterior = globalThis.document
  let lienzosCreados = 0
  globalThis.document = {
    createElement: () => {
      lienzosCreados += 1
      return { getContext: () => ({ measureText: (texto) => ({ width: texto.length * 10 }) }) }
    },
  }
  try {
    for (let indice = 0; indice < 3; indice += 1) {
      calcularLayoutEtiquetaChica({
        etiqueta: { codigo: '123456789', descripcion: 'UNA DESCRIPCIÓN LARGA PARA ETIQUETA CHICA' },
        configuracion,
      })
    }
    assert.equal(lienzosCreados, 1)
  } finally {
    globalThis.document = documentoAnterior
  }
})
