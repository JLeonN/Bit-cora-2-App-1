import { Capacitor, registerPlugin } from '@capacitor/core'

let instanciaAplicacionFirebase = null
let instanciaAppCheck = null
let promesaInicializacionAppCheck = null

const AppCheckNativo = registerPlugin('AppCheckNativo')

export function obtenerConfiguracionFirebase() {
  const configuracion = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  }
  const nombresFaltantes = Object.entries(configuracion)
    .filter(([, valor]) => !valor)
    .map(([nombre]) => nombre)
  if (nombresFaltantes.length) {
    throw new Error(`Faltan valores de configuración Firebase: ${nombresFaltantes.join(', ')}.`)
  }
  return configuracion
}

export async function obtenerAplicacionFirebase() {
  if (instanciaAplicacionFirebase) return instanciaAplicacionFirebase
  const { getApps, initializeApp } = await import('firebase/app')
  instanciaAplicacionFirebase = getApps()[0] || initializeApp(obtenerConfiguracionFirebase())
  return instanciaAplicacionFirebase
}

function esLocalhost() {
  return ['localhost', '127.0.0.1'].includes(globalThis.location?.hostname)
}

async function crearProveedorAppCheck() {
  const { CustomProvider, ReCaptchaEnterpriseProvider } = await import('firebase/app-check')
  if (Capacitor.getPlatform() === 'android') {
    return new CustomProvider({
      getToken: async () => {
        const resultado = await AppCheckNativo.obtenerToken({ forzarActualizacion: false })
        if (!resultado?.token || !Number.isFinite(resultado?.expireTimeMillis)) {
          throw new Error('El proveedor nativo devolvió un token App Check inválido.')
        }
        return {
          token: resultado.token,
          expireTimeMillis: resultado.expireTimeMillis,
        }
      },
    })
  }
  const claveSitio = process.env.FIREBASE_APP_CHECK_SITE_KEY || ''
  if (process.env.DEV && esLocalhost()) {
    globalThis.self.FIREBASE_APPCHECK_DEBUG_TOKEN = true
    return new ReCaptchaEnterpriseProvider(claveSitio || 'clave-debug-local')
  }
  if (!claveSitio) throw new Error('Falta configurar la clave pública de Firebase App Check.')
  return new ReCaptchaEnterpriseProvider(claveSitio)
}

export async function inicializarAppCheckFirebase() {
  if (instanciaAppCheck) return instanciaAppCheck
  if (promesaInicializacionAppCheck) return promesaInicializacionAppCheck
  promesaInicializacionAppCheck = (async () => {
    const [{ initializeAppCheck }, aplicacion, proveedor] = await Promise.all([
      import('firebase/app-check'),
      obtenerAplicacionFirebase(),
      crearProveedorAppCheck(),
    ])
    instanciaAppCheck = initializeAppCheck(aplicacion, {
      provider: proveedor,
      isTokenAutoRefreshEnabled: true,
    })
    return instanciaAppCheck
  })().catch((error) => {
    promesaInicializacionAppCheck = null
    throw error
  })
  return promesaInicializacionAppCheck
}

export async function obtenerAplicacionFirebaseProtegida() {
  const aplicacion = await obtenerAplicacionFirebase()
  await inicializarAppCheckFirebase()
  return aplicacion
}
