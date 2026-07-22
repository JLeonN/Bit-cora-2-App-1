import { Capacitor } from '@capacitor/core'

const COLECCION_UBICACIONES_COMPARTIDAS = 'ubicacionesCompartidas'
const MAXIMO_UBICACIONES_COMPARTIDAS = 200
const MAXIMO_CARACTERES_USUARIO = 80
const MAXIMO_CARACTERES_CODIGO = 80
const MAXIMO_CARACTERES_UBICACION = 80

let instanciaFirestore = null
let dependenciasFirebase = null

function normalizarTexto(valor, maximoCaracteres) {
  return String(valor || '')
    .trim()
    .toUpperCase()
    .slice(0, maximoCaracteres)
}

function confirmarNavegadorWeb() {
  if (Capacitor.getPlatform() !== 'web') {
    throw new Error('Compartir por enlace solo está disponible en la versión web.')
  }
}

function obtenerConfiguracionFirebase() {
  const configuracion = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
  }

  if (Object.values(configuracion).some((valor) => !valor)) {
    throw new Error('El enlace compartido todavía no está configurado en esta versión de la app.')
  }

  return configuracion
}

async function obtenerDependenciasFirebase() {
  if (dependenciasFirebase) return dependenciasFirebase

  const [moduloApp, moduloFirestore] = await Promise.all([
    import('firebase/app'),
    import('firebase/firestore'),
  ])
  dependenciasFirebase = { ...moduloApp, ...moduloFirestore }
  return dependenciasFirebase
}

async function obtenerFirestore() {
  confirmarNavegadorWeb()
  if (instanciaFirestore) return instanciaFirestore

  const { getApps, initializeApp, getFirestore } = await obtenerDependenciasFirebase()
  const configuracion = obtenerConfiguracionFirebase()
  const aplicacion = getApps().length > 0 ? getApps()[0] : initializeApp(configuracion)
  instanciaFirestore = getFirestore(aplicacion)
  return instanciaFirestore
}

function normalizarUbicaciones(ubicaciones) {
  if (!Array.isArray(ubicaciones) || ubicaciones.length === 0) {
    throw new Error('No hay ubicaciones para compartir.')
  }
  if (ubicaciones.length > MAXIMO_UBICACIONES_COMPARTIDAS) {
    throw new Error(`Podés compartir hasta ${MAXIMO_UBICACIONES_COMPARTIDAS} ubicaciones por enlace.`)
  }

  const codigos = new Set()
  const ubicacionesNormalizadas = ubicaciones.map((item, indice) => {
    const codigo = normalizarTexto(item?.codigo, MAXIMO_CARACTERES_CODIGO)
    const ubicacion = normalizarTexto(item?.ubicacion, MAXIMO_CARACTERES_UBICACION)
    if (!codigo || !ubicacion) {
      throw new Error(`La ubicación ${indice + 1} debe tener código y ubicación.`)
    }
    if (codigos.has(codigo)) {
      throw new Error(`El código ${codigo} está repetido y no se puede compartir.`)
    }
    codigos.add(codigo)
    return { codigo, ubicacion }
  })

  return ubicacionesNormalizadas
}

function convertirFecha(fecha) {
  if (fecha?.toDate) return fecha.toDate().toISOString()
  if (typeof fecha === 'string') return fecha
  return ''
}

function validarDocumentoCompartido(datos) {
  if (!datos || datos.version !== 1 || !Array.isArray(datos.ubicaciones)) {
    throw new Error('El enlace compartido no tiene un formato válido.')
  }
  if (
    !Number.isInteger(datos.cantidadUbicaciones) ||
    datos.cantidadUbicaciones < 1 ||
    datos.cantidadUbicaciones > MAXIMO_UBICACIONES_COMPARTIDAS ||
    datos.ubicaciones.length !== datos.cantidadUbicaciones
  ) {
    throw new Error('La cantidad de ubicaciones compartidas no es válida.')
  }

  return {
    usuario: String(datos.usuario || 'Sin usuario').trim().slice(0, MAXIMO_CARACTERES_USUARIO),
    cantidadUbicaciones: datos.cantidadUbicaciones,
    fechaCreacion: convertirFecha(datos.fechaCreacion),
    ubicaciones: normalizarUbicaciones(datos.ubicaciones),
  }
}

export async function publicarUbicacionesCompartidas(ubicaciones, nombreUsuario) {
  const ubicacionesNormalizadas = normalizarUbicaciones(ubicaciones)
  const firestore = await obtenerFirestore()
  const { addDoc, collection, serverTimestamp } = await obtenerDependenciasFirebase()
  const usuario = String(nombreUsuario || 'Sin usuario').trim().slice(0, MAXIMO_CARACTERES_USUARIO)
  const documento = await addDoc(collection(firestore, COLECCION_UBICACIONES_COMPARTIDAS), {
    version: 1,
    usuario: usuario || 'Sin usuario',
    cantidadUbicaciones: ubicacionesNormalizadas.length,
    fechaCreacion: serverTimestamp(),
    ubicaciones: ubicacionesNormalizadas,
  })

  return { id: documento.id, cantidadUbicaciones: ubicacionesNormalizadas.length }
}

export async function obtenerUbicacionesCompartidas(idDocumento) {
  const id = String(idDocumento || '').trim()
  if (!id) {
    throw new Error('El enlace no incluye el identificador de ubicaciones.')
  }

  const firestore = await obtenerFirestore()
  const { doc, getDoc } = await obtenerDependenciasFirebase()
  const documento = await getDoc(doc(firestore, COLECCION_UBICACIONES_COMPARTIDAS, id))
  if (!documento.exists()) {
    throw new Error('Este enlace no existe o ya no está disponible.')
  }

  return validarDocumentoCompartido(documento.data())
}

export { MAXIMO_UBICACIONES_COMPARTIDAS }
