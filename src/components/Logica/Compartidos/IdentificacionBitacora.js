import {
  NOMBRE_USUARIO_PREDETERMINADO,
  normalizarNombreUsuario,
} from '../../BaseDeDatos/usoAlmacenamientoConfiguracion.js'

export function crearFirmaBitacora(nombreUsuario) {
  const nombre = normalizarNombreUsuario(nombreUsuario)
  return nombre === NOMBRE_USUARIO_PREDETERMINADO
    ? NOMBRE_USUARIO_PREDETERMINADO
    : `${NOMBRE_USUARIO_PREDETERMINADO} · ${nombre}`
}

export function crearNombreHojaBitacora(nombre = '') {
  const nombreLimpio = String(nombre ?? '').replace(/[\\/?*[\]:]/g, '').trim()
  const nombreHoja =
    nombreLimpio &&
    nombreLimpio.toLocaleLowerCase('es') !== NOMBRE_USUARIO_PREDETERMINADO.toLocaleLowerCase('es')
      ? `${NOMBRE_USUARIO_PREDETERMINADO} - ${nombreLimpio}`
      : NOMBRE_USUARIO_PREDETERMINADO
  return nombreHoja.slice(0, 31).trim()
}
