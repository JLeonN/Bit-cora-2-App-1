import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rutaArchivoActual = fileURLToPath(import.meta.url)
const directorioActual = path.dirname(rutaArchivoActual)
const rutaRaiz = path.resolve(directorioActual, '..')
const rutaPackageJson = path.join(rutaRaiz, 'package.json')
const rutaVersionJson = path.join(rutaRaiz, 'public', 'version.json')

const paquete = JSON.parse(fs.readFileSync(rutaPackageJson, 'utf8'))
let versionActualizacion = {
  versionDisponible: paquete.version,
  urlPlayStore: 'https://play.google.com/store/apps/details?id=bitacora.v2',
  mostrarActualizacion: true,
}

if (fs.existsSync(rutaVersionJson)) {
  try {
    const versionExistente = JSON.parse(fs.readFileSync(rutaVersionJson, 'utf8'))
    versionActualizacion = {
      versionDisponible: paquete.version,
      urlPlayStore:
        versionExistente.urlPlayStore ||
        'https://play.google.com/store/apps/details?id=bitacora.v2',
      mostrarActualizacion: versionExistente.mostrarActualizacion ?? true,
    }
  } catch (error) {
    console.warn('No se pudo leer public/version.json existente, se regenerara desde cero.')
  }
}

fs.writeFileSync(rutaVersionJson, `${JSON.stringify(versionActualizacion, null, 2)}\n`, 'utf8')
console.log(`version.json actualizado a ${versionActualizacion.versionDisponible}`)
