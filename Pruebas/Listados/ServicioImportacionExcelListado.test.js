import test from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'
import {
  analizarLibroExcelListado,
  procesarArchivoExcelListado,
  procesarExcelCompartidoListado,
} from '../../src/components/Logica/Listados/ServicioImportacionExcelListado.js'

const articulos = [
  { codigo: 'AB-100', nombre: 'BOMBA AGUA YAMAHA', stock: 3, ubicacionAntigua: 'A1' },
  { codigo: 'AB-200', nombre: 'BOMBA ACEITE YAMAHA', stock: 5, ubicacionAntigua: 'A2' },
  { codigo: 'FI-100', nombre: 'FILTRO AIRE HONDA', stock: 7, ubicacionAntigua: 'B1' },
  { codigo: '00123', nombre: 'RETÉN RUEDA DELANTERA', stock: 2, ubicacionAntigua: 'C1' },
]

function crearLibro(hojas) {
  const libro = XLSX.utils.book_new()
  Object.entries(hojas).forEach(([nombre, filas]) => {
    XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(filas), nombre)
  })
  return XLSX.write(libro, { type: 'array', bookType: 'xlsx' })
}

function analizar(hojas, maestro = articulos) {
  return analizarLibroExcelListado({
    buffer: crearLibro(hojas),
    nombreArchivo: 'Importación.xlsx',
    articulos: maestro,
    contextoBusqueda: '',
  })
}

test('recorre varias hojas y conserva el orden de las filas', () => {
  const resultado = analizar({
    Primera: [
      ['Código', 'Descripción'],
      ['AB-100', 'texto contradictorio que debe ignorarse'],
    ],
    Segunda: [
      ['Producto'],
      ['FILTRO AIRE HONDA'],
    ],
  })
  assert.equal(resultado.totalHojas, 2)
  assert.equal(resultado.totalFilasUtiles, 2)
  assert.deepEqual(
    resultado.resoluciones.map((fila) => [fila.hoja, fila.articuloUnico?.codigo]),
    [
      ['Primera', 'AB-100'],
      ['Segunda', 'FI-100'],
    ],
  )
})

test('encuentra un código exacto en cualquier columna y le da prioridad absoluta', () => {
  const resultado = analizar({
    Datos: [
      ['Descripción', 'Precio', 'Otra columna'],
      ['FILTRO AIRE HONDA', '999', 'AB-200'],
    ],
  })
  assert.equal(resultado.resoluciones[0].estado, 'unica')
  assert.equal(resultado.resoluciones[0].articuloUnico.codigo, 'AB-200')
})

test('funciona sin encabezados y resuelve una descripción única', () => {
  const resultado = analizar({ Datos: [['BOMBA AGUA YAMAHA']] })
  assert.equal(resultado.resoluciones[0].estado, 'unica')
  assert.equal(resultado.resoluciones[0].articuloUnico.codigo, 'AB-100')
})

test('normaliza mayúsculas, minúsculas y acentos en encabezados y descripciones', () => {
  const resultado = analizar({ Datos: [['descripción', 'CANTidad'], ['reten rueda delantera', 8]] })
  assert.equal(resultado.resoluciones[0].estado, 'unica')
  assert.equal(resultado.resoluciones[0].articuloUnico.codigo, '00123')
})

test('conserva códigos de texto y ceros iniciales mostrados por el formato de Excel', () => {
  const hoja = XLSX.utils.aoa_to_sheet([['Código'], ['00123'], [123]])
  hoja.A3.z = '00000'
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Códigos')
  const buffer = XLSX.write(libro, { type: 'array', bookType: 'xlsx' })
  const resultado = analizarLibroExcelListado({
    buffer,
    nombreArchivo: 'Códigos.xlsx',
    articulos,
  })
  assert.deepEqual(
    resultado.resoluciones.map((fila) => fila.articuloUnico?.codigo),
    ['00123', '00123'],
  )
})

test('clasifica descripciones ambiguas, inexistentes y códigos duplicados en el maestro', () => {
  const maestroDuplicado = [
    ...articulos,
    { codigo: 'AB-100', nombre: 'BOMBA AGUA YAMAHA DUPLICADA' },
  ]
  const resultado = analizar(
    {
      Datos: [
        ['Descripción'],
        ['BOMBA YAMAHA'],
        ['ARTÍCULO IMPOSIBLE'],
        ['AB-100'],
      ],
    },
    maestroDuplicado,
  )
  assert.deepEqual(
    resultado.resoluciones.map((fila) => fila.estado),
    ['ambigua', 'noEncontrada', 'inconsistente'],
  )
})

test('dos códigos exactos diferentes en una fila producen ambigüedad', () => {
  const resultado = analizar({ Datos: [['Código', 'Detalle'], ['AB-100', 'FI-100']] })
  assert.equal(resultado.resoluciones[0].estado, 'ambigua')
  assert.deepEqual(
    resultado.resoluciones[0].candidatos.map((articulo) => articulo.codigo),
    ['AB-100', 'FI-100'],
  )
})

test('ignora cantidad, stock, ubicación, sububicación, precio y costo', () => {
  const resultado = analizar({
    Datos: [
      ['Código', 'Cantidad', 'Stock', 'Ubicación', 'Sububicación', 'Precio', 'Costo'],
      ['AB-100', 10, 99, 'Z9', 'Piso 4', 1500, 900],
    ],
  })
  assert.equal(resultado.totalFilasUtiles, 1)
  assert.equal(resultado.resoluciones[0].articuloUnico.stock, 3)
  assert.equal(resultado.resoluciones[0].articuloUnico.ubicacionAntigua, 'A1')
})

test('mantiene una resolución por fila repetida y una sola por repeticiones internas', () => {
  const resultado = analizar({
    Datos: [
      ['Código', 'Detalle'],
      ['AB-100', 'AB-100'],
      ['AB-100', ''],
      ['AB-100', ''],
    ],
  })
  assert.equal(resultado.resoluciones.length, 3)
  assert.ok(resultado.resoluciones.every((fila) => fila.articuloUnico?.codigo === 'AB-100'))
})

test('admite encabezados luego de una introducción y encabezados repetidos', () => {
  const resultado = analizar({
    Datos: [
      ['Listado de depósito'],
      ['cÓdIgO', 'sToCk'],
      ['AB-100', 2],
      ['SKU', 'PRECIO'],
      ['FI-100', 500],
    ],
  })
  assert.deepEqual(
    resultado.resoluciones.map((fila) => fila.estado),
    ['noEncontrada', 'unica', 'unica'],
  )
  assert.deepEqual(
    resultado.resoluciones.slice(1).map((fila) => fila.numeroFila),
    [3, 5],
  )
})

test('omite filas vacías y conserva el número real de la hoja', () => {
  const resultado = analizar({ Datos: [['Código'], [], [], ['AB-100']] })
  assert.equal(resultado.totalFilasUtiles, 1)
  assert.equal(resultado.resoluciones[0].numeroFila, 4)
})

test('una descripción única prevalece sobre otra genérica compatible', () => {
  const resultado = analizar({
    Datos: [['Descripción', 'Detalle'], ['BOMBA AGUA YAMAHA', 'BOMBA YAMAHA']],
  })
  assert.equal(resultado.resoluciones[0].estado, 'unica')
  assert.equal(resultado.resoluciones[0].articuloUnico.codigo, 'AB-100')
})

test('dos descripciones únicas diferentes producen ambigüedad', () => {
  const resultado = analizar({
    Datos: [['Descripción', 'Detalle'], ['BOMBA AGUA YAMAHA', 'FILTRO AIRE HONDA']],
  })
  assert.equal(resultado.resoluciones[0].estado, 'ambigua')
})

test('las entradas local y compartida entregan el mismo análisis', async () => {
  const buffer = crearLibro({ Datos: [['Código'], ['AB-100']] })
  const archivo = {
    name: 'Mismo.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    arrayBuffer: async () => buffer,
  }
  const local = await procesarArchivoExcelListado({ archivo, articulos })
  const compartido = procesarExcelCompartidoListado({
    base64: Buffer.from(buffer).toString('base64'),
    nombreArchivo: archivo.name,
    tipoArchivo: archivo.type,
    articulos,
  })
  assert.deepEqual(compartido, local)
})
