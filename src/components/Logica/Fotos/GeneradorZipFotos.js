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

    // Detectar si está en PC
    const esNavegadorPC = !window.Capacitor || window.Capacitor.getPlatform() === 'web'

    // Crear instancia de JSZip
    const zip = new JSZip()

    // Agregar cada foto al ZIP
    for (const foto of listaFotos) {
      try {
        let dataFoto

        if (esNavegadorPC) {
          // En PC: Las fotos ya están en base64 en memoria
          dataFoto = foto.rutaFoto // Ya es base64
        } else {
          // En móvil: Leer foto desde filesystem
          const archivoFoto = await Filesystem.readFile({
            path: foto.rutaFoto,
            directory: Directory.Cache,
          })
          dataFoto = archivoFoto.data
        }

        // Nombre del archivo: codigo.jpg
        const nombreArchivo = `${foto.codigo}.jpg`

        // Agregar al ZIP
        zip.file(nombreArchivo, dataFoto, { base64: true })

        console.log(`[GeneradorZip] Foto agregada al ZIP: ${nombreArchivo}`)
      } catch (error) {
        console.error(`[GeneradorZip] Error al agregar foto ${foto.codigo}:`, error)
      }
    }

    // Obtener nombre de usuario y fecha/hora actual
    const nombreUsuario = await obtenerNombreUsuario()
    const ahora = new Date()
    const fecha = ahora.toISOString().split('T')[0] // AAAA-MM-DD
    const hora = ahora.toTimeString().split(' ')[0].substring(0, 5).replace(':', '-') // HH-MM

    const nombreZip = `Fotos ${nombreUsuario} ${fecha} ${hora}.zip`

    if (esNavegadorPC) {
      // EN PC: Generar blob para descarga directa
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const urlBlob = URL.createObjectURL(zipBlob)

      console.log('[GeneradorZip] ZIP generado como blob para PC:', nombreZip)

      return {
        uri: urlBlob,
        nombre: nombreZip,
      }
    } else {
      // EN MÓVIL: Guardar en filesystem
      const zipBase64 = await zip.generateAsync({ type: 'base64' })

      const rutaZip = `${nombreZip}`
      await Filesystem.writeFile({
        path: rutaZip,
        data: zipBase64,
        directory: Directory.Cache,
      })

      const uriZip = await Filesystem.getUri({
        directory: Directory.Cache,
        path: rutaZip,
      })

      console.log('[GeneradorZip] ZIP generado en móvil:', nombreZip)

      return {
        uri: uriZip.uri,
        nombre: nombreZip,
      }
    }
  } catch (error) {
    console.error('[GeneradorZip] Error al generar ZIP:', error)
    throw error
  }
}
