import { Share } from '@capacitor/share'

export async function compartirArchivo(rutaArchivo, nombreArchivo) {
  try {
    if (!rutaArchivo) {
      throw new Error('No se recibió una ruta de archivo para compartir.')
    }

    await Share.share({
      title: 'Archivo Excel',
      text: `Archivo Execel de ${nombreArchivo}`,
      url: rutaArchivo,
      dialogTitle: 'Selecciona la app para compartir',
    })
  } catch (error) {
    console.error('Error al intentar compartir el archivo:', error)
    throw error
  }
}
