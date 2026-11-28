import test from 'node:test'
import assert from 'node:assert/strict'
import * as XLSX from 'xlsx'

const datos = new Map()
let claveConError = ''
globalThis.window = { localStorage: {
  getItem: (clave) => datos.get(clave) ?? null,
  setItem: (clave, valor) => {
    if (clave.includes(claveConError) && claveConError) throw new Error('Error simulado de almacenamiento')
    datos.set(clave, valor)
  },
  removeItem: (clave) => datos.delete(clave),
} }

const lector = await import('../../src/components/BaseDeDatos/LectorExcel.js')
const almacenamiento = await import('../../src/components/BaseDeDatos/usoAlmacenamientoUbicaciones.js')
const historial = await import('../../src/components/BaseDeDatos/UsoHistorialUbicaciones.js')
const registro = await import('../../src/components/Logica/Ubicaciones/ServicioRegistroUbicacion.js')
const consulta = await import('../../src/components/Logica/Ubicaciones/ServicioUbicacionVigente.js')
const integracion = await import('../../src/components/Logica/Listados/ServicioIntegracionListados.js')
const datosLocales = await import('../../src/components/Logica/Compartidos/ServicioDatosLocalesArticulo.js')

function crearExcel(ubicacion) {
  const hoja = XLSX.utils.aoa_to_sheet([
    ['CODIGO', 'NOMBRE', 'UBICACION', 'STOCK'],
    ['100', 'ARTICULO UNO', ubicacion, 2],
    ['200', 'ARTICULO DOS', '3-B70', 3],
  ])
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Articulos')
  return XLSX.write(libro, { type: 'base64', bookType: 'xlsx' })
}

async function cargarExcel(ubicacion) {
  return lector.cargarArticulosDesdeExcelCompartido({ nombre: 'Prueba.xlsx', base64: crearExcel(ubicacion) })
}

async function consultar(ubicacion) {
  const informacion = lector.obtenerInformacionArchivo()
  return consulta.buscarArticulosPorUbicacion({
    articulos: lector.obtenerArticulosBaseOriginal(),
    cambios: (await historial.obtenerCambiosUbicacion()).slice(informacion.indiceCambiosExcel),
    fechaCargaExcel: informacion.fechaCargaExcel,
    usarOrdenRegistro: Number.isInteger(informacion.indiceCambiosExcel),
    ubicacionesLegadas: await almacenamiento.obtenerUbicaciones(),
    ubicacion,
  })
}

test('integra Excel, consulta, lista, historial y carga posterior', async () => {
  assert.equal((await cargarExcel('3-B7')).exito, true)
  const fechaPrimeraCarga = lector.obtenerInformacionArchivo().fechaCargaExcel
  assert.deepEqual((await consultar('3-B7')).map((item) => item.codigo), ['100'])
  assert.deepEqual((await consultar('3-B70')).map((item) => item.codigo), ['200'])
  assert.equal((await registro.registrarUbicacionArticulo('100', 'A1')).exito, true)
  assert.equal(lector.obtenerInformacionArchivo().fechaCargaExcel, fechaPrimeraCarga)
  assert.deepEqual((await consultar('3-B7')), [])
  assert.deepEqual((await consultar('A1')).map((item) => item.codigo), ['100'])
  assert.equal(await almacenamiento.guardarUbicaciones([], { registrarCambios: false }), true)
  assert.deepEqual((await consultar('A1')).map((item) => item.codigo), ['100'])
  assert.equal((await cargarExcel('C1')).exito, true)
  assert.deepEqual((await consultar('A1')), [])
  assert.deepEqual((await consultar('C1')).map((item) => item.codigo), ['100'])
  await integracion.enviarTodosAUbicaciones({ articulos: [{ codigo: '100', ubicacionListado: 'D1' }] })
  assert.deepEqual((await consultar('D1')).map((item) => item.codigo), ['100'])
  const actuales = await almacenamiento.obtenerUbicaciones()
  const articulo = lector.obtenerArticuloPorCodigo('100')
  assert.equal(registro.obtenerUltimaUbicacionRegistrada('100', actuales, articulo), 'D1')
  const locales = await datosLocales.cargarDatosLocalesArticulos()
  assert.equal(datosLocales.resolverDatosArticulo(articulo, locales).ubicacionListado, 'D1')
})

test('no sustituye una base existente cuando falla la importación o el guardado', async () => {
  const informacionAnterior = lector.obtenerInformacionArchivo()
  const resultadoInvalido = await lector.cargarArticulosDesdeExcelCompartido({ nombre: 'Malo.xlsx', base64: 'abc' })
  assert.equal(resultadoInvalido.exito, false)
  assert.deepEqual(lector.obtenerInformacionArchivo(), informacionAnterior)
  claveConError = 'base_datos_excel_persistente'
  const resultadoError = await cargarExcel('Z1')
  claveConError = ''
  assert.equal(resultadoError.exito, false)
  assert.deepEqual(lector.obtenerInformacionArchivo(), informacionAnterior)
  assert.deepEqual((await consultar('D1')).map((item) => item.codigo), ['100'])
})

test('revierte la lista si falla el registro de fechas', async () => {
  const antes = await almacenamiento.obtenerUbicaciones()
  claveConError = 'historial_ubicaciones_fechado_v1'
  assert.equal(await almacenamiento.guardarUbicaciones([{ codigo: '100', ubicacion: 'Z1' }]), false)
  claveConError = ''
  assert.deepEqual(await almacenamiento.obtenerUbicaciones(), antes)
  assert.deepEqual((await consultar('D1')).map((item) => item.codigo), ['100'])
})

test('un valor que quedó en la lista puede registrarse de nuevo después de cargar otro Excel', async () => {
  assert.equal((await cargarExcel('E1')).exito, true)
  assert.deepEqual((await consultar('D1')), [])
  assert.equal((await registro.registrarUbicacionArticulo('100', 'D1')).exito, true)
  assert.deepEqual((await consultar('D1')).map((item) => item.codigo), ['100'])
})

test('conserva el orden de operaciones aunque cambie el reloj del dispositivo', async () => {
  const relojReal = Date.now
  try {
    Date.now = () => 200000
    assert.equal((await cargarExcel('F1')).exito, true)
    Date.now = () => 100000
    assert.equal((await registro.registrarUbicacionArticulo('100', 'G1')).exito, true)
    assert.deepEqual((await consultar('G1')).map((item) => item.codigo), ['100'])
  } finally {
    Date.now = relojReal
  }
})

test('restaura la fecha y los artículos al reiniciar la base', async () => {
  const informacion = lector.obtenerInformacionArchivo()
  const lectorReiniciado = await import('../../src/components/BaseDeDatos/LectorExcel.js?reiniciado')
  await lectorReiniciado.inicializarBaseDatos()
  assert.equal(lectorReiniciado.obtenerInformacionArchivo().fechaCargaExcel, informacion.fechaCargaExcel)
  assert.equal(lectorReiniciado.obtenerArticuloPorCodigo('100').codigo, '100')
})

test('revierte lista e historial si falla la actualización de la base', async () => {
  const listaAnterior = await almacenamiento.obtenerUbicaciones()
  const cambiosAnteriores = await historial.obtenerCambiosUbicacion()
  claveConError = 'base_datos_excel_persistente'
  const resultado = await registro.registrarUbicacionArticulo('100', 'H1')
  claveConError = ''
  assert.equal(resultado.exito, false)
  assert.deepEqual(await almacenamiento.obtenerUbicaciones(), listaAnterior)
  assert.deepEqual(await historial.obtenerCambiosUbicacion(), cambiosAnteriores)
  assert.deepEqual((await consultar('G1')).map((item) => item.codigo), ['100'])
})
