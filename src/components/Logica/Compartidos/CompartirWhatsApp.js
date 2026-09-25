import { AppLauncher } from '@capacitor/app-launcher'

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

export async function abrirWhatsAppEnAndroid(mensaje) {
  const textoCodificado = encodeURIComponent(mensaje)
  try {
    const { value: whatsappDisponible } = await AppLauncher.canOpenUrl({ url: 'whatsapp://send' })
    if (whatsappDisponible) {
      const { completed: abierto } = await AppLauncher.openUrl({
        url: `whatsapp://send?text=${textoCodificado}`,
      })
      if (abierto) return
    }
  } catch (error) {
    console.warn('[CompartirWhatsApp] No se pudo abrir la app de WhatsApp:', error)
  }

  const { completed: enlaceAbierto } = await AppLauncher.openUrl({
    url: `https://wa.me/?text=${textoCodificado}`,
  })
  if (!enlaceAbierto) {
    throw new Error('No se pudo abrir WhatsApp ni su enlace web')
  }
}
