import JSZip from 'jszip'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { obtenerNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

export async function generarZipFotos(listaFotos) {
  try {
    console.log('[GeneradorZip] Iniciando generación de ZIP...')
    console.log('[GeneradorZip] Total de fotos:', listaFotos.length)

    if (listaFotos.length === 0) {
      throw new Error('No hay fotos para comprimir')
    }

    // Crear instancia de JSZip
    const zip = new JSZip()

    // Agregar cada foto al ZIP
    for (const foto of listaFotos) {
      try {
        // Leer foto desde filesystem
        const archivoFoto = await Filesystem.readFile({
          path: foto.rutaFoto,
        })

        // Nombre del archivo: codigo.jpg
        const nombreArchivo = `${foto.codigo}.jpg`

        // Agregar al ZIP (convertir base64 a binary)
        zip.file(nombreArchivo, archivoFoto.data, { base64: true })

        console.log(`[GeneradorZip] Foto agregada al ZIP: ${nombreArchivo}`)
      } catch (error) {
        console.error(`[GeneradorZip] Error al agregar foto ${foto.codigo}:`, error)
      }
    }

    // Generar ZIP como base64
    const zipBase64 = await zip.generateAsync({ type: 'base64' })

    // Obtener nombre de usuario y fecha/hora actual
    const nombreUsuario = await obtenerNombreUsuario()
    const ahora = new Date()
    const fecha = ahora.toISOString().split('T')[0] // AAAA-MM-DD
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 5).replace(':', '-') // HH-MM

    const nombreZip = `Fotos ${nombreUsuario} ${fecha} ${hora}.zip`

    // Guardar ZIP en filesystem temporal
    const rutaZip = `${nombreZip}`
    await Filesystem.writeFile({
      path: rutaZip,
      data: zipBase64,
      directory: Directory.Cache,
    })

    // Obtener URI del archivo
    const uriZip = await Filesystem.getUri({
      directory: Directory.Cache,
      path: rutaZip,
    })

    console.log('[GeneradorZip] ZIP generado exitosamente:', nombreZip)

    return {
      uri: uriZip.uri,
      nombre: nombreZip,
    }
  } catch (error) {
    console.error('[GeneradorZip] Error al generar ZIP:', error)
    throw error
  }
}
