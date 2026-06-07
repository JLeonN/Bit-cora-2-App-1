// ConfiguracionPublicidad.js
// Archivo canónico para definir cómo se comporta AdMob en prueba y producción.

// Control principal del modo de anuncios.
// true: fuerza modo de prueba visual y evita impresiones reales.
// false: usa IDs y comportamiento de producción.
export const esModoPruebaPublicidad = false // Cambiar a true solo cuando estés probando anuncios.

// ID oficial de pruebas de Google AdMob para banner.
export const BANNER_AD_UNIT_ID_PRUEBA = 'ca-app-pub-3940256099942544/6300978111'

// ID real de producción para banner de esta app.
export const BANNER_AD_UNIT_ID_PRODUCCION = 'ca-app-pub-7620083100302566/1645913333'

// Dispositivos marcados como prueba para requests de AdMob.
// Reemplaza 'YOUR_TEST_DEVICE_ID' por IDs reales cuando pruebes en hardware.
// En producción se ignoran porque solo se usan si esModoPruebaPublicidad es true.
export const DISPOSITIVOS_PRUEBA_ADMOB = ['YOUR_TEST_DEVICE_ID']

// Devuelve el ad unit id de banner que corresponde al modo activo.
// Se usa para centralizar la decisión y evitar duplicar lógica en componentes.
export const obtenerBannerAdUnitId = () =>
  esModoPruebaPublicidad ? BANNER_AD_UNIT_ID_PRUEBA : BANNER_AD_UNIT_ID_PRODUCCION
