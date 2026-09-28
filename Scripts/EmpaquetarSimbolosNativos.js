import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const directorioRaiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const directorioSalida = path.join(directorioRaiz, 'android', 'app', 'build', 'outputs', 'bundle', 'release')
const directorioBibliotecas = path.join(
  directorioRaiz,
  'android',
  'app',
  'build',
  'intermediates',
  'merged_native_libs',
  'release',
  'mergeReleaseNativeLibs',
  'out',
  'lib',
)

const paquete = JSON.parse(await fs.readFile(path.join(directorioRaiz, 'package.json'), 'utf8'))
const version = paquete.version
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error('La versión del paquete no tiene un formato válido')
}

const rutaPaqueteGenerado = path.join(directorioSalida, 'app-release.aab')
const rutaPaqueteVersionado = path.join(directorioSalida, `Bitacora2V${version}.aab`)
const rutaSimbolos = path.join(directorioSalida, `SimbolosNativosV${version}.zip`)
const paqueteGenerado = await fs.stat(rutaPaqueteGenerado)
if (paqueteGenerado.size === 0) throw new Error('El paquete Android generado está vacío')

const archivoZip = new JSZip()
const archivosIncluidos = []
for (const arquitectura of await fs.readdir(directorioBibliotecas, { withFileTypes: true })) {
  if (!arquitectura.isDirectory()) continue
  const directorioArquitectura = path.join(directorioBibliotecas, arquitectura.name)
  for (const biblioteca of await fs.readdir(directorioArquitectura, { withFileTypes: true })) {
    if (!biblioteca.isFile() || !biblioteca.name.endsWith('.so')) continue
    const nombreEnZip = `lib/${arquitectura.name}/${biblioteca.name}`
    const contenido = await fs.readFile(path.join(directorioArquitectura, biblioteca.name))
    archivoZip.file(nombreEnZip, contenido)
    archivosIncluidos.push(nombreEnZip)
  }
}
if (archivosIncluidos.length === 0) {
  throw new Error('No se encontraron bibliotecas nativas para empaquetar')
}

const contenidoZip = await archivoZip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
const zipVerificado = await JSZip.loadAsync(contenidoZip, { checkCRC32: true })
const nombresVerificados = Object.keys(zipVerificado.files).filter(
  (nombre) => !zipVerificado.files[nombre].dir,
)
if (nombresVerificados.length !== archivosIncluidos.length) {
  throw new Error('El ZIP de símbolos no contiene todas las bibliotecas nativas')
}

await fs.copyFile(rutaPaqueteGenerado, rutaPaqueteVersionado)
await fs.writeFile(rutaSimbolos, contenidoZip)
console.log(`AAB: ${rutaPaqueteVersionado}`)
console.log(`Símbolos validados (${archivosIncluidos.length} bibliotecas): ${rutaSimbolos}`)
