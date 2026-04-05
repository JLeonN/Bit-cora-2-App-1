const URL_VERSION_REMOTA = process.env.URL_VERSION_REMOTA || ''
const URL_PLAY_STORE_POR_DEFECTO =
  process.env.URL_PLAY_STORE || 'https://play.google.com/store/apps/details?id=bitacora.v2'
const VERSION_INSTALADA = process.env.VERSION_APP || '0.0.0'

const convertirSegmentoNumero = (segmento) => {
  const valor = Number.parseInt(`${segmento}`.replace(/\D/g, ''), 10)
  return Number.isFinite(valor) ? valor : 0
}

const normalizarVersion = (version) =>
  `${version || ''}`
    .trim()
    .split('.')
    .map(convertirSegmentoNumero)

const compararVersiones = (versionLocal, versionRemota) => {
  const local = normalizarVersion(versionLocal)
  const remota = normalizarVersion(versionRemota)
  const maximo = Math.max(local.length, remota.length)
  for (let indice = 0; indice < maximo; indice += 1) {
    const localValor = local[indice] || 0
    const remotaValor = remota[indice] || 0
    if (localValor < remotaValor) {
      return -1
    }
    if (localValor > remotaValor) {
      return 1
    }
  }
  return 0
}

const crearEstadoSinActualizacion = () => ({
  hayActualizacion: false,
  debeMostrarModal: false,
  versionInstalada: VERSION_INSTALADA,
  versionDisponible: '',
  urlPlayStore: URL_PLAY_STORE_POR_DEFECTO,
})

export const obtenerEstadoActualizacion = async () => {
  if (!URL_VERSION_REMOTA) {
    return crearEstadoSinActualizacion()
  }
  try {
    const controlador = new AbortController()
    const timeout = setTimeout(() => controlador.abort(), 8000)
    const respuesta = await fetch(URL_VERSION_REMOTA, {
      method: 'GET',
      cache: 'no-store',
      signal: controlador.signal,
    })
    clearTimeout(timeout)
    if (!respuesta.ok) {
      return crearEstadoSinActualizacion()
    }
    const versionRemota = await respuesta.json()
    const versionDisponible = `${versionRemota?.versionDisponible || ''}`.trim()
    const mostrarActualizacion = versionRemota?.mostrarActualizacion === true
    const urlPlayStore = `${versionRemota?.urlPlayStore || URL_PLAY_STORE_POR_DEFECTO}`.trim()
    if (!versionDisponible || !mostrarActualizacion) {
      return crearEstadoSinActualizacion()
    }
    const hayActualizacion = compararVersiones(VERSION_INSTALADA, versionDisponible) < 0
    return {
      hayActualizacion,
      debeMostrarModal: hayActualizacion,
      versionInstalada: VERSION_INSTALADA,
      versionDisponible,
      urlPlayStore,
    }
  } catch (error) {
    console.error('Error al consultar version remota:', error)
    return crearEstadoSinActualizacion()
  }
}

export const abrirActualizacionEnTienda = (urlPlayStore) => {
  const urlFinal = `${urlPlayStore || URL_PLAY_STORE_POR_DEFECTO}`.trim()
  const nuevaVentana = window.open(urlFinal, '_blank', 'noopener,noreferrer')
  if (!nuevaVentana) {
    window.location.href = urlFinal
  }
}
