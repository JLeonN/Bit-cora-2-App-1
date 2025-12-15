import { Share } from '@capacitor/share'

export async function compartirArchivo(rutaArchivo, nombreArchivo, tipo = 'archivo') {
  try {
    if (!rutaArchivo) {
      throw new Error('No se recibió una ruta de archivo para compartir.')
    }

    const titulo = tipo === 'zip' ? 'Fotos Comprimidas' : 'Archivo'
    const texto =
      tipo === 'zip' ? `Fotos de productos - ${nombreArchivo}` : `Archivo: ${nombreArchivo}`

    await Share.share({
      title: titulo,
      text: texto,
      url: rutaArchivo,
      dialogTitle: 'Selecciona la app para compartir',
    })

    console.log('[CompartirArchivo] Archivo compartido exitosamente')
  } catch (error) {
    console.error('[CompartirArchivo] Error al intentar compartir:', error)
    throw error
  }
}
