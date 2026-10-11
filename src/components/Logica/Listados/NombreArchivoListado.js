import { normalizarNombreUsuario } from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

function sanitizarParteNombreArchivo(valor) {
  return String(valor ?? '')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function crearNombreArchivoListado(listado, nombreUsuario, fechaGeneracion, extension) {
  const rellenarNumero = (valor) => String(valor).padStart(2, '0')
  const nombreListado = sanitizarParteNombreArchivo(listado?.nombrePersonalizado) || 'sin nombre'
  const usuario = sanitizarParteNombreArchivo(normalizarNombreUsuario(nombreUsuario))
  const fecha = `${fechaGeneracion.getFullYear()}-${rellenarNumero(fechaGeneracion.getMonth() + 1)}-${rellenarNumero(fechaGeneracion.getDate())}`
  const hora = `${rellenarNumero(fechaGeneracion.getHours())}-${rellenarNumero(fechaGeneracion.getMinutes())}`
  return `Listado ${nombreListado} ${usuario} ${fecha} ${hora}.${extension}`
}
