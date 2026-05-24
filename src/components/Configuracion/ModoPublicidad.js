// ModoPublicidad.js
// Fuente única para controlar la publicidad y el modo de prueba visual.

export const esModoPruebaPublicidad = true // Cambiar a true solo cuando estés probando anuncios.

export const BANNER_AD_UNIT_ID_PRUEBA = 'ca-app-pub-3940256099942544/6300978111'
export const BANNER_AD_UNIT_ID_PRODUCCION = 'ca-app-pub-7620083100302566/1645913333'

export const DISPOSITIVOS_PRUEBA_ADMOB = ['YOUR_TEST_DEVICE_ID']

export const obtenerBannerAdUnitId = () =>
  esModoPruebaPublicidad ? BANNER_AD_UNIT_ID_PRUEBA : BANNER_AD_UNIT_ID_PRODUCCION
