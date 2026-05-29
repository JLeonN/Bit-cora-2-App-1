import { Share } from '@capacitor/share'

export async function compartirArchivo(rutaArchivo, nombreArchivo, metadatos = {}) {
  try {
    if (!rutaArchivo) {
      throw new Error('No se recibió una ruta de archivo para compartir.')
    }

    const titulo = metadatos.titulo || 'Archivo'
    const texto = metadatos.texto || `Archivo de ${nombreArchivo}`
    const tituloDialogo = metadatos.tituloDialogo || 'Selecciona la app para compartir'

    await Share.share({
      title: titulo,
      text: texto,
      url: rutaArchivo,
      dialogTitle: tituloDialogo,
    })

    return true
  } catch (error) {
    console.error('Error al intentar compartir el archivo:', error)
    throw error
  }
}
