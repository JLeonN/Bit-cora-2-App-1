import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { registrarResultadoCapturaRestaurada } from 'src/components/Logica/Compartidos/ServicioRecuperacionCapturaImagen.js'

export default async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return
  await App.addListener('appRestoredResult', async (resultado) => {
    try {
      await registrarResultadoCapturaRestaurada(resultado)
    } catch (error) {
      console.warn('[RecuperacionCapturaImagen] No se pudo conservar la captura restaurada.', error)
    }
  })
}
