import { Share } from '@capacitor/share'

export function prepararVentanaWhatsApp() {
  const ventanaWhatsApp = window.open('', '_blank')
  if (ventanaWhatsApp) {
    ventanaWhatsApp.opener = null
  }
  return ventanaWhatsApp
}

export function abrirWhatsAppConMensaje(mensaje, ventanaPreparada = null) {
  const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
  const ventanaWhatsApp = ventanaPreparada || window.open(urlWhatsApp, '_blank')

  if (!ventanaWhatsApp) {
    window.location.assign(urlWhatsApp)
    return
  }

  if (ventanaPreparada) {
    ventanaWhatsApp.location.assign(urlWhatsApp)
  }
  ventanaWhatsApp.opener = null
}

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
